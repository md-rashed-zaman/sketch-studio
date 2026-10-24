import {
  Badge,
  Checklist,
  CodeLine,
  Em,
  Episode,
  KeyValueCard,
  LatencyBars,
  latencyBarEnd,
  Marker,
  SlotGrid,
  Tabs,
  TtlTimeline,
  HeroNumber,
  LoadMeter,
  PaperCard,
  SheetFrame,
  stageArea,
  useLayout,
  type Chapter,
  type DiagramNode,
  type DiagramProps,
  type IconKind,
  type Layout,
  type Timing,
} from '../kit';

// Synthetic timing: the gallery exercises named cues, chapters and Shorts captions without an audio file.
const line = 'Every component in the kit, driven by cues. Nodes enter, packets move and markers draw on the spoken word.';
export const galleryTiming: Timing = {
  duration: 82,
  scenes: {title: [0, 4], system: [4, 17], routes: [17, 34], stores: [34, 42], services: [42, 50], data: [50, 58], explain: [58, 70], evict: [70, 82]},
  cues: {traffic: 7.6, melt: 10.2, circle: 12, hit: 21.9},
  captions: line.split(' ').map((word, i) => ({
    text: i === 0 ? word : ` ${word}`,
    startMs: 4500 + i * 420,
    endMs: 4500 + i * 420 + 380,
    timestampMs: null,
    confidence: null,
  })),
};

// Transitions the gallery exercises: title -> system pans (nothing shared); system -> routes morphs (App and
// Postgres carry over); routes -> stores morphs (Cache); stores -> services and services -> data pan.

const title: Chapter = {titleCard: {hero: 'Night Paper', note: 'The System Sketch Lab kit'}, chapter: 'KIT GALLERY'};

// Chapter 2: the styleboard scene. Node states, counters, dot streams, a marker, the load meter.
const LoadHud = () => {
  const portrait = useLayout() === '9:16';
  const stage = stageArea[portrait ? '9:16' : '16:9'];
  return portrait ? null : (
    <LoadMeter
      at={1.4}
      capacity={3000}
      steps={[
        {at: 1.4, value: 300},
        {at: 'traffic', value: 2400},
      ]}
      style={{position: 'absolute', left: stage.x, width: stage.w, top: stage.y + stage.h - 96}}
    />
  );
};
const system: Chapter = {
  title: (
    <>
      <Em tone="coral">Postgres</Em> melts first
    </>
  ),
  hud: LoadHud,
  diagram: (layout: Layout): DiagramProps => {
    const portrait = layout === '9:16';
    const stream = {rate: {from: 2, to: 8, at: 'traffic'}, until: 'circle'};
    return {
      nodes: portrait
        ? [
            {id: 'app', label: 'App', kind: 'service', x: 0, y: 0, at: 0.3},
            {id: 'db', label: 'Postgres', kind: 'database', x: 0, y: 270, at: 0.36},
          ]
        : [
            {id: 'users', label: 'Users', kind: 'users', x: 60, y: 0, at: 0.3},
            {id: 'lb', label: 'Load balancer', kind: 'loadBalancer', x: 479, y: 0, at: 0.36},
            {id: 'app', label: 'App', kind: 'service', x: 962, y: 0, at: 0.42},
            {id: 'db', label: 'Postgres', kind: 'database', x: 1298, y: 0, at: 0.48},
          ],
      edges: portrait
        ? [{from: 'app', to: 'db', at: 1, ...stream}]
        : [
            {from: 'users', to: 'lb', at: 1, ...stream},
            {from: 'lb', to: 'app', at: 1.1, ...stream},
            {from: 'app', to: 'db', at: 1.2, ...stream},
          ],
      states: [
        ...(portrait ? [] : [{target: 'lb', state: 'active' as const, at: 2.4}]),
        {target: 'app', state: 'active', at: 2.4},
        {target: 'db', state: 'hot', at: 'melt'},
      ],
      // Shorts: a chip (38 px) would need more zoom than two stacked nodes allow; the note carries the words.
      chips: portrait
        ? []
        : [
            {target: 'lb', at: 2.4, counter: {steps: [{at: 2.4, value: 300}, {at: 'traffic', value: 2400}], unit: ' req/s'}, tone: 'mint'},
            {target: 'db', at: 'melt', counter: {steps: [{at: 'melt', value: 9}, {at: 'melt+0.4', value: 840}], prefix: 'p99 ', unit: ' ms', threshold: 200}},
          ],
      markers: [
        portrait
          ? {at: 'circle', target: 'db', kind: 'underline', note: 'melts first', side: 'below'}
          : {at: 'circle', target: 'db', note: 'this melts first'},
      ],
    };
  },
};

