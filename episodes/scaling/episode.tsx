import type {ReactNode} from 'react';
import {
  Badge,
  Checklist,
  checklistRowBox,
  CodeCard,
  color,
  Em,
  Episode,
  font,
  HeroNumber,
  Marker,
  MetricRows,
  metricRowsBox,
  PaperCard,
  progressAt,
  stageArea,
  type,
  useSceneTime,
  type At,
  type Chapter,
  type DiagramChip,
  type DiagramNode,
  type DiagramProps,
  type MetricRow,
} from '../../kit';
import timing from './timing.json';
import millionShortTiming from './shorts/million.json';
import sessionsShortTiming from './shorts/sessions.json';
import lagShortTiming from './shorts/lag.json';

export const scalingAudio = 'scaling/audio/voice.wav';
export const millionShortAudio = 'scaling/shorts/million.wav';
export const sessionsShortAudio = 'scaling/shorts/sessions.wav';
export const lagShortAudio = 'scaling/shorts/lag.wav';

// The cast (storyboard): one id, label and kind per component across every chapter, so chapters morph.
const cast = {
  users: {id: 'users', label: 'Users', kind: 'users'},
  app: {id: 'app', label: 'App server', kind: 'service'},
  db: {id: 'db', label: 'Database', kind: 'database'},
  app2: {id: 'app2', label: 'App server', kind: 'service', sub: 'B'},
  lb: {id: 'lb', label: 'Load balancer', kind: 'loadBalancer'},
  sessions: {id: 'sessions', label: 'Sessions (Redis)', kind: 'cache'},
  storage: {id: 'storage', label: 'Photos (S3)', kind: 'storage'},
  cache: {id: 'cache', label: 'Cache (Redis)', kind: 'cache'},
  cdn: {id: 'cdn', label: 'CDN', kind: 'cdn'},
  replica: {id: 'replica', label: 'Replicas', kind: 'database'},
  queue: {id: 'queue', label: 'Queue', kind: 'queue'},
  worker: {id: 'worker', label: 'Workers', kind: 'worker'},
} as const;
type CastKey = keyof typeof cast;
const node = (k: CastKey, x: number, y: number, at?: At, until?: At, extra: Partial<DiagramNode> = {}): DiagramNode => ({...cast[k], x, y, at, until, ...extra});

// Frame each chapter's final layout from the start, so a piece arriving never moves the camera.
const steady = Infinity;

const abs = (x: number, y: number, w?: number) => ({position: 'absolute' as const, left: x, top: y, width: w});

// The users chip carries the scale step from chapter to chapter (all illustrative).
const usersChip = (steps: {at: At; value: number}[], at: At = 0): DiagramChip => ({
  target: 'users',
  at,
  tone: 'neutral',
  counter: {steps, unit: ' users'},
});

// The milestone each fix buys: a mint chip under the users counter (illustrative, like the counts).
const ready = (at: At, text: string, until?: At): DiagramChip => ({target: 'users', at, until, text, tone: 'mint', icon: 'check'});

// Server health under the diagram in chapters 3-5 (illustrative numbers).
const health = {x: 1000, y: 720, w: 824};
const healthRows = (cpu: {at: At; value: number}[], mem: {at: At; value: number}[], page: {at: At; value: number}[]): MetricRow[] => [
  {label: 'CPU', steps: cpu, unit: '%', max: 100, threshold: 80},
  {label: 'Memory', steps: mem, unit: '%', max: 100, threshold: 80},
  {label: 'Latency', steps: page, unit: ' ms', max: 1000, threshold: 500},
];

