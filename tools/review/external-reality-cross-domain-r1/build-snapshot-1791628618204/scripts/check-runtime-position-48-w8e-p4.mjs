import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const ok=(v,c)=>{if(!v)throw new Error('RUNTIME_POSITION_48_W8E_P4:'+c);};
const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w8e-p4-human-review-contract-v1.json');
const decision=read('content/civilization-atlas/reconfiguration/runtime-position-w8e-p4-human-decision-v1.json');
const status=read('content/civilization-atlas/reconfiguration/runtime-position-w8e-p4-status-v1.json');
ok(contract.status==='ACTIVE_SUBSYSTEM_HUMAN_REVIEW','CONTRACT');
ok(contract.boundaries?.dossierGlobalPromotionAllowed===false&&contract.boundaries?.runtimePositionCandidateAllowed===false,'BOUNDARY');
ok((decision.decisions||[]).every(x=>['ACCEPT','REJECT'].includes(x.decision)),'DECISION_VALUE');
ok(status.completed?.dossierGlobalPromotions===0&&status.completed?.runtimePositionCandidates===0,'AUTHORITY_LEAK');
for(const d of decision.decisions||[]){ok(Boolean(d.candidateId),'DECISION_CANDIDATE');ok(Boolean(String(d.reviewerRole||'').trim()),'DECISION_REVIEWER');}
const html=text('tools/review/PHI-OS-48-RUNTIME-POSITION-W8E-P4-SUBSYSTEM-CONTINUITY.html');
ok(html.includes('SUBSYSTEM CONTINUITY HUMAN REVIEW'),'HTML');
const pkg=text('package.json');ok(pkg.includes('"build:runtime-position-48:w8e:p4"')&&pkg.includes('"check:runtime-position-48:w8e:p4"'),'PACKAGE');
console.log('PASS W8E-P4: subsystem candidates require explicit human ACCEPT/REJECT; no DOSSIER-US or RP promotion is possible here.');
