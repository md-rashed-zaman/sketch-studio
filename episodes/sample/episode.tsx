import {Em, Episode, type Chapter} from '../../kit';
import timing from './timing.json';

export const sampleAudio = 'sample/audio/voice.wav';

// Chapter 1, overview shot: every read goes to the database until it overloads; then a cache enters.
// App server, Cache and Database carry into chapter 2 (same ids), so the change is a shared-element morph.
const problem: Chapter = {
  chapter: 'THE PROBLEM',
  title: (
    <>
      Every read hits the <Em tone="coral">database</Em>
    </>
  ),
  diagram: {
    nodes: [
      {id: 'users', label: 'Users', kind: 'users', x: 150, y: 0, at: 'app'},
      {id: 'app', label: 'App server', kind: 'service', x: 650, y: 0, at: 'app+0.06'},
      {id: 'db', label: 'Database', kind: 'database', x: 1250, y: 0, at: 'app+0.12'},
      {id: 'cache', label: 'Cache', kind: 'cache', x: 950, y: -290, at: 'cache-in'},
    ],
    edges: [
      {from: 'users', to: 'app', at: 'requests', rate: {from: 2, to: 12, at: 'traffic-up', over: 3}},
      {from: 'app', to: 'db', at: 'requests', rate: {from: 2, to: 12, at: 'traffic-up', over: 3}},
      {from: 'app', to: 'cache', at: 'cache-in+0.3', route: 'vh'},
    ],
    states: [{target: 'db', state: 'hot', at: 'db-red'}],
    chips: [
      {
        target: 'app',
        at: 'requests',
        counter: {steps: [{at: 'requests', value: 5}, {at: 'traffic-up', value: 2400}], unit: ' req/s', threshold: 1000},
      },
      {target: 'db', at: 'db-red', text: 'OVERLOADED', tone: 'coral', icon: 'cross'},
    ],
  },
};

// Chapter 2, flow shot: a hit, a miss (marked), the database read and the write-back.
const cacheAside: Chapter = {
  chapter: 'CACHE-ASIDE',
  title: (
    <>
      Cache-aside: the <Em>app</Em> does the work
    </>
  ),
  diagram: {
    nodes: [
      {id: 'app', label: 'App server', kind: 'service', x: 0, y: 0, at: 'pattern'},
      {id: 'cache', label: 'Cache', kind: 'cache', x: 760, y: -230, at: 'pattern+0.06'},
      {id: 'db', label: 'Database', kind: 'database', x: 760, y: 230, at: 'pattern+0.12'},
    ],
    edges: [
      {from: 'app', to: 'cache', at: 'pattern+0.3', route: 'vh', label: 'check'},
      {from: 'app', to: 'db', at: 'pattern+0.4', route: 'vh', label: 'on miss'},
    ],
    packets: [
      {from: 'app', to: 'cache', at: 'check-42+1.2', label: 'GET user:42'},
      {from: 'cache', to: 'app', at: 'hit', label: 'user:42', tone: 'mint'},
      {from: 'app', to: 'cache', at: 'check-88+1.2', label: 'GET user:88'},
      {from: 'app', to: 'db', at: 'db-read+0.2', label: 'GET user:88'},
      {from: 'db', to: 'app', at: 'db-read+1.3', label: 'user:88', tone: 'mint'},
      {from: 'app', to: 'cache', at: 'write-back', label: 'SET user:88'},
    ],
    states: [
      {target: 'app>cache', state: 'active', at: 'check-42+1.2'},
      {target: 'app>cache', state: 'idle', at: 'db-read'},
      {target: 'app>db', state: 'active', at: 'db-read+0.2'},
      {target: 'app>db', state: 'idle', at: 'write-back'},
      {target: 'app>cache', state: 'active', at: 'write-back'},
    ],
    chips: [
      {target: 'cache', at: 'hit', until: 'check-88', text: 'HIT', tone: 'mint', icon: 'check'},
      {target: 'cache', at: 'miss', until: 'write-back', text: 'MISS', tone: 'coral', icon: 'cross'},
      {target: 'cache', at: 'write-back+1', text: 'CACHED', tone: 'mint', icon: 'check'},
    ],
    markers: [{at: 'miss', until: 'db-read', target: 'cache', note: 'extra trip', side: 'right'}],
    shots: [
      {at: 0, overview: true},
      {at: 'check-42', focus: ['app', 'cache']},
      {at: 'check-88', overview: true},
    ],
  },
};

export const SampleEpisode = () => <Episode timing={timing} scenes={{problem, 'cache-aside': cacheAside}} audio={sampleAudio} />;
