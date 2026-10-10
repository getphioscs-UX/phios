import fs from 'node:fs/promises';
import path from 'node:path';
import { digest, serialize } from './canonical-brief-v2.mjs';

export const PROMPT_SCHEMA_VERSION='PHI-OS-PRODUCTION-PROMPT-v1.0.0';
export const PROMPT_PACKAGE_TYPE='canonical_article_production_prompt';
export const TEMPLATE_PATH='content/knowledge/production/prompts/templates/zh-hans-canonical-article-prompt-v1.md';
const fail=(code,message)=>Object.assign(new Error(`${code}: ${message}`),{code});
const list=items=>(items||[]).map((item,index)=>`${index+1}. ${typeof item==='string'?item:(item.requirement||item.label||'')}`).filter(x=>!x.endsWith('. ')).join('\n');
const terms=items=>(items||[]).map(term=>`- ${term.termCode}: ${term['zh-Hans']} (${term.en})`).join('\n')||'- No controlled term is required by this Brief.';
const style=[
  '采用中文出版书籍风格，形成连续、完整、可独立阅读的长段叙事。',
  '以哲学与系统论的解释强度推进，不使用宣传语、口号或英文翻译腔。',
  '避免连续短句、项目符号式正文和重复总结；优先使用自然衔接的段落。',
  '清楚区分机制解释、事实陈述、理论资格与责任边界。',
  '不得添加个案诊断、个人建议、服务推荐或未经 Brief 授权的新结论。',
  '结尾自然连接下一 Canonical Node，但不得代写下一节点的完整内容。'
];
function replaceAll(template,values){return Object.entries(values).reduce((text,[key,value])=>text.replaceAll(`{{${key}}}`,value),template);}
export function promptWithoutDigest(value){const copy=structuredClone(value);delete copy.promptPackageDigest;return copy;}
export function computePromptPackageDigest(value){return digest(promptWithoutDigest(value));}
export async function buildZhHansProductionPrompt(root,brief){
  if(brief?.briefType!=='canonical_article_production_brief')throw fail('PROMPT_BRIEF_TYPE_INVALID',String(brief?.briefType));
  if(brief?.locale!=='zh-Hans')throw fail('PROMPT_LOCALE_INVALID',String(brief?.locale));
  const template=await fs.readFile(path.join(root,TEMPLATE_PATH),'utf8');
  const next=(brief.canonicalMeaning?.relationships?.nextNodeCodes||[]).join(', ');
  const renderedPrompt=replaceAll(template,{
    nodeCode:brief.nodeCode,
    canonicalTitle:brief.canonicalMeaning.canonicalTitle,
    canonicalQuestion:brief.canonicalMeaning.canonicalQuestion,
    centralThesis:brief.canonicalMeaning.centralThesis,
    mustEstablish:list(brief.articleBoundary.mustEstablish),
    requiredDistinctions:list(brief.articleBoundary.requiredDistinctions),
    includedScope:list(brief.articleBoundary.includedScope),
    excludedScope:list(brief.articleBoundary.excludedScope),
    mustNotClaim:list(brief.articleBoundary.mustNotClaim),
    terminology:terms(brief.terminologyProjection.terms),
    writingStyle:list(style),
    continuity:next?`The article must end by naturally opening the question represented by ${next}, without resolving that next node in advance.`:'No next Canonical Node is declared; close the article without inventing a continuation.'
  });
  const payload={
    promptPackageType:PROMPT_PACKAGE_TYPE,
    promptSchemaVersion:PROMPT_SCHEMA_VERSION,
    promptCode:`PROMPT-${brief.nodeCode}-ZH-HANS-V1`,
    nodeCode:brief.nodeCode,
    locale:'zh-Hans',
    sourceBrief:{briefCode:brief.briefCode,briefSchemaVersion:brief.briefSchemaVersion,briefDigest:brief.briefDigest,repositoryCommit:brief.repositoryCommit},
    writerRole:'canonical_article_writer',
    writingContract:{language:'zh-Hans',format:'continuous_publishing_prose',style,outputMode:'article_body_only'},
    renderedPrompt
  };
  return {...payload,promptPackageDigest:computePromptPackageDigest(payload)};
}
export function validateZhHansProductionPrompt(prompt,brief){
  const errors=[];const add=(code,message)=>errors.push({code,message});
  if(!prompt||typeof prompt!=='object'||Array.isArray(prompt))return {valid:false,errors:[{code:'PROMPT_NOT_OBJECT',message:'Prompt Package must be an object.'}]};
  if(prompt.promptPackageType!==PROMPT_PACKAGE_TYPE)add('PROMPT_TYPE_INVALID',String(prompt.promptPackageType));
  if(prompt.promptSchemaVersion!==PROMPT_SCHEMA_VERSION)add('PROMPT_SCHEMA_VERSION_INVALID',String(prompt.promptSchemaVersion));
  if(prompt.locale!=='zh-Hans')add('PROMPT_LOCALE_INVALID',String(prompt.locale));
  if(prompt.promptCode!==`PROMPT-${prompt.nodeCode}-ZH-HANS-V1`)add('PROMPT_CODE_INVALID',String(prompt.promptCode));
  if(prompt.writerRole!=='canonical_article_writer')add('PROMPT_WRITER_ROLE_INVALID',String(prompt.writerRole));
  if(prompt.writingContract?.outputMode!=='article_body_only')add('PROMPT_OUTPUT_MODE_INVALID',String(prompt.writingContract?.outputMode));
  if(typeof prompt.renderedPrompt!=='string'||prompt.renderedPrompt.length<500)add('PROMPT_RENDERED_CONTENT_TOO_SHORT','renderedPrompt');
  for(const marker of ['## Canonical Thesis','## The Article Must Establish','## Required Distinctions','## Included Scope','## Excluded Scope','## Prohibited Claims','## Controlled Terminology','## Writing Style','## Output Requirement'])if(!prompt.renderedPrompt?.includes(marker))add('PROMPT_SECTION_MISSING',marker);
  for(const forbidden of ['candidateDigest','promptPackageDigest','write_registry','change_approval','publish_article','record_human_review'])if(prompt.renderedPrompt?.includes(forbidden))add('PROMPT_OPERATIONAL_FIELD_EXPOSED',forbidden);
  if(!/^[a-f0-9]{64}$/.test(prompt.promptPackageDigest||''))add('PROMPT_DIGEST_FORMAT_INVALID',String(prompt.promptPackageDigest));
  else if(prompt.promptPackageDigest!==computePromptPackageDigest(prompt))add('PROMPT_DIGEST_INVALID','promptPackageDigest');
  if(brief){
    if(prompt.nodeCode!==brief.nodeCode)add('PROMPT_NODE_MISMATCH',String(prompt.nodeCode));
    for(const key of ['briefCode','briefSchemaVersion','briefDigest','repositoryCommit'])if(prompt.sourceBrief?.[key]!==brief[key])add('PROMPT_BRIEF_BINDING_MISMATCH',key);
    for(const phrase of [brief.canonicalMeaning.canonicalTitle,brief.canonicalMeaning.canonicalQuestion,brief.canonicalMeaning.centralThesis])if(!prompt.renderedPrompt.includes(phrase))add('PROMPT_CANONICAL_MEANING_MISSING',phrase);
  }
  return {valid:errors.length===0,errors,nodeCode:prompt.nodeCode,locale:prompt.locale,promptPackageDigest:prompt.promptPackageDigest};
}
export { serialize };
