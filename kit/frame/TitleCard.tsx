import {useVideoConfig} from 'remotion';
import {color, dur, ease, font, tokens, type} from '../theme';
import {progressAt, useSince, type At} from '../motion/cues';
import {Note, SheetFrame} from './SheetFrame';
import {safeArea, useLayout, type Layout} from './surface';

/**
 * A new act: one hero word on an empty sheet. Its outline sketches in (the strokes draw on), then the
 * fill and the note follow. Hold it about `titleCardHold` (1.5 s) before the next chapter.
 */
export const TitleCard = ({
  hero,
  note,
  chapter,
  at = 0,
  layout,
}: {
  hero: string;
  note?: string;
  chapter?: string;
  at?: At;
  layout?: Layout;
}) => {
  const shape = useLayout(layout);
  const {width} = useVideoConfig();
  const since = useSince()(at);
  const safe = safeArea[shape];
  const sketch = progressAt(since, dur.drawMax, ease.standard);
  const fill = progressAt(since - dur.drawMax * 0.7, dur.enter, ease.standard);
  // Glyph outlines are long and unmeasured: a dash longer than any outline draws them on evenly enough.
  const dash = hero.length * type.hero * 4;
  const top = shape === '9:16' ? safe.y + safe.h * 0.3 : safe.y + safe.h / 2;
  return (
    <SheetFrame chapter={chapter} layout={layout}>
      <svg width={width} height={top + type.hero} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <text
          x={safe.x}
          y={top}
          fontFamily={font.display}
          fontWeight={700}
          fontSize={type.hero}
          letterSpacing={-2}
          fill={color.chalk}
          fillOpacity={fill}
          stroke={color.chalk}
          strokeWidth={2}
          strokeDasharray={dash}
          strokeDashoffset={dash * (1 - sketch)}
        >
          {hero}
        </text>
      </svg>
      {note ? (
        <div style={{position: 'absolute', left: safe.x, top: top + 40, opacity: fill, transform: `translateY(${(1 - fill) * tokens.motion.enterRisePx}px)`}}>
          <Note>{note}</Note>
        </div>
      ) : null}
    </SheetFrame>
  );
};
