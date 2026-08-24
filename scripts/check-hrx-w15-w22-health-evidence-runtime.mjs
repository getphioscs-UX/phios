import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { admitHealthSource } from '../functions/health/health-authority-runtime.js';
import { buildMedicalDocumentIngestionIR } from '../functions/health/health-document-ingestion.js';
import { buildHealthObservationTimeline } from '../functions/health/health-timeline-runtime.js';
import { buildHealthReality } from '../functions/health/health-reality-runtime.js';
import { versionHealthReality, diffHealthReality } from '../functions/health/health-version-runtime.js';
import { groundAskHealthEvidence } from '../functions/health/ask-health-grounding-adapter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const required = [
  'content/health/health-reality-runtime/authority/approved-health-authority-registry-v1.json',
  'content/health/health-reality-runtime/contracts/health-source-admission-contract-v1.json',
  'content/health/health-reality-runtime/schemas/medical-document-ingestion-ir-schema-v1.json',
  'content/health/health-reality-runtime/contracts/health-observation-timeline-contract-v1.json',
  'content/health/health-reality-runtime/contracts/health-reality-version-diff-contract-v1.json',
  'content/health/health-reality-runtime/contracts/ask-health-evidence-grounding-contract-v1.json',
  'content/health/health-reality-runtime/registries/health-client-surface-candidate-v1.json',
  'content/health/health-reality-runtime/acceptance/hrx-w15-w22-acceptance-v1.json',
  'functions/health/health-authority-runtime.js','functions/health/health-document-ingestion.js','functions/health/health-timeline-runtime.js','functions/health/health-version-runtime.js','functions/health/ask-health-grounding-adapter.js','health-reality.html','assets/js/pages/health-reality-candidate.js'
];
for (const rel of required) assert.equal(fs.existsSync(path.join(root, rel)), true, `missing ${rel}`);

// W15 Approved authority policy.
const authorities = json(required[0]);
assert.equal(authorities.status, 'APPROVED_AUTHORITY_POLICY_ACTIVE_SOURCE_CONTENT_NOT_BUNDLED');
assert.equal(authorities.activation.liveRetrievalAdapterConnected, false);
assert.equal(authorities.activation.productionHealthFactsAllowed, false);
for (const id of ['WHO','MOH_MY','NICE_UK','NHS_UK','CDC_US','NIH_US']) assert.ok(authorities.publishers.some(x=>x.authorityId===id), `missing ${id}`);

// W16 Source admission + provenance.
const fixtureSource = json('content/health/health-reality-runtime/fixtures/admitted-authority-source.json');
const admitted = admitHealthSource(fixtureSource, authorities);
assert.equal(admitted.admissionState, 'ADMITTED');
assert.equal(admitted.governance.publisherApprovalIsNotClaimApproval, true);
assert.equal(admitHealthSource({...fixtureSource,url:'https://example.com/health'}, authorities).admissionState, 'REJECTED_HOST');
assert.equal(admitHealthSource({...fixtureSource,contentDigest:''}, authorities).admissionState, 'REJECTED_PROVENANCE');

// W17 Medical document / lab IR.
const doc = buildMedicalDocumentIngestionIR(json('content/health/health-reality-runtime/fixtures/lab-document-ir-input.json'));
assert.equal(doc.documentType, 'LAB_REPORT');
assert.equal(doc.observations.length, 2);
assert.ok(doc.observations.every(x=>x.sourceClass==='DOCUMENT_EXTRACTED' && x.establishesDiagnosis===false));
assert.equal(doc.governance.rawDocumentPersistedByThisRuntime, false);

