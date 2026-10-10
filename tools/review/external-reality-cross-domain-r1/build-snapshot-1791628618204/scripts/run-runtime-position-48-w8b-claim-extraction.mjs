import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildW8bClaimWorkOrders,validateW8bClaimIntake,toW8bCwaReadyClaim} from './lib/civilization-atlas/runtime-position-w8b-claim-extraction-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(value,null,2)+'\n');

const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w8b-claim-extraction-contract-v1.json');
const sources=read('content/civilization-atlas/reconfiguration/runtime-position-w8a-validated-sources-v1.json');
const intake=read('content/civilization-atlas/reconfiguration/runtime-position-w8b-claim-intake-v1.json');
const currentWork=read('content/civilization-atlas/reconfiguration/runtime-position-w8b-claim-work-orders-v1.json');
const workOrders=buildW8bClaimWorkOrders({validatedSources:sources});
const result=validateW8bClaimIntake({intake,validatedSources:sources,contract});
const claimIdsByWork=new Map();
for(const row of result.records){
  const key=row.sourceLineage.intakeId+'::'+row.laneId;
  if(!claimIdsByWork.has(key))claimIdsByWork.set(key,[]);
  claimIdsByWork.get(key).push(row.claimCandidateId);
}
const projected=workOrders.map(row=>({...row,claimCandidateIds:claimIdsByWork.get(row.intakeId+'::'+row.laneId)||[],state:(claimIdsByWork.get(row.intakeId+'::'+row.laneId)||[]).length?'CLAIM_CANDIDATE_AVAILABLE':'CLAIM_REQUIRED'}));
const direct=result.records.filter(x=>x.supportLevel==='DIRECT');
const partial=result.records.filter(x=>x.supportLevel==='PARTIAL');
const cwaReadyRecords=result.records.map(toW8bCwaReadyClaim);

write('content/civilization-atlas/reconfiguration/runtime-position-w8b-claim-work-orders-v1.json',{...currentWork,status:projected.length?'ACTIVE':'IDLE_NO_VALIDATED_SOURCES',counts:{validatedSources:(sources.records||[]).length,claimWorkOrders:projected.length},workOrders:projected});
write('content/civilization-atlas/reconfiguration/runtime-position-w8b-validated-claims-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8B-VALIDATED-CLAIMS-v1.0.0',version:'1.0.0',status:result.records.length?'CLAIM_CANDIDATES_VALIDATED':'IDLE_NO_CLAIM_INTAKE',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8B',contract:'content/civilization-atlas/reconfiguration/runtime-position-w8b-claim-extraction-contract-v1.json',records:result.records,rejected:result.rejected});
write('content/civilization-atlas/reconfiguration/runtime-position-w8b-cwa-ready-claims-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8B-CWA-READY-CLAIMS-v1.0.0',version:'1.0.0',status:cwaReadyRecords.length?'READY_FOR_CWA_ADMISSION':'IDLE_NO_VALIDATED_CLAIMS',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8B',contract:'content/civilization-atlas/reconfiguration/runtime-position-w8b-claim-extraction-contract-v1.json',records:cwaReadyRecords,boundary:'CWA-ready means structurally ready for Current Web Authority evaluation. It does not mean admitted evidence.'});
write('content/civilization-atlas/reconfiguration/runtime-position-w8b-status-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8B-STATUS-v1.0.0',version:'1.0.0',status:result.records.length?'CLAIM_EXTRACTION_IN_PROGRESS':'CLAIM_EXTRACTION_ACTIVE__NO_CLAIMS',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8B',completed:{validatedSources:(sources.records||[]).length,claimWorkOrders:projected.length,claimIntakeRecords:(intake.claims||[]).length,validatedClaimCandidates:result.records.length,rejectedClaimCandidates:result.rejected.length,directClaimCandidates:direct.length,partialClaimCandidates:partial.length,cwaReadyClaims:cwaReadyRecords.length,admittedEvidenceClaims:0,w8EvidenceBatchesMutated:0,runtimePositionCandidates:0,dossiersAutoPopulated:0},next:'Send CWA-ready claims through Current Web Authority in R1-W8C. Do not treat them as admitted evidence yet.',reviewHtml:'tools/review/PHI-OS-48-RUNTIME-POSITION-W8B-CLAIM-EXTRACTION.html'});

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rows=result.records.map(x=>'<tr><td>'+esc(x.claimCandidateId)+'</td><td>'+esc(x.dossierId)+'</td><td>'+esc(x.laneId)+'</td><td>'+esc(x.claimType)+'</td><td>'+esc(x.supportLevel)+'</td><td>'+esc(x.sourceId)+'</td><td>'+esc(x.sourceLocator.type+': '+x.sourceLocator.value)+'</td><td>'+esc(x.claimText)+'</td></tr>').join('');
const html='<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>R1-W8B Current Evidence Claim Extraction</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;max-width:1400px;margin:0 auto;padding:32px;line-height:1.6;background:#f6f4ef;color:#1f2833}.card{background:#fff;border:1px solid #d8d2c4;border-radius:18px;padding:22px;margin:20px 0}.boundary{padding:12px 14px;background:#f0eee7;border-left:4px solid #8b7b52}table{border-collapse:collapse;width:100%;font-size:.92rem}th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}</style></head><body><h1>R1-W8B｜CURRENT EVIDENCE CLAIM EXTRACTION</h1><p>Validated Source → Source-bounded Claim → Locator Validation → CWA-ready Handoff</p><div class="boundary"><strong>Authority boundary:</strong> Claim candidate ≠ admitted evidence ≠ CURRENT_DATA. W8B does not call RRE and does not create a runtime position.</div><div class="card"><p><strong>Sources:</strong> '+(sources.records||[]).length+'　<strong>Work orders:</strong> '+projected.length+'　<strong>Validated claims:</strong> '+result.records.length+'　<strong>Rejected:</strong> '+result.rejected.length+'　<strong>DIRECT:</strong> '+direct.length+'　<strong>PARTIAL:</strong> '+partial.length+'</p></div>'+(result.records.length?'<table><thead><tr><th>Claim</th><th>Dossier</th><th>Lane</th><th>Type</th><th>Support</th><th>Source</th><th>Locator</th><th>Claim text</th></tr></thead><tbody>'+rows+'</tbody></table>':'<div class="card"><h2>当前没有 Claim Candidate</h2><p>这是正确的 fail-closed baseline：W8A 还没有 validated source，因此 W8B 不生成任何 claim。</p></div>')+'</body></html>';
fs.writeFileSync(path.join(root,'tools/review/PHI-OS-48-RUNTIME-POSITION-W8B-CLAIM-EXTRACTION.html'),html);
console.log('PASS runtime-position-48 W8B claim extraction: validatedSources='+(sources.records||[]).length+', workOrders='+projected.length+', validatedClaims='+result.records.length+', cwaReady='+cwaReadyRecords.length+', admittedEvidence=0.');
