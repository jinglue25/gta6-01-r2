import { cpSync, existsSync, mkdirSync, writeFileSync, lstatSync, readdirSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Package the self-contained coastal sandbox without a compiler or dependencies.
const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const game = join(root, 'game');
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
const inside = relative(game, output);
if (output === resolve(root) || (!inside.startsWith('..') && !isAbsolute(inside))) {
  throw new Error('The output directory must be outside the source game and repository root.');
}
let count = 0;
let bytes = 0;
function inspect(directory: string, prefix = '') {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const local = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) throw new Error(`Unsupported game entry: ${local}`);
    if (++count > caps.game_max_files) throw new Error('Game entry count exceeds 993.');
    if (Buffer.byteLength(local) > caps.game_path_max_bytes) throw new Error(`Game path too long: ${local}`);
    if (stat.isDirectory()) inspect(path, local);
    else { bytes += stat.size; if (bytes > caps.game_max_bytes) throw new Error('Game exceeds 48 MiB.'); }
  }
}
inspect(game);
if (lstatSync(join(game, 'index.html')).size > 1048576) throw new Error('index.html exceeds 1 MiB.');
mkdirSync(output, { recursive: true });
cpSync(game, join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) cpSync(join(root, 'screenshots'), join(output, 'screenshots'), { recursive: true });
writeFileSync(join(output, 'dossier.json'), buildDossier(output, caps));
function filesIn(directory: string): number {
  return readdirSync(directory).reduce((total, name) => {
    const path = join(directory, name);
    return total + (lstatSync(path).isDirectory() ? filesIn(path) : Number(lstatSync(path).isFile()));
  }, 0);
}
console.log(`Copied ${filesIn(join(output, 'game'))} game files and ${filesIn(join(output, 'screenshots'))} screenshots; dossier.json: ${lstatSync(join(output, 'dossier.json')).size} bytes.`);
console.log(`Port Solana packaged: ${count} game entries, ${bytes} bytes. Dossier: ${join(output, 'dossier.json')}`);
