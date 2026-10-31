# How Caching Actually Works

Series: How It Works (pillar 1, System Design). Target length: ~10 min (about 1,450 spoken words).
Only lines inside `## scene:` blocks are narration. `{cue:name}` tags are never spoken: each one fires at
the end of the word before it. The visual plan for every cue is in `storyboard.md`.

Recording: one file per scene in `audio/raw/`, named by scene number:
`01-cold-open.wav`, `02-problem.wav`, ... `12-recap.wav`. Say a whole sentence again if you stumble.

## scene: cold-open | pattern: request-path
Your app works fine {cue:calm} with fifty users.
Then a post goes viral, {cue:spike} five thousand people show up, and every page takes three seconds {cue:slow} to load.
Most of the time, the fix is one idea. {cue:idea}
Keep a copy of the answer somewhere fast, {cue:fast} so you never have to work it out twice.
That's caching. By the end of this video, {cue:checklist} you'll know where to put a cache, how data gets in, how it stays fresh, what gets thrown out,
and the one bug that takes down even big companies. Let's build it from scratch.

## scene: problem | pattern: scale-step
Here's a simple app. {cue:users} Users send requests {cue:app} to an app server, {cue:db} and the app reads from a database.
At fifty requests a second, {cue:load-low} this is completely fine.
But look at what those requests are asking for. {cue:same}
Most of them want the same few things: the home page, the top products, the same user profiles.
And every single time, the database does the full work again: {cue:db-work} find the rows, read them, send them back over the network.
Now grow the traffic. {cue:load-high} Two thousand four hundred requests a second.
The database is doing the same expensive work over and over, {cue:db-hot} and it's the first thing to fall over.
So the real question is simple. Why ask the database a question it just answered?

## scene: cache-intro | pattern: before-after
So we put something fast in front of it: a cache. {cue:cache-in}
A cache is a small, fast store that keeps recent answers, usually in memory. {cue:memory} Tools like Redis or Memcached.
Why memory? Speed. {cue:latency}
Reading from memory takes nanoseconds. A database query over the network usually takes milliseconds. {cue:latency-gap}
That's thousands of times slower.
Every entry in a cache {cue:kv} is a key and a value.
The key is the question, {cue:key} like user forty-two. The value is the answer, {cue:value} that user's data.
When you ask for a key, there are only two outcomes. It's there, {cue:hit-word} that's a hit.
Or it isn't, {cue:miss-word} that's a miss.
Everything else in caching is about those two words.

## scene: cache-aside | pattern: request-path
The most common way to use a cache is called cache-aside. {cue:pattern}
The cache sits beside your main flow, and the app does all the work.
Watch a request {cue:check-42} for user forty-two. The app checks the cache first. It's there. {cue:hit}
A hit. The answer comes straight back from memory, and the database {cue:db-idle} never even sees the request.
Now a request {cue:check-88} for user eighty-eight. The app checks the cache. Nothing. {cue:miss}
A miss. So the app goes to the database {cue:db-read} itself, gets the answer, {cue:db-return}
and before returning it, writes a copy {cue:write-back} into the cache.
The next request {cue:next-hit} for user eighty-eight will be a hit.
That's the whole pattern: check, fall back, fill.
It's simple, and the app stays in control. The cost is that the first request for every key {cue:cold} is slow.

## scene: hit-ratio | pattern: scale-step
So how much does this actually help? It depends on one number: the hit ratio. {cue:ratio}
That's the share of requests the cache can answer.
Remember our {cue:load} two thousand four hundred requests a second.
If the cache answers {cue:ratio-90} ninety percent of them, only ten percent {cue:db-240} reach the database.
Two hundred and forty requests a second. Same traffic, one tenth {cue:db-calm} of the database load.
Push the hit ratio {cue:ratio-99} to ninety-nine percent, and the database sees {cue:db-24} just twenty-four.
That's why a cache can feel like magic. You didn't make the database faster.
You just stopped asking it the same questions.

