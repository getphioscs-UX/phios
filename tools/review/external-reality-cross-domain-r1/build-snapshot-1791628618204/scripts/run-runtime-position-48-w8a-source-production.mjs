import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateW8aSourceIntake} from './lib/civilization-atlas/runtime-position-w8a-source-production-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(value,null,2)+'\n');
const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w8a-source-production-contract-v1.json');
const readiness=read('content/civilization-atlas/reconfiguration/runtime-position-w7-readiness-v1.json');
const workOrders=read('content/civilization-atlas/reconfiguration/runtime-position-w8a-source-work-orders-v1.json');
const intake=read('content/civilization-atlas/reconfiguration/runtime-position-w8a-source-intake-v1.json');
const result=validateW8aSourceIntake({intake,readiness,contract});
const sourceByLane=new Map();
for(const row of result.records){
  for(const laneId of row.targetLanes){
    const key=row.dossierId+'::'+laneId;
    if(!sourceByLane.has(key))sourceByLane.set(key,[]);
    sourceByLane.get(key).push(row.intakeId);
  }
}
const projected=(workOrders.workOrders||[]).map(row=>({...row,candidateIntakeIds:sourceByLane.get(row.dossierId+'::'+row.laneId)||[],state:(sourceByLane.get(row.dossierId+'::'+row.laneId)||[]).length?'SOURCE_CANDIDATE_AVAILABLE':'SOURCE_REQUIRED'}));
const required=projected.filter(x=>x.requiredForPositionCandidate),optional=projected.filter(x=>!x.requiredForPositionCandidate);
const requiredCovered=required.filter(x=>x.candidateIntakeIds.length).length,optionalCovered=optional.filter(x=>x.candidateIntakeIds.length).length;
const dossierIds=[...new Set(projected.map(x=>x.dossierId))];
const dossiersComplete=dossierIds.filter(id=>required.filter(x=>x.dossierId===id).every(x=>x.candidateIntakeIds.length)).length;
write('content/civilization-atlas/reconfiguration/runtime-position-w8a-source-work-orders-v1.json',{...workOrders,workOrders:projected});
write('content/civilization-atlas/reconfiguration/runtime-position-w8a-validated-sources-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A-VALIDATED-SOURCES-v1.0.0',version:'1.0.0',status:result.records.length?'SOURCE_CANDIDATES_VALIDATED':'IDLE_NO_SOURCE_INTAKE',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A',contract:'content/civilization-atlas/reconfiguration/runtime-position-w8a-source-production-contract-v1.json',records:result.records,rejected:result.rejected});
write('content/civilization-atlas/reconfiguration/runtime-position-w8a-status-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A-STATUS-v1.0.0',version:'1.0.0',status:result.records.length?'SOURCE_PRODUCTION_IN_PROGRESS':'SOURCE_PRODUCTION_ACTIVE__NO_SOURCES',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A',completed:{dossierSourcePlans:dossierIds.length,totalSourceWorkOrders:projected.length,requiredSourceWorkOrders:required.length,optionalSourceWorkOrders:optional.length,sourceIntakeRecords:(intake.sources||[]).length,validatedSources:result.records.length,rejectedSources:result.rejected.length,requiredWorkOrdersCovered:requiredCovered,optionalWorkOrdersCovered:optionalCovered,dossiersWithAllRequiredSourceLanes:dossiersComplete,claimsGenerated:0,w8EvidenceBatchesMutated:0,dossiersAutoPopulated:0},next:'Inspect source candidates and continue to R1-W8B claim extraction. Source validation here is structural, not CWA admission.',reviewHtml:'tools/review/PHI-OS-48-RUNTIME-POSITION-W8A-SOURCE-PRODUCTION.html'});
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const groups=dossierIds.map(id=>{const rows=projected.filter(x=>x.dossierId===id),req=rows.filter(x=>x.requiredForPositionCandidate),opt=rows.filter(x=>!x.requiredForPositionCandidate);return '<article class="card"><h2>'+esc(id)+'</h2><p><strong>Required source lanes:</strong> '+req.filter(x=>x.candidateIntakeIds.length).length+' / '+req.length+'</p><p><strong>Optional source lanes:</strong> '+opt.filter(x=>x.candidateIntakeIds.length).length+' / '+opt.length+'</p><table><thead><tr><th>Lane</th><th>Priority</th><th>State</th><th>Sources</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+esc(x.laneId)+'</td><td>'+esc(x.priority)+'</td><td>'+esc(x.state)+'</td><td>'+esc(x.candidateIntakeIds.join(' · ')||'—')+'</td></tr>').join('')+'</tbody></table></article>';}).join('');
const html='<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>R1-W8A Current Evidence Source Production</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;max-width:1200px;margin:0 auto;padding:32px;line-height:1.6;background:#f6f4ef;color:#1f2833}.card{background:#fff;border:1px solid #d8d2c4;border-radius:18px;padding:22px;margin:20px 0}.boundary{padding:12px 14px;background:#f0eee7;border-left:4px solid #8b7b52}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}code{overflow-wrap:anywhere}</style></head><body><h1>R1-W8A｜CURRENT EVIDENCE SOURCE PRODUCTION</h1><p>Source Work Order → Source Candidate Intake → Structural Validation → W8B Handoff</p><div class="boundary"><strong>Authority boundary:</strong> Source candidate ≠ fact ≠ claim ≠ admitted evidence. W8A does not mutate the W8 evidence batch and does not produce runtime positions.</div><p><strong>Validated sources:</strong> '+result.records.length+'　<strong>Rejected:</strong> '+result.rejected.length+'　<strong>Required coverage:</strong> '+requiredCovered+' / '+required.length+'</p>'+groups+'</body></html>';
fs.writeFileSync(path.join(root,'tools/review/PHI-OS-48-RUNTIME-POSITION-W8A-SOURCE-PRODUCTION.html'),html);
console.log('PASS runtime-position-48 W8A source production: workOrders='+projected.length+', required='+required.length+', validatedSources='+result.records.length+', requiredCovered='+requiredCovered+', W8EvidenceBatchMutated=0.');
