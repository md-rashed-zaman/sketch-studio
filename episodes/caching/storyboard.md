# Storyboard: How Caching Actually Works

The visual plan for `script.md`. The design rules are `../../design/02-design-system.md` (Night Paper, option C icons,
continuity-first transitions, QA checklist). Every row is one cue: what changes, and what should be on screen.

## Cast (node ids are shared across chapters so transitions can morph)

| id | kind | label | form |
|---|---|---|---|
| `users` | users | Users | free icon |
| `app` | service | App server | boxed, `server` icon |
| `cache` | cache | Cache (Redis) | free icon |
| `db` | database | Database | free icon |
| `browser` | client | Browser | free icon |
| `cdn` | cdn | CDN edge | free icon |
| `cpu` | worker | CPU | boxed, `cpu` icon |

**Marker rule (24 Oct):** every marker points at a specific object; no underlines under empty space, connectors or whole diagrams; about one per chapter. Jokes and quotes are spoken only.

**Color roles:**
- request: cobalt
- hit / ok: mint
- miss / overload: coral
- read-through's cache-as-worker: violet only if it must be told apart from cache-aside (scene 6)
- marker: amber, one at a time

## Kit work this episode needs (build once, reuse later)

| Component | Used in | Notes |
|---|---|---|
| `LatencyBars` | 3 | Two horizontal bars on a log-ish scale with labels "memory ~100 ns" and "DB query ~1-10 ms (typical)". Bars grow on cue. Label them "typical". |
| `KeyValueCard` | 3, 7 | Paper-card style key/value pair: `user:42 → { name: "Anna" }`. The value can swap with a coral/mint flash. |
| `SlotGrid` | 9 | 6 fixed cache slots with key chips, per-slot "last used" and "hits" mini-counters. Animates insert, evict (slide out to an "evicted" tray) and touch. |
| `TtlTimeline` | 8 | A horizontal time axis with an entry bar that shrinks to zero, an "expired" tick, short-vs-long TTL comparison rows. |
| `Checklist` | 1, 12 | 4 rows that tick in on cue (marker underline on the active row). |
| `Counter` + `LoadMeter` | 2, 5, 10 | Already in the kit. |

## Scenes

### 1 cold-open (title-less hook; sheet label "INTRO")
**Layout:** overview of `users → app → db` in a row.

| cue | visual |
|---|---|
| calm | 50 req/s counter (mint) under users; a few packet dots flow; latency chip on app `80 ms` (mint) |
| spike | Counter rolls to 5,000 req/s; packet stream density rises |
| slow | db turns coral and pulses; latency chip rolls to `3 s` (coral) |
| idea | No marker (narration carries it); the diagram holds |
| fast | `cache` sketches in between app and db (above the line); db calms to neutral; latency chip rolls to `8 ms` (mint) |
| checklist | `Checklist` replaces the diagram on the right third: where / gets in / stays fresh / thrown out (4 rows tick in quickly, 120 ms stagger), then a 5th row "the bug" in coral with a marker circle |

→ **Transition:** morph (users, app, db shared; cache and checklist leave).

### 2 problem: "Every read hits the database"
**Layout:** overview `users → app → db`. LoadMeter at the bottom.

| cue | visual |
|---|---|
| users / app / db | Each sketches in on its cue (icons draw on, labels follow) |
| load-low | Counter `50 req/s` (mint) on users→app edge; LoadMeter 2% |
| same | Packets get labels in a short flow shot (focus app→db): `GET /home`, `GET /home`, `GET user:42`, `GET /home`. Marker circles the repeated `/home` packets, note "same question" |
| db-work | Camera focuses db; three small step chips appear under it: `find rows` → `read` → `send` (neutral) |
| load-high | Back to overview; counter rolls to `2,400 req/s`; LoadMeter 80% coral |
| db-hot | db coral + overload pulse; chip `✕ OVERLOADED` |

→ **Transition:** morph (app, db shared; users stays too).

### 3 cache-intro: "A cache keeps recent answers close"
**Layout:** app left, cache center, db right; lower half for explainers.

| cue | visual |
|---|---|
| cache-in | `cache` sketches in between app and db; connectors app→cache, cache→db (graphite) |
| memory | Chip under cache: `in memory` (neutral) plus small paper card "Redis / Memcached" |
| latency | `LatencyBars` slide up into the lower half |
| latency-gap | Memory bar tiny (mint, `~100 ns`), DB bar long (coral, `~1-10 ms`, label "typical"); marker arrow pointing at the end of the DB bar, note "1000s x slower" |
| kv | LatencyBars exit; `KeyValueCard` appears centered under the cache |
| key | Key side highlights cobalt: `user:42` |
| value | Value side highlights: `{ name: "Anna" }` |
| hit-word | Big chip `✓ HIT` (mint) left of the card |
| miss-word | Big chip `✕ MISS` (coral) right of the card |

→ **Transition:** morph (app, cache, db shared; the card and chips leave).

### 4 cache-aside: "The app does the work"
**Layout:** app left, cache top-right, db bottom-right (as in the sample). Connectors: app→cache "check", app→db "on miss".

