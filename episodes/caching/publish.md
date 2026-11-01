# Caching: upload package

Files:
- Video: `out/caching-final.mp4` (1080p30)
- Captions: `out/captions.srt` (upload under Subtitles, language English)
- Thumbnail: `out/thumbnail.png` (1280x720)

## Title (pick one, A is recommended)

A. How Caching Actually Works (and the Bug That Takes Sites Down)
B. Caching Explained: Hits, Misses, TTLs and the Thundering Herd
C. Why Every Fast App Uses a Cache

## Description

Your app works fine with 50 users. Then a post goes viral and every page takes 3 seconds. Most of the time, the fix is one idea: a cache.

In this video we build caching from scratch: where to put a cache, how data gets in (cache-aside vs read-through), how it stays fresh (write-through, write-back, write-around, TTLs), what gets thrown out (LRU, LFU, FIFO), and the cache stampede bug that takes down even big companies.

0:00 Intro
0:37 The problem
1:27 What a cache is
2:16 Cache-aside
3:11 Hit ratio
3:56 Read-through
5:12 Writes
6:36 TTL and invalidation
7:27 Eviction
8:24 Cache stampede
9:21 Caches everywhere
10:01 Recap

Sources and notes:
- Latency numbers every programmer should know (Jeff Dean): main memory reference about 100 ns.
- Redis eviction policies: https://redis.io/docs/latest/develop/reference/eviction/ (Redis defaults to noeviction; LRU and LFU are configurable)
- Caffeine LoadingCache: https://github.com/ben-manes/caffeine/wiki/Population
- Amazon DynamoDB Accelerator (DAX): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html
- "Two hard things" quote: attributed to Phil Karlton (https://martinfowler.com/bliki/TwoHardThings.html)
- Request counts, user counts and latencies in the diagrams are illustrative.

Next: scaling an API from 100 users to 1 million.

#systemdesign #caching #softwareengineering

## Tags

caching, cache, system design, redis, cache aside, read through cache, write through, write back, ttl, cache invalidation, lru, lfu, cache stampede, thundering herd, cdn, backend, software engineering, system design interview

## Settings

- Category: Science & Technology (or Education)
- Audience: not made for kids
- Altered or synthetic content: No (own voice, own diagrams)
- Chapters: automatic from the timestamps above
- End screen (last 12 s): subscribe button plus "best for viewer" video
