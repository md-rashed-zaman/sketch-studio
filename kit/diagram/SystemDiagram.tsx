import type {ReactNode} from 'react';
import {AbsoluteFill, interpolate, interpolateColors, useVideoConfig} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {measureText} from '@remotion/layout-utils';
import {color, dur, ease, font, glow, layout as L, tokens, tone as toneColor, type, type Tone} from '../theme';
import {useFontsReady} from '../fonts';
import {progressAt, sceneTimeAt, useCues, useSceneTime, type At, type SceneTime} from '../motion/cues';
import {carried, morphTiming, useChapterLink, useGhost, type ChapterLink} from '../frame/transition';
import {minReadable, stageArea, useLayout, type Layout, type Rect} from '../frame/surface';
import {markerLayout, MarkerDrawing, type MarkerKind, type MarkerSide} from '../frame/Marker';
import {
  arrowhead,
  boxToScreen,
  emissions,
  fit,
  inflate,
  labelSpot,
  longestSegment,
  markerLoopBounds,
  nodeAnchor,
  nodeSize,
  roundedPath,
  routePoints,
  travel,
  travelTime,
  trimEnd,
  union,
  wrapLabel,
  type Anchor,
  type Box,
  type Camera,
  type NodeForm,
  type Point,
  type Route,
  toScreen,
} from './geometry';
import {Icon} from './Icon';
import {nodeForm, type IconKind} from './icons';

/** dim = present but out of the story for now (50% opacity). */
export type NodeState = 'idle' | 'active' | 'hot' | 'ok' | 'dim';

/**
 * A component on the chapter canvas (canvas px = screen px at zoom 1). `kind` picks its Lucide icon
 * (tokens icon.map): actors and stores stand free, services are boxed with a small icon. x, y is the
 * box center, or for a free icon the icon's center (rows of mixed nodes line up on it).
 */
export type DiagramNode = {id: string; label: string; kind?: IconKind; sub?: string; x: number; y: number; at?: At; until?: At};

/**
 * Packets per second: constant; ramping from `from` to `to` over `over` seconds starting at `at`; or steps
 * (each step ramps to its value over 1 s on its cue; 0 pauses the stream).
 */
export type Rate = number | {from: number; to: number; at: At; over?: number} | {at: At; value: number}[];

/** A connector. Draws at `at`; with `rate` it carries a stream of unlabeled dots until `until`. */
export type DiagramEdge = {
  from: string;
  to: string;
  at?: At;
  route?: Route;
  label?: string;
  /** When the connector label appears (default: as the connector finishes drawing). */
  labelAt?: At;
  dashed?: boolean;
  rate?: Rate;
  until?: At;
  /** The connector itself fades out (exit) at this cue. */
  exit?: At;
};

/**
 * One packet riding an edge (either direction). A label makes it a capsule, but only where the edge
 * is long enough (>= 260 px plus the capsule); otherwise it falls back to a dot with a trail.
 * `park` (0..1 of its run) stops it there until `until`, so a marker can point at it.
 */
export type DiagramPacket = {from: string; to: string; at: At; label?: string; tone?: Tone; id?: string; icon?: 'message'; until?: At; park?: number};

/** State change of a node (id) or an edge ('from>to'). */
export type DiagramState = {target: string; state: NodeState; at: At};

/** A number that rolls to each step's value over 600 ms; coral above `threshold`, mint at or below. */
export type Counter = {steps: {at: At; value: number}[]; unit?: string; prefix?: string; decimals?: number; threshold?: number};

/** A filled chip under a node (id) or beside an edge ('from>to'): a status word or a live counter. */
export type DiagramChip = {
  target: string;
  at: At;
  until?: At;
  text?: string;
  /** A semantic fill, or `neutral` (raised, outlined) / `note` (pencil words, no box) for plain facts. */
  tone?: Tone | 'neutral' | 'note';
  /** ✓ / ✕ pair with mint / coral; token and ttl chips may carry their Lucide icon. */
  icon?: 'check' | 'cross' | 'token' | 'ttl';
  counter?: Counter;
  /** Lets a marker point at this chip alone. */
  id?: string;
};

/**
 * Amber hand-drawn emphasis on node(s) with their chips and cards, a connector ('from>to'), a chip (id)
 * or a parked packet (id). An underline only goes under one node or chip: never a connector or a row.
 * Lasts until `until` or the next marker.
 */
export type DiagramMarker = {
  at: At;
  until?: At;
  target: string | string[];
  kind?: MarkerKind;
  note?: string;
  side?: MarkerSide;
};

/** Any small content (a key/value card, a paper note) pinned beside a node; it moves with the camera. */
export type DiagramCard = {
  target: string;
  at: At;
  until?: At;
  side?: 'right' | 'left' | 'above' | 'below';
  w: number;
  h: number;
  content: ReactNode;
};

/** Camera shots: the whole canvas, a push-in on some nodes (1.4-2.0x), or following a packet by id. */
/** `into` frames the overview inside part of the stage (e.g. a top band), so other content can share the sheet. */
export type Shot = {at: At; overview: true; into?: Rect} | {at: At; focus: string[]; zoom?: number} | {at: At; track: string; zoom?: number};

export type DiagramProps = {
  nodes: DiagramNode[];
  edges?: DiagramEdge[];
  packets?: DiagramPacket[];
  states?: DiagramState[];
  chips?: DiagramChip[];
  markers?: DiagramMarker[];
  cards?: DiagramCard[];
  shots?: Shot[];
  layout?: Layout;
  /** Draw the diagram in this part of the frame (screen px) instead of the whole stage. */
  area?: Rect;
  /** Frame the overview as if it were this scene time already (a morph frames the layout it glides into). */
  frameFrom?: number;
};

type Props = DiagramProps;

const DRAW = (dur.drawMin + dur.drawMax) / 2;
const CHIP_H = 58;
const CHIP_PAD = 18;
const CHIP_ICON = 34; // icon slot inside a chip
const MAIL = 24; // the message icon inside a packet capsule (tokens: packet icon, 24 px)
const PILL_H = 48;
const PACKET_FONT = 28;
const END_CLEAR = 24 + L.connector.cornerRadius; // capsule clearance past a bend's curve, an arrowhead or a border
const MARKER_CLEAR = 28;
const CARD_GAP = 24;
const FRAME_MARGIN = 24;
const DOT_INSET = 15; // dots start and stop clear of node borders
const STATE_COLOR: Record<NodeState, string> = {idle: color.graphite, active: color.cobalt, hot: color.coral, ok: color.mint, dim: color.graphite};

