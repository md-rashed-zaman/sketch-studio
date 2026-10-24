import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
// staticFile('sample/audio/voice.wav') resolves to episodes/sample/audio/voice.wav.
// shortcut: the CLI copies this whole folder (raw takes included) into each render bundle; move raw takes out if renders get slow to start.
Config.setPublicDir('episodes');
Config.setConcurrency(2);
