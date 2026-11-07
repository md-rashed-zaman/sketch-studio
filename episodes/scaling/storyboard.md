# Storyboard: How Apps Scale to 1 Million Users

The visual plan for `script.md`. Rules: `../../design/02-design-system.md` (Day Paper, option C icons,
continuity first). Series recipe: **Scale It**: one system on a wide canvas, left to right, a load meter at the
bottom; each step: the number rises, the bottleneck turns coral, the marker circles it, the new piece enters,
the number goes mint.

## Cast (ids shared across chapters so transitions morph)

| id | kind | label | first seen |
|---|---|---|---|
| `users` | users | Users | 1 |
| `app` | service | App server (sub "A" from scene 6, the lower one) | 1 |
| `db` | database | Database | 4 |
| `app2` | service | App server (sub "B", the upper one); teased in scene 1 | 1 |
| `lb` | loadBalancer | Load balancer | 6 |
| `sessions` | cache | Sessions (Redis) | 6 |
| `storage` | storage | Photos (S3) | 6 |
| `cache` | cache | Cache (Redis) | 7 |
| `cdn` | cdn | CDN | 7 |
| `replica` | database | Replica | 8 |
| `queue` | queue | Queue | 9 |
| `worker` | worker | Workers | 9 |

**Color roles:** request cobalt, ok mint, overload coral, marker orange pen (about one per chapter).
**Numbers:** every user count, latency and CPU figure is illustrative except OpenAI's (scene 2, sourced).
**Running counter:** a users chip under `users` carries the scale step in every chapter (1 → 10k → 50k → 100k → 300k → 1M).
**Milestones:** a spoken refrain, "Now the shop is ready for ~N", with the cue on "ready" so the chip holds ~3 s. Each fix ends with a mint ✓ chip under the users counter, "ready for ~N", where N is the next chapter's
breaking point: ~50k (split-db), ~100k (scale-up), ~300k (scale-out), ~1M (cache-cdn), millions (replicas), spikes (queues).

## Scenes

### 1 cold-open (sheet label "INTRO")
Layout: `users → app`, the app box holds the whole shop.

| cue | visual |
|---|---|
| shop | users and app sketch in; users chip `1 user` (neutral); a slow dot stream |
| viral | users counter rolls 1,000 → 10,000 → 1,000,000 (coral over 100k); stream thickens |
| breaks | app turns hot; marker circle on app, note "what breaks?" |
| tools | a dim pile of tool badges (load balancer, CDN, Kafka, sharding ...) fades in and is crossed out (marker "not a list") |
| ladder | the tool pile leaves; a milestone ladder climbs on the right, bottom to top: 10k ↑ 50k ↑ 100k ↑ 300k ↑ 1M (neutral chips, no fixes named) |
| teaser-two | the ladder leaves; a second app server sketches in under the first, users fork to both |
| teaser-out | the second server turns coral; users chip "logged out" (coral ✕). A spoken teaser, explained in scene 6 |

### 2 million: "What 1 million users means"
No diagram. A stepper of hero numbers (HeroNumber + small paper cards), one step per cue, left to right:

| cue | visual |
|---|---|
| users | `1,000,000` daily users (narration: "daily active users") |
| at-once | badge "~100k online at once" in the second line's slot, until clicks (concurrency is a slice of DAU) |
| clicks | `× 20` requests each (note "say") |
| per-day | `= 20,000,000` a day |
| seconds | `÷ 86,400` seconds |
| per-second | hero `≈ 230 req/s` (mint) |
| peak | badge `peaks ×10 ≈ 2,000 req/s` under the stack |
| openai | paper card: "ChatGPT: 800M users, one main database server takes every write", source "OpenAI Engineering, Jan 2026" |
| one-db | marker circle on the card, note "just one" |

### 3 one-server: "Start with one server"
| cue | visual |
|---|---|
| server | users + app (from the intro morph) |
| inside | chips under app: `code`, `database`, `photos` |
| request | a request packet in, a mint reply out |
| right | mint ✓ badge "right way to start" |
| metrics | three small meters beside the app: CPU, memory, page time (all mint, low) |
| rule | marker circle on the meters, note "watch these" |

### 4 split-db: "Split the database"
| cue | visual |
|---|---|
| 10k | users chip → 10,000; page time meter rises (coral) |
| fight | CPU and memory meters coral; app hot |
| slow-query | CodeCard: `SELECT * FROM products WHERE name LIKE ...` with "full scan" note |
| index | the code card gains `CREATE INDEX ...`; latency chip rolls 800 → 5 ms (mint) |
| split | `db` sketches in to the right; app calms |
| hop | connector app → db draws, chip "+1 network hop" (neutral) |
| ready-50k | users chip "✓ ready for ~50k" (mint) |

