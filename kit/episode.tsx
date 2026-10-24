import type {ComponentType, ReactNode} from 'react';
import {AbsoluteFill, Audio, Freeze, Sequence, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {color, dur, ease, tokens} from './theme';
import {progressAt, resolveAt, SceneClock, type SceneInfo, type Timing} from './motion/cues';
import {ShortsCaptions} from './frame/ShortsCaptions';
import {SheetFrame, sheetLabel} from './frame/SheetFrame';
import {TitleCard} from './frame/TitleCard';
import type {Layout} from './frame/surface';
import {
  carried,
  ChapterLinkProvider,
  GhostProvider,
  morphTiming,
  transitionKind,
  transitionLength,
  type ChapterLink,
  type Ghost,
} from './frame/transition';
import {SystemDiagram, type DiagramProps} from './diagram/SystemDiagram';

export const FPS = tokens.layout.frame.fps;
const TAIL_SECONDS = 1.5; // hold the last frame after the narration ends

/**
 * A chapter as data, so the episode can link it to its neighbours: a diagram sheet (morphs into the next
 * chapter when they share node ids) or a title card. Use a plain component for anything else.
 */
export type Chapter = {
  title?: ReactNode;
  /** Name in the sheet frame (default: the scene id in capitals). */
  chapter?: string;
  /** The chapter's diagram, or a function laying it out per format. */
  diagram?: DiagramProps | ((layout: Layout) => DiagramProps);
  /** Extra sheet content beside the diagram, e.g. a LoadMeter. */
  hud?: ComponentType;
  /** A title card (one hero word, held ~1.5 s) instead of a diagram. */
  titleCard?: {hero: string; note?: string};
  /** A title card for a new act shown first (pan in, hero word held ~1.5 s, pan on to this chapter). */
  intro?: {hero: string; note?: string};
};

/** How long an intro title card keeps the chapter busy: pan in, sketch + hold, pan on. */
export const introLength = dur.sheetPan + dur.titleCardHold + dur.sheetPan;

const isChapter = (s: ComponentType | Chapter): s is Chapter => typeof s === 'object';

const ChapterSheet = ({spec, diagram}: {spec: Chapter; diagram?: DiagramProps}) => {
  if (spec.titleCard) return <TitleCard hero={spec.titleCard.hero} note={spec.titleCard.note} chapter={spec.chapter} />;
  const Hud = spec.hud;
  return (
    <SheetFrame title={spec.title} chapter={spec.chapter}>
      {diagram ? <SystemDiagram {...diagram} /> : null}
      {Hud ? <Hud /> : null}
    </SheetFrame>
  );
};

/** The morph's leaving elements: the previous chapter's last frame, fading out (then gone). */
const MorphGhost = ({frame, shared}: {frame: (ghost: Ghost) => ReactNode; shared: Omit<Ghost, 'exit'>}) => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  if (t >= morphTiming.exitEnd) return null;
  return <>{frame({...shared, exit: progressAt(t, dur.exit, ease.exit)})}</>;
};

/** A new act: the title card sheet, then a pan on to the chapter itself. */
const WithIntro = ({card, children}: {card: ReactNode; children: ReactNode}) => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const panAt = dur.sheetPan + dur.titleCardHold;
  if (t < panAt) return <>{card}</>;
  return (
    <SheetPan at={panAt} previous={<Freeze frame={Math.round(panAt * fps) - 1}>{card}</Freeze>}>
      {children}
    </SheetPan>
  );
};

/** Next-sheet pan: both chapters as adjacent pages, the camera moving one page right; seam only while moving. */
const SheetPan = ({previous, children, at = 0}: {previous: ReactNode; children: ReactNode; at?: number}) => {
  const {width, fps} = useVideoConfig();
  const t = useCurrentFrame() / fps - at;
  if (t >= dur.sheetPan) return <>{children}</>;
  const p = progressAt(t, dur.sheetPan, ease.standard);
  const seam = tokens.motion.transition.seamPx;
  return (
    <>
      <AbsoluteFill style={{transform: `translateX(${-width * p}px)`}}>{previous}</AbsoluteFill>
      <AbsoluteFill style={{transform: `translateX(${width * (1 - p)}px)`}}>{children}</AbsoluteFill>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: width * (1 - p) - seam / 2, width: seam, background: color.graphite}} />
    </>
  );
};

/**
 * Plays an episode: one Sequence per scene range from timing.json, linked by "continuity first"
 * transitions (shared-element morph, else next-sheet pan), the voice track, and, for Shorts only,
 * burned-in keyword captions.
 */
