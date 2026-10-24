import type {CSSProperties} from 'react';
import {interpolateColors} from 'remotion';
import {alpha, color, dur, ease, font, tokens, tone as toneColor, type Tone} from '../theme';
import {progressAt, useSceneTime, type At} from '../motion/cues';

/**
 * One cache entry as a card: `key → value`, in code type on light paper. The key or the value lights up
 * (cobalt) on its cue; a new value flashes its tone as it swaps in; `outline` rings the card (e.g. coral
 * for stale data). Fills its container (pin it with a diagram card, or give it a `style`).
 */
export const KeyValueCard = ({
  keyText,
  values,
  keyAt,
  valueAt,
  outline,
  at = 0,
  until,
  style,
}: {
  keyText: string;
  values: {at: At; text: string; tone?: Tone}[];
  keyAt?: At;
  valueAt?: At;
  outline?: {at: At; tone: Tone; until?: At};
  at?: At;
  until?: At;
  style?: CSSProperties;
}) => {
  const {now, at: resolve} = useSceneTime();
  const p = progressAt(now - resolve(at));
  const out = until === undefined ? 0 : progressAt(now - resolve(until), dur.exit, ease.exit);
  const steps = values.map((v) => ({...v, t: resolve(v.at)}));
  const i = Math.max(0, steps.filter((v) => v.t <= now).length - 1);
  const value = steps[i];
  const flash = i > 0 ? 1 - progressAt(now - value.t, dur.counterRoll, ease.standard) : 0;
  const keyOn = keyAt !== undefined && now >= resolve(keyAt) && (valueAt === undefined || now < resolve(valueAt));
  const valueOn = valueAt !== undefined && now >= resolve(valueAt);
  const ring = outline && now >= resolve(outline.at) && (outline.until === undefined || now < resolve(outline.until));
  const lit = (on: boolean): CSSProperties => ({
    padding: '2px 10px',
    borderRadius: 10,
    background: on ? toneColor.cobalt : 'transparent',
    color: color.night,
  });
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 24px',
        borderRadius: 16,
        background: value.tone && flash > 0 ? interpolateColors(flash, [0, 1], [color.card, alpha(toneColor[value.tone], 0.9)]) : color.card,
        border: `4px solid ${ring ? toneColor[outline!.tone] : 'transparent'}`,
        fontFamily: font.code,
        fontWeight: 500,
        fontSize: tokens.type.code,
        color: color.night,
        whiteSpace: 'nowrap',
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * tokens.motion.enterRisePx}px)`,
        ...style,
      }}
    >
      <span style={lit(keyOn)}>{keyText}</span>
      <span>→</span>
      <span style={lit(valueOn)}>{value.text}</span>
    </div>
  );
};
