import {SMR_R2_PRIORITY_RULES,SMR_DOMAIN_REGISTRY,SMR_METHOD_PRIORITY_REGISTRY} from './smr-r2-rules.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const cap=(value,max)=>Math.min(value,max);
const clampFloor=(value,floor)=>Math.max(value,floor);
const tokenise=value=>String(value??'').toUpperCase().replace(/[^\p{L}\p{N}_]+/gu,' ').split(/\s+/).filter(token=>token.length>=3);
const normalise=value=>String(value??'').toUpperCase().replace(/[^\p{L}\p{N}]+/gu,'');
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}

function claimSubject(claim){return String(claim.semanticDimension||'').split(':').at(-1)?.toUpperCase()||''}
function claimCorpus(claim){return [claim.semanticDimension,claim.headline,claim.structuralMeaning].filter(Boolean).join(' ').toUpperCase()}
function methodNativeWeight(methodId,claim){
  const weights=SMR_METHOD_PRIORITY_REGISTRY.methods[methodId]||{};
  const subject=claimSubject(claim);
  const matches=Object.entries(weights).filter(([token])=>subject===token||subject.includes(token)||token.includes(subject));
  if(!matches.length)return {weight:0,ref:null};
  matches.sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  return {weight:matches[0][1],ref:`METHOD_NATIVE:${methodId}:${matches[0][0]}`};
}
function domainsForClaim(methodId,claim){
  const corpus=`${claimSubject(claim)} ${claim.claimType||''}`;
  const registry=SMR_DOMAIN_REGISTRY.methodTokens[methodId]||{};
  const matched=SMR_DOMAIN_REGISTRY.order.filter(domain=>list(registry[domain]).some(token=>corpus.includes(token)));
  return matched.length?matched:['CORE_STRUCTURE'];
}
function questionRelevance(customerIntent,domains,claim){
  if(!customerIntent)return {state:'NOT_PROVIDED',intentId:null,score:0,reasonRefs:[],matchedDomains:[]};
  const intentId=String(typeof customerIntent==='object'?(customerIntent.intentId||'OPEN'):'OPEN').toUpperCase();
  const targetDomains=list(SMR_R2_PRIORITY_RULES.intentDomainMap[intentId]);
  const matchedDomains=domains.filter(domain=>targetDomains.includes(domain));
  let score=matchedDomains.length?SMR_R2_PRIORITY_RULES.questionDirectDomainMatch:0;
  const reasonRefs=matchedDomains.length?[`QUESTION_DOMAIN_MATCH:${intentId}:${matchedDomains.join('+')}:${SMR_R2_PRIORITY_RULES.questionDirectDomainMatch}`]:[];
  const prompt=typeof customerIntent==='object'?(customerIntent.prompt||''):String(customerIntent);
  const promptTokens=uniq(tokenise(prompt)).filter(token=>!['UNDERSTAND','EXPLORE','WHERE','EXISTS','WITHOUT','ASSUMING','REALITY','THEMES','PATTERNS'].includes(token));
  const corpus=normalise(`${claim.headline} ${claim.structuralMeaning} ${claim.semanticDimension}`);
  const overlap=promptTokens.filter(token=>corpus.includes(normalise(token))).length;
  const textScore=cap(overlap*SMR_R2_PRIORITY_RULES.questionTextOverlapPerToken,SMR_R2_PRIORITY_RULES.questionTextOverlapCap);
  if(textScore){score+=textScore;reasonRefs.push(`QUESTION_TEXT_OVERLAP:${overlap}:${textScore}`)}
  return {state:score?'RESOLVED_RELEVANT':'RESOLVED_NO_DIRECT_MATCH',intentId,score,reasonRefs,matchedDomains};
}
function classFor(score,claim){
  const t=SMR_R2_PRIORITY_RULES.thresholds;
  if(score>=t.PRIMARY)return 'PRIMARY';
  if(score>=t.SECONDARY)return 'SECONDARY';
  if(score>=t.SUPPORTING)return 'SUPPORTING';
  if(score>=t.CONDITIONAL&&['CONDITION','TRADEOFF','OPEN','TEMPORAL_ACTIVATION'].includes(claim.claimType))return 'CONDITIONAL';
  if(score>=t.CONDITIONAL)return 'SUPPORTING';
  return 'SUPPRESS';
}

