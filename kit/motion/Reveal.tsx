import type {CSSProperties, ReactNode} from 'react';
import {tokens} from '../theme';
import {useCue, type At} from './cues';

/** Fades its children in with the standard 24 px rise when `at` fires. */
export const Reveal = ({children, at = 0, style}: {children: ReactNode; at?: At; style?: CSSProperties}) => {
  const p = useCue(at);
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * tokens.motion.enterRisePx}px)`, ...style}}>{children}</div>
  );
};
