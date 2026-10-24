import type {CSSProperties} from 'react';
import {color, dur, ease, font, tokens} from '../theme';
import {progressAt, useSceneTime, type At} from '../motion/cues';

/** One line of code on a raised card (JetBrains Mono, 40 px): for showing what the caller has to write. */
export const CodeLine = ({code, at = 0, until, style}: {code: string; at?: At; until?: At; style?: CSSProperties}) => {
  const {now, at: resolve} = useSceneTime();
  const p = progressAt(now - resolve(at));
  const out = until === undefined ? 0 : progressAt(now - resolve(until), dur.exit, ease.exit);
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '14px 24px',
        borderRadius: 12,
        background: color.raised,
        border: `2px solid ${color.graphite}`,
        fontFamily: font.code,
        fontWeight: 500,
        fontSize: tokens.type.code,
        lineHeight: tokens.type.codeLineHeight,
        color: color.chalk,
        whiteSpace: 'pre',
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * tokens.motion.enterRisePx}px)`,
        ...style,
      }}
    >
      {code}
    </div>
  );
};
