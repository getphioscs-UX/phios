import {sha256Stable} from '../zi-wei-runtime/zwr-utils.js';
export const ZIWEI_PATTERN_RUNTIME_SCHEMA='PHI-OS-ZIWEI-PATTERN-RUNTIME-v1.0.0';
export const ZIWEI_PATTERN_RUNTIME_VERSION='1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function star(comb,code){for(const p of comb.palaceCombinations){const s=p.stars.find(x=>x.starCode===code);if(s)return s;}return null;}
function palace(comb,code){return comb.palaceCombinations.find(x=>x.palaceCode===code)||null;}
function network(comb,code){return comb.networks.find(x=>x.targetPalaceCode===code)||null;}
function samePalaceOf(comb,codes,palaceCode=null){const ps=palaceCode?[palace(comb,palaceCode)].filter(Boolean):comb.palaceCombinations;for(const p of ps)if(codes.every(c=>p.starCodes.includes(c)))return p;return null;}
function evalPredicate(pred,comb){
 switch(pred.type){
  case 'SAME_PALACE_STARS':{const p=samePalaceOf(comb,pred.starCodes,pred.palaceCode||null);if(!p)return {matched:false};if(pred.branches&&!pred.branches.includes(p.branch))return {matched:false};return {matched:true,evidence:{type:pred.type,palaceCode:p.palaceCode,branch:p.branch,starCodes:pred.starCodes}};}
  case 'STAR_IN_PALACE':{const s=star(comb,pred.starCode);const ok=s?.palaceCode===pred.palaceCode;return {matched:ok,evidence:ok?{type:pred.type,starCode:pred.starCode,palaceCode:pred.palaceCode}:null};}
  case 'STAR_IN_PALACE_BRANCH':{const s=star(comb,pred.starCode),p=palace(comb,pred.palaceCode);const ok=s?.palaceCode===pred.palaceCode&&p?.branch===pred.branch;return {matched:ok,evidence:ok?{type:pred.type,starCode:pred.starCode,palaceCode:pred.palaceCode,branch:pred.branch}:null};}
  case 'STAR_STATE_IN':{const s=star(comb,pred.starCode);const code=s?.state?.stateCode;const ok=Boolean(code&&pred.stateCodes.includes(code));return {matched:ok,evidence:ok?{type:pred.type,starCode:pred.starCode,stateCode:code}:null};}
  case 'FLANK_STARS_AROUND_PALACE':{const n=network(comb,pred.palaceCode);if(!n)return {matched:false};const a=n.flanks.previous.starCodes,b=n.flanks.next.starCodes,[x,y]=pred.starCodes;const direct=a.includes(x)&&b.includes(y),reverse=pred.unordered!==false&&a.includes(y)&&b.includes(x),ok=direct||reverse;return {matched:ok,evidence:ok?{type:pred.type,palaceCode:pred.palaceCode,previousPalaceCode:n.flanks.previous.palaceCode,nextPalaceCode:n.flanks.next.palaceCode,starCodes:pred.starCodes,orientation:direct?'DIRECT':'REVERSED'}:null};}
  case 'NETWORK_HAS_STARS':{const n=network(comb,pred.palaceCode);if(!n)return {matched:false};const pool=new Set([...(pred.includeTarget===false?[]:n.targetStarCodes),...(pred.includeOpposite===false?[]:n.opposite.starCodes),...(pred.includeTriads===false?[]:n.triads.flatMap(x=>x.starCodes))]);const ok=pred.starCodes.every(x=>pool.has(x));return {matched:ok,evidence:ok?{type:pred.type,palaceCode:pred.palaceCode,starCodes:pred.starCodes}:null};}
  case 'TRANSFORMATIONS_IN_NETWORK':{const n=network(comb,pred.palaceCode);if(!n)return {matched:false};const pool=new Set([...(n.targetStarCodes||[]),...(n.opposite.starCodes||[]),...n.triads.flatMap(x=>x.starCodes)]);const layer=pred.layer||'NATAL';const found=comb.transformationBindings.flatMap(x=>x.bindings.filter(b=>b.layer===layer&&pool.has(x.starCode)).map(b=>({starCode:x.starCode,...b})));const codes=new Set(found.map(x=>x.transformationCode));const ok=pred.transformationCodes.every(x=>codes.has(x));return {matched:ok,evidence:ok?{type:pred.type,palaceCode:pred.palaceCode,layer,transformations:found.filter(x=>pred.transformationCodes.includes(x.transformationCode))}:null};}
  default: fail(`ZIWEI_FP_W8_UNKNOWN_PATTERN_PREDICATE:${pred.type}`);
 }
}
function evaluateAlternative(alt,comb){const evidence=[];for(const pred of alt.predicates||[]){const r=evalPredicate(pred,comb);if(!r.matched)return {matched:false,evidence:[]};if(r.evidence)evidence.push(r.evidence);}return {matched:true,evidence};}
function evaluateRule(rule,comb){for(let i=0;i<(rule.alternatives||[]).length;i++){const r=evaluateAlternative(rule.alternatives[i],comb);if(r.matched){let optionalEvidence=null;if(rule.optionalEvidence){const o=evalPredicate(rule.optionalEvidence,comb);optionalEvidence=o.matched?o.evidence:null;}return {matched:true,alternativeIndex:i,evidence:r.evidence,optionalEvidence};}}return {matched:false,alternativeIndex:null,evidence:[],optionalEvidence:null};}
function structuralCandidates(comb){const out=[];for(const p of comb.palaceCombinations){if(p.mainStarCount>=2)out.push(freeze({candidateType:'MULTI_MAIN_STAR_SAME_PALACE',palaceCode:p.palaceCode,branch:p.branch,starCodes:p.mainStarCodes,traditionalPatternCode:null}));if(p.mainStarCount===0)out.push(freeze({candidateType:'EMPTY_MAIN_STAR_PALACE',palaceCode:p.palaceCode,branch:p.branch,oppositeMainStarReference:comb.networks.find(n=>n.targetPalaceCode===p.palaceCode)?.oppositeMainStarReference||[],traditionalPatternCode:null}));}
 for(const x of comb.transformationBindings){if(new Set(x.bindings.map(b=>b.layer)).size>1)out.push(freeze({candidateType:'SAME_STAR_TRANSFORMATION_ACROSS_LAYERS',starCode:x.starCode,palaceCode:x.palaceCode,layers:[...new Set(x.bindings.map(b=>b.layer))],traditionalPatternCode:null}));}
 return out;
}
export function evaluateZiweiPatterns({combinations,patternRuleRegistry=null,executionMode='PRODUCTION'}={}){
 if(combinations?.schemaVersion!=='PHI-OS-ZIWEI-STAR-COMBINATION-RUNTIME-v1.0.0')fail('ZIWEI_FP_W8_STAR_COMBINATION_REQUIRED');
 let rules=[];let ruleState='NO_ADMITTED_TRADITIONAL_RULESET';let sourceBatch=null;
 if(patternRuleRegistry){
   const admitted=patternRuleRegistry.admissionState==='HUMAN_ADMITTED';const testOnly=executionMode==='INTERNAL_VALIDATION'&&patternRuleRegistry.admissionState==='TEST_ONLY';
   if(!admitted&&!testOnly)fail('ZIWEI_FP_W8_PATTERN_RULES_NOT_ADMITTED');
   rules=patternRuleRegistry.rules||[];ruleState=admitted?'ADMITTED_TRADITIONAL_RULESET_ACTIVE':'TEST_ONLY_RULESET_ACTIVE';sourceBatch=patternRuleRegistry.sourceBatchId||null;
 }
 const traditionalPatterns=[];for(const rule of rules){const r=evaluateRule(rule,combinations);if(r.matched)traditionalPatterns.push(freeze({patternCode:rule.patternCode,labelZh:rule.labelZh||rule.patternCode,ruleVersion:rule.ruleVersion||'1.0.0',sourceClaimId:rule.sourceClaimId||null,alternativeIndex:r.alternativeIndex,evidence:r.evidence,optionalEvidence:r.optionalEvidence,qualificationStatus:executionMode==='INTERNAL_VALIDATION'&&patternRuleRegistry.admissionState==='TEST_ONLY'?'TEST_ONLY_MATCH':'STRUCTURALLY_QUALIFIED_BY_ADMITTED_RULE'}));}
 const candidates=structuralCandidates(combinations);
 const base={schemaVersion:ZIWEI_PATTERN_RUNTIME_SCHEMA,work:'ZIWEI-FP-W8',runtimeVersion:ZIWEI_PATTERN_RUNTIME_VERSION,scopeCode:'REGISTRY_DRIVEN_TRADITIONAL_PATTERN_MATCHER_V1',sourceCombinationDigest:combinations.combinationDigest,ruleState,sourceBatchId:sourceBatch,traditionalPatterns,structuralCandidates:candidates,coverage:{activeRuleCount:rules.length,traditionalMatchCount:traditionalPatterns.length,structuralCandidateCount:candidates.length,predicateTypes:['SAME_PALACE_STARS','STAR_IN_PALACE','STAR_IN_PALACE_BRANCH','STAR_STATE_IN','FLANK_STARS_AROUND_PALACE','NETWORK_HAS_STARS','TRANSFORMATIONS_IN_NETWORK']},boundaries:{pendingSourceClaimsExecuted:false,structuralCandidateIsTraditionalPattern:false,patternOutcomeMeaningCreated:false,numericPatternStrengthCreated:false,goodBadConclusionCreated:false,fortunePredictionCreated:false,professionalJudgmentCreated:false,customerInterpretationCreated:false,customerCutoverAllowed:false}};
 return freeze({...base,patternDigest:sha256Stable(base)});
}
export default Object.freeze({evaluateZiweiPatterns});