const measure = (text: string, fontSize: number, fontWeight: number, fontFamily: string = font.ui) =>
  measureText({text, fontFamily, fontSize, fontWeight, validateFontIsLoaded: true}).width;

const formatCounter = (c: Counter, value: number) =>
  `${c.prefix ?? ''}${value.toLocaleString('en-US', {minimumFractionDigits: c.decimals ?? 0, maximumFractionDigits: c.decimals ?? 0})}${c.unit ?? ''}`;

/**
 * A system diagram on one chapter canvas with its own camera. Everything is timed by cues:
 * nodes enter, connectors draw, states change, chips and counters appear, packets travel,
 * markers draw, and the camera moves between shots (returning to the overview at the chapter's end).
 */
export const SystemDiagram = (props: Props) => {
  const ready = useFontsReady();
  const shape = useLayout(props.layout);
  return ready ? <Diagram {...props} shape={shape} /> : null;
};

/** Layout, timing and camera of a diagram at one moment: pure, so another chapter can evaluate it (morphs). */
export const buildModel = ({
  nodes,
  edges = [],
  packets = [],
  states = [],
  chips = [],
  markers = [],
  cards = [],
  shots = [{at: 0, overview: true}],
  frameFrom = -Infinity,
  area,
  shape,
}: Props & {shape: Layout}, {now, at, fps, scene}: SceneTime) => {
  const stage = area ?? stageArea[shape];
  const readable = minReadable[shape];
  // The camera may never shrink the smallest text on the canvas below the readable floor.
  const smallest = Math.min(
    type.nodeLabel,
    nodes.some((n) => n.sub) || edges.some((e) => e.label) ? type.note : Infinity,
    chips.length ? type.chip : Infinity,
  );
  const minZoom = readable / smallest;

  // Nodes: measured, auto-sized, drawn in the form their kind calls for.
  const boxes = new Map<string, Box & {lines: string[]; form: NodeForm; anchor: Anchor; textW: number}>();
  for (const n of nodes) {
    const lines = wrapLabel(n.label);
    const textW = Math.max(...lines.map((l) => measure(l, type.nodeLabel, 600)), n.sub ? measure(n.sub, type.note, 500) : 0);
    const form = nodeForm(n.kind, shape);
    const {w, h} = nodeSize(textW, lines.length, Boolean(n.sub), form);
    const extent = {x: n.x - w / 2, y: form === 'free' ? n.y - tokens.icon.freePx / 2 : n.y - h / 2, w, h};
    boxes.set(n.id, {...extent, lines, form, textW, anchor: nodeAnchor(extent, form)});
  }
  const boxOf = (id: string) => {
    const b = boxes.get(id);
    if (!b) throw new Error(`SystemDiagram: unknown node "${id}"`);
    return b;
  };

  // Edges: orthogonal routes, border to border.
  const geo = edges.map((e) => {
    const pts = routePoints(boxOf(e.from).anchor, boxOf(e.to).anchor, e.route);
    const d = roundedPath(pts);
    return {...e, key: `${e.from}>${e.to}`, pts, d, length: getLength(d)};
  });
  const edgeFor = (from: string, to: string) => {
    const fwd = geo.find((g) => g.from === from && g.to === to);
    const rev = geo.find((g) => g.from === to && g.to === from);
    if (!fwd && !rev) throw new Error(`SystemDiagram: no edge between "${from}" and "${to}" for a packet`);
    return {g: (fwd ?? rev)!, reverse: !fwd};
  };

  const stateOf = (target: string) => {
    const changes = states
      .filter((s) => s.target === target)
      .map((s) => ({...s, t: at(s.at)}))
      .filter((s) => s.t <= now)
      .sort((a, b) => a.t - b.t);
    const cur = changes.at(-1);
    const prev = changes.at(-2);
    return {
      cur: cur?.state ?? 'idle',
      prev: prev?.state ?? 'idle',
      mix: cur ? progressAt(now - cur.t, dur.emphasis, ease.standard) : 1,
    };
  };
  const strokeOf = (target: string) => {
    const s = stateOf(target);
    return {...s, stroke: interpolateColors(s.mix, [0, 1], [STATE_COLOR[s.prev], STATE_COLOR[s.cur]])};
  };

  // Chips: status words and counters, stacked under a node or beside an edge.
  const chipViews = chips.map((c) => {
    const t0 = at(c.at);
    const t1 = c.until === undefined ? Infinity : at(c.until);
    let text = c.text ?? '';
    const tone = c.tone ?? 'cobalt';
    const plain = tone === 'neutral' || tone === 'note';
    const [size, weight] = tone === 'note' ? [type.chip, 500] : [type.chip, 700];
    let fill = plain ? color.raised : toneColor[tone];
    let widest = c.text ? measure(c.text, size, weight) : 0;
    if (c.counter) {
      const counter = c.counter;
      const steps = counter.steps.map((s) => ({...s, t: at(s.at)}));
      const i = Math.max(0, steps.filter((s) => s.t <= now).length - 1);
      const from = i > 0 ? steps[i - 1].value : steps[0].value;
      const value = interpolate(progressAt(now - steps[i].t, dur.counterRoll, ease.standard), [0, 1], [from, steps[i].value]);
      text = formatCounter(counter, value);
      widest = Math.max(...steps.map((s) => measure(formatCounter(counter, s.value), size, weight)));
      if (counter.threshold !== undefined && !plain) fill = value > counter.threshold ? color.coral : color.mint;
    }
    const w = Math.ceil(widest * 1.02) + 2 * CHIP_PAD + (c.icon ? CHIP_ICON : 0);
    const visible = now >= t0 && now < t1 + dur.exit;
    const opacity = progressAt(now - t0) * (1 - progressAt(now - t1, dur.exit, ease.exit));
    return {...c, tone, t0, t1, text, fill, w, visible, opacity};
  });
  /** Where a chip sits when it is first in its stack (stacked chips shift down by `step`). */
  const chipBox = (c: (typeof chipViews)[number], step = 0): Box => {
    if (boxes.has(c.target)) {
      const b = boxOf(c.target);
      return {x: b.x + b.w / 2 - c.w / 2, y: b.y + b.h + 24 + step, w: c.w, h: CHIP_H};
    }
    const g = geo.find((e) => e.key === c.target);
    if (!g) throw new Error(`SystemDiagram: chip target "${c.target}" is not a node or edge`);
    const spot = labelSpot(g.pts);
    // Beside the stroke, opposite the connector label.
    return spot.horizontal
      ? {x: spot.x - c.w / 2, y: spot.y + 2 + L.connector.labelOffset + step, w: c.w, h: CHIP_H}
      : {x: spot.x - 2 - L.connector.labelOffset - c.w, y: spot.y - CHIP_H / 2 + step, w: c.w, h: CHIP_H};
  };
  const placedChips = chipViews.map((c, index) => {
    const slot = chipViews.filter((o, j) => o.target === c.target && o.visible && j < index).length;
    return {...c, box: chipBox(c, slot * (CHIP_H + 16))};
  });

  // Cards pinned beside a node: at the icon's middle for free icons, 24 px off the node.
  const cardViews = cards.map((c) => {
    const t0 = at(c.at);
    const t1 = c.until === undefined ? Infinity : at(c.until);
    const b = boxOf(c.target);
    const midY = b.form === 'free' ? b.y + tokens.icon.freePx / 2 : b.y + b.h / 2;
    const cx = b.x + b.w / 2;
    const side = c.side ?? 'right';
    const box: Box =
      side === 'right'
        ? {x: b.x + b.w + CARD_GAP, y: midY - c.h / 2, w: c.w, h: c.h}
        : side === 'left'
          ? {x: b.x - CARD_GAP - c.w, y: midY - c.h / 2, w: c.w, h: c.h}
          : side === 'above'
            ? {x: cx - c.w / 2, y: b.y - CARD_GAP - c.h, w: c.w, h: c.h}
            : {x: cx - c.w / 2, y: b.y + b.h + CARD_GAP, w: c.w, h: c.h};
    const visible = now >= t0 && now < t1 + dur.exit;
    const opacity = progressAt(now - t0) * (1 - progressAt(now - t1, dur.exit, ease.exit));
    return {...c, t0, t1, box, visible, opacity};
  });

  // Labeled capsules ride the line, so a label on the same edge moves out past the largest capsule.
  const capsuleHalf = ((PACKET_FONT + 16) / 2) * Math.max(1, readable / (PACKET_FONT * minZoom));
  const pillOf = (g: (typeof geo)[number]): Box | null => {
    if (!g.label) return null;
    const w = measure(g.label, type.connectorLabel, 500) + 28;
    const spot = labelSpot(g.pts);
    const carries = packets.some((pk) => pk.label && [`${pk.from}>${pk.to}`, `${pk.to}>${pk.from}`].includes(g.key));
    const off = L.connector.labelOffset + (carries ? capsuleHalf : 2);
    return spot.horizontal
      ? {x: spot.x - w / 2, y: spot.y - off - PILL_H, w, h: PILL_H}
      : {x: spot.x + off, y: spot.y - PILL_H / 2, w, h: PILL_H};
  };

  // Packets: constant speed, never overlapping node borders. A labeled capsule rides only the route's
  // longest straight segment (>= 260 px and room for the capsule), so it never covers a bend; else a dot.
  const kMax = Math.max(1, readable / (PACKET_FONT * minZoom));
  const packetAt = (pk: DiagramPacket, t: number, zoom: number) => {
    const {g, reverse} = edgeFor(pk.from, pk.to);
    const capW = pk.label ? measure(pk.label, PACKET_FONT, 700) + 28 + (pk.icon ? MAIL + 8 : 0) : 0;
    const seg = longestSegment(g.pts);
    const labeled = Boolean(pk.label) && seg.len >= Math.max(260, capW * kMax + 2 * END_CLEAR);
    const k = labeled ? Math.max(1, readable / (PACKET_FONT * zoom)) : 1; // keep labels readable on screen
    const since = t - at(pk.at);
    const length = labeled ? seg.len : g.length;
    const margin = labeled ? Math.min((capW * k) / 2 + END_CLEAR, length / 2) : DOT_INSET;
    const run = length - 2 * margin;
    const goal = run * (pk.park ?? 1);
    const s = travel(since, goal);
    const parked = pk.park !== undefined && since >= travelTime(goal);
    const along = margin + (s ?? (since < 0 ? 0 : goal));
    const [a, b] = reverse ? [seg.b, seg.a] : [seg.a, seg.b];
    const pos = labeled
      ? {x: a.x + ((b.x - a.x) * along) / length, y: a.y + ((b.y - a.y) * along) / length}
      : (getPointAtLength(g.d, reverse ? g.length - along : along) ?? {x: 0, y: 0});
    return {pos, since, moving: s !== null || parked, arrive: pk.park !== undefined ? Infinity : at(pk.at) + travelTime(run), labeled, capW, k, g, reverse, along};
  };

  // Camera. A shot frames its nodes, the label pills between them, and the chips and marker loops that
  // appear while the shot lasts: what it will show is centered and inside the stage, nothing more.
  const markerTimes = markers.map((m) => at(m.at));
  const markerEnd = (i: number) => (markers[i].until !== undefined ? at(markers[i].until!) : (markerTimes[i + 1] ?? Infinity));
  const targetsOf = (m: DiagramMarker) => (Array.isArray(m.target) ? m.target : [m.target]);
  /** A marker's target in canvas px: its nodes with their chips and cards (those shown, or `all`), or a connector. */
  const markerBox = (m: DiagramMarker, all = false, zoom = minZoom): Box => {
    const targets = targetsOf(m);
    if (m.kind === 'underline' && (targets.length > 1 || targets.some((t) => geo.some((e) => e.key === t)))) {
      throw new Error(`SystemDiagram: an underline goes under one node or chip, not "${targets.join(', ')}"`);
    }
    return union(
      targets.flatMap((t) => {
        const chip = placedChips.find((c) => c.id === t);
        if (chip) return [all ? chipBox(chip) : chip.box];
        const pk = packets.find((p) => p.id === t && p.park !== undefined);
        if (pk) {
          const {pos, labeled, capW, k} = packetAt(pk, Infinity, zoom);
          const [w, h] = labeled ? [capW * k, (PACKET_FONT + 16) * k] : [22, 22];
          return [{x: pos.x - w / 2, y: pos.y - h / 2, w, h}];
        }
        if (!boxes.has(t)) {
          const g = geo.find((e) => e.key === t);
          if (!g) throw new Error(`SystemDiagram: marker target "${t}" is not a node, edge, chip or parked packet`);
          const {a, b} = longestSegment(g.pts);
          // Stop short of the ends, so a mark on the connector stays off the nodes it joins.
          const seg = union([{...a, w: 0, h: 0}, {...b, w: 0, h: 0}]);
          const trim = (len: number) => Math.min(32, len / 4);
          const inner = seg.w >= seg.h ? {...seg, x: seg.x + trim(seg.w), w: seg.w - 2 * trim(seg.w)} : {...seg, y: seg.y + trim(seg.h), h: seg.h - 2 * trim(seg.h)};
          return [inflate(inner, 8), ...placedChips.filter((c) => c.target === t && (all || c.visible)).map((c) => (all ? chipBox(c) : c.box))];
        }
        return [
          boxOf(t),
          ...placedChips.filter((c) => c.target === t && (all || c.visible)).map((c) => (all ? chipBox(c) : c.box)),
          ...cardViews.filter((c) => c.target === t && (all || c.visible)).map((c) => c.box),
        ];
      }),
    );
  };
  const frameBox = (ids: string[], t0: number, t1: number) => {
    const set = new Set(ids);
    const linked = (g: (typeof geo)[number]) => set.has(g.from) && set.has(g.to);
    const during = (a: number, b: number) => a < t1 && b > t0;
    const shown = chipViews.filter((c) => (set.has(c.target) || geo.some((g) => g.key === c.target && linked(g))) && during(c.t0, c.t1));
    const pinned = cardViews.filter((c) => set.has(c.target) && during(c.t0, c.t1)).map((c) => c.box);
    const loops = markers.flatMap((m, i) =>
      (m.kind ?? 'circle') === 'circle' && targetsOf(m).some((t) => set.has(t)) && during(markerTimes[i], markerEnd(i))
        ? [markerLoopBounds(markerBox(m, true), MARKER_CLEAR, 'bounds')]
        : [],
    );
    const pills = geo.filter(linked).map(pillOf).filter((b): b is Box => b !== null);
    return inflate(union([...ids.map(boxOf), ...pills, ...shown.map((c) => chipBox(c)), ...pinned, ...loops]), FRAME_MARGIN);
  };
  const allIds = nodes.map((n) => n.id);
  const full = fit(frameBox(allIds, -Infinity, Infinity), stage, minZoom, Math.max(1, minZoom));
  if (full.fits < minZoom) {
    throw new Error(
      `SystemDiagram: the overview needs zoom ${full.fits.toFixed(2)} but ${smallest} px canvas text needs >= ${minZoom.toFixed(2)} ` +
        'to stay readable. Use fewer nodes, or move them closer.',
    );
  }
  // Nodes enter in groups: a chain of entries each within 0.5 s of the previous (a stagger) is one group.
  // The overview frames the groups that have started so far.
  const enters = [...new Set(nodes.map((n) => at(n.at ?? 0)))].sort((a, b) => a - b);
  const groups = enters.filter((t, i) => i === 0 || t - enters[i - 1] > 0.5);
  const groupStart = (t: number) => groups.filter((g) => g <= t).at(-1) ?? groups[0];
  const enteredBy = (t: number) =>
    nodes
      .filter((n) => groupStart(at(n.at ?? 0)) <= Math.max(t, groups[0], frameFrom) && (n.until === undefined || at(n.until) > t))
      .map((n) => n.id);
  const timeline = shots.map((s) => ({...s, t: at(s.at)})).sort((a, b) => a.t - b.t);
  // While the camera holds the overview, it re-frames (one camera move) when a new group enters.
  for (const t of groups.slice(1)) {
    const active = timeline.filter((s) => s.t <= t).at(-1);
    if (!active || 'overview' in active) timeline.push({at: t, overview: true, t, into: active && 'overview' in active ? active.into : undefined});
  }
  timeline.sort((a, b) => a.t - b.t);
  // Return to the overview ("master map") before the chapter ends, settled for a hold before the transition.
  const mapAt = scene.duration - dur.camera - dur.holdMin;
  const last = timeline.at(-1);
  if (Number.isFinite(mapAt) && last && !('overview' in last)) {
    timeline.push({at: mapAt, overview: true, t: Math.max(mapAt, last.t + dur.camera + dur.holdMin)});
  }
  const focusMin = Math.max(tokens.motion.camera.focusZoomMin, minZoom);
  const targetOf = (i: number, t: number): Camera => {
    const shot = timeline[i];
    const until = timeline[i + 1]?.t ?? Infinity;
    if ('focus' in shot) {
      const f = fit(frameBox(shot.focus, shot.t, until), stage, focusMin, tokens.motion.camera.focusZoomMax);
      return shot.zoom ? {...f, zoom: shot.zoom} : f;
    }
    if ('track' in shot) {
      const pk = packets.find((p) => p.id === shot.track);
      if (!pk) throw new Error(`SystemDiagram: no packet with id "${shot.track}" to track`);
      const zoom = shot.zoom ?? focusMin;
      const {pos} = packetAt(pk, t, zoom);
      return {cx: pos.x, cy: pos.y, zoom};
    }
    const into = shot.into ?? stage;
    const f = fit(frameBox(enteredBy(shot.t), shot.t, until), into, minZoom, Math.max(1, minZoom));
    // Offset the camera so the framed box lands at the sub-rect's center, not the stage's.
    return {...f, cx: f.cx - (into.x + into.w / 2 - stage.x - stage.w / 2) / f.zoom, cy: f.cy - (into.y + into.h / 2 - stage.y - stage.h / 2) / f.zoom};
  };
  const cameraAt = (t: number): Camera => {
    const i = timeline.filter((s) => s.t <= t).length - 1;
    if (i <= 0) return targetOf(0, t);
    const from = cameraAt(timeline[i].t - 1e-6);
    const to = targetOf(i, t);
    const p = progressAt(t - timeline[i].t, dur.camera, ease.standard);
    return {cx: from.cx + (to.cx - from.cx) * p, cy: from.cy + (to.cy - from.cy) * p, zoom: from.zoom + (to.zoom - from.zoom) * p};
  };
  const cam = cameraAt(now);
  const tx = stage.x + stage.w / 2 - cam.cx * cam.zoom;
  const ty = stage.y + stage.h / 2 - cam.cy * cam.zoom;
  // Text-bearing elements fade out as they cross the stage edge, so a shot never shows clipped text.
  const inView = (b: Box) => {
    const v = boxToScreen(b, cam, stage);
    const inset = Math.min(v.x - stage.x, v.y - stage.y, stage.x + stage.w - v.x - v.w, stage.y + stage.h - v.y - v.h);
    return Math.min(1, Math.max(0, 1 + inset / 12)) ** 2;
  };
  // A node with `until` fades out (exit) and takes its connectors, chips and cards with it.
  const nodeOut = (id: string) => {
    const until = nodes.find((n) => n.id === id)?.until;
    return until === undefined ? 1 : 1 - progressAt(now - at(until), dur.exit, ease.exit);
  };
  // A chip belongs to its node or connector: it never floats in shot on its own.
  const ownerVis = (target: string): number => {
    if (boxes.has(target)) return inView(boxOf(target)) * nodeOut(target);
    const g = geo.find((e) => e.key === target);
    return g ? edgeVis(g) : 1;
  };
  // A connector to a node outside the shot is hidden (no dangling stubs), unless a packet is riding it.
  const edgeVis = (g: (typeof geo)[number]) => {
    const busy = packets
      .filter((pk) => [`${pk.from}>${pk.to}`, `${pk.to}>${pk.from}`].includes(g.key))
      .map((pk) => {
        const info = packetAt(pk, now, cam.zoom);
        const outside = Math.max(-info.since, now - info.arrive, 0);
        return Math.max(0, 1 - outside / 0.3);
      });
    const out = g.exit === undefined ? 1 : 1 - progressAt(now - at(g.exit), dur.exit, ease.exit);
    return Math.min(Math.max(Math.min(inView(boxOf(g.from)), inView(boxOf(g.to))), ...busy), nodeOut(g.from), nodeOut(g.to), out);
  };

  const trail = (d: string, along: number, reverse: boolean, length: number, fill: string, key: string) =>
    [1, 2, 3, 4, 5].map((j) => {
      const back = along - j * (L.packet.trailPx / 5);
      if (back < 0) return null;
      const p = getPointAtLength(d, reverse ? length - back : back) ?? {x: 0, y: 0};
      return <circle key={`${key}-t${j}`} cx={p.x} cy={p.y} r={10 - j} fill={fill} opacity={0.5 - j * 0.09} />;
    });

  const mask = maskOf(stage);

  return {nodes, packets, markers, stage, now, at, fps, boxes, boxOf, geo, stateOf, strokeOf, placedChips, cardViews, pillOf, packetAt, markerTimes, markerEnd, markerBox, nodeOut, cam, tx, ty, inView, ownerVis, edgeVis, trail, mask, readable};
};

