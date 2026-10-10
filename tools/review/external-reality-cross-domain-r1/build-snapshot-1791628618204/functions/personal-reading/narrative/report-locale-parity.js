import {deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

export const REPORT_LOCALE_PARITY_VERSION='PHI-OS-RNT2-LOCALE-PARITY-v1.0.0';
function arr(v){return Array.isArray(v)?v:[];}
function set(v){return new Set(arr(v).map(String));}
function sameSet(a,b){if(a.size!==b.size)return false;for(const x of a)if(!b.has(x))return false;return true;}
function indexByClaim(brief){return new Map(arr(brief?.claims).map(c=>[String(c.claimId),c]));}

export function verifyReportLocaleParity({zhBrief,enBrief,zhCandidate=null,enCandidate=null}={}){
 const reasons=[];
 if(zhBrief?.locale!=='zh-Hans'||enBrief?.locale!=='en')reasons.push('LOCALE_BINDING_MISMATCH');
 if(zhBrief?.sectionKey!==enBrief?.sectionKey||zhBrief?.methodId!==enBrief?.methodId)reasons.push('SECTION_IDENTITY_MISMATCH');
 const zh=indexByClaim(zhBrief),en=indexByClaim(enBrief);
 if(!sameSet(new Set(zh.keys()),new Set(en.keys())))reasons.push('CLAIM_SET_MISMATCH');
 for(const id of new Set([...zh.keys(),...en.keys()])){
  const a=zh.get(id),b=en.get(id);if(!a||!b)continue;
  if(a.role!==b.role)reasons.push('ROLE_MISMATCH:'+id);
  if(a.certainty!==b.certainty)reasons.push('CERTAINTY_MISMATCH:'+id);
  if(!sameSet(set(a.sourceRefs),set(b.sourceRefs)))reasons.push('SOURCE_LINEAGE_MISMATCH:'+id);
  for(const key of ['rank','direction','license','conditions','counterweights','timing','openConditions','boundaries'])if(JSON.stringify(a[key]??null)!==JSON.stringify(b[key]??null))reasons.push('SEMANTIC_SCOPE_MISMATCH:'+id+':'+key);
  if(!sameSet(set(a.semanticOperators),set(b.semanticOperators)))reasons.push('OPERATOR_MISMATCH:'+id);
  if(arr(a.conditions).length!==arr(b.conditions).length)reasons.push('CONDITION_COUNT_MISMATCH:'+id);
  if(arr(a.counterweights).length!==arr(b.counterweights).length)reasons.push('COUNTERWEIGHT_COUNT_MISMATCH:'+id);
  if(arr(a.timing).length!==arr(b.timing).length)reasons.push('TIMING_COUNT_MISMATCH:'+id);
 }
 const candidateParity=(!zhCandidate&&!enCandidate)?'NOT_RUN':(zhCandidate&&enCandidate?'PRESENT_BOTH':'MISSING_ONE_LOCALE');
 if(candidateParity==='MISSING_ONE_LOCALE')reasons.push('CANDIDATE_LOCALE_MISSING');
 if(candidateParity==='NOT_RUN')reasons.push('CANDIDATE_PARITY_NOT_RUN');
 if(zhCandidate&&enCandidate){
  const zhRoles=set(arr(zhCandidate.blocks).map(x=>x.role)),enRoles=set(arr(enCandidate.blocks).map(x=>x.role));
  if(!sameSet(zhRoles,enRoles))reasons.push('CANDIDATE_ROLE_SET_MISMATCH');
  if(!sameSet(set(arr(zhCandidate.blocks).flatMap(x=>arr(x.claimRefs))),set(arr(enCandidate.blocks).flatMap(x=>arr(x.claimRefs)))))reasons.push('CANDIDATE_CLAIM_SET_MISMATCH');
  if(zhCandidate.sourceBriefDigest!==zhBrief.briefSemanticDigest||enCandidate.sourceBriefDigest!==enBrief.briefSemanticDigest)reasons.push('CANDIDATE_SOURCE_DIGEST_MISMATCH');
 }
 return deepFreeze({schemaVersion:REPORT_LOCALE_PARITY_VERSION,accepted:reasons.length===0,claimParity:reasons.every(x=>!x.includes('CLAIM_')&&!x.includes('OPERATOR_')&&!x.includes('CERTAINTY_')&&!x.includes('CONDITION_')&&!x.includes('COUNTERWEIGHT_')&&!x.includes('TIMING_')),candidateParity,reasons});
}

export default Object.freeze({verifyReportLocaleParity});
