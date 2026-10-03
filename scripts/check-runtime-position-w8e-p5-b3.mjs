import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {deriveStructuralChange} from './lib/runtime-position-w8e-p5-b3.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(root,'content/civilization-atlas/reconfiguration');
const read=f=>JSON.parse(fs.readFileSync(path.join(base,f),'utf8').replace(/^\uFEFF/,''));
const hash=x=>createHash('sha256').update(x).digest('hex');
const b2Bytes=fs.readFileSync(path.join(base,'runtime-position-w8e-p5-b2-comparable-period-extraction-v1.json'));
const b2=JSON.parse(b2Bytes.toString().replace(/^\uFEFF/,''));
const data=read('runtime-position-w8e-p5-b3-structural-change-derivation-v1.json');
const manifest=read('runtime-position-w8e-p5-b1-primary-filing-manifest-v1.json');
assert.equal(data.predecessor.sha256,hash(b2Bytes));assert.equal(data.records.length,5);
assert.equal(new Set(data.records.map(r=>r.issuer)).size,5);
assert.equal(data.rule.authority,'PROVISIONAL_ANALYTICAL_SCREEN');
assert.equal(data.status,'STRUCTURAL_CHANGE_DERIVATION_COMPLETE_GOVERNED_ADMISSION_PENDING');
for(const r of data.records){
 const packet=b2.packets.find(p=>p.issuer===r.issuer);assert(packet);
 for(const f of packet.filings){const m=manifest.records.find(m=>m.sourceId===f.sourceId);assert(m);assert.equal(hash(fs.readFileSync(path.join(base,'p5-b1-filings',m.file))),f.sha256);}
 if(r.officialEvent){
  assert.equal(r.officialEvent.admissionState,'NOT_ADMITTED');
  const source=manifest.records.find(m=>m.sourceId===r.officialEvent.sourceId);assert(source&&source.issuer===r.issuer);
  const raw=fs.readFileSync(path.join(base,'p5-b1-filings',source.file));assert.equal(hash(raw),r.officialEvent.sourceSha256);
  const plain=raw.toString().replace(/<[^>]+>/g,' ').replace(/&#160;|&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  assert.equal(r.officialEvent.locators.length,3);
  for(const locator of r.officialEvent.locators)assert.equal(plain.indexOf(locator.searchAnchor),locator.normalizedTextOffset);
 }
 const derived=deriveStructuralChange(packet,{mixScreenPp:data.rule.mixScreenPp,officialEvent:r.officialEvent});assert.deepEqual(r,derived);
 assert.equal(r.knowledgeState,'HISTORICAL');assert.equal(r.scope,'SUBSYSTEM');
 for(const bridge of r.reportingBasisBridge)assert.equal(bridge.aggregateRevenueDifference,0,'Presentation changes cannot create growth');
 console.log('PASS B3 '+r.issuer+': '+r.disposition);
}
const candidates=data.records.filter(r=>r.candidate);
assert.deepEqual(candidates.map(r=>r.issuer),['MSFT','NVDA','JPM']);
assert.deepEqual(data.records.find(r=>r.issuer==='NVDA').candidate.types,['BUSINESS_MIX_MIGRATION','CARRIER_CONCENTRATION_SHIFT']);
assert.deepEqual(data.records.find(r=>r.issuer==='MSFT').candidate.types,['SEGMENT_RECLASSIFICATION']);
assert.deepEqual(data.records.find(r=>r.issuer==='JPM').candidate.types,['ISSUER_STRUCTURE_SHIFT']);
assert.equal(data.completed.structuralChangeCandidates,candidates.length);
assert.equal(data.completed.issuerReadouts,5);assert.equal(data.completed.officialReportingStructureEvents,2);
assert.equal(data.completed.revenueMixScreenCandidates,1);assert.equal(data.completed.observationsOnly,2);
for(const k of ['g14Candidates','dossierGlobalPromotions','runtimePositionCandidates'])assert.equal(data.completed[k],0);
// Behavioral guards: uniform growth, unverified events and incompatible series.
const nvda=structuredClone(b2.packets.find(p=>p.issuer==='NVDA'));
const first=nvda.selectedComparablePeriods[0];
nvda.selectedComparablePeriods=nvda.selectedComparablePeriods.map((o,i)=>({...o,denominatorValue:first.denominatorValue*(i+1),segments:first.segments.map(s=>({...s,revenue:s.revenue*(i+1)}))}));
assert.equal(deriveStructuralChange(nvda).candidate,null,'Uniform revenue growth must not create structural candidate');
assert.throws(()=>deriveStructuralChange(nvda,{officialEvent:{type:'ISSUER_STRUCTURE_SHIFT',verified:false}}),/Verified original-file/);
const broken=structuredClone(nvda);broken.selectedComparablePeriods[2].segments[0].name='Different partition';
assert.throws(()=>deriveStructuralChange(broken),/Segment basis mismatch/);
assert.throws(()=>deriveStructuralChange(nvda,{mixScreenPp:0}),/Invalid screen/);
const msft=b2.packets.find(p=>p.issuer==='MSFT');assert.equal(deriveStructuralChange(msft).candidate,null,'Recast gap alone must not auto-create official event');
console.log('PASS B3: lineage, mechanism anchors, metrics and replay verified; growth-only and incompatible-basis guards pass; G14=0; RP=0.');
