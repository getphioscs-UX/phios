import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {buildHistoricalReadouts} from './build-runtime-position-w8d-historical-rre.mjs';
import {consumeHistoricalRre} from './lib/civilization-atlas/runtime-position-w8d-historical-rre-adapter-v1.mjs';
import {assertCanonicalReadoutDigest} from './lib/reality-readout-engine/rre-canonical-readout-v1.mjs';
import {assertReadoutInputDigest,stableDigest} from './lib/reality-readout-engine/rre-readout-foundation-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=spawnSync(process.execPath,[path.join(root,'scripts/check-runtime-position-w8e-p5-w8ad-historical.mjs')],{encoding:'utf8'});assert.equal(run.status,0,run.stdout+run.stderr);
const bundle=buildHistoricalReadouts(root),out=bundle.output;
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'content/civilization-atlas/reconfiguration/runtime-position-w8d-historical-rre-consumption-v1.json'))),out);
const evidenceMap=new Map(bundle.admission.w8cHistorical.evidence.map(e=>[e.claimId,e]));
for(const r of out.records){
 assertReadoutInputDigest(r.input);assertCanonicalReadoutDigest(r.readout);
 assert.equal(r.readout.realityReference.digest,stableDigest(r.realityViewBasis));
 assert.equal(r.observedAt,r.periods.at(-1).periodEnd+'T23:59:59.000Z');assert.notEqual(r.observedAt,r.assessmentTime);
 assert.equal(r.readout.persistenceDecision,'DENY');assert.equal(r.readout.persistentStoreWriteAllowed,false);assert.equal(r.readout.storageExecutionPerformed,false);
 assert.equal(r.readout.confidence.dimensions.recency,'STALE');assert.equal(r.readout.confidence.confidenceClass,'LIMITED');
 assert.equal(r.readout.stability.stabilityState,'UNKNOWN');assert.equal(r.readout.load.concentration.state,'UNKNOWN');assert.equal(r.readout.recovery.availableRecoveryCapacity.state,'UNKNOWN');assert.equal(r.readout.drift.driftState,'NO_PREVIOUS_REALITY');assert.equal(r.readout.metricCreated,false);
 const obs=[...r.components.observationSummary.observableStates,...r.components.observationSummary.observableTransitions];
 for(const o of obs){assert(r.input.observationReferences.includes(o.observableCode));assert(o.supportReferences.every(ref=>r.input.evidenceReferences.includes(ref)&&evidenceMap.has(ref)));}
 assert.equal(r.readout.observationSummary.supportedCount,obs.length);
 assert.equal(r.components.observationSummary.observableTransitions.length,['MSFT','JPM'].includes(r.issuer)?1:0);
 for(const fragment of r.readout.lineage.conclusionFragments)assert(fragment.evidenceReferences.every(ref=>evidenceMap.has(ref)));
 assert.equal(r.readout.unknowns.length,4);assert(r.readout.unknowns.every(u=>u.currentResolutionState==='CURRENTLY_BLOCKED_BY_MISSING_EVIDENCE'));
 const bad=structuredClone(r.readout);bad.confidence.confidenceClass='HIGH';assert.throws(()=>assertCanonicalReadoutDigest(bad));
}
for(const [name,change] of [
 ['current evidence',a=>a.w8cHistorical.evidence[0].knowledgeState='CURRENT'],
 ['global scope',a=>a.w8dHistorical.consumption[0].scope='DOSSIER_GLOBAL'],
 ['source digest',a=>a.w8cHistorical.evidence[0].sourceLineage.sourceVersionOrDigest='0'.repeat(64)],
 ['orphan',a=>a.w8dHistorical.consumption[0].evidenceReferences.push('ORPHAN')],
 ['cross issuer',a=>a.w8dHistorical.consumption[0].evidenceReferences.push(a.w8dHistorical.consumption[1].evidenceReferences[0])],
 ['duplicate',a=>a.w8cHistorical.evidence.push(structuredClone(a.w8cHistorical.evidence[0]))],
 ['missing period',a=>a.w8dHistorical.consumption[0].periodEnds=[]],
 ['fake G14',a=>a.w8dHistorical.consumption[0].g14Pair='G14-P2']
 ]){const a=structuredClone(bundle.admission);change(a);assert.throws(()=>consumeHistoricalRre({...bundle,admission:a}),name+' must reject');}
const provenance=JSON.parse(fs.readFileSync(path.join(root,'content/civilization-atlas/reconfiguration/runtime-position-w8d-historical-rre-provenance-v1.json')));
for(const p of provenance.dependencies){const bytes=fs.readFileSync(path.join(root,p.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256,'dependency hash drift: '+p.path);}
console.log('PASS W8D historical RRE: B1–B4 + W8AD replay, 5 canonical digests, period/source/lineage checks, dependency pins, 8 adversarial rejections; current=0; production=0; G14=0; RP=0.');
