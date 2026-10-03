import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {assertBaziReferenceCopyBinding} from '../functions/personal-reading/narrative/bazi-reference-copy-binding.js';
import {buildBaziCustomerPublication} from '../functions/personal-reading/bazi-customer-publication.js';
const root='content/reports/bazi/bcr',j=p=>JSON.parse(fs.readFileSync(p));
const ref=j('docs/guided-report-successor-r2/bazi-source.json');await assertBaziReferenceCopyBinding({reading:ref.reading,temporalContext:ref.temporalSnapshot});
await assert.rejects(()=>buildBaziCustomerPublication({reading:ref.reading,locale:'zh-Hans',temporalSnapshot:ref.temporalSnapshot,full:true}),/NOT_PRODUCTION_ADMITTED/);
await assert.rejects(()=>buildBaziCustomerPublication({reading:ref.reading,locale:'zh-Hans',temporalSnapshot:ref.temporalSnapshot,full:true,historicalReferenceReview:true,reportSubjectPresentation:{name:'Different person'}}),/NOT_PRODUCTION_ADMITTED/);
for(const variant of ['subject','time','structure']){const x=structuredClone(ref);if(variant==='subject')x.reading.evidence.sourceNatalProjectionId+='-different';if(variant==='time')x.temporalSnapshot.localDate='2026-10-04';if(variant==='structure')x.reading.professionalModules.tenGods.dayMaster.code='JIA';await assert.rejects(()=>assertBaziReferenceCopyBinding({reading:x.reading,temporalContext:x.temporalSnapshot}),/SUBJECT_OR_TIME_MISMATCH/);}
for(const [p,d]of Object.entries(j(root+'/reference-freeze.json').files))assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),d);
const registry=j(root+'/case-registry.json');assert.equal(registry.cases.length,8);assert.equal(new Set(registry.cases.map(c=>c.sourceCaseId)).size,8);
let claims=0;
for(const c of registry.cases){const input=j(root+'/'+c.caseId+'/input.json');assert.equal(await sha256Stable(input.input),input.inputDigest);assert.equal(c.humanDecision,null);
 for(const locale of ['zh-Hans','en']){const dir=root+'/'+c.caseId,e=j(dir+'/evidence-'+locale+'.json'),s=j(dir+'/synthesis-'+locale+'.json'),p=j(dir+'/authoring-'+locale+'.json');
  for(const [obj,key]of [[e,'evidenceDigest'],[s,'synthesisDigest'],[p,'packDigest']]){const x={...obj};delete x[key];assert.equal(await sha256Stable(x),obj[key]);}
  assert.equal(s.evidenceDigest,e.evidenceDigest);assert.equal(p.synthesisDigest,s.synthesisDigest);assert.equal(p.providerCalls,0);assert.equal(p.birthIdentityKnown,false);assert.equal(p.sections.length,10);assert.equal(p.quarantine.length,1);
  const lookup=Object.fromEntries(e.records.map(x=>[x.sourcePath,x.value]));
  for(const section of s.sections)for(const claim of section.claims){claims++;assert(claim.evidenceIds.length);assert.equal(claim.allowCausalLanguage,false);assert.equal(claim.allowObservedRealityClaim,false);for(const source of claim.sourceRefs){const base=Object.keys(lookup).find(b=>source===b||source.startsWith(b+'/'));assert(base,'Missing evidence '+source);const value=source.slice(base.length).split('/').filter(Boolean).reduce((v,k)=>v?.[k],lookup[base]);assert.notEqual(value,undefined,'Unresolved '+source);}}
 }
}
const unknown=j(root+'/BCR-GEN-08/input.json');assert.equal(unknown.spec.includeHour,false);assert.equal(unknown.input.canonicalProjection.calculation.status,'PARTIAL');
console.log('PASS: frozen reference, 3 negative binding checks, 8 distinct cases, 16 digest-linked packs, '+claims+' source-resolved claims, explicit quarantine, zero providers.');
