import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {processRuntimePositionW8Batch} from './lib/civilization-atlas/runtime-position-w8-batch-pipeline-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const ok=(value,code)=>{if(!value)throw new Error('RUNTIME_POSITION_48_W8:'+code);};

const acceptance=read('content/civilization-atlas/reconfiguration/runtime-position-w7-human-acceptance-v1.json');
const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w8-batch-production-contract-v1.json');
const batches=read('content/civilization-atlas/reconfiguration/runtime-position-w8-evidence-batches-v1.json');
const evidence=read('content/civilization-atlas/reconfiguration/runtime-position-w8-current-evidence-admission-v1.json');
const candidates=read('content/civilization-atlas/reconfiguration/runtime-position-w8-rre-candidates-v1.json');
const review=read('content/civilization-atlas/reconfiguration/runtime-position-w8-position-human-review-v1.json');
const status=read('content/civilization-atlas/reconfiguration/runtime-position-w8-status-v1.json');
const readiness=read('content/civilization-atlas/reconfiguration/runtime-position-w7-readiness-v1.json');
const dossiers=read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const cases=read('content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json');
const positions=read('content/registry/runtime-position-48-v1.json');
const crosswalk=read('content/registry/runtime-position-48-crosswalk-v1.json');
const manifest=read('content/civilization-atlas/reconfiguration/atlas-manifest-v2.json');
const REGISTRIES={
  inputContract:read('content/runtime/reality-readout-engine/contracts/reality-readout-input-contract-v1.json'),
  dimensionRegistry:read('content/runtime/reality-readout-engine/registries/canonical-observable-dimension-registry-v1.json'),
  signatureRegistry:read('content/runtime/reality-readout-engine/registries/canonical-runtime-signature-role-registry-v1.json'),
  patternRegistry:read('content/runtime/reality-readout-engine/registries/canonical-pattern-runtime-registry-v1.json'),
  constraintRegistry:read('content/runtime/reality-readout-engine/registries/canonical-constraint-reading-class-registry-v1.json'),
  loadRegistry:read('content/runtime/reality-readout-engine/registries/canonical-load-reading-state-registry-v1.json'),
  stabilityRegistry:read('content/runtime/reality-readout-engine/registries/canonical-stability-reading-registry-v1.json'),
  driftRegistry:read('content/runtime/reality-readout-engine/registries/canonical-drift-reading-registry-v1.json'),
  recoveryRegistry:read('content/runtime/reality-readout-engine/registries/canonical-recovery-reading-registry-v1.json'),
  resolutionRegistry:read('content/runtime/reality-readout-engine/registries/canonical-resolution-limit-registry-v1.json'),
  confidenceRegistry:read('content/runtime/reality-readout-engine/registries/canonical-confidence-runtime-registry-v1.json'),
  rmoConstraintRegistry:read('content/runtime/reality-model-runtime/registries/canonical-constraint-type-registry-v1.json'),
  rmoUnknownRegistry:read('content/runtime/reality-model-runtime/registries/canonical-unknown-kind-registry-v1.json'),
  successorRegistry:read('content/governance/reality-data-governance/extensions/rre-readout/registries/rre-readout-data-contract-successor-v1.json'),
  targetRegistry:read('content/runtime/reality-readout-engine/registries/rre-cpr-projection-target-registry-v1.json'),
  cprSurfaceRegistry:read('content/professional/canonical-presentation-runtime/registries/cpr-surface-projection-registry-v1.json')
};

ok(acceptance.status==='ACCEPTED','W7_ACCEPTANCE_REQUIRED');
ok(contract.status==='ACTIVE_PRODUCTION_PIPELINE','CONTRACT_STATUS');
ok(contract.owners?.sourceAdmission==='CURRENT_WEB_AUTHORITY','CWA_OWNER');
ok(contract.owners?.derivedReadout==='REALITY_READOUT_ENGINE','RRE_OWNER');
ok(contract.mutatesCanonicalDossierRegistry===false,'DOSSIER_MUTATION_BOUNDARY');
ok(Array.isArray(batches.batches),'PRODUCTION_BATCH_ARRAY');
const batchIds=new Set((batches.batches||[]).map(row=>row.batchId));
ok(batchIds.size===(batches.batches||[]).length,'PRODUCTION_BATCH_ID_UNIQUE');
ok((evidence.records||[]).length===(batches.batches||[]).length,'EVIDENCE_BATCH_RESULT_COUNT');
ok((evidence.records||[]).every(row=>batchIds.has(row.batchId)),'EVIDENCE_ORPHAN_BATCH');
const candidateRows=candidates.candidates||[];
const reviewRows=review.records||[];
ok(candidateRows.every(row=>batchIds.has(row.batchId)),'CANDIDATE_ORPHAN_BATCH');
ok(candidateRows.every(row=>row.humanDecision==='PENDING'),'CANDIDATE_AUTO_ADMITTED');
ok(candidateRows.every(row=>row.dataClass==='DERIVED_RUNTIME_READOUT'),'CANDIDATE_DATA_CLASS');
ok(reviewRows.length===candidateRows.length,'HUMAN_REVIEW_CANDIDATE_COUNT');
const reviewIds=new Set(reviewRows.map(row=>row.candidateId));
ok(candidateRows.every(row=>reviewIds.has(row.candidateId)),'HUMAN_REVIEW_CANDIDATE_LINK');
ok(reviewRows.every(row=>row.humanDecision==='PENDING'),'HUMAN_REVIEW_AUTO_DECIDED');
ok(status.completed?.productionBatches===(batches.batches||[]).length,'STATUS_BATCH_COUNT');
ok(status.completed?.runtimePositionCandidates===candidateRows.length,'STATUS_CANDIDATE_COUNT');
ok(status.completed?.dossiersAutoPopulated===0,'DOSSIERS_AUTO_POPULATED');
if((batches.batches||[]).length===0){
  ok((evidence.records||[]).length===0,'EMPTY_PRODUCTION_EVIDENCE');
  ok(candidateRows.length===0,'EMPTY_PRODUCTION_CANDIDATES');
  ok(reviewRows.length===0,'EMPTY_HUMAN_REVIEW');
}
ok(crosswalk.w8?.sourceAdmissionOwner==='CURRENT_WEB_AUTHORITY','CROSSWALK_CWA');
ok(crosswalk.w8?.readoutOwner==='REALITY_READOUT_ENGINE','CROSSWALK_RRE');
ok(crosswalk.w8?.autoPopulateDossiers===false,'CROSSWALK_AUTO_POPULATION');
ok(manifest.registryRefs?.runtimePositionW8Contract==='content/civilization-atlas/reconfiguration/runtime-position-w8-batch-production-contract-v1.json','MANIFEST_CONTRACT');
ok(manifest.registryRefs?.runtimePositionW8HumanReview==='content/civilization-atlas/reconfiguration/runtime-position-w8-position-human-review-v1.json','MANIFEST_REVIEW');
const packageText=text('package.json');
ok(packageText.includes('"build:runtime-position-48:w8"'),'PACKAGE_BUILD_SCRIPT');
ok(packageText.includes('"check:runtime-position-48:w8"'),'PACKAGE_CHECK_SCRIPT');
const pipelineText=text('scripts/lib/civilization-atlas/runtime-position-w8-batch-pipeline-v1.mjs');
ok(pipelineText.includes('admitCurrentSource')&&pipelineText.includes('createCurrentEvidence'),'PIPELINE_CWA');
ok(pipelineText.includes('buildBook6DossierRreProjection'),'PIPELINE_RRE');
ok(pipelineText.includes("row.grammarId===proposal.grammarId&&row.realityDomainId===proposal.realityDomainId"),'PIPELINE_CANONICAL_MAPPING');
ok(pipelineText.includes("humanDecision:'PENDING'"),'PIPELINE_HUMAN_GATE');