// Chapter 3: a flow shot. Routed connectors with label pills, labeled packets, camera focus and track.
const routes: Chapter = {
  title: 'Routes and packets',
  diagram: (layout: Layout): DiagramProps =>
    layout === '9:16'
      ? {
          nodes: [
            {id: 'app', label: 'App', kind: 'service', x: 0, y: 0, at: 0.3},
            {id: 'cache', label: 'Cache', kind: 'cache', x: 0, y: 300, at: 0.36},
          ],
          edges: [{from: 'app', to: 'cache', at: 0.8}],
          packets: [
            {from: 'app', to: 'cache', at: 3, tone: 'cobalt'},
            {from: 'cache', to: 'app', at: 'hit', tone: 'mint'},
          ],
          markers: [{at: 'hit+1.5', target: 'cache', kind: 'underline', note: 'cache hit', side: 'below'}],
        }
      : {
          nodes: [
            {id: 'app', label: 'App', kind: 'service', x: 0, y: 0, at: 0.3},
            {id: 'cache', label: 'Cache', kind: 'cache', x: 760, y: -190, at: 0.36},
            {id: 'db', label: 'Postgres', kind: 'database', x: 760, y: 190, at: 0.42},
          ],
          edges: [
            {from: 'app', to: 'cache', at: 0.8, route: 'vh', label: 'read'},
            {from: 'app', to: 'db', at: 0.9, route: 'vh', label: 'on miss', dashed: true},
          ],
          packets: [
            {from: 'app', to: 'cache', at: 3.4, label: 'GET user:42'},
            {from: 'cache', to: 'app', at: 'hit', label: 'user:42', tone: 'mint'},
            {from: 'app', to: 'db', at: 9, label: 'GET user:88', id: 'q3'},
          ],
          states: [
            {target: 'app>cache', state: 'active', at: 3.4},
            {target: 'app>cache', state: 'idle', at: 7.6},
            {target: 'app>db', state: 'active', at: 9},
            {target: 'db', state: 'ok', at: 11.2},
          ],
          chips: [
            {target: 'cache', at: 'hit', until: 7.6, text: 'HIT', tone: 'mint', icon: 'check'},
            {target: 'db', at: 11.2, text: '200 OK', tone: 'mint', icon: 'check'},
          ],
          markers: [
            {at: 'hit+1.4', until: 7.6, target: 'cache', kind: 'arrow', note: 'a copy in RAM', side: 'below'},
            {at: 12.6, target: 'db', note: 'source of truth', side: 'above'},
          ],
          shots: [
            {at: 0, overview: true},
            {at: 2, focus: ['app', 'cache']},
            {at: 7.6, overview: true},
            {at: 9, track: 'q3', zoom: 1.5},
            {at: 11, overview: true},
          ],
        },
};

// Chapter 4: every free-standing kind (actors and data stores), sketching in one after another.
const free: [IconKind, string][] = [
  ['user', 'User'],
  ['users', 'Users'],
  ['client', 'Client'],
  ['internet', 'Internet'],
  ['cdn', 'CDN'],
  ['document', 'File'],
  ['cache', 'Cache'],
  ['database', 'Database'],
  ['storage', 'Storage'],
  ['queue', 'Queue'],
  ['search', 'Search'],
];
const stores: Chapter = {
  title: 'Actors and stores',
  diagram: (layout: Layout): DiagramProps => {
    const portrait = layout === '9:16';
    // Shorts show six in a 3 x 2 grid; 16:9 shows all eleven in rows of 6 and 5.
    const shown = portrait ? free.filter(([k]) => ['users', 'client', 'cdn', 'cache', 'database', 'queue'].includes(k)) : free;
    const perRow = portrait ? 3 : 6;
    const nodes: DiagramNode[] = shown.map(([kind, label], i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, shown.length - row * perRow);
      const spacing = portrait ? 250 : row === 0 ? 280 : 320;
      return {id: kind, kind, label, x: (i % perRow - (inRow - 1) / 2) * spacing, y: row * (portrait ? 290 : 380), at: 0.3 + i * 0.3};
    });
    return {nodes, chips: portrait ? [] : [{target: 'cache', at: 4.6, text: 'TTL 60s', tone: 'cobalt', icon: 'ttl'}]};
  },
};

