// Contact sheet: one still per cue (settled, just before the next cue) plus a labelled grid.
//   npm run sheet -- <episode>      writes episodes/<episode>/out/sheet/*.png and out/sheet.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync} from 'node:fs';
import path from 'node:path';

const episode = process.argv[2];
if (!episode) throw new Error('usage: npm run sheet -- <episode>');
const root = path.resolve(import.meta.dirname, '..');
const folder = path.join(root, 'episodes', episode);
const timing = JSON.parse(readFileSync(path.join(folder, 'timing.json'), 'utf8')) as {
  cues: Record<string, number>;
  scenes: Record<string, number[]>;
};
const outDir = path.join(folder, 'out', 'sheet');
rmSync(outDir, {recursive: true, force: true});
mkdirSync(path.join(outDir, 'labelled'), {recursive: true});

const serveUrl = await bundle({
  entryPoint: path.join(root, 'src/index.ts'),
  publicDir: path.join(root, 'episodes'),
  symlinkPublicDir: true,
});
const composition = await selectComposition({serveUrl, id: episode});
const {fps, durationInFrames} = composition;

const cues = Object.entries(timing.cues).sort((a, b) => a[1] - b[1]);
// Pad file numbers to the cue count so names sort in cue order (100 cues and more too).
const pad = Math.max(2, String(cues.length).length);
const num = (n: number) => String(n).padStart(pad, '0');
for (const [i, [name, seconds]] of cues.entries()) {
  const next = cues[i + 1]?.[1] ?? Infinity;
  const sceneEnd = Object.values(timing.scenes).find(([start, end]) => start <= seconds && seconds < end)?.[1] ?? Infinity;
  // Reveals settle in ~0.5 s and camera moves in 1.2 s; never step past the next cue or out of the cue's scene.
  const settled = Math.min(seconds + 1.3, next - 1 / fps, sceneEnd - 1 / fps);
  const frame = Math.min(Math.round(settled * fps), durationInFrames - 1);
  const file = `${num(i + 1)}-${name}.png`;
  await renderStill({composition, serveUrl, frame, scale: 0.5, output: path.join(outDir, file)});
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(outDir, file),
    '-vf', `drawtext=text='${i + 1}  ${name}  ${seconds.toFixed(2)}s':x=w-tw-22:y=h-th-18:fontsize=26:fontcolor=white:box=1:boxcolor=0x080A0D@0.85:boxborderw=8`,
    path.join(outDir, 'labelled', `${num(i + 1)}.png`),
  ]);
  console.log(`${file}  frame ${frame}`);
}

const columns = 4;
execFileSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1', '-start_number', '1',
  '-i', path.join(outDir, 'labelled', `%0${pad}d.png`),
  '-vf', `tile=${columns}x${Math.ceil(cues.length / columns)}:padding=8:margin=8:color=0x080A0D`,
  '-frames:v', '1', path.join(folder, 'out', 'sheet.png'),
]);
rmSync(path.join(outDir, 'labelled'), {recursive: true});
console.log(`wrote ${path.join(folder, 'out', 'sheet.png')}`);