// 1. Cold open: one server, the users counter runs to a million, "what breaks first?", not a tool list, then a
// second server teases the logout of chapter 6. The ladder previews the milestones each chapter's "ready for" chip checks off.
const tools = ['Load balancer', 'CDN', 'Kafka', 'Sharding', 'Kubernetes', 'Replicas'];
const toolPile = {x: 1180, y: 250, w: 640, h: 3 * 84};
const ladder = ['10k', '50k', '100k', '300k', '1M'];
const rung = (i: number) => abs(1300, 820 - i * 120, 400);
const coldOpen: Chapter = {
  chapter: 'INTRO',
  hud: () => (
    <>
      {tools.map((t, i) => (
        <Badge key={t} text={t} tone="neutral" at={`tools+${0.1 * i}`} until="ladder" style={abs(toolPile.x + (i % 2) * 330, toolPile.y + Math.floor(i / 2) * 84)} />
      ))}
      <Marker at="tools+1.2" until="ladder" kind="cross" box={toolPile} note="not a list" side="below" />
      {ladder.map((n, i) => (
        <div key={n}>
          {i > 0 && (
            <div style={{...rung(i - 0.5), display: 'flex', justifyContent: 'center'}}>
              <Badge text="↑" tone="note" at={`ladder+${0.3 * i - 0.1}`} until="teaser-two" />
            </div>
          )}
          <div style={{...rung(i), display: 'flex', justifyContent: 'center'}}>
            <Badge text={n} tone="neutral" at={`ladder+${0.3 * i}`} until="teaser-two" />
          </div>
        </div>
      ))}
    </>
  ),
  diagram: {
    frameFrom: steady,
    area: {x: 96, y: 160, w: 1084, h: 802},
    nodes: [node('users', 0, 0, 0.3), node('app', 560, 0, 0.36), node('app2', 560, 300, 'teaser-two')],
    edges: [
      {from: 'users', to: 'app', at: 0.8, rate: [{at: 'shop', value: 1}, {at: 'viral', value: 4}, {at: 'viral-1m', value: 14}, {at: 'teaser-two+0.6', value: 7}]},
      {from: 'users', to: 'app2', at: 'teaser-two+0.3', rate: [{at: 'teaser-two+0.6', value: 7}]},
    ],
    states: [
      {target: 'app', state: 'hot', at: 'breaks'},
      {target: 'app', state: 'idle', at: 'tools'},
      {target: 'app2', state: 'hot', at: 'teaser-out'},
    ],
    chips: [
      {target: 'users', at: 'shop', until: 'viral', text: '1 user', tone: 'neutral'},
      usersChip([{at: 'viral', value: 1000}, {at: 'viral-10k', value: 10000}, {at: 'viral-1m', value: 1000000}], 'viral'),
      {target: 'app', at: 'shop+0.6', text: 'shop + database', tone: 'neutral'},
      {target: 'users', at: 'teaser-out', text: 'logged out', tone: 'coral', icon: 'cross'},
    ],
    markers: [{at: 'breaks', until: 'tools', target: 'app', note: 'what breaks?', side: 'below'}],
  },
};

// 2. What a million users means: daily users -> requests a day -> requests a second, then ChatGPT's one main database.
const Line = ({at, until, op, children}: {at: At; until?: At; op?: string; children: ReactNode}) => {
  const {now, at: resolve} = useSceneTime();
  const p = progressAt(now - resolve(at)) * (until === undefined ? 1 : 1 - progressAt(now - resolve(until)));
  return (
    <div style={{height: 104, opacity: p, fontFamily: font.display, fontWeight: 700, fontSize: type.sceneTitle, color: color.chalk, fontVariantNumeric: 'tabular-nums'}}>
      <span style={{display: 'inline-block', width: 80, color: color.pencil}}>{op}</span>
      {children}
    </div>
  );
};
const openaiCard = {x: 1000, y: 600, w: 824};
const million: Chapter = {
  chapter: 'WHAT 1M MEANS',
  title: (
    <>
      What <Em>1 million users</Em> means
    </>
  ),
  hud: () => (
    <>
      <div style={abs(96, 220, 900)}>
        <Line at="users">1,000,000 users a day</Line>
        <Line at="clicks" op="×">20 requests each</Line>
        <Line at="per-day" op="=">20,000,000 a day</Line>
        <Line at="seconds" op="÷">86,400 seconds</Line>
      </div>
      <div style={abs(1100, 220)}>
        <HeroNumber at="per-second" suffix=" req/s" note="on average" steps={[{at: 'per-second', value: 0}, {at: 'per-second+0.05', value: 230}]} />
      </div>
      <Badge text="~100k online at once" tone="neutral" at="at-once+0.6" until="clicks" style={abs(176, 340)} />
      <Badge text="peaks ×10 ≈ 2,000 req/s" tone="neutral" at="two-k" style={abs(96, 680)} />
      <PaperCard at="openai" tilt={0} source="OpenAI Engineering, Jan 2026" style={abs(openaiCard.x, openaiCard.y, openaiCard.w)}>
        ChatGPT: 800M users, one main database server takes every write
      </PaperCard>
      <Marker at="one-db" kind="circle" box={{...openaiCard, h: 270}} note="just one" side="left" />
    </>
  ),
};

