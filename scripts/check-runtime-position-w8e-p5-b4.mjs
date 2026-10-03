import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {assessCrossIssuerScope} from './runtime-position-w8e-p5-b4-scope.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(root,'content/civilization-atlas/reconfiguration');
const read=f=>{const bytes=fs.readFileSync(path.join(base,f));return {bytes,data:JSON.parse(bytes.toString().replace(/^\uFEFF/,''))};};
const b3=read('runtime-position-w8e-p5-b3-structural-change-derivation-v1.json');
const b2=read('runtime-position-w8e-p5-b2-comparable-period-extraction-v1.json');
const manifest=read('runtime-position-w8e-p5-b1-primary-filing-manifest-v1.json');
const out=read('runtime-position-w8e-p5-b4-cross-issuer-scope-v1.json').data;
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(out.predecessors.b3Sha256,hash(b3.bytes));assert.equal(out.predecessors.b2Sha256,hash(b2.bytes));assert.equal(out.predecessors.b1ManifestSha256,hash(manifest.bytes));
assert.equal(b3.data.predecessor.sha256,hash(b2.bytes));
for(const packet of b2.data.packets)for(const f of packet.filings){const s=manifest.data.records.find(s=>s.sourceId===f.sourceId);assert(s);assert.equal(hash(fs.readFileSync(path.join(base,'p5-b1-filings',s.file))),f.sha256);}
const replay=assessCrossIssuerScope(b3.data,b2.data,manifest.data);replay.predecessors=out.predecessors;assert.deepEqual(out,replay);
assert.deepEqual(out.candidates.map(c=>c.issuer),['MSFT','NVDA','JPM']);
assert.equal(out.pairAssessments.length,3);
assert.equal(out.cohort.coverageDenominator,null);assert.equal(out.cohort.economicCoverageRatio,null);assert.equal(out.cohort.coverageWeight,null);
for(const c of out.candidates){
 assert.equal(c.scope,'SUBSYSTEM');assert.equal(c.g14Pair,null);assert.equal(c.runtimePosition,null);
 assert.equal(c.nationalRepresentativeness,'NOT_ESTABLISHED');assert.equal(c.sectorRepresentativeness,'NOT_ESTABLISHED');
 assert.equal(c.crossIssuerCommonMechanism,'NOT_ESTABLISHED');assert.equal(c.admissionState,'W8A_W8B_W8C_W8D_PENDING');
 assert.equal(c.geographicalAttribution,'ISSUER_CONSOLIDATED_BUSINESS_NOT_US_DOMESTIC_ACTIVITY');
}
for(const p of out.pairAssessments){assert.equal(p.commonMechanism,'NOT_ESTABLISHED');assert.equal(p.scopePromotionPermitted,false);assert.equal(p.pooledRevenuePermitted,false);assert.equal(p.pooledHhiPermitted,false);assert.equal(p.synchronousPeriodEnds,false);}
for(const value of Object.values(out.guardContract))assert.equal(value,false);
for(const k of ['aggregateStructuralCandidates','nationalRepresentativeCandidates','g14Candidates','dossierGlobalPromotions','runtimePositionCandidates'])assert.equal(out.completed[k],0);
assert.equal(out.boundedSynthesis.aggregateCandidateCreated,false);assert.equal(out.boundedSynthesis.semanticPair,null);
// Adversarial boundaries: duplicated issuers, promoted inputs, and matching currencies.
const duplicate=structuredClone(b3.data);duplicate.records[0]=structuredClone(duplicate.records[1]);
assert.throws(()=>assessCrossIssuerScope(duplicate,b2.data,manifest.data),/issuer set/);
const promoted=structuredClone(b3.data);promoted.completed.dossierGlobalPromotions=1;
assert.throws(()=>assessCrossIssuerScope(promoted,b2.data,manifest.data));
const global=structuredClone(b3.data);global.records.find(r=>r.candidate).scope='DOSSIER_GLOBAL';
assert.throws(()=>assessCrossIssuerScope(global,b2.data,manifest.data));
const aligned=structuredClone(manifest.data);
for(const r of aligned.records)r.periodEnd=r.fiscalYear+'-12-31';
const alignedResult=assessCrossIssuerScope(b3.data,b2.data,aligned);
assert(alignedResult.pairAssessments.every(p=>p.synchronousPeriodEnds));
assert(alignedResult.pairAssessments.every(p=>p.pooledRevenuePermitted===false&&p.scopePromotionPermitted===false));
assert.equal(alignedResult.completed.nationalRepresentativeCandidates,0,'Synchronizing period ends alone must not establish representativeness');
console.log('PASS B4: 5 issuer checks, 3 candidate checks, 3 pair checks; lineage/replay verified; duplicate, scope-promotion and time-only inference guards pass; G14=0; RP=0.');
