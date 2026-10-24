import {color, dur, ease, font, tone as toneColor, type, type Tone} from '../theme';
import {progressAt, useSceneTime, type At} from '../motion/cues';

const LABEL_W = 300;
const CHIP_W = 300;
const ROW_H = 130;
const BAR_H = 44;

export type TtlRow = {
  at: At;
  label: string;
  /** `entry`: one entry living out its TTL. `refills`: a run of short or long entries with a miss between each. */
  kind: 'entry' | 'refills';
  /** entry: the bar's text over time (e.g. TTL, then 5 min). */
  text?: {at: At; text: string}[];
  /** entry: when its time runs out (the bar empties in 1 s, an "expired" tick marks it, then it refills). */
  expireAt?: At;
  /** entry: share of the time axis the bar covers (default 1). */
  length?: number;
  /** refills: how many entries fit the axis (many = short TTL). */
  segments?: number;
  chip?: {text: string; tone: Tone};
  /** entry: the note under the tick when it expires (default "expired"; '' for none). */
  expiredNote?: string;
  until?: At;
};

/** Screen box of row `i` (for a marker). */
export const ttlRowBox = ({x, y, w}: {x: number; y: number; w: number}, i: number) => ({x, y: y + i * ROW_H, w, h: BAR_H + 20});

/**
 * Time-to-live on a time axis: an entry bar that empties and refills on cue, and rows comparing short and
 * long TTLs (many coral misses vs few). Labels on the left, a verdict chip on the right.
 */
export const TtlTimeline = ({
  x,
  y,
  w,
  rows,
  axisLabel = 'time →',
  rowH = ROW_H,
  labelW = LABEL_W,
  chipW = CHIP_W,
}: {
  x: number;
  y: number;
  w: number;
  rows: TtlRow[];
  axisLabel?: string;
  /** Row pitch; 130 leaves room for the "expired" note, ~80 for compact comparisons. */
  rowH?: number;
  labelW?: number;
  chipW?: number;
}) => {
  const {now, at} = useSceneTime();
  const axisX = labelW;
  const axisW = w - labelW - chipW;
  const visible = rows.filter((r) => now >= at(r.at) && (r.until === undefined || now < at(r.until) + dur.exit));
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, fontFamily: font.ui}}>
      {rows.map((r, i) => {
        const p = progressAt(now - at(r.at));
        const out = r.until === undefined ? 0 : progressAt(now - at(r.until), dur.exit, ease.exit);
        if (p <= 0 || out >= 1) return null;
        const top = i * rowH;
        const label = (r.text ?? []).filter((s) => at(s.at) <= now).at(-1)?.text ?? '';
        let bars: {x: number; w: number; tone: string}[] = [];
        let ticks: {x: number; text?: string}[] = [];
        if (r.kind === 'entry') {
          const full = axisW * (r.length ?? 1);
          const expire = r.expireAt === undefined ? 0 : progressAt(now - at(r.expireAt), 1, ease.standard);
          const refill = r.expireAt === undefined ? 0 : progressAt(now - at(r.expireAt) - 1.4, dur.drawMax, ease.standard);
          bars = [{x: 0, w: full * progressAt(now - at(r.at), dur.drawMax, ease.standard) * (1 - expire), tone: toneColor.cobalt}];
          if (expire >= 1) {
            ticks = [{x: 0, text: r.expiredNote ?? 'expired'}];
            bars.push({x: 0, w: full * refill, tone: toneColor.mint});
          }
        } else {
          const n = r.segments ?? 4;
          const seg = axisW / n;
          bars = Array.from({length: n}, (_, k) => ({
            x: k * seg + 6,
            w: (seg - 12) * progressAt(now - at(r.at) - k * dur.stagger * 2, dur.enter, ease.standard),
            tone: toneColor.cobalt,
          }));
          ticks = Array.from({length: n - 1}, (_, k) => ({x: (k + 1) * seg}));
        }
        return (
          <div key={r.label} style={{position: 'absolute', left: 0, top, width: w, height: rowH, opacity: p * (1 - out)}}>
            <div style={{position: 'absolute', left: 0, top: 0, fontWeight: 600, fontSize: type.nodeLabel - 4, color: color.chalk}}>{r.label}</div>
            {bars.map((b, k) => (
              <div
                key={k}
                style={{position: 'absolute', left: axisX + b.x, top: 0, width: b.w, height: BAR_H, borderRadius: 10, background: b.tone, overflow: 'hidden'}}
              >
                {k === 0 && label ? (
                  <div style={{padding: '2px 14px', fontWeight: 700, fontSize: type.chip, color: color.onSignal, whiteSpace: 'nowrap'}}>{label}</div>
                ) : null}
              </div>
            ))}
            {ticks.map((t, k) => (
              <div key={`t${k}`} style={{position: 'absolute', left: axisX + t.x - 2, top: -8, width: 4, height: BAR_H + 16, background: r.kind === 'refills' ? toneColor.coral : color.graphite}}>
                {t.text ? (
                  <div style={{position: 'absolute', left: 12, top: BAR_H + 20, fontWeight: 500, fontSize: type.chip, color: color.pencil, whiteSpace: 'nowrap'}}>{t.text}</div>
                ) : null}
              </div>
            ))}
            {r.chip ? (
              <div
                style={{
                  position: 'absolute',
                  left: w - chipW + 24,
                  top: -6,
                  padding: '6px 18px',
                  borderRadius: 999,
                  background: toneColor[r.chip.tone],
                  color: color.onSignal,
                  fontWeight: 700,
                  fontSize: type.chip,
                  whiteSpace: 'nowrap',
                }}
              >
                {r.chip.text}
              </div>
            ) : null}
          </div>
        );
      })}
      {visible.length ? (
        <div style={{position: 'absolute', left: axisX + axisW - 200, top: rows.length * rowH - 50, fontWeight: 500, fontSize: type.chip, color: color.pencil}}>
          {axisLabel}
        </div>
      ) : null}
    </div>
  );
};
