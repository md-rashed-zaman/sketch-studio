# System Sketch Lab design system: "Night Paper" (v1, 24 Oct 2026)

The visual and motion rules for every System Sketch Lab video and Short.
- **Evidence:** [01-reference-teardown.md](01-reference-teardown.md).
- **Machine-readable tokens:** [tokens.json](tokens.json). The Sketch Studio kit should import these, never hard-code values.

**The idea in one line:**
> **An engineer's notebook at night: precise diagrams on warm dark paper, with a hand-drawn marker layer that points at what matters, exactly when it is said.**

**What makes it ours:**
- **Warm-dark "Night Paper" canvas.** Competitors use cold charcoal, black or navy.
- **The marker annotation layer:** hand-drawn circles, underlines and arrows in amber.
- **Numbers that force each step:** live load, latency and cost counters.
- **The sheet frame:** an engineering-drawing title block that doubles as chapter progress.
- **Five semantic colors** that mean the same thing in every video.

---

## 1. Color

### 1.1 Canvas and neutrals

| Token | Hex | Use | Contrast on canvas |
|---|---|---|---|
| `paper.night` | `#14120F` | Canvas (warm near-black, flat, never a gradient) | - |
| `paper.raised` | `#1E1B17` | Node / card fill | - |
| `paper.grid` | `#2A2621` | Dot grid (3 px dots every 48 px) | decorative |
| `ink.chalk` | `#F4EFE6` | Primary text, active strokes | 16.3:1 |
| `ink.pencil` | `#B9B1A3` | Secondary text, idle labels | 8.8:1 |
| `ink.graphite` | `#7A7266` | Idle strokes and borders (**never text**) | 3.9:1 |

### 1.2 Semantic colors

These five colors are the whole palette. Each color means a **role in the story**, not a component type.

| Token | Hex | Meaning (always) | Contrast |
|---|---|---|---|
| `signal.cobalt` | `#5B8CFF` (text: `#7EA4FF`) | **Request / active path / "this is what we're looking at"** | 5.9 (7.7) |
| `signal.mint` | `#3FD39B` | **Success / response / hit / healthy** | 9.8 |
| `signal.coral` | `#FF6F59` | **Failure / overload / miss / risk** | 6.8 |
| `signal.violet` | `#AE92FF` | **Second system / AI or agent / async** (only when two subsystems must be told apart) | 7.4 |
| `marker.amber` | `#FFB547` | **The marker layer only:** hand-drawn emphasis, never component fills | 10.6 |

**Rules:**
1. **Idle components are neutral** (`raised` fill, `graphite` stroke, `chalk` label). Color appears only when something *happens*. This is the signaling principle: color draws the eye because it is rare.
2. **One emphasis at a time:** a colored state, or a marker annotation, or a camera push. Never all three.
3. **Never color alone.** Mint/coral pairs always get an icon (check / cross) or a word (HIT / MISS), because they can look alike to color-blind viewers.
4. **Filled chips** (tags such as `HIT`, `200 OK`, `p99 840ms`) use the semantic color as the fill with `paper.night` text (contrast 6-10:1).
5. **Glow:** only a soft 12 px outer glow at 35% on the *active* element, so it looks lit on dark paper. Never glow everything (ByteMonk overuses it, and it bands on YouTube).

### 1.3 Light inserts
For quotes, sources, screenshots of docs or code from the web, use a **paper card** (`#F4EFE6` fill, `#14120F` text, 16 px radius, slight 2° tilt). It reads like a page pinned into the notebook, the same idea as ByteMonk's white pills but on-brand.

---

## 2. Typography

| Role | Font | Weight | Size at 1080p | Notes |
|---|---|---|---|---|
| Hero number / title card | **Space Grotesk** | 700 | 120-160 px | One per scene max |
| Scene title | Space Grotesk | 700 | 72 px | Top-left in safe area; 2-6 words |
| Node label | **Inter** | 600 | **44 px** (minimum 40) | 1-3 words; sentence case |
| Chip / tag | Inter | 700 | 36-40 px, letter-spacing +2% | UPPERCASE allowed for status words only (HIT, MISS, 200) |
| Connector label | Inter | 500 | 36 px | On a `paper.night` pill so it never crosses a stroke |
| Secondary note | Inter | 500 | 36 px, `ink.pencil` | Maximum 6 words |
| Code | **JetBrains Mono** | 500 | **40 px**, line height 1.45 | Maximum 14 lines x 48 columns visible; highlight lines, don't scroll |
| Marker annotation | **Caveat** | 700 | 56-64 px, `marker.amber` | Hand-written words, 1-3 at a time; the only handwriting allowed |
| Sheet frame | JetBrains Mono | 500 | 28 px, `ink.pencil` | The only text allowed under 36 px (decorative, not required reading) |

