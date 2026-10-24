import {color, dur, ease, font, tokens, toneText, type, type Tone} from '../theme';
import {progressAt, useSceneTime, type At} from '../motion/cues';

const ROW = 84;
const TITLE = 96;
const BOX = 44;
const TEXT = 40;

/** Screen box of row `i` (for a marker), given the checklist's x, y, w and whether it has a title. */
export const checklistRowBox = ({x, y, w, title}: {x: number; y: number; w: number; title?: string}, i: number) => ({
  x,
  y: y + (title ? TITLE : 0) + i * ROW,
  w,
  h: ROW - 24,
});

export type ChecklistRow = {text: string; at: At; done?: At; tone?: Tone};

/**
 * Rows that appear on cue and tick on cue. A row with a `tone` reads in that color until it is ticked
 * (e.g. a coral risk that turns mint once handled); `dimAt` fades the list back.
 */
export const Checklist = ({
  x,
  y,
  w,
  title,
  titleAt = 0,
  rows,
  dimAt,
}: {
  x: number;
  y: number;
  w: number;
  title?: string;
  titleAt?: At;
  rows: ChecklistRow[];
  dimAt?: At;
}) => {
  const {now, at} = useSceneTime();
  const dim = dimAt === undefined ? 0 : progressAt(now - at(dimAt), dur.emphasis, ease.standard);
  const t = progressAt(now - at(titleAt));
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, opacity: 1 - 0.6 * dim, fontFamily: font.ui}}>
      {title ? (
        <div style={{height: TITLE, opacity: t, fontWeight: 700, fontSize: type.nodeLabel, fontFamily: font.display, color: color.chalk}}>{title}</div>
      ) : null}
      {rows.map((r) => {
        const p = progressAt(now - at(r.at));
        const tick = r.done === undefined ? 0 : progressAt(now - at(r.done), dur.drawMin, ease.standard);
        const ticked = tick > 0;
        const textColor = r.tone && !ticked ? toneText[r.tone] : color.chalk;
        const tickColor = r.tone && r.tone !== 'mint' ? color.mint : toneText[r.tone ?? 'mint'];
        return (
          <div
            key={r.text}
            style={{
              height: ROW,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 24,
              opacity: p,
              transform: `translateY(${(1 - p) * tokens.motion.enterRisePx}px)`,
            }}
          >
            <svg width={BOX} height={BOX} style={{flex: 'none', marginTop: 2}}>
              <rect x={2} y={2} width={BOX - 4} height={BOX - 4} rx={8} fill="none" stroke={ticked ? tickColor : color.graphite} strokeWidth={3} />
              {ticked ? (
                <path
                  d="M 11 23 L 19 31 L 34 13"
                  fill="none"
                  stroke={tickColor}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - tick}
                />
              ) : null}
            </svg>
            <div style={{fontWeight: 600, fontSize: TEXT, lineHeight: 1.15, color: textColor}}>{r.text}</div>
          </div>
        );
      })}
    </div>
  );
};
