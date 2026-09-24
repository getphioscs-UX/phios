import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {composeBaziT3Section} from '../functions/personal-reading/narrative/bazi-t3-composition.js';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {buildBaZiNarrativeClaimIR} from '../functions/personal-reading/narrative/bazi-explanatory-authority.js';
import {loadAcceptedBaziSnapshots} from './lib/bazi-accepted-snapshot-loader.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),root='docs/acceptance/bazi-paid-report',source=read('docs/guided-report-successor-r2/bazi-source.json'),fixtures=read('functions/personal-reading/narrative/bazi-t3-preview-packs.generated.json'),acceptance=read('config/reports/bazi-editorial-quality-acceptance.json');
const deployed=read('functions/personal-reading/narrative/bazi-t3-preview-baseline.generated.json');
assert.deepEqual(deployed.profileIds,['BASELINE_NOW']);assert(Object.keys(deployed.packs).every(k=>k.startsWith('BASELINE_NOW:')));
for(const [key,pack] of Object.entries(deployed.packs))assert.deepEqual(pack,fixtures.packs[key]);
assert(!fs.readFileSync('functions/api/qa-bazi-t3.js','utf8').includes("import fixtures from '../personal-reading/narrative/bazi-t3-preview-packs.generated.json'"),'offline matrix must not inflate deployed Worker');
const acceptedLoader=await loadAcceptedBaziSnapshots();
assert.equal(acceptedLoader.records.length,2,'only the owner-accepted S02 bilingual pair is canonical at this checkpoint');
for(const locale of ['en','zh-Hans'])assert.equal(acceptedLoader.snapshots[locale].S02_PERSONALITY.snapshotDigest,read(root+'/snapshots/accepted-s02-'+locale+'.json').snapshotDigest);
for(const r of read(root+'/baseline/protected-files.json').files.filter(r=>!r.path.startsWith('.tmp/')||fs.existsSync(r.path)))assert.equal(createHash('sha256').update(fs.readFileSync(r.path)).digest('hex'),r.sha256,r.path);
for(const locale of ['en','zh-Hans']){
 const snapshot=read(root+'/snapshots/accepted-s02-'+locale+'.json'),pack=fixtures.packs[`BASELINE_NOW:${locale}:S02_PERSONALITY`];
 assert.equal((await composeBaziT3Section({pack,snapshot})).status,'PASS','Accepted S02 must still resolve');
 for(const change of [{locale:locale==='en'?'zh-Hans':'en'},{sectionKey:'S03_LIFE_STRUCTURE'},{canonicalEvidenceHash:'0'.repeat(64)},{compositionVersion:'OLD'},{snapshotDigest:'0'.repeat(64)}])assert.equal((await composeBaziT3Section({pack,snapshot:{...snapshot,...change}})).status,'FALLBACK');
 const projection=await projectBaziSectionPublication({reading:source.reading,locale,temporalContext:source.temporalSnapshot,composition:{t3:{stage:'QA',environment:'qa',acceptance,snapshots:{S02_PERSONALITY:snapshot}}}});
 assert.equal(projection.internalSections.find(s=>s.sectionKey==='S02_PERSONALITY').diagnostics.sectionRuntimeTier,'T3');
 assert.equal(projection.internalSections.find(s=>s.sectionKey==='S03_LIFE_STRUCTURE').diagnostics.fallbackReason,'ACCEPTED_SNAPSHOT_REQUIRED');
 assert(!JSON.stringify(projection.pages).includes('claimIrVersion'));
 const ir=await buildBaZiNarrativeClaimIR({reading:source.reading,sectionKey:'S03_LIFE_STRUCTURE',locale,temporalSnapshot:source.temporalSnapshot});
 const topic=source.reading.professionalModules.professionalTopics.topics.find(t=>t.topicCode==='LIFE_OPERATION');
 assert.equal(ir.claims.filter(c=>c.id.includes(':PAIR_')).length,topic.relationshipInterfaces.length);assert.equal(ir.depth.relations.length,4);
 for(const c of ir.claims){assert(c.basis.length);assert(c.license&&!c.license.createsMethodRule);for(const b of c.basis)assert.deepEqual(b.value,b.ref.split('/').reduce((x,k)=>x?.[k],source.reading));}
 const changed=structuredClone(source.reading);changed.professionalModules.professionalTopics.topics.find(t=>t.topicCode==='LIFE_OPERATION').relationshipInterfaces.pop();const other=await buildBaZiNarrativeClaimIR({reading:changed,sectionKey:'S03_LIFE_STRUCTURE',locale,temporalSnapshot:source.temporalSnapshot});assert.equal(other.depth.relations.length,3);
}
for(const p of Object.values(fixtures.packs).filter(p=>p.sectionKey==='S03_LIFE_STRUCTURE'))assert.equal(p.semanticDepth.relations.length,p.licensedClaims.filter(c=>c.id.includes(':PAIR_')).length);
const cleanup=read(root+'/snapshots/cleanup-manifest.json');assert(cleanup.records.every(r=>!fs.existsSync(r.path)));
console.log('PASS paid T3 engineering: accepted S02 preserved and rendered; locale/section/version/evidence/digest misses rejected; S03 complete relation retention across available profiles; honest internal fallback; local cleanup. Full T3 production remains OFF.');
