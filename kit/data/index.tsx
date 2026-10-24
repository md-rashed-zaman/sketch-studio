import type {CSSProperties, ReactNode} from 'react';
import {interpolate} from 'remotion';
import {color, dur, ease, font, tokens, type} from '../theme';
import {progressAt, useCue, useSceneTime, type At} from '../motion/cues';
import {minReadable, useLayout} from '../frame/surface';

type Step = {at: At; value: number};

/** The value rolling (600 ms) towards the latest step that has fired. */
const useRolled = (steps: Step[]) => {
  const {now, at} = useSceneTime();
  const timed = steps.map((s) => ({...s, t: at(s.at)}));
  const i = Math.max(0, timed.filter((s) => s.t <= now).length - 1);
  const from = i > 0 ? timed[i - 1].value : timed[0].value;
  return interpolate(progressAt(now - timed[i].t, dur.counterRoll, ease.standard), [0, 1], [from, timed[i].value]);
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** "Scale It" load meter: a readable line plus a bar; coral above the threshold, mint below. */
export const LoadMeter = ({
  steps,
  capacity,
  unit = 'req/s',
  threshold = capacity * 0.8,
  at = 0,
  until,
  style,
}: {
  steps: Step[];
  capacity: number;
  unit?: string;
  threshold?: number;
  at?: At;
  until?: At;
  style?: CSSProperties;
}) => {
  const value = useRolled(steps);
  const {now, at: resolve} = useSceneTime();
  const p = useCue(at) * (until === undefined ? 1 : 1 - progressAt(now - resolve(until), dur.exit, ease.exit));
  const fill = value > threshold ? color.coral : color.mint;
  const size = minReadable[useLayout()];
  return (
    <div style={{opacity: p, ...style}}>
      <div style={{fontFamily: font.ui, fontWeight: 500, fontSize: size, color: color.pencil, fontVariantNumeric: 'tabular-nums'}}>
        Load {fmt(value)} {unit} / capacity {fmt(capacity)}
      </div>
      <div style={{marginTop: 16, height: 18, borderRadius: 9, background: color.raised, border: `2px solid ${color.grid}`}}>
        <div style={{height: '100%', width: `${Math.min(1, value / capacity) * 100}%`, borderRadius: 9, background: fill}} />
      </div>
    </div>
  );
};

/** One hero number per scene, rolling to its value and settling at 1.04x. */
export const HeroNumber = ({
  steps,
  suffix = '',
  note,
  at = 0,
}: {
  steps: Step[];
  suffix?: string;
  note?: string;
  at?: At;
}) => {
  const value = useRolled(steps);
  const p = useCue(at);
  const settle = useCue(steps.at(-1)?.at ?? at, 1.2, ease.standard);
  const size = minReadable[useLayout()];
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * tokens.motion.enterRisePx}px)`}}>
      <div
        style={{
          fontFamily: font.display,
          fontWeight: 700,
          fontSize: type.hero,
          lineHeight: 1,
          color: color.chalk,
          fontVariantNumeric: 'tabular-nums',
          transform: `scale(${1 + (tokens.motion.heroSettleScale - 1) * settle})`,
          transformOrigin: 'left bottom',
        }}
      >
        {fmt(value)}
        {suffix}
      </div>
      {note ? <div style={{marginTop: 20, fontFamily: font.ui, fontWeight: 500, fontSize: size, color: color.pencil}}>{note}</div> : null}
    </div>
  );
};

/** A light paper card pinned into the notebook: quotes, sources, doc screenshots. */
export const PaperCard = ({
  children,
  source,
  small,
  tilt = 2,
  at = 0,
  until,
  style,
}: {
  children: ReactNode;
  source?: string;
  /** A short pinned note (36 px) instead of a quote card. */
  small?: boolean;
  /** Pinned-card tilt in degrees (0 when a marker must line up with the text). */
  tilt?: number;
  at?: At;
  until?: At;
  style?: CSSProperties;
}) => {
  const p = useCue(at);
  const {now, at: resolve} = useSceneTime();
  const out = until === undefined ? 0 : progressAt(now - resolve(until), dur.exit, ease.exit);
  const size = minReadable[useLayout()];
  return (
    <div
      style={{
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * tokens.motion.enterRisePx}px) rotate(${tilt}deg)`,
        background: color.card,
        color: color.night,
        borderRadius: 16,
        padding: small ? '14px 24px' : '40px 48px',
        fontFamily: font.ui,
        ...style,
      }}
    >
      <div style={{fontWeight: 600, fontSize: small ? size : Math.max(type.nodeLabel, size), lineHeight: 1.25}}>
        {children}
      </div>
      {/* graphite is reserved for strokes, so the source is dimmed ink */}
      {source ? <div style={{marginTop: 24, fontWeight: 500, fontSize: size, opacity: 0.7}}>{source}</div> : null}
    </div>
  );
};