// Chapter 5: every boxed kind (services), plus a message packet and a token chip.
const services: Chapter = {
  title: 'Services',
  diagram: (layout: Layout): DiagramProps => {
    const portrait = layout === '9:16';
    return {
      nodes: portrait
        ? [
            // Shorts: two stacked boxes side by side would need text under 52 px, so one column.
            {id: 'gateway', label: 'Gateway', kind: 'gateway', x: 0, y: 0, at: 0.3},
            {id: 'service', label: 'Service', kind: 'service', x: 0, y: 304, at: 0.6},
          ]
        : [
            {id: 'gateway', label: 'Gateway', kind: 'gateway', x: -350, y: 0, at: 0.3},
            {id: 'service', label: 'Service', kind: 'service', x: 350, y: 0, at: 0.6},
            {id: 'lb', label: 'Load balancer', kind: 'loadBalancer', x: -290, y: 340, at: 0.9},
            {id: 'limiter', label: 'Rate limiter', kind: 'rateLimiter', x: 290, y: 340, at: 1.2},
            {id: 'container', label: 'Container', kind: 'container', x: -460, y: 600, at: 1.5},
            {id: 'worker', label: 'Worker', kind: 'worker', x: 0, y: 600, at: 1.8},
            {id: 'agent', label: 'AI agent', kind: 'agent', x: 450, y: 600, at: 2.1},
          ],
      edges: [{from: 'gateway', to: 'service', at: 2.6}],
      packets: [{from: 'gateway', to: 'service', at: 3.6, label: 'event', icon: 'message'}],
      chips: portrait ? [] : [{target: 'gateway', at: 5, text: 'API key', tone: 'violet', icon: 'token'}],
    };
  },
};

// Chapter 6: hero number and a paper-card insert (a plain component scene).
const Data = () => {
  const portrait = useLayout() === '9:16';
  const stage = stageArea[portrait ? '9:16' : '16:9'];
  return (
    <SheetFrame title="Numbers">
      <div
        style={{
          position: 'absolute',
          left: stage.x,
          top: stage.y,
          width: stage.w,
          height: stage.h,
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: portrait ? 'center' : 'space-between',
          gap: 64,
        }}
      >
        <HeroNumber
          at={0.4}
          steps={[
            {at: 0.4, value: 1},
            {at: 1.4, value: 10},
          ]}
          suffix="x"
        />
        {portrait ? null : (
          <PaperCard at={2.6} source="Phil Karlton" style={{maxWidth: 900}}>
            There are only two hard things in Computer Science: cache invalidation and naming things.
          </PaperCard>
        )}
      </div>
    </SheetFrame>
  );
};

