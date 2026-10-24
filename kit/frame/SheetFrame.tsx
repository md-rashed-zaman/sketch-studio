import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {color, dur, ease, font, layout as L, tokens, toneText, type, type Tone} from '../theme';
import {progressAt, useSceneTime, type SceneInfo} from '../motion/cues';
import {labelTiming, useChapterLink, useGhost} from './transition';
import {minReadable, safeArea, shortsTitleTop, stageArea, useLayout, type Layout} from './surface';

const pad2 = (n: number) => String(n).padStart(2, '0');
const clock = (seconds: number) => `${pad2(Math.floor(seconds / 60))}:${pad2(Math.floor(seconds % 60))}`;

/** Flat Night Paper with the 48 px dot grid. */
export const Paper = () => (
  <AbsoluteFill
    style={{
      background: color.night,
      backgroundImage: `radial-gradient(${color.grid} ${L.dotGrid.dot / 2}px, transparent ${L.dotGrid.dot / 2 + 0.1}px)`,
      backgroundSize: `${L.dotGrid.spacing}px ${L.dotGrid.spacing}px`,
      backgroundPosition: `${L.dotGrid.spacing / 2}px ${L.dotGrid.spacing / 2}px`,
    }}
  />
);

/** Drawing-sheet corner ticks and the small "sketch lab" mark. Decorative: they sit outside the safe area. */
const SheetDecor = ({shape}: {shape: Layout}) => {
  const {width, height} = useVideoConfig();
  const tick = (style: CSSProperties) => (
    <div style={{position: 'absolute', width: 36, height: 36, borderColor: color.graphite, borderStyle: 'solid', ...style}} />
  );
  return (
    <AbsoluteFill aria-hidden>
      {tick({left: 40, top: 28, borderWidth: '2px 0 0 2px'})}
      {tick({right: 40, top: 28, borderWidth: '2px 2px 0 0'})}
      {tick({left: 40, bottom: 28, borderWidth: '0 0 2px 2px'})}
      {tick({right: 40, bottom: 28, borderWidth: '0 2px 2px 0'})}
      <div
        style={{
          position: 'absolute',
          right: shape === '9:16' ? (width - safeArea['9:16'].w) / 2 : L.safe.x,
          top: shape === '9:16' ? height * 0.06 : 72,
          fontFamily: font.marker,
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1,
          color: color.pencil,
          opacity: 0.6,
        }}
      >
        sketch lab
      </div>
    </AbsoluteFill>
  );
};

/** Colored emphasis inside a title. The tone keeps its semantic meaning (coral = the problem, etc.). */
export const Em = ({children, tone = 'cobalt'}: {children: ReactNode; tone?: Tone}) => (
  <span style={{color: toneText[tone]}}>{children}</span>
);

/** Secondary note: pencil, six words at most; 36 px, or the 52 px floor in Shorts. */
export const Note = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <div style={{fontFamily: font.ui, fontWeight: 500, fontSize: minReadable[useLayout()], color: color.pencil, ...style}}>{children}</div>
);

/** The sheet frame text: `SHEET nn/NN . CHAPTER . T+mm:ss` with the running episode time. */
export const sheetLabel = (scene: SceneInfo, chapter: string | undefined, now: number) =>
  `SHEET ${pad2(scene.index + 1)}/${pad2(scene.count)} . ${chapter ?? scene.id.toUpperCase()} . T+${clock(scene.start + now)}`;

const labelStyle: CSSProperties = {
  position: 'absolute',
  fontFamily: font.code,
  fontWeight: 500,
  fontSize: type.sheetFrame,
  letterSpacing: '1px',
  color: color.pencil,
  whiteSpace: 'pre',
};

/**
 * One chapter's sheet: paper, corner ticks, mark, scene title (72 px, top-left) and the sheet frame label
 * (bottom-left, 16:9 only). On a chapter change (design 4.4) the old label slides up 12 px and fades, the
 * new one types on and a graphite pencil underline draws under it; in a morph the old title fades out first.
 */
export const SheetFrame = ({
  title,
  chapter,
  layout,
  children,
}: {
  title?: ReactNode;
  chapter?: string;
  layout?: Layout;
  children?: ReactNode;
}) => {
  const shape = useLayout(layout);
  const {now, scene} = useSceneTime();
  const link = useChapterLink();
  const ghost = useGhost();
  const safe = safeArea[shape];
  // Drawn as a morph ghost: only the content, fading out while it leaves.
  if (ghost) return <AbsoluteFill style={{opacity: 1 - ghost.exit}}>{children}</AbsoluteFill>;

  const morph = link.kind === 'morph';
  const leave = progressAt(now, dur.exit, ease.exit);
  const typeFrom = morph ? labelTiming.exitEnd : 0;
  const label = sheetLabel(scene, chapter, now);
  const typed = progressAt(now - typeFrom, dur.labelType, ease.standard);
  const underline = progressAt(now - typeFrom - dur.labelType, dur.labelUnderline, ease.standard);
  const labelOut = progressAt(now, dur.labelExit, ease.exit);
  const titleAt = (node: ReactNode, opacity: number) =>
    opacity > 0 ? (
      <div
        style={{
          position: 'absolute',
          left: safe.x,
          top: shape === '9:16' ? shortsTitleTop : 70,
          maxWidth: stageArea[shape].w, // in Shorts this keeps the right 15% clear
          fontFamily: font.display,
          fontWeight: 700,
          fontSize: type.sceneTitle,
          lineHeight: 1.05,
          letterSpacing: '-0.5px',
          opacity,
        }}
      >
        {node}
      </div>
    ) : null;
  const t = tokens.motion.transition;
  // The label sits high enough that its pencil underline (8 px below it) stays inside the safe area.
  const labelBottom = L.safe.y + 8 + t.labelUnderlinePx;
  return (
    <AbsoluteFill style={{fontFamily: font.ui, color: color.chalk}}>
      <Paper />
      <SheetDecor shape={shape} />
      {morph ? link.ghost : null}
      {morph && link.prev?.title ? titleAt(link.prev.title, 1 - leave) : null}
      {title ? titleAt(title, morph ? progressAt(now - dur.exit, dur.enter) : 1) : null}
      {children}
      {shape === '16:9' ? (
        <>
          {morph && link.prev && labelOut < 1 ? (
            <div style={{...labelStyle, left: safe.x, bottom: labelBottom + t.labelExitRisePx * labelOut, opacity: 1 - labelOut}}>
              {link.prev.label}
            </div>
          ) : null}
          <div style={{...labelStyle, left: safe.x, bottom: labelBottom}}>
            {label.slice(0, Math.round(label.length * typed))}
            {/* graphite pencil underline, never amber */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -8,
                height: t.labelUnderlinePx,
                background: color.graphite,
                transform: `scaleX(${underline})`,
                transformOrigin: 'left',
              }}
            />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
