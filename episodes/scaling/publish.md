# Scaling: upload package

Files (after the real voice is recorded and the master is rendered):
- Video: `out/scaling-final.mp4` (1080p30)
- Captions: `out/captions.srt` (upload under Subtitles, language English)
- Thumbnail: `out/thumbnail.png` (1280x720, "1K → 1M USERS, STEP BY STEP": the system growing on each step)
- Test & compare variant: `out/thumbnail-test-b.png` (same headline, one new piece per step)

## Title

How to Scale Your App to 1 Million Users, One Bottleneck at a Time

Backup if CTR stays under 4% after about 2 weeks: 1 Million Users Is Only 230 Requests a Second

## Description

How do you scale an app from one server to 1 million users without adding everything at once? One bottleneck at a time.
Caching in detail (step 7): https://youtu.be/745fVcs-q5w

We grow one online shop from a single server to a million daily users and only add a piece when a number tells us to: split the database (and add the index first), a bigger server, more servers behind a load balancer (and why the second server logs everyone out), object storage for photos, a cache and a CDN, connection pooling and read replicas (and replication lag), and queues.

Chapters:
00:00 Intro
00:53 What 1 million users means
02:34 One server
03:27 Split the database
04:27 A bigger server
05:23 More servers
06:55 Cache and CDN
07:57 Read replicas
09:33 Queues
10:32 Recap

Sources and notes:
- ChatGPT: one primary PostgreSQL server takes all writes, with nearly 50 read replicas, for 800 million users. OpenAI, Scaling PostgreSQL to power 800 million ChatGPT users (22 Jan 2026): https://openai.com/index/scaling-postgresql/
- Database connection limit (5,000 per Azure PostgreSQL instance) and PgBouncer pooling: same OpenAI post.
- 1,000,000 daily users x 20 requests = 20,000,000 a day, about 230 a second on average. Twenty requests per user is an assumption.
- User counts, "ready for" milestones, CPU, page times, query times, connection counts and checkout times in the diagrams are illustrative.

#systemdesign #scaling #softwareengineering

## Tags

scaling, system design, scale to million users, scalability, load balancer, horizontal scaling, vertical scaling, stateless, session, object storage, s3, connection pooling, pgbouncer, read replicas, replication lag, cdn, cache, message queue, database index, backend, software engineering, system design interview

## Settings

- Category: Science & Technology
- Audience: not made for kids
- Altered or synthetic content: No (own voice, own diagrams)
- Card: the caching video, at the "I made a whole video on caching" line (07:18)
- End screen (last 12 s): subscribe button plus the caching video
- On the caching video: replace "Next: scaling an API from 100 users to 1 million." with this video's link, and point its end screen here

## Shorts

Main video published 2026-11-09 20:00 (GMT+6): https://youtu.be/2ZNj0XKxAOs. Each Short is scheduled public at
22:00 GMT+6 (16:00 UTC: India 21:30, Europe 17:00, US East 11:00), two days apart, with Related video = the main video.

| File | Title | Cut (long-video time) | Scheduled | Link |
|---|---|---|---|---|
| `out/short-million.mp4` | 1 Million Users Is Only 230 Requests a Second | 0:54-1:58 | Wed 2026-11-11 | https://youtube.com/shorts/tyRStiDKNsQ |
| `out/short-sessions.mp4` | Why Adding a Second Server Logs Your Users Out | 5:46-6:19 | Fri 2026-11-13 | https://youtube.com/shorts/ggDdD1xyeoo |
| `out/short-lag.mp4` | You Posted It, Refreshed, and It's Gone | 8:48-9:29 | Sun 2026-11-15 | https://youtube.com/shorts/uBRUyeOIIoI |

Descriptions (hook line, then the main video link, then hashtags):
- million: A million daily users sounds huge. Do the math and it's about 230 requests a second.
- sessions: Add a second server and your users get logged out. Here's why, and the fix.
- lag: You post a review, refresh, and it's gone. That's replication lag, and here's the fix.
- then: Full video, one bottleneck at a time: https://youtu.be/2ZNj0XKxAOs / #shorts #systemdesign #scaling
