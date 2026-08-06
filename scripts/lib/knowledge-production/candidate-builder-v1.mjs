import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildCandidateTemplate, validateZhHansCandidate } from './zh-hans-candidate-v1.mjs';
import { validateZhHansProductionPrompt } from './production-prompt-v1.mjs';
import { serialize } from './canonical-brief-v2.mjs';
const fail=(code,message)=>Object.assign(new Error(`${code}: ${message}`),{code});
const exists=file=>fs.access(file).then(()=>true,()=>false);
export function extractSectionHeadings(markdown){return markdown.split(/\r?\n/).map(x=>x.match(/^#{2,4}\s+(.+)$/)?.[1]?.trim()).filter(Boolean);}
export function inferTerminology(prompt,markdown){const terms=[];for(const line of prompt.renderedPrompt.split(/\r?\n/)){const m=line.match(/^-\s+(TERM-\d+):\s+(.+?)\s+\(/);if(m&&markdown.includes(m[2]))terms.push(m[1]);}return [...new Set(terms)];}
export function buildCandidateRegistryRecord(candidate,prompt){return {candidateCode:candidate.candidateCode,nodeCode:candidate.nodeCode,locale:candidate.locale,candidateVersion:'1.0.0',candidateDigest:candidate.candidateDigest,promptCode:prompt.promptCode,promptPackageDigest:prompt.promptPackageDigest,briefCode:candidate.sourceBrief.briefCode,briefDigest:candidate.sourceBrief.briefDigest,state:candidate.candidateState,review:'not_reviewed',approval:'not_approved',publication:'not_published'};}
export async function buildCandidateFromPrompt(root,{prompt,brief,markdown,title,summary,candidateState='draft',producer='ChatGPT manual session'}){
 const pv=validateZhHansProductionPrompt(prompt,brief);if(!pv.valid)throw fail('PROMPT_PACKAGE_INVALID',JSON.stringify(pv.errors));
 if(prompt.nodeCode!==brief.nodeCode||prompt.sourceBrief.briefDigest!==brief.briefDigest)throw fail('PROMPT_BRIEF_BINDING_INVALID',prompt.nodeCode);
 const bodyMarkdown=markdown.trim();if(bodyMarkdown.length<200)throw fail('CANDIDATE_MARKDOWN_TOO_SHORT',String(bodyMarkdown.length));
 const candidate=buildCandidateTemplate(brief,{title:title||brief.canonicalMeaning.canonicalTitle,summary,bodyMarkdown,sectionHeadings:extractSectionHeadings(bodyMarkdown),terminologyTermsUsed:inferTerminology(prompt,bodyMarkdown),producer:`${producer}; prompt=${prompt.promptPackageDigest}`,candidateState});
 const validation=await validateZhHansCandidate(root,candidate,{briefPath:null});if(!validation.valid)throw fail('BUILT_CANDIDATE_INVALID',JSON.stringify(validation.errors));
 return {candidate,registryRecord:buildCandidateRegistryRecord(candidate,prompt)};
}
export async function registerCandidateProjection(root,record,{apply=false}={}){
 const rel='content/knowledge/production/registry/candidate-registry.json';const file=path.join(root,rel);const registry=JSON.parse(await fs.readFile(file,'utf8'));
 if(registry.records.some(x=>x.candidateCode===record.candidateCode))throw fail('CANDIDATE_REGISTRY_RECORD_EXISTS',record.candidateCode);
 const next={...registry,records:[...registry.records,record].sort((a,b)=>a.candidateCode.localeCompare(b.candidateCode))};
 if(apply){const temp=`${file}.tmp-${process.pid}-${crypto.randomUUID()}`;await fs.writeFile(temp,serialize(next),{flag:'wx'});await fs.rename(temp,file);}
 return {mode:apply?'apply':'dry-run',applied:apply,registryPath:rel,record};
}
