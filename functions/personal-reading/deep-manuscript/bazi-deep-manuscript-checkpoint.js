import {ALL_UNITS,VERSIONS,digest,unitKey,assertUnits,deepFreeze} from './bazi-deep-manuscript-contract.js';
export function createBaziCheckpoint({candidateId,orderId=null,experimentId=null,subjectId,pack,model}){
 if(!candidateId||!subjectId||(!orderId&&!experimentId))throw Error('BDM_CHECKPOINT_IDENTITY_REQUIRED');
 return {version:VERSIONS.checkpoint,candidateId,orderId,experimentId,subjectId,authorityDigest:pack.authorityDigest,timingDigest:pack.timingDigest,realityDigest:pack.realityDigest,promptVersion:VERSIONS.prompt,schemaVersion:VERSIONS.schema,model,units:{},ledger:[],batchesAttempted:[],state:'AUTHORITY_READY',standardRecoveryCallsUsed:0,deliveryRescueCalls:0,transportRetries:0};
}
export function assertCheckpointLineage(cp,pack){if(cp.version!==VERSIONS.checkpoint||cp.authorityDigest!==pack.authorityDigest||cp.timingDigest!==pack.timingDigest||cp.realityDigest!==pack.realityDigest||cp.promptVersion!==VERSIONS.prompt||cp.schemaVersion!==VERSIONS.schema)throw Error('BDM_CHECKPOINT_LINEAGE_MISMATCH');}
export function guardBaziPaidUnitRequest(cp,units,recovery=false){
 assertUnits(units);if(cp.inFlight)throw Error('BDM_INFLIGHT_RECONCILIATION_REQUIRED');
 if(units.some(u=>cp.units[unitKey(u.sectionId,u.locale)]?.completionStatus==='COMPLETE'))throw Error(recovery?'RECOVERY_SCOPE_VIOLATION':'DUPLICATE_PAID_UNIT_REQUEST');
}
export function unresolvedBaziUnits(cp){return ALL_UNITS.filter(u=>cp.units[unitKey(u.sectionId,u.locale)]?.completionStatus!=='COMPLETE');}
export async function commitBaziCompleteUnits(cp,inspection,receipt){
 for(const u of inspection.units){if(u.status!=='COMPLETE')continue;const key=unitKey(u.sectionId,u.locale),hash=await digest(u.manuscript),previous=cp.units[key];
  if(previous){if(previous.manuscriptDigest!==hash)throw Error('BDM_HEALTHY_UNIT_IMMUTABLE');continue;}
  cp.units[key]={...u,completionStatus:'COMPLETE',manuscriptDigest:hash,authorityDigest:cp.authorityDigest,timingDigest:cp.timingDigest,realityDigest:cp.realityDigest,promptVersion:cp.promptVersion,schemaVersion:cp.schemaVersion,model:cp.model,orderId:cp.orderId,experimentId:cp.experimentId,subjectId:cp.subjectId,batchId:receipt.batchId,requestId:receipt.requestId,inputTokens:receipt.inputTokens,cachedInputTokens:receipt.cachedInputTokens,outputTokens:receipt.outputTokens,cost:receipt.cost,createdAt:receipt.createdAt};
 }
 cp.lastUnresolved=inspection.units.filter(u=>u.status!=='COMPLETE').map(({sectionId,locale,reason})=>({sectionId,locale,reason}));return cp;
}
export async function freezeBaziManuscript(cp,pack){
 assertCheckpointLineage(cp,pack);if(unresolvedBaziUnits(cp).length)throw Error('BDM_MANUSCRIPT_INCOMPLETE');
 for(const u of Object.values(cp.units))if(await digest(u.manuscript)!==u.manuscriptDigest)throw Error('BDM_CHECKPOINT_INTEGRITY');
 const sections=[...new Set(ALL_UNITS.map(u=>u.sectionId))].map(sectionId=>({sectionId,zhHansManuscript:cp.units[unitKey(sectionId,'zh-Hans')].manuscript,enManuscript:cp.units[unitKey(sectionId,'en')].manuscript,unitDigests:{'zh-Hans':cp.units[unitKey(sectionId,'zh-Hans')].manuscriptDigest,en:cp.units[unitKey(sectionId,'en')].manuscriptDigest}}));
 const snapshot={version:'BDM-MANUSCRIPT-SNAPSHOT-1',candidateId:cp.candidateId,orderId:cp.orderId,experimentId:cp.experimentId,subjectId:cp.subjectId,method:'BAZI',authorityDigest:pack.authorityDigest,timingDigest:pack.timingDigest,realityDigest:pack.realityDigest,versions:VERSIONS,model:cp.model,subject:pack.subject,actualExperimentCost:cp.ledger.reduce((n,r)=>n+(r.cost||0),0),usageComplete:cp.ledger.every(r=>r.usageStatus==='RECORDED'),normalProviderCalls:cp.ledger.filter(r=>r.callType==='NORMAL').length,standardTechnicalRecoveryCalls:cp.standardRecoveryCallsUsed,deliveryRescueCalls:cp.deliveryRescueCalls,sections,usage:structuredClone(cp.ledger),fixture:cp.ledger.some(r=>r.fixture===true),generatedAt:cp.ledger.at(-1)?.createdAt||null};snapshot.digest=await digest(snapshot);return deepFreeze(snapshot);
}
