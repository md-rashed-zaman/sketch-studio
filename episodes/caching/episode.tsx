import {
  Badge,
  Checklist,
  checklistRowBox,
  CodeCard,
  codeCardPoint,
  color,
  dur,
  ease,
  Em,
  Episode,
  font,
  HeroNumber,
  KeyValueCard,
  LatencyBars,
  latencyBarEnd,
  LoadMeter,
  Marker,
  PaperCard,
  progressAt,
  SlotGrid,
  slotGridLayout,
  SystemDiagram,
  Tabs,
  tone,
  TtlTimeline,
  type,
  useFontsReady,
  useSceneTime,
  type At,
  type Chapter,
  type DiagramNode,
} from '../../kit';
import timing from './timing.json';

export const cachingAudio = 'caching/audio/voice.wav';

// The cast (storyboard): one id, label and kind per component across every chapter, so chapters morph.
const cast = {
  users: {id: 'users', label: 'Users', kind: 'users'},
  app: {id: 'app', label: 'App server', kind: 'service'},
  cache: {id: 'cache', label: 'Cache (Redis)', kind: 'cache'},
  db: {id: 'db', label: 'Database', kind: 'database'},
  browser: {id: 'browser', label: 'Browser', kind: 'client'},
  cdn: {id: 'cdn', label: 'CDN edge', kind: 'cdn'},
  cpu: {id: 'cpu', label: 'CPU', kind: 'worker'},
} as const;
const node = (k: keyof typeof cast, x: number, y: number, at?: At, until?: At): DiagramNode => ({...cast[k], x, y, at, until});

const abs = (x: number, y: number, w?: number) => ({position: 'absolute' as const, left: x, top: y, width: w});

// 1. Cold open: users -> app -> db overloads, a cache fixes it, then the episode's checklist.
const introList = {x: 1290, y: 230, w: 534};
const bugRow = {...introList, y: introList.y + 4 * 84 + 48};
const coldOpen: Chapter = {
  chapter: 'INTRO',
  hud: () => (
    <>
      <Checklist
        {...introList}
        rows={[
          {text: 'Where to put it', at: 'checklist'},
          {text: 'How data gets in', at: 'checklist+0.12'},
          {text: 'How it stays fresh', at: 'checklist+0.24'},
          {text: 'What gets thrown out', at: 'checklist+0.36'},
        ]}
      />
      {/* Set apart from the list, so its loop keeps 28 px clear of the row above. Lands on "bug". */}
      <Checklist {...bugRow} rows={[{text: 'The bug', at: 'checklist+0.8', tone: 'coral'}]} />
      <Marker at="checklist+1.5" kind="circle" box={{...checklistRowBox(bugRow, 0), w: 250}} />
    </>
  ),
  diagram: {
    area: {x: 96, y: 160, w: 1150, h: 802},
    nodes: [node('users', 0, 0, 0.3), node('app', 430, 0, 0.36), node('db', 900, 0, 0.42), node('cache', 660, -260, 'fast')],
    edges: [
      {from: 'users', to: 'app', at: 0.8, rate: [{at: 'calm', value: 2}, {at: 'spike', value: 12}]},
      {from: 'app', to: 'db', at: 0.9, rate: [{at: 'calm', value: 2}, {at: 'spike', value: 12}, {at: 'fast+1', value: 1}]},
      {from: 'app', to: 'cache', at: 'fast+0.3', route: 'vh', rate: [{at: 'fast+1.2', value: 10}]},
      {from: 'cache', to: 'db', at: 'fast+0.4', route: 'hv'},
    ],
    states: [
      {target: 'db', state: 'hot', at: 'slow'},
      {target: 'db', state: 'idle', at: 'fast'},
      {target: 'app>cache', state: 'ok', at: 'fast+1'},
    ],
    chips: [
      {target: 'users', at: 'calm', counter: {steps: [{at: 'calm', value: 50}, {at: 'spike', value: 5000}], unit: ' req/s', threshold: 1000}},
      {target: 'app', at: 'calm', counter: {steps: [{at: 'calm', value: 80}, {at: 'slow', value: 3000}, {at: 'fast', value: 8}], unit: ' ms', threshold: 500}},
    ],
  },
};

