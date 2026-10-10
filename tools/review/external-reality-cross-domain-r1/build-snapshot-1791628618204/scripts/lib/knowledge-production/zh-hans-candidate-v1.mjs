import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildCanonicalBriefV2, serialize, digest } from './canonical-brief-v2.mjs';

export const CANDIDATE_SCHEMA_VERSION='PHI-OS-ZH-HANS-CANONICAL-CANDIDATE-v1.0.0';
export const CANDIDATE_TYPE='canonical_article_candidate';
export const ALLOWED_STATES=Object.freeze(['draft','ready_for_human_review','changes_required']);
const exists=file=>fs.access(file).then(()=>true,()=>false);
const fail=(code,message)=>Object.assign(new Error(`${code}: ${message}`),{code});

function walkForbidden(value,pathName='$',findings=[]) {
  if (Array.isArray(value)) value.forEach((item,index)=>walkForbidden(item,`${pathName}[${index}]`,findings));
  else if (value && typeof value==='object') for (const [key,item] of Object.entries(value)) {
    if (/^(review|approval|publication)(Status|Record|Decision)?$/i.test(key) && !['reviewRecorded','approvalRecorded','publicationRecorded'].includes(key) && pathName !== '$.authority') findings.push(`${pathName}.${key}`);
    walkForbidden(item,`${pathName}.${key}`,findings);
  }
  return findings;
}

export function candidateWithoutDigest(candidate){ const copy=structuredClone(candidate); delete copy.candidateDigest; return copy; }
export function computeCandidateDigest(candidate){ return digest(candidateWithoutDigest(candidate)); }
export function buildCandidateTemplate(brief,{title,summary,bodyMarkdown,sectionHeadings=[],terminologyTermsUsed=[],producer='ChatGPT-assisted independent authoring',candidateState='draft'}={}) {
  const payload={candidateType:CANDIDATE_TYPE,candidateSchemaVersion:CANDIDATE_SCHEMA_VERSION,candidateCode:`CANDIDATE-${brief.nodeCode}-ZH-HANS-V1`,nodeCode:brief.nodeCode,locale:'zh-Hans',sourceBrief:{briefCode:brief.briefCode,briefSchemaVersion:brief.briefSchemaVersion,briefDigest:brief.briefDigest,repositoryCommit:brief.repositoryCommit},authority:{canonicalMeaning:'TL',candidateContent:'candidate_only',humanReview:'not_reviewed',approval:'not_approved',publication:'not_published'},candidateState,article:{title:title??brief.canonicalMeaning.canonicalTitle,summary:summary??'',bodyMarkdown:bodyMarkdown??'',sectionHeadings,terminologyTermsUsed},governance:{registryMutationAllowed:false,canonicalMeaningMutationAllowed:false,reviewRecorded:false,approvalRecorded:false,publicationRecorded:false,localeStatePromotionAllowed:false},provenance:{productionMode:'brief_bound_candidate_authoring',producer,independentLocaleAuthoring:true}};
  return {...payload,candidateDigest:computeCandidateDigest(payload)};
}

