import {measureText} from '@remotion/layout-utils';
import {alpha, color, dur, ease, font, tokens, tone as toneColor, type, type Tone} from '../theme';
import {useFontsReady} from '../fonts';
import {progressAt, useSceneTime, type At} from '../motion/cues';
import type {Point} from '../diagram/geometry';

const LINE = type.code * type.codeLineHeight;
const PAD_X = 24;
const PAD_Y = 16;
const TITLE = 48;
const GUTTER = 64;

export type CodeCardLine = {
  text: string;
  /** Types on from here. */
  at: At;
  /** Slides in and pushes the lines below it down; any other line keeps its row from the start. */
  insert?: boolean;
  highlight?: {at: At; until?: At; tone?: Tone};
  /** A step number in the gutter. */
  badge?: {text: string; at: At};
  dim?: {at: At; until?: At};
  /** Columns [from, to) lift out on `at`, glide to `to` (screen px, the span's top-left) and stay there; the gap
   * fills in again on `until`. */
  lift?: {cols: [number, number]; at: At; to: Point; until?: At};
};

export type CodeCardProps = {x: number; y: number; w: number; title?: string; lines: CodeCardLine[]; dashed?: boolean};

/** The characters of `text` typed `since` seconds after it starts (a whole line types in `dur.drawMax`). */
export const typedText = (text: string, since: number) =>
  text.slice(0, Math.ceil(text.length * Math.min(1, Math.max(0, since / dur.drawMax))));

/** Each line's top inside the code area: rows are fixed, except `insert` lines, which open their row as they enter. */
export const codeRowTops = (lines: {insert?: boolean}[], opened: (i: number) => number) => {
  let top = 0;
  return lines.map((l, i) => {
    const t = top;
    top += (l.insert ? opened(i) : 1) * LINE;
    return t;
  });
};

/** JetBrains Mono's advance at the code size (fonts must be loaded). */
export const codeCharWidth = () => measureText({text: 'M'.repeat(20), fontFamily: font.code, fontSize: type.code, fontWeight: tokens.font.code.weight}).width / 20;

/** Screen point of column `col` on row `row` of a card (rows as laid out before any `insert` line opens). */
export const codeCardPoint = ({x, y, title, lines}: CodeCardProps, row: number, col: number) => ({
  x: x + PAD_X + (lines.some((l) => l.badge) ? GUTTER : 0) + col * codeCharWidth(),
  y: y + PAD_Y + (title ? TITLE : 0) + row * LINE,
});

/**
 * Code on a card, line by line: each line types on its cue, can light up (highlight), carry a step badge,
 * dim, or lift a span out and glide it into another box. JetBrains Mono at the code size; a `dashed`
 * card is an empty-looking group box (e.g. "cache layer") that receives code.
 */