## scene: read-through | pattern: before-after
There's a close cousin called read-through. {cue:rt-in}
Here, the app only ever talks {cue:rt-app-only} to the cache.
On a miss, the cache itself fetches {cue:rt-fetch} from the database and fills {cue:rt-fill} itself.
The difference is easiest to see in the code.
With cache-aside, your app does three steps: {cue:step-check} check the cache, {cue:step-read} read the database if it's missing, {cue:step-save} and save the result into the cache.
With read-through, your app does one step: {cue:code-through} ask the cache.
So where did the database read go? It moved {cue:loader-move} into the cache.
You give the cache a small loader function {cue:loader} once, and the cache calls it on every miss.
Java's Caffeine library {cue:examples-rt} works like this, and so does Amazon DAX in front of DynamoDB.
The catch: every request now goes through {cue:one-loader} that same one loader.
If you need special rules, like skipping the cache for admin users, cache-aside gives you that control, {cue:control} because the logic is in your own code.
So: cache-aside, {cue:compare-aside} the app does the work. Read-through, {cue:compare-through} the cache does the work.

## scene: writes | pattern: request-path
Reading is the easy part. The hard part starts when data changes. {cue:update}
Say user forty-two {cue:new-name} changes their name.
The database now says Ana, but the cache still says {cue:stale} Anna.
That's stale data, and your users will see it.
So when you write, {cue:three} you have three main choices.
One: {cue:wt} write-through. Write to the cache and the database {cue:wt-both} at the same time.
The cache is always fresh, but every write pays {cue:wt-slow} for two stores.
Two: {cue:wb} write-back, also called write-behind. Write to the cache {cue:wb-cache} only, and flush {cue:wb-flush} to the database later, in the background.
Writes are very fast, but if the cache crashes {cue:wb-crash} before the flush, that data is gone.
Three: {cue:wa} write-around. Write only to the database, {cue:wa-db} and let the cache fill {cue:wa-fill} on the next read.
This keeps data that's written once and rarely read out of your cache.
With cache-aside, the most common move is even simpler: update the database, then delete the key {cue:delete} from the cache.
The next read misses {cue:fresh} and fetches the fresh value.

## scene: freshness | pattern: timeline
Deleting keys on every write only works if you know every place {cue:fan} that data is cached.
In real systems, you often don't.
That's why almost every cache entry also gets a time to live, {cue:ttl} a TTL. Say, {cue:ttl-5} five minutes.
After that, the entry expires {cue:expire} on its own, and the next request fetches a fresh copy.
A short TTL {cue:ttl-short} means fresher data, but more misses.
A long TTL {cue:ttl-long} means fewer misses, but staler data.
There's no perfect number. A stock price {cue:examples} might need seconds. A product description can live for hours.
There's an old joke: there are only two hard things in computer science, cache invalidation and naming things. {cue:quote}
Now you know why.

## scene: eviction | pattern: stepper
Memory is expensive, so a cache is always small. {cue:full}
Eventually it fills up, and to add something new, {cue:new-key} something old has to go.
The rule that decides is called the eviction policy. {cue:policy}
The most common is LRU, {cue:lru} least recently used.
It throws out {cue:lru-out} whatever hasn't been touched for the longest time.
The bet is that what you used recently, you'll use again soon.
LFU, {cue:lfu} least frequently used, throws out {cue:lfu-out} whatever has been asked for the fewest times.
That's great for things that stay popular for days.
And FIFO, {cue:fifo} first in, first out, just removes {cue:fifo-out} the oldest entry, no matter how popular it is.
Simple, but it can throw away your hottest key.
For most apps, an LRU-style policy {cue:default} is a solid default.

