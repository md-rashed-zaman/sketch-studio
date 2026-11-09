# How Apps Scale to 1 Million Users (and What Breaks First)

Series: How It Works (pillar 1, System Design). Target length: ~11 min (about 1,650 spoken words).
Only lines inside `## scene:` blocks are narration. `{cue:name}` tags are never spoken: each one fires at
the end of the word before it. The visual plan for every cue is in `storyboard.md`. Research and angle: `plan.md`.

Voice: talk to one person. Full sentences, contractions, "you" and "we". Say a number the way you'd say it out loud.
If a line feels stiff when you read it, say it your way: re-run `npm run align` and the animation follows.

Recording: one file per scene in `audio/raw/`, named by scene number:
`01-cold-open.wav`, `02-million.wav`, ... `10-recap.wav`. Say a whole sentence again if you stumble.

## scene: cold-open | pattern: scale-step
Say you build a small online shop. {cue:shop} One server, one database, and it works.
Then people start telling their friends. {cue:viral} A thousand users, then {cue:viral-10k} ten thousand, and one day, {cue:viral-1m} a million.
So which part breaks first? {cue:breaks}
Most explanations answer that with a list of fifteen tools. {cue:tools} I want to do it differently.
We'll grow this one app {cue:ladder} step by step, and we'll only add something new when we can see exactly what's breaking.
Some steps look easy, like adding a second server. {cue:teaser-two}
Do it the obvious way, and your users get logged out {cue:teaser-out} and their carts go empty.
We'll see exactly why, and how to fix it.
But first, let's work out what a million users really means, because it's smaller than you think.

## scene: million | pattern: stepper
When someone says a million users, {cue:users} they usually mean a million people who open the app on a given day.
Engineers call that daily active users.
And they're not all online at once. {cue:at-once} Even in the busiest hour, maybe one in ten is using the app at the same moment.
So let's say each of them clicks around a bit, {cue:clicks} and makes about twenty requests.
That's twenty million requests a day. {cue:per-day} Sounds huge, right?
But a day has eighty-six thousand four hundred seconds. {cue:seconds}
Divide it out, and you get about two hundred and thirty requests a second. {cue:per-second}
Now, traffic isn't flat. People shop in the evening, and a sale can bring everyone at once,
so plan for peaks five or ten times higher. Call it {cue:two-k} two thousand a second.
That's real traffic, but it doesn't need anything exotic.
Here's proof from the far end of the scale. In January twenty twenty-six, OpenAI wrote about the database behind ChatGPT. {cue:openai}
Eight hundred million users, and one main database server still takes every single write. {cue:one-db}
They got there with the same moves you'll see in this video: a bigger machine, a cache, and copies of the database for reading.
So a million users isn't a wall you hit. The real question is which part runs out first.

## scene: one-server | pattern: request-path
Here's where every app starts. {cue:server} One server, running everything:
your code, the database, {cue:inside} and all the product photos, on the same box.
A user asks for a page, {cue:request} the server builds it, and sends it back.
And honestly, this is the right way to start. {cue:right}
It's cheap, it's fast to build, and when something breaks, there's only one place to look.
If you have a hundred users, please don't build a distributed system.
What you should do is set up monitoring, and track three metrics: {cue:metrics} CPU usage, memory usage, and latency, which is how long a page takes.
That's the rule for this whole video. {cue:rule} We only add a piece when one of those metrics tells us to.

## scene: split-db | pattern: scale-step
Somewhere around ten thousand users a day, {cue:10k} pages start to feel slow in the evening.
Look inside the server, and you'll see the app and the database {cue:fight} fighting over the same CPU and the same memory.
Before you buy anything, check your slowest queries. {cue:slow-query}
Very often, one of them is reading every single row because it's missing an index.
Add the index, {cue:index} and a search that took eight hundred milliseconds now takes five.
That's the cheapest fix in this whole video.
The next step is to move the database onto its own machine. {cue:split}
Now the app and the database each get a whole server, and you can tune them separately.
The price is a network hop between them, {cue:hop} and two machines to look after instead of one.
But now the shop is ready {cue:ready-50k} for about fifty thousand users.

