import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import Ajv from 'ajv';
import {assertPublicationIrV2Preservation} from '../functions/personal-reading/narrative/report-publication-ir-v2.js';
import {assertZiweiClaimBinding} from '../functions/personal-reading/narrative/ziwei-publication-adapter.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='content/reports/ziwei',m=read(root+'/representative-review-manifest.json'),canon=read(root+'/semantic-canon.json'),registry=read(root+'/section-registry.json');
const validate=new Ajv({strict:false}).compile(read(root+'/publication-ir-schema.json'));
assert.equal(m.outputCount,12);assert.equal(m.outputs.length,12);assert.equal(m.fullReport,'READY_FOR_HUMAN_REVIEW');assert.equal(m.productionAdmissionGranted,false);assert.equal(m.humanDecision,'ACCEPT');
const acceptance=read('docs/reports/ziwei/semantic-production/HUMAN-ACCEPTANCE.json');assert.equal(acceptance.decision,'ACCEPT');
for(const row of acceptance.outputs)assert.equal(createHash('sha256').update(fs.readFileSync(row.path)).digest('hex'),row.sha256);
assert.equal(canon.stars.length,28);assert.equal(canon.palaces.length,12);assert.equal(registry.sections.length,12);assert(canon.historicalAtomicEightStarOwnerUnchanged);
assert.deepEqual(canon.timingLayers.map(t=>t.id.split(':').at(-1)),['NATAL','DA_XIAN','LIU_NIAN']);
assert(canon.relationshipOperators.every(o=>o.topologyAloneSufficient===false));
for(const [file,digest] of Object.entries(m.authorityDigests))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),digest,'authority drift: '+file);
const records=m.outputs.map(o=>({...o,record:read(o.path),evidence:read(o.evidencePath)}));
const forbidden=prose=>/will become rich|will definitely marry|you have (?:cancer|diabetes)|必然发财|一定结婚|你患有/.test(prose);
for(const {record:r,evidence:e} of records){
 assert(['S02','S04','S05'].includes(r.sectionId));assert.equal(r.subjectId,e.subjectId);
 assert.equal(e.executionReuse.secondNatalCalculationPerformed,false);
 assert.equal(r.publicationIr.schemaVersion,'PHI-OS-PUBLICATION-IR-V2-v1.0.0');
 assert(assertPublicationIrV2Preservation({publicationIr:r.publicationIr,brief:r.brief}).accepted);
 assert.equal(r.paragraphs.length,5);assert.equal(new Set(r.paragraphs).size,5);
 assert(!forbidden(r.paragraphs.join(' ')));
 const section=registry.sections.find(s=>s.sectionId===r.sectionId);
 const body=e.palaces.find(p=>p.isBodyPalace).palaceCode;
 assert.deepEqual(r.claims[0].structure.primaryPalaces,[...new Set(section.primaryPalaces.map(c=>c==='BODY'?body:c))]);
 for(const c of r.claims){
  assert(validate(c),JSON.stringify(validate.errors));assertZiweiClaimBinding(c,e);
  for(const ref of c.sourceRefs.filter(x=>!x.startsWith('input:')&&!x.startsWith('runtime:')))assert(fs.existsSync(ref.split('#')[0]),'missing source '+ref);
  assert(c.conditions.length&&c.counterweights.length&&c.observableExpressions.length&&c.navigationImplications.length);
 }
 const bad=mutate=>{const c=structuredClone(r.claims[0]);mutate(c);assert.throws(()=>assertZiweiClaimBinding(c,e));};
 bad(c=>c.subjectId='WRONG_SUBJECT');bad(c=>c.structure.palaces.push('UNKNOWN_PALACE'));bad(c=>c.structure.placements.push('UNBOUND_STAR'));bad(c=>c.structure.timingLayers.push('LIU_YUE'));bad(c=>c.unknowns=[]);bad(c=>c.prohibitedExtensions=[]);
 const brokenIr=structuredClone(r.publicationIr);brokenIr.blocks[0].claimRefs=['MISSING_CLAIM'];assert.equal(assertPublicationIrV2Preservation({publicationIr:brokenIr,brief:r.brief}).accepted,false);
}
const textMask=text=>{
 let s=text.toLowerCase();for(const entity of [...canon.stars,...canon.palaces])for(const label of [entity.canonicalZh,entity.canonicalEn])s=s.replaceAll(label.toLowerCase(),' ');
 return s.replace(/subject[_ ]?[ab]|\d+/g,' ').replace(/\s+/g,' ').trim();
};
const grams=text=>{const a=textMask(text).split(/\s+/);return new Set(a.slice(0,-2).map((_,i)=>a.slice(i,i+3).join(' ')));};
const differences=[];
for(const sectionId of ['S02','S04','S05']){
 for(const subjectId of ['SUBJECT_A','SUBJECT_B']){
  const a=records.find(x=>x.subjectId===subjectId&&x.sectionId===sectionId&&x.locale==='zh-Hans').record,b=records.find(x=>x.subjectId===subjectId&&x.sectionId===sectionId&&x.locale==='en').record;
  assert.deepEqual(a.claims.map(c=>c.claimId),b.claims.map(c=>c.claimId),'locale claim ID drift');
  assert.deepEqual(a.claims.map(c=>c.structure),b.claims.map(c=>c.structure),'locale placement drift');
  assert.deepEqual(a.claims.map(c=>c.unknowns),b.claims.map(c=>c.unknowns),'locale unknown drift');
 }
 const a=records.find(x=>x.subjectId==='SUBJECT_A'&&x.sectionId===sectionId&&x.locale==='en').record,b=records.find(x=>x.subjectId==='SUBJECT_B'&&x.sectionId===sectionId&&x.locale==='en').record;
 assert.notDeepEqual(a.selectedComposition,b.selectedComposition);
 assert.notDeepEqual(a.claims[0].meaning,b.claims[0].meaning,'meaning must differ, not only identities');
 assert.notDeepEqual(a.claims.find(c=>c.claimType==='NAVIGATION_IMPLICATION').meaning,b.claims.find(c=>c.claimType==='NAVIGATION_IMPLICATION').meaning);
 assert(a.paragraphs.every(p=>!b.paragraphs.includes(p)),'duplicate prose across subjects');
 const ag=grams(a.paragraphs.join(' ')),bg=grams(b.paragraphs.join(' ')),overlap=[...ag].filter(x=>bg.has(x)).length/new Set([...ag,...bg]).size;
 assert(overlap<0.75,'names-masked reports too similar');differences.push({sectionId,namesMaskedTrigramJaccard:overlap,primaryA:a.selectedComposition.primary,primaryB:b.selectedComposition.primary});
}
assert(forbidden('You will become rich'));assert(forbidden('你患有糖尿病'));
fs.writeFileSync('docs/reports/ziwei/semantic-production/qa-results.json',JSON.stringify({status:'PASS',outputs:12,claims:records.reduce((n,r)=>n+r.record.claims.length,0),localeClaimParity:'PASS',sourceAuthorityClosure:'PASS',unknownPreservation:'PASS',bindingNegativeTests:'PASS',differences,humanDecision:m.humanDecision},null,2)+'\n');
console.log('PASS: 12 prototypes / 84 claims; shared IR preservation, authority/source closure, bilingual IDs, evidence ownership, unavailable-scope retention, negative binding tests and names-masked differentiation.');
