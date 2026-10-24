import type {CSSProperties} from 'react';
import {color, dur, ease, font, tokens, toneText, type, type Tone} from '../theme';
import {progressAt, useSceneTime, type At} from '../motion/cues';

/**
 * A row of option tabs (e.g. write-through / write-back / write-around). `active` steps pick one tab on a
 * cue (outlined in its tone); `index: null` dims them all.
 */
export const Tabs = ({
  labels,
  at = 0,
  active = [],
  until,
  style,
}: {
  labels: string[];
  at?: At;
  active?: {at: At; index: number | null; tone?: Tone}[];
  until?: At;
  style?: CSSProperties;
}) => {
  const {now, at: resolve} = useSceneTime();
  const step = active.filter((s) => resolve(s.at) <= now).at(-1);
  const out = until === undefined ? 0 : progressAt(now - resolve(until), dur.exit, ease.exit);
  const dimmed = step !== undefined && step.index === null;
  return (
    <div style={{display: 'flex', gap: 16, opacity: (1 - out) * (dimmed ? 0.5 : 1), ...style}}>
      {labels.map((label, i) => {
        const p = progressAt(now - resolve(at) - i * dur.stagger);
        const on = step?.index === i;
        const accent = on ? toneText[step.tone ?? 'cobalt'] : color.graphite;
        return (
          <div
            key={label}
            style={{
              opacity: p,
              transform: `translateY(${(1 - p) * tokens.motion.enterRisePx}px)`,
              padding: '8px 26px',
              borderRadius: 999,
              border: `${on ? 3 : 2}px solid ${accent}`,
              background: on ? color.raised : 'transparent',
              color: on ? color.chalk : color.pencil,
              fontFamily: font.ui,
              fontWeight: 600,
              fontSize: type.chip,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};
