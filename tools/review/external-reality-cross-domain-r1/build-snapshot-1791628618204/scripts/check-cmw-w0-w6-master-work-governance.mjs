import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8')); const b='content/governance/canonical-master-work';
const plane=await readJson(`${b}/registries/canonical-runtime-plane-registry-v1.json`); const dep=await readJson(`${b}/registries/canonical-runtime-dependency-registry-v1.json`); const mig=await readJson(`${b}/registries/canonical-master-work-migration-registry-v1.json`); const mw=await readJson(`${b}/registries/canonical-master-work-registry-v1.json`);
const planeCodes=new Set(plane.assignments.map(x=>x.code)); const workCodes=new Set(); for(const w of mw.entries){assert.equal(workCodes.has(w.workCode),false,`duplicate ${w.workCode}`); workCodes.add(w.workCode); assert.ok(['GOVERNANCE','RUNTIME','PRESENTATION'].includes(w.plane));}
for(const e of dep.entries){assert.equal(planeCodes.has(e.runtimeCode),true,`dependency runtime plane ${e.runtimeCode}`)}
for(const e of mig.entries){assert.ok(['PRESERVED','UPGRADED','MOVED','SUPERSEDED','NEW'].includes(e.migrationStatus)); if(!e.canonicalWorkCode.includes('BOOK-COMPLETION')&&!e.canonicalWorkCode.includes('-W')===false){} }
assert.equal(mig.entries.find(x=>x.legacyWorkCode==='PSR-W0-W8').canonicalRuntime,'CPR'); assert.equal(mig.entries.find(x=>x.legacyWorkCode==='KAU-W15-PROPOSED').canonicalRuntime,'KPP');
const rg=await readJson(`${b}/contracts/canonical-master-work-rg-integration-v1.json`); assert.equal(rg.existingRgFoundationMustRemainUnchanged,true);
console.log('✓ CMW-W0-W6 canonical master work registries and integrity passed.');