/** Feathered window inside the stage so pushed-in shots never spill into the title or sheet frame. */
const maskOf = (stage: Box) => {
  const feather = 16;
  return [
    `linear-gradient(to bottom, transparent ${stage.y}px, black ${stage.y + feather}px, black ${stage.y + stage.h - feather}px, transparent ${stage.y + stage.h}px)`,
    `linear-gradient(to right, transparent ${stage.x}px, black ${stage.x + feather}px, black ${stage.x + stage.w - feather}px, transparent ${stage.x + stage.w}px)`,
  ].join(', ');
};

/** Where a node is anchored for a glide: a free icon's center, or a box's center. */
const refOf = (b: Box & {form: NodeForm}): Point => ({x: b.x + b.w / 2, y: b.form === 'free' ? b.y + tokens.icon.freePx / 2 : b.y + b.h / 2});

/**
 * Shared-element morph into this chapter: the previous chapter at its last frame, which nodes and
 * connectors carry over, and this chapter's props retimed so carried elements are present from the start
 * (keeping their state color until the glide ends) and new ones sketch in after the glide.
 */
const morphFrom = (next: Props & {shape: Layout}, prev: NonNullable<ChapterLink['prev']>, cues: Record<string, number>, time: SceneTime) => {
  const before = buildModel(
    {...prev.diagram!, shape: next.shape},
    sceneTimeAt(cues, prev.scene, prev.scene.duration - 1 / time.fps, time.fps),
  );
  const {shared, sharedEdges} = carried(prev.diagram!, next, time.at);
  const keyOf = (e: DiagramEdge) => `${e.from}>${e.to}`;
  const {glideEnd} = morphTiming;
  const present = -10; // carried elements are already there when the chapter starts
  let entering = 0;
  const props: Props & {shape: Layout} = {
    ...next,
    // The camera frames the layout the glide lands in, including the nodes that sketch in right after it.
    frameFrom: Math.max(glideEnd + 0.5, next.frameFrom ?? -Infinity),
    nodes: next.nodes.map((n) =>
      shared.has(n.id) ? {...n, at: present} : {...n, at: Math.max(time.at(n.at ?? 0), glideEnd + dur.stagger * entering++)},
    ),
    // Cards and chips land with their nodes: drawn at their final spot mid-glide, they would sit on top of
    // the nodes still moving there.
    cards: (next.cards ?? []).map((c) => ({...c, at: Math.max(time.at(c.at), glideEnd)})),
    chips: (next.chips ?? []).map((c) => ({...c, at: Math.max(time.at(c.at), glideEnd)})),
    edges: (next.edges ?? []).map((e) =>
      sharedEdges.has(keyOf(e))
        ? {...e, at: present, labelAt: Math.max(time.at(e.labelAt ?? e.at ?? 0), glideEnd)}
        : {...e, at: Math.max(time.at(e.at ?? 0), glideEnd)},
    ),
    states: [
      ...[...shared, ...sharedEdges].flatMap((target) => {
        const state = before.stateOf(target).cur;
        return state === 'idle' ? [] : [{target, state, at: present}, {target, state: 'idle' as const, at: glideEnd}];
      }),
      ...(next.states ?? []),
    ],
  };
  return {props, before, shared};
};