// 2. The problem: every read goes to the database, the same questions over and over.
const problem: Chapter = {
  chapter: 'THE PROBLEM',
  title: (
    <>
      Every read hits the <Em tone="coral">database</Em>
    </>
  ),
  hud: () => (
    <LoadMeter
      at="load-low"
      capacity={3000}
      threshold={2000}
      steps={[
        {at: 'load-low', value: 50},
        {at: 'load-high', value: 2400},
      ]}
      style={{position: 'absolute', left: 96, width: 1728, top: 860}}
    />
  ),
  diagram: {
    area: {x: 96, y: 160, w: 1728, h: 680},
    // The database sits far enough out for two `GET /home` capsules to park side by side.
    nodes: [node('users', 0, 0, 'users'), node('app', 600, 0, 'app'), node('db', 1450, 0, 'db')],
    edges: [
      {from: 'users', to: 'app', at: 'users', rate: [{at: 'load-low', value: 2}, {at: 'same', value: 0}, {at: 'load-high', value: 12}]},
      {from: 'app', to: 'db', at: 'app', rate: [{at: 'load-low', value: 2}, {at: 'same', value: 0}, {at: 'load-high', value: 12}]},
    ],
    states: [
      {target: 'users', state: 'active', at: 'users'},
      {target: 'users', state: 'idle', at: 'app'},
      {target: 'app', state: 'active', at: 'app'},
      {target: 'app', state: 'idle', at: 'db'},
      {target: 'db', state: 'active', at: 'db'},
      {target: 'db', state: 'idle', at: 'load-low'},
      {target: 'db', state: 'hot', at: 'db-hot'},
    ],
    chips: [
      {target: 'users>app', at: 'load-low', counter: {steps: [{at: 'load-low', value: 50}, {at: 'load-high', value: 2400}], unit: ' req/s', threshold: 1000}},
      {target: 'db', at: 'db-work+1.2', until: 'load-high', text: 'find rows', tone: 'neutral'},
      {target: 'db', at: 'db-work+1.7', until: 'load-high', text: 'read', tone: 'neutral'},
      {target: 'db', at: 'db-work+2.2', until: 'load-high', text: 'send', tone: 'neutral'},
      {target: 'db', at: 'db-hot', text: 'OVERLOADED', tone: 'coral', icon: 'cross'},
    ],
    packets: [
      {from: 'app', to: 'db', at: 'same+1.3', label: 'GET /home'},
      {from: 'app', to: 'db', at: 'same+2.1', label: 'GET user:42'},
      // The repeats wait on the line, so the marker can circle them.
      {from: 'app', to: 'db', at: 'same+2.9', label: 'GET /home', id: 'home-a', park: 1, until: 'db-work'},
      {from: 'app', to: 'db', at: 'same+3.7', label: 'GET /home', id: 'home-b', park: 0.25, until: 'db-work'},
    ],
    markers: [{at: 'same+5', until: 'db-work', target: ['home-a', 'home-b'], note: 'same question', side: 'below'}],
    shots: [
      {at: 0, overview: true},
      {at: 'same', focus: ['app', 'db']},
      {at: 'db-work', focus: ['db']},
      {at: 'load-high', overview: true},
    ],
  },
};

// 3. What a cache is: in memory, thousands of times faster, a key and a value, hit or miss.
const latency = {
  x: 96,
  y: 610,
  w: 1500,
  rows: [
    {label: 'Memory', seconds: 1e-7, value: '~100 ns', tone: 'mint' as const, at: 'latency+0.4'},
    {label: 'DB query', seconds: 5e-3, value: '~1-10 ms', tone: 'coral' as const, at: 'latency-gap'},
  ],
};
const cacheIntro: Chapter = {
  chapter: 'WHAT A CACHE IS',
  title: 'A cache keeps recent answers close',
  hud: () => (
    <>
      <LatencyBars {...latency} caption="typical, not measured" at="latency" until="kv" />
      <Marker at="latency-gap+1.2" until="kv" kind="arrow" box={latencyBarEnd(latency, 1)} note="1000s x slower" side="above" />
      <div style={abs(580, 660, 760)}>
        <div style={{height: 104}}>
          <KeyValueCard keyText="user:42" values={[{at: 0, text: '{ name: "Anna" }'}]} keyAt="key" valueAt="value" at="kv" />
        </div>
      </div>
      <Badge text="HIT" tone="mint" icon="check" big at="hit-word" style={abs(270, 660)} />
      <Badge text="MISS" tone="coral" icon="cross" big at="miss-word" style={abs(1380, 660)} />
    </>
  ),
  diagram: {
    area: {x: 96, y: 160, w: 1728, h: 400},
    nodes: [node('app', 0, 0), node('cache', 600, 0, 'cache-in'), node('db', 1150, 0)],
    edges: [
      {from: 'app', to: 'cache', at: 'cache-in+0.3'},
      {from: 'cache', to: 'db', at: 'cache-in+0.4'},
    ],
    chips: [
      {target: 'cache', at: 'memory', text: 'in memory', tone: 'neutral'},
      // Named once, then out of the way of the latency marker's note.
      {target: 'cache', at: 'memory+1.2', until: 'latency', text: 'Redis, Memcached', tone: 'note'},
    ],
  },
};

