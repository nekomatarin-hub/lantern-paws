// Lantern Paws — the program that hands the game in (best-game-01).
//
// The game itself is the static site under game/ (open game/index.html in a
// browser and it plays, offline). This program runs in the grader's Node 22
// container with the repository read-only at /bot and a writable /output:
// it copies game/ and screenshots/ across and writes dossier.json — the
// summary the judge reads — with buildDossier from the vendored make.fun
// library, which must stay byte-identical to the kit's copy or the gate
// rebuilds a different dossier and refuses the entry.
//
// Locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The run is deterministic: same repository in, same bytes out.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function requirePath(rel: string): void {
  if (!existsSync(join(repoDir, rel))) {
    throw new Error(`Lantern Paws: missing ${rel} — the entry is incomplete`);
  }
}

function countFiles(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) n += countFiles(p);
    else n += 1;
  }
  return n;
}

// The shape the sealed scorer enforces; failing here, loudly, beats
// shipping an entry the gate would refuse.
requirePath('game/index.html');
requirePath('vendor/makefun-game.ts');
requirePath('screenshots');
const shotCount = readdirSync(join(repoDir, 'screenshots')).length;
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`Lantern Paws: screenshots/ must hold 3 or 4 images, found ${shotCount}`);
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// Caps mirror reference/gate.json: at most 4 screenshots of 256 KiB, at
// most 993 game files and 48 MiB of game, paths under 1000 bytes; the
// dossier's own text is capped so the judge's outline stays in budget.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(
  `Lantern Paws: handed in ${countFiles(join(outDir, 'game'))} game files, `
  + `${shotCount} screenshots, dossier ${Buffer.byteLength(dossier)} bytes`,
);
