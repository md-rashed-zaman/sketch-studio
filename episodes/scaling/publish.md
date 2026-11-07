# Scaling: upload package (draft)

Files (after the real voice is recorded and the master is rendered):
- Video: `out/scaling-final.mp4` (1080p30)
- Captions: `out/captions.srt` (upload under Subtitles, language English)
- Thumbnail: `out/thumbnail.png` (1280x720, "WHAT BREAKS FIRST?")
- Test & compare variant: `out/thumbnail-test-b.png` ("1M USERS = 230 REQ/S?")

## Title

How Apps Scale to 1 Million Users (and What Breaks First)

Backup if CTR stays under 4% after about 2 weeks: 1 Million Users Is Only 230 Requests a Second

## Description

Your app works on one server. Then people tell their friends: a thousand users, ten thousand, a million. Which part breaks first?

In this video we grow one online shop from a single server to a million daily users, and we only add a piece when a number tells us to: split the database (and add the index first), a bigger server, more servers behind a load balancer (and why the second server logs everyone out), object storage for photos, a cache and a CDN, connection pooling and read replicas (and replication lag), and queues.

Chapters: generated from timing.json (00:00 Intro, What 1 million means, One server, Split the database, Bigger server, More servers, Cache and CDN, Read replicas, Queues, Recap). Fill in the times after the final render.

Sources and notes:
- ChatGPT: one primary PostgreSQL server takes all writes, with nearly 50 read replicas, for 800 million users. OpenAI, Scaling PostgreSQL to power 800 million ChatGPT users (22 Jan 2026): https://openai.com/index/scaling-postgresql/
- Database connection limit (5,000 per Azure PostgreSQL instance) and PgBouncer pooling: same OpenAI post.
- 1,000,000 daily users x 20 requests = 20,000,000 a day, about 230 a second on average. Twenty requests per user is an assumption.
- User counts, "ready for" milestones, CPU, page times, query times, connection counts and checkout times in the diagrams are illustrative.

The caching video (step 7 in detail): <link after upload>

#systemdesign #scaling #softwareengineering

## Tags

scaling, system design, scale to million users, scalability, load balancer, horizontal scaling, vertical scaling, stateless, session, object storage, s3, connection pooling, pgbouncer, read replicas, replication lag, cdn, cache, message queue, database index, backend, software engineering, system design interview

## Settings

- Category: Science & Technology
- Audience: not made for kids
- Altered or synthetic content: No (own voice, own diagrams)
- Card: the caching video, at the "I made a whole video on caching" line
- End screen (last 12 s): subscribe button plus the caching video
- On the caching video: replace "Next: scaling an API from 100 users to 1 million." with this video's link, and point its end screen here
