import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {consumeW8dRreEvidence} from './lib/civilization-atlas/runtime-position-w8d-rre-consumption-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const ok=(v,c)=>{if(!v)throw new Error('RUNTIME_POSITION_48_W8D:'+c);};

const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-consumption-contract-v1.json');
const handoff=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-rre-eligible-handoff-v1.json');
const output=read('content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-readouts-v1.json');
const derivation=read('content/civilization-atlas/reconfiguration/runtime-position-w8d-position-derivation-readiness-v1.json');
const status=read('content/civilization-atlas/reconfiguration/runtime-position-w8d-status-v1.json');
const dossiers=read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const cases=read('content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json');
const readiness=read('content/civilization-atlas/reconfiguration/runtime-position-w7-readiness-v1.json');
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

ok(contract.status==='ACTIVE_RRE_CURRENT_EVIDENCE_CONSUMPTION','CONTRACT');
ok(contract.boundaries?.runtimePositionCandidateAllowed===false,'POSITION_BOUNDARY');
ok((output.records||[]).length===new Set((handoff.records||[]).map(x=>x.dossierId)).size,'READOUT_DOSSIER_COUNT');
ok((output.records||[]).every(x=>x.dataClass==='DERIVED_RUNTIME_READOUT'),'READOUT_DATA_CLASS');
ok((output.records||[]).every(x=>x.readoutReference?.code&&x.readoutReference?.digest),'READOUT_REFERENCE');
ok((output.records||[]).every(x=>x.boundaries?.canonicalDossierMutated===false&&x.boundaries?.runtimePositionCandidateCreated===false),'READOUT_BOUNDARY');
ok((derivation.records||[]).length===(output.records||[]).length,'DERIVATION_COUNT');
ok((derivation.records||[]).every(x=>x.positionCandidateCount===0),'POSITION_CANDIDATE_COUNT');
ok(status.completed?.canonicalDossiersMutated===0,'DOSSIER_MUTATION');
ok(status.completed?.runtimePositionCandidates===0,'POSITION_CANDIDATES');
ok(status.completed?.positionsAdmitted===0,'POSITION_ADMITTED');
ok(crosswalk.w8d?.readoutOwner==='REALITY_READOUT_ENGINE','CROSSWALK_OWNER');
ok(manifest.registryRefs?.runtimePositionW8dReadouts==='content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-readouts-v1.json','MANIFEST_READOUTS');
const runner=text('scripts/run-runtime-position-48-w8d-rre-consumption.mjs');
ok(runner.includes('consumeW8dRreEvidence'),'RUNNER_CONSUMER');
ok(!runner.includes("write('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json'"),'RUNNER_MUTATES_DOSSIERS');
const pkg=text('package.json');
ok(pkg.includes('"build:runtime-position-48:w8d"')&&pkg.includes('"check:runtime-position-48:w8d"'),'PACKAGE');

const us=(dossiers.dossiers||[]).find(x=>x.id==='DOSSIER-US');
const usReady=(readiness.dossiers||[]).find(x=>x.dossierId==='DOSSIER-US');
const required=(usReady.sourceLaneRequirements||[]).filter(x=>x.requiredForPositionCandidate).map(x=>x.laneId);
const ev=(lane,i)=>({schemaVersion:'PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0',claimId:'FX-'+lane,claimText:'Fixture '+lane,claimType:'GENERAL_CURRENT_FACT',sourceId:'SRC-'+lane,sourceUrl:'https://example.com/'+i,authorityClass:'OFFICIAL_PRIMARY',publisher:'Fixture',title:'Fixture',publishedAt:'2026-10-01T00:00:00.000Z',retrievedAt:'2026-10-02T01:00:00.000Z',sourceVersion:'v1',freshnessState:'FRESH',supportLevel:'DIRECT',jurisdiction:'US',domain:'GENERAL_CURRENT',conflicts:[],dossierId:'DOSSIER-US',laneId:lane,evidenceState:'CWA_ADMITTED',rreEligibility:'RRE_ELIGIBLE',boundaries:{sourceVotingUsed:false}});
const partialHandoff={records:[ev(required[0],1),ev(required[1],2)]};
const partial=consumeW8dRreEvidence({handoff:partialHandoff,dossiers:{dossiers:[us]},cases:cases.cases||[],readiness:{dossiers:[usReady]},registries:REGISTRIES});
ok(partial.records.length===1,'FIXTURE_PARTIAL_READOUT');
ok(partial.records[0].state==='RRE_PARTIAL_EVIDENCE_CONSUMED','FIXTURE_PARTIAL_STATE');
ok(partial.records[0].missingRequiredLanes.length===required.length-2,'FIXTURE_PARTIAL_MISSING');
ok(partial.derivationReadiness[0].state==='REQUIRED_LANES_INCOMPLETE','FIXTURE_PARTIAL_NOT_READY');
const completeHandoff={records:required.map(ev)};
const complete=consumeW8dRreEvidence({handoff:completeHandoff,dossiers:{dossiers:[us]},cases:cases.cases||[],readiness:{dossiers:[usReady]},registries:REGISTRIES});
ok(complete.records.length===1,'FIXTURE_COMPLETE_READOUT');
ok(complete.records[0].state==='RRE_REQUIRED_LANES_CONSUMED','FIXTURE_COMPLETE_STATE');
ok(complete.records[0].missingRequiredLanes.length===0,'FIXTURE_COMPLETE_MISSING');
ok(complete.derivationReadiness[0].state==='REQUIRED_LANES_COMPLETE','FIXTURE_COMPLETE_READY');
ok(complete.derivationReadiness[0].positionCandidateCount===0,'FIXTURE_NO_POSITION');
const zero=consumeW8dRreEvidence({handoff:{records:[]},dossiers:{dossiers:[us]},cases:cases.cases||[],readiness:{dossiers:[usReady]},registries:REGISTRIES});
ok(zero.records.length===0&&zero.derivationReadiness.length===0,'FIXTURE_ZERO_FAIL_CLOSED');
let nonEligibleRejected=false;
try{consumeW8dRreEvidence({handoff:{records:[{...ev(required[0],1),rreEligibility:'NOT_RRE_ELIGIBLE'}]},dossiers:{dossiers:[us]},cases:cases.cases||[],readiness:{dossiers:[usReady]},registries:REGISTRIES});}catch(error){nonEligibleRejected=String(error?.message)==='W8D_NON_ELIGIBLE_EVIDENCE';}
ok(nonEligibleRejected,'FIXTURE_NON_ELIGIBLE_GUARD');
console.log('PASS runtime-position-48 W8D: only W8C RRE-eligible evidence creates evidence-lineaged RRE readouts; partial vs complete required-lane coverage is explicit; zero evidence creates zero dossier records; positions remain closed.');
