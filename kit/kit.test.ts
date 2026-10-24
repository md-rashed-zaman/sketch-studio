import {describe, expect, it} from 'vitest';
import {resolveAt} from './motion/cues';
import {emissions, fit, markerLoop, markerLoopBounds, nodeAnchor, nodeSize, routePoints, travel, travelTime, wrapLabel, type Box} from './diagram/geometry';
import {iconShapes, isFreeStanding, nodeForm, type IconKind} from './diagram/icons';
import {dur, tokens} from './theme';
import {carried, transitionKind} from './frame/transition';
import {victimOf} from './explain/eviction';
import {codeRowTops, typedText} from './explain/CodeCard';
import {captionPages} from './frame/ShortsCaptions';
import {markerLayout} from './frame/Marker';

const clock = {cues: {app: 12.5}, scene: {id: 's', index: 0, count: 1, start: 10, duration: 20}};

describe('resolveAt', () => {
  it('maps cue names (with optional +offset) to scene-relative seconds', () => {
    expect(resolveAt('app', clock)).toBe(2.5);
    expect(resolveAt('app+1.2', clock)).toBeCloseTo(3.7);
    expect(resolveAt(1.2, clock)).toBe(1.2);
  });
  it('fails loudly on a cue missing from timing.json', () => {
    expect(() => resolveAt('nope+1', clock)).toThrow(/Unknown cue "nope"/);
  });
});

describe('packets', () => {
  it('stream emits immediately, then at the given rate', () => {
    expect(emissions(1, 3, () => 2, 30)).toHaveLength(5);
  });
  it('travel at 650 px/s with eased ends, arriving exactly at the end', () => {
    const t = travelTime(650);
    expect(travel(-0.01, 650)).toBeNull();
    expect(travel(t, 650)).toBeCloseTo(650);
    expect(travel(t / 2, 650)).toBeCloseTo(325);
    expect(travel(t + 0.01, 650)).toBeNull();
  });
});

describe('nodes and routes', () => {
  it('sizes nodes from the tokens: label + 2x40 px, min 280 x 140, a boxed icon adds 56 + 20 px', () => {
    expect(nodeSize(100, 1, false)).toEqual({w: 280, h: 140});
    expect(nodeSize(301, 1, false).w).toBe(384);
    expect(nodeSize(200, 2, false).h).toBeGreaterThan(140);
    expect(nodeSize(200, 1, false, 'boxed').w).toBe(360);
    expect(nodeSize(80, 1, false, 'free')).toEqual({w: 104, h: 104 + 6 + 44 * 1.15});
  });
  it('attaches connectors to a free icon 24 px out, sides at the icon center, never the label', () => {
    const extent = {x: 0, y: 0, w: 104, h: 160.6};
    const a = nodeAnchor(extent, 'free');
    expect(a).toMatchObject({x: -24, y: -24, w: 152, cy: 52});
    expect(a.y + a.h).toBeCloseTo(extent.h + 24);
    const [start] = routePoints(a, {x: 500, y: 0, w: 280, h: 104});
    expect(start).toEqual({x: 128, y: 52});
    const [down] = routePoints(a, {x: -98, y: 500, w: 300, h: 140});
    expect(down.y).toBeCloseTo(extent.h + 24);
  });
  it('wraps labels over 14 characters at the middle space', () => {
    expect(wrapLabel('Load balancer')).toEqual(['Load balancer']);
    expect(wrapLabel('Primary database node')).toEqual(['Primary', 'database node']);
  });
  it('routes border to border: straight when aligned, Z otherwise', () => {
    const a: Box = {x: 0, y: 0, w: 300, h: 140};
    expect(routePoints(a, {x: 600, y: 0, w: 300, h: 140})).toEqual([
      {x: 300, y: 70},
      {x: 600, y: 70},
    ]);
    const z = routePoints(a, {x: 600, y: 400, w: 300, h: 140});
    expect(z).toHaveLength(4);
    expect(z[0]).toEqual({x: 300, y: 70});
    expect(z[3]).toEqual({x: 600, y: 470});
    // An L route to a target right below falls back to the straight route.
    expect(routePoints(a, {x: 0, y: 400, w: 300, h: 140}, 'vh')).toEqual([{x: 150, y: 140}, {x: 150, y: 400}]);
  });
});

