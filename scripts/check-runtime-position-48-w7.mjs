import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const ok=(value,code)=>{if(!value)throw new Error('RUNTIME_POSITION_48_W7:'+code);};

const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w7-contract-v1.json');
const readiness=read('content/civilization-atlas/reconfiguration/runtime-position-w7-readiness-v1.json');
const admission=read('content/civilization-atlas/reconfiguration/runtime-position-w7-current-evidence-admission-v1.json');
const candidates=read('content/civilization-atlas/reconfiguration/runtime-position-w7-position-candidates-v1.json');
const dossiers=read('content/civilization-atlas/reconfiguration/contemporary-runtime-dossiers-v1.json');
const review=read('content/civilization-atlas/reconfiguration/runtime-position-w7-human-review-v1.json');
const status=read('content/civilization-atlas/reconfiguration/runtime-position-w7-status-v1.json');
const manifest=read('content/civilization-atlas/reconfiguration/atlas-manifest-v2.json');
const crosswalk=read('content/registry/runtime-position-48-crosswalk-v1.json');

ok(contract.owners?.sourceAdmission==='CURRENT_WEB_AUTHORITY','SOURCE_OWNER');
ok(contract.owners?.derivedReadout==='REALITY_READOUT_ENGINE','RRE_OWNER');
ok(readiness.dossiers?.length===(dossiers.dossiers||[]).length,'DOSSIER_COUNT');
ok((admission.records||[]).length===0,'EVIDENCE_PREPOPULATED');
ok((candidates.candidates||[]).length===0,'CANDIDATES_PREPOPULATED');

for(const row of readiness.dossiers||[]){
  ok(row.state==='NOT_STARTED','STATE_'+row.dossierId);
  const required=(row.sourceLaneRequirements||[]).filter(x=>x.requiredForPositionCandidate);
  ok(required.length>0,'LANES_'+row.dossierId);
  ok(required.every(x=>(x.admittedEvidenceRefs||[]).length===0),'REFS_'+row.dossierId);
  ok((row.candidatePositions||[]).length===0,'POSITION_'+row.dossierId);
  ok((row.derivedDimensions||[]).every(x=>x.state==='BLOCKED_PENDING_ADMITTED_EVIDENCE'),'DERIVED_'+row.dossierId);
}

ok(review.status==='READY_FOR_HUMAN_REVIEW','REVIEW_STATUS');
ok(review.records?.length===3,'REVIEW_COUNT');
ok((review.records||[]).every(x=>x.humanDecision==='PENDING'),'REVIEW_DECISION');
ok(status.status==='MACHINE_CLOSED__HUMAN_REVIEW_READY','STATUS');
ok(manifest.registryRefs?.runtimePositionW7Readiness,'MANIFEST');
ok(crosswalk.w7?.humanDecision==='PENDING','CROSSWALK');

const loader=text('assets/js/pages/civilization-atlas/atlas-data.js');
const renderer=text('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
const ask=text('functions/_lib/atlas-retrieval-scope.js');
ok(loader.includes('runtime-position-w7-readiness-v1.json'),'LOADER');
ok(renderer.includes('Current-evidence admission readiness'),'RENDERER');
ok(ask.includes('CIVILIZATION_ATLAS_EVIDENCE_ADMISSION_READINESS'),'ASK');

console.log('PASS runtime-position-48 W7: readiness is wired and current evidence remains fail-closed.');
