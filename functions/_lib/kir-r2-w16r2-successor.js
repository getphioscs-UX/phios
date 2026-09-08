import {runKirR2Pipeline} from './kir-r2-intelligence.js';
import {createKirR2ModelGateway,kirR2ModelGatewayEnabled} from './kir-r2-model-gateway.js';
const clean=v=>String(v??'').normalize('NFKC').trim();
function hasUnexpectedScript(text){for(const ch of clean(text)){if(!/\p{L}/u.test(ch))continue;if(/\p{Script=Han}|\p{Script=Latin}/u.test(ch))continue;return true}return false;}
function evidenceCorpus(question,evidencePack){const rows=[...(evidencePack?.primaryEvidence||[]),...(evidencePack?.supportingEvidence||[])];return clean([question,...rows.map(x=>x?.text)].filter(Boolean).join('\n')).toLowerCase();}
function hasUnexpectedLatin(text,{locale='zh-Hans',question='',evidencePack=null}={}){
  if(locale!=='zh-Hans')return false;
  const corpus=evidenceCorpus(question,evidencePack);
  const allow=new Set(['ai','phi','os']);
  for(const m of clean(text).matchAll(/[A-Za-z][A-Za-z0-9-]*/g)){
    const token=m[0].toLowerCase();
    if(allow.has(token))continue;
    if(corpus.includes(token))continue;
    return true;
  }
  return false;
}
function hasModelArtifact(text){const t=clean(text);return /(?:^|\s)(?:-?reasoning|analysis|assistant|final)\b/i.test(t)||/\bE\d+(?:\s*,\s*E\d+){1,}\b/.test(t)||/_[\p{L}\p{N}]{2,16}\s*$/u.test(t);}
function hasUnsupportedHighRiskExpansion(text,{question='',evidencePack=null}={}){
  const t=clean(text);const corpus=evidenceCorpus(question,evidencePack);
  const riskyTerms=['大脑','神经生理','灾难化','压抑','抑郁','创伤','诊断','症状'];
  if(riskyTerms.some(term=>t.includes(term)&&!corpus.includes(term)))return true;
  const selfDiagnostic=[/识别自己.{0,18}卡在/u,/自己当前.{0,18}卡在/u,/你当前.{0,18}卡在/u,/建议你/u,/你可以先/u,/应该先/u];
  if(selfDiagnostic.some(r=>r.test(t)&&!r.test(corpus)))return true;
  const strongNovel=[/只能通过.{0,28}(?:被迫|显现|现身)/u,/反而会更.{0,24}(?:清晰|明显|容易|强烈)/u,/最终只(?:会)?(?:留|剩)/u,/并未消失.{0,36}(?:隐性|需求|残余)/u];
  if(strongNovel.some(r=>r.test(t)&&!r.test(corpus)))return true;
  return false;
}

