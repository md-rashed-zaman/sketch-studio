// Pure geometry for SystemDiagram: sizes, routes, packet motion, camera framing, marker strokes.
import {dur, layout as L, tokens, type} from '../theme';

export type Point = {x: number; y: number};
/** Axis-aligned box, top-left origin. */
export type Box = {x: number; y: number; w: number; h: number};
/** Where connectors attach: a box, optionally with sides attaching at `cy` instead of its middle. */
export type Anchor = Box & {cy?: number};
export type Route = 'auto' | 'hv' | 'vh';
export type Camera = {cx: number; cy: number; zoom: number};

const LINE = 1.15;
const NODE_PAD_Y = 32; // labels never touch a border
const ICON = tokens.icon;
const snap = (v: number) => Math.ceil(v / L.grid.base) * L.grid.base;

/** Labels over `wrapAtChars` characters wrap to two lines (at the space nearest the middle) instead of shrinking. */
export const wrapLabel = (label: string): string[] => {
  if (label.length <= L.node.wrapAtChars || !label.includes(' ')) return [label];
  let best = -1;
  for (let i = 0; i < label.length; i++) {
    if (label[i] === ' ' && (best < 0 || Math.abs(i - label.length / 2) < Math.abs(best - label.length / 2))) best = i;
  }
  return [label.slice(0, best), label.slice(best + 1)];
};

/**
 * How a node is drawn. plain: box with a label. boxed: box with a 56 px icon left of the label (a service).
 * stacked: the boxed node in Shorts, icon over label to save width. free: a 104 px icon with the label
 * below and no box (actors and data stores).
 */
export type NodeForm = 'plain' | 'boxed' | 'stacked' | 'free';

const textBlock = (lines: number, sub: boolean) => lines * type.nodeLabel * LINE + (sub ? type.note * LINE + 4 : 0);

/**
 * Full extent of a node. Boxes: content + 2 x padX (token minimum width), at least minH tall.
 * Free: the icon, 6 px gap, then the label.
 */
export const nodeSize = (textWidth: number, lines: number, sub: boolean, form: NodeForm = 'plain') => {
  const text = textBlock(lines, sub);
  if (form === 'free') return {w: Math.max(ICON.freePx, Math.ceil(textWidth)), h: ICON.freePx + ICON.freeLabelGapPx + text};
  const content = form === 'boxed' ? ICON.inNodePx + ICON.gapToLabelPx + textWidth : textWidth;
  const height = form === 'stacked' ? ICON.inNodePx + 12 + text : text;
  return {
    w: Math.max(L.node.minW, snap(Math.max(content, form === 'stacked' ? ICON.inNodePx : 0) + 2 * L.node.padX)),
    h: Math.max(L.node.minH, snap(2 * NODE_PAD_Y + height)),
  };
};

/**
 * Where connectors attach. Boxes: the border. Free icons: 24 px clear of the icon, with the sides at the
 * icon's vertical center and the bottom below the label (connectors never touch the label).
 */
export const nodeAnchor = (extent: Box, form: NodeForm): Anchor => {
  if (form !== 'free') return extent;
  const c = ICON.connectorClearancePx;
  const cx = extent.x + extent.w / 2;
  const iconMid = extent.y + ICON.freePx / 2;
  return {x: cx - ICON.freePx / 2 - c, y: extent.y - c, w: ICON.freePx + 2 * c, h: extent.h + 2 * c, cy: iconMid};
};

const center = (b: Anchor): Point => ({x: b.x + b.w / 2, y: b.cy ?? b.y + b.h / 2});
/** Where a vertical connector meets an anchor: its bottom (s > 0) or top, below a free icon's label. */
const vEdge = (b: Anchor, s: number) => (s > 0 ? b.y + b.h : b.y);
const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const toward = (from: Point, to: Point, d: number): Point => {
  const len = dist(from, to) || 1;
  return {x: from.x + ((to.x - from.x) / len) * d, y: from.y + ((to.y - from.y) / len) * d};
};

/**
 * Orthogonal route between two boxes, border to border.
 * auto: straight when aligned, else a Z through the middle of the gap; hv: leave sideways, enter from
 * top/bottom; vh: leave from top/bottom, enter sideways.
 */
