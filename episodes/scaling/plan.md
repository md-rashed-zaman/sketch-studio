# Scaling: research and plan

Working topic: How apps scale from 1 user to 1 million. Researched 2026-11-06 (YouTube search results, top comments
on 10 competitor videos, and real-world scaling sources).

## 1. What the research found

### The topic is crowded, and generic versions get no views

At least 20 videos are near copies of "Scale from Zero to Millions of Users", the first chapter of Alex Xu's book.
Most uploads from the last 6 months have under 1,000 views:

| Video | Channel | Views | Age | Length | Why it did or did not work |
|---|---|---|---|---|---|
| Let's Handle 1 Million Requests per Second | Cododev | 1.18M | 8 mo | 2:39:18 | Real AWS load test with measured numbers. Top comment: "always measure, never assume" |
| Scale from ZERO to MILLION Users (Hindi) | Concept && Coding | 155k | 4 y | 35:14 | Early to the topic, Hindi, interview prep |
| Scalability Simply Explained in 10 Minutes | ByteByteGo | 120k | 2 y | 9:20 | Big brand, but the top comment says it was "rushed" and "crammed" |
| Scale System From Zero To Million Users | Dev Sense | 112k | 3 y | 9:24 | Clear diagrams, one step at a time, short |
| How Much Does it Cost to Scale an App to 100,000 Users? | Coding with Lewis | 92k | 1 y | 13:29 | Real app, real load test, real bill |
| Scaling from 1 User to 1M Users: Real Architecture Journey | The Desi Architect | 82k | 6 mo | 20:16 | One named app (a food-ordering app) followed the whole way. Comments praise the storytelling |
| scaling your system (0 to 1M users) | Arjay McCandless | 40k | 5 mo | 11:40 | Hook: "most people start scaling too early" |
| 0 to 1 Million Users: 17 Scaling Concepts in Order | System Design School | 5.2k | 2 days | 10:50 | Direct competitor, fresh. Same viral-post hook as our caching video, 17 concepts in 11 min |
| How Apps Scale From 1 User to 1 Million (Animated) | kodblok | 392 | 1 mo | 17:28 | **Our exact working title, already taken** |
| Only video to scale your app to 1 million users | Sukhad Anand | 2.4k | 3 wk | 11:33 | Generic checklist |

### What the winners have in common

1. **Real numbers.** Cododev and Lewis measured instead of listing tools, and those two did best.
2. **One app followed from start to end.** Desi Architect and System Design School both do this, and their viewers
   say it is what made it click.
3. **"Don't do this yet."** Arjay's honest framing (scale only when something breaks) earned trust.

### What viewers say is missing (from the comments)

1. **"1 mil what though? DAU? MAU? concurrent?"** Nobody turns "1 million users" into requests per second.
2. **Too fast.** ByteByteGo's top comment says it was rushed. System Design School packs 17 concepts into 11 minutes.
3. **When to add each piece.** Viewers asked how to know which part to scale next.
4. **What it costs.** Lewis's cost comments got 100+ likes each (one person runs 1-2M monthly users on about $80 a month).
5. **The limits after one big server.** A comment on Cododev asks what comes after vertical scaling: more servers,
   load balancing, replicas, sharding.

### Our channel today

The caching video has 192 views, the Shorts have 18-148, and the channel has 4 subscribers. YouTube shows a small
channel's video to new viewers mainly through search and suggested videos. So the title and thumbnail have to beat
the big channels on a clear promise, not on brand.

## 2. Our angle

**"What breaks first, and how you know."** Follow one app (the shop from the caching video) from 1 user to 1 million.
Every step uses the same 4 beats:

1. **Symptom:** a number on screen goes red (latency, CPU, connections).
2. **Cause:** the one part that is the bottleneck.
3. **Smallest fix:** add one piece, and say what it costs.
4. **New bottleneck:** the fix moves the problem somewhere else, which sets up the next step.

The opening myth-buster, which no competitor covers:

- 1 million daily users × about 20 requests each is about 20 million requests a day.
- That averages about 230 requests a second, with peaks maybe 5-10x higher.
- One decent server can handle a lot of that. ChatGPT (800M users, Jan 2026) still sends every write to one main Postgres server.
- So the real enemy is not "1 million" in general. It is the specific part that breaks first.

Why this beats each type of competitor:

| They do | We do |
|---|---|
| Recite 15-17 tools | 7 steps, each one earned by a visible symptom |
| Say "millions" without defining it | Turn users into requests per second in the first minute |
| Show a static final diagram | The diagram grows live, and each new piece morphs in (our kit already does this) |
| Skip cost | One line per step: what it adds to the monthly bill (illustrative, labeled) |
| Imply you need everything | End with "most apps never need steps 6 and 7" |

## 3. Title and thumbnail

The exact working title is taken (kodblok), so use a variant that keeps the search words "scale" and "1 million users"
and matches the caching title's pattern "(and how it ...)":