const Diagram = (props: Props & {shape: Layout}) => {
  const {width, height} = useVideoConfig();
  const time = useSceneTime();
  const cues = useCues();
  const link = useChapterLink();
  const ghost = useGhost();
  const morph = !ghost && link.kind === 'morph' && link.prev?.diagram ? morphFrom(props, link.prev, cues, time) : null;
  const {nodes, packets, markers, stage, now, at, fps, boxOf, geo, stateOf, strokeOf, placedChips, cardViews, pillOf, packetAt, markerTimes, markerEnd, markerBox, nodeOut, cam, tx, ty, inView, ownerVis, edgeVis, trail, mask} = buildModel(morph ? morph.props : props, time);

  // A carried node glides in screen space from its spot in the previous chapter (position and zoom) to its
  // spot here; `map` carries canvas points along with it so its connectors stay attached.
  // While carried nodes glide in from the previous chapter's stage, the window spans both stages.
  const clip = morph && now < morphTiming.glideEnd ? maskOf(union([stage, morph.before.stage])) : mask;
  const glide = (id: string) => {
    if (!morph || !morph.shared.has(id) || now >= morphTiming.glideEnd) return null;
    const g = progressAt(now - morphTiming.exitEnd, dur.morph, ease.standard);
    const r = refOf(boxOf(id));
    const from = toScreen(refOf(morph.before.boxOf(id)), morph.before.cam, morph.before.stage);
    const to = toScreen(r, cam, stage);
    const zoom = morph.before.cam.zoom + (cam.zoom - morph.before.cam.zoom) * g;
    const cp = {
      x: (from.x + (to.x - from.x) * g - stage.x - stage.w / 2) / cam.zoom + cam.cx,
      y: (from.y + (to.y - from.y) * g - stage.y - stage.h / 2) / cam.zoom + cam.cy,
    };
    const k = zoom / cam.zoom;
    return {
      transform: `translate(${cp.x} ${cp.y}) scale(${k}) translate(${-r.x} ${-r.y})`,
      map: (p: Point) => ({x: cp.x + (p.x - r.x) * k, y: cp.y + (p.y - r.y) * k}),
    };
  };
  const routeOf = (g: (typeof geo)[number]) => {
    const [ga, gb] = [glide(g.from), glide(g.to)];
    if (!ga && !gb) return g.pts;
    const moved = (id: string, gl: ReturnType<typeof glide>) => {
      const a = boxOf(id).anchor;
      if (!gl) return a;
      const p0 = gl.map(a);
      const p1 = gl.map({x: a.x + a.w, y: a.y + a.h});
      return {x: p0.x, y: p0.y, w: p1.x - p0.x, h: p1.y - p0.y, cy: a.cy === undefined ? undefined : gl.map({x: a.x, y: a.cy}).y};
    };
    return routePoints(moved(g.from, ga), moved(g.to, gb), g.route);
  };
  const hiddenNode = (id: string) => ghost?.shared.has(id) ?? false;
  const hiddenEdge = (key: string) => ghost?.sharedEdges.has(key) ?? false;
  // Markers: one at a time, screen space, around the target plus its visible chips and cards.
  const marker = (() => {
    const i = markerTimes.filter((t) => t <= now).length - 1;
    if (i < 0) return null;
    const m = markers[i];
    const fade = 1 - progressAt(now - markerEnd(i), dur.markerFade, ease.exit);
    if (fade <= 0) return null;
    const obstacles = [
      ...nodes.filter((n) => nodeOut(n.id) > 0).map((n) => boxOf(n.id)),
      ...placedChips.filter((c) => c.visible).map((c) => c.box),
      ...cardViews.filter((c) => c.visible).map((c) => c.box),
      ...geo.map(pillOf).filter((b): b is Box => b !== null),
      ...geo.flatMap((g) => g.pts.slice(1).map((p, j) => union([{...g.pts[j], w: 0, h: 0}, {...p, w: 0, h: 0}]))),
      ...packets.flatMap((pk) => {
        const info = packetAt(pk, now, cam.zoom);
        if (!info.moving || info.since < 0) return [];
        const [w, h] = info.labeled ? [info.capW * info.k, (PACKET_FONT + 16) * info.k] : [22, 22];
        return [{x: info.pos.x - w / 2, y: info.pos.y - h / 2, w, h}];
      }),
    ].map((b) => inflate(boxToScreen(b, cam, stage), 8));
    const layout = markerLayout({
      kind: m.kind ?? 'circle',
      target: boxToScreen(markerBox(m, false, cam.zoom), cam, stage),
      note: m.note,
      side: m.side,
      key: `${String(m.target)}@${markerTimes[i]}`,
      bounds: stage,
      obstacles,
    });
    return <MarkerDrawing layout={layout} since={now - markerTimes[i]} fade={fade} />;
  })();

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{maskImage: clip, WebkitMaskImage: clip, maskComposite: 'intersect', WebkitMaskComposite: 'source-in'}}>
        <svg width={width} height={height}>
          <g transform={`translate(${tx} ${ty}) scale(${cam.zoom})`}>
            {geo.map((g) => {
              const since = now - at(g.at ?? 0);
              if (since < 0 || hiddenEdge(g.key)) return null;
              const p = progressAt(since, DRAW, ease.standard);
              const {stroke} = strokeOf(g.key);
              const pts = routeOf(g);
              const d = roundedPath(trimEnd(pts, L.connector.arrowhead * 0.8));
              const ev = evolvePath(p, d);
              const dashed = p >= 1 && g.dashed;
              const pill = pillOf(g);
              return (
                <g key={g.key} opacity={edgeVis(g)}>
                  <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={L.connector.stroke}
                    strokeLinecap="round"
                    strokeDasharray={dashed ? L.group.dash.join(' ') : ev.strokeDasharray}
                    strokeDashoffset={dashed ? 0 : ev.strokeDashoffset}
                  />
                  <polygon points={arrowhead(pts)} fill={stroke} opacity={progressAt(since - DRAW + 0.12, 0.12)} />
                  {pill ? (
                    <g opacity={progressAt(g.labelAt === undefined ? since - DRAW * 0.5 : now - at(g.labelAt), dur.enter) * inView(pill)}>
                      <rect x={pill.x} y={pill.y} width={pill.w} height={pill.h} rx={pill.h / 2} fill={color.night} />
                      <text
                        x={pill.x + pill.w / 2}
                        y={pill.y + pill.h / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={color.pencil}
                        fontFamily={font.ui}
                        fontWeight={500}
                        fontSize={type.connectorLabel}
                      >
                        {g.label}
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}

            {geo.map((g) => {
              // A stream's dots leave with the ghost even on a carried connector (the stroke itself carries over).
              if (g.rate === undefined) return null;
              const rate = g.rate;
              const start = at(g.at ?? 0) + DRAW;
              const end = Math.min(g.until === undefined ? Infinity : at(g.until), now);
              const rateAt = (t: number) => {
                if (typeof rate === 'number') return rate;
                if (Array.isArray(rate)) {
                  const i = rate.filter((r) => at(r.at) <= t).length - 1;
                  if (i < 0) return 0;
                  const from = i > 0 ? rate[i - 1].value : 0;
                  return interpolate(t, [at(rate[i].at), at(rate[i].at) + 1], [from, rate[i].value], {extrapolateRight: 'clamp'});
                }
                return interpolate(t, [at(rate.at), at(rate.at) + (rate.over ?? 2)], [rate.from, rate.to], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
              };
              const {cur} = stateOf(g.key);
              const dotColor = STATE_COLOR[cur === 'idle' ? 'active' : cur];
              const vis = edgeVis(g);
              return emissions(start, end, rateAt, fps).map((t0) => {
                const run = travel(now - t0, g.length - 2 * DOT_INSET);
                if (run === null) return null;
                const s = run + DOT_INSET;
                const p = getPointAtLength(g.d, s) ?? {x: 0, y: 0};
                return (
                  <g key={`${g.key}@${t0}`} opacity={vis}>
                    {trail(g.d, s, false, g.length, dotColor, `${g.key}@${t0}`)}
                    <circle cx={p.x} cy={p.y} r={11} fill={dotColor} />
                  </g>
                );
              });
            })}

            {nodes.map((n) => {
              if (hiddenNode(n.id) || nodeOut(n.id) <= 0) return null;
              const b = boxOf(n.id);
              const since = now - at(n.at ?? 0);
              const {stroke, cur, prev, mix} = strokeOf(n.id);
              const lit = cur === 'active' || cur === 'hot';
              // The slow 2 s pulse is reserved for an overloaded node.
              const pulse = cur === 'hot' ? 0.75 + 0.25 * Math.sin((2 * Math.PI * now * 1000) / tokens.motion.overloadPulsePeriodMs) : 1;
              const glowStyle = lit ? {filter: glow(stroke, mix * pulse)} : undefined;
              // Icons sketch in (strokes draw on), then the label fades in; a box fades in with its icon.
              const sketch = progressAt(since, tokens.icon.sketchInMs / 1000, ease.standard);
              const labelIn = n.kind ? progressAt(since - (tokens.icon.sketchInMs + tokens.icon.labelDelayMs) / 1000, dur.emphasis, ease.standard) : 1;
              const boxIn = progressAt(since);
              // Idle icons are chalk; an active node's icon takes its state color.
              const iconOf = (st: NodeState) => (st === 'idle' || st === 'dim' ? color.chalk : STATE_COLOR[st]);
              const iconColor = interpolateColors(mix, [0, 1], [iconOf(prev), iconOf(cur)]);
              const lineH = type.nodeLabel * 1.15;
              const free = b.form === 'free';
              const iconSize = free ? tokens.icon.freePx : tokens.icon.inNodePx;
              const icon = n.kind
                ? {
                    x: free || b.form === 'stacked' ? b.x + b.w / 2 - iconSize / 2 : b.x + (b.w - (iconSize + tokens.icon.gapToLabelPx + b.textW)) / 2,
                    y: free ? b.y : b.form === 'stacked' ? b.y + (b.h - (iconSize + 12 + b.lines.length * lineH)) / 2 : b.y + b.h / 2 - iconSize / 2,
                  }
                : null;
              // Label block: under a free or stacked icon, right of a boxed icon, or centered in a plain box.
              const block = b.lines.length * lineH + (n.sub ? type.note * 1.15 + 4 : 0);
              const textTop =
                free ? b.y + iconSize + tokens.icon.freeLabelGapPx
                : b.form === 'stacked' ? icon!.y + iconSize + 12
                : b.y + b.h / 2 - block / 2;
              const textX = b.form === 'boxed' ? icon!.x + iconSize + tokens.icon.gapToLabelPx : b.x + b.w / 2;
              const anchor = b.form === 'boxed' ? 'start' : 'middle';
              const iconBox = icon ? {x: icon.x, y: icon.y, w: iconSize, h: iconSize} : b;
              const arrivals = packets
                .map((pk) => ({pk, info: packetAt(pk, now, cam.zoom)}))
                .filter(({pk, info}) => pk.to === n.id && info.labeled && now >= info.arrive && now < info.arrive + dur.arrivalPulse);
              return (
                <g
                  key={n.id}
                  opacity={inView(b) * nodeOut(n.id) * (1 - 0.5 * (cur === 'dim' ? mix : prev === 'dim' ? 1 - mix : 0))}
                  transform={glide(n.id)?.transform}
                >
                  {free ? null : (
                    <rect
                      x={b.x}
                      y={b.y}
                      width={b.w}
                      height={b.h}
                      rx={L.node.radius}
                      fill={color.raised}
                      stroke={stroke}
                      strokeWidth={L.node.stroke}
                      opacity={boxIn}
                      style={glowStyle}
                    />
                  )}
                  {n.kind && icon ? (
                    <Icon
                      kind={n.kind}
                      x={icon.x}
                      y={icon.y}
                      size={iconSize}
                      color={iconColor}
                      strokeWidth={free ? tokens.icon.strokeWidth.free : tokens.icon.strokeWidth.inNode}
                      progress={sketch}
                      style={free ? glowStyle : undefined}
                    />
                  ) : null}
                  <g opacity={labelIn * boxIn}>
                    {b.lines.map((l, i) => (
                      <text
                        key={l}
                        x={textX}
                        y={textTop + (i + 0.5) * lineH}
                        textAnchor={anchor}
                        dominantBaseline="central"
                        fill={color.chalk}
                        fontFamily={font.ui}
                        fontWeight={600}
                        fontSize={type.nodeLabel}
                      >
                        {l}
                      </text>
                    ))}
                    {n.sub ? (
                      <text
                        x={textX}
                        y={textTop + b.lines.length * lineH + 4 + (type.note * 1.15) / 2}
                        textAnchor={anchor}
                        dominantBaseline="central"
                        fill={color.pencil}
                        fontFamily={font.ui}
                        fontWeight={500}
                        fontSize={type.note}
                      >
                        {n.sub}
                      </text>
                    ) : null}
                  </g>
                  {arrivals.map(({pk, info}) => {
                    const q = (now - info.arrive) / dur.arrivalPulse;
                    const r = inflate(free ? iconBox : b, 4 + 10 * q);
                    return (
                      <rect
                        key={`${pk.label}@${String(pk.at)}`}
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={r.h}
                        rx={free ? r.w / 2 : L.node.radius + 6}
                        fill="none"
                        stroke={toneColor[pk.tone ?? 'cobalt']}
                        strokeWidth={3}
                        opacity={0.7 * (1 - q)}
                      />
                    );
                  })}
                </g>
              );
            })}

            {placedChips.map((c, i) =>
              c.visible ? (
                <g key={`${c.target}#${i}`} opacity={c.opacity * inView(c.box) * ownerVis(c.target)} transform={`translate(0 ${(1 - progressAt(now - at(c.at))) * tokens.motion.enterRisePx})`}>
                  {c.tone === 'note' ? null : (
                    <rect
                      x={c.box.x}
                      y={c.box.y}
                      width={c.box.w}
                      height={CHIP_H}
                      rx={CHIP_H / 2}
                      fill={c.fill}
                      stroke={c.tone === 'neutral' ? color.graphite : undefined}
                      strokeWidth={2}
                    />
                  )}
                  {c.icon === 'check' || c.icon === 'cross' ? (
                    <path
                      d={
                        c.icon === 'check'
                          ? `M ${c.box.x + CHIP_PAD + 2} ${c.box.y + 30} l 8 9 l 15 -18`
                          : `M ${c.box.x + CHIP_PAD + 3} ${c.box.y + 20} l 18 18 m 0 -18 l -18 18`
                      }
                      fill="none"
                      stroke={color.onSignal}
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : c.icon ? (
                    <Icon kind={c.icon} x={c.box.x + CHIP_PAD - 2} y={c.box.y + (CHIP_H - 30) / 2} size={30} color={color.onSignal} strokeWidth={2.2} />
                  ) : null}
                  <text
                    x={c.box.x + (c.icon ? CHIP_ICON : 0) + (c.box.w - (c.icon ? CHIP_ICON : 0)) / 2}
                    y={c.box.y + CHIP_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={c.tone === 'neutral' || c.tone === 'note' ? color.pencil : color.onSignal}
                    fontFamily={font.ui}
                    fontWeight={c.tone === 'note' ? 500 : 700}
                    fontSize={type.chip}
                    letterSpacing="0.02em"
                    style={{fontVariantNumeric: 'tabular-nums'}}
                  >
                    {c.text}
                  </text>
                </g>
              ) : null,
            )}

            {cardViews.map((c, i) =>
              c.visible ? (
                <foreignObject
                  key={`card${i}`}
                  x={c.box.x}
                  y={c.box.y}
                  width={c.box.w}
                  height={c.box.h}
                  opacity={c.opacity * inView(c.box) * ownerVis(c.target)}
                >
                  <div style={{width: c.box.w, height: c.box.h}}>{c.content}</div>
                </foreignObject>
              ) : null,
            )}

            {packets.map((pk, i) => {
              const info = packetAt(pk, now, cam.zoom);
              if (hiddenEdge(info.g.key)) return null;
              const after = now - info.arrive;
              if (!info.moving && !(after >= 0 && after < 0.15)) return null;
              const fill = toneColor[pk.tone ?? 'cobalt'];
              // `until` stops a packet mid-flight (it fades where it is).
              const stopped = pk.until === undefined ? 1 : 1 - progressAt(now - at(pk.until), dur.exit, ease.exit);
              if (stopped <= 0) return null;
              const opacity = (info.moving ? Math.min(1, info.since / 0.12) : 1 - after / 0.15) * stopped * edgeVis(info.g);
              if (!info.labeled) {
                return (
                  <g key={i} opacity={opacity}>
                    {trail(info.g.d, info.along, info.reverse, info.g.length, fill, `p${i}`)}
                    <circle cx={info.pos.x} cy={info.pos.y} r={11} fill={fill} />
                  </g>
                );
              }
              const h = PACKET_FONT + 16;
              return (
                <g
                  key={i}
                  opacity={opacity * inView({x: info.pos.x - (info.capW * info.k) / 2, y: info.pos.y - (h * info.k) / 2, w: info.capW * info.k, h: h * info.k})}
                  transform={`translate(${info.pos.x} ${info.pos.y}) scale(${info.k})`}
                >
                  <rect x={-info.capW / 2} y={-h / 2} width={info.capW} height={h} rx={h / 2} fill={fill} />
                  {pk.icon ? <Icon kind="message" x={-info.capW / 2 + 14} y={-MAIL / 2} size={MAIL} color={color.onSignal} strokeWidth={2.2} /> : null}
                  <text
                    x={pk.icon ? (MAIL + 8) / 2 : 0}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={color.onSignal}
                    fontFamily={font.ui}
                    fontWeight={700}
                    fontSize={PACKET_FONT}
                  >
                    {pk.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        {marker}
      </svg>
    </AbsoluteFill>
  );
};