**Rules:**
- **Hard floor: 36 px for anything the viewer must read.** That is 1.5x ByteByteGo's label size and survives phone fullscreen. If a diagram can't fit at 44 px labels, it has too many boxes: split it, or zoom the camera.
- **Words per frame:** 20 or fewer, excluding code.
- **Labels are keywords, not sentences.** The narration explains (redundancy principle).
- **Spoken-only lines:** jokes, sayings, quotes, asides and rhetorical questions are **never** put on screen. No quote cards, no caption cards. Keep the current diagram on screen while they are said. On-screen text is only what teaches: labels, numbers, chips, code.
- All fonts are free Google Fonts, available through `@remotion/google-fonts`.

---

## 3. Layout

- **Frame:** 1920x1080 at 30 fps. **Safe area:** 96 px left/right, 54 px top/bottom, leaving a 1728x972 working area.
- **Grid:** 12 columns, 120 px column + 24 px gutter. Elements snap to an 8 px base grid. Node spacing is at least 120 px.
- **Zones:**

```
+------------------------------------------------------------------+
| SCENE TITLE (72px)                                  [SSL mark]   |  <- top 160 px
|                                                                  |
|                    DIAGRAM / STAGE (camera works here)           |
|                                                                  |
|                                                                  |
| SHEET 02/06 . CACHE-ASIDE . T+00:42                              |  <- bottom 64 px: sheet frame
+------------------------------------------------------------------+
```

- **Diagram density:** 7 or fewer nodes visible at once (overview shots may show up to 12, but then the camera must push in on whatever is being explained).
- **Node sizes:**
  - Width = label width + 2 x 40 px padding (minimum 280 px). Height 140 px.
  - Corner radius 20 px, stroke 3 px.
  - Labels never touch a border: at least 32 px inner padding on every side.
  - Labels over 14 characters wrap to 2 lines rather than shrink.
- **Group containers:** 4 px dashed stroke, radius 28 px, label tab on the top-left edge.
- **Flow shots vs overview shots:**
  - When packets *with labels* travel, show at most 3 nodes per row, with edges of at least 260 px, so a labeled packet fits between nodes with 24 px clearance at both ends.
  - Overview shots (4-5 nodes per row) use unlabeled packet dots only; push in to a flow shot when the request itself matters.
- **Connectors:**
  - 4 px orthogonal with 24 px rounded corners (straight lines only for sequence diagrams).
  - Arrowhead 18 px.
  - Connectors never pass under a label.
  - Labels sit on a pill *beside* the line, offset 16 px. **Packets ride on the line; labels never do.** This fixes the overlapping-badge bug.
- **Logo mark:** small "SSL" sketch mark top-right, 48 px, at 60% opacity. No facecam.

---

## 3b. Iconography (added 24 Oct 2026)

Comparison of the three options: [icon-options.png](icon-options.png).

**Decision: option C**:
- **Actors and data stores** are free-standing icons with the label underneath.
- **Services** are boxed nodes with a small icon left of the label.
- **Icons never replace the word.**

**Why:**
- Both ByteByteGo and ByteMonk do this, and it scans faster (the "dual coding" of picture + word).
- The shape itself carries meaning: a cylinder *is* storage, a person *is* the client. That supports Mayer's pre-training principle, because viewers learn the cast of components once and recognize them all video.
- Removing boxes around actors and stores also cuts visual weight, so the *services* (where the logic lives) stand out.

| Rule | Value |
|---|---|
| Library | **Lucide** (ISC licence, ~1,500 consistent outline icons, React package `lucide-react`). One library only, never mixed. |
| Style | Outline only. Rendered stroke 3-5 px at 1080p, to match node strokes (Lucide `strokeWidth` ~1.25 at 56 px, ~1.1 at 104 px). Round caps and joins. |
| Sizes at 1080p | 56 px inside a node (left of the label, 20 px gap). 104 px free-standing (label 44 px, 6 px below). Never under 48 px. |
| Color | `ink.chalk` when idle. Takes the node's semantic state color when active (cobalt / mint / coral). Never multicolor. |
| Label | Always present (2-3 words). An icon alone is ambiguous: a "layers" glyph could mean cache, stack or abstraction. |
| Connectors | Attach to the icon's edge at its vertical center with 24 px clearance, never to the label. |
| Count | One icon per node. No decorative icons on titles, chips or code. |
| Abstract ideas | No icon. "Consistency", "idempotency key", "hash function" stay as words or boxes. A forced metaphor icon confuses more than it helps. |
| Brand logos | Avoid by default (trademarks, visual noise). Use a real product logo only when the video is *about* that product (e.g. a Postgres internals episode), as a small mark on a paper card, never as the node icon. |
| Animation (signature) | Icons **sketch in**: their strokes draw on over 500 ms (stroke-dash), then the label fades in 100 ms later. This is the "Sketch" in System Sketch and nobody in the niche does it. |

