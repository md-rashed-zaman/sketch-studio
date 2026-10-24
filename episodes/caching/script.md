# How Caching Actually Works

Series: How It Works (pillar 1, System Design). Target length: ~10 min (about 1,450 spoken words).
Only lines inside `## scene:` blocks are narration. `{cue:name}` tags are never spoken: each one fires at
the end of the word before it. The visual plan for every cue is in `storyboard.md`.

Recording: one file per scene in `audio/raw/`, named by scene number:
`01-cold-open.wav`, `02-problem.wav`, ... `12-recap.wav`. Say a whole sentence again if you stumble.

## scene: cold-open | pattern: request-path
Your app works fine with fifty users. {cue:calm}
Then a post goes viral, {cue:spike} five thousand people show up, and every page takes three seconds to load. {cue:slow}
Most of the time, the fix is one idea. {cue:idea}
Keep a copy of the answer somewhere fast, so you never have to work it out twice. {cue:fast}
That's caching. By the end of this video, you'll know where to put a cache, how data gets in, how it stays fresh, what gets thrown out, {cue:checklist}
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
Every entry in a cache is a key and a value. {cue:kv}
The key is the question, like user forty-two. {cue:key} The value is the answer, that user's data. {cue:value}
When you ask for a key, there are only two outcomes. It's there, that's a hit. {cue:hit-word}
Or it isn't, that's a miss. {cue:miss-word}
Everything else in caching is about those two words.

## scene: cache-aside | pattern: request-path
The most common way to use a cache is called cache-aside. {cue:pattern}
The cache sits beside your main flow, and the app does all the work.
Watch a request for user forty-two. {cue:check-42} The app checks the cache first. It's there. {cue:hit}
A hit. The answer comes straight back from memory, and the database never even sees the request. {cue:db-idle}
Now a request for user eighty-eight. {cue:check-88} The app checks the cache. Nothing. {cue:miss}
A miss. So the app goes to the database itself, {cue:db-read} gets the answer, {cue:db-return}
and before returning it, writes a copy into the cache. {cue:write-back}
The next request for user eighty-eight will be a hit. {cue:next-hit}
That's the whole pattern: check, fall back, fill.
It's simple, and the app stays in control. The cost is that the first request for every key is slow. {cue:cold}

## scene: hit-ratio | pattern: scale-step
So how much does this actually help? It depends on one number: the hit ratio. {cue:ratio}
That's the share of requests the cache can answer.
Remember our two thousand four hundred requests a second. {cue:load}
If the cache answers ninety percent of them, {cue:ratio-90} only ten percent reach the database. {cue:db-240}
Two hundred and forty requests a second. Same traffic, one tenth of the database load. {cue:db-calm}
Push the hit ratio to ninety-nine percent, {cue:ratio-99} and the database sees just twenty-four. {cue:db-24}
That's why a cache can feel like magic. You didn't make the database faster.
You just stopped asking it the same questions.

## scene: read-through | pattern: before-after
There's a close cousin called read-through. {cue:rt-in}
Here, the app only ever talks to the cache. {cue:rt-app-only}
On a miss, the cache itself fetches from the database {cue:rt-fetch} and fills itself. {cue:rt-fill}
The difference is easiest to see in the code.
With cache-aside, your app does three steps: check the cache, {cue:step-check} read the database if it's missing, {cue:step-read} and save the result into the cache. {cue:step-save}
With read-through, your app does one step: ask the cache. {cue:code-through}
So where did the database read go? It moved into the cache. {cue:loader-move}
You give the cache a small loader function once, and the cache calls it on every miss. {cue:loader}
Java's Caffeine library works like this, and so does Amazon DAX in front of DynamoDB. {cue:examples-rt}
The catch: every request now goes through that same one loader. {cue:one-loader}
If you need special rules, like skipping the cache for admin users, cache-aside gives you that control, because the logic is in your own code. {cue:control}
So: cache-aside, the app does the work. {cue:compare-aside} Read-through, the cache does the work. {cue:compare-through}