1. **How Apps Scale to 1 Million Users (and What Breaks First)** - recommended
2. 1 Million Users Is Only 230 Requests a Second - test as an A/B title later, since it is the most surprising
3. What Breaks First When Your App Hits 1 Million Users

Thumbnail, in the same style as the caching thumbnail (incident graph, now in Day Paper):

- **A:** One server box with a users counter at "1,000,000", one part glowing red, and the text "WHAT BREAKS FIRST?"
- **B (Test & compare):** A big "1M users = 230 req/s?" with the server calm and green

Make one labeled image per option for review (see the feedback memory on separate option images).

## 4. Script outline (about 11-12 min, about 1,650 spoken words, 10 scenes)

| # | Scene | Users | Symptom on screen | Fix | Kit pieces |
|---|---|---|---|---|---|
| 1 | Cold open | - | Counter jumps to 1M and the app goes red | "What breaks first?" | HeroNumber, SystemDiagram |
| 2 | What 1 million means | 1M | DAU → requests a day → requests a second (about 230 average) | Back-of-envelope math | HeroNumber, KeyValueCard |
| 3 | One server | 1-1k | Fine. Everything on one box (app + DB) | Do nothing yet | SystemDiagram, LoadMeter |
| 4 | Split the database | ~10k | App and DB fight for CPU and memory | Move the DB to its own server, add indexes first | LoadMeter, CodeCard (an index) |
| 5 | Bigger server first | ~50k | CPU at 90% | Vertical scaling: cheap and simple, but it has a ceiling and is a single point of failure | LoadMeter, Badge |
| 6 | Load balancer + stateless app | ~100k | One app box is the limit, and sessions break when you add a second | Load balancer with health checks, sessions moved to Redis, photos moved to object storage (S3) | SystemDiagram (morph), Marker |
| 7 | Cache + CDN | ~300k | The DB is hot from repeated reads, images are slow far away | Cache (link to the caching video), CDN for static files | LatencyBars, SystemDiagram |
| 8 | Read replicas | ~1M | Connections near the limit, then reads overload the primary | Connection pooler (PgBouncer), replicas for reads, and the replication-lag gotcha (you post, refresh, and it's gone) | SystemDiagram, TtlTimeline-style lag bar |
| 9 | Queues | ~1M | Sending emails and resizing images block requests | Queue + workers | SystemDiagram (queue, worker) |
| 10 | Recap + "you probably don't need" | - | The full diagram with the 4-beat loop | Sharding and multi-region are for well past 1M, so they get a tease, not a lesson | Checklist, Marker |

Each fix ends with a mint "✓ ready for ~N" chip under the users counter (N is where the next scene breaks).

Kept out on purpose (the "too fast" complaint): sharding in depth, consistent hashing, CQRS, multi-region,
microservices. Each can be its own video later.

## 5. Facts to verify while scripting

Every number gets a source in the description, or an "illustrative" label, like the caching video.

- ChatGPT's database (replaced Stack Overflow, whose 2016 numbers feel dated): OpenAI's own post, 22 Jan 2026.
  https://openai.com/index/scaling-postgresql/ (verified: one primary for all writes, nearly 50 read replicas).
- Instagram: one server at launch in October 2010, about 1M users within about 2 months. Use Krieger's own slides.
  https://speakerdeck.com/opbeat/how-we-scaled-instagram-by-mike-krieger
- Requests per user per day (20 is an assumption): say "say each user makes 20 requests", not a claimed average.
- Cost per step: label it as illustrative, from public cloud list prices, rounded.

## 6. Shorts (cut from the long video with tools/cut_short.py)

1. **"1 million users is only 230 requests a second"**, from scene 2. Strongest hook, and it stands on its own.
2. **"Why adding a second server logs your users out"**, from scene 6 (sessions). A "here's why" reveal, like the
   stampede Short that did best.
3. **Optional: "You posted it, refreshed, and it's gone"**, from scene 8 (replication lag).

Link each Short to the long video with Related video, as before.

## 7. Publishing

- On the caching video, change the description line "Next: scaling an API from 100 users to 1 million" to the new
  video's link, and point its end screen to the new video.
- At about 9:40 in the new video, link to the caching video with a card.
- Tags: scaling, system design, scale to million users, load balancer, horizontal scaling, vertical scaling, read
  replicas, cdn, message queue, stateless, backend, system design interview.
- Same release routine as caching: subtitles, chapters, thumbnail A/B, pinned comment, end screen.

## 8. Production steps and time

| Step | Who | Time |
|---|---|---|
| 1. Script with cues (script.md) | Claude | about 1 hour |
| 2. Script review | You | 20-30 min |
| 3. Storyboard (storyboard.md) | Claude | about 1 hour |
| 4. Record the voice, one file per scene | You | about 1 hour |
| 5. Timing and captions (existing tools) | Claude | 15 min |
| 6. Build episode.tsx, review stills | Claude | 4-6 hours |
| 7. Render, review the full video | Claude + you | about 1 hour |
| 8. Thumbnails A and B, then publish | Claude + you | about 1 hour |
