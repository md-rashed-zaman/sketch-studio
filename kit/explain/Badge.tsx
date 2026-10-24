import type {CSSProperties} from 'react';
import {color, dur, ease, font, tokens, tone as toneColor, type, type Tone} from '../theme';
import {progressAt, useSceneTime, type At} from '../motion/cues';

/**
 * A chip outside a diagram (HIT / MISS, FULL, "good default"): semantic fill with dark text, `neutral`
 * (outlined) or `note` (pencil words). Mint and coral come with ✓ / ✕ via `icon`.
 */
export const Badge = ({
  text,
  tone = 'cobalt',
  icon,
  big,
  at = 0,
  until,
  style,
}: {
  text: string;
  tone?: Tone | 'neutral' | 'note';
  icon?: 'check' | 'cross';
  big?: boolean;
  at?: At;
  until?: At;
  style?: CSSProperties;
}) => {
  const {now, at: resolve} = useSceneTime();
  const p = progressAt(now - resolve(at));
  const out = until === undefined ? 0 : progressAt(now - resolve(until), dur.exit, ease.exit);
  if (p <= 0 || out >= 1) return null;
  const plain = tone === 'neutral' || tone === 'note';
  const size = big ? type.sceneTitle : type.chip;
  const ink = plain ? color.pencil : color.onSignal;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.3,
        padding: tone === 'note' ? 0 : `${size * 0.16}px ${size * 0.5}px`,
        borderRadius: 999,
        background: plain ? (tone === 'neutral' ? color.raised : 'transparent') : toneColor[tone as Tone],
        border: tone === 'neutral' ? `2px solid ${color.graphite}` : 'none',
        color: ink,
        fontFamily: font.ui,
        fontWeight: tone === 'note' ? 500 : 700,
        fontSize: size,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * tokens.motion.enterRisePx}px)`,
        ...style,
      }}
    >
      {icon ? (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          {icon === 'check' ? <path d="M 4 13 L 10 19 L 20 6" /> : <path d="M 5 5 L 19 19 M 19 5 L 5 19" />}
        </svg>
      ) : null}
      {text}
    </div>
  );
};