export const Episode = ({
  timing,
  scenes,
  audio,
  captions = false,
}: {
  timing: Timing;
  scenes: Record<string, ComponentType | Chapter>;
  /** Path under episodes/, e.g. 'sample/audio/voice.wav'. */
  audio?: string;
  /** Shorts keyword captions. Long-form uses the SRT from `npm run srt` instead. */
  captions?: boolean;
}) => {
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const layout: Layout = height > width ? '9:16' : '16:9';
  const ranges = Object.entries(timing.scenes);
  const missing = ranges.map(([id]) => id).filter((id) => !scenes[id]);
  if (missing.length) throw new Error(`No scene component for: ${missing.join(', ')}`);

  const specs = ranges.map(([id]) => scenes[id]);
  const diagrams = specs.map((sp) =>
    isChapter(sp) && sp.diagram ? (typeof sp.diagram === 'function' ? sp.diagram(layout) : sp.diagram) : undefined,
  );
  const ids = diagrams.map((d) => d?.nodes.map((n) => n.id) ?? []);
  // A chapter that opens on a title card always pans to it (the card shares nothing).
  const kinds = ids.map((nodeIds, i) => {
    const sp = specs[i];
    return i > 0 && isChapter(sp) && sp.intro ? 'pan' : transitionKind(i === 0 ? null : ids[i - 1], nodeIds);
  });

  // A chapter starts on its boundary, unless its transition plus a settled hold would reach its first cue:
  // then it starts earlier, shortening the previous chapter's master-map hold (never its narration).
  const cueTimes = Object.values(timing.cues);
  const starts = ranges.map(([, [start, end]], i) => {
    if (i === 0) return start;
    const first = Math.min(...cueTimes.filter((c) => c >= start && c < end));
    const prevLast = Math.max(ranges[i - 1][1][0], ...cueTimes.filter((c) => c < start));
    // An intro's first pan is the transition itself: pan in, hold, pan on.
    const busy = isChapter(specs[i]) && (specs[i] as Chapter).intro ? introLength : transitionLength(kinds[i]);
    return Math.min(start, Math.max(first - busy - dur.holdMin, prevLast + dur.holdMin));
  });
  const froms = starts.map((s) => Math.round(s * fps));
  const infos: SceneInfo[] = ranges.map(([id], i) => {
    const until = i === ranges.length - 1 ? durationInFrames : froms[i + 1];
    return {id, index: i, count: ranges.length, start: starts[i], duration: Math.max(1, until - froms[i]) / fps};
  });
  const names = specs.map((sp, i) => (isChapter(sp) ? sp.chapter : undefined) ?? infos[i].id.toUpperCase());

  const body = (i: number) => {
    const sp = specs[i];
    if (isChapter(sp) && sp.intro) {
      return (
        <WithIntro card={<TitleCard hero={sp.intro.hero} note={sp.intro.note} chapter={sp.chapter} />}>
          <ChapterSheet spec={{...sp, intro: undefined}} diagram={diagrams[i]} />
        </WithIntro>
      );
    }
    if (isChapter(sp)) return <ChapterSheet spec={sp} diagram={diagrams[i]} />;
    const Scene = sp;
    return <Scene />;
  };
  // Scene i as it was at its last frame (for the next chapter's transition).
  const lastFrame = (i: number, ghost: Ghost | null) => (
    <Freeze frame={Math.round(infos[i].duration * fps) - 1}>
      <SceneClock cues={timing.cues} scene={infos[i]}>
        <ChapterLinkProvider value={{kind: 'none'}}>
          <GhostProvider value={ghost}>{body(i)}</GhostProvider>
        </ChapterLinkProvider>
      </SceneClock>
    </Freeze>
  );
  const linkOf = (i: number): ChapterLink => {
    if (i === 0) return {kind: 'none'};
    const prevSpec = specs[i - 1];
    const prev = {
      diagram: diagrams[i - 1],
      scene: infos[i - 1],
      title: isChapter(prevSpec) ? prevSpec.title : undefined,
      label: sheetLabel(infos[i - 1], names[i - 1], infos[i - 1].duration),
    };
    if (kinds[i] !== 'morph') return {kind: kinds[i], prev};
    const shared = carried(diagrams[i - 1]!, diagrams[i]!, (at) => resolveAt(at, {cues: timing.cues, scene: infos[i]}));
    return {kind: 'morph', prev, ghost: <MorphGhost shared={shared} frame={(ghost) => lastFrame(i - 1, ghost)} />};
  };

  return (
    <AbsoluteFill style={{background: color.night}}>
      {ranges.map(([id], i) => {
        const until = i === ranges.length - 1 ? durationInFrames : froms[i + 1];
        const scene = (
          <SceneClock cues={timing.cues} scene={infos[i]}>
            <ChapterLinkProvider value={linkOf(i)}>{body(i)}</ChapterLinkProvider>
          </SceneClock>
        );
        return (
          <Sequence key={id} name={id} from={froms[i]} durationInFrames={Math.max(1, until - froms[i])} premountFor={fps}>
            {kinds[i] === 'pan' ? <SheetPan previous={lastFrame(i - 1, null)}>{scene}</SheetPan> : scene}
          </Sequence>
        );
      })}
      {audio ? <Audio src={staticFile(audio)} /> : null}
      {captions ? <ShortsCaptions captions={timing.captions} /> : null}
    </AbsoluteFill>
  );
};

/**
 * calculateMetadata: the composition lasts as long as the voice track plus a hold (pass ~10 s for a
 * finished episode, so the calm last chapter carries YouTube's end-screen elements).
 */
export const durationFromAudio =
  (audio: string, tail = TAIL_SECONDS): CalculateMetadataFunction<Record<string, unknown>> =>
  async () => ({
    durationInFrames: Math.ceil((await getAudioDurationInSeconds(staticFile(audio)) + tail) * FPS),
  });