// 3. One server: code, database and photos on one box; that is right; watch three numbers.
const oneServer: Chapter = {
  chapter: 'ONE SERVER',
  title: 'Start with one server',
  hud: () => (
    <>
      <Badge text="right way to start" tone="mint" icon="check" at="right" style={abs(96, 740)} />
      <MetricRows
        at="metrics"
        rows={healthRows([{at: 0, value: 12}], [{at: 0, value: 30}], [{at: 0, value: 120}])}
        style={abs(health.x, health.y, health.w)}
      />
      <Marker at="rule" kind="bracket" box={metricRowsBox({...health, count: 3})} note="watch these" side="left" />
    </>
  ),
  diagram: {
    frameFrom: steady,
    area: {x: 96, y: 160, w: 1728, h: 540},
    nodes: [node('users', 0, 0), node('app', 520, 0)],
    edges: [{from: 'users', to: 'app', at: 0}],
    chips: [
      usersChip([{at: 0, value: 100}]),
      {target: 'app', at: 'inside', text: 'code', tone: 'neutral'},
      {target: 'app', at: 'inside+0.4', text: 'database', tone: 'neutral'},
      {target: 'app', at: 'inside+0.8', text: 'photos', tone: 'neutral'},
    ],
    packets: [
      {from: 'users', to: 'app', at: 'request', label: 'GET /home'},
      {from: 'app', to: 'users', at: 'request+1.4', label: 'page', tone: 'mint'},
    ],
  },
};

// 4. Split the database: slow pages, app and database fight, fix the query first, then move the database out.
const splitDb: Chapter = {
  chapter: 'SPLIT THE DATABASE',
  title: (
    <>
      Give the <Em>database</Em> its own server
    </>
  ),
  hud: () => (
    <>
      <MetricRows
        rows={healthRows(
          [{at: 0, value: 12}, {at: '10k', value: 70}, {at: 'fight', value: 92}, {at: 'index', value: 60}, {at: 'split', value: 35}],
          [{at: 0, value: 30}, {at: '10k', value: 60}, {at: 'fight', value: 88}, {at: 'split', value: 40}],
          [{at: 0, value: 120}, {at: '10k', value: 900}, {at: 'index', value: 250}, {at: 'split', value: 150}],
        )}
        style={abs(health.x, health.y, health.w)}
      />
      <CodeCard
        x={96}
        y={630}
        w={840}
        title="slowest query"
        at="slow-query"
        lines={[
          {text: 'CREATE INDEX ON products(name)', at: 'index', insert: true, highlight: {at: 'index', tone: 'mint'}},
          {text: 'SELECT * FROM products', at: 'slow-query'},
          {text: "WHERE name = 'red shoes'", at: 'slow-query+0.4'},
        ]}
        labels={[
          {at: 'slow-query+1.6', text: 'reads every row: 800 ms'},
          {at: 'index+0.8', text: 'with an index: 5 ms'},
        ]}
      />
    </>
  ),
  diagram: {
    frameFrom: steady,
    area: {x: 96, y: 160, w: 1728, h: 460},
    nodes: [node('users', 0, 0), node('app', 520, 0), node('db', 1200, 0, 'split')],
    edges: [
      {from: 'users', to: 'app', at: 0},
      {from: 'app', to: 'db', at: 'split+0.3'},
    ],
    states: [
      {target: 'app', state: 'hot', at: 'fight'},
      {target: 'app', state: 'idle', at: 'split'},
    ],
    chips: [
      usersChip([{at: 0, value: 100}, {at: '10k', value: 10000}]),
      {target: 'app>db', at: 'hop', text: '+1 network hop', tone: 'neutral'},
      ready('ready-50k', 'ready for ~50k'),
    ],
    markers: [{at: 'fight', until: 'slow-query', target: 'app', note: 'one box, two jobs', side: 'below'}],
  },
};

// 5. A bigger server: vertical scaling works, but it has a ceiling and it is still one machine.
const sizes = [
  {text: 'small  $', at: 'ceiling'},
  {text: 'large  $$$', at: 'ceiling+0.3'},
  {text: 'largest  $$$$$$$$', at: 'ceiling+0.6'},
];
const scaleUp: Chapter = {
  chapter: 'BIGGER SERVER',
  title: 'Buy a bigger server',
  hud: () => (
    <>
      <MetricRows rows={[{label: 'CPU', steps: [{at: 0, value: 35}, {at: '50k', value: 90}, {at: 'bigger', value: 45}], unit: '%', max: 100, threshold: 80}]} style={abs(health.x, health.y, health.w)} />
      <div style={{...abs(96, 650), display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16}}>
        {sizes.map((s) => (
          <Badge key={s.text} text={s.text} tone="neutral" at={s.at} until="spof" />
        ))}
        <Badge text="nothing bigger" tone="coral" icon="cross" at="no-bigger" until="spof" />
      </div>
      <Badge text="vertical scaling" tone="cobalt" big at="vertical" until="ceiling" style={abs(96, 660)} />
    </>
  ),
  diagram: {
    frameFrom: steady,
    area: {x: 96, y: 160, w: 1728, h: 460},
    nodes: [node('users', 0, 0), node('app', 520, 0), node('db', 1200, 0)],
    edges: [
      {from: 'users', to: 'app', at: 0},
      {from: 'app', to: 'db', at: 0},
    ],
    states: [
      {target: 'app', state: 'hot', at: '50k'},
      {target: 'app', state: 'idle', at: 'bigger'},
      {target: 'app', state: 'hot', at: 'spof'},
    ],
    chips: [
      usersChip([{at: 0, value: 10000}, {at: '50k', value: 50000}]),
      ready('ready-100k', 'ready for ~100k', 'spof'),
      {target: 'app', at: 'bigger', until: 'spof', text: '2× CPU, 2× RAM', tone: 'neutral'},
      {target: 'app', at: 'shop-down', text: 'shop down', tone: 'coral', icon: 'cross'},
    ],
    markers: [{at: 'spof-name', target: 'app', kind: 'cross', note: 'single point of failure', side: 'below'}],
  },
};

