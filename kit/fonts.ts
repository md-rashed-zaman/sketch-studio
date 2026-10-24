import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadSpaceGrotesk} from '@remotion/google-fonts/SpaceGrotesk';

// Weights from tokens.json. loadFont also holds the render until each font has loaded.
const loaded = [
  loadSpaceGrotesk('normal', {weights: ['700'], subsets: ['latin']}),
  loadInter('normal', {weights: ['500', '600', '700'], subsets: ['latin']}),
  loadJetBrainsMono('normal', {weights: ['500'], subsets: ['latin']}),
  loadCaveat('normal', {weights: ['700'], subsets: ['latin']}),
];

export const fontsReady = Promise.all(loaded.map((f) => f.waitUntilDone()));

/** False until every font is loaded, so text can be measured (node widths depend on it). */
export const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading fonts for text measurement'));
  useEffect(() => {
    fontsReady.then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};
