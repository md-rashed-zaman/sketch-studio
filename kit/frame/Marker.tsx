import {evolvePath} from '@remotion/paths';
import {measureText} from '@remotion/layout-utils';
import {useVideoConfig} from 'remotion';
import {color, dur, ease, font, type} from '../theme';
import {useFontsReady} from '../fonts';
import {progressAt, useSceneTime, type At} from '../motion/cues';
import {
  inflate,
  markerArrow,
  markerBracket,
  markerCross,
  markerLoop,
  markerLoopBounds,
  markerUnderline,
  type Box,
  type Point,
} from '../diagram/geometry';
import {stageArea, useLayout} from './surface';

export type MarkerKind = 'circle' | 'underline' | 'arrow' | 'cross' | 'bracket';
/** `inside`: the note is written in the box itself (e.g. an underlined handwritten word). */
export type MarkerSide = 'above' | 'below' | 'left' | 'right' | 'inside';

const MARKER_CLEAR = 28;
const MAX_UNDERLINE = 600;
const hits = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Where a marker's stroke and note go, in screen px. The note takes the first side (asked-for first) where
 * it fits inside `bounds` without touching an obstacle; if none fits, the asked-for side, pulled inside.
 */
export const markerLayout = ({
  kind,
  target,
  note,
  side: asked = 'above',
  key,
  bounds,
  obstacles = [],
}: {
  kind: MarkerKind;
  target: Box;
  note?: string;
  side?: MarkerSide;
  key: string;
  bounds: Box;
  obstacles?: Box[];
}) => {
  // An underline goes directly under a short word or number; a wide one underlines nothing in particular.
  if (kind === 'underline' && target.w > MAX_UNDERLINE) throw new Error(`Marker: an underline ${Math.round(target.w)} px wide points at nothing; circle or point at one thing`);
  const ring = kind === 'circle' ? inflate(markerLoopBounds(target, MARKER_CLEAR, key), 4) : inflate(target, MARKER_CLEAR + 6);
  const noteW = note ? measureText({text: note, fontFamily: font.marker, fontSize: type.marker, fontWeight: 700}).width : 0;
  const noteH = type.marker * 1.1;
  const gap = kind === 'arrow' ? 110 : 16; // an arrow needs room to point
  const placeAt = (side: MarkerSide): Point =>
    side === 'inside'
      ? {x: target.x + target.w / 2 - noteW / 2, y: target.y + target.h / 2 - noteH / 2}
      : side === 'above'
      ? {x: ring.x + ring.w / 2 - noteW / 2, y: ring.y - noteH - gap}
      : side === 'below'
        ? {x: ring.x + ring.w / 2 - noteW / 2, y: ring.y + ring.h + gap}
        : side === 'left'
          ? {x: ring.x - noteW - gap - 8, y: ring.y + ring.h / 2 - noteH / 2}
          : {x: ring.x + ring.w + gap + 8, y: ring.y + ring.h / 2 - noteH / 2};
  const fits = (p: Point) =>
    p.x >= bounds.x &&
    p.x + noteW <= bounds.x + bounds.w &&
    p.y >= bounds.y &&
    p.y + noteH <= bounds.y + bounds.h &&
    !obstacles.some((o) => hits(o, {x: p.x, y: p.y, w: noteW, h: noteH}));
  const sides = [...new Set([asked, 'above', 'right', 'left', 'below'] as const)];
  // An underline's note can also ride on the line itself, at either end, before it moves away from it.
  const line = target.y + target.h + 16;
  const onLine = kind === 'underline' ? [{x: target.x, y: line - noteH - 4}, {x: target.x + target.w - noteW, y: line - noteH - 4}] : [];
  const free = asked !== 'inside' && note && !fits(placeAt(asked)) ? onLine.find(fits) : undefined;
  const side = asked === 'inside' || free ? asked : (note && sides.find((sd) => fits(placeAt(sd)))) || asked;
  const raw = free ?? placeAt(side);
  const at = {
    x: Math.min(Math.max(raw.x, bounds.x), bounds.x + bounds.w - noteW),
    y: Math.min(Math.max(raw.y, bounds.y), bounds.y + bounds.h - noteH),
  };
  const mid = {x: ring.x + ring.w / 2, y: ring.y + ring.h / 2};
  const tip: Point =
    side === 'left' ? {x: ring.x, y: mid.y} : side === 'right' ? {x: ring.x + ring.w, y: mid.y} : side === 'below' ? {x: mid.x, y: ring.y + ring.h} : {x: mid.x, y: ring.y};
  const tail: Point =
    side === 'left'
      ? {x: at.x + noteW + 8, y: at.y + noteH / 2}
      : side === 'right'
        ? {x: at.x - 8, y: at.y + noteH / 2}
        : side === 'below'
          ? {x: at.x + noteW / 2, y: at.y}
          : {x: at.x + noteW / 2, y: at.y + noteH};
  const d =
    kind === 'circle'
      ? markerLoop(target, MARKER_CLEAR, key)
      : kind === 'underline'
        ? markerUnderline(target, 16, key)
        : kind === 'cross'
          ? markerCross(target, key)
          : kind === 'bracket'
            ? markerBracket(target, key)
            : markerArrow(tail, tip, key);
  return {d, note: note ? {x: at.x, y: at.y, w: noteW, h: noteH, text: note} : null};
};

/** Draws a laid-out marker: the stroke draws on over 520 ms, the note follows, all of it fades by `fade`. */
export const MarkerDrawing = ({layout, since, fade}: {layout: ReturnType<typeof markerLayout>; since: number; fade: number}) => {
  const ev = evolvePath(progressAt(since, dur.markerDraw, ease.standard), layout.d);
  const n = layout.note;
  return (
    <g opacity={fade}>
      <path
        d={layout.d}
        fill="none"
        stroke={color.amber}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={ev.strokeDasharray}
        strokeDashoffset={ev.strokeDashoffset}
      />
      {n ? (
        <text
          x={n.x + n.w / 2}
          y={n.y + n.h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color.amber}
          fontFamily={font.marker}
          fontWeight={700}
          fontSize={type.marker}
          opacity={progressAt(since - 0.2, dur.enter)}
          transform={`rotate(-4 ${n.x + n.w / 2} ${n.y + n.h / 2})`}
        >
          {n.text}
        </text>
      ) : null}
    </g>
  );
};

/**
 * A marker on anything that is not a diagram node (a bar, a card, a row): `box` in screen px. Keep to one
 * marker on screen at a time, across components too.
 */
export const Marker = ({
  at,
  until,
  kind = 'circle',
  box,
  note,
  side,
}: {
  at: At;
  until?: At;
  kind?: MarkerKind;
  box: Box;
  note?: string;
  side?: MarkerSide;
}) => {
  const ready = useFontsReady();
  const {width, height} = useVideoConfig();
  const shape = useLayout();
  const {now, at: resolve} = useSceneTime();
  if (!ready) return null;
  const since = now - resolve(at);
  const fade = until === undefined ? 1 : 1 - progressAt(now - resolve(until), dur.markerFade, ease.exit);
  if (since < 0 || fade <= 0) return null;
  const layout = markerLayout({kind, target: box, note, side, key: `${kind}@${String(at)}`, bounds: stageArea[shape]});
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <MarkerDrawing layout={layout} since={since} fade={fade} />
    </svg>
  );
};