// 6. More servers behind a load balancer; sessions in one server's memory log you out; stateless servers with a
// shared session store. A sits below B, so it glides up into chapter 7's "App servers" without crossing the photos.
const scaleOut: Chapter = {
  chapter: 'MORE SERVERS',
  title: (
    <>
      Run <Em>more</Em> servers
    </>
  ),
  hud: () => <Badge text="+ auto-scaling" tone="neutral" at="autoscale" style={abs(96, 880)} />,
  diagram: {
    frameFrom: steady,
    nodes: [
      node('users', -30, 0),
      node('lb', 340, 0, 'lb'),
      node('app', 860, 165, 0, undefined, {sub: 'A'}),
      node('app2', 860, -165, 'second'),
      node('sessions', 1300, 165, 'session-store'),
      node('storage', 1300, -165, 's3'),
    ],
    edges: [
      {from: 'users', to: 'app', at: 0, exit: 'lb'},
      {from: 'users', to: 'lb', at: 'lb+0.3', rate: [{at: 'lb+0.6', value: 4}, {at: 'login', value: 0}, {at: 'any+1.6', value: 6}]},
      {from: 'lb', to: 'app', at: 'lb+0.4', route: 'vh', rate: [{at: 'lb+0.6', value: 2}, {at: 'one-dies', value: 4}, {at: 'login', value: 0}, {at: 'any+1.6', value: 3}]},
      {from: 'lb', to: 'app2', at: 'lb+0.5', route: 'vh', rate: [{at: 'lb+0.6', value: 2}, {at: 'one-dies', value: 0}, {at: 'any+1.6', value: 3}]},
      {from: 'app', to: 'sessions', at: 'session-store+0.3'},
      {from: 'app2', to: 'sessions', at: 'session-store+0.4'},
      {from: 'app', to: 'storage', at: 's3+0.3'},
      {from: 'app2', to: 'storage', at: 's3+0.4'},
    ],
    states: [
      {target: 'app2', state: 'dim', at: 'one-dies'},
      {target: 'app2', state: 'idle', at: 'login'},
      {target: 'app2', state: 'hot', at: 'logged-out'},
      {target: 'app2', state: 'idle', at: 'stateless'},
      {target: 'sessions', state: 'ok', at: 'session-store+1'},
      {target: 'app2', state: 'hot', at: 'no-photo'},
      {target: 'app2', state: 'idle', at: 's3'},
      {target: 'storage', state: 'ok', at: 's3+1'},
      {target: 'app', state: 'ok', at: 'any'},
      {target: 'app2', state: 'ok', at: 'any'},
    ],
    chips: [
      usersChip([{at: 0, value: 50000}, {at: 'second', value: 100000}]),
      {target: 'app2', at: 'one-dies', until: 'login', text: 'down', tone: 'coral', icon: 'cross'},
      {target: 'app', at: 'login+2.2', until: 'stateless', text: 'knows you', tone: 'mint', icon: 'check'},
      {target: 'app2', at: 'logged-out', until: 'stateless', text: 'logged out', tone: 'coral', icon: 'cross'},
      {target: 'sessions', at: 'session-store+1', text: 'your session', tone: 'mint', icon: 'check'},
      {target: 'app', at: 'upload+2.2', until: 's3', text: 'photo on disk', tone: 'neutral'},
      {target: 'app2', at: 'no-photo', until: 's3', text: 'no photo', tone: 'coral', icon: 'cross'},
      {target: 'storage', at: 's3+1', text: 'every server', tone: 'mint', icon: 'check'},
      ready('ready-300k', 'ready for ~300k'),
    ],
    packets: [
      {from: 'users', to: 'lb', at: 'login', label: 'login'},
      {from: 'lb', to: 'app', at: 'login+1.1', label: 'login'},
      {from: 'users', to: 'lb', at: 'next-click', label: 'GET /cart'},
      {from: 'lb', to: 'app2', at: 'next-click+1.1', label: 'GET /cart'},
      {from: 'users', to: 'lb', at: 'upload', label: 'photo.jpg'},
      {from: 'lb', to: 'app', at: 'upload+1.1', label: 'photo.jpg'},
    ],
    markers: [{at: 'logged-out+0.6', until: 'stateless', target: 'app2', note: 'never met you', side: 'right'}],
  },
};