### 5 scale-up: "Buy a bigger server"
| cue | visual |
|---|---|
| 50k | users → 50,000; CPU chip 90% (coral) on app |
| bigger | app box gets a "2× CPU, 2× RAM" chip; CPU rolls to 45% (mint) |
| ready-100k | users chip "✓ ready for ~100k" (mint) until spof |
| vertical | badge "vertical scaling" |
| ceiling | a cost-vs-size bar row: S, M, L, XL; the last one coral "no bigger one" |
| spof | app goes dim, users chip "shop down", marker cross on app, note "single point of failure" |

### 6 scale-out: "Run more servers" (no title card; the scene pays off the cold-open teaser without naming it)
Layout: A sits below B, so at the chapter 7 morph A glides up into "App servers" and never crosses "Photos (S3)".

| cue | visual |
|---|---|
| second | `app2` (B) sketches in above app (A); both "App server" with sub A / B |
| lb | `lb` sketches in between users and the two apps |
| one-dies | app2 dims, chip "down" (coral ✕) (health checks fail), traffic flows through app; then app2 back |
| login | packet `login` users → lb → app (A); chip "knows you" (mint ✓) on A |
| next-click | packet `GET /cart` → lb → app2 (B) |
| logged-out | app2 hot; chip "logged out" (coral ✕); marker circle on B, note "never met you" |
| stateless | the A and B chips fade out |
| session-store | `sessions` sketches in right of A, both apps connect to it; chip "your session" (mint ✓) |
| upload | packet `photo.jpg` users → lb → app (A); chip "photo on disk" on A |
| no-photo | app2 hot, chip "no photo" (coral ✕) |
| s3 | `storage` (Photos (S3)) sketches in top right, both apps connect; chip "every server" (mint) |
| any | packets to A and B, both mint |
| autoscale | badge "+ auto-scaling" |
| ready-300k | users chip "✓ ready for ~300k" (mint) |

### 7 cache-cdn: "Cache and CDN"
| cue | visual |
|---|---|
| 300k | users → 300,000; db hot, all app→db edges coral |
| same | three packet labels `GET /home` repeating |
| cache | `cache` sketches in beside db; db calms |
| video | paper card "Caching video ↗" (end-screen link reference) |
| images | `storage` sits above app (carried over from scene 6); users chip "mostly photos" (what they download) |
| sydney | note chips "in Sydney" (users) and "in Virginia" (app) |
| cdn | `cdn` sketches in; dashed "copies" line from storage to cdn; chip "photos nearby" (mint) |
| changes | app chips "carts, orders" |
| ready-1m | users chip "✓ ready for ~1M" (mint) |

### 8 replicas: "Read replicas"
| cue | visual |
|---|---|
| 1m | users → 1,000,000; db hot |
| conns | db chip "4,900 / 5,000 connections" (coral ✕) |
| pooler | chip "via PgBouncer" under the app servers; db chip "200 connections" (mint), db stays hot |
| reads | a cobalt stream labeled "reads" (thick) |
| writes | a thin stream "writes" |
| replicas | `replica` ×2 sketch in under db, dashed copy lines |
| primary | writes → db, reads → replicas; db calms |
| lag | a lag bar under the replicas ("~1 s behind", illustrative) |
| post | packet "POST review" → db |
| gone | reload reads from replica: chip "review?" coral ✕; marker circle on the replica |
| own | the reload re-routes to db: chip "your review ✓" mint |
| ready-more | users chip "✓ ready for millions" (mint) |

### 9 queues: "Queues"
| cue | visual |
|---|---|
| order | a checkout packet arrives at app |
| steps | Checklist of 5 steps: save order, charge card, send email, update stock, make invoice |
| wait | a timer chip `4 s` (coral) |
| need | rows 1-2 stay bright, rows 3-5 dim |
| queue | `queue` sketches in; rows 3-5 slide into it as job chips |
| workers | `worker` sketches in after the queue; jobs flow out; checkout chip `300 ms` (mint) |
| flood | many jobs pile into the queue (its counter rises), checkout chip stays mint |
| ready-sale | users chip "✓ ready for spikes" (mint) |

### 10 recap: "The method"
| cue | visual |
|---|---|
| full | the whole final map in one overview: users, CDN, LB, A/B, sessions, cache, db, replicas, queue, workers |
| loop | Checklist: monitor the metrics |
| find | find the bottleneck |
| fix | add the smallest fix |
| moves | keep monitoring (bracket marker "repeat") |
| beyond | dim badges "sharding", "multi-region" with note "later, maybe never" |
| comment | paper card "Which step are you at?"; right half clears for the end screen |