| cue | visual |
|---|---|
| pattern | Title types; connectors draw on |
| check-42 | Focus shot; packet `GET user:42` travels app→cache (labeled, cobalt) |
| hit | cache mint; chip `✓ HIT`; return packet (mint) cache→app |
| db-idle | db dims to 50%; small note under db "never asked" (pencil) |
| check-88 | Packet `GET user:88` app→cache |
| miss | cache coral flash; chip `✕ MISS`; marker loop on cache, note "extra trip" |
| db-read | Packet app→db (cobalt); db brightens |
| db-return | Return packet db→app (mint) |
| write-back | Packet app→cache labeled `SET user:88`; chip changes to `✓ CACHED` |
| next-hit | Quick replay: `GET user:88` → `✓ HIT` |
| cold | Overview; a small paper note under app: "first read is slow" (pencil) |

→ **Transition:** morph (all shared).

### 5 hit-ratio: "One number decides it"
**Layout:** users left feeding app; cache and db right; big `HeroNumber` top-right for the hit ratio; LoadMeter under db.

| cue | visual |
|---|---|
| ratio | HeroNumber `0%` sketches in, label "hit ratio" |
| load | Counter on users→app `2,400 req/s` |
| ratio-90 | HeroNumber rolls to `90%`; dot stream splits: 9 of 10 dots to cache (mint), 1 of 10 to db |
| db-240 | Counter on app→db `240 req/s` |
| db-calm | db coral → neutral; LoadMeter drops to 8%; marker circle around the `240 req/s` counter chip, note "1/10 the load" |
| ratio-99 | HeroNumber `99%` |
| db-24 | Counter `24 req/s`; LoadMeter 1% |

→ **Transition:** morph.

### 6 read-through: "The cache does the work" (rewritten 24 Oct after user feedback)
**Goal:** make "the database read moves out of your code into the cache" something the viewer *sees*, not a phrase.

**Layout:**
- Top band: the two systems side by side, compact. Left: cache-aside (app talks to cache and db). Right: read-through (app → cache → db).
- Lower stage: two large code cards, JetBrains Mono 40 px, each under its system:
  - Left card titled "your app (cache-aside)"
  - Right card titled "your app (read-through)"
- A dashed group box labeled "cache layer" sits around the right-hand cache icon, ready to receive the loader.

| cue | visual |
|---|---|
| rt-in | Right system sketches in; left system dims to 50% |
| rt-app-only | Right: app→cache connector cobalt; ghost app→db line with marker cross-out, note "never" (as now) |
| rt-fetch | Right: packet cache→db (violet, "cache fetches") |
| rt-fill | Right: return packet db→cache; chip `✓ CACHED` |
| *(line: "easiest to see in the code")* | Camera shifts down to the code cards; systems stay visible but smaller |
| step-check | Left card types line 1 `user = cache.get(id)`, highlighted, with step badge `1` |
| step-read | Lines 2-3 type: `if user is None:` / `    user = db.read(id)`, highlighted, badge `2` |
| step-save | Line 4 `    cache.set(id, user)`, badge `3`. All 4 lines stay; small label under the card: "3 steps in your code" |
| code-through | Right card types one line: `user = cache.get(id)` (mint highlight); label "1 step in your code" |
| loader-move | **Signature beat:** the `db.read(id)` text in the left card lifts out and glides (morph, 1000 ms) into the "cache layer" box under the right cache icon. The left lines 2-4 dim to 40% as it leaves. No marker. |
| loader | Inside the cache layer box the line completes as `loader = lambda id: db.read(id)`; label "set once"; a tiny cobalt pulse goes cache → loader → db to show it runs on a miss |
| examples-rt | Two small chips under the cache layer: `Caffeine (Java)` and `Amazon DAX (DynamoDB)` |
| one-loader | Three request packets labeled `user`, `admin`, `report` all funnel into the single loader box; marker circle around the loader box, note "one rule for all" |
| control | Left card brightens again and gains a highlighted line `if admin: return db.read(id)` above line 1; small label "your rules, your code" |
| compare-aside | Left card + system brighten; label "app does the work" |
| compare-through | Right card + system brighten; label "cache does the work" |

**Rules:**
- Code text is at least 40 px.
- No more than one marker in the chapter (the "one rule for all" circle). The rt-app-only cross-out is the existing exception; drop it if the chapter then has two markers and they compete.
- Keep each code card at 48 columns or fewer.

### 7 writes: "When data changes"
**Layout:** app left, cache top-right, db bottom-right, with `KeyValueCard`s next to cache and db.

| cue | visual |
|---|---|
| update | Packet `UPDATE user:42` app→db |
| new-name | db's card value changes to `"Ana"` (mint flash) |
| stale | Cache card still `"Anna"`: coral outline; marker circle, note "stale!" |
| three | Three small tabs appear at the top: write-through / write-back / write-around |
| wt / wt-both | Tab 1 active; one write packet splits to cache and db at once; both cards update |
| wt-slow | Chip on app `write = 2 stores` (neutral) |
| wb / wb-cache | Tab 2; packet only to cache; cache card updates |
| wb-flush | A delayed packet cache→db (dashed path, "later") |
| wb-crash | Before the flush lands, cache turns coral with `✕` and the pending packet fades; note "lost" |
| wa / wa-db | Tab 3; packet only to db |
| wa-fill | Next read: miss then fill (fast replay) |
| delete | Tabs dim; a new chip appears: `UPDATE db` then `DEL user:42`; cache card disappears |
| fresh | Read packet → miss → fill with `"Ana"` (mint); no marker (the mint state says it) |