// 7. Cache and CDN: the database answers the same reads, photos travel too far.
const cacheCdn: Chapter = {
  chapter: 'CACHE AND CDN',
  title: 'Keep the popular stuff close',
  hud: () => <Badge text="caching: full video" tone="note" at="video" until="images" style={abs(96, 880)} />,
  diagram: {
    frameFrom: steady,
    nodes: [
      node('users', 0, 0),
      node('cdn', 380, -280, 'cdn'),
      node('storage', 880, -280),
      node('lb', 380, 0),
      node('app', 880, 0, 0, undefined, {label: 'App servers'}),
      node('cache', 1340, -220, 'cache'),
      node('db', 1340, 200),
    ],
    edges: [
      {from: 'users', to: 'lb', at: 0, rate: 6},
      {from: 'lb', to: 'app', at: 0, rate: 6},
      {from: 'app', to: 'db', at: 0, route: 'hv', rate: [{at: '300k', value: 12}, {at: 'cache+1', value: 1}]},
      {from: 'app', to: 'cache', at: 'cache+0.3', route: 'hv', rate: [{at: 'cache+1', value: 10}]},
      {from: 'users', to: 'cdn', at: 'cdn+0.3', route: 'vh'},
      {from: 'app', to: 'storage', at: 0},
      {from: 'storage', to: 'cdn', at: 'cdn+0.5', dashed: true, label: 'copies'},
    ],
    states: [
      {target: 'db', state: 'hot', at: '300k'},
      {target: 'db', state: 'idle', at: 'cache+1'},
      {target: 'app>cache', state: 'ok', at: 'cache+1'},
      {target: 'cdn', state: 'ok', at: 'cdn+1'},
    ],
    chips: [
      usersChip([{at: 0, value: 100000}, {at: '300k', value: 300000}]),
      {target: 'users', at: 'images', until: 'sydney', text: 'mostly photos', tone: 'neutral'},
      {target: 'users', at: 'sydney', until: 'cdn', text: 'in Sydney', tone: 'note'},
      {target: 'app', at: 'sydney+0.6', until: 'cdn', text: 'in Virginia', tone: 'note'},
      {target: 'cdn', at: 'cdn+1', text: 'photos nearby', tone: 'mint', icon: 'check'},
      {target: 'app', at: 'changes', text: 'carts, orders', tone: 'neutral'},
      ready('ready-1m', 'ready for ~1M'),
    ],
    packets: [
      {from: 'app', to: 'db', at: 'same+0.4', label: 'GET /home'},
      {from: 'app', to: 'db', at: 'same+1.2', label: 'GET /home'},
      {from: 'users', to: 'cdn', at: 'cdn+0.9'},
    ],
    markers: [{at: 'same-db', until: 'cache', target: 'db', note: 'same reads', side: 'below'}],
  },
};