export const CodeCard = ({x, y, w, title, lines, dashed = false, at = 0, until, labels = []}: CodeCardProps & {at?: At; until?: At; labels?: {at: At; text: string}[]}) => {
  const ready = useFontsReady();
  const {now, at: resolve} = useSceneTime();
  if (!ready) return null;
  const p = progressAt(now - resolve(at));
  const out = until === undefined ? 0 : progressAt(now - resolve(until), dur.exit, ease.exit);
  if (p <= 0 || out >= 1) return null;
  const charW = codeCharWidth();
  const gutter = lines.some((l) => l.badge) ? GUTTER : 0;
  const opened = (i: number) => progressAt(now - resolve(lines[i].at), dur.enter, ease.standard);
  const tops = codeRowTops(lines, opened);
  const height = 2 * PAD_Y + (title ? TITLE : 0) + codeRowTops([...lines, {}], opened)[lines.length];
  const label = labels.filter((l) => resolve(l.at) <= now).at(-1);
  const textX = PAD_X + gutter;
  const codeY = PAD_Y + (title ? TITLE : 0);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, opacity: p * (1 - out)}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          height,
          boxSizing: 'border-box',
          borderRadius: 16,
          background: dashed ? 'transparent' : color.raised,
          border: `2px ${dashed ? 'dashed' : 'solid'} ${color.graphite}`,
        }}
      />
      {title ? (
        <div style={{position: 'absolute', left: PAD_X, top: PAD_Y - 4, fontFamily: font.ui, fontWeight: 500, fontSize: type.chip, color: color.pencil}}>{title}</div>
      ) : null}
      {lines.map((l, i) => {
        const start = resolve(l.at);
        if (now < start) return null;
        const typed = typedText(l.text, now - start);
        const lit = l.highlight && now >= resolve(l.highlight.at) && (l.highlight.until === undefined || now < resolve(l.highlight.until));
        const dim = l.dim ? progressAt(now - resolve(l.dim.at), dur.emphasis) * (l.dim.until === undefined ? 1 : 1 - progressAt(now - resolve(l.dim.until), dur.emphasis)) : 0;
        const [from, to] = l.lift?.cols ?? [typed.length, typed.length];
        const gone = l.lift && now >= resolve(l.lift.at) ? 1 - (l.lift.until === undefined ? 0 : progressAt(now - resolve(l.lift.until))) : 0;
        const top = codeY + tops[i];
        return (
          <div key={i} style={{position: 'absolute', left: 0, top, width: w, height: LINE, opacity: (l.insert ? opened(i) : 1) * (1 - 0.6 * dim)}}>
            {l.badge && now >= resolve(l.badge.at) ? (
              <div
                style={{
                  position: 'absolute',
                  left: PAD_X,
                  top: (LINE - 48) / 2,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: toneColor.cobalt,
                  color: color.onSignal,
                  fontFamily: font.ui,
                  fontWeight: 700,
                  fontSize: type.chip,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: progressAt(now - resolve(l.badge.at)),
                }}
              >
                {l.badge.text}
              </div>
            ) : null}
            {lit ? (
              <div
                style={{
                  position: 'absolute',
                  left: textX - 10,
                  top: 4,
                  width: l.text.length * charW + 20,
                  height: LINE - 8,
                  borderRadius: 8,
                  background: alpha(toneColor[l.highlight!.tone ?? 'cobalt'], 0.3),
                }}
              />
            ) : null}
            <div style={{position: 'absolute', left: textX, top: 0, lineHeight: `${LINE}px`, fontFamily: font.code, fontWeight: tokens.font.code.weight, fontSize: type.code, color: color.chalk, whiteSpace: 'pre'}}>
              {typed.slice(0, from)}
              <span style={{opacity: 1 - gone}}>{typed.slice(from, to)}</span>
              {typed.slice(to)}
            </div>
          </div>
        );
      })}
      {lines.map((l, i) => {
        if (!l.lift || now < resolve(l.lift.at)) return null;
        // The lifted span glides from its place in this card to its target, and stays there.
        const g = progressAt(now - resolve(l.lift.at), dur.morph, ease.standard);
        const src = {x: textX + l.lift.cols[0] * charW, y: codeY + tops[i]};
        const dst = {x: l.lift.to.x - x, y: l.lift.to.y - y};
        return (
          <div
            key={`lift${i}`}
            style={{
              position: 'absolute',
              left: src.x + (dst.x - src.x) * g,
              top: src.y + (dst.y - src.y) * g,
              lineHeight: `${LINE}px`,
              fontFamily: font.code,
              fontWeight: tokens.font.code.weight,
              fontSize: type.code,
              color: color.chalk,
              whiteSpace: 'pre',
            }}
          >
            {l.text.slice(...l.lift.cols)}
          </div>
        );
      })}
      {label ? (
        <div style={{position: 'absolute', left: 0, top: height + 12, fontFamily: font.ui, fontWeight: 500, fontSize: type.chip, color: color.pencil, opacity: progressAt(now - resolve(label.at))}}>
          {label.text}
        </div>
      ) : null}
    </div>
  );
};
