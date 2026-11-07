import {Easing} from 'remotion';
// The design system's tokens are the single source of truth: never hard-code these values.
import tokens from '../design/tokens.json';

export {tokens};

/** The active palette and its rendering settings ('day' or 'night', picked by `theme` in tokens.json). */
export const theme = tokens.themes[tokens.theme as keyof typeof tokens.themes];
const {paper, ink, signal, marker} = theme;

export const color = {
  canvas: paper.canvas,
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
  amber: marker.stroke,
  /** Marker notes: the marker hue, darker where the canvas needs it for contrast. */
  amberText: marker.text,
} as const;

/** The semantic colors. cobalt = request/active, mint = success, coral = failure, violet = second system. */
export type Tone = 'cobalt' | 'mint' | 'coral' | 'violet';
export const tone: Record<Tone, string> = {cobalt: signal.cobalt, mint: signal.mint, coral: signal.coral, violet: signal.violet};
/** Tone colors for text on the canvas (cobalt has a darker text variant for contrast). */
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

/** The one allowed glow: soft, on the active element only (night theme; day paper tints instead). */
export const glow = (hex: string, strength = 1) =>
  theme.emphasis.mode === 'glow' ? `drop-shadow(0 0 ${theme.emphasis.glowRadiusPx}px ${alpha(hex, theme.emphasis.glowOpacity * strength)})` : undefined;

/** Weight of secondary (pencil) UI text: dark ink on light paper reads thinner, so day paper uses 600. */
export const secondaryWeight = theme.secondaryWeight;