## scene: scale-up | pattern: before-after
Then more people find the shop. {cue:50k} Now the app server's CPU sits at ninety percent every evening.
The easiest fix is to buy a bigger server. {cue:bigger}
Twice the cores, twice the memory, and you don't change a single line of code.
Now the shop is ready {cue:ready-100k} for about a hundred thousand users.
This is called vertical scaling, {cue:vertical} and people underrate it. It takes you a lot further than you'd expect.
But it has two catches.
First, there's a ceiling. {cue:ceiling} The biggest machines cost a lot more, and eventually there's {cue:no-bigger} no bigger one to buy.
Second, it's still one machine. {cue:spof} If it crashes, or you restart it to deploy, the {cue:shop-down} whole shop is down.
That's what engineers call a {cue:spof-name} single point of failure, and it's what pushes us to the next step.

## scene: scale-out | pattern: failure-cascade
So instead of one bigger server, {cue:second} we run two.
And in front of them, we put a load balancer, {cue:lb} which hands each request to whichever server is free.
If one server dies, {cue:one-dies} the load balancer's health checks notice, and the other server keeps the shop running.
This is horizontal scaling.
But watch what happens when you log in. {cue:login} That request lands on server A. Server A remembers you, in its own memory.
Your next click {cue:next-click} goes to server B. And server B has never heard of you.
You're logged out, {cue:logged-out} and your cart is empty.
The fix is to make the app servers stateless. {cue:stateless}
They don't keep anything about you in their own memory. Your session lives in a shared store, {cue:session-store} like Redis.
The same goes for files. A seller uploads a product photo, {cue:upload} and it's saved on server A's disk. Server B {cue:no-photo} can't see it.
So files go to object storage, {cue:s3} like Amazon S3, which every server can reach.
Now any server can answer any request, {cue:any} so adding a third or a tenth server is easy.
Cloud platforms can even do it for you, {cue:autoscale} adding servers when traffic rises.
Now the shop is ready {cue:ready-300k} for a few hundred thousand users.

## scene: cache-cdn | pattern: request-path
Traffic keeps climbing. {cue:300k} The app servers are fine, but every one of them is asking the {cue:same-db} same database.
And most of what they ask is the same: {cue:same} the home page, the top products, the same few profiles.
So we put a cache in front of the database {cue:cache} and keep the popular answers in memory.
I made a whole video on caching, {cue:video} so I won't repeat it all here. It's linked above.
The other heavy thing is images. {cue:images}
Product photos are most of the bytes you send,
and a shopper in Sydney {cue:sydney} is downloading them from a server in Virginia.
A CDN fixes that. {cue:cdn} It keeps copies of your photos on servers close to your users.
Now your own servers only deal with what actually changes, {cue:changes} like carts and orders.
Now the shop is ready {cue:ready-1m} for about a million users.

## scene: replicas | pattern: timeline
And the users keep coming. {cue:1m} Now the database is busy again.
Part of the problem is connections. {cue:conns} Every app server keeps its own connections open, and with dozens of servers, that's thousands.
A database only accepts so many. On OpenAI's, the limit is five thousand.
So put a connection pooler in between, {cue:pooler} like PgBouncer. The app servers share a {cue:shared} small set of connections, and that's exactly what OpenAI does.
But the bigger problem is what the database is doing. Most requests are reads, {cue:reads} people browsing.
Far fewer are writes, {cue:writes} like placing an order. In a shop, reads can easily outnumber writes ten to one.
So we add read replicas. {cue:replicas}
These are copies of the database that follow every change on the main one.
Writes still go to the main database, {cue:primary} and reads are spread across the copies.
There's a catch, though. The copies are always a moment behind. {cue:lag}
Picture this. You post a review, {cue:post} the page reloads, and it reads from a copy that hasn't caught up.
Your review is {cue:gone} gone. A second later, it's back.
That's replication lag. A common fix is to read your own recent changes {cue:own} from the main database for a few seconds.
Now the shop is ready {cue:ready-more} for millions of users.

## scene: queues | pattern: request-path
Now let's look at what happens when someone places an order. {cue:order}
We save the order, {cue:steps} charge the card, {cue:step-email} send a confirmation email, {cue:step-stock} update the stock, and {cue:step-invoice} make an invoice.
If the user waits for all of that, {cue:wait} checkout takes four seconds.
And if the email service is slow, your checkout is slow too.
So ask a simple question. What does the user actually need to wait for? {cue:need}
Saving the order and charging the card. Everything else can happen a few seconds later.
So we put the rest on a queue. {cue:queue}
Workers pick jobs off the queue in the background, {cue:workers} and checkout replies in a fraction of a second.
And when a big sale brings a flood of orders, {cue:flood} the queue just gets longer for a while. The site doesn't slow down.
Now the shop is ready {cue:ready-sale} for the spikes too.

