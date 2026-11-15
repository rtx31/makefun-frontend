// Entry program (Node 22, standard library only) for makefun-frontend-01.
// The frontend is the plain static files in app/ beside this file: ES
// modules plus one stylesheet, no build step, reading make.fun's public
// API at https://make.fun/api. This program copies app/ and screenshots/
// to /output and writes /output/dossier.json, the summary the judge reads
// (screenshots, first-load files and bytes, and the source), using the
// vendored make.fun library. Leave vendor/makefun-frontend.ts untouched:
// the scorer requires dossier.json to be byte for byte what its own
// copy of the library writes.
//
// Run it locally with: node serve.ts, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse (more than 3 screenshots or
// one over 256 KiB; more than 993 files and directories in app/ or
// 16 MiB of app files; /output as a whole under 1000 entries / 64 MiB).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