// W18 Deterministic timeline.
const timelineInput = { caseRef:'HRX-CASE-1', events:[
  {eventId:'B',eventType:'MEASUREMENT',observedAt:'2026-08-20',sourceClass:'DOCUMENT_EXTRACTED',summary:'HbA1c 5.9%',provenance:'DOC-TEST-001'},
  {eventId:'A',eventType:'SYMPTOM',observedAt:'2026-07-01',sourceClass:'USER_REPORTED',summary:'Fatigue',provenance:'USER_INPUT'},
  {eventId:'C',eventType:'UNKNOWN',sourceClass:'USER_REPORTED',summary:'Start date unknown',provenance:'USER_INPUT'}
]};
const tl1 = buildHealthObservationTimeline(timelineInput); const tl2 = buildHealthObservationTimeline(timelineInput);
assert.deepEqual(tl1, tl2); assert.deepEqual(tl1.events.map(x=>x.eventId), ['A','B','C']); assert.equal(tl1.governance.chronologyIsNotCausality,true);

// W19 Reality version / diff describes change only.
const base = buildHealthReality({caseRef:'HRX-CASE-1',question:'I have felt tired for several months.',concerns:['fatigue'],unknowns:['cause']});
const later = buildHealthReality({caseRef:'HRX-CASE-1',question:'I have felt tired for several months.',concerns:['fatigue'],measurements:[{value:'5.9',unit:'%',observedAt:'2026-08-20'}],unknowns:['cause','clinical significance']});
const v1=versionHealthReality(base,1), v2=versionHealthReality(later,2), diff=diffHealthReality(v1,v2);
assert.equal(diff.governance.describesChangeNotCause,true); assert.equal(diff.governance.clinicalImprovementClaimed,false); assert.ok(diff.changes.unknowns.added.includes('clinical significance'));

// W20 Ask grounding must fail closed without admitted source.
const noSource = groundAskHealthEvidence({question:'What does HbA1c mean?',claims:[{text:'A factual health claim'}]}, {}, authorities);
assert.equal(noSource.answerState,'AUTHORITY_REQUIRED'); assert.equal(noSource.governance.generalModelMaySubstituteForMissingHealthAuthority,false);
const grounded = groundAskHealthEvidence({question:'What does HbA1c mean?',sources:[fixtureSource],claims:[{text:'Source-bound test claim',sourceId:fixtureSource.sourceId}]}, {PHIOS_HEALTH_AUTHORITY_ENABLED:'1'}, authorities);
assert.equal(grounded.answerState,'GROUNDED_HEALTH_INFORMATION'); assert.equal(grounded.sources.length,1);

// W21 Client candidate exists but does not mutate current production surface authority.
const candidate = json('content/health/health-reality-runtime/registries/health-client-surface-candidate-v1.json');
assert.equal(candidate.productionState,'CANDIDATE_NOT_REGISTERED_IN_CURRENT_PRODUCTION_MANIFEST'); assert.equal(candidate.noIndex,true); assert.equal(candidate.persistentHealthRecordCreated,false);
const html=read('health-reality.html');
assert.match(html,/data-surface-code="HEALTH_REALITY_CANDIDATE"/); assert.match(html,/noindex,nofollow/); assert.match(html,/does not diagnose/i); assert.match(html,/No network health-fact retrieval/i);
const currentManifest=read('content/web-production/surface-production-manifest-v1.json'); assert.doesNotMatch(currentManifest,/HEALTH_REALITY_CANDIDATE/);

// W22 Source/browser contract candidate acceptance — explicitly not deployed/live verified.
const acceptance=json(required[7]);
assert.equal(acceptance.status,'HRX_EVIDENCE_RUNTIME_PRODUCTION_CANDIDATE_NOT_LIVE_VERIFIED');
assert.equal(acceptance.activation.liveBrowserVerified,false); assert.equal(acceptance.activation.productionHealthFactExecutionAllowed,false); assert.equal(acceptance.activation.currentProductionManifestMutated,false);
const clientJs=read('assets/js/pages/health-reality-candidate.js'); assert.match(clientJs,/addEventListener\('submit'/); assert.match(clientJs,/does not diagnose/);

console.log('✓ HRX-W15–W22 Health evidence runtime and client candidate passed.');
console.log('  Approved-authority policy, source admission, document IR, timeline, version/diff and Ask grounding are fail-closed.');
console.log('  Health Reality client surface is a noindex candidate only; current production manifest and live-health activation remain unchanged.');