→ **Transition:** morph (cache shared; app and db leave).

### 8 freshness: "TTL and invalidation"
**Layout:** cache icon top-left (small), `TtlTimeline` across the stage.

| cue | visual |
|---|---|
| fan | Three faint copies of the cache icon (web, mobile API, worker) appear, connected to one db; marker note "where else?" |
| ttl | Copies fade; the timeline appears with an entry bar labeled `TTL` |
| ttl-5 | Bar label `5 min` |
| expire | Bar shrinks to 0 over 1 s (time-lapse), tick `expired` (pencil), then a refill bar starts (miss → fetch) |
| ttl-short | Row 2: short TTL, many refill ticks (misses) in coral, freshness chip mint |
| ttl-long | Row 3: long TTL, few refills, freshness chip coral "stale risk" |
| examples | Two paper cards: "stock price: seconds", "product text: hours" |
| quote | Spoken only: no card, no marker. The TTL timeline rows stay on screen |

→ **Transition:** next-sheet pan (nothing shared with eviction's slot grid).

### 9 eviction: "Something has to go"
**Layout:** `SlotGrid` with 6 slots centered; a new key waiting at the left; "evicted" tray at the right.

| cue | visual |
|---|---|
| full | Slots fill one by one (60 ms stagger); chip `FULL` (coral) |
| new-key | New key chip `user:99` slides in from the left and waits |
| policy | Title "Eviction policy"; three tabs: LRU / LFU / FIFO |
| lru | Tab LRU; each slot shows "last used" seconds-ago mini labels |
| lru-out | The slot with the oldest "last used" slides to the tray; `user:99` takes its place; marker circle around the evicted card in the tray, note "oldest use" |
| lfu | Tab LFU; slots show hit counts |
| lfu-out | Lowest count evicted; replay |
| fifo | Tab FIFO; slots show insert order 1-6 |
| fifo-out | Slot 1 evicted even though it has the highest hit count (shown); marker circle around the evicted card, note "hottest key gone" |
| default | LRU tab highlighted mint; chip `good default` |

→ **Transition:** title card **"The bug"** (one of the episode's title cards), then pan.

### 10 stampede: "Cache stampede"
**Layout:** users (as a crowd: dot stream) → app → cache (top) / db (bottom right). LoadMeter under db.

| cue | visual |
|---|---|
| hot-key | Cache shows key chip `/home` with a TTL bar |
| all-hits | Dense mint dot stream into the cache; counter `10,000 req/s`; db idle |
| expires | TTL bar hits 0; key chip fades; brief freeze (0.4 s hold) |
| herd | Every dot turns coral at the cache (misses) |
| db-flood | Coral stream redirects to db; LoadMeter shoots to 100% |
| down | db `✕ DOWN`, overload pulse; app turns coral too; marker circle around db+app, note "stampede" |
| lock | Fix 1 overlay: only one packet goes to db, others wait in a small queue at app (chip `1 rebuilds`) |
| jitter | Fix 2: three TTL bars with slightly different lengths expiring at different times |
| early | Fix 3: refresh packet before the TTL bar hits 0 (mint) |

→ **Transition:** next-sheet pan.

### 11 layers: "Caches everywhere"
**Layout:** wide overview, left to right: browser → CDN edge → app (with cache) → db (with memory) → cpu (small, under db).

| cue | visual |
|---|---|
| everywhere | Camera starts close on the browser |
| browser | Browser icon + chip "images, scripts" |
| cdn | Track a packet to the CDN edge; chip "whole pages" |
| edge | Paper card map hint: "London user → London edge (not Virginia)", two dots with distances |
| app-cache | Pan to app + cache; chip "query results" |
| db-cache | db chip "hot data in memory" |
| cpu | cpu node sketches in; chip "L1 / L2 / L3" |
| same-idea | Overview of all layers, all icons briefly lit together; no marker |

→ **Transition:** next-sheet pan.

### 12 recap: "Four decisions"
**Layout:** `Checklist` on the left half; the small cache-aside system on the right half as a reminder.

| cue | visual |
|---|---|
| four | Checklist title "Every cache = 4 decisions" |
| d1 | Row 1 ticks: "Gets in: cache-aside / read-through" |
| d2 | Row 2: "Stays fresh: write strategy + TTL" |
| d3 | Row 3: "Thrown out: LRU" |
| d4 | Row 4: "Hot key expires: no stampede" (coral → mint when ticked) |
| next | Rows dim; end card: "Next: Scale an API from 100 to 1M users" (paper card) in the end-screen-safe area |

Leave the final 5-20 s visually calm for YouTube end-screen elements (no content in the end-screen zones).
