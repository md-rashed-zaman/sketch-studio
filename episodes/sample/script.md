# How caching works - pipeline sample

Two scenes from swe/how_caching_works, shortened to ~45 s to exercise the pipeline.
Only the lines inside `## scene:` blocks are narration. `{cue:name}` tags are never spoken:
each one fires at the end of the word before it.

## scene: problem | pattern: throughput-machine
Here's a normal app: a server and a database. {cue:app}
Every time a user asks for data, the server reads it from the database. {cue:requests}
At a handful of requests a second, that's fine. But watch what happens as traffic grows. {cue:traffic-up}
Reads from disk are slow, and the database starts to choke. {cue:db-red}
So we keep a copy {cue:cache-in} somewhere much faster: an in-memory cache.

## scene: cache-aside | pattern: before-after
The most common pattern is called cache-aside. {cue:pattern}
A request for user forty-two comes in, and the app checks the cache first. {cue:check-42}
It's there. That's a hit, served straight from memory. {cue:hit}
Now user eighty-eight. {cue:check-88} Not cached yet, so that's a miss. {cue:miss}
The app {cue:db-read} reads it from the database and writes it into the cache, {cue:write-back} so the next request is a hit.

## fact-check
- Disk vs memory latency claims: keep them qualitative in this sample.
- The on-screen counter (5 req/s rising to 2,400 req/s) is illustrative, not a measured figure.
