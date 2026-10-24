# Sketch Studio

The System Sketch Lab production system: one Remotion renderer, one component kit, and a script with
`{cue:name}` markers that drives the animation timing. The plan behind it is the production-system proposal kept with the channel planning docs (`swe/06-production-system.md`).
The look is the "Night Paper" design system in `design/02-design-system.md`; the kit imports its
values straight from `design/tokens.json`, so change a token there, not in code.

## Setup

```bash
npm install
uv sync          # Python tools: WhisperX (CPU-only torch), auto-editor, pytest
```

## Making an episode

An episode is a folder `episodes/<name>/` with `script.md`, `audio/raw/*` (your takes), and
`episode.tsx`. Its Remotion composition id is the folder name, registered in `src/Root.tsx`.

1. **Write `script.md`.** Narration goes under `## scene: <id> | pattern: <pattern>` headings. Every
   other section (title, notes, fact-check list) is ignored. A `{cue:name}` tag is never spoken. It
   fires at the end of the word before it, so put it *before* the phrase if the visual should land
   while it is said. Keep a cue at least 0.8 s before the scene's last word (`align` warns otherwise).
2. **Record** into `audio/raw/`, **one file per scene**, named by scene number: `01-problem.wav`,
   `02-cache-aside.wav`. Re-record a whole sentence when you stumble; pauses are cut later. A long scene
   may be split into `01a-...`, `01b-...` (same leading number = same scene, joined without a pause).
   To fix one scene later, re-record only its file.
3. **Clean the voice:** `npm run voice -- <name>` cleans each take (noise reduction with `deep-filter`
   if it is on PATH, else ffmpeg `afftdn`; auto-editor cuts pauses to 0.25 s), joins them in name order
   with a fixed **chapter pause** (`audio.chapterGapS` in tokens, 2.0 s) between scenes so the chapter
   transition plays in silence, and normalizes to -14 LUFS / -1.5 dBTP. Output: `audio/voice.wav`.
4. **Align:** `npm run align -- <name>` runs WhisperX on `voice.wav`, matches the heard words to the
   script words, and writes `timing.json` (scene ranges, cue times, word captions). Re-record a line
   and run it again: every animation moves with it. Takes about 3 minutes for 40 s of audio on this
   laptop (the first run also downloads ~500 MB of models).
5. **Build scenes** in `episode.tsx` from kit components, timed with cue names (`at: 'db-red'`, or
   `'db-red+1.2'` for a beat after a cue). Write each chapter as a `Chapter` object
   (`{title, chapter, diagram, hud}` or `{titleCard: {hero}}`) so the episode can link chapters:
   when the next chapter reuses a node `id` (keep its label and kind), its nodes glide from one layout to
   the next (shared-element morph); when nothing is shared the camera pans to the next sheet. A plain
   component also works as a scene (it always pans).
6. **Review:** `npm run studio` for live preview, or `npm run sheet -- <name>` for a still per cue at
   `episodes/<name>/out/sheet/` plus a labelled grid at `out/sheet.png`.
7. **Render:** `npm run render -- <name> episodes/<name>/out/master.mp4` (add `--scale=0.5` for a
   quick preview). Duration comes from `voice.wav` via `calculateMetadata`, plus a 1.5 s hold.
8. **Captions:** `npm run srt -- <name>` writes `episodes/<name>/out/captions.srt` from the word timings
   for upload. Long-form has no burned-in captions; Shorts compositions pass `captions` to `Episode`.

`bash tools/placeholder-voice.sh <name>` writes a Piper TTS narration to
`audio/raw/00-placeholder-tts.wav` so the pipeline can be tested before recording. It is for testing
only; delete it before recording the real takes.

## Checks

```bash
npm run typecheck
npm test         # vitest (kit) + pytest (align, srt)
```

## Kit (`kit/`)

