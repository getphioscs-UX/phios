import assert from 'node:assert/strict'; import fs from 'node:fs';
import {readJson,sha256File} from './lib/pfr/pfr-check-lib.mjs';
const a=readJson('content/financial/professional-review/acceptance/pfr-w0-w24-acceptance-v1.json'); for(const [k,v] of Object.entries(a.gates)) assert.equal(v,true,`PFR acceptance gate failed: ${k}`);
const f=readJson('content/financial/professional-review/freeze/pfr-w0-w24-freeze-manifest-v1.json'); assert.equal(f.baselineCommit,'ec0f8d4b9ba37599affda909a47d1e41a1033037'); assert.equal(f.status,'FROZEN_CANONICAL_PFR_V1'); assert.equal(f.phase,'PFR');
for(const item of f.artifacts){ assert.ok(fs.existsSync(item.path),`Missing frozen PFR artifact: ${item.path}`); assert.equal(sha256File(item.path),item.sha256,`Frozen PFR drift: ${item.path}`); }
for(const item of f.preservedUpstreamArtifacts){ assert.ok(fs.existsSync(item.path),`Missing preserved upstream: ${item.path}`); assert.equal(sha256File(item.path),item.sha256,`PFR changed upstream authority: ${item.path}`); }
const pkg=readJson('package.json'); assert.ok(pkg.scripts['check:pfr']); for(const n of ['check-pfr-authority.mjs','check-pfr-contracts.mjs','check-pfr-runtime.mjs','check-pfr-lineage.mjs','check-pfr-ai-boundary.mjs','check-pfr-fixtures.mjs','check-pfr-cross-authority.mjs','check-pfr-freeze.mjs']) assert.match(pkg.scripts['check:pfr'],new RegExp(n.replaceAll('.','\\.')));
console.log('✓ PFR-W24 acceptance + freeze passed.'); console.log(`  ${f.artifacts.length} PFR v1 artifacts are digest-frozen; final gate is check:pfr.`);