// 4. Cache-aside: check, fall back, fill.
const cacheAside: Chapter = {
  chapter: 'CACHE-ASIDE',
  title: (
    <>
      Cache-aside: the <Em>app</Em> does the work
    </>
  ),
  diagram: {
    nodes: [node('app', 0, 0), node('cache', 760, -200), node('db', 760, 200)],
    edges: [
      {from: 'app', to: 'cache', at: 'pattern', route: 'vh', label: 'check'},
      {from: 'app', to: 'db', at: 'pattern+0.1', route: 'vh', label: 'on miss'},
    ],
    packets: [
      {from: 'app', to: 'cache', at: 'check-42+1.2', label: 'GET user:42'},
      {from: 'cache', to: 'app', at: 'hit', label: 'user:42', tone: 'mint'},
      {from: 'app', to: 'cache', at: 'check-88', label: 'GET user:88'},
      {from: 'app', to: 'db', at: 'db-read+0.2', label: 'GET user:88'},
      {from: 'db', to: 'app', at: 'db-return+0.2', label: 'user:88', tone: 'mint'},
      {from: 'app', to: 'cache', at: 'write-back', label: 'SET user:88'},
      {from: 'app', to: 'cache', at: 'next-hit', label: 'GET user:88'},
      {from: 'cache', to: 'app', at: 'next-hit+1.1', label: 'user:88', tone: 'mint'},
    ],
    states: [
      {target: 'cache', state: 'ok', at: 'hit'},
      {target: 'cache', state: 'idle', at: 'check-88'},
      {target: 'db', state: 'dim', at: 'db-idle+1.2'},
      {target: 'db', state: 'idle', at: 'check-88'},
      {target: 'db', state: 'active', at: 'db-read+0.2'},
      {target: 'db', state: 'idle', at: 'write-back'},
      {target: 'app>cache', state: 'active', at: 'check-42+1.2'},
      {target: 'app>cache', state: 'idle', at: 'db-read'},
      {target: 'app>db', state: 'active', at: 'db-read+0.2'},
      {target: 'app>db', state: 'idle', at: 'write-back'},
      {target: 'app>cache', state: 'active', at: 'write-back'},
      {target: 'app>cache', state: 'idle', at: 'cold'},
    ],
    chips: [
      {target: 'cache', at: 'hit', until: 'check-88', text: 'HIT', tone: 'mint', icon: 'check'},
      {target: 'db', at: 'db-idle+1.2', until: 'check-88', text: 'never asked', tone: 'note'},
      {target: 'cache', at: 'miss', until: 'write-back', text: 'MISS', tone: 'coral', icon: 'cross'},
      {target: 'cache', at: 'write-back+1', until: 'next-hit', text: 'CACHED', tone: 'mint', icon: 'check'},
      {target: 'cache', at: 'next-hit+1', until: 'cold', text: 'HIT', tone: 'mint', icon: 'check'},
      // Under the connector's horizontal run: the app's own bottom is where that connector leaves.
      {target: 'app>db', at: 'cold', text: 'first read is slow', tone: 'note'},
    ],
    markers: [{at: 'miss', until: 'db-read', target: 'cache', note: 'extra trip', side: 'right'}],
    shots: [
      {at: 0, overview: true},
      {at: 'check-42', focus: ['app', 'cache']},
      {at: 'db-idle', overview: true},
    ],
  },
};

// 5. Hit ratio: 90% -> one tenth of the load, 99% -> one hundredth.
const hitRatio: Chapter = {
  chapter: 'HIT RATIO',
  title: 'One number decides it',
  hud: () => (
    <>
      <div style={abs(1300, 220)}>
        <HeroNumber
          at="ratio"
          suffix="%"
          note="hit ratio"
          steps={[
            {at: 'ratio', value: 0},
            {at: 'ratio-90', value: 90},
            {at: 'ratio-99', value: 99},
          ]}
        />
      </div>
      <LoadMeter
        at="load"
        capacity={3000}
        threshold={2000}
        steps={[
          {at: 'load', value: 2400},
          {at: 'db-calm', value: 240},
          {at: 'db-24', value: 24},
        ]}
        style={{position: 'absolute', left: 96, width: 1728, top: 860}}
      />
    </>
  ),
  diagram: {
    area: {x: 96, y: 160, w: 1150, h: 660},
    nodes: [node('users', 0, 0, 'load'), node('app', 420, 0), node('cache', 880, -220), node('db', 880, 220)],
    edges: [
      {from: 'users', to: 'app', at: 'load', rate: [{at: 'load', value: 10}]},
      {from: 'app', to: 'cache', at: 0, route: 'vh', rate: [{at: 'ratio-90', value: 9}]},
      {from: 'app', to: 'db', at: 0, route: 'vh', rate: [{at: 'load', value: 10}, {at: 'ratio-90', value: 1}, {at: 'ratio-99', value: 0.3}]},
    ],
    states: [
      {target: 'db', state: 'hot', at: 'load'},
      {target: 'app>db', state: 'hot', at: 'load'},
      {target: 'app>cache', state: 'ok', at: 'ratio-90'},
      {target: 'db', state: 'idle', at: 'db-calm'},
      {target: 'app>db', state: 'active', at: 'db-calm'},
    ],
    chips: [
      {target: 'users', at: 'load', text: '2,400 req/s', tone: 'neutral'},
      {id: 'db-load', target: 'app>db', at: 'load', counter: {steps: [{at: 'load', value: 2400}, {at: 'db-240', value: 240}, {at: 'db-24', value: 24}], unit: ' req/s', threshold: 1000}},
    ],
    // An arrow, not a loop: the chip hangs just under the live connector, so a loop would cut the stream.
    markers: [{at: 'db-calm', until: 'ratio-99', target: 'db-load', kind: 'arrow', note: '1/10 the load', side: 'left'}],
  },
};