**Component-to-icon map** (fixed across the channel, so viewers learn it once):

| Component | Lucide icon | Form |
|---|---|---|
| User / users | `user` / `users` | free |
| Client app (web, mobile) | `monitor-smartphone` | free |
| Internet / DNS | `globe` | free |
| CDN / cloud | `cloud` | free |
| Load balancer | `split` | boxed |
| App server / service | `server` | boxed |
| Container / pod | `container` | boxed |
| Worker / compute | `cpu` | boxed |
| API gateway / auth | `shield-check` | boxed |
| Rate limiter | `gauge` | boxed |
| AI agent / LLM | `bot` | boxed (violet when it is "the second system") |
| Cache | `layers` | free |
| Database | `database` | free |
| Disk / object storage | `hard-drive` | free |
| Queue / log | `rows-3` | free |
| Message / event | `mail` | packet icon (inside the packet capsule, 24 px) |
| Token / key | `key-round` | chip icon |
| Search index | `search` | free |
| TTL / timeout | `timer` | chip icon |
| Document / file | `file-text` | free |

**Shorts:** free icons stack vertically (icon over label) as in 16:9. Boxed nodes switch to icon-over-label to save width.

---

## 4. Motion grammar

### 4.1 Tokens

| Token | Duration | Easing | Use |
|---|---|---|---|
| `t.emphasis` | 350 ms | standard `(0.2, 0, 0, 1)` | Color/state change, highlight, dim |
| `t.enter` | 500 ms | enter `(0.05, 0.7, 0.1, 1)` | Node/chip appears (fade + 24 px rise, or stroke draw-on) |
| `t.exit` | 300 ms | exit `(0.3, 0, 0.8, 0.15)` | Element leaves |
| `t.draw` | 600-900 ms | standard | Connector draws along its path |
| `t.packet` | ~650 px/s | linear while moving, 120 ms ease at the ends | Packet travel speed (constant across videos) |
| `t.camera` | 1000-1400 ms | standard | Pan/zoom between regions |
| `t.morph` | 1000 ms | standard | Shared elements glide to their next-chapter layout |
| `t.sheetPan` | 900 ms | standard | Camera pans to the next sheet when nothing is shared |
| `t.labelType` / `t.labelUnderline` | 400 / 500 ms | standard | Sheet label types on, pencil underline draws |
| `t.hold` | at least 1000 ms | - | Stillness after every change before the next one |
| `t.stagger` | 60 ms | - | List/grid reveals only |

### 4.2 Rules
1. **Every change starts on a cue word.** Use `useCue()`, never a fixed delay.
2. **Motion, then stillness.** Aim for about 15-25% of runtime in motion. Static and readable the rest of the time.
3. **One thing moves at a time,** unless it is a group moving together (common fate).
4. **No bounce, squash, spin or shake** on diagrams. Allowed "life": a 1.0 to 1.04 scale settle on a hero number, and a slow pulse (2 s period) on an overloaded node.
5. **Object constancy:** a node keeps its identity, color logic and position across the chapter. To move it, translate it; never morph it into something else.
6. **Stage complex changes:** layout first, then state, then numbers.
7. **No more than 3 flashes per second,** ever.

### 4.3 Camera
- **One canvas per chapter.** The chapter's diagram lives on a large canvas, up to 3x the frame.
- **Shots:**
  - `overview`: the whole canvas, as the map.
  - `focus(node | group)`: push in to 1.4-2.0x so labels render at 60+ px.
  - `track(packet)`: the camera follows a packet across the canvas.
- **Return to overview** at the end of each chapter, with the new layer highlighted: the "master map" pattern.
- **No idle drift.** The camera moves only when the narration moves the viewer's attention (coherence).

### 4.4 Transitions: "continuity first" (revised 24 Oct 2026)