// 8. Read replicas: reads go to copies, writes to the main database; replication lag hides your own review.
const replicas: Chapter = {
  chapter: 'READ REPLICAS',
  title: 'Copies for reads',
  diagram: {
    frameFrom: steady,
    nodes: [node('users', 0, 0), node('app', 440, 0, 0, undefined, {label: 'App servers'}), node('db', 940, -190), node('replica', 940, 190, 'replicas')],
    edges: [
      {from: 'users', to: 'app', at: 0, rate: 6},
      {from: 'app', to: 'db', at: 0, route: 'vh', label: 'writes', labelAt: 'primary', rate: [{at: '1m', value: 12}, {at: 'primary', value: 1}]},
      {from: 'app', to: 'replica', at: 'primary', route: 'vh', label: 'reads', rate: [{at: 'primary+0.4', value: 10}, {at: 'post', value: 0}, {at: 'own+2', value: 8}]},
      {from: 'db', to: 'replica', at: 'replicas+0.4', dashed: true, label: 'copy'},
    ],
    states: [
      {target: 'db', state: 'hot', at: '1m'},
      {target: 'db', state: 'idle', at: 'primary'},
      {target: 'replica', state: 'hot', at: 'gone'},
      {target: 'replica', state: 'idle', at: 'own'},
    ],
    chips: [
      usersChip([{at: 0, value: 300000}, {at: '1m', value: 1000000}]),
      {target: 'db', at: '1m', until: 'conns', text: 'overloaded', tone: 'coral', icon: 'cross'},
      {target: 'db', at: 'conns', until: 'shared', text: '4,900 / 5,000 connections', tone: 'coral', icon: 'cross'},
      {target: 'db', at: 'shared', until: 'reads', text: '200 connections', tone: 'mint', icon: 'check'},
      {target: 'app', at: 'pooler', until: 'replicas', text: 'via PgBouncer', tone: 'neutral'},
      {target: 'db', at: 'reads', until: 'replicas', text: 'reads ×10', tone: 'neutral'},
      {target: 'db', at: 'writes', until: 'replicas', text: 'writes ×1', tone: 'neutral'},
      {target: 'replica', at: 'lag', text: '~1 s behind', tone: 'note'},
      {target: 'users', at: 'gone', until: 'own+1', text: 'review gone?', tone: 'coral', icon: 'cross'},
      {target: 'users', at: 'own+1', until: 'ready-more', text: 'there it is', tone: 'mint', icon: 'check'},
      ready('ready-more', 'ready for millions'),
    ],
    packets: [
      {from: 'users', to: 'app', at: 'post', label: 'POST review'},
      {from: 'app', to: 'db', at: 'post+1.1', label: 'review'},
      {from: 'app', to: 'replica', at: 'post+2.4', label: 'reload'},
      {from: 'app', to: 'db', at: 'own', label: 'reload'},
      {from: 'db', to: 'app', at: 'own+1', tone: 'mint'},
    ],
    markers: [{at: 'gone+0.6', until: 'own', target: 'replica', note: 'not caught up', side: 'right'}],
  },
};

// 9. Queues: checkout waits only for what the user needs; the rest goes to workers.
const orderSteps = {x: 96, y: 520, w: 760};
const queues: Chapter = {
  chapter: 'QUEUES',
  title: (
    <>
      Don't make checkout <Em>wait</Em>
    </>
  ),
  hud: () => (
    <Checklist
      {...orderSteps}
      rows={[
        {text: 'Save the order', at: 'steps', done: 'need+1'},
        {text: 'Charge the card', at: 'steps+0.6', done: 'need+1.3'},
        {text: 'Send the email', at: 'step-email'},
        {text: 'Update the stock', at: 'step-stock'},
        {text: 'Make the invoice', at: 'step-invoice'},
      ]}
    />
  ),
  diagram: {
    frameFrom: steady,
    area: {x: 96, y: 160, w: 1728, h: 360},
    nodes: [node('users', 0, 0), node('app', 420, 0, 0, undefined, {label: 'App servers'}), node('queue', 880, 0, 'queue'), node('worker', 1260, 0, 'workers')],
    edges: [
      {from: 'users', to: 'app', at: 0, rate: [{at: 'flood', value: 14}]},
      {from: 'app', to: 'queue', at: 'queue+0.3', rate: [{at: 'workers+0.6', value: 3}, {at: 'flood', value: 14}]},
      {from: 'queue', to: 'worker', at: 'workers+0.3', rate: [{at: 'workers+0.6', value: 3}]},
    ],
    states: [
      {target: 'app', state: 'hot', at: 'wait'},
      {target: 'app', state: 'idle', at: 'workers'},
    ],
    chips: [
      {target: 'app', at: 'wait', until: 'workers+1', text: 'checkout: 4 s', tone: 'coral', icon: 'cross'},
      {target: 'app', at: 'workers+1', text: 'checkout: 0.3 s', tone: 'mint', icon: 'check'},
      {target: 'queue', at: 'queue+0.8', text: 'email, stock, invoice', tone: 'neutral'},
      ready('ready-sale', 'ready for spikes'),
    ],
    packets: [{from: 'users', to: 'app', at: 'order', label: 'checkout'}],
  },
};