## scene: writes | pattern: request-path
Reading is the easy part. The hard part starts when data changes. {cue:update}
Say user forty-two changes their name. {cue:new-name}
The database now says Ana, but the cache still says Anna. {cue:stale}
That's stale data, and your users will see it.
So when you write, you have three main choices. {cue:three}
One: write-through. {cue:wt} Write to the cache and the database at the same time. {cue:wt-both}
The cache is always fresh, but every write pays for two stores. {cue:wt-slow}
Two: write-back, also called write-behind. {cue:wb} Write to the cache only, {cue:wb-cache} and flush to the database later, in the background. {cue:wb-flush}
Writes are very fast, but if the cache crashes before the flush, {cue:wb-crash} that data is gone.
Three: write-around. {cue:wa} Write only to the database, {cue:wa-db} and let the cache fill on the next read. {cue:wa-fill}
This keeps data that's written once and rarely read out of your cache.
With cache-aside, the most common move is even simpler: update the database, then delete the key from the cache. {cue:delete}
The next read misses and fetches the fresh value. {cue:fresh}

## scene: freshness | pattern: timeline
Deleting keys on every write only works if you know every place that data is cached. {cue:fan}
In real systems, you often don't.
That's why almost every cache entry also gets a time to live, a TTL. {cue:ttl} Say, five minutes. {cue:ttl-5}
After that, the entry expires on its own, {cue:expire} and the next request fetches a fresh copy.
A short TTL means fresher data, but more misses. {cue:ttl-short}
A long TTL means fewer misses, but staler data. {cue:ttl-long}
There's no perfect number. A stock price might need seconds. A product description can live for hours. {cue:examples}
There's an old joke: there are only two hard things in computer science, cache invalidation and naming things. {cue:quote}
Now you know why.

## scene: eviction | pattern: stepper
Memory is expensive, so a cache is always small. {cue:full}
Eventually it fills up, and to add something new, something old has to go. {cue:new-key}
The rule that decides is called the eviction policy. {cue:policy}
The most common is LRU, least recently used. {cue:lru}
It throws out whatever hasn't been touched for the longest time. {cue:lru-out}
The bet is that what you used recently, you'll use again soon.
LFU, least frequently used, {cue:lfu} throws out whatever has been asked for the fewest times. {cue:lfu-out}
That's great for things that stay popular for days.
And FIFO, first in, first out, {cue:fifo} just removes the oldest entry, no matter how popular it is. {cue:fifo-out}
Simple, but it can throw away your hottest key.
For most apps, an LRU-style policy is a solid default. {cue:default}

## scene: stampede | pattern: failure-cascade
Now, the bug I promised. Imagine your home page is cached, {cue:hot-key}
and ten thousand people a second are reading it. All hits. {cue:all-hits}
Then its TTL runs out. {cue:expires}
In that same instant, thousands of requests miss together, {cue:herd}
and every one of them goes to the database for the exact same thing. {cue:db-flood}
The database falls over, and sometimes it takes the whole site with it. {cue:down}
This is called a cache stampede, or a thundering herd.
The fixes are simple once you know the problem.
Let only one request rebuild the value while the others wait. {cue:lock}
Add a little randomness to TTLs, so keys don't all expire at once. {cue:jitter}
Or refresh popular keys in the background before they expire. {cue:early}
I'll break this one down fully in its own video.

## scene: layers | pattern: request-path
And here's the fun part. You've been using caches all day without noticing. {cue:everywhere}
Your browser caches images and scripts. {cue:browser}
A CDN caches whole pages on edge servers near you, {cue:cdn}
so a user in London doesn't wait for a server in Virginia. {cue:edge}
Your app caches query results in Redis. {cue:app-cache}
The database caches hot data in its own memory. {cue:db-cache}
And your CPU has caches built right into the chip. {cue:cpu}
Different layers, same idea: keep the answer close to whoever asks for it most. {cue:same-idea}

## scene: recap | pattern: checklist
So every time you add a cache, you're making four decisions. {cue:four}
How does data get in: cache-aside or read-through? {cue:d1}
How does it stay fresh: a write strategy plus a TTL? {cue:d2}
What gets thrown out when it's full: usually LRU? {cue:d3}
And what happens when a hot key expires? {cue:d4}
Get those four right, and a cache is the cheapest speed-up in system design.
Next, we'll take the same idea and scale an API from a hundred users to a million. {cue:next}
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
