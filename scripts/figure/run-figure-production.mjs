import { spawnSync } from 'node:child_process';
import { requestedIds } from './figure-lib.mjs';
const node = process.execPath;
const run = (script, args = []) => { const r = spawnSync(node, [script, ...args], { stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status ?? 1); };
const ids = requestedIds();
run('scripts/figure/build-figure-production.mjs', ids.length === 57 ? ['--raster'] : ['--raster', '--id', ids[0]]);
for (const s of [
  'scripts/check-figure-identity.mjs','scripts/check-figure-source.mjs','scripts/check-figure-semantic.mjs','scripts/check-figure-authority.mjs','scripts/check-figure-vocabulary.mjs','scripts/check-figure-layout.mjs','scripts/check-figure-raster-backend.mjs','scripts/check-figure-geometry.mjs','scripts/check-figure-determinism.mjs','scripts/check-figure-staleness.mjs','scripts/check-figure-visual-production.mjs','scripts/check-figure-cross-consistency.mjs','scripts/check-figure-car-boundary.mjs'
]) run(s);
run('scripts/figure/record-figure-machine-acceptance.mjs', ids.length === 57 ? [] : ['--id', ids[0]]);
run('scripts/check-figure-machine-acceptance.mjs');
if (ids.length === 57) run('scripts/check-figure-production-freeze.mjs');
console.log(`✓ FIG production completed for ${ids.length === 57 ? 'FIG-001..057 (bilingual SVG + PNG)' : ids.join(', ')}`);