export const routePoints = (a: Anchor, b: Anchor, route: Route = 'auto'): Point[] => {
  const ca = center(a);
  const cb = center(b);
  const sx = Math.sign(cb.x - ca.x) || 1;
  const sy = Math.sign(cb.y - ca.y) || 1;
  // An L only makes sense when the target is offset on both axes (it is not, mid-glide between layouts).
  if (route === 'hv' && Math.abs(cb.y - ca.y) < b.h / 2) return routePoints(a, b);
  if (route === 'vh' && Math.abs(cb.x - ca.x) < b.w / 2) return routePoints(a, b);
  if (route === 'hv') {
    const start = {x: ca.x + (sx * a.w) / 2, y: ca.y};
    const end = {x: cb.x, y: vEdge(b, -sy)};
    return [start, {x: end.x, y: start.y}, end];
  }
  if (route === 'vh') {
    const start = {x: ca.x, y: vEdge(a, sy)};
    const end = {x: cb.x - (sx * b.w) / 2, y: cb.y};
    return [start, {x: start.x, y: end.y}, end];
  }
  const gapX = Math.abs(cb.x - ca.x) - (a.w + b.w) / 2;
  const gapY = Math.abs(cb.y - ca.y) - (a.h + b.h) / 2;
  if (gapX >= gapY) {
    const start = {x: ca.x + (sx * a.w) / 2, y: ca.y};
    const end = {x: cb.x - (sx * b.w) / 2, y: Math.abs(cb.y - ca.y) < L.grid.base ? ca.y : cb.y};
    if (end.y === start.y) return [start, end];
    const mx = (start.x + end.x) / 2;
    return [start, {x: mx, y: start.y}, {x: mx, y: end.y}, end];
  }
  const start = {x: ca.x, y: vEdge(a, sy)};
  const end = {x: Math.abs(cb.x - ca.x) < L.grid.base ? ca.x : cb.x, y: vEdge(b, -sy)};
  if (end.x === start.x) return [start, end];
  const my = (start.y + end.y) / 2;
  return [start, {x: start.x, y: my}, {x: end.x, y: my}, end];
};

/** SVG path through orthogonal points with rounded (24 px) corners. */
export const roundedPath = (pts: Point[], r: number = L.connector.cornerRadius) => {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const c = Math.min(r, dist(pts[i - 1], pts[i]) / 2, dist(pts[i], pts[i + 1]) / 2);
    const a = toward(pts[i], pts[i - 1], c);
    const b = toward(pts[i], pts[i + 1], c);
    d += ` L ${a.x} ${a.y} Q ${pts[i].x} ${pts[i].y} ${b.x} ${b.y}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last.x} ${last.y}`;
};

/** The same points with the last segment shortened by `by` (room for the arrowhead). */
export const trimEnd = (pts: Point[], by: number) => {
  const out = pts.slice();
  out[out.length - 1] = toward(pts[pts.length - 1], pts[pts.length - 2], by);
  return out;
};

/** Arrowhead triangle with its tip at the route's end. */
export const arrowhead = (pts: Point[], size: number = L.connector.arrowhead) => {
  const tip = pts[pts.length - 1];
  const base = toward(tip, pts[pts.length - 2], size);
  const nx = (tip.y - base.y) / size;
  const ny = (base.x - tip.x) / size;
  const half = size * 0.55;
  return `${tip.x},${tip.y} ${base.x + nx * half},${base.y + ny * half} ${base.x - nx * half},${base.y - ny * half}`;
};

/** The longest straight segment of a route: where labels go and labeled packets ride. */
export const longestSegment = (pts: Point[]) => {
  let best = 0;
  for (let i = 1; i < pts.length - 1; i++) if (dist(pts[i], pts[i + 1]) > dist(pts[best], pts[best + 1])) best = i;
  return {a: pts[best], b: pts[best + 1], len: dist(pts[best], pts[best + 1])};
};

/** Midpoint and orientation of the longest segment: where a connector label or edge chip goes. */
export const labelSpot = (pts: Point[]) => {
  const {a, b} = longestSegment(pts);
  return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, horizontal: Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)};
};