// 6. Read-through beside cache-aside: the database read moves out of your code into the cache.
// Two compact systems on top; code below. Left column: cache-aside's code. Right column: the cache layer
// (it receives the loader) and read-through's one-line code.
const band = {y: 150, h: 210};
const asideMini = {
  // A little into the column gutter, so the database label clears the app box.
  area: {x: 96, w: 860, ...band},
  nodes: [
    {id: 'a-cache', label: 'Cache (Redis)', kind: 'cache' as const, x: 0, y: 0, at: 'rt-fill+3.06'},
    {id: 'a-app', label: 'App server', kind: 'service' as const, x: 380, y: 0, at: 'rt-fill+3'},
    {id: 'a-db', label: 'Database', kind: 'database' as const, x: 720, y: 0, at: 'rt-fill+3.12'},
  ],
  edges: [
    {from: 'a-app', to: 'a-cache', at: 'rt-fill+3.4'},
    {from: 'a-app', to: 'a-db', at: 'rt-fill+3.5'},
  ],
};
const loaderCard = {x: 1176, y: 420, w: 520, title: 'cache layer', dashed: true, lines: [{text: 'loader = lambda id:', at: 'loader'}, {text: '', at: 0}]};
const asideCode = (to: {x: number; y: number}) => ({
  x: 96,
  y: 420,
  w: 824,
  title: 'your app (cache-aside)',
  lines: [
    {text: 'if admin: return db.read(id)', at: 'control', insert: true, highlight: {at: 'control'}},
    {text: 'user = cache.get(id)', at: 'step-check', badge: {text: '1', at: 'step-check'}, highlight: {at: 'step-check', until: 'step-read'}},
    {
      text: 'if user is None:',
      at: 'step-read',
      badge: {text: '2', at: 'step-read'},
      highlight: {at: 'step-read', until: 'step-save'},
      dim: {at: 'loader-move', until: 'control'},
    },
    {
      text: '    user = db.read(id)',
      at: 'step-read+0.5',
      highlight: {at: 'step-read+0.5', until: 'step-save'},
      dim: {at: 'loader-move', until: 'control'},
      // The read lifts out into the cache layer and stays there; back in your code for `control`.
      lift: {cols: [11, 22] as [number, number], at: 'loader-move', to, until: 'control'},
    },
    {
      text: '    cache.set(id, user)',
      at: 'step-save',
      badge: {text: '3', at: 'step-save'},
      highlight: {at: 'step-save', until: 'code-through'},
      dim: {at: 'loader-move', until: 'control'},
    },
  ],
});
// Three different callers all end up in the one loader.
const Funnel = () => {
  const {now, at} = useSceneTime();
  return (
    <>
      {['user', 'admin', 'report'].map((who, i) => {
        const t = now - at('one-loader') - i * 0.15;
        const go = progressAt(t - 0.6, dur.enter, ease.standard);
        return (
          <div key={who} style={{...abs(1000, 430 + i * 64), opacity: progressAt(t) * (1 - go), transform: `translateX(${go * 30}px)`}}>
            <Badge text={who} at="one-loader" />
          </div>
        );
      })}
    </>
  );
};
const ReadThroughHud = () => {
  const ready = useFontsReady();
  const {now, at} = useSceneTime();
  if (!ready) return null;
  const up = (t: At) => progressAt(now - at(t), dur.emphasis, ease.standard);
  // Left half is the familiar one: dim until the comparison, bright for "the app", dim again for "the cache".
  const leftSystem = 0.5 + 0.5 * up('compare-aside') - 0.5 * up('compare-through');
  const leftCode = 1 - 0.5 * up('compare-through');
  const rightCode = 1 - 0.5 * up('compare-aside') + 0.5 * up('compare-through');
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: leftSystem}}>
        <SystemDiagram {...asideMini} />
      </div>
      {/* Under the cache label in the large view; gone before the camera moves up. */}
      <Badge text="CACHED" tone="mint" icon="check" at="rt-fill+0.6" until="rt-fill+2.6" style={abs(925, 660)} />
      <div style={{position: 'absolute', inset: 0, opacity: leftCode}}>
        <CodeCard
          {...asideCode(codeCardPoint(loaderCard, 1, 4))}
          at="step-check"
          labels={[
            {at: 'step-save+0.6', text: '3 steps in your code'},
            {at: 'control+0.6', text: 'your rules, your code'},
            {at: 'compare-aside', text: 'app does the work'},
          ]}
        />
      </div>
      <div style={{...abs(1436, 372), height: 48, borderLeft: `2px dashed ${color.graphite}`, opacity: up('code-through')}} />
      <CodeCard {...loaderCard} at="code-through" />
      {/* Stacked under the loader box: side by side they would run past the safe area. */}
      <div style={{...abs(loaderCard.x, 630), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8}}>
        <Badge text="Caffeine (Java)" tone="neutral" at="examples-rt" until="one-loader" />
        <Badge text="Amazon DAX (DynamoDB)" tone="neutral" at="examples-rt+0.3" until="one-loader" />
      </div>
      <Funnel />
      <Marker at="one-loader+1.4" until="control" kind="circle" box={{x: loaderCard.x, y: loaderCard.y, w: loaderCard.w, h: 196}} note="one rule for all" side="below" />
      <div style={{position: 'absolute', inset: 0, opacity: rightCode}}>
        <CodeCard
          x={1000}
          y={775}
          w={560}
          title="your app (read-through)"
          lines={[{text: 'user = cache.get(id)', at: 'code-through', highlight: {at: 'code-through', until: 'loader-move', tone: 'mint'}}]}
          at="code-through"
          labels={[
            {at: 'code-through+0.6', text: '1 step in your code'},
            {at: 'compare-through', text: 'cache does the work'},
          ]}
        />
      </div>
    </>
  );
};
const readThrough: Chapter = {
  chapter: 'READ-THROUGH',
  title: (
    <>
      Read-through: the <Em tone="violet">cache</Em> does the work
    </>
  ),
  hud: ReadThroughHud,
  diagram: {
    // Spaced so each label keeps >= 24 px from the next box at the band's zoom (the widest the band allows).
    nodes: [node('app', 0, 0), node('cache', 380, 0), node('db', 660, 0)],
    // Large on its own first; when the narration turns to the code it moves up into its slot in the band.
    shots: [
      {at: 0, overview: true},
      {at: 'rt-fill+3', overview: true, into: {x: 1000, w: 824, ...band}},
    ],
    edges: [
      {from: 'app', to: 'cache', at: 0},
      {from: 'cache', to: 'db', at: 0},
    ],
    states: [
      {target: 'app>cache', state: 'active', at: 'rt-app-only'},
      {target: 'cache', state: 'active', at: 'rt-fetch'},
      {target: 'cache', state: 'idle', at: 'step-check'},
      {target: 'app>cache', state: 'idle', at: 'step-check'},
      ...['app', 'cache', 'db'].flatMap((target) => [
        {target, state: 'dim' as const, at: 'compare-aside'},
        {target, state: 'idle' as const, at: 'compare-through'},
      ]),
    ],
    packets: [
      {from: 'cache', to: 'db', at: 'rt-fetch', tone: 'violet'},
      {from: 'db', to: 'cache', at: 'rt-fill', tone: 'mint'},
      // The loader runs on a miss: cache -> db.
      {from: 'cache', to: 'db', at: 'loader+1', tone: 'cobalt'},
    ],
  },
};

