import fs from 'node:fs';
import {readJson,validatePilotCase,evaluateCapabilityPromotions} from './lib/runtime-maturity/pilot-campaign-lib.mjs';
const path=process.argv[2];
if(!path){ console.error('Usage: node scripts/evaluate-mrm-pilot-case.mjs <private-case-manifest.json>'); process.exit(2); }
const record=JSON.parse(fs.readFileSync(path,'utf8'));
const ctx={candidateRegistry:readJson('content/runtime-maturity/pilot/campaign/first-batch-pilot-candidate-registry-v1.json'),stageRegistry:readJson('content/runtime-maturity/pilot/campaign/pilot-stage-requirement-registry-v1.json'),admissionContract:readJson('content/runtime-maturity/pilot/campaign/pilot-case-admission-contract-v1.json'),baseMatrix:readJson('content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.5.json')};
const result=validatePilotCase(record,ctx);
const output={schemaVersion:'PHI-OS-MRM-S10-S11-PILOT-CASE-EVALUATION-v1.0.0',pilotCaseId:record.pilotCaseId||null,campaignCaseId:record.campaignCaseId||null,qualifying:result.qualifying,errors:result.errors,candidatePromotions:result.qualifying?evaluateCapabilityPromotions(record,ctx):[]};
console.log(JSON.stringify(output,null,2));
if(!result.qualifying) process.exitCode=1;