/**
 * Distance travelled after `t` seconds along `length` px: constant 650 px/s with a 120 ms ease at
 * both ends. Null before departure and after arrival.
 */
export const travel = (t: number, length: number, v = tokens.motion.packetPxPerSec, r = dur.packetEase) => {
  const total = length / v + r;
  if (t < 0 || t > total) return null;
  if (t < r) return (v * t * t) / (2 * r);
  if (t > total - r) return length - (v * (total - t) ** 2) / (2 * r);
  return (v * r) / 2 + v * (t - r);
};
export const travelTime = (length: number) => length / tokens.motion.packetPxPerSec + dur.packetEase;

/** Scene-relative times at which a stream emits packets, stepped per frame so renders are deterministic. */
export const emissions = (start: number, end: number, rateAt: (t: number) => number, fps: number) => {
  const out: number[] = [];
  let due = 1; // the first packet leaves as soon as the stream starts
  for (let f = Math.ceil(start * fps); f / fps <= end; f++) {
    due += rateAt(f / fps) / fps;
    while (due >= 1) {
      out.push(f / fps);
      due -= 1;
    }
  }
  return out;
};

export const union = (boxes: Box[]): Box => {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  return {
    x,
    y,
    w: Math.max(...boxes.map((b) => b.x + b.w)) - x,
    h: Math.max(...boxes.map((b) => b.y + b.h)) - y,
  };
};
export const inflate = (b: Box, m: number): Box => ({x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m});

/** Center on `box` at the largest zoom that fits it in `stage`, clamped to [min, max]. */
export const fit = (box: Box, stage: Box, min: number, max: number): Camera & {fits: number} => {
  const fits = Math.min(stage.w / box.w, stage.h / box.h);
  return {cx: box.x + box.w / 2, cy: box.y + box.h / 2, zoom: Math.min(max, Math.max(min, fits)), fits};
};

export const toScreen = (p: Point, cam: Camera, stage: Box): Point => ({
  x: (p.x - cam.cx) * cam.zoom + stage.x + stage.w / 2,
  y: (p.y - cam.cy) * cam.zoom + stage.y + stage.h / 2,
});
export const boxToScreen = (b: Box, cam: Camera, stage: Box): Box => {
  const p = toScreen(b, cam, stage);
  return {x: p.x, y: p.y, w: b.w * cam.zoom, h: b.h * cam.zoom};
};

// Seeded randomness so hand-drawn strokes are identical on every render.
const seeded = (key: string) => {
  let s = 2166136261;
  for (const ch of key) s = Math.imul(s ^ ch.charCodeAt(0), 16777619);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Smooth path through points (Catmull-Rom as cubic Beziers). */
const smooth = (pts: Point[]) => {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(pts.length - 1, i + 2)]];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
};

/**
 * Points of a hand-drawn loop around `box`: a slightly irregular ellipse (a soft superellipse, grown until
 * the box's corners keep `clearance` too) that starts top-left, meets its start, then flicks outward
 * past it like a pen stroke ending, instead of running back over itself.
 */
const loopPoints = (box: Box, clearance: number, key: string) => {
  const rand = seeded(key);
  const n = 3;
  const a0 = box.w / 2 + clearance;
  const b0 = box.h / 2 + clearance;
  const corner = clearance / Math.SQRT2;
  // Grow both radii by the same distance (not the same factor) until the loop clears the box corners, so a
  // wide target gets a snug loop instead of one that bulges far past its ends.
  const inside = (d: number) => ((box.w / 2 + corner) / (a0 + d)) ** n + ((box.h / 2 + corner) / (b0 + d)) ** n <= 1;
  let [lo, hi] = [0, Math.max(a0, b0)];
  for (let i = 0; i < 30; i++) [lo, hi] = inside((lo + hi) / 2) ? [lo, (lo + hi) / 2] : [(lo + hi) / 2, hi];
  const [a, b] = [a0 + hi, b0 + hi];
  const [ph1, ph2] = [rand() * 6.28, rand() * 6.28];
  const start = -Math.PI * 0.6;
  const over = 0.32; // overshoot past the start, in radians
  const pts: Point[] = [];
  for (let i = 0; i <= 52; i++) {
    const t = start + ((Math.PI * 2 + over) * i) / 52;
    // Wobble only bulges outward (clearance holds) and repeats every turn, so the stroke meets its start.
    const wobble = 0.03 * (0.5 + 0.5 * Math.sin(2 * t + ph1)) + 0.02 * (0.5 + 0.5 * Math.sin(3 * t + ph2));
    const flick = 0.1 * Math.max(0, (t - start - Math.PI * 2) / over) ** 1.6;
    const k = 1 + wobble + flick;
    const c = Math.cos(t);
    const s = Math.sin(t);
    pts.push({
      x: box.x + box.w / 2 + a * k * Math.sign(c) * Math.abs(c) ** (2 / n),
      y: box.y + box.h / 2 + b * k * Math.sign(s) * Math.abs(s) ** (2 / n),
    });
  }
  return pts;
};