## scene: recap | pattern: checklist
So look at where we ended up. {cue:full}
We didn't plan any of this on day one.
Every single piece showed up because the metrics showed us something was breaking.
And that's really the whole method. Monitor your metrics. {cue:loop}
Find the one part that's the bottleneck. {cue:find}
Add the smallest fix. {cue:fix}
Then keep monitoring, {cue:moves} because the bottleneck always moves somewhere new.
There's more past this point, {cue:beyond} like {cue:sharding} splitting the database itself, or {cue:regions} running in several regions.
But {cue:most-apps} most apps never need it, and if yours does, you'll have a team to help.
So which step is your app at right now? {cue:comment} Tell me in the comments.
And if you skipped the cache step, the caching video is the best place to go next. See you there.

## titles
- How Apps Scale to 1 Million Users (and What Breaks First)
- 1 Million Users Is Only 230 Requests a Second
- What Breaks First When Your App Hits 1 Million Users

## thumbnail
See `plan.md` section 3. A: one server box, users counter at "1,000,000", one part glowing coral, words
"WHAT BREAKS FIRST?". B: "1M USERS = 230 REQ/S?" with a calm mint server.

## description notes
Chapters come from the scene start times in timing.json: 00:00 Intro, What 1 million means, One server, Split the
database, Bigger server, More servers, Cache and CDN, Read replicas, Queues, Recap.

## fact-check
- 1,000,000 daily users x 20 requests = 20,000,000 a day. 20,000,000 / 86,400 = 231.5 a second: "about two hundred
  and thirty". Twenty requests per user is an assumption ("let's say"), not a claimed average.
- "A million users" = daily active users (DAU): the usual unit in system-design estimates (DAU x requests per user / 86,400
  = average QPS, then a peak factor). Monthly users (MAU) would be even less load; registered users less still.
- "Maybe one in ten online at once": load-testing guides put peak concurrent users at about 5-20% of DAU (no fixed rule),
  so ~100k online at the busiest hour, said with "maybe". Consistency check: 100k online, each clicking about once every
  50 s, is the ~2,000 req/s peak.
- Peaks "five or ten times higher": a rule of thumb, said as "plan for". 230 x 10 = 2,300, "call it two thousand".
- OpenAI, "Scaling PostgreSQL to power 800 million ChatGPT users", 22 Jan 2026 (https://openai.com/index/scaling-postgresql/):
  "a single primary Azure PostgreSQL flexible server instance and nearly 50 read replicas"; "PostgreSQL has remained
  unsharded, with a single primary instance serving all writes"; they "scaled up by increasing the instance size, and
  scaled out by adding more read replicas", plus caching, PgBouncer pooling and rate limits. New write-heavy workloads go
  to sharded systems, so say "one main database server takes every write" (of that database), not "ChatGPT has one database".
- Index example (800 ms to 5 ms), user milestones (10k, 50k, 300k, 1M), 90% CPU and 4 s checkout are
  illustrative: label diagram numbers "illustrative" in the description, as in the caching video.
- "Reads can easily outnumber writes ten to one" in a shop: hedged with "can", typical for read-heavy apps.
- Replication lag and read-your-own-writes from the primary: standard behavior of asynchronous replicas and a
  standard mitigation.
- Stateless servers with a shared session store (Redis) and autoscaling: standard. Signed tokens are an
  alternative, not mentioned to keep the step short.
- "The obvious way" logs users out: sessions kept in one server's memory, behind a load balancer that spreads
  requests (round robin, least connections). Sticky sessions hide it but break when that server dies or scales in,
  so it's a design flaw, not a bug: never call it "the bug".
- CDN caches static files at edge locations near users: standard.
- Object storage (Amazon S3) for uploaded files so stateless servers share them: standard. The CDN pulls the photos from it.
- Connection pooling: OpenAI (same post): "Each instance has a maximum connection limit (5,000 in Azure PostgreSQL)"; they
  "deployed PgBouncer as a proxy layer to pool database connections". "Dozens of servers, thousands of connections" is
  illustrative (each server's pool holds tens to hundreds of connections).
- "Ready for" milestones (50k, 100k, 300k, 1M, millions, sale spikes) are illustrative, like the other user counts:
  each one is where the next chapter's problem starts.