// 7. Writes: stale data, three write strategies, then delete-on-write.
// Each strategy starts again from the old name "Anna" and writes "Ana", so write-back's crash leaves the database on "Anna".
const card = (values: {at: At; text: string; tone?: 'mint' | 'coral'}[], extra: {outline?: {at: At; tone: 'coral'; until?: At}} = {}) => (
  <KeyValueCard keyText="user:42" values={values} {...extra} />
);
const writes: Chapter = {
  chapter: 'WRITES',
  title: 'When data changes',
  hud: () => (
    <Tabs
      labels={['write-through', 'write-back', 'write-around']}
      at="three"
      active={[
        {at: 'wt', index: 0},
        {at: 'wb', index: 1},
        {at: 'wa', index: 2},
        {at: 'delete', index: null},
      ]}
      style={abs(96, 172)}
    />
  ),
  diagram: {
    area: {x: 96, y: 240, w: 1728, h: 720},
    nodes: [node('app', 0, 0), node('cache', 600, -190), node('db', 600, 190)],
    edges: [
      {from: 'app', to: 'cache', at: 0, route: 'vh'},
      {from: 'app', to: 'db', at: 0, route: 'vh'},
      {from: 'cache', to: 'db', at: 'wb-flush', label: 'later', dashed: true, exit: 'wa'},
    ],
    cards: [
      {target: 'db', at: 0, w: 520, h: 96, content: card([{at: 0, text: '"Anna"'}, {at: 'new-name', text: '"Ana"', tone: 'mint'}, {at: 'wb', text: '"Anna"'}, {at: 'wa-db+0.6', text: '"Ana"', tone: 'mint'}, {at: 'delete', text: '"Anna"'}, {at: 'delete+0.6', text: '"Ana"', tone: 'mint'}])},
      {
        target: 'cache',
        at: 0,
        until: 'wb-crash+1',
        w: 520,
        h: 96,
        content: card(
          [{at: 0, text: '"Anna"'}, {at: 'wt-both+0.8', text: '"Ana"', tone: 'mint'}, {at: 'wb', text: '"Anna"'}, {at: 'wb-cache+0.8', text: '"Ana"', tone: 'mint'}],
          {outline: {at: 'stale', tone: 'coral', until: 'three'}},
        ),
      },
      {target: 'cache', at: 'wa-fill+3.4', until: 'delete+1.2', w: 520, h: 96, content: card([{at: 0, text: '"Ana"', tone: 'mint'}, {at: 'delete', text: '"Anna"'}])},
      {target: 'cache', at: 'fresh', w: 520, h: 96, content: card([{at: 0, text: '"Ana"', tone: 'mint'}])},
    ],
    packets: [
      {from: 'app', to: 'db', at: 'update', label: 'UPDATE user:42'},
      {from: 'app', to: 'cache', at: 'wt-both', label: 'write'},
      {from: 'app', to: 'db', at: 'wt-both', label: 'write'},
      {from: 'app', to: 'cache', at: 'wb-cache', label: 'write'},
      {from: 'cache', to: 'db', at: 'wb-flush+3.3', tone: 'cobalt', until: 'wb-crash'},
      {from: 'app', to: 'db', at: 'wa-db', label: 'write'},
      {from: 'app', to: 'cache', at: 'wa-fill', label: 'GET'},
      {from: 'app', to: 'db', at: 'wa-fill+1.1', label: 'GET'},
      {from: 'db', to: 'app', at: 'wa-fill+2.0', label: '"Ana"', tone: 'mint'},
      {from: 'app', to: 'cache', at: 'wa-fill+2.8', label: 'SET'},
      {from: 'app', to: 'db', at: 'delete', label: 'UPDATE'},
      {from: 'app', to: 'cache', at: 'delete+0.8', label: 'DEL'},
      {from: 'app', to: 'cache', at: 'delete+1.8', label: 'GET'},
      {from: 'app', to: 'db', at: 'delete+2.4', label: 'GET'},
      {from: 'db', to: 'app', at: 'delete+3', tone: 'mint'},
    ],
    states: [
      {target: 'cache', state: 'hot', at: 'wb-crash'},
      {target: 'cache', state: 'idle', at: 'wa'},
    ],
    chips: [
      // On the connectors' horizontal runs: the app's top and bottom are where its connectors leave.
      {target: 'app>cache', at: 'wt-slow', until: 'wb', text: 'write = 2 stores', tone: 'neutral'},
    ],
    markers: [
      {at: 'stale', until: 'three', target: 'cache', note: 'stale!', side: 'above'},
      {at: 'wb-crash', until: 'wa', target: 'cache>db', kind: 'cross', note: 'lost', side: 'left'},
    ],
  },
};