function hasUnsupportedNovelCausalTerm(text,{question='',evidencePack=null}={}){
  const t=clean(text);const corpus=evidenceCorpus(question,evidencePack);
  const riskyTerms=['未被处理的张力','张力','相互竞争','彼此竞争','迟疑','后悔','未走之路','收尾不干净','未表达的余量','连续动力','被推开的部分','重新冒出来'];
  return riskyTerms.some(term=>t.includes(term)&&!corpus.includes(term));
}
export function guardKirR2ModelBackedAnswer({understanding,answer,baseGuard,question='',evidencePack=null}={}){
  const text=clean(answer?.text);
  const internal=/(?:\bKIR(?:-R2)?\b|\bKAP(?:-W\d+)?\b|\bRuntime\b|\bEvidence Pack\b|\bcanonical(?: node)?\b|\bregistry\b|\bbenchmark\b|\bgovernance\b|groundingBundle|provider routing)/i.test(text);
  const metaTemplate=/根据(?:系统|PHI OS)?框架(?:的)?(?:理解|解释)|前一(?:层|状态|环节).{0,16}(?:后一|下一)(?:层|状态|环节).{0,16}(?:输入|条件)|这个问题首先指向|strongest grounded match/i.test(text);
  const wrongScript=hasUnexpectedScript(text);
  const unexpectedLatin=hasUnexpectedLatin(text,{locale:understanding?.locale,question,evidencePack});
  const modelArtifact=hasModelArtifact(text);
  const unsupportedExpansion=hasUnsupportedHighRiskExpansion(text,{question,evidencePack});
  const unsupportedNovelCausal=hasUnsupportedNovelCausalTerm(text,{question,evidencePack});
  const excessiveHeading=(text.match(/(?:^|\n)\s*(?:\d+[.、]|第[一二三四五六七八九十]+[、：:]|\*\*[^*]+\*\*)/g)||[]).length>=5;
  const lengthOk=understanding?.locale==='zh-Hans'?text.length>=80:text.length>=120;
  const passed=baseGuard?.passed===true&&lengthOk&&!internal&&!metaTemplate&&!wrongScript&&!unexpectedLatin&&!modelArtifact&&!unsupportedExpansion&&!unsupportedNovelCausal&&!excessiveHeading;
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-W16R2A-MODEL-BACKED-ANSWER-GUARD-v1.0.0',BASE_SEMANTIC_GUARD_PASSED:baseGuard?.passed===true,CUSTOMER_LANGUAGE_LENGTH_OK:lengthOk,NO_INTERNAL_TERMINOLOGY_LEAK:!internal,NO_KNOWLEDGE_CHAIN_META_TEMPLATE:!metaTemplate,NO_UNEXPECTED_SCRIPT_CONTAMINATION:!wrongScript,NO_UNEXPECTED_LATIN_LEAK:!unexpectedLatin,NO_MODEL_ARTIFACT_LEAK:!modelArtifact,NO_UNSUPPORTED_HIGH_RISK_EXPANSION:!unsupportedExpansion,NO_UNSUPPORTED_NOVEL_CAUSAL_TERM:!unsupportedNovelCausal,NO_EXCESSIVE_NODE_STYLE_HEADINGS:!excessiveHeading,passed});
}
export async function runKirR2W16R2Successor({question,locale='zh-Hans',profiles,groundingBundle=null,articleSources=[],allowedContext=null,upstreamGroundedAnswer=null,env={},fetcher=globalThis.fetch,provider=null}={}){
  if(!kirR2ModelGatewayEnabled(env)&&!provider)return {status:'KIR_R2_W16R2_GATEWAY_DISABLED',applied:false};
  const primaryProvider=provider||createKirR2ModelGateway({env,fetcher});
  let first;
  try{first=await runKirR2Pipeline({question,locale,profiles,groundingBundle,articleSources,allowedContext,upstreamGroundedAnswer,provider:primaryProvider});}
  catch(error){return {status:'KIR_R2_W16R2_PROVIDER_ERROR',applied:false,errorCode:error?.code||String(error?.message||'KIR_R2_W16R2_PROVIDER_ERROR')}}
  const firstGuard=guardKirR2ModelBackedAnswer({understanding:first.understanding,answer:first.answer,baseGuard:first.guard,question,evidencePack:first.evidencePack});
  if(firstGuard.passed)return {status:'KIR_R2_W16R2_APPLIED',applied:true,result:first,successorGuard:firstGuard,escalated:false,attempts:1};
  const alreadyDeep=first.answer?.providerMeta?.providerId==='DEEPSEEK_V4_FLASH';
  if(alreadyDeep||!clean(env.DEEPSEEK_API_KEY))return {status:'KIR_R2_W16R2_GUARD_REJECTED',applied:false,result:first,successorGuard:firstGuard,escalated:false,attempts:1};
  let second;try{second=await runKirR2Pipeline({question,locale,profiles,groundingBundle,articleSources,allowedContext,upstreamGroundedAnswer,provider:createKirR2ModelGateway({env,fetcher,forceProvider:'DEEPSEEK_V4_FLASH'})});}
  catch(error){return {status:'KIR_R2_W16R2_ESCALATION_ERROR',applied:false,result:first,successorGuard:firstGuard,errorCode:error?.code||String(error?.message||'KIR_R2_W16R2_ESCALATION_ERROR'),escalated:true,attempts:2}}
  const secondGuard=guardKirR2ModelBackedAnswer({understanding:second.understanding,answer:second.answer,baseGuard:second.guard,question,evidencePack:second.evidencePack});
  return {status:secondGuard.passed?'KIR_R2_W16R2_APPLIED_AFTER_ESCALATION':'KIR_R2_W16R2_GUARD_REJECTED_AFTER_ESCALATION',applied:secondGuard.passed,result:second,successorGuard:secondGuard,firstAttempt:{providerMeta:first.answer?.providerMeta||null,guard:firstGuard},escalated:true,attempts:2};
}
