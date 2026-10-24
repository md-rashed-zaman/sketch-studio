import {color, dur, ease, font, tone as toneColor, toneText, type, type Tone} from '../theme';
import {progressAt, useSceneTime, type At} from '../motion/cues';

export type LatencyRow = {label: string; seconds: number; value: string; tone: Tone; at: At};

const LABEL_W = 300;
const VALUE_W = 340;
const ROW_H = 110;
const BAR_H = 34;
// Log scale from 10 ns to 100 ms: nanoseconds and milliseconds both stay visible.
const LOG_MIN = -8;
const LOG_MAX = -1;

const track = (x: number, w: number) => ({x: x + LABEL_W, w: w - LABEL_W - VALUE_W});
const fraction = (seconds: number) => Math.min(1, Math.max(0, (Math.log10(seconds) - LOG_MIN) / (LOG_MAX - LOG_MIN)));

/** Screen box of row `i`'s full-grown bar (for a marker bracket or circle). */
export const latencyBarBox = ({x, y, w, rows}: {x: number; y: number; w: number; rows: LatencyRow[]}, i: number) => {
  const t = track(x, w);
  return {x: t.x, y: y + i * ROW_H + (ROW_H - BAR_H) / 2 - 20, w: t.w * fraction(rows[i].seconds), h: BAR_H};
};

/**
 * Horizontal latency bars on a log scale, each growing from zero on its cue, value at the bar's end.
 * `caption` qualifies the numbers (e.g. "typical, not measured").
 */
export const LatencyBars = ({
  x,
  y,
  w,
  rows,
  caption,
  at = 0,
  until,
}: {
  x: number;
  y: number;
  w: number;
  rows: LatencyRow[];
  caption?: string;
  at?: At;
  until?: At;
}) => {
  const {now, at: resolve} = useSceneTime();
  const t = track(x, w);
  const p = progressAt(now - resolve(at));
  const out = until === undefined ? 0 : progressAt(now - resolve(until), dur.exit, ease.exit);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, opacity: p * (1 - out), fontFamily: font.ui}}>
      {rows.map((r, i) => {
        const grow = progressAt(now - resolve(r.at), dur.drawMax, ease.standard);
        const len = t.w * fraction(r.seconds) * grow;
        return (
          <div key={r.label} style={{position: 'relative', height: ROW_H}}>
            <div style={{position: 'absolute', left: 0, top: (ROW_H - BAR_H) / 2 - 26, fontWeight: 600, fontSize: type.nodeLabel, color: color.chalk}}>
              {r.label}
            </div>
            <div
              style={{
                position: 'absolute',
                left: LABEL_W,
                top: (ROW_H - BAR_H) / 2 - 20,
                width: t.w,
                height: BAR_H,
                borderRadius: BAR_H / 2,
                background: color.raised,
                border: `2px solid ${color.grid}`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: LABEL_W,
                top: (ROW_H - BAR_H) / 2 - 20,
                width: Math.max(len, grow > 0 ? BAR_H : 0),
                height: BAR_H,
                borderRadius: BAR_H / 2,
                background: toneColor[r.tone],
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: LABEL_W + Math.max(len, BAR_H) + 20,
                top: (ROW_H - BAR_H) / 2 - 26,
                opacity: progressAt(now - resolve(r.at) - dur.drawMax * 0.6),
                fontWeight: 700,
                fontSize: type.chip,
                color: toneText[r.tone],
                whiteSpace: 'nowrap',
              }}
            >
              {r.value}
            </div>
          </div>
        );
      })}
      {caption ? <div style={{fontWeight: 500, fontSize: type.chip, color: color.pencil}}>{caption}</div> : null}
    </div>
  );
};

/** Screen box of the end of row `i`'s bar, for a marker arrow to point at. */
export const latencyBarEnd = (props: {x: number; y: number; w: number; rows: LatencyRow[]}, i: number) => {
  const b = latencyBarBox(props, i);
  return {x: b.x + b.w - 12, y: b.y, w: 24, h: b.h};
};