// Chapter 7: explainer components (latency bars, key/value card, tabs, checklist, badges, code line).
const latency = {
  x: 96,
  y: 200,
  w: 1400,
  rows: [
    {label: 'Memory', seconds: 1e-7, value: '~100 ns', tone: 'mint' as const, at: 0.6},
    {label: 'DB query', seconds: 5e-3, value: '~1-10 ms', tone: 'coral' as const, at: 1.2},
  ],
};
const Explain = () => {
  const portrait = useLayout() === '9:16';
  if (portrait) {
    return (
      <SheetFrame title="Checklist">
        <Checklist
          x={90}
          y={620}
          w={828}
          rows={[
            {text: 'Gets in', at: 0.4, done: 1.4},
            {text: 'Stays fresh', at: 0.5, done: 2},
            {text: 'Hot key', at: 0.6, tone: 'coral', done: 2.6},
          ]}
        />
        <Badge text="HIT" tone="mint" icon="check" at={3.2} style={{position: 'absolute', left: 90, top: 980}} />
      </SheetFrame>
    );
  }
  return (
    <SheetFrame title="Explainers">
      <LatencyBars {...latency} caption="typical, not measured" at={0.3} />
      <Marker at={2.4} until={4.4} kind="arrow" box={latencyBarEnd(latency, 1)} note="1000s x" side="below" />
      <div style={{position: 'absolute', left: 96, top: 520, width: 640, height: 104}}>
        <KeyValueCard keyText="user:42" values={[{at: 0, text: '"Anna"'}, {at: 5.2, text: '"Ana"', tone: 'mint'}]} keyAt={4.4} valueAt={5.2} at={4} />
      </div>
      <Tabs labels={['write-through', 'write-back', 'write-around']} at={6} active={[{at: 6.6, index: 1}]} style={{position: 'absolute', left: 96, top: 680}} />
      <CodeLine code="cache.get(key) ?? db.read(key)" at={7.4} style={{position: 'absolute', left: 96, top: 790}} />
      <Checklist
        x={1180}
        y={480}
        w={640}
        title="4 decisions"
        rows={[
          {text: 'Gets in', at: 8, done: 8.6},
          {text: 'Stays fresh', at: 8.1, done: 9},
          {text: 'Thrown out', at: 8.2, done: 9.4},
          {text: 'Hot key expires', at: 8.3, tone: 'coral', done: 9.8},
        ]}
      />
      <Badge text="MISS" tone="coral" icon="cross" big at={10.2} style={{position: 'absolute', left: 820, top: 520}} />
    </SheetFrame>
  );
};

// Chapter 8: eviction (slot grid with LRU / LFU / FIFO) and TTL timeline.
const slots = [
  {key: 'user:7', lastUsed: 2, hits: 90, order: 1},
  {key: 'user:3', lastUsed: 40, hits: 12, order: 2},
  {key: '/home', lastUsed: 1, hits: 55, order: 3},
  {key: 'user:42', lastUsed: 8, hits: 3, order: 4},
  {key: '/cart', lastUsed: 15, hits: 20, order: 5},
  {key: 'user:88', lastUsed: 5, hits: 9, order: 6},
];
const Evict = () => {
  const portrait = useLayout() === '9:16';
  if (portrait) {
    return (
      <SheetFrame title="Eviction">
        <Badge text="FULL" tone="coral" icon="cross" at={0.4} style={{position: 'absolute', left: 90, top: 640}} />
      </SheetFrame>
    );
  }
  return (
    <SheetFrame title="Eviction and TTL">
      <Tabs labels={['LRU', 'LFU', 'FIFO']} at={0.6} active={[{at: 1.4, index: 0}, {at: 3.6, index: 1}, {at: 5.8, index: 2}, {at: 8, index: 0, tone: 'mint'}]} style={{position: 'absolute', left: 96, top: 180}} />
      <SlotGrid
        x={556}
        y={290}
        slots={slots}
        fillAt={0.3}
        incoming={{key: 'user:99', at: 1}}
        phases={[
          {policy: 'lru', at: 1.4, evictAt: 2.4},
          {policy: 'lfu', at: 3.6, evictAt: 4.6},
          {policy: 'fifo', at: 5.8, evictAt: 6.8},
        ]}
      />
      <TtlTimeline
        x={96}
        y={720}
        w={1728}
        rows={[{at: 8.6, label: 'TTL', kind: 'entry', text: [{at: 8.6, text: '5 min'}], expireAt: 9.6, length: 0.8}]}
      />
    </SheetFrame>
  );
};

const scenes = {title, system, routes, stores, services, data: Data, explain: Explain, evict: Evict};

export const KitGallery = () => <Episode timing={galleryTiming} scenes={scenes} />;
export const KitGalleryVertical = () => <Episode timing={galleryTiming} scenes={scenes} captions />;
