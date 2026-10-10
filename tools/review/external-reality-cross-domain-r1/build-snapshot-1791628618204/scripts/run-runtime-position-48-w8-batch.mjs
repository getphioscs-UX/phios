import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {processRuntimePositionW8Batch} from './lib/civilization-atlas/runtime-position-w8-batch-pipeline-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(value,null,2)+'\n');
const inputArg=process.argv.find(x=>x.startsWith('--input='));
const inputRel=inputArg?inputArg.slice('--input='.length):'content/civilization-atlas/reconfiguration/runtime-position-w8-evidence-batches-v1.json';

const dossiers=read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const cases=read('content/civilization-atlas/reconfiguration/reconfiguration-case-registry-v1.json');
const readiness=read('content/civilization-atlas/reconfiguration/runtime-position-w7-readiness-v1.json');
const positions=read('content/registry/runtime-position-48-v1.json');
const input=read(inputRel);
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
const dossierMap=new Map((dossiers.dossiers||[]).map(row=>[row.id,row]));
const results=(input.batches||[]).map(batch=>{
  try{return processRuntimePositionW8Batch({batch,dossier:dossierMap.get(batch.dossierId),cases:cases.cases||[],readiness,positions:positions.positions||[],registries:REGISTRIES,mode:'PRODUCTION'});}
  catch(error){return {batchId:batch.batchId||null,dossierId:batch.dossierId||null,state:'BATCH_REJECTED',error:String(error?.code||error?.message||error),admittedEvidence:[],candidates:[]};}
});
const evidenceRecords=results.map(row=>({batchId:row.batchId,dossierId:row.dossierId,state:row.state,runAt:row.runAt||null,admittedEvidence:row.admittedEvidence||[],claimResults:row.claimResults||[],requiredLaneIds:row.requiredLaneIds||[],admittedLaneIds:row.admittedLaneIds||[],missingRequiredLanes:row.missingRequiredLanes||[],conflictResults:row.conflictResults||[],rreReadoutRef:row.rreProjection?.readoutReference||null,error:row.error||null}));
const allCandidates=results.flatMap(row=>row.candidates||[]);
const reviewRecords=allCandidates.map(row=>({candidateId:row.candidateId,batchId:row.batchId,dossierId:row.dossierId,scope:row.scope,candidatePositionId:row.candidatePositionId,candidateRole:row.candidateRole,evidenceRefs:row.evidenceRefs,rreReadoutRef:row.rreReadoutRef,grammarRationale:row.grammarRationale,domainRationale:row.domainRationale,supportState:row.supportState,boundaryChecks:['All candidate evidence refs were CWA-admitted in the batch.','All required W7 evidence lanes were admitted before candidate creation.','RRE lineage exists before canonical position mapping.','Candidate is not position admission; humanDecision is still PENDING.'],humanDecision:'PENDING'}));

