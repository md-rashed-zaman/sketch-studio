import {useVideoConfig} from 'remotion';
import {layout as L, type} from '../theme';

export type Layout = '16:9' | '9:16';
export type Rect = {x: number; y: number; w: number; h: number};

/** An explicit layout wins; otherwise it follows the composition's aspect ratio. */
export const useLayout = (layout?: Layout): Layout => {
  const {width, height} = useVideoConfig();
  return layout ?? (height > width ? '9:16' : '16:9');
};

const shorts = L.shorts;
const shortsSafe: Rect = {
  x: (shorts.w - shorts.safeCenter.w) / 2,
  y: (shorts.h - shorts.safeCenter.h) / 2,
  w: shorts.safeCenter.w,
  h: shorts.safeCenter.h,
};

/** Where readable content may go: 96/54 px margins at 16:9, the central 900x1300 in Shorts. */
export const safeArea: Record<Layout, Rect> = {
  '16:9': {x: L.safe.x, y: L.safe.y, w: L.frame.w - 2 * L.safe.x, h: L.frame.h - 2 * L.safe.y},
  '9:16': shortsSafe,
};

// Shorts, top to bottom: the scene title at the top of the safe area, then the stage, then the dark caption
// pill centred at 62%, just above the bottom 35% that stays clear for the Shorts UI (as does the right 15%).
export const shortsTitleTop = shortsSafe.y;
const shortsStageTop = shortsTitleTop + type.sceneTitle * 1.05 + 28;
const captionTop = shorts.h * (shorts.captionTopPct / 100) - (type.shortsCaption * 1.2 + 20) / 2;
const shortsStageRight = Math.min(shortsSafe.x + shortsSafe.w, shorts.w * (1 - shorts.clearRightPct / 100));
const shortsStageBottom = Math.min(shortsSafe.y + shortsSafe.h, shorts.h * (1 - shorts.clearBottomPct / 100), captionTop - 24);

/** The region the diagram camera frames: below the title zone, above the sheet frame. */
export const stageArea: Record<Layout, Rect> = {
  '16:9': {
    x: L.safe.x,
    y: L.zones.titleTop,
    w: L.frame.w - 2 * L.safe.x,
    h: L.frame.h - L.safe.y - L.zones.sheetFrameBottom - L.zones.titleTop,
  },
  '9:16': {
    x: shortsSafe.x,
    y: shortsStageTop,
    w: shortsStageRight - shortsSafe.x,
    h: shortsStageBottom - shortsStageTop,
  },
};

/** Smallest on-screen size for text the viewer must read. */
export const minReadable: Record<Layout, number> = {'16:9': type.minReadablePx, '9:16': type.minReadablePxShorts};
