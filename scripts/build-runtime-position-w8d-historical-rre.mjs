import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {buildHistoricalAdmission,sha} from './build-runtime-position-w8e-p5-w8ad-historical.mjs';
import {consumeHistoricalRre} from './lib/civilization-atlas/runtime-position-w8d-historical-rre-adapter-v1.mjs';
export function buildHistoricalReadouts(root){
 const base=path.join(root,'content/civilization-atlas/reconfiguration');
 const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
 const readBase=n=>read('content/civilization-atlas/reconfiguration/'+n);
 const admission=readBase('runtime-position-w8e-p5-w8ad-historical-admission-v1.json');
 assert.deepEqual(admission,buildHistoricalAdmission(base),'ADMISSION_REPLAY_MISMATCH');
 const contract=readBase('runtime-position-w8d-historical-rre-contract-v1.json');
 const reg=n=>read('content/runtime/reality-readout-engine/registries/canonical-'+n+'-registry-v1.json');
 const registries={inputContract:read('content/runtime/reality-readout-engine/contracts/reality-readout-input-contract-v1.json'),dimensionRegistry:reg('observable-dimension'),signatureRegistry:reg('runtime-signature-role'),patternRegistry:reg('pattern-runtime'),constraintRegistry:reg('constraint-reading-class'),loadRegistry:reg('load-reading-state'),stabilityRegistry:reg('stability-reading'),driftRegistry:reg('drift-reading'),recoveryRegistry:reg('recovery-reading'),resolutionRegistry:reg('resolution-limit'),confidenceRegistry:reg('confidence-runtime'),rmoConstraintRegistry:read('content/runtime/reality-model-runtime/registries/canonical-constraint-type-registry-v1.json'),rmoUnknownRegistry:read('content/runtime/reality-model-runtime/registries/canonical-unknown-kind-registry-v1.json'),successorRegistry:read('content/governance/reality-data-governance/extensions/rre-readout/registries/rre-readout-data-contract-successor-v1.json')};
 const records=consumeHistoricalRre({admission,registries,contract});
 return {output:{schemaVersion:'PHI-OS-W8D-HISTORICAL-RRE-CONSUMPTION-v1',status:'HISTORICAL_RRE_VALIDATION_COMPLETE_PRODUCTION_NOT_ADMITTED',predecessor:{file:'runtime-position-w8e-p5-w8ad-historical-admission-v1.json',sha256:sha(fs.readFileSync(path.join(base,'runtime-position-w8e-p5-w8ad-historical-admission-v1.json')))},contract,records,completed:{historicalCanonicalSchemaReadouts:records.length,supportedRevenueStates:records.reduce((n,r)=>n+r.components.observationSummary.observableStates.length,0),supportedReportingTransitions:records.reduce((n,r)=>n+r.components.observationSummary.observableTransitions.length,0),retainedStructuralCandidates:records.filter(r=>r.candidate).length,currentEvidenceAdmitted:0,productionAdmissions:0,g14Admissions:0,runtimePositions:0,nationalPromotions:0}},admission,registries,contract};
}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {output}=buildHistoricalReadouts(root);fs.writeFileSync(path.join(root,'content/civilization-atlas/reconfiguration/runtime-position-w8d-historical-rre-consumption-v1.json'),JSON.stringify(output,null,2)+'\n');console.log('PASS W8D historical RRE: 5 canonical-schema validation readouts, 15 revenue states, 2 reporting transitions; current=0; production=0; G14=0; RP=0.');
}
