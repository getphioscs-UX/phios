import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const review=read('content/civilization-atlas/reconfiguration/runtime-position-w8e-human-review-v1.json');
const decisionsPath='content/civilization-atlas/reconfiguration/dossier-us-w8f-human-decisions-v1.json';
const decisions=fs.existsSync(decisionsPath)?read(decisionsPath):{records:[]};
const positions=read('content/registry/runtime-position-48-v1.json');
const dm=new Map((decisions.records||[]).map(x=>[x.derivationId,x]));
const posMap=new Map((positions.positions||[]).map(x=>[x.grammarId+'::'+x.realityDomainId,x]));
const records=[],blocked=[];
for(const r of review.records||[]){
 if(r.dossierId!=='DOSSIER-US')continue;
 const d=dm.get(r.derivationId);
 if(d?.decision!=='ACCEPT'){blocked.push({derivationId:r.derivationId,state:d?.decision||'PENDING_W8F_HUMAN_DECISION'});continue;}
 const p=posMap.get(r.grammarId+'::'+r.realityDomainId);
 if(!p)throw Error('CANONICAL_RP_PAIR_NOT_FOUND:'+r.derivationId);
 records.push({candidateId:'US-'+p.id+'-'+r.derivationId,dossierId:'DOSSIER-US',scope:r.scope,subsystem:r.subsystem||null,grammarId:r.grammarId,realityDomainId:r.realityDomainId,runtimePositionId:p.id,shortLabel:p.shortLabel,evidenceRefs:r.evidenceRefs,readoutReference:r.readoutReference,sourceDerivationId:r.derivationId,w8fDecisionReference:decisionsPath,candidateState:'POSITION_HUMAN_REVIEW_REQUIRED',humanDecision:'PENDING'});
}
write('content/civilization-atlas/reconfiguration/dossier-us-w8g-rp-candidates-v1.json',{schemaVersion:'PHI-OS-DOSSIER-US-W8G-RP-CANDIDATES-v1.0.0',status:records.length?'RP_CANDIDATES_READY':'BLOCKED_BY_W8F_HUMAN_ACCEPT',dossierId:'DOSSIER-US',stage:'W8-G',records,blocked,boundary:'RP mapping is deterministic from ACCEPTED grammar/domain pairs. Candidate generation is not position admission.'});
console.log(JSON.stringify({status:records.length?'RP_CANDIDATES_READY':'BLOCKED_BY_W8F_HUMAN_ACCEPT',candidates:records.length,blocked:blocked.length},null,2));