import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {buildHistoricalReadouts} from './build-runtime-position-w8d-historical-rre.mjs';
import {buildSemanticReview,assessHistoricalSemantics} from './build-runtime-position-w8e-historical-semantic-review.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=spawnSync(process.execPath,[path.join(root,'scripts/check-runtime-position-w8d-historical-rre.mjs')],{encoding:'utf8'});assert.equal(run.status,0,run.stdout+run.stderr);
const expected=buildSemanticReview(root),base=path.join(root,'content/civilization-atlas/reconfiguration');
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(base,'runtime-position-w8e-historical-semantic-review-v1.json'))),expected);
const rre=buildHistoricalReadouts(root);const args={readouts:rre.output.records,evidence:rre.admission.w8cHistorical.evidence,grammarCanon:JSON.parse(fs.readFileSync(path.join(base,'runtime-position-w8e-grammar-canon-v1.json'))),domainCriteria:JSON.parse(fs.readFileSync(path.join(base,'runtime-position-w8e-domain-criteria-v1.json')))};
for(const r of expected.records){assert.equal(r.grammarId,'G14');assert.equal(r.knowledgeState,'HISTORICAL');assert.equal(r.scope,'SUBSYSTEM');assert.equal(r.grammarTests.find(t=>t.test==='NEW_CONDITIONS').state,'NOT_ESTABLISHED');assert(r.domainTests.every(t=>t.state==='INSUFFICIENT_EVIDENCE'));assert.equal(r.proposedGrammarDomainPair,null);assert.equal(r.humanDecision,'NOT_RECORDED');assert.equal(r.g14Pair,null);assert.equal(r.runtimePosition,null);assert.equal(r.nationalPromotion,false);}
const nvda=expected.records.find(r=>r.issuer==='NVDA');assert.equal(nvda.grammarTests.find(t=>t.test==='REORGANIZATION_OF_STRUCTURE').state,'NOT_ESTABLISHED');
// Multiple years in the same recast annual filing do not become independent sources.
assert.equal(nvda.independentSourceIds.length,1);
for(const mutate of [
 a=>a.readouts.find(r=>r.candidate).scope='DOSSIER',
 a=>a.readouts.find(r=>r.candidate).knowledgeState='CURRENT',
 a=>a.readouts.find(r=>r.candidate).input.evidenceReferences.push('ORPHAN'),
 a=>a.readouts.find(r=>r.issuer==='MSFT').components.observationSummary.observableTransitions=[],
 a=>a.readouts.push(structuredClone(a.readouts.find(r=>r.candidate)))
]){const a=structuredClone(args);mutate(a);assert.throws(()=>assessHistoricalSemantics(a));}
const doubled=structuredClone(args);for(const r of doubled.readouts)r.input.evidenceReferences=[...r.input.evidenceReferences,...r.input.evidenceReferences];
const multiple=assessHistoricalSemantics(doubled);assert(multiple.every(r=>r.proposedGrammarDomainPair===null&&r.semanticSupportState==='INSUFFICIENT_EVIDENCE'),'source counts must never supply missing conditions');
console.log('PASS W8E historical semantic review: upstream replay + 3 canonical G14 tests + 9 domain tests; scope/current/orphan/event/duplicate guards; source-count shortcuts rejected; G14=0; RP=0.');
