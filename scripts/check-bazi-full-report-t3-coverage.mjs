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
assert.equal(acceptedLoader.records.length,0,'owner superseded the previous S02 acceptance');
assert.equal(acceptedLoader.historicalRecords.length,2,'the old bilingual snapshots remain immutable historical evidence');
const releaseAcceptance=read('docs/guided-report-successor-r2/bazi-t3/acceptance.json');
assert.equal(releaseAcceptance.explanatoryAuthorityVersion,'BAZI_EXPLANATORY_AUTHORITY_V2');
assert.equal(releaseAcceptance.BAZI_PRODUCTION_SUCCESSOR_ACTIVE,false);
assert.equal((releaseAcceptance.humanReviews||[]).filter(r=>r.decision==='ACCEPT').length,0);
for(const r of read(root+'/baseline/protected-files.json').files.filter(r=>!r.path.startsWith('.tmp/')||fs.existsSync(r.path)))assert.equal(createHash('sha256').update(fs.readFileSync(r.path)).digest('hex'),r.sha256,r.path);
for(const locale of ['en','zh-Hans']){
 const oldSnapshot=read(root+'/snapshots/accepted-s02-'+locale+'.json'),pack=fixtures.packs[`BASELINE_NOW:${locale}:S02_PERSONALITY`];
 assert.equal(pack.explanatoryAuthorityVersion,'BAZI_EXPLANATORY_AUTHORITY_V2');
 assert.equal(pack.schemaVersion,'BAZI_SECTION_EVIDENCE_PACK_V4');
 assert.equal((await composeBaziT3Section({pack,snapshot:oldSnapshot})).status,'FALLBACK','superseded V1 snapshot must fail closed under V2');
 const projection=await projectBaziSectionPublication({reading:source.reading,locale,temporalContext:source.temporalSnapshot,composition:{t3:{stage:'QA',environment:'qa',acceptance,snapshots:{}}}});
 assert.equal(projection.internalSections.find(s=>s.sectionKey==='S02_PERSONALITY').diagnostics.fallbackReason,'ACCEPTED_SNAPSHOT_REQUIRED');
 assert.equal(projection.internalSections.find(s=>s.sectionKey==='S03_LIFE_STRUCTURE').diagnostics.fallbackReason,'ACCEPTED_SNAPSHOT_REQUIRED');
 assert(!JSON.stringify(projection.pages).includes('claimIrVersion'));
 const ir=await buildBaZiNarrativeClaimIR({reading:source.reading,sectionKey:'S02_PERSONALITY',locale,temporalSnapshot:source.temporalSnapshot});
 const topic=source.reading.professionalModules.professionalTopics.topics.find(t=>t.topicCode==='CAPABILITY');
 assert.equal(ir.claims.filter(c=>c.id.includes(':PAIR_')).length,topic.relationshipInterfaces.length);
 assert.equal(ir.depth.relations.length,topic.relationshipInterfaces.length);
 assert.equal(ir.depth.version,'BAZI_RICH_CLAIM_IR_V2');
 assert(ir.claims.some(c=>c.relationType==='LIFE_DOMAIN_EXPLANATION'));
 assert(ir.claims.some(c=>c.relationType==='OPERATING_CONDITION'));
 for(const c of ir.claims){assert(c.basis.length);assert(c.license&&!c.license.createsMethodRule);for(const b of c.basis)assert.deepEqual(b.value,b.ref.split('/').reduce((x,k)=>x?.[k],source.reading));}
}
for(const p of Object.values(fixtures.packs).filter(p=>p.sectionKey==='S03_LIFE_STRUCTURE'))assert.equal(p.semanticDepth.relations.length,p.licensedClaims.filter(c=>c.id.includes(':PAIR_')).length);
const cleanup=read(root+'/snapshots/cleanup-manifest.json');assert(cleanup.records.every(r=>!fs.existsSync(r.path)));
console.log('PASS paid T3 V2 engineering: previous S02 acceptance is superseded but preserved historically; V2 life-layer claims and complete relation retention are active; old snapshots fail closed; Production remains OFF.');
