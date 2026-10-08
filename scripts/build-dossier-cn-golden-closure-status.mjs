import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const get=p=>exists(p)?read(p):null;
const a=get('content/civilization-atlas/reconfiguration/runtime-position-w8a-status-v1.json');
const b=get('content/civilization-atlas/reconfiguration/runtime-position-w8b-status-v1.json');
const c=get('content/civilization-atlas/reconfiguration/runtime-position-w8c-status-v1.json');
const d=get('content/civilization-atlas/reconfiguration/dossier-cn-w8d-observable-features-v1.json');
const e=get('content/civilization-atlas/reconfiguration/runtime-position-w8d-rre-readouts-v1.json');
const f=get('content/civilization-atlas/reconfiguration/dossier-cn-w8f-grammar-domain-candidates-v1.json');
const g=get('content/civilization-atlas/reconfiguration/dossier-cn-w8g-rp-candidates-v1.json');
const h=get('content/civilization-atlas/reconfiguration/dossier-cn-w8h-position-human-review-v1.json');
const i=get('content/civilization-atlas/reconfiguration/dossier-cn-w8i-accepted-current-dossier-v1.json');
const eRecord=(e?.records||[]).find(r=>r.dossierId==='DOSSIER-CN');
const states={
 'W8-A':(a?.completed?.dossiersWithAllRequiredSourceLanes??0)>=2?'COMPLETE':'READY_TO_BUILD',
 'W8-B':(b?.completed?.cwaReadyClaims??0)>=14?'COMPLETE':'READY_TO_BUILD',
 'W8-C':(c?.completed?.admittedEvidenceClaims??0)>=14&&(c?.completed?.rreEligibleEvidence??0)>=14?'COMPLETE':'READY_TO_BUILD',
 'W8-D':d?.status==='REQUIRED_LANES_COMPLETE'&&d?.featureCount===7?'COMPLETE':'READY_TO_BUILD',
 'W8-E':eRecord?.state==='RRE_REQUIRED_LANES_CONSUMED'?'COMPLETE':'READY_TO_BUILD',
 'W8-F':f?.status==='GRAMMAR_DOMAIN_HUMAN_REVIEW_READY'?'HUMAN_REVIEW_REQUIRED':'SEMANTIC_BASIS_REQUIRED',
 'W8-G':g?.status==='RP_CANDIDATES_READY'?'COMPLETE':'BLOCKED_BY_W8F_HUMAN_ACCEPT',
 'W8-H':h?.status==='READY_FOR_HUMAN_REVIEW'?'HUMAN_REVIEW_REQUIRED':h?.status==='ACCEPTED'?'COMPLETE':'BLOCKED_BY_W8G',
 'W8-I':i?.status==='ACCEPTED_CURRENT_DOSSIER'?'COMPLETE':'BLOCKED_BY_W8H_ACCEPT'
};
const completed=Object.entries(states).filter(([,s])=>s==='COMPLETE').map(([k])=>k);
const next=Object.entries(states).find(([,s])=>s!=='COMPLETE')?.[0]||'CLOSED';
const out={schemaVersion:'PHI-OS-DOSSIER-CN-GOLDEN-CLOSURE-STATUS-v1.0.0',dossierId:'DOSSIER-CN',status:states['W8-I']==='COMPLETE'?'GOLDEN_DOSSIER_CLOSED':'GOLDEN_DOSSIER_IN_PROGRESS',stageModel:{'W8-A':'Source Acquisition','W8-B':'Claim Extraction','W8-C':'CWA Admission','W8-D':'Observable Feature Extraction','W8-E':'RRE Derived Reading','W8-F':'Grammar + Domain Candidate Derivation','W8-G':'RP-01–48 Candidate','W8-H':'Position Human Review','W8-I':'Accepted Current Dossier Projection'},states,completedStages:completed,nextStage:next,boundaries:{canonicalPositionAutoAdmission:false,dossierAutoProjection:false,humanReviewRequiredAt:['W8-F','W8-H'],usPositionReuseAllowed:false,semanticBasisMustBeCNLineaged:true}};
fs.writeFileSync('content/civilization-atlas/reconfiguration/dossier-cn-golden-closure-status-v1.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));