// 10. Recap: the map we ended with, then the method as a loop; the right half clears for the end screen.
const method = {x: 96, y: 200, w: 900, title: 'The method'};
const recap: Chapter = {
  chapter: 'RECAP',
  title: 'Every piece answered a metric',
  hud: () => (
    <>
      <Checklist
        {...method}
        titleAt="loop"
        rows={[
          {text: 'Monitor the metrics', at: 'loop'},
          {text: 'Find the bottleneck', at: 'find'},
          {text: 'Add the smallest fix', at: 'fix'},
          {text: 'Keep monitoring', at: 'moves'},
        ]}
      />
      <Marker at="moves+0.6" until="beyond" kind="bracket" box={{...checklistRowBox(method, 0), w: 560, h: 3 * 84 + 60}} note="repeat" side="right" />
      <div style={{...abs(96, 620), display: 'flex', gap: 16}}>
        <Badge text="sharding" tone="neutral" at="sharding" />
        <Badge text="multi-region" tone="neutral" at="regions" />
      </div>
      <Badge text="most apps never need these" tone="note" at="most-apps" style={abs(96, 700)} />
      <PaperCard small tilt={0} at="comment" style={abs(96, 800)}>
        Which step is your app at?
      </PaperCard>
    </>
  ),
  diagram: {
    nodes: [
      node('users', 0, 0, 0, 'loop'),
      node('cdn', 380, -280, 0, 'loop'),
      node('storage', 880, -280, 0, 'loop'),
      node('lb', 380, 0, 0, 'loop'),
      node('app', 880, 0, 0, 'loop', {label: 'App servers'}),
      node('cache', 1360, -280, 0, 'loop'),
      node('db', 1360, 0, 0, 'loop'),
      node('replica', 1360, 280, 0, 'loop'),
      node('queue', 880, 280, 0, 'loop'),
    ],
    edges: [
      {from: 'users', to: 'cdn', at: 0, route: 'vh'},
      {from: 'users', to: 'lb', at: 0},
      {from: 'lb', to: 'app', at: 0},
      {from: 'app', to: 'cache', at: 0, route: 'hv'},
      {from: 'app', to: 'storage', at: 0},
      {from: 'storage', to: 'cdn', at: 0, dashed: true},
      {from: 'app', to: 'db', at: 0},
      {from: 'db', to: 'replica', at: 0, dashed: true},
      {from: 'app', to: 'queue', at: 0},
    ],
  },
};

export const ScalingEpisode = () => (
  <Episode
    timing={timing}
    audio={scalingAudio}
    scenes={{
      'cold-open': coldOpen,
      million,
      'one-server': oneServer,
      'split-db': splitDb,
      'scale-up': scaleUp,
      'scale-out': scaleOut,
      'cache-cdn': cacheCdn,
      replicas,
      queues,
      recap,
    }}
  />
);

// Shorts (cut with tools/cut_short.py): portrait layouts that only use the cues inside each cut. Every Short opens
// on a moving diagram. Chips, edge and packet labels sit below the 52 px Shorts floor at these zooms, so node
// colors, markers and the captions carry those words.
const shortStage = stageArea['9:16'];
// 72 px lines and 38 px badges scaled to clear the 52 px floor and fit the 828 px stage.
const LINES_SCALE = 0.8;
const BADGE_SCALE = 1.4;
const LINE_H = 104 * LINES_SCALE;
const scaled = (x: number, y: number, scale: number) => ({position: 'absolute' as const, left: x, top: y, transform: `scale(${scale})`, transformOrigin: 'top left'});
// Top band: the users -> app stream from frame one, replaced by the 230 req/s answer. Bottom band: the math.
const topBand = {x: shortStage.x, y: shortStage.y, w: shortStage.w, h: 330};
const linesTop = topBand.y + topBand.h + 40;
const MillionShortHud = () => (
  <>
    <div style={scaled(shortStage.x, linesTop, LINES_SCALE)}>
      <div style={{width: shortStage.w / LINES_SCALE}}>
        <Line at="users">1,000,000 users a day</Line>
        <Line at="clicks" op="×">20 requests each</Line>
        <Line at="per-day" op="=">20,000,000 a day</Line>
        <Line at="seconds" op="÷">86,400 seconds</Line>
      </div>
    </div>
    <div style={scaled(shortStage.x, linesTop + LINE_H + 8, BADGE_SCALE)}>
      <Badge text="~100k online at once" tone="neutral" at="at-once+0.6" until="clicks" />
    </div>
    <div style={abs(shortStage.x, topBand.y)}>
      <HeroNumber at="per-second+0.4" suffix=" req/s" note="on average" steps={[{at: 'per-second', value: 0}, {at: 'per-second+0.45', value: 230}]} />
    </div>
    <div style={scaled(shortStage.x, topBand.y + 232, BADGE_SCALE)}>
      <Badge text="peaks ×10 ≈ 2,000 req/s" tone="neutral" at="two-k" />
    </div>
  </>
);
const millionPortrait: DiagramProps = {
  area: topBand,
  nodes: [node('users', -200, 0, 0, 'per-second'), node('app', 160, 0, 0, 'per-second')],
  edges: [{from: 'users', to: 'app', at: 0, rate: [{at: 0, value: 6}, {at: 'users', value: 14}]}],
};
export const ScalingMillionShort = () => (
  <Episode
    timing={millionShortTiming}
    audio={millionShortAudio}
    scenes={{million: {chapter: million.chapter, title: <>What <Em>1M users</Em> means</>, hud: MillionShortHud, diagram: millionPortrait}}}
    captions
  />
);