write('content/civilization-atlas/reconfiguration/runtime-position-w8-current-evidence-admission-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8-CURRENT-EVIDENCE-ADMISSION-v1.0.0',version:'1.0.0',status:results.length?'BATCHES_PROCESSED':'IDLE_NO_PRODUCTION_BATCHES',contract:'content/civilization-atlas/reconfiguration/runtime-position-w8-batch-production-contract-v1.json',records:evidenceRecords});
write('content/civilization-atlas/reconfiguration/runtime-position-w8-rre-candidates-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8-RRE-CANDIDATES-v1.0.0',version:'1.0.0',status:allCandidates.length?'POSITION_HUMAN_REVIEW_READY':(results.length?'NO_CANDIDATES':'IDLE_NO_PRODUCTION_BATCHES'),contract:'content/civilization-atlas/reconfiguration/runtime-position-w8-batch-production-contract-v1.json',candidates:allCandidates});
write('content/civilization-atlas/reconfiguration/runtime-position-w8-position-human-review-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8-POSITION-HUMAN-REVIEW-v1.0.0',version:'1.0.0',status:reviewRecords.length?'READY_FOR_HUMAN_REVIEW':'NO_CANDIDATES_FOR_REVIEW',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8',decisionOptions:['ACCEPT','REJECT','REVISE'],records:reviewRecords});
write('content/civilization-atlas/reconfiguration/runtime-position-w8-status-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8-STATUS-v1.0.0',version:'1.0.0',status:reviewRecords.length?'POSITION_HUMAN_REVIEW_READY':(results.length?'BATCHES_PROCESSED__NO_POSITION_CANDIDATE':'PRODUCTION_PIPELINE_ACTIVE__NO_BATCHES'),work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8',predecessorHumanDecision:'ACCEPTED',completed:{executableBatchPipeline:true,currentWebAuthorityReused:true,realityReadoutEngineReused:true,canonicalPositionMapping:true,positionHumanReviewQueue:true,productionBatches:results.length,admittedCurrentEvidenceClaims:evidenceRecords.reduce((n,row)=>n+(row.admittedEvidence?.length||0),0),runtimePositionCandidates:allCandidates.length,dossiersAutoPopulated:0},boundary:'Pipeline processing never mutates contemporary-runtime-dossiers-v1.json and never creates evidence for dossiers without submitted verifiable source batches.',humanReview:'content/civilization-atlas/reconfiguration/runtime-position-w8-position-human-review-v1.json'});

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const cards=reviewRecords.map(row=>'<article class="card"><h2>'+esc(row.dossierId)+' · '+esc(row.candidatePositionId)+'</h2><p><strong>Candidate:</strong> '+esc(row.candidateId)+'</p><p><strong>Role:</strong> '+esc(row.candidateRole)+'</p><p><strong>Evidence refs:</strong> '+esc(row.evidenceRefs.join(' · '))+'</p><p><strong>RRE:</strong> '+esc(row.rreReadoutRef?.code||'')+'</p><h3>Grammar rationale</h3><p>'+esc(row.grammarRationale)+'</p><h3>Domain rationale</h3><p>'+esc(row.domainRationale)+'</p><ul>'+row.boundaryChecks.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><div class="decision">☐ ACCEPT　 ☐ REJECT　 ☐ REVISE</div></article>').join('');
const empty='<article class="card"><h2>当前没有 Position Candidate</h2><p>这不是缺失错误。只有 production evidence batch 通过 CWA admission、required lane coverage 与 RRE lineage 后，候选才会进入这里。</p></article>';
const html='<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>48 Runtime Position W8 Position Human Review</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;max-width:1100px;margin:0 auto;padding:32px;line-height:1.65;background:#f6f4ef;color:#1f2833}.card{background:#fff;border:1px solid #d8d2c4;border-radius:18px;padding:24px;margin:22px 0}.boundary{padding:12px 14px;background:#f0eee7;border-left:4px solid #8b7b52}.decision{font-weight:700;margin-top:16px;padding-top:14px;border-top:1px solid #ddd}</style></head><body><h1>PHI OS 48 Runtime Position Backbone R1-W8</h1><p>Evidence Batch → CWA Admission → RRE Candidate → Position Human Review</p><div class="boundary"><strong>固定边界：</strong>没有可验证来源，不创建 evidence；required lanes 未齐，不创建 candidate；candidate 未经人工 ACCEPT，不写成 current position；不会为了填满 12 个 dossier 自动造资料。</div>'+(cards||empty)+'<p><code>npm run build:runtime-position-48:w8</code> 后重新打开本页。</p></body></html>';
fs.writeFileSync(path.join(root,'tools/review/PHI-OS-48-RUNTIME-POSITION-W8-POSITION-HUMAN-REVIEW.html'),html);
console.log('PASS runtime-position-48 W8 batch build: batches='+results.length+', admittedEvidence='+evidenceRecords.reduce((n,row)=>n+(row.admittedEvidence?.length||0),0)+', candidates='+allCandidates.length+', dossiersAutoPopulated=0.');
if(results.some(row=>row.state==='BATCH_REJECTED'))process.exitCode=1;
