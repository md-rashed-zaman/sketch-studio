import {createContext, useContext, type ReactNode} from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, type EasingFunction} from 'remotion';
import type {Caption} from '@remotion/captions';
import {dur, ease} from '../theme';

/** Shape of an episode's generated timing.json (see tools/align.py). */
export type Timing = {
  duration: number;
  scenes: Record<string, number[]>; // [start, end] seconds
  cues: Record<string, number>;
  captions: Caption[];
};

/**
 * When something happens: a cue name from timing.json, a cue plus an offset ('db-read+1.2'),
 * or seconds from the start of the current scene.
 */
export type At = string | number;

/** The scene being rendered: its id, position among the episode's scenes, and length in seconds. */
export type SceneInfo = {id: string; index: number; count: number; start: number; duration: number};

type Clock = {cues: Record<string, number>; scene: SceneInfo};

const ClockContext = createContext<Clock>({
  cues: {},
  scene: {id: '', index: 0, count: 1, start: 0, duration: Infinity},
});

/** Episode wraps every scene in this so cue names resolve relative to the scene's own Sequence. */
export const SceneClock = ({cues, scene, children}: Clock & {children: ReactNode}) => (
  <ClockContext.Provider value={{cues, scene}}>{children}</ClockContext.Provider>
);

export const resolveAt = (at: At, {cues, scene}: Clock) => {
  if (typeof at === 'number') return at;
  const [, name, offset] = at.match(/^(.*?)(?:\+([\d.]+))?$/)!;
  const seconds = cues[name];
  if (seconds === undefined) {
    throw new Error(`Unknown cue "${name}". Add {cue:${name}} to script.md and run npm run align.`);
  }
  return seconds - scene.start + Number(offset ?? 0);
};

/** Eased 0..1 progress of a change that started `since` seconds ago. */
export const progressAt = (since: number, duration: number = dur.enter, easing: EasingFunction = ease.enter) =>
  interpolate(since, [0, duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** `now` in seconds since the scene started, `at(cue)` in the same scene-relative seconds, and the scene. */
export const useSceneTime = () => {
  const clock = useContext(ClockContext);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {now: frame / fps, fps, at: (at: At = 0) => resolveAt(at, clock), scene: clock.scene};
};

export type SceneTime = ReturnType<typeof useSceneTime>;

/** The episode's cue times (for evaluating another scene's timeline, e.g. the previous chapter in a morph). */
export const useCues = () => useContext(ClockContext).cues;

/** A SceneTime for any scene at any moment: what `useSceneTime` would return there. */
export const sceneTimeAt = (cues: Record<string, number>, scene: SceneInfo, now: number, fps: number): SceneTime => ({
  now,
  fps,
  at: (at: At = 0) => resolveAt(at, {cues, scene}),
  scene,
});

/** Returns `since(at)`: seconds elapsed since `at` in the current scene (negative before it). Use inside loops. */
export const useSince = () => {
  const {now, at} = useSceneTime();
  return (cue: At = 0) => now - at(cue);
};

/** Eased 0..1 progress of a change that fires at `at` (default: an enter, 500 ms). */
export const useCue = (at: At = 0, duration: number = dur.enter, easing: EasingFunction = ease.enter) =>
  progressAt(useSince()(at), duration, easing);