// 8. Freshness: deleting is not enough, so entries expire (TTL); short vs long; the old joke.
const freshness: Chapter = {
  chapter: 'TTL AND INVALIDATION',
  title: 'Every entry gets a time to live',
  hud: () => (
    <>
      <TtlTimeline
        x={96}
        y={600}
        w={1728}
        rowH={115}
        rows={[
          {at: 'ttl', label: 'Entry', kind: 'entry', text: [{at: 'ttl', text: 'TTL'}, {at: 'ttl-5', text: '5 min'}], expireAt: 'expire', length: 0.85},
          {at: 'ttl-short', label: 'Short TTL', kind: 'refills', segments: 8, chip: {text: 'fresh', tone: 'mint'}},
          {at: 'ttl-long', label: 'Long TTL', kind: 'refills', segments: 2, chip: {text: 'stale risk', tone: 'coral'}},
        ]}
      />
      <PaperCard small at="examples" style={abs(900, 330)}>
        stock price: seconds
      </PaperCard>
      <PaperCard small at="examples+0.4" style={abs(1360, 330)}>
        product text: hours
      </PaperCard>
    </>
  ),
  diagram: {
    // Frame the fan from the start, so the copies arriving do not move the camera.
    frameFrom: 7,
    nodes: [
      node('cache', 0, 0),
      {id: 'cache-web', label: 'Web cache', kind: 'cache', x: 400, y: 0, at: 'fan', until: 'ttl'},
      {id: 'cache-api', label: 'API cache', kind: 'cache', x: 800, y: 0, at: 'fan+0.06', until: 'ttl'},
      {id: 'cache-worker', label: 'Worker cache', kind: 'cache', x: 1200, y: 0, at: 'fan+0.12', until: 'ttl'},
      node('db', 800, 300, 0, 'ttl'),
    ],
    edges: [
      {from: 'cache-web', to: 'db', at: 'fan+0.4', route: 'vh'},
      {from: 'cache-api', to: 'db', at: 'fan+0.45'},
      {from: 'cache-worker', to: 'db', at: 'fan+0.5', route: 'vh'},
    ],
    states: [
      {target: 'cache-web', state: 'dim', at: 'fan+0.6'},
      {target: 'cache-api', state: 'dim', at: 'fan+0.6'},
      {target: 'cache-worker', state: 'dim', at: 'fan+0.6'},
    ],
    markers: [{at: 'fan+1.2', until: 'ttl', target: ['cache-web', 'cache-api', 'cache-worker'], note: 'where else?', side: 'above'}],
  },
};

// 9. Eviction: a full cache, LRU / LFU / FIFO each pick a different victim.
const grid = {x: 556, y: 330};
const slots = [
  {key: 'user:7', lastUsed: 2, hits: 90, order: 1},
  {key: 'user:3', lastUsed: 40, hits: 12, order: 2},
  {key: '/home', lastUsed: 1, hits: 55, order: 3},
  {key: 'user:42', lastUsed: 8, hits: 3, order: 4},
  {key: '/cart', lastUsed: 15, hits: 20, order: 5},
  {key: 'user:88', lastUsed: 5, hits: 9, order: 6},
];
const eviction: Chapter = {
  chapter: 'EVICTION',
  title: 'Full cache: something has to go',
  hud: () => {
    const L = slotGridLayout(grid);
    return (
      <>
        <Tabs
          labels={['LRU', 'LFU', 'FIFO']}
          at="policy"
          active={[
            {at: 'lru', index: 0},
            {at: 'lfu', index: 1},
            {at: 'fifo', index: 2},
            {at: 'default', index: 0, tone: 'mint'},
          ]}
          style={abs(96, 180)}
        />
        <SlotGrid
          {...grid}
          slots={slots}
          fillAt="full"
          incoming={{key: 'user:99', at: 'new-key'}}
          phases={[
            {policy: 'lru', at: 'lru', evictAt: 'lru-out'},
            {policy: 'lfu', at: 'lfu', evictAt: 'lfu-out'},
            {policy: 'fifo', at: 'fifo', evictAt: 'fifo-out'},
            {policy: 'lru', at: 'default'},
          ]}
        />
        <Badge text="FULL" tone="coral" icon="cross" at="full+0.9" until="policy" style={abs(890, 740)} />
        <Marker at="lru-out+0.8" until="lfu" kind="circle" box={L.tray} note="oldest use" side="below" />
        <Marker at="fifo-out+0.8" until="default" kind="circle" box={L.tray} note="hottest key gone" side="below" />
        <Badge text="good default" tone="mint" icon="check" at="default+0.3" style={abs(820, 740)} />
      </>
    );
  },
};