export async function validateZhHansCandidate(root,candidate,{briefPath,commit,validateBriefBinding=true}={}) {
  const errors=[],warnings=[];
  const add=(code,message)=>errors.push({code,message});
  if (!candidate || typeof candidate!=='object' || Array.isArray(candidate)) return {valid:false,errors:[{code:'CANDIDATE_NOT_OBJECT',message:'Candidate must be a JSON object.'}],warnings};
  const required=['candidateType','candidateSchemaVersion','candidateCode','nodeCode','locale','sourceBrief','authority','candidateState','article','governance','provenance','candidateDigest'];
  for (const key of required) if (!(key in candidate)) add('CANDIDATE_REQUIRED_FIELD_MISSING',key);
  if(candidate.candidateType!==CANDIDATE_TYPE)add('CANDIDATE_TYPE_INVALID',String(candidate.candidateType));
  if(candidate.candidateSchemaVersion!==CANDIDATE_SCHEMA_VERSION)add('CANDIDATE_SCHEMA_VERSION_INVALID',String(candidate.candidateSchemaVersion));
  if(candidate.locale!=='zh-Hans')add('CANDIDATE_LOCALE_INVALID',String(candidate.locale));
  if(!/^KN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(candidate.nodeCode||''))add('CANDIDATE_NODE_CODE_INVALID',String(candidate.nodeCode));
  if(candidate.candidateCode!==`CANDIDATE-${candidate.nodeCode}-ZH-HANS-V1`)add('CANDIDATE_CODE_INVALID',String(candidate.candidateCode));
  if(!ALLOWED_STATES.includes(candidate.candidateState))add('CANDIDATE_STATE_INVALID',String(candidate.candidateState));
  const article=candidate.article||{};
  if(typeof article.title!=='string'||!article.title.trim())add('CANDIDATE_TITLE_REQUIRED','article.title');
  if(typeof article.summary!=='string'||!article.summary.trim())add('CANDIDATE_SUMMARY_REQUIRED','article.summary');
  if(typeof article.bodyMarkdown!=='string'||article.bodyMarkdown.trim().length<200)add('CANDIDATE_BODY_TOO_SHORT','article.bodyMarkdown must contain at least 200 characters.');
  if(!Array.isArray(article.sectionHeadings))add('CANDIDATE_SECTION_HEADINGS_INVALID','article.sectionHeadings');
  if(!Array.isArray(article.terminologyTermsUsed))add('CANDIDATE_TERMINOLOGY_INVALID','article.terminologyTermsUsed');
  const authority=candidate.authority||{};
  for(const [key,expected] of Object.entries({canonicalMeaning:'TL',candidateContent:'candidate_only',humanReview:'not_reviewed',approval:'not_approved',publication:'not_published'})) if(authority[key]!==expected)add('CANDIDATE_AUTHORITY_INVALID',`${key}:${authority[key]}`);
  const governance=candidate.governance||{};
  for(const key of ['registryMutationAllowed','canonicalMeaningMutationAllowed','reviewRecorded','approvalRecorded','publicationRecorded','localeStatePromotionAllowed']) if(governance[key]!==false)add('CANDIDATE_GOVERNANCE_INVALID',key);
  if(candidate.provenance?.independentLocaleAuthoring!==true)add('CANDIDATE_LOCALE_AUTHORING_INVALID','independentLocaleAuthoring');
  for(const finding of walkForbidden(candidate))add('CANDIDATE_FORBIDDEN_AUTHORITY_FIELD',finding);
  if(!/^[a-f0-9]{64}$/.test(candidate.candidateDigest||''))add('CANDIDATE_DIGEST_FORMAT_INVALID',String(candidate.candidateDigest));
  else if(candidate.candidateDigest!==computeCandidateDigest(candidate))add('CANDIDATE_DIGEST_INVALID','candidateDigest does not match candidate payload.');
  let brief;
  if(validateBriefBinding && briefPath){ brief=JSON.parse(await fs.readFile(briefPath,'utf8')); }
  else if(validateBriefBinding && candidate.nodeCode){ brief=await buildCanonicalBriefV2(root,candidate.nodeCode,{commit:candidate.sourceBrief?.repositoryCommit||commit}); }
  if(brief){
    if(candidate.sourceBrief?.briefCode!==brief.briefCode)add('CANDIDATE_BRIEF_CODE_MISMATCH',String(candidate.sourceBrief?.briefCode));
    if(candidate.sourceBrief?.briefSchemaVersion!==brief.briefSchemaVersion)add('CANDIDATE_BRIEF_SCHEMA_MISMATCH',String(candidate.sourceBrief?.briefSchemaVersion));
    if(candidate.sourceBrief?.briefDigest!==brief.briefDigest)add('CANDIDATE_BRIEF_DIGEST_MISMATCH',String(candidate.sourceBrief?.briefDigest));
    if(candidate.sourceBrief?.repositoryCommit!==brief.repositoryCommit)add('CANDIDATE_BRIEF_COMMIT_MISMATCH',String(candidate.sourceBrief?.repositoryCommit));
    if(candidate.article?.title!==brief.canonicalMeaning?.canonicalTitle)warnings.push({code:'CANDIDATE_TITLE_DIFFERS_FROM_CANONICAL_TITLE',message:'Human review must confirm title variation.'});
    const allowedTerms=new Set((brief.terminologyProjection?.terms||[]).map(term=>term.termCode));
    for(const term of candidate.article?.terminologyTermsUsed||[]) if(!allowedTerms.has(term))add('CANDIDATE_TERM_NOT_IN_BRIEF',term);
  }
  return {valid:errors.length===0,errors,warnings,nodeCode:candidate.nodeCode,locale:candidate.locale,candidateDigest:candidate.candidateDigest,briefDigest:candidate.sourceBrief?.briefDigest,candidateState:candidate.candidateState};
}

export async function importZhHansCandidate(root,candidate,{briefPath,targetRoot=root,apply=false}={}) {
  const validation=await validateZhHansCandidate(root,candidate,{briefPath});
  if(!validation.valid)throw fail('CANDIDATE_IMPORT_REQUIRES_VALID_PACKAGE',validation.errors.map(x=>`${x.code}:${x.message}`).join('; '));
  const relative=path.posix.join('content/knowledge/production/candidates/zh-Hans',candidate.nodeCode,'candidate.v1.json');
  const target=path.join(targetRoot,relative);
  if(await exists(target))throw fail('CANDIDATE_TARGET_EXISTS',relative);
  const report={mode:apply?'apply':'dry-run',applied:false,nodeCode:candidate.nodeCode,locale:'zh-Hans',candidateDigest:candidate.candidateDigest,briefDigest:candidate.sourceBrief.briefDigest,targetPath:relative,registryTouched:false,reviewTouched:false,approvalTouched:false,publicationTouched:false};
  if(apply){ await fs.mkdir(path.dirname(target),{recursive:true}); const temporary=`${target}.tmp-${process.pid}-${crypto.randomUUID()}`; await fs.writeFile(temporary,serialize(candidate),{flag:'wx'}); await fs.rename(temporary,target); report.applied=true; }
  return report;
}