export const markerLoop = (box: Box, clearance: number, key: string) => smooth(loopPoints(box, clearance, key));

/** Bounds of the drawn loop (plus its stroke), so the camera can keep it inside the safe area. */
export const markerLoopBounds = (box: Box, clearance: number, key: string, stroke = 5) => {
  const pts = loopPoints(box, clearance, key);
  return inflate(union(pts.map((p) => ({x: p.x, y: p.y, w: 0, h: 0}))), stroke);
};

/** Hand-drawn underline just below `box`. */
export const markerUnderline = (box: Box, gap: number, key: string) => {
  const rand = seeded(key);
  const pts: Point[] = [];
  for (let i = 0; i <= 6; i++) {
    pts.push({x: box.x - 10 + ((box.w + 20) * i) / 6, y: box.y + box.h + gap + (rand() - 0.5) * 5 + i * 0.8});
  }
  return smooth(pts);
};

/** Hand-drawn curved arrow from `from` to `to`, with a two-stroke head. */
export const markerArrow = (from: Point, to: Point, key: string) => {
  const rand = seeded(key);
  const len = dist(from, to);
  const bend = (0.18 + rand() * 0.08) * len;
  const mid = {x: (from.x + to.x) / 2 + ((to.y - from.y) / len) * bend, y: (from.y + to.y) / 2 - ((to.x - from.x) / len) * bend};
  const curve = [from, toward(from, mid, dist(from, mid) * 0.5), mid, toward(to, mid, dist(to, mid) * 0.5), to];
  const back = toward(to, curve[3], 26);
  const ang = Math.atan2(back.y - to.y, back.x - to.x);
  const head = (da: number) => ({x: to.x + 26 * Math.cos(ang + da), y: to.y + 26 * Math.sin(ang + da)});
  const [h1, h2] = [head(0.5), head(-0.5)];
  return `${smooth(curve)} M ${h1.x.toFixed(1)} ${h1.y.toFixed(1)} L ${to.x} ${to.y} L ${h2.x.toFixed(1)} ${h2.y.toFixed(1)}`;
};

/** Hand-drawn cross-out over `box` (two strokes, slightly past the corners). */
export const markerCross = (box: Box, key: string) => {
  const rand = seeded(key);
  const j = () => (rand() - 0.5) * 8;
  const pad = 10;
  const [l, t, r, b] = [box.x - pad, box.y - pad, box.x + box.w + pad, box.y + box.h + pad];
  const stroke = (a: Point, z: Point) => smooth([a, {x: (a.x + z.x) / 2 + j(), y: (a.y + z.y) / 2 + j()}, z]);
  return `${stroke({x: l, y: t}, {x: r, y: b})} ${stroke({x: r, y: t}, {x: l, y: b})}`;
};

/** Hand-drawn curly bracket along the right side of `box`, pointing right at its middle. */
export const markerBracket = (box: Box, key: string) => {
  const rand = seeded(key);
  const x = box.x + box.w + 18;
  const [t, b, m] = [box.y, box.y + box.h, box.y + box.h / 2];
  const w = 18 + rand() * 4;
  return smooth([
    {x: x - w / 2, y: t},
    {x: x, y: t + 10},
    {x: x, y: m - 14},
    {x: x + w, y: m},
    {x: x, y: m + 14},
    {x: x, y: b - 10},
    {x: x - w / 2, y: b},
  ]);
};