**Principle:** keep the viewer's eyes on the same objects. A transition should *explain the relationship* between chapters, never decorate.
- **Evidence:** object constancy (Heer & Robertson 2007) and the coherence principle (Mayer).
- **What the best channels do:** none of them use decorative wipes. ByteByteGo grows one canvas and follows it with the camera. ByteMonk pans to the next region or crossfades.
- **What replaced what:** the earlier amber "sheet turn" line is removed. It crossed the content and spent the marker color on decoration.

**Within a chapter:** camera moves only. No cuts.

**Between chapters, pick the first case that applies:**

1. **Shared-element morph (default).** When the next chapter reuses components (same node `id`):
   1. Elements that leave fade out (`t.exit`, 300 ms).
   2. Shared elements glide to their new positions and sizes (`t.morph`, 1000 ms, standard easing). They keep identity, icon and state color during the move; labels never scale below the 36 px floor.
   3. New elements sketch in after the glide (`t.enter`, staggered 60 ms).
   4. The camera re-frames together with the glide, not after it.
2. **Next-sheet pan.** When nothing is shared:
   - Chapters are pages laid side by side on one notebook canvas.
   - The camera pans one page to the right (`t.sheetPan`, 900 ms, standard easing).
   - A 2 px graphite seam between pages is visible only during the pan. No motion blur (it bands on YouTube).
3. **Title card.** For a new act (e.g. "the problem" → "the fix"), at most 1-3 per video:
   - Pan to an empty sheet.
   - The hero word sketches in (Space Grotesk 140 px), held about 1.5 s.
   - Then the next chapter starts by case 1 or 2.