// 10. Cache stampede: a hot key expires, everyone misses at once, the database falls over; three fixes.
const TtlKey = ({start, end, refreshAt}: {start: At; end: At; refreshAt?: At}) => {
  const {now, at} = useSceneTime();
  const t0 = at(start);
  const t1 = at(end);
  const refreshed = refreshAt !== undefined && now >= at(refreshAt);
  const left = refreshed
    ? 1 - Math.min(1, (now - at(refreshAt!)) / (t1 - t0))
    : Math.max(0, 1 - (now - t0) / (t1 - t0));
  const fill = refreshed ? tone.mint : left < 0.25 ? tone.coral : tone.cobalt;
  return (
    <div style={{width: '100%', height: '100%', boxSizing: 'border-box', padding: '10px 18px', borderRadius: 16, background: color.raised, border: `2px solid ${color.graphite}`}}>
      <div style={{fontFamily: font.code, fontWeight: 500, fontSize: type.code, color: color.chalk}}>/home</div>
      <div style={{marginTop: 8, height: 16, borderRadius: 8, background: color.grid}}>
        <div style={{width: `${left * 100}%`, height: '100%', borderRadius: 8, background: fill}} />
      </div>
    </div>
  );
};
const fixes = {x: 96, y: 750, w: 860};
const stampede: Chapter = {
  chapter: 'CACHE STAMPEDE',
  title: 'Cache stampede',
  intro: {hero: 'The bug'},
  hud: () => (
    <>
      <LoadMeter
        at="all-hits"
        until="lock"
        capacity={3000}
        steps={[
          {at: 'all-hits', value: 30},
          {at: 'db-flood', value: 10000},
        ]}
        style={{position: 'absolute', left: 96, width: 1728, top: 830}}
      />
      <Checklist
        {...fixes}
        rows={[
          {text: 'One request rebuilds', at: 'lock', done: 'lock+0.4'},
          {text: 'Random jitter on TTLs', at: 'jitter', done: 'jitter+0.4'},
          {text: 'Refresh before expiry', at: 'early', done: 'early+0.4'},
        ]}
      />
      <TtlTimeline
        x={1000}
        y={760}
        w={824}
        rowH={70}
        labelW={150}
        chipW={0}
        axisLabel=""
        rows={[
          {at: 'jitter', label: 'key A', kind: 'entry', length: 0.6, expireAt: 'jitter+0.8', expiredNote: ''},
          {at: 'jitter', label: 'key B', kind: 'entry', length: 0.8, expireAt: 'jitter+1.5', expiredNote: ''},
          {at: 'jitter', label: 'key C', kind: 'entry', length: 1, expireAt: 'jitter+2.2', expiredNote: ''},
        ]}
      />
    </>
  ),
  diagram: {
    // Down to 800: the meter (until lock) sits below it, and once the loop and DOWN chip are gone the
    // map is short enough to stay above the fixes panel.
    area: {x: 96, y: 160, w: 1728, h: 640},
    nodes: [node('users', 0, 0), node('app', 440, 0), node('cache', 900, -150), node('db', 900, 150)],
    edges: [
      {from: 'users', to: 'app', at: 0, rate: [{at: 'all-hits', value: 12}, {at: 'expires', value: 0}, {at: 'herd', value: 12}, {at: 'lock', value: 0}]},
      {from: 'app', to: 'cache', at: 0, route: 'vh', rate: [{at: 'all-hits', value: 12}, {at: 'expires', value: 0}, {at: 'herd', value: 12}, {at: 'db-flood', value: 0}]},
      // The flood stops when the database goes down, so the marker loop never crosses moving packets.
      {from: 'app', to: 'db', at: 0, route: 'vh', rate: [{at: 'db-flood', value: 14}, {at: 'down', value: 0}]},
      {from: 'cache', to: 'db', at: 'early'},
    ],
    states: [
      {target: 'db', state: 'dim', at: 'all-hits'},
      {target: 'app>cache', state: 'ok', at: 'all-hits'},
      {target: 'app>cache', state: 'hot', at: 'herd'},
      {target: 'app>db', state: 'hot', at: 'db-flood'},
      {target: 'db', state: 'hot', at: 'db-flood'},
      {target: 'app', state: 'hot', at: 'down'},
      {target: 'app>cache', state: 'idle', at: 'lock'},
      {target: 'app>db', state: 'idle', at: 'lock'},
      {target: 'db', state: 'idle', at: 'lock'},
      {target: 'app', state: 'idle', at: 'lock'},
    ],
    chips: [
      {target: 'users', at: 'all-hits', until: 'lock', text: '10,000 req/s', tone: 'neutral'},
      {target: 'db', at: 'down', until: 'lock', text: 'DOWN', tone: 'coral', icon: 'cross'},
      {target: 'users', at: 'lock+1', until: 'jitter', text: 'others wait', tone: 'note'},
    ],
    cards: [
      {target: 'cache', at: 'hot-key', until: 'expires+0.4', w: 380, h: 100, content: <TtlKey start="hot-key" end="expires" />},
      {target: 'cache', at: 'early', w: 380, h: 100, content: <TtlKey start="early" end="early+1.6" refreshAt="early+1.2" />},
    ],
    packets: [
      {from: 'app', to: 'db', at: 'lock+0.6', label: '1 rebuild'},
      {from: 'cache', to: 'db', at: 'early+0.6', tone: 'mint'},
    ],
    markers: [{at: 'down+2', until: 'lock', target: 'db', note: 'stampede', side: 'right'}],
  },
};