## scene: stampede | pattern: failure-cascade
Now, the bug I promised. Imagine your home page {cue:hot-key} is cached,
and ten thousand people a second {cue:all-hits} are reading it. All hits.
Then its TTL {cue:expires} runs out.
In that same instant, thousands of requests miss {cue:herd} together,
and every one of them goes to the database {cue:db-flood} for the exact same thing.
The database falls over, {cue:down} and sometimes it takes the whole site with it.
This is called a cache stampede, or a thundering herd.
The fixes are simple once you know the problem.
Let only one request rebuild {cue:lock} the value while the others wait.
Add a little randomness {cue:jitter} to TTLs, so keys don't all expire at once.
Or refresh popular keys {cue:early} in the background before they expire.
I'll break this one down fully in its own video.

## scene: layers | pattern: request-path
And here's the fun part. You've been using caches {cue:everywhere} all day without noticing.
Your browser {cue:browser} caches images and scripts.
A CDN {cue:cdn} caches whole pages on edge servers near you,
so a user in London {cue:edge} doesn't wait for a server in Virginia.
Your app {cue:app-cache} caches query results in Redis.
The database {cue:db-cache} caches hot data in its own memory.
And your CPU {cue:cpu} has caches built right into the chip.
Different layers, same idea: {cue:same-idea} keep the answer close to whoever asks for it most.

## scene: recap | pattern: checklist
So every time you add a cache, you're making {cue:four} four decisions.
How does data get in: {cue:d1} cache-aside or read-through?
How does it stay fresh: {cue:d2} a write strategy plus a TTL?
What gets thrown out when it's full: {cue:d3} usually LRU?
And what happens when a hot key {cue:d4} expires?
Get those four right, and a cache is the cheapest speed-up in system design.
Next, {cue:next} we'll take the same idea and scale an API from a hundred users to a million.
See you there.

## titles
- How Caching Actually Works (and the Bug That Takes Sites Down)
- Caching Explained: Hits, Misses, TTLs and the Thundering Herd
- Why Every Fast App Uses a Cache

## thumbnail
Night Paper. Big free database icon in coral with "p99 3 s", a cache icon in mint with "8 ms", one amber marker
arrow from cache to database. Words: "WHY IT'S FAST" (Space Grotesk 700, at least 160 px).

## description notes
Chapters are generated from the scene start times in timing.json (00:00 Intro, The problem, What a cache is,
Cache-aside, Hit ratio, Read-through, Writes, TTL and invalidation, Eviction, Cache stampede, Caches everywhere, Recap).

## fact-check
- "Reading from memory takes nanoseconds": main-memory reference is about 100 ns (Jeff Dean, "Latency numbers every
  programmer should know"). Network database queries in the milliseconds are typical, not universal: label the on-screen
  latency bars "typical", not measured.
- "Thousands of times slower": 100 ns vs 1-10 ms is 10,000-100,000x; "thousands of times" is a safe understatement.
- Redis and Memcached are in-memory key-value stores: true.
- Hit-ratio math: 2,400 x 10% = 240; 2,400 x 1% = 24. Request counts are illustrative.
- Do not say LRU is Redis's default: Redis's default maxmemory-policy is noeviction; LRU/LFU variants are configurable.
  The script says "an LRU-style policy is a solid default", which is advice, not a claim about Redis.
- Write-back risk: data not yet flushed is lost if the cache node fails (unless the cache persists it). True as stated.
- "Two hard things" quote: attributed to Phil Karlton (via Martin Fowler's bliki). Do not show a name on screen
  unless attributed exactly that way.
- Read-through examples: Caffeine `LoadingCache` loads missing entries through a `CacheLoader`; Amazon DAX passes cache misses through to DynamoDB and caches the result (read-through). Both described accurately at this level.
- Stampede mitigations (single-flight/locking, TTL jitter, early refresh): standard, described accurately.
- CDN, browser, database buffer cache, CPU caches: standard layers, described at a high level.
- "Three seconds", "fifty users", "five thousand people", "ten thousand per second" are illustrative.