| Area | Components |
|---|---|
| `theme.ts` | Colors, tones, fonts, type sizes, layout, easing and durations, all from `tokens.json` |
| `fonts.ts` | Space Grotesk, Inter, JetBrains Mono, Caveat via `@remotion/google-fonts` (needs network at render time) |
| `motion/` | `useCue(at)`, `useSince()`, `useSceneTime()`, `Reveal`. `at` is a cue name, `cue+seconds`, or seconds from the scene start |
| `frame/` | `SheetFrame` (dot-grid paper, corner ticks, mark, scene title, `SHEET nn/NN . CHAPTER . T+mm:ss` with a typed-on label and graphite underline), `transition` (morph or pan selection), `TitleCard` (hero word sketch-in), `Em`, `Note`, `ShortsCaptions`. `layout="16:9" \| "9:16"` defaults to the composition's aspect ratio |
| `diagram/` | `SystemDiagram`: auto-sized nodes with idle/active/hot/ok states, orthogonal connectors with label pills, chips and rolling counters, labeled packets and dot streams at 650 px/s, the amber marker layer (circle, underline, arrow + note), and camera shots (overview, focus, track) that return to the overview before each chapter ends |
| `diagram/` icons | `Icon` (Lucide glyph by component key from tokens `icon.map`, strokes sketch in). Give a node `kind` (e.g. `'cache'`): actors and stores in `icon.freeStanding` render as free 104 px icons with the label below; services render boxed with a 56 px icon (icon over label in Shorts). Packets take `icon: 'message'`, chips `icon: 'token' \| 'ttl'` |
| `explain/` | `LatencyBars`, `KeyValueCard`, `SlotGrid` (+ `victimOf` for LRU / LFU / FIFO), `TtlTimeline`, `Checklist`, `Tabs`, `Badge`, `CodeLine`, `CodeCard` (lines type on, highlight, step badges, dim, `insert` a line, `lift` a span out and glide it into another box; `codeCardPoint` gives the target); each has a layout helper (`latencyBarEnd`, `slotGridLayout`, `checklistRowBox`, `ttlRowBox`) so a `Marker` can point at its parts |
| `frame/Marker` | `Marker`: the amber marker on any screen box (circle, underline, arrow, cross, bracket; note placed clear of the box; underlines only under one short word or number) |
| `data/` | `LoadMeter`, `HeroNumber`, `PaperCard` |
| `episode.tsx` | `Episode` (one chapter per scene in `timing.json`, chapter transitions, voice), `Chapter`, `durationFromAudio` |

`SystemDiagram` extras: `area` (draw in part of the sheet, e.g. two panels), `cards` (content pinned beside a
node, moving with the camera), node / packet `until` and connector `exit` (leave on cue), the `dim` node state,
`neutral` / `note` chips, packet `park` (stop on the line), markers on node groups, a connector, a chip `id` or
a parked packet `id`, stream `rate` steps (`[{at, value}]`), and an overview shot `into` a sub-rect (e.g. move a
system up into a band while code takes the lower stage). Every marker points at one thing: an underline
under a connector, a row of nodes or anything wider than 600 px throws.
A chapter can open on a title card with `intro: {hero}` (pan in, hold 1.5 s, pan on).

`SystemDiagram` refuses layouts whose overview would shrink text below the readable floor (36 px,
52 px in Shorts): split the diagram or move nodes closer. The `KitGallery` and `KitGallery-Vertical`
compositions show every component.

## Sample

`episodes/sample/` holds the first two scenes of the caching script, shortened to ~40 s, with a
placeholder TTS voice. It proves the whole chain: `placeholder-voice` -> `voice` -> `align` -> `sheet` -> `render`.

## Notes

- Remotion agent skills are already installed globally (`~/.claude/skills/remotion-best-practices`).
  The official Claude Code plugin changes global config, so it is not installed. To add it:
  `claude plugin marketplace add remotion-dev/claude-code-plugin && claude plugin install remotion@remotion`.
- DeepFilterNet's PyPI package needs numpy<2 and conflicts with WhisperX, so it is not in the venv.
  `voice.sh` uses its standalone `deep-filter` binary when one is on PATH.
- `remotion render` copies the whole `episodes/` folder (the public dir) into each bundle. Raw takes
  are included, so renders take longer to start as takes accumulate.
- Renders use `--concurrency=2` (set in `remotion.config.ts`) to suit 4 cores and 7 GB of RAM.
