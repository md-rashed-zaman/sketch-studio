import {createContext, useContext, type ReactNode} from 'react';
import {dur} from '../theme';
import type {At, SceneInfo} from '../motion/cues';
import type {DiagramProps} from '../diagram/SystemDiagram';

/**
 * Chapter transitions, "continuity first" (design 4.4): when the next chapter reuses components (same node
 * id) they glide to their new layout (morph); when nothing is shared the camera pans to the next sheet.
 */
export type TransitionKind = 'none' | 'morph' | 'pan';

/** `prevIds` is null for the first chapter; a chapter without a diagram has no ids. */
export const transitionKind = (prevIds: string[] | null, nextIds: string[]): TransitionKind =>
  prevIds === null ? 'none' : nextIds.some((id) => prevIds.includes(id)) ? 'morph' : 'pan';

/** Leaving elements fade out, then shared elements glide. */
export const morphTiming = {exitEnd: dur.exit, glideEnd: dur.exit + dur.morph};

/** Old label slides away, new label types on, then its pencil underline draws. */
export const labelTiming = {exitEnd: dur.labelExit, typeEnd: dur.labelExit + dur.labelType, underlineEnd: dur.labelExit + dur.labelType + dur.labelUnderline};

/** How long a transition keeps the frame busy (the next chapter's first cue waits for this plus a hold). */
export const transitionLength = (kind: TransitionKind) =>
  Math.max(kind === 'morph' ? morphTiming.glideEnd : kind === 'pan' ? dur.sheetPan : 0, labelTiming.underlineEnd);

export type ChapterLink = {
  kind: TransitionKind;
  /** The chapter before this one, as it was at its last frame. */
  prev?: {diagram?: DiagramProps; scene: SceneInfo; title?: ReactNode; label: string};
  /** Morph: the previous chapter's leaving elements, drawn under this sheet's content. */
  ghost?: ReactNode;
};

const ChapterLinkContext = createContext<ChapterLink>({kind: 'none'});
export const ChapterLinkProvider = ChapterLinkContext.Provider;
export const useChapterLink = () => useContext(ChapterLinkContext);

/** Set while a chapter is drawn as the morph ghost: shared nodes and connectors are left to the next chapter. */
export type Ghost = {shared: Set<string>; sharedEdges: Set<string>; exit: number};
const GhostContext = createContext<Ghost | null>(null);
export const GhostProvider = GhostContext.Provider;
export const useGhost = () => useContext(GhostContext);

/**
 * What a morph carries over: nodes with the same id, and connectors between them that existed before and are
 * present again by the end of the glide (`resolve` turns a connector's `at` into scene seconds); a connector
 * the next chapter draws later leaves with the ghost and draws on its own cue.
 */
export const carried = (prev: DiagramProps, next: DiagramProps, resolve: (at: At) => number = () => 0) => {
  const prevIds = new Set(prev.nodes.map((n) => n.id));
  const prevEdges = new Set((prev.edges ?? []).map((e) => `${e.from}>${e.to}`));
  const shared = new Set(next.nodes.filter((n) => prevIds.has(n.id)).map((n) => n.id));
  const sharedEdges = new Set(
    (next.edges ?? [])
      .map((e) => ({e, key: `${e.from}>${e.to}`}))
      .filter(({e, key}) => shared.has(e.from) && shared.has(e.to) && prevEdges.has(key) && resolve(e.at ?? 0) <= morphTiming.glideEnd)
      .map(({key}) => key),
  );
  return {shared, sharedEdges};
};
