import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Caption} from '@remotion/captions';
import {color, font, layout as L, type} from '../theme';

type Page = {words: Caption[]; start: number; end: number};

/** Groups word timings into 2-4 word pages, breaking after punctuation and at pauses. */
export const captionPages = (captions: Caption[], maxWords = 4): Page[] => {
  const pages: Page[] = [];
  let words: Caption[] = [];
  const flush = () => {
    if (words.length) pages.push({words, start: words[0].startMs, end: words[words.length - 1].endMs});
    words = [];
  };
  captions.forEach((c, i) => {
    const prev = captions[i - 1];
    const pause = prev && c.startMs - prev.endMs > 600;
    const sentenceEnd = prev && /[.,!?:;]$/.test(prev.text.trim()) && words.length >= 2;
    if (words.length >= maxWords || pause || sentenceEnd) flush();
    words.push(c);
  });
  flush();
  return pages;
};

/**
 * Shorts keyword captions: 2-4 words, Inter 700 at 64 px, chalk on a night pill at 22% from the top
 * (above the diagram, clear of the Shorts UI). The spoken word turns amber. Not for 16:9: long-form
 * gets an SRT instead (npm run srt).
 */
export const ShortsCaptions = ({captions}: {captions: Caption[]}) => {
  const frame = useCurrentFrame();
  const {fps, height, width} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const page = captionPages(captions).findLast((p) => p.start <= ms);
  if (!page || ms > page.end + 300) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: (width - L.shorts.safeCenter.w) / 2,
          width: L.shorts.safeCenter.w,
          top: height * (L.shorts.captionTopPct / 100),
          transform: 'translateY(-50%)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: color.night,
            borderRadius: 999,
            padding: '10px 32px',
            fontFamily: font.ui,
            fontWeight: 700,
            fontSize: type.shortsCaption,
            lineHeight: 1.2,
            color: color.chalk,
            textAlign: 'center',
          }}
        >
          {page.words.map((w, i) => (
            <span key={w.startMs} style={{color: w.startMs <= ms && ms < w.endMs ? color.amber : color.chalk}}>
              {i ? ' ' : ''}
              {w.text.trim()}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
