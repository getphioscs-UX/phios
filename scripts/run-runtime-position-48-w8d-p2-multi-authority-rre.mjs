import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mergeMultiAuthorityEvidence} from './lib/civilization-atlas/runtime-position-w8d-p2-multi-authority-merge-v1.mjs';
import {consumeW8dRreEvidence} from './lib/civilization-atlas/runtime-position-w8d-rre-consumption-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,v)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(v,null,2)+'\n');

const official=read('content/civilization-atlas/reconfiguration/runtime-position-w8c-rre-eligible-handoff-v1.json');
const provider=read('content/civilization-atlas/reconfiguration/moomoo-provider-rre-eligible-handoff-v1.json');
const dossiers=read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const cases=read('content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json');
const readiness=read('content/civilization-atlas/reconfiguration/runtime-position-w7-readiness-v1.json');
const baseline=read('content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-readouts-v1.json');
const baselineDigest=JSON.stringify(baseline);
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

const merged=mergeMultiAuthorityEvidence({officialHandoff:official,providerHandoff:provider});
const mergedHandoff={schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2-MERGED-RRE-ELIGIBLE-HANDOFF-v1.0.0',version:'1.0.0',status:merged.records.length?'MERGED_RRE_ELIGIBLE_EVIDENCE_READY':'IDLE_NO_MERGED_EVIDENCE',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2',records:merged.records,mergeSummary:merged.summary,boundary:'Merged handoff preserves authority/provenance and is an RRE input only. It is not a semantic derivation or position candidate.'};
write('content/civilization-atlas/reconfiguration/runtime-position-w8d-p2-merged-rre-eligible-handoff-v1.json',mergedHandoff);

const output=consumeW8dRreEvidence({handoff:mergedHandoff,dossiers,cases:cases.cases||[],readiness,registries:REGISTRIES});
const complete=output.records.filter(x=>x.state==='RRE_REQUIRED_LANES_CONSUMED').length;
write('content/civilization-atlas/reconfiguration/runtime-position-w8d-p2-rre-readouts-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2-RRE-READOUTS-v1.0.0',version:'1.0.0',status:output.records.length?'MERGED_RRE_EVIDENCE_CONSUMED':'IDLE_NO_MERGED_EVIDENCE',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2',records:output.records});
write('content/civilization-atlas/reconfiguration/runtime-position-w8d-p2-derivation-readiness-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2-DERIVATION-READINESS-v1.0.0',version:'1.0.0',status:output.derivationReadiness.length?'MERGED_RRE_READOUTS_EVALUATED':'IDLE_NO_MERGED_READOUTS',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2',successorWork:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8E-P2',records:output.derivationReadiness,boundary:'Merged readout readiness preserves required-lane identity; multiple evidence records in one lane do not create extra lanes.'});
write('content/civilization-atlas/reconfiguration/runtime-position-w8d-p2-status-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2-STATUS-v1.0.0',version:'1.0.0',status:output.records.length?'GOVERNED_MULTI_AUTHORITY_RRE_CONSUMED':'EXECUTOR_READY__NO_MERGED_EVIDENCE',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8D-P2',completed:{officialEvidence:merged.summary.officialOrRegulatorEvidence,providerEvidence:merged.summary.marketDataProviderEvidence,mergedEvidence:merged.summary.totalEvidence,distinctMergedLanes:merged.summary.distinctLanes,rreReadouts:output.records.length,requiredLanesCompleteReadouts:complete,baselineW8dMutated:0,runtimePositionCandidates:0,w8ePromotions:0},authorityClasses:merged.summary.authorityClasses,laneComposition:merged.summary.laneComposition,next:complete?'Use the separate W8D-P2 enriched readout for a governed W8E-P2 semantic-basis reassessment. Do not mutate the original W8E basis automatically.':'Complete missing required lanes before semantic derivation.'});

if(JSON.stringify(read('content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-readouts-v1.json'))!==baselineDigest)throw new Error('W8D_P2_BASELINE_MUTATED');
console.log('PASS W8D-P2 governed merge + RRE: official='+merged.summary.officialOrRegulatorEvidence+', provider='+merged.summary.marketDataProviderEvidence+', merged='+merged.summary.totalEvidence+', lanes='+merged.summary.distinctLanes+', readouts='+output.records.length+', requiredComplete='+complete+', baselineMutated=0, positions=0.');
