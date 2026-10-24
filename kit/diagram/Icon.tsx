import {createElement, type CSSProperties} from 'react';
import {color as palette, tokens} from '../theme';
import {iconShapes, type IconKind} from './icons';

/**
 * A Lucide icon by our component key, drawn as SVG with its top-left at (x, y), `size` px square.
 * `progress` 0..1 sketches the strokes in one after another (each stroke's dash offset runs 1 -> 0).
 * `strokeWidth` is in Lucide's 24-unit space (tokens: 1.25 in a node, 1.1 free-standing).
 */
export const Icon = ({
  kind,
  x = 0,
  y = 0,
  size = tokens.icon.inNodePx,
  color = palette.chalk,
  strokeWidth = tokens.icon.strokeWidth.inNode,
  progress = 1,
  style,
}: {
  kind: IconKind;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  strokeWidth?: number;
  progress?: number;
  style?: CSSProperties;
}) => {
  const shapes = iconShapes(kind);
  const stagger = Math.min(0.15, 0.6 / shapes.length);
  const span = 1 - stagger * (shapes.length - 1);
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size / 24})`}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {shapes.map(([tag, {key, ...attrs}], i) => {
        const p = Math.min(1, Math.max(0, (progress - i * stagger) / span));
        // A zero-length dash still paints its round caps as a dot, so an undrawn stroke is not rendered.
        if (p <= 0) return null;
        // pathLength=1 normalises every shape, so no per-path length measurement is needed.
        const dash = p < 1 ? {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p} : {};
        return createElement(tag, {key: String(key ?? i), ...attrs, ...dash});
      })}
    </g>
  );
};
