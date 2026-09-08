import {runKirR2Pipeline} from './kir-r2-intelligence.js';
import {createKirR2ModelGateway,kirR2ModelGatewayEnabled} from './kir-r2-model-gateway.js';
const clean=v=>String(v??'').normalize('NFKC').trim();
function hasUnexpectedScript(text){for(const ch of clean(text)){if(!/\p{L}/u.test(ch))continue;if(/\p{Script=Han}|\p{Script=Latin}/u.test(ch))continue;return true}return false;}
export function guardKirR2ModelBackedAnswer({understanding,answer,baseGuard}={}){
  const text=clean(answer?.text);
  const internal=/(?:\bKIR(?:-R2)?\b|\bKAP(?:-W\d+)?\b|\bRuntime\b|\bEvidence Pack\b|\bcanonical(?: node)?\b|\bregistry\b|\bbenchmark\b|\bgovernance\b|groundingBundle|provider routing)/i.test(text);
  const metaTemplate=/根据(?:系统|PHI OS)?框架(?:的)?(?:理解|解释)|前一(?:层|状态|环节).{0,16}(?:后一|下一)(?:层|状态|环节).{0,16}(?:输入|条件)|这个问题首先指向|strongest grounded match/i.test(text);
  const wrongScript=hasUnexpectedScript(text);
  const excessiveHeading=(text.match(/(?:^|\n)\s*(?:\d+[.、]|第[一二三四五六七八九十]+[、：:]|\*\*[^*]+\*\*)/g)||[]).length>=5;
  const lengthOk=understanding?.locale==='zh-Hans'?text.length>=80:text.length>=120;
  const passed=baseGuard?.passed===true&&lengthOk&&!internal&&!metaTemplate&&!wrongScript&&!excessiveHeading;
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-W16R2-MODEL-BACKED-ANSWER-GUARD-v1.0.0',BASE_SEMANTIC_GUARD_PASSED:baseGuard?.passed===true,CUSTOMER_LANGUAGE_LENGTH_OK:lengthOk,NO_INTERNAL_TERMINOLOGY_LEAK:!internal,NO_KNOWLEDGE_CHAIN_META_TEMPLATE:!metaTemplate,NO_UNEXPECTED_SCRIPT_CONTAMINATION:!wrongScript,NO_EXCESSIVE_NODE_STYLE_HEADINGS:!excessiveHeading,passed});
}
export async function runKirR2W16R2Successor({question,locale='zh-Hans',profiles,groundingBundle=null,articleSources=[],allowedContext=null,upstreamGroundedAnswer=null,env={},fetcher=globalThis.fetch,provider=null}={}){
  if(!kirR2ModelGatewayEnabled(env)&&!provider)return {status:'KIR_R2_W16R2_GATEWAY_DISABLED',applied:false};
  const primaryProvider=provider||createKirR2ModelGateway({env,fetcher});
  let first;
  try{first=await runKirR2Pipeline({question,locale,profiles,groundingBundle,articleSources,allowedContext,upstreamGroundedAnswer,provider:primaryProvider});}
  catch(error){return {status:'KIR_R2_W16R2_PROVIDER_ERROR',applied:false,errorCode:error?.code||String(error?.message||'KIR_R2_W16R2_PROVIDER_ERROR')}}
  const firstGuard=guardKirR2ModelBackedAnswer({understanding:first.understanding,answer:first.answer,baseGuard:first.guard});
  if(firstGuard.passed)return {status:'KIR_R2_W16R2_APPLIED',applied:true,result:first,successorGuard:firstGuard,escalated:false,attempts:1};
  const alreadyDeep=first.answer?.providerMeta?.providerId==='DEEPSEEK_V4_FLASH';
  if(alreadyDeep||!clean(env.DEEPSEEK_API_KEY))return {status:'KIR_R2_W16R2_GUARD_REJECTED',applied:false,result:first,successorGuard:firstGuard,escalated:false,attempts:1};
  let second;try{second=await runKirR2Pipeline({question,locale,profiles,groundingBundle,articleSources,allowedContext,upstreamGroundedAnswer,provider:createKirR2ModelGateway({env,fetcher,forceProvider:'DEEPSEEK_V4_FLASH'})});}
  catch(error){return {status:'KIR_R2_W16R2_ESCALATION_ERROR',applied:false,result:first,successorGuard:firstGuard,errorCode:error?.code||String(error?.message||'KIR_R2_W16R2_ESCALATION_ERROR'),escalated:true,attempts:2}}
  const secondGuard=guardKirR2ModelBackedAnswer({understanding:second.understanding,answer:second.answer,baseGuard:second.guard});
  return {status:secondGuard.passed?'KIR_R2_W16R2_APPLIED_AFTER_ESCALATION':'KIR_R2_W16R2_GUARD_REJECTED_AFTER_ESCALATION',applied:secondGuard.passed,result:second,successorGuard:secondGuard,firstAttempt:{providerMeta:first.answer?.providerMeta||null,guard:firstGuard},escalated:true,attempts:2};
}