**Always, the sheet label update** (option A's notebook feel, kept inside the label zone):
1. The old label slides up 12 px and fades (300 ms).
2. The new label types on (`t.labelType`, 400 ms).
3. A 2 px `ink.graphite` pencil underline draws beneath it (`t.labelUnderline`, 500 ms).

Never amber, never across the diagram.

**Timing:** start the transition on the chapter's boundary cue so it plays in the natural pause between chapters; it must not cover narration of a new idea. Hold the settled new layout for at least 1 s before the first new cue.

**Never:** full-frame wipes, lines across the content, spins, zoom-blur, dissolves longer than 500 ms, or a different transition style per chapter.

---

## 5. Signature devices

### 5.1 The marker layer
- **What it is:** amber hand-drawn strokes drawn **on the cue word**, via `@remotion/rough-notation` or rough.js-style paths:
  - circle, curved arrow, cross-out, bracket
  - underline **only** directly under a short word or number on screen (3 words or fewer) that *is* the point
  - plus an optional 1-3 word handwritten note in Caveat
- **Draw time:** 450-600 ms. **Lifetime:** until the next marker or the end of the beat (fade out 300 ms).
- **At most one marker on screen at a time.**
- **Every marker must point at a specific thing** (a node, a packet, a counter, a chip, a word). If there is nothing specific to point at, use no marker: the narration carries it.
  - **Never** underline empty space, a connector, a whole row of nodes or a whole diagram.
  - **Never** add a marker just to echo what was said.
- **Markers are rare.** Most beats have none. Aim for about one marker per chapter, two at most. Their power comes from scarcity.
- **Geometry:**
  - A marker circle encloses its target *and* the target's chips, with 28 px clearance.
  - It never crosses text, a chip or a packet.
  - Its handwritten note sits outside the circle, inside the safe area.
- **Use it for:** the single most important thing in the scene, a correction ("not this"), or the viewer's attention target in a busy overview.

### 5.2 Numbers force the step
- Every scaling or failure step shows the number that causes it, as a **counter chip** attached to the node or edge, e.g. `2,400 req/s`, `p99 840 ms`, `$1.20 / 1K calls`.
- Counters roll smoothly over 600 ms, then hold. Coral when over a threshold, mint when healthy.
- **"Scale It" videos** show a load meter bar under the system that rises with each step.

### 5.3 The sheet frame
- A bottom-left title block, like an engineering drawing: `SHEET 03/07 . CACHE STAMPEDE . T+02:14`.
- It is the chapter indicator and progress bar in one, and a brand mark every viewer sees.
- Optional thin border lines in the frame corners (2 px graphite), like the corner ticks of a drawing sheet.

### 5.4 Packets
- **Shape:** a capsule 28 px tall with a 1-2 word label (`GET /user/42`).
- **Color:** cobalt for requests, mint for responses, coral for failed ones.
- **Trail:** a 120 px fading trail.
- **Arrival:** a 200 ms pulse on the target node.
- **Rate:** for high request rates, show a stream of dots (no labels), plus the counter.

---

## 6. Scene recipes by series

| Series | Default composition | Signature beat |
|---|---|---|
| **Scale It** | One system on a wide canvas, left to right (client to storage). Load meter at the bottom. | Each step: the counter rises → the bottleneck turns coral and pulses → the marker circles it → a new component enters → the counter goes mint |
| **Failure Stories** | A healthy system first (mint), then a timeline strip at the bottom showing the failure unfolding | Packets multiply or stall; a marker cross-out on the wrong assumption; the fix is drawn in cobalt |
| **How It Works** | Zoomed internals of one component (cache, index, OAuth flow) | Step-by-step with `focus` shots; sequence diagrams for protocols |
| **Case Studies** | Paper-card insert of the company's public blog title, then a redrawn architecture | "Then vs now" sheets |
| **AI vs Real Code** | Screen recordings inside a framed "screen" node, plus a scoreboard sheet | Timer and cost counters; marker on where it broke |
| **Inside AI Agents** | Agent loop as a circular track; context window as a fixed-size bar filling up | Tokens as packets filling the context bar |
| **DSA / SQL Patterns** | Array/grid/table rows as nodes; pointers as cobalt carets | Pointer moves on each cue; the pattern name written by the marker |
| **Engineer Growth** | Sparse sheets: one hero number or one quote card | Marker underline on the key phrase |

---

## 7. Captions, Shorts and thumbnails

- **Long-form captions:** **no burned-in captions.** Upload an accurate SRT generated from the WhisperX words. On-screen text stays as keyword labels (redundancy principle).
- **Shorts (1080x1920):**
  - Same tokens; diagrams re-laid out vertically (top to bottom), not cropped.
  - Labels at least 52 px.
  - Critical content inside the central 900x1300 px. Keep the bottom 35% and right 15% clear of text.
  - **Burned keyword captions:** 2-4 words, Inter 700 at 64 px, chalk on a `paper.night` pill. Placed at about 22% from the top, *above* the diagram, never over the bottom UI. The active word is in amber.
- **Thumbnails:**
  - Night-paper background; one diagram fragment at large scale with **one** coral or mint state.
  - 2-4 words in Space Grotesk 700, at least 160 px tall at 1280x720.
  - One amber marker circle or arrow on the object.
  - No faces, no stock photos.
  - The same layout family every time, so the channel is recognizable in the feed.

---

## 8. Sound (supports the visuals)
- **Voice:** -14 to -16 LUFS integrated, true peak -1 dBTP or lower.
- **Optional soft sound effects** (`@remotion/sfx`) at -28 LUFS:
  - a pencil scratch when a marker draws
  - a soft tick for counter changes
  - a soft paper slide on the next-sheet pan (none on morphs)
- No background music under explanations; at most a soft bed on the intro/outro (coherence).

---

## 9. QA checklist (run on every contact sheet before the final render)

1. [ ] Every readable text is 36 px or larger at 1080p (52 px or larger in Shorts).
2. [ ] No label, chip or packet overlaps a stroke, node edge or another label.
3. [ ] All content is inside the 96/54 px safe area; Shorts inside the central 900x1300 px.
4. [ ] 7 or fewer nodes in focus shots; the camera pushes in on dense regions.
5. [ ] Exactly one emphasis per beat (state color, or marker, or camera).
6. [ ] Colors used only with their semantic meaning; mint/coral always paired with icon or word.
7. [ ] Every change is triggered by a cue; at least 1 s hold after each change.
8. [ ] No gradients larger than a chip; no 1 px colored lines.
9. [ ] Under 20 words on screen per frame (code excluded); no narration sentences on screen.
10. [ ] The chapter ends on the overview "master map" with the new layer visible.
11. [ ] The sheet frame shows the correct chapter number and name.
12. [ ] Facts on screen match the script's fact-check list.

---

## 10. What this changes from the first video and the current kit

| Was | Now |
|---|---|
| Light warm-paper canvas, small diagrams with lots of empty space | Night Paper canvas; a camera-driven canvas fills the frame; focus shots for detail |
| Labels ~20-28 px | 44 px node labels, 36 px floor |
| Packet badges sitting on top of node borders | Packets ride the line; labels sit on offset pills; collision check in QA |
| Burned-in mid-phrase captions | SRT for long-form; keyword captions only in Shorts |
| Many accent colors, set per scene | 5 semantic colors, fixed for the channel |
| Fixed-delay reveals | Cue-driven motion with stillness |
| No signature | Marker layer + sheet frame + live counters |
| Every component is the same plain box | Option C iconography: free icons for actors and stores, icon + label boxes for services, icons sketch in |