describe('camera and marker', () => {
  it('fits a box into the stage within the zoom limits', () => {
    const stage = {x: 0, y: 0, w: 1000, h: 500};
    expect(fit({x: 0, y: 0, w: 2000, h: 100}, stage, 1, 2).zoom).toBe(1);
    expect(fit({x: 0, y: 0, w: 400, h: 100}, stage, 1.4, 2).zoom).toBe(2);
  });
  it('draws the marker loop at least 28 px clear of its target', () => {
    const box = {x: 100, y: 100, w: 600, h: 260};
    const d = markerLoop(box, 28, 'k');
    const ends = d.split('C').map((chunk) => chunk.trim().split(/[\sM]+/).filter(Boolean).slice(-2).map(Number));
    for (const [x, y] of ends) {
      const dx = Math.max(box.x - x, 0, x - (box.x + box.w));
      const dy = Math.max(box.y - y, 0, y - (box.y + box.h));
      expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(27);
    }
  });
  it('refuses an underline under something wide (it would point at nothing)', () => {
    const bounds = {x: 0, y: 0, w: 1920, h: 1080};
    expect(() => markerLayout({kind: 'underline', target: {x: 100, y: 100, w: 900, h: 40}, key: 'k', bounds})).toThrow(/points at nothing/);
    expect(() => markerLayout({kind: 'underline', target: {x: 100, y: 100, w: 200, h: 40}, key: 'k', bounds})).not.toThrow();
  });
  it('keeps the loop snug around a wide target', () => {
    const box = {x: 0, y: 0, w: 1200, h: 120};
    const b = markerLoopBounds(box, 28, 'k');
    expect(b.x).toBeGreaterThan(-120);
    expect(b.x + b.w).toBeLessThan(1320);
  });
});

describe('Shorts captions', () => {
  const word = (text: string, startMs: number) => ({text, startMs, endMs: startMs + 200, timestampMs: startMs, confidence: null});
  it('pages hold at most 4 words and break after punctuation', () => {
    const pages = captionPages([word('One', 0), word(' two.', 250), word(' Three', 500), word(' four', 750), word(' five', 1000), word(' six', 1250), word(' seven', 1500)]);
    expect(pages.map((p) => p.words.length)).toEqual([2, 4, 1]);
  });
});

describe('iconography', () => {
  it('maps every component kind to a Lucide glyph', () => {
    for (const kind of Object.keys(tokens.icon.map) as IconKind[]) expect(iconShapes(kind).length).toBeGreaterThan(0);
  });
  it('stands actors and stores free, boxes services, stacks services in Shorts, plain without a kind', () => {
    expect(isFreeStanding('cache')).toBe(true);
    expect(nodeForm('database', '16:9')).toBe('free');
    expect(nodeForm('service', '16:9')).toBe('boxed');
    expect(nodeForm('loadBalancer', '9:16')).toBe('stacked');
    expect(nodeForm('users', '9:16')).toBe('free');
    expect(nodeForm(undefined, '16:9')).toBe('plain');
  });
});

describe('chapter transitions', () => {
  it('morphs when the next chapter reuses a node id, pans when nothing is shared, none for the first', () => {
    expect(transitionKind(null, ['app'])).toBe('none');
    expect(transitionKind(['users', 'app', 'db'], ['app', 'cache', 'db'])).toBe('morph');
    expect(transitionKind(['gateway', 'service'], ['cache'])).toBe('pan');
    expect(transitionKind(['app'], [])).toBe('pan'); // e.g. into a title card
  });
  it('carries shared nodes and the connectors between them that already existed', () => {
    const prev = {nodes: [{id: 'users', label: 'U', x: 0, y: 0}, {id: 'app', label: 'A', x: 0, y: 0}, {id: 'db', label: 'D', x: 0, y: 0}], edges: [{from: 'users', to: 'app'}, {from: 'app', to: 'db'}]};
    const next = {nodes: [{id: 'app', label: 'A', x: 0, y: 0}, {id: 'db', label: 'D', x: 0, y: 0}, {id: 'cache', label: 'C', x: 0, y: 0}], edges: [{from: 'app', to: 'db'}, {from: 'app', to: 'cache'}]};
    const {shared, sharedEdges} = carried(prev, next);
    expect([...shared]).toEqual(['app', 'db']);
    expect([...sharedEdges]).toEqual(['app>db']);
  });
});

describe('eviction policies', () => {
  const slots = [
    {key: 'user:7', lastUsed: 2, hits: 90, order: 1},
    {key: 'user:3', lastUsed: 40, hits: 12, order: 2},
    {key: '/home', lastUsed: 1, hits: 55, order: 3},
    {key: 'user:42', lastUsed: 8, hits: 3, order: 4},
  ];
  it('LRU evicts the least recently used, LFU the least used, FIFO the oldest insert', () => {
    expect(victimOf(slots, 'lru')).toBe(1);
    expect(victimOf(slots, 'lfu')).toBe(3);
    expect(victimOf(slots, 'fifo')).toBe(0); // even though it is the hottest key
  });
});

describe('code card', () => {
  it('types a line over drawMax and keeps fixed rows until an inserted line opens', () => {
    expect(typedText('user = cache.get(id)', 0)).toBe('');
    expect(typedText('user = cache.get(id)', 10)).toBe('user = cache.get(id)');
    const half = typedText('abcd', dur.drawMax / 2);
    expect(half).toBe('ab');
    const line = tokens.type.code * tokens.type.codeLineHeight;
    const lines = [{insert: true}, {}, {}];
    expect(codeRowTops(lines, () => 0)).toEqual([0, 0, line]);
    expect(codeRowTops(lines, () => 1)).toEqual([0, line, 2 * line]);
  });
});