const dossier=(dossiers.dossiers||[]).find(row=>row.id==='DOSSIER-US');
const ready=(readiness.dossiers||[]).find(row=>row.dossierId==='DOSSIER-US');
const required=(ready.sourceLaneRequirements||[]).filter(row=>row.requiredForPositionCandidate).map(row=>row.laneId);
const claimId=lane=>'FIXTURE-W8-'+lane;
const claims=required.map((lane,index)=>({laneId:lane,candidate:{url:'https://example.com/w8-fixture/'+String(index+1),publisher:'W8 Fixture Authority',title:'W8 fixture source '+lane,retrievedAt:'2026-10-02T00:00:00.000Z'},authorityClass:'OFFICIAL_PRIMARY',sourceId:'W8-FIXTURE-SOURCE-'+lane,sourceVersionOrDigest:'fixture-v1-'+lane,claimId:claimId(lane),claimText:'Fixture current fact for '+lane,claimType:'GENERAL_CURRENT_FACT',supportLevel:'DIRECT',jurisdiction:'FIXTURE'}));
const fixture={batchId:'FIXTURE-BATCH-001',dossierId:'DOSSIER-US',runAt:'2026-10-02T00:00:00.000Z',fixtureOnly:true,claims,positionProposals:[{proposalId:'P01',scope:'DOSSIER',grammarId:'G1',realityDomainId:'P2',candidateRole:'PRIMARY_CANDIDATE',evidenceRefs:required.map(claimId),grammarRationale:'Fixture-only deterministic grammar proposal for pipeline verification.',domainRationale:'Fixture-only deterministic reality-domain proposal for pipeline verification.'}]};
const result=processRuntimePositionW8Batch({batch:fixture,dossier,cases:cases.cases||[],readiness,positions:positions.positions||[],registries:REGISTRIES,mode:'FIXTURE'});
ok(result.admittedEvidence.length===required.length,'FIXTURE_CWA_ADMISSION');
ok(result.rreProjection?.readoutReference?.code,'FIXTURE_RRE_LINEAGE');
ok(result.candidates.length===1,'FIXTURE_CANDIDATE_COUNT');
ok(result.candidates[0].candidatePositionId==='RP-17','FIXTURE_CANONICAL_POSITION');
ok(result.candidates[0].humanDecision==='PENDING','FIXTURE_HUMAN_PENDING');
ok(result.boundaries?.canonicalDossierMutated===false,'FIXTURE_DOSSIER_IMMUTABLE');

const incomplete={...fixture,batchId:'FIXTURE-BATCH-002',claims:claims.slice(0,-1)};
const blocked=processRuntimePositionW8Batch({batch:incomplete,dossier,cases:cases.cases||[],readiness,positions:positions.positions||[],registries:REGISTRIES,mode:'FIXTURE'});
ok(blocked.candidates.length===0,'INCOMPLETE_LANES_CREATED_CANDIDATE');
ok(blocked.missingRequiredLanes.length===1,'INCOMPLETE_LANE_NOT_DETECTED');
let rejected=false;
try{processRuntimePositionW8Batch({batch:fixture,dossier,cases:cases.cases||[],readiness,positions:positions.positions||[],registries:REGISTRIES,mode:'PRODUCTION'});}catch(error){rejected=String(error?.code||error?.message)==='W8_FIXTURE_NOT_ALLOWED_IN_PRODUCTION';}
ok(rejected,'FIXTURE_PRODUCTION_GUARD');
console.log('PASS runtime-position-48 W8: executable Evidence Batch → CWA → RRE → canonical position candidate → human review pipeline is active; production remains empty/fail-closed until verifiable source batches are supplied.');
