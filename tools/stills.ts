// Scratch helper: bundle once, render several stills. usage: npm run stills -- <outDir> <comp>:<frame> ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [outDir, ...jobs] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'episodes'), symlinkPublicDir: true});
for (const job of jobs) {
  const [id, f] = job.split(':');
  const composition = await selectComposition({serveUrl, id});
  try {
    await renderStill({composition, serveUrl, frame: Number(f), scale: 0.5, output: path.join(outDir, `${id}-${String(f).padStart(5, '0')}.png`), timeoutInMilliseconds: 180000});
    console.log('ok', job);
  } catch (e) {
    console.log('FAIL', job, String((e as Error).message).split('\n')[0]);
  }
}
