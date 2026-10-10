import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readJson,sha256File} from './lib/fcr/fcr-check-lib.mjs';
const acceptance=readJson('content/financial/calculation-runtime/acceptance/fcr-w0-w22-acceptance-v1.json');
for(const [gate,value] of Object.entries(acceptance.gates)) assert.equal(value,true,`FCR acceptance gate failed: ${gate}`);
const freeze=readJson('content/financial/calculation-runtime/authority/fcr-w0-w22-freeze-manifest-v1.json');
assert.equal(freeze.baselineCommit,'3e4f22c'); assert.equal(freeze.status,'FROZEN_V1'); assert.equal(freeze.phase,'FCR');
for(const item of freeze.artifacts){assert.equal(fs.existsSync(item.path),true,`Missing frozen FCR artifact: ${item.path}`); assert.equal(sha256File(item.path),item.sha256,`Frozen FCR drift: ${item.path}`);}
const pkg=readJson('package.json'); assert.ok(pkg.scripts['check:fcr']);
for(const command of ['check-fcr-authority.mjs','check-fcr-contracts.mjs','check-fcr-runtime.mjs','check-fcr-scenarios.mjs','check-fcr-determinism.mjs','check-fcr-fdr-boundary.mjs','check-fcr-freeze.mjs']) assert.match(pkg.scripts['check:fcr'],new RegExp(command.replaceAll('.','\\.')));
console.log('✓ FCR-W22 acceptance + freeze passed.');
console.log(`  ${freeze.artifacts.length} FCR v1 artifacts are digest-frozen; final gate is check:fcr.`);