// Two scenes (cut_short.py splits the cut at "The fix"). 1: users fork to B (upper) and A (lower), as in the long
// video; your login lands on A, your next click on B, which has never met you. 2: the servers glide left and the
// shared session store arrives on the right, so both servers can find your session. This cut never names the load
// balancer, and users, servers and the store in one row would shrink the labels below the Shorts floor.
const sessionsPortrait: DiagramProps = {
  nodes: [
    node('users', -170, 0),
    node('app', 170, 120, 0, undefined, {label: 'Server A'}),
    node('app2', 170, -120, 0, undefined, {label: 'Server B', sub: undefined}),
  ],
  edges: [
    {from: 'users', to: 'app', at: 0, rate: [{at: 0, value: 3}, {at: 'login', value: 0}]},
    {from: 'users', to: 'app2', at: 0, rate: [{at: 0, value: 3}, {at: 'login', value: 0}]},
  ],
  states: [
    {target: 'app', state: 'ok', at: 'login+1.1'},
    {target: 'app', state: 'idle', at: 'logged-out'},
    {target: 'app2', state: 'hot', at: 'logged-out'},
  ],
  packets: [
    {from: 'users', to: 'app', at: 'login'},
    {from: 'users', to: 'app2', at: 'next-click'},
  ],
  markers: [{at: 'logged-out+0.6', target: 'app2'}], // no note: the captions say it
};
const statelessPortrait: DiagramProps = {
  nodes: [
    node('app', -150, 120, 0, undefined, {label: 'Server A'}),
    node('app2', -150, -120, 0, undefined, {label: 'Server B', sub: undefined}),
    node('sessions', 230, 0, 'stateless'),
  ],
  edges: [
    {from: 'app', to: 'sessions', at: 'stateless+0.3'},
    {from: 'app2', to: 'sessions', at: 'stateless+0.4'},
  ],
  states: [
    {target: 'sessions', state: 'ok', at: 'session-store'},
    {target: 'app2', state: 'idle', at: 0},
    {target: 'app2', state: 'ok', at: 'session-store+1.1'},
  ],
  packets: [
    {from: 'app', to: 'sessions', at: 'stateless+1.2'}, // your session leaves A's memory
    {from: 'app2', to: 'sessions', at: 'session-store'},
    {from: 'sessions', to: 'app2', at: 'session-store+0.6', tone: 'mint'},
  ],
};
export const ScalingSessionsShort = () => (
  <Episode
    timing={sessionsShortTiming}
    audio={sessionsShortAudio}
    scenes={{
      'scale-out': {chapter: scaleOut.chapter, title: <>Run <Em>two</Em> servers</>, diagram: sessionsPortrait},
      stateless: {chapter: 'STATELESS', title: <>Make them <Em>stateless</Em></>, diagram: statelessPortrait},
    }}
    captions
  />
);

// Users beside the app servers; the copies below-left and the main database below-right, so reads and writes
// fork from the app's bottom and the copy line runs main -> copies without crossing anything.
const lagPortrait: DiagramProps = {
  nodes: [
    node('users', -235, 0),
    node('app', 80, 0, 0, undefined, {label: 'App servers'}),
    node('replica', -80, 270, 'replicas'),
    node('db', 210, 270),
  ],
  edges: [
    {from: 'users', to: 'app', at: 0, rate: 6},
    {from: 'app', to: 'db', at: 0, rate: [{at: 0, value: 12}, {at: 'primary', value: 1}]},
    {from: 'app', to: 'replica', at: 'primary', rate: [{at: 'primary+0.4', value: 10}, {at: 'post', value: 0}, {at: 'own+2', value: 8}]},
    {from: 'db', to: 'replica', at: 'replicas+0.4', dashed: true},
  ],
  states: [
    {target: 'db', state: 'hot', at: 0},
    {target: 'db', state: 'idle', at: 'primary'},
    {target: 'replica', state: 'hot', at: 'gone'},
    {target: 'replica', state: 'idle', at: 'own'},
  ],
  packets: [
    {from: 'users', to: 'app', at: 'post'},
    {from: 'app', to: 'db', at: 'post+1.1'},
    {from: 'app', to: 'replica', at: 'post+2.4'},
    {from: 'app', to: 'db', at: 'own'},
    {from: 'db', to: 'app', at: 'own+1', tone: 'mint'},
  ],
  markers: [{at: 'gone+0.6', until: 'own', target: 'replica'}], // no note: room for the fork; the captions say it
};
export const ScalingLagShort = () => (
  <Episode
    timing={lagShortTiming}
    audio={lagShortAudio}
    scenes={{replicas: {chapter: replicas.chapter, title: <>Replication <Em>lag</Em></>, diagram: lagPortrait}}}
    captions
  />
);
