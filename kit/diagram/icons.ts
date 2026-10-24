// The Lucide glyphs named in tokens.json icon.map, as raw shape data so each stroke can sketch in.
// shortcut: imports lucide-react's per-icon `__iconData` (pinned exact version); a test checks every mapped icon resolves.
import {__iconData as bot} from 'lucide-react/dist/esm/icons/bot.mjs';
import {__iconData as cloud} from 'lucide-react/dist/esm/icons/cloud.mjs';
import {__iconData as container} from 'lucide-react/dist/esm/icons/container.mjs';
import {__iconData as cpu} from 'lucide-react/dist/esm/icons/cpu.mjs';
import {__iconData as database} from 'lucide-react/dist/esm/icons/database.mjs';
import {__iconData as fileText} from 'lucide-react/dist/esm/icons/file-text.mjs';
import {__iconData as gauge} from 'lucide-react/dist/esm/icons/gauge.mjs';
import {__iconData as globe} from 'lucide-react/dist/esm/icons/globe.mjs';
import {__iconData as hardDrive} from 'lucide-react/dist/esm/icons/hard-drive.mjs';
import {__iconData as keyRound} from 'lucide-react/dist/esm/icons/key-round.mjs';
import {__iconData as layers} from 'lucide-react/dist/esm/icons/layers.mjs';
import {__iconData as mail} from 'lucide-react/dist/esm/icons/mail.mjs';
import {__iconData as monitorSmartphone} from 'lucide-react/dist/esm/icons/monitor-smartphone.mjs';
import {__iconData as rows3} from 'lucide-react/dist/esm/icons/rows-3.mjs';
import {__iconData as search} from 'lucide-react/dist/esm/icons/search.mjs';
import {__iconData as server} from 'lucide-react/dist/esm/icons/server.mjs';
import {__iconData as shieldCheck} from 'lucide-react/dist/esm/icons/shield-check.mjs';
import {__iconData as split} from 'lucide-react/dist/esm/icons/split.mjs';
import {__iconData as timer} from 'lucide-react/dist/esm/icons/timer.mjs';
import {__iconData as user} from 'lucide-react/dist/esm/icons/user.mjs';
import {__iconData as users} from 'lucide-react/dist/esm/icons/users.mjs';
import {tokens} from '../theme';
import type {NodeForm} from './geometry';

export type IconShape = [tag: string, attrs: Record<string, string | number>];
type IconData = {name: string; node: IconShape[]};

const glyphs: Record<string, IconData> = {
  bot,
  cloud,
  container,
  cpu,
  database,
  'file-text': fileText,
  gauge,
  globe,
  'hard-drive': hardDrive,
  'key-round': keyRound,
  layers,
  mail,
  'monitor-smartphone': monitorSmartphone,
  'rows-3': rows3,
  search,
  server,
  'shield-check': shieldCheck,
  split,
  timer,
  user,
  users,
};

/** Our component keys (tokens.json icon.map), e.g. 'cache', 'database', 'loadBalancer'. */
export type IconKind = keyof typeof tokens.icon.map;

export const iconShapes = (kind: IconKind): IconShape[] => {
  const name = tokens.icon.map[kind];
  const glyph = glyphs[name];
  if (!glyph) throw new Error(`No Lucide glyph "${name}" for icon kind "${kind}"`);
  return glyph.node;
};

/** Actors and data stores stand free (icon over label); services are boxed. */
export const isFreeStanding = (kind: IconKind) => (tokens.icon.freeStanding as string[]).includes(kind);

/** Which drawing a node gets: no kind is a plain box; Shorts stack a service's icon over its label. */
export const nodeForm = (kind: IconKind | undefined, layout: '16:9' | '9:16'): NodeForm =>
  !kind ? 'plain' : isFreeStanding(kind) ? 'free' : layout === '9:16' ? 'stacked' : 'boxed';
