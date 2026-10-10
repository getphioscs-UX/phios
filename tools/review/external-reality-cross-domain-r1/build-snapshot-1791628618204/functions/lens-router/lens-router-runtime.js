import {LRR_CAPABILITIES} from './lens-capability-current-v1.js';

export const LRR_TAXONOMY=Object.freeze(['STRUCTURE','TIME','CURRENT','DOMAIN','DECISION','RELATIONSHIP','RHYTHM','REALITY_FACT','PROFESSIONAL']);
const PRECEDENCE=Object.freeze(['PROFESSIONAL','REALITY_FACT','RELATIONSHIP','DECISION','CURRENT','RHYTHM','TIME','DOMAIN','STRUCTURE']);
const SIGNALS=Object.freeze({
 PROFESSIONAL:['diagnose','diagnosis','treatment','dosage','prescription','legal advice','法律意见','诊断','治疗','剂量','处方','医生应该','律师应该','税务意见'],
 REALITY_FACT:['weather','price today','latest news','current law','current regulation','who is the current','what actually happened','天气','今天价格','最新新闻','现行法律','现行法规','实际发生了什么','事实是什么'],
 RELATIONSHIP:['between us','me and my partner','my partner and i','our relationship','with this person','my husband','my wife','my spouse','my boyfriend','my girlfriend','husband','wife','spouse','partner','boyfriend','girlfriend','我和他','我和她','我和伴侣','我们之间','这段关系','两个人之间','我丈夫','我的丈夫','丈夫','老公','我妻子','我的妻子','妻子','老婆','配偶','伴侣','男朋友','女朋友','对象'],
 DECISION:['should i','should we','should i accept','should i leave','which should i choose','decision','decide','该不该','是否应该','要不要','应该选择','怎么决定','这个决定','应该接受','应该离开','应该继续'],
 CURRENT:['right now','currently','at the moment','recently',"today's activation",'current activation','现在','当下','目前','最近','此刻','当前激活'],
 RHYTHM:['rhythm','personal year','personal month','personal day','cycle number','numerology cycle','节奏','个人年','个人月','个人日','数字周期','数秘周期'],
 TIME:['this year','next year','last year','annual','long cycle','luck cycle','period','timing','year ahead','今年','明年','去年','年度','流年','大运','长期周期','时间结构','阶段'],
 DOMAIN:['career domain','wealth domain','partnership domain','family domain','home domain','health domain','life area','事业领域','事业宫','财帛','财富领域','夫妻宫','关系领域','家庭领域','田宅','健康领域','疾厄','人生领域','事业','职业','工作','career','wealth','partnership','family','health'],
 STRUCTURE:['natal','birth structure','core structure','functional structure','how am i structured','出生结构','本命','原局','底层结构','功能结构','我是怎样运作','生命结构','life structure']
});
const COMPOUNDS=Object.freeze([
 {requires:['TIME','DOMAIN'],primary:'TIME',secondary:['DOMAIN']},
 {requires:['CURRENT','DOMAIN'],primary:'CURRENT',secondary:['DOMAIN']},
 {requires:['DECISION','DOMAIN'],primary:'DECISION',secondary:['DOMAIN']},
 {requires:['RHYTHM','TIME'],primary:'RHYTHM',secondary:['TIME']},
 {requires:['DOMAIN','STRUCTURE'],primary:'DOMAIN',secondary:['STRUCTURE']}
]);
const PRIMARY=Object.freeze({
 STRUCTURE:{lensCode:'FUNCTION',pluginCode:'AST',subCapability:'NATAL'},
 TIME:{lensCode:'TIME',pluginCode:'BZR',subCapability:'TEMPORAL'},
 CURRENT:{lensCode:'FUNCTION',pluginCode:'AST',subCapability:'CURRENT_DYNAMIC'},
 DOMAIN:{lensCode:'DOMAIN',pluginCode:'ZWR',subCapability:'NATAL'},
 DECISION:{lensCode:'OPERATION',pluginCode:'HDR',subCapability:'OPERATING_READING',realityEvidenceRequired:true},
 RHYTHM:{lensCode:'RHYTHM',pluginCode:'NUM',subCapability:null}
});
const SECONDARY=Object.freeze({
 STRUCTURE:{lensCode:'FUNCTION',pluginCode:'AST',subCapability:'NATAL',role:'SUPPORTING'},
 TIME:{lensCode:'TIME',pluginCode:'BZR',subCapability:'TEMPORAL',role:'CONTEXTUAL'},
 CURRENT:{lensCode:'FUNCTION',pluginCode:'AST',subCapability:'CURRENT_DYNAMIC',role:'CONTEXTUAL'},
 DOMAIN:{lensCode:'DOMAIN',pluginCode:'ZWR',subCapability:'DYNAMIC_DOMAIN',role:'SUPPORTING'},
 RHYTHM:{lensCode:'RHYTHM',pluginCode:'NUM',subCapability:null,role:'SUPPORTING'}
});
const DEFAULT_SUPPORT=Object.freeze({
 TIME:[{lensCode:'RHYTHM',pluginCode:'NUM',subCapability:null,role:'SUPPORTING'}],
 RHYTHM:[{lensCode:'TIME',pluginCode:'BZR',subCapability:'TEMPORAL',role:'CONTEXTUAL'}]
});
const HDR_INTERNAL_ACCESS=new Set(['GOVERNED_INTERNAL_PROFESSIONAL','GOVERNED_INTERNAL_QA']);
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function normalize(q){return String(q||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();}
function isLatinPhrase(s){return /^[a-z0-9' -]+$/i.test(s);}
function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function matches(text,signal){if(!signal)return false;if(!isLatinPhrase(signal))return text.includes(signal.toLowerCase());const p=escapeRegex(signal.toLowerCase()).replace(/\\ /g,'\\s+');return new RegExp(`(?:^|[^a-z0-9])${p}(?=$|[^a-z0-9])`,'i').test(text);}
function matchedSignals(text,category){return SIGNALS[category].filter(s=>matches(text,s));}
function priorityIndex(code){const i=PRECEDENCE.indexOf(code);return i<0?999:i;}
export function classifyLensQuestion({question,taxonomyHint=null}={}){
 const text=normalize(question);if(taxonomyHint!=null&&!LRR_TAXONOMY.includes(taxonomyHint))throw Object.assign(new Error('LRR_TAXONOMY_HINT_INVALID'),{code:'LRR_TAXONOMY_HINT_INVALID',status:400});
 const evidence={};for(const c of LRR_TAXONOMY){const m=matchedSignals(text,c);if(m.length)evidence[c]=m;}
 const matched=Object.keys(evidence).sort((a,b)=>priorityIndex(a)-priorityIndex(b));
 if(taxonomyHint){const secondary=matched.filter(x=>x!==taxonomyHint).slice(0,2);return freeze({taxonomy:taxonomyHint,secondaryTaxonomy:secondary,classificationState:'CLASSIFIED',classificationAuthority:'EXPLICIT_FROZEN_TAXONOMY_HINT',evidence:freeze({taxonomyHint,matchedSignals:evidence})});}
 if(!text||matched.length===0)return freeze({taxonomy:'NEEDS_CONTEXT',secondaryTaxonomy:[],classificationState:'NEEDS_CONTEXT',classificationAuthority:'DETERMINISTIC_BOUNDED_RULES_V1',evidence:freeze({matchedSignals:{}})});
 // Professional, reality fact and two-person relationship boundaries outrank compound symbolic routing.
 for(const c of ['PROFESSIONAL','REALITY_FACT','RELATIONSHIP'])if(matched.includes(c))return freeze({taxonomy:c,secondaryTaxonomy:matched.filter(x=>x!==c).slice(0,2),classificationState:'CLASSIFIED',classificationAuthority:'DETERMINISTIC_BOUNDED_RULES_V1',evidence:freeze({matchedSignals:evidence})});
 for(const r of COMPOUNDS)if(r.requires.every(x=>matched.includes(x)))return freeze({taxonomy:r.primary,secondaryTaxonomy:r.secondary,classificationState:'CLASSIFIED',classificationAuthority:'DETERMINISTIC_BOUNDED_RULES_V1',evidence:freeze({compound:r.requires.join('_'),matchedSignals:evidence})});
 const primary=matched[0];return freeze({taxonomy:primary,secondaryTaxonomy:matched.filter(x=>x!==primary).slice(0,2),classificationState:'CLASSIFIED',classificationAuthority:'DETERMINISTIC_BOUNDED_RULES_V1',evidence:freeze({matchedSignals:evidence})});
}
export function routePrimaryLens(classification){const t=classification?.taxonomy;if(t==='NEEDS_CONTEXT'||t==='AMBIGUOUS')return freeze({routeState:'NEEDS_CONTEXT',candidate:null});if(t==='RELATIONSHIP')return freeze({routeState:'REQUIRED_RUNTIME_NOT_ACTIVATED',candidate:null,requiredRuntime:'RELATIONAL_RUNTIME'});if(t==='REALITY_FACT')return freeze({routeState:'REALITY_EVIDENCE_ONLY',candidate:null,authority:'REALITY_EVIDENCE'});if(t==='PROFESSIONAL')return freeze({routeState:'PROFESSIONAL_HANDOFF_REQUIRED',candidate:null,authority:'PROFESSIONAL_HANDOFF'});const p=PRIMARY[t];if(!p)throw Object.assign(new Error('LRR_PRIMARY_ROUTE_UNDEFINED'),{code:'LRR_PRIMARY_ROUTE_UNDEFINED'});return freeze({routeState:'CANDIDATE',candidate:freeze({...p,role:'PRIMARY'})});}
export function resolveSupportingLenses(classification,primaryCandidate){const secondary=(classification?.secondaryTaxonomy||[]).map(x=>SECONDARY[x]).filter(Boolean);let chosen=secondary.length?secondary:[...(DEFAULT_SUPPORT[classification?.taxonomy]||[])];chosen=chosen.filter(x=>!(primaryCandidate&&x.pluginCode===primaryCandidate.pluginCode&&x.subCapability===primaryCandidate.subCapability));const seen=new Set();chosen=chosen.filter(x=>{const k=`${x.pluginCode}:${x.subCapability||''}`;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,2);return freeze(chosen.map(x=>freeze({...x})));}
export function gateLensCapability(candidate,{publicRequest=true,internalAccessClass=null}={}){if(!candidate)return freeze({routeState:'BLOCKED_CAPABILITY',allowed:false,reason:'LRR_CANDIDATE_REQUIRED'});const cap=LRR_CAPABILITIES[candidate.pluginCode];if(!cap)return freeze({routeState:'BLOCKED_CAPABILITY',allowed:false,reason:'LRR_CAPABILITY_RECORD_MISSING'});if(cap.lensCode!==candidate.lensCode)return freeze({routeState:'BLOCKED_CAPABILITY',allowed:false,reason:'LRR_LENS_CAPABILITY_MISMATCH'});const sub=candidate.subCapability;if(sub&&cap.subCapabilities[sub]&&cap.subCapabilities[sub]!=='AVAILABLE'&&cap.subCapabilities[sub]!=='AVAILABLE_WITH_MANUAL_INPUT')return freeze({routeState:'BLOCKED_CAPABILITY',allowed:false,reason:'LRR_SUBCAPABILITY_NOT_ACTIVATED',availability:cap.subCapabilities[sub]});if(publicRequest){if(cap.publicCapabilityAvailability!=='AVAILABLE'||cap.publicExecutionAllowed!==true)return freeze({routeState:'BLOCKED_CAPABILITY',allowed:false,reason:'LRR_PUBLIC_CAPABILITY_NOT_AVAILABLE',availability:cap.publicCapabilityAvailability,noSilentFallback:true});return freeze({routeState:'ROUTABLE',allowed:true,visibility:'PUBLIC_PRODUCTION',executionCompleteness:'PER_EXECUTION'});}if(cap.internalCapabilityAvailability!=='AVAILABLE')return freeze({routeState:'BLOCKED_CAPABILITY',allowed:false,reason:'LRR_INTERNAL_CAPABILITY_NOT_AVAILABLE',availability:cap.internalCapabilityAvailability});if(candidate.pluginCode==='HDR'&&!HDR_INTERNAL_ACCESS.has(internalAccessClass))return freeze({routeState:'BLOCKED_CAPABILITY',allowed:false,reason:'LRR_HDR_INTERNAL_ACCESS_REQUIRED',noSilentFallback:true});return freeze({routeState:candidate.pluginCode==='HDR'?'ROUTABLE_INTERNAL_ONLY':'ROUTABLE',allowed:true,visibility:'GOVERNED_INTERNAL',executionCompleteness:'PER_EXECUTION'});}
export function routeLensQuestion({question,taxonomyHint=null,publicRequest=true,internalAccessClass=null}={}){
 const classification=classifyLensQuestion({question,taxonomyHint});const primaryRoute=routePrimaryLens(classification);
 if(primaryRoute.routeState!=='CANDIDATE')return freeze({schemaVersion:'PHI-OS-LENS-ROUTE-PLAN-v1.0.0',question,classification,routeState:primaryRoute.routeState,primary:null,supporting:[],blockedSupporting:[],authority:primaryRoute.authority||null,requiredRuntime:primaryRoute.requiredRuntime||null,boundaries:freeze({methodVotingCreated:false,silentFallbackUsed:false,meaningCreated:false,runtimeExecuted:false,realityEvidenceFinalAuthority:true})});
 const gate=gateLensCapability(primaryRoute.candidate,{publicRequest,internalAccessClass});const supportCandidates=resolveSupportingLenses(classification,primaryRoute.candidate);const supporting=[],blockedSupporting=[];for(const c of supportCandidates){const g=gateLensCapability(c,{publicRequest,internalAccessClass});if(g.allowed)supporting.push(freeze({candidate:c,gate:g}));else blockedSupporting.push(freeze({candidate:c,gate:g}));}
 return freeze({schemaVersion:'PHI-OS-LENS-ROUTE-PLAN-v1.0.0',question,classification,routeState:gate.routeState,primary:freeze({candidate:primaryRoute.candidate,gate}),supporting:freeze(supporting),blockedSupporting:freeze(blockedSupporting),requirements:freeze({realityEvidenceRequired:classification.taxonomy==='DECISION',executionInputsResolved:false}),boundaries:freeze({methodVotingCreated:false,silentFallbackUsed:false,meaningCreated:false,runtimeExecuted:false,realityEvidenceFinalAuthority:true})});
}