// 11. Caches everywhere: browser, CDN edge, app cache, database memory, CPU.
const layers: Chapter = {
  chapter: 'CACHES EVERYWHERE',
  title: 'Caches everywhere',
  diagram: {
    nodes: [
      // Two rows: the request path along the top, the database and its CPU under the app.
      node('browser', 0, 0, 'everywhere'),
      node('cdn', 400, 0, 'cdn'),
      node('app', 820, 0),
      node('cache', 1360, 0),
      node('db', 820, 380),
      node('cpu', 1360, 380, 'cpu'),
    ],
    edges: [
      {from: 'browser', to: 'cdn', at: 'cdn'},
      {from: 'cdn', to: 'app', at: 'cdn+0.2'},
      {from: 'app', to: 'cache', at: 0},
      {from: 'app', to: 'db', at: 0},
      {from: 'db', to: 'cpu', at: 'cpu+0.3'},
    ],
    packets: [{from: 'browser', to: 'cdn', at: 'cdn+0.3', id: 'to-edge'}],
    chips: [
      {target: 'browser', at: 'browser', text: 'images, JS', tone: 'neutral'},
      {target: 'cdn', at: 'cdn+1', text: 'whole pages', tone: 'neutral'},
      {target: 'cache', at: 'app-cache+1.2', text: 'query results', tone: 'neutral'},
      {target: 'db', at: 'db-cache+1.2', text: 'hot data in RAM', tone: 'neutral'},
      {target: 'cpu', at: 'cpu+0.8', text: 'L1 / L2 / L3', tone: 'neutral'},
    ],
    cards: [
      {
        target: 'cdn',
        side: 'above',
        at: 'edge+1.2',
        until: 'app-cache',
        w: 560,
        h: 130,
        content: (
          <PaperCard small tilt={0}>
            London user → London edge
            <br />
            (not Virginia)
          </PaperCard>
        ),
      },
    ],
    // Same idea: every layer lights together on the word (state emphasis, no marker), then settles.
    states: ['browser', 'cdn', 'app', 'cache', 'db', 'cpu'].flatMap((target) => [
      {target, state: 'active' as const, at: 'same-idea'},
      {target, state: 'idle' as const, at: 'same-idea+0.9'},
    ]),
    shots: [
      {at: 0, overview: true},
      {at: 'everywhere', focus: ['browser']},
      {at: 'cdn', track: 'to-edge'},
      {at: 'edge', focus: ['cdn']},
      {at: 'app-cache', focus: ['app', 'cache']},
      {at: 'db-cache', focus: ['db']},
      {at: 'cpu', focus: ['db', 'cpu']},
      {at: 'cpu+2.4', overview: true},
    ],
  },
};

// 12. Recap: four decisions; the right half clears for the end screen.
const recap: Chapter = {
  chapter: 'RECAP',
  title: 'Four decisions',
  hud: () => (
    <>
      <Checklist
        x={96}
        y={200}
        w={840}
        title="Every cache = 4 decisions"
        titleAt="four"
        dimAt="next"
        rows={[
          {text: 'Gets in: cache-aside / read-through', at: 'four+0.12', done: 'd1'},
          {text: 'Stays fresh: write strategy + TTL', at: 'four+0.24', done: 'd2'},
          {text: 'Thrown out: usually LRU', at: 'four+0.36', done: 'd3'},
          {text: 'Hot key expires: no stampede', at: 'four+0.48', tone: 'coral', done: 'd4'},
        ]}
      />
      <PaperCard at="next+0.4" tilt={0} style={abs(96, 700, 700)}>
        Next: scale an API
        <br />
        from 100 to 1M users
      </PaperCard>
    </>
  ),
  diagram: {
    area: {x: 960, y: 160, w: 864, h: 640},
    nodes: [node('app', 0, 0, 0, 'next'), node('cache', 420, -190, 0, 'next'), node('db', 420, 190, 0, 'next')],
    edges: [
      {from: 'app', to: 'cache', at: 0, route: 'vh'},
      {from: 'app', to: 'db', at: 0, route: 'vh'},
    ],
  },
};

export const CachingEpisode = () => (
  <Episode
    timing={timing}
    audio={cachingAudio}
    scenes={{
      'cold-open': coldOpen,
      problem,
      'cache-intro': cacheIntro,
      'cache-aside': cacheAside,
      'hit-ratio': hitRatio,
      'read-through': readThrough,
      writes,
      freshness,
      eviction,
      stampede,
      layers,
      recap,
    }}
  />
);