export function resolveCustomerPriorities({claimCollection,customerIntent=null}={}){
  if(claimCollection?.schemaVersion!=='PHI-OS-CUSTOMER-READING-CLAIM-IR-COLLECTION-v1.0.0')fail('SMR_R2_CLAIM_COLLECTION_REQUIRED');
  const claims=list(claimCollection.claims);
  if(!claims.length)fail('SMR_R2_PRIORITY_CLAIMS_REQUIRED');
  const evidenceCounts=new Map(),dimensionCounts=new Map();
  for(const claim of claims){
    for(const ref of uniq(claim.evidenceRefs))evidenceCounts.set(ref,(evidenceCounts.get(ref)||0)+1);
    dimensionCounts.set(claim.semanticDimension,(dimensionCounts.get(claim.semanticDimension)||0)+1);
  }
  const resolved=claims.map(claim=>{
    const reasons=[];let score=0;
    const upstream=SMR_R2_PRIORITY_RULES.upstreamPriority[claim.priorityClass]??SMR_R2_PRIORITY_RULES.upstreamPriority.UNSPECIFIED;
    score+=upstream;reasons.push(`UPSTREAM_PRIORITY:${claim.priorityClass||'UNSPECIFIED'}:${upstream}`);
    const methodNative=methodNativeWeight(claim.methodId,claim);if(methodNative.weight){score+=methodNative.weight;reasons.push(`${methodNative.ref}:${methodNative.weight}`)}
    const findingWeight=cap(uniq(claim.findingRefs).length*SMR_R2_PRIORITY_RULES.findingCentralityPerRef,SMR_R2_PRIORITY_RULES.findingCentralityCap);if(findingWeight){score+=findingWeight;reasons.push(`FINDING_CENTRALITY:${findingWeight}`)}
    const evidenceWeight=cap(uniq(claim.evidenceRefs).length*SMR_R2_PRIORITY_RULES.evidenceDensityPerRef,SMR_R2_PRIORITY_RULES.evidenceDensityCap);if(evidenceWeight){score+=evidenceWeight;reasons.push(`EVIDENCE_DENSITY:${evidenceWeight}`)}
    const sharedEvidence=uniq(claim.evidenceRefs).filter(ref=>(evidenceCounts.get(ref)||0)>1).length;
    const sharedWeight=cap(sharedEvidence*SMR_R2_PRIORITY_RULES.sharedEvidencePerRef,SMR_R2_PRIORITY_RULES.sharedEvidenceCap);if(sharedWeight){score+=sharedWeight;reasons.push(`CROSS_FINDING_REINFORCEMENT:${sharedWeight}`)}
    const counterWeight=cap(uniq(claim.counterEvidenceRefs).length*SMR_R2_PRIORITY_RULES.counterEvidencePerRef,SMR_R2_PRIORITY_RULES.counterEvidenceCap);if(counterWeight){score+=counterWeight;reasons.push(`COUNTER_EVIDENCE:${counterWeight}`)}
    const relationWeight=SMR_R2_PRIORITY_RULES.relationImportance[claim.claimType]||0;if(relationWeight){score+=relationWeight;reasons.push(`RELATION_IMPORTANCE:${claim.claimType}:${relationWeight}`)}
    const useful=SMR_R2_PRIORITY_RULES.customerUsefulness[claim.claimType]||0;if(useful){score+=useful;reasons.push(`CUSTOMER_USEFULNESS:${claim.claimType}:${useful}`)}
    const repeatExtra=Math.max(0,(dimensionCounts.get(claim.semanticDimension)||1)-1);
    const repeatPenalty=clampFloor(repeatExtra*SMR_R2_PRIORITY_RULES.semanticRepetitionPenaltyPerExtraClaim,SMR_R2_PRIORITY_RULES.semanticRepetitionPenaltyFloor);if(repeatPenalty){score+=repeatPenalty;reasons.push(`SEMANTIC_REPETITION:${repeatPenalty}`)}
    const domains=domainsForClaim(claim.methodId,claim);
    const relevance=questionRelevance(customerIntent,domains,claim);score+=relevance.score;reasons.push(...relevance.reasonRefs);
    return {...claim,priorityScore:score,priorityClass:classFor(score,claim),priorityReasonRefs:uniq(reasons),questionRelevance:freeze({...relevance}),customerDomains:freeze(domains),priorityMetrics:freeze({methodNativeWeight:methodNative.weight,findingCentralityWeight:findingWeight,evidenceDensityWeight:evidenceWeight,sharedEvidenceCount:sharedEvidence,counterEvidenceWeight:counterWeight,relationWeight,usefulnessWeight:useful,semanticRepetitionPenalty:repeatPenalty,questionRelevanceWeight:relevance.score})};
  }).sort((a,b)=>b.priorityScore-a.priorityScore||a.claimId.localeCompare(b.claimId));
  const firstScreenClaimRefs=resolved.filter(claim=>SMR_R2_PRIORITY_RULES.firstScreen.allowedClasses.includes(claim.priorityClass)).slice(0,SMR_R2_PRIORITY_RULES.firstScreen.maxClaimRefs).map(claim=>claim.claimId);
  return freeze({
    schemaVersion:'PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0',
    methodId:claimCollection.methodId,readingAuthorityRef:claimCollection.readingAuthorityRef,semanticDigest:claimCollection.semanticDigest,
    priorityRuleVersion:SMR_R2_PRIORITY_RULES.schemaVersion,claims:resolved,firstScreenClaimRefs,
    boundary:{deterministic:true,llmPriority:false,rendererPriority:false,paragraphLengthPriority:false,tagCountPriority:false,methodRuntimeRecalculated:false,priorityReasonsRequired:true}
  });
}
