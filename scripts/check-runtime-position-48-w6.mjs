import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const fail=msg=>{throw new Error('RUNTIME_POSITION_48_W6:'+msg);};
const assert=(ok,msg)=>{if(!ok)fail(msg);};

const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w6-contract-v1.json');
const gate=read('content/civilization-atlas/reconfiguration/runtime-position-w6-evidence-gate-v1.json');
const dossiers=read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const correspondence=read('content/civilization-atlas/reconfiguration/runtime-position-correspondence-v1.json');
const review=read('content/civilization-atlas/reconfiguration/runtime-position-w6-human-review-v1.json');
const status=read('content/civilization-atlas/reconfiguration/runtime-position-w6-status-v1.json');
const manifest=read('content/civilization-atlas/reconfiguration/atlas-manifest-v2.json');
const crosswalk=read('content/registry/runtime-position-48-crosswalk-v1.json');

assert(contract.architectureBoundary?.newParallelRuntime===false,'PARALLEL_RUNTIME');
assert(contract.existingRuntimeOwners?.currentEvidence?.includes('current-evidence-ir-contract'),'CURRENT_EVIDENCE_OWNER');
assert(contract.existingRuntimeOwners?.realityReadout?.includes('canonical-runtime-readout-contract'),'RRE_OWNER');
assert(contract.observationThresholdCriteria?.length===4,'THRESHOLD_CRITERIA');
assert(gate.records?.length===(dossiers.dossiers||[]).length,'EVIDENCE_GATE_DOSSIER_COUNT');
assert(correspondence.correspondences?.length===(dossiers.dossiers||[]).length,'CORRESPONDENCE_DOSSIER_COUNT');

for(const d of dossiers.dossiers||[]){
  const row=(gate.records||[]).find(x=>x.dossierId===d.id);
  assert(row,'MISSING_GATE_'+d.id);
  assert(row.currentEvidence?.admissionState==='NO_ADMITTED_CURRENT_EVIDENCE','CURRENT_EVIDENCE_STATE_'+d.id);
  assert((row.currentEvidence?.admittedClaims||[]).length===0,'FABRICATED_CURRENT_CLAIM_'+d.id);
  assert((row.observationTargets||[]).length>0,'OBSERVATION_TARGETS_'+d.id);
  assert((row.observationTargets||[]).every(x=>x.state==='OBSERVATION_TARGET_ONLY'),'OBSERVATION_TARGET_PROMOTED_'+d.id);
  assert(row.positionReadout?.state==='UNKNOWN','CURRENT_POSITION_STATE_'+d.id);
  assert(row.positionReadout?.primary==null,'CURRENT_POSITION_ASSIGNED_'+d.id);
  assert((row.transitionSignals?.observed||[]).length===0,'OBSERVED_SIGNAL_ASSIGNED_'+d.id);
  assert(row.observationThreshold?.state==='NOT_EVALUATED','THRESHOLD_INFERRED_'+d.id);
  assert((row.observationThreshold?.criteria||[]).every(x=>x.state==='UNKNOWN'),'THRESHOLD_CRITERION_INFERRED_'+d.id);
  assert((row.reachablePositions?.positions||[]).length===0,'REACHABLE_POSITION_INFERRED_'+d.id);

  const corr=(correspondence.correspondences||[]).find(x=>x.dossierId===d.id);
  assert(corr?.currentPositionAdmission==='BLOCKED_NO_ADMITTED_CURRENT_EVIDENCE','CORRESPONDENCE_GATE_'+d.id);
  assert(corr?.transitionThresholdState==='NOT_EVALUATED','CORRESPONDENCE_THRESHOLD_'+d.id);
}

assert(review.status==='HUMAN_ACCEPTED','REVIEW_STATUS');
assert(review.records?.length===3,'REVIEW_COUNT');
assert((review.records||[]).every(x=>x.humanDecision==='ACCEPT'),'REVIEW_NOT_ACCEPTED');
assert(status.status==='HUMAN_ACCEPTED__CURRENT_EVIDENCE_ADMISSION_READY','W6_STATUS');
assert(status.completed?.admittedCurrentEvidenceClaims===0,'W6_CURRENT_EVIDENCE_COUNT');
assert(status.completed?.observedTransitionSignals===0,'W6_SIGNAL_COUNT');
assert(status.completed?.currentPositionAssignments===0,'W6_POSITION_COUNT');
assert(status.completed?.thresholdCrossings===0,'W6_THRESHOLD_COUNT');
assert(status.completed?.reachablePositionAssignments===0,'W6_REACHABLE_COUNT');

assert(manifest.registryRefs?.runtimePositionW6Contract==='content/civilization-atlas/reconfiguration/runtime-position-w6-contract-v1.json','MANIFEST_W6_CONTRACT');
assert(manifest.registryRefs?.runtimePositionW6EvidenceGate==='content/civilization-atlas/reconfiguration/runtime-position-w6-evidence-gate-v1.json','MANIFEST_W6_GATE');
assert(manifest.registryRefs?.runtimePositionW6Status==='content/civilization-atlas/reconfiguration/runtime-position-w6-status-v1.json','MANIFEST_W6_STATUS');
assert(crosswalk.w6?.currentEvidenceOwner==='CURRENT_WEB_AUTHORITY','CROSSWALK_CWA');
assert(crosswalk.w6?.readoutOwner==='REALITY_READOUT_ENGINE','CROSSWALK_RRE');
assert(crosswalk.w6?.humanDecision==='ACCEPT','CROSSWALK_HUMAN_GATE');

const loader=text('assets/js/pages/civilization-atlas/atlas-data.js');
assert(loader.includes('runtime-position-w6-evidence-gate-v1.json'),'LOADER_W6_GATE');
const renderer=text('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
assert(renderer.includes('Current evidence → 48 runtime positions'),'RENDERER_EVIDENCE_POSITION');
assert(renderer.includes('Transition signals → observation threshold → reachable positions'),'RENDERER_THRESHOLD_PIPELINE');
assert(renderer.includes('Observation target ≠ signal'),'RENDERER_BOUNDARY');
assert(renderer.includes('data-runtime-readout'),'RRE_SLOT');
assert(renderer.includes('hydrateDossierRuntimeReadout(host,d,l)'),'RRE_HYDRATION');
const ask=text('functions/_lib/atlas-retrieval-scope.js');
assert(ask.includes('CIVILIZATION_ATLAS_CURRENT_EVIDENCE_GATE'),'ASK_W6_GATE');
const rreAdapter=text('scripts/lib/civilization-atlas/book6-rre-adapter-v1.mjs');
assert(rreAdapter.includes('currentEvidenceRecord=null'),'RRE_W6_INPUT');
assert(rreAdapter.includes('currentEvidenceReferences:evidenceReferences'),'RRE_W6_EVIDENCE_LINEAGE');
const rreApi=text('functions/api/book6-runtime-readout.js');
assert(rreApi.includes('runtime-position-w6-evidence-gate-v1.json'),'RRE_API_W6_GATE');

console.log('PASS runtime-position-48 W6: representative dossier evidence gate human-accepted; 12 dossier gates still fail closed, observation targets preserved, no current positions/signals/thresholds/reachable positions fabricated, existing Current Web Authority and Reality Readout Engine reused.');
