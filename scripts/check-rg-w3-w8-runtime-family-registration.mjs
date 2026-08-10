import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(); const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8')); const digest=async p=>crypto.createHash('sha256').update((await fs.readFile(path.join(root,p),'utf8')).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'),'utf8').digest('hex');
const pkg=await read('package.json'); const prior=await read('content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v2.json'); const reg=await read('content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v3.json'); const runner=pkg.scripts['check:runtime']; assert.ok(['node scripts/run-runtime-checker-v2.mjs','node scripts/run-runtime-checker-v3.mjs'].includes(runner)); if(runner.endsWith('v3.mjs')){const successor=await read('content/governance/runtime-checker-governance/registries/checker-successor-deprecation-registry-v1.json');assert.equal(successor.implementations.find(x=>x.implementation==='scripts/run-runtime-checker-v3.mjs')?.status,'active');}
assert.equal(reg.predecessorMutated,false); assert.equal(reg.entries.length,prior.entries.length+66); assert.deepEqual(reg.registeredFamilies,['HDR','AST','BZR','NUM','CAR','KAU']);
const keys=new Set(); for(const e of reg.entries){const key=`${e.runtimeCode}:${e.workCode}`;assert.equal(keys.has(key),false,`duplicate ${key}`);keys.add(key);assert.equal(await digest(e.implementationFile),e.implementationDigest,`${key} digest`);const alias=e.npmAlias; if(alias) assert.equal(pkg.scripts[alias],`node ${e.implementationFile}`,`${key} package alias`);}
for(const runtime of reg.registeredFamilies) assert.ok(reg.entries.some(x=>x.runtimeCode===runtime),`${runtime} not registered`);
const bzr=reg.entries.find(x=>x.workCode==='BZR-W2A'); assert.equal(bzr.implementationFile,'scripts/check-bzr-w2-four-pillars-runtime.mjs');
for(const code of ['CAR-W10','CAR-W11','CAR-W12','CAR-W13','CAR-W14']) assert.equal(reg.entries.find(x=>x.workCode===code).implementationFile,'scripts/check-car-w10-w14-candidate-to-publication.mjs');
for(const code of ['KAU-W0','KAU-W1','KAU-W2','KAU-W3','KAU-W4','KAU-W5','KAU-W6','KAU-W7','KAU-W8']) assert.equal(reg.entries.find(x=>x.workCode===code).implementationFile,'scripts/check-kau-w0-w8-authoring-foundation.mjs');
const freeze=await read('content/governance/runtime-checker-governance/freeze/rg-w3-w8-runtime-family-registration-freeze-v1.json'); assert.equal(freeze.predecessorMutated,false); assert.equal(freeze.existingCheckerImplementationsMutated,false); assert.equal(freeze.runtimeFreezesMutated,false);
console.log('✓ RG-W3～W8 Runtime Family Registration passed.');
console.log('✓ 66 Work Codes across HDR, AST, BZR, NUM, CAR and KAU resolve uniquely with verified package aliases and implementation digests.');
