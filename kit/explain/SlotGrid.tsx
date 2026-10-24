import {color, dur, ease, font, toneText, type} from '../theme';
import {progressAt, useSceneTime, type At} from '../motion/cues';
import {policyLabel, victimOf, type Policy, type Slot} from './eviction';

const W = 260;
const H = 170;
const G = 24;
const SIDE = 140;

/** Screen boxes of the 3 x 2 slots, the waiting new key (left) and the evicted tray (right). */
export const slotGridLayout = ({x, y}: {x: number; y: number}) => {
  const slots = Array.from({length: 6}, (_, i) => ({x: x + (i % 3) * (W + G), y: y + Math.floor(i / 3) * (H + G), w: W, h: H}));
  const midY = y + (H + G) / 2;
  return {
    slots,
    waiting: {x: x - SIDE - W, y: midY, w: W, h: H},
    tray: {x: x + 3 * W + 2 * G + SIDE, y: midY, w: W, h: H},
    grid: {x, y, w: 3 * W + 2 * G, h: 2 * H + G},
  };
};

/** A phase without `evictAt` only puts the previous eviction back. */
export type EvictionPhase = {policy: Policy; at: At; evictAt?: At};

/**
 * A full cache of six slots. Slots fill on `fillAt` (staggered); each phase shows the fact its policy
 * looks at under every key, evicts the policy's victim to the tray on `evictAt` and moves the waiting key
 * into its place; the next phase first puts both back, so every policy starts from the same cache.
 */
export const SlotGrid = ({
  x,
  y,
  slots,
  fillAt,
  incoming,
  phases,
}: {
  x: number;
  y: number;
  slots: Slot[];
  fillAt: At;
  incoming: {key: string; at: At};
  phases: EvictionPhase[];
}) => {
  const {now, at} = useSceneTime();
  const L = slotGridLayout({x, y});
  const idx = phases.filter((p) => at(p.at) <= now).length - 1;
  const phase = idx >= 0 ? phases[idx] : null;
  const move = (t: number) => progressAt(now - t, dur.enter + 0.1, ease.standard);
  // This phase's eviction, and the previous phase's being undone as this one starts.
  const out = phase?.evictAt !== undefined ? {victim: victimOf(slots, phase.policy), p: move(at(phase.evictAt))} : null;
  const undo = idx > 0 ? {victim: victimOf(slots, phases[idx - 1].policy), p: 1 - move(at(phase!.at))} : null;
  // A card changes place by fading out where it was and back in where it goes, so it never slides over
  // the other cards.
  const hop = <T,>(from: T, to: T, p: number) => [
    {pos: from, o: 1 - Math.min(1, 2 * p), at: 'from'},
    {pos: to, o: Math.max(0, 2 * p - 1), at: 'to'},
  ];
  const evicted = out && out.p > 0 ? out : undo && undo.p > 0 ? undo : null;
  const card = (id: string, key: string, label: string, pos: {x: number; y: number}, opacity: number, accent: string, dashed = false) => (
    <div
      key={id}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: W,
        height: H,
        boxSizing: 'border-box',
        borderRadius: 20,
        background: color.raised,
        border: `3px ${dashed ? 'dashed' : 'solid'} ${accent}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        opacity,
      }}
    >
      <div style={{fontFamily: font.code, fontWeight: 500, fontSize: type.code, color: color.chalk}}>{key}</div>
      {label ? <div style={{fontFamily: font.ui, fontWeight: 500, fontSize: type.chip, color: color.pencil}}>{label}</div> : null}
    </div>
  );
  const inP = progressAt(now - at(incoming.at));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: L.waiting.x, top: L.waiting.y - 56, fontFamily: font.ui, fontWeight: 500, fontSize: type.chip, color: color.pencil, opacity: inP * (1 - (evicted?.p ?? 0))}}>
        new
      </div>
      {/* The empty tray says what it is for; the label sits inside, so a marker loop around the evicted
          card has nothing to cross. */}
      <div
        style={{
          position: 'absolute',
          left: L.tray.x,
          top: L.tray.y,
          width: W,
          height: H,
          boxSizing: 'border-box',
          borderRadius: 20,
          border: `2px dashed ${color.graphite}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: font.ui,
          fontWeight: 500,
          fontSize: type.chip,
          color: color.pencil,
          opacity: phase ? progressAt(now - at(phase.at)) : 0,
        }}
      >
        <span style={{opacity: 1 - Math.min(1, 2 * (evicted?.p ?? 0))}}>evicted</span>
      </div>
      {slots.map((s, i) => {
        const p = progressAt(now - at(fillAt) - i * dur.stagger * 2);
        const gone = evicted && evicted.victim === i ? evicted.p : 0;
        const label = phase ? policyLabel(s, phase.policy) : '';
        return hop(L.slots[i], L.tray, gone).map((h) =>
          h.o > 0 ? card(`${s.key}-${h.at}`, s.key, label, h.pos, p * h.o, h.at === 'to' ? toneText.coral : color.graphite) : null,
        );
      })}
      {hop(L.waiting, evicted ? L.slots[evicted.victim] : L.waiting, evicted?.p ?? 0).map((h) =>
        h.o > 0 ? card(`${incoming.key}-${h.at}`, incoming.key, h.at === 'to' ? 'just added' : '', h.pos, inP * h.o, toneText.cobalt, h.at === 'from') : null,
      )}
    </div>
  );
};
