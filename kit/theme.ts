import {Easing} from 'remotion';
// The design system's tokens are the single source of truth: never hard-code these values.
import tokens from '../design/tokens.json';

export {tokens};

const {paper, ink, signal, marker} = tokens.color;

export const color = {
  night: paper.night,
  raised: paper.raised,
  grid: paper.grid,
  card: paper.card,
  chalk: ink.chalk,
  pencil: ink.pencil,
  graphite: ink.graphite,
  onSignal: ink.onSignal,
  cobalt: signal.cobalt,
  cobaltText: signal.cobaltText,
  mint: signal.mint,
  coral: signal.coral,
  violet: signal.violet,
  amber: marker.amber,
} as const;

/** The semantic colors. cobalt = request/active, mint = success, coral = failure, violet = second system. */
export type Tone = 'cobalt' | 'mint' | 'coral' | 'violet';
export const tone: Record<Tone, string> = {cobalt: signal.cobalt, mint: signal.mint, coral: signal.coral, violet: signal.violet};
/** Tone colors for text on the canvas (cobalt has a lighter text variant for contrast). */
export const toneText: Record<Tone, string> = {...tone, cobalt: signal.cobaltText};

export const font = {
  display: tokens.font.display.family,
  ui: tokens.font.ui.family,
  code: tokens.font.code.family,
  marker: tokens.font.marker.family,
} as const;

export const type = tokens.type;
export const layout = tokens.layout;

const bezier = (p: number[]) => Easing.bezier(p[0], p[1], p[2], p[3]);
export const ease = {
  standard: bezier(tokens.motion.easing.standard),
  enter: bezier(tokens.motion.easing.enter),
  exit: bezier(tokens.motion.easing.exit),
};

/** Motion durations in seconds (tokens are in ms). */
export const dur = Object.fromEntries(Object.entries(tokens.motion.ms).map(([k, v]) => [k, v / 1000])) as {
  [K in keyof typeof tokens.motion.ms]: number;
};

/** Hex color plus alpha (0..1) as #RRGGBBAA. */
export const alpha = (hex: string, a: number) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, '0')}`;

/** The one allowed glow: soft, on the active element only. */
export const glow = (hex: string, strength = 1) =>
  `drop-shadow(0 0 ${tokens.color.glow.radiusPx}px ${alpha(hex, tokens.color.glow.opacity * strength)})`;
