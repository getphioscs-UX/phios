import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { loadCanonicalContext, readJson as readRepoJson } from '../knowledge-production/repository-loader.mjs';
import { digest, digestTextSource, serialize } from '../knowledge-production/canonical-brief-v2.mjs';
import { buildEnglishPrompt, validateEnglishPrompt } from '../knowledge-production/english-prompt-v1.mjs';
import { buildEnglishCandidate, compute as computeEnglishCandidateDigest, registryRecord as buildCandidateRegistryRecord } from '../knowledge-production/english-candidate-v1.mjs';
import { PUBLICATION_SCHEMA_VERSION, PUBLICATION_TYPE, computePublicationDigest, validatePublication } from '../knowledge-production/publication-v1.mjs';
import { ensurePublicationAndRegistry } from '../article-simplification/pja-publication-successor-v1.mjs';
import { writeApsPublishedKnowledgeAuthoritySuccessor } from '../article-simplification/published-authority-successor-v1.mjs';
import { buildCprArticleOnlyProjection, buildPublicVisualArticle } from '../article-simplification/publication-orchestrator-v1.mjs';

export const ABL_BASELINE = '25ab44b6d832bc5a1a3ff166d89e2b53c1257b44';
export const ABL_SCHEMA = 'PHI-OS-ABL-BILINGUAL-BATCH-PRODUCTION-v1.0.0';
export const ABL_ROOT = 'content/production/article-simplification/bilingual';
export const ABL_MANIFEST = 'content/knowledge/public/abl-bilingual-release.json';
export const PUBLISHED_CONTENT_MODULE = 'assets/js/knowledge/published-content.js';
export const ALLOWED_IDENTITY_DECISIONS = Object.freeze(['approve_identity','revise_identity','defer','reject']);
export const ALLOWED_REVIEW_DECISIONS = Object.freeze(['accept','changes_required','reject','defer']);
export const ALLOWED_APPROVAL_DECISIONS = Object.freeze(['approve','reject','defer']);
export const ALLOWED_PUBLICATION_DECISIONS = Object.freeze(['publish','defer','do_not_publish']);

const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const normalize = value => String(value ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = value => crypto.createHash('sha256').update(typeof value === 'string' ? normalize(value) : value).digest('hex');
export const stable = value => `${JSON.stringify(value, null, 2)}\n`;
export const hashObject = value => sha(stable(value));
const abs = (root, rel) => path.join(root, rel);
const exists = (root, rel) => fssync.existsSync(abs(root, rel));
export const readJson = async (root, rel) => JSON.parse(normalize(await fs.readFile(abs(root, rel), 'utf8')));
async function atomicWrite(target, text, { replace = false } = {}) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  if (!replace && fssync.existsSync(target)) throw fail('ABL_TARGET_EXISTS', target);
  const temp = `${target}.tmp-${process.pid}-${crypto.randomUUID()}`;
  await fs.writeFile(temp, text, { flag: 'wx' });
  await fs.rename(temp, target);
}
async function ensureJson(root, rel, value) {
  const text = stable(value); const target = abs(root, rel);
  if (fssync.existsSync(target)) {
    const current = normalize(await fs.readFile(target, 'utf8'));
    if (current !== text) throw fail('ABL_OUTPUT_CONFLICT', rel);
    return 'existing_equivalent';
  }
  await atomicWrite(target, text); return 'create';
}
async function ensureText(root, rel, text) {
  const target = abs(root, rel);
  if (fssync.existsSync(target)) {
    const current = normalize(await fs.readFile(target, 'utf8'));
    if (current !== normalize(text)) throw fail('ABL_OUTPUT_CONFLICT', rel);
    return 'existing_equivalent';
  }
  await atomicWrite(target, text); return 'create';
}
function batchDir(batchCode) { return `${ABL_ROOT}/${batchCode}`; }
export function pathsFor(batchCode) {
  const dir = batchDir(batchCode);
  return {
    dir,
    identityProposals: `${dir}/identity-proposals.v1.json`,
    identityDecisions: `${dir}/identity-decisions.v1.json`,
    identityAuthority: `${dir}/locale-identity-authority.v1.json`,
    productionBatch: `${dir}/english-production-batch.v1.json`,
    candidateSubmissions: `${dir}/candidate-submissions.v1.json`,
    reviewBatch: `${dir}/bilingual-review-batch.v1.json`,
    humanDecisions: `${dir}/english-human-decisions.v1.json`,
    decisionBridge: `${dir}/decision-bridge.v1.json`,
    publicationRun: `${dir}/publication-run.v1.json`
  };
}
function sourceBatchPath(batchCode) { return `content/production/article-simplification/batches/${batchCode}/batch-plan.v1.json`; }
function sourcePublicationRunPath(batchCode) { return `content/production/article-simplification/batches/${batchCode}/publication-run.v1.json`; }
function cprPath(nodeCode) { return `content/production/cpr/presentations/PRESENTATION-ARTICLE-${nodeCode}-EN-ABL-v1.json`; }
function visualArticlePath(slug) { return `content/knowledge/public/visual-articles/en/${slug}.json`; }
function candidatePath(nodeCode) { return `content/knowledge/production/candidates/en/${nodeCode}/candidate.v1.json`; }
function reviewPath(nodeCode) { return `content/knowledge/production/reviews/en/${nodeCode}/review.v1.json`; }
function approvalPath(nodeCode) { return `content/knowledge/production/approvals/en/${nodeCode}/approval.v1.json`; }
function briefPath(batchCode,nodeCode) { return `${batchDir(batchCode)}/english-production/${nodeCode}/brief.v1.json`; }
function promptPath(batchCode,nodeCode) { return `${batchDir(batchCode)}/english-production/${nodeCode}/prompt.v1.json`; }
function validDate(value) { return Boolean(value && !Number.isNaN(Date.parse(value))); }
function hasCjk(value) { return /[\u3400-\u9FFF\uF900-\uFAFF]/u.test(String(value ?? '')); }
function titleFromSlug(slug) {
  const minor = new Set(['and','as','at','by','for','from','in','into','of','on','or','the','to','with']);
  return String(slug || '').split('-').filter(Boolean).map((word,index) => index && minor.has(word) ? word : word.charAt(0).toUpperCase()+word.slice(1)).join(' ');
}
function proposalQuestion(slug) { const title = titleFromSlug(slug); return title ? `${title}?` : null; }
function registryMap(registry) { return new Map((registry.records || []).map(record => [record.nodeCode, record])); }

export async function buildAbl1IdentityProposals(root, batchCode) {
  const [batch, l10n] = await Promise.all([readJson(root, sourceBatchPath(batchCode)), readJson(root,'content/knowledge/l10n/multilingual-node-projection-registry.json')]);
  if (batch.work !== 'APS-3') throw fail('ABL1_APS3_BATCH_REQUIRED', batchCode);
  const map = registryMap(l10n);
  const entries = (batch.entries || []).map(entry => {
    const record = map.get(entry.nodeCode); const zh = record?.locales?.['zh-Hans']; const en = record?.locales?.en;
    if (!zh?.slug) throw fail('ABL1_ZH_SAME_ROUTE_SLUG_REQUIRED', entry.nodeCode);
    return {
      batchIndex: entry.batchIndex, nodeCode: entry.nodeCode, bookCode: entry.bookCode, partCode: entry.partCode,
      sourceLocale: 'zh-Hans', targetLocale: 'en',
      sourceIdentity: { displayQuestion: zh.displayQuestion, slug: zh.slug, authority: zh.authority, availability: zh.availability },
      frozenEnglishState: { availability: en?.availability ?? null, authority: en?.authority ?? null, translationMode: en?.translationMode ?? null, displayQuestion: en?.displayQuestion ?? null, slug: en?.slug ?? null },
      proposedEnglishIdentity: {
        displayQuestion: en?.displayQuestion || proposalQuestion(zh.slug),
        slug: zh.slug,
        translationMode: 'independent_authoring',
        availabilityAfterApproval: 'available',
        authorityAfterApproval: 'tl_reviewed_locale_identity_successor',
        stalenessStatusAfterApproval: 'current',
        sameRouteSlugLocked: true
      },
      authorityState: 'CANDIDATE_ONLY_AWAITING_TL_DISCOVERY_REVIEW'
    };
  });
  const payload = { schemaVersion: ABL_SCHEMA, work:'ABL-1', batchCode, baselineCommit:ABL_BASELINE, sourceBatch:{path:sourceBatchPath(batchCode),batchDigest:batch.batchDigest}, status:'AWAITING_TL_IDENTITY_REVIEW', localePair:['zh-Hans','en'], proposalCount:entries.length, entries, governance:{proposalEqualsLocaleAuthority:false, absenceOfReviewMeansApproval:false, sameRouteSlugMayChange:false, zhHansArticleAuthorityInherited:false, articleReviewInherited:false, articleApprovalInherited:false, articlePublicationInherited:false, frozenKnrL10nRegistryMutated:false} };
  return {...payload, proposalDigest:hashObject(payload)};
}
export function buildIdentityDecisionInput(proposals) {
  return {
    schemaVersion:'PHI-OS-ABL-1-IDENTITY-DECISION-INPUT-v1.0.0', work:'ABL-1', batchCode:proposals.batchCode, sourceProposalDigest:proposals.proposalDigest,
    allowedDecisions:[...ALLOWED_IDENTITY_DECISIONS], oneDecisionPerNodeLocale:true,
    entries: proposals.entries.map(entry => ({ nodeCode:entry.nodeCode, locale:'en', proposalDisplayQuestion:entry.proposedEnglishIdentity.displayQuestion, displayQuestion:entry.proposedEnglishIdentity.displayQuestion, sameRouteSlug:entry.proposedEnglishIdentity.slug, decision:null, reviewerCode:null, reviewedAt:null, summary:null })),
    governance:{inputFileEqualsAuthority:false, reviewerMustBeTL:true, sameRouteSlugEditable:false, articleApprovalCreated:false, articlePublicationCreated:false}
  };
}
function identityDecisionStatus(decision, proposal) {
  const errors=[];
  if (!decision || decision.nodeCode!==proposal.nodeCode || decision.locale!=='en') errors.push('IDENTITY_DECISION_BINDING_INVALID');
  if (!decision?.decision) return {state:'pending',errors};
  if (!ALLOWED_IDENTITY_DECISIONS.includes(decision.decision)) errors.push('IDENTITY_DECISION_INVALID');
  if (decision.reviewerCode!=='TL') errors.push('IDENTITY_REVIEWER_MUST_BE_TL');
  if (!validDate(decision.reviewedAt)) errors.push('IDENTITY_REVIEWED_AT_INVALID');
  if (!String(decision.summary||'').trim()) errors.push('IDENTITY_REVIEW_SUMMARY_REQUIRED');
  if (decision.sameRouteSlug!==proposal.proposedEnglishIdentity.slug) errors.push('IDENTITY_SAME_ROUTE_SLUG_MUTATION_FORBIDDEN');
  if (['approve_identity','revise_identity'].includes(decision.decision) && !String(decision.displayQuestion||'').trim()) errors.push('IDENTITY_DISPLAY_QUESTION_REQUIRED');
  return {state:errors.length?'invalid':'human_decided',errors};
}
export function buildIdentityAuthority(proposals, decisions) {
  if (decisions?.sourceProposalDigest!==proposals.proposalDigest) throw fail('ABL1_IDENTITY_DECISION_SOURCE_MISMATCH',proposals.batchCode);
  const byNode=new Map((decisions.entries||[]).map(x=>[x.nodeCode,x])); const records=[]; const pending=[]; const errors=[];
  for (const proposal of proposals.entries) {
    const decision=byNode.get(proposal.nodeCode); const status=identityDecisionStatus(decision,proposal);
    if (status.state==='pending') { pending.push(proposal.nodeCode); continue; }
    if (status.errors.length) { errors.push({nodeCode:proposal.nodeCode,errors:status.errors}); continue; }
    if (!['approve_identity','revise_identity'].includes(decision.decision)) continue;
    records.push({ nodeCode:proposal.nodeCode, locale:'en', displayQuestion:String(decision.displayQuestion).trim(), slug:proposal.proposedEnglishIdentity.slug, availability:'available', authority:'tl_reviewed_locale_identity_successor', translationMode:'independent_authoring', stalenessStatus:'current', semanticParityStatus:'identity_reviewed_article_not_reviewed', sourceLocale:'zh-Hans', sourceBatchCode:proposals.batchCode, humanReview:{decision:decision.decision,reviewerCode:'TL',reviewedAt:new Date(decision.reviewedAt).toISOString(),summary:decision.summary} });
  }
  const payload={schemaVersion:'PHI-OS-ABL-1-LOCALE-IDENTITY-AUTHORITY-SUCCESSOR-v1.0.0',work:'ABL-1',batchCode:proposals.batchCode,status:errors.length?'INVALID_HUMAN_IDENTITY_DECISIONS':pending.length?'AWAITING_TL_IDENTITY_REVIEW':'IDENTITY_REVIEW_COMPLETE',sourceProposalDigest:proposals.proposalDigest,recordCount:records.length,pendingNodeCodes:pending,errors,records,governance:{authoritySource:'explicit_TL_locale_identity_review',centralFrozenKnrL10nRegistryMutated:false,translationAuthorityInherited:false,articleReviewCreated:false,articleApprovalCreated:false,articlePublicationCreated:false}};
  return {...payload,authorityDigest:hashObject(payload)};
}

async function digestInputs(root, files) { const rows=[]; for (const rel of [...new Set(files)].filter(Boolean).sort()) rows.push({path:rel,sha256:digestTextSource(await fs.readFile(abs(root,rel)))}); return digest(rows); }
function selectTerms(registry,text){return registry.terms.filter(t=>t.status==='approved'&&t.translationLock===true&&(text.includes(t['zh-Hans'])||text.toLowerCase().includes(String(t.en||'').toLowerCase()))).map(({termCode,key,...x})=>({termCode,key,'zh-Hans':x['zh-Hans'],en:x.en,translationLock:true}));}
export async function buildAblEnglishBrief(root,batchCode,identityRecord,{commit=ABL_BASELINE}={}) {
  const nodeCode=identityRecord.nodeCode; const zhContext=await loadCanonicalContext(root,nodeCode,'zh-Hans'); const terms=await readRepoJson(root,'content/knowledge/l10n/bilingual-terminology-registry.json');
  const {node,blueprintNode,readiness}=zhContext; const authorityRel=pathsFor(batchCode).identityAuthority;
  const inputFiles=[...zhContext.inputFiles,'content/knowledge/l10n/bilingual-terminology-registry.json','content/knowledge/l10n/knr-l10n-w1-freeze-v1.json',authorityRel];
  const sourceText=[blueprintNode.titleZhHans,readiness.canonicalQuestion,readiness.centralThesis,...(readiness.requiredMechanisms||[]).map(x=>x.requirement||'')].join('\n');
  const payload={ briefType:'canonical_article_production_brief', briefSchemaVersion:'PHI-OS-ABL-ENGLISH-PRODUCTION-BRIEF-SUCCESSOR-v1.0.0', briefCode:`BRIEF-${nodeCode}-EN-ABL-V1`, nodeCode, locale:'en', repositoryCommit:commit,
    authority:{canonicalMeaning:'TL',localizedIdentity:'ABL-1_TL_DISCOVERY_REVIEW_SUCCESSOR',authoring:'independent_english_authoring',review:'independent_human_review',approval:'independent_human_approval',publication:'independent_publication'},
    canonicalMeaning:{sourceLocale:'zh-Hans',canonicalTitle:blueprintNode.titleZhHans,canonicalQuestion:readiness.canonicalQuestion,centralThesis:readiness.centralThesis,nodeType:node.nodeType,domainCode:node.domainCode??null,themeCode:node.themeCode,relationships:node.relationships},
    localizedIdentity:{displayQuestion:identityRecord.displayQuestion,localizedTitle:identityRecord.displayQuestion,slug:identityRecord.slug,semanticParityStatus:identityRecord.semanticParityStatus},
    articleBoundary:{mustEstablish:readiness.requiredMechanisms||[],requiredDistinctions:readiness.requiredDistinctions||[],mustNotClaim:readiness.prohibitedClaims||[],includedScope:readiness.includedScope||[],excludedScope:readiness.excludedScope||[]},
    governance:{registryMutationAllowed:false,translationOfZhArticleRequired:false,independentAuthoringRequired:true,reviewInheritanceAllowed:false,approvalInheritanceAllowed:false,publicationInheritanceAllowed:false,generatedContentAuthority:'candidate_only',publishedContentAllowed:false,frozenKnrL10nRegistryMutated:false},
    terminologyProjection:{registryVersion:terms.version,terms:selectTerms(terms,sourceText)}, sourceSnapshot:{inputFiles:[...new Set(inputFiles)].filter(Boolean).sort(),inputDigest:await digestInputs(root,inputFiles),identityAuthorityDigest:identityRecord.humanReview?hashObject(identityRecord.humanReview):null},
    outputContract:{candidateLocale:'en',allowedCandidateStates:['draft','ready_for_human_review','changes_required'],forbiddenCandidateStates:['approved','publication_ready','published','human_approved'],requiredIndependentReview:true,requiredIndependentApproval:true,requiredIndependentPublication:true,translationProhibited:true}
  }; return {...payload,briefDigest:digest(payload)};
}
function submissionComplete(entry) { return Boolean(entry && String(entry.title||'').trim() && String(entry.summary||'').trim() && String(entry.bodyMarkdown||'').trim().length>=200 && String(entry.submittedBy||'').trim() && validDate(entry.submittedAt) && entry.independentAuthoringAttestation===true); }
function validateEnglishText(entry) { if (hasCjk(`${entry.title}\n${entry.summary}\n${entry.bodyMarkdown}`)) throw fail('ABL3_ENGLISH_CANDIDATE_CONTAINS_CJK',entry.nodeCode); }
async function ensureRegistryRecord(root, rel, codeField, record) {
  const registry=await readJson(root,rel); const code=record[codeField]; const existing=registry.records.find(x=>x[codeField]===code) || registry.records.find(x=>x.nodeCode===record.nodeCode&&x.locale===record.locale);
  if (existing) { if (!isDeepStrictEqual(existing, record)) throw fail('ABL_REGISTRY_CONFLICT',`${rel}:${code}`); return 'existing_equivalent'; }
  const next={...registry,records:[...registry.records,record].sort((a,b)=>String(a[codeField]).localeCompare(String(b[codeField])))}; await atomicWrite(abs(root,rel),serialize(next),{replace:true}); return 'create';
}
function validateAblCandidate(candidate,brief) {
  const errors=[]; const add=x=>errors.push(x); if(candidate?.candidateType!=='canonical_article_candidate')add('TYPE'); if(candidate?.candidateSchemaVersion!=='PHI-OS-EN-CANONICAL-CANDIDATE-v1.0.0')add('VERSION'); if(candidate?.locale!=='en')add('LOCALE'); if(candidate?.nodeCode!==brief.nodeCode)add('NODE'); if(candidate?.candidateCode!==`CANDIDATE-${brief.nodeCode}-EN-V1`)add('CODE'); if(candidate?.candidateState!=='ready_for_human_review')add('STATE'); if(candidate?.candidateDigest!==computeEnglishCandidateDigest(candidate))add('DIGEST'); if(candidate?.sourceBrief?.briefDigest!==brief.briefDigest||candidate?.sourceBrief?.briefCode!==brief.briefCode||candidate?.sourceBrief?.repositoryCommit!==brief.repositoryCommit)add('BRIEF'); if(candidate?.authority?.candidateContent!=='candidate_only'||candidate?.authority?.publication!=='not_published')add('AUTHORITY'); if(candidate?.governance?.translationFromZhHansAllowed!==false||candidate?.provenance?.independentLocaleAuthoring!==true)add('INDEPENDENCE'); if(hasCjk(JSON.stringify(candidate.article||{})))add('CJK'); return {valid:errors.length===0,errors};
}

function reviewWithoutDigest(v){const c=structuredClone(v);delete c.reviewDigest;return c;} function approvalWithoutDigest(v){const c=structuredClone(v);delete c.approvalDigest;return c;}
function buildReviewPackage(candidate,input){const payload={reviewType:'canonical_article_human_review',reviewSchemaVersion:'PHI-OS-HUMAN-REVIEW-PACKAGE-v1.0.0',reviewCode:`REVIEW-${candidate.candidateCode}-V1`,candidate:{candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,nodeCode:candidate.nodeCode,locale:'en',candidateState:candidate.candidateState},reviewer:{reviewerCode:'TL',authority:'TL Human Review Authority'},decision:input.reviewDecision,summary:input.reviewSummary,findings:input.reviewFindings||[],authority:{canonicalMeaning:'TL',review:'human_review_recorded',approval:'not_approved',publication:'not_published'},governance:{candidateMutationAllowed:false,knowledgeRegistryMutationAllowed:false,approvalRecorded:false,publicationRecorded:false,localeStatePromotionAllowed:false},reviewedAt:new Date(input.reviewedAt).toISOString()};return {...payload,reviewDigest:digest(payload)};}
function buildApprovalPackage(candidate,review,input){const payload={approvalType:'canonical_article_human_approval',approvalSchemaVersion:'PHI-OS-HUMAN-APPROVAL-PACKAGE-v1.0.0',approvalCode:`APPROVAL-${candidate.candidateCode}-V1`,candidate:{candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,nodeCode:candidate.nodeCode,locale:'en'},review:{reviewCode:review.reviewCode,reviewDigest:review.reviewDigest,decision:review.decision},approver:{approverCode:'TL',authority:'TL Human Approval Authority'},decision:input.approvalDecision,summary:input.approvalSummary,conditions:input.approvalConditions||[],authority:{canonicalMeaning:'TL',review:'independent_human_review',approval:'independent_human_approval_recorded',publication:'not_published'},governance:{candidateMutationAllowed:false,reviewMutationAllowed:false,knowledgeRegistryMutationAllowed:false,publicationRecorded:false,localeStatePromotionAllowed:false},approvedAt:new Date(input.approvedAt).toISOString()};return {...payload,approvalDigest:digest(payload)};}
function validateReviewPackage(review,candidate){return review.reviewDigest===digest(reviewWithoutDigest(review))&&review.candidate?.candidateDigest===candidate.candidateDigest&&review.candidate?.locale==='en';}
function validateApprovalPackage(approval,candidate,review){return approval.approvalDigest===digest(approvalWithoutDigest(approval))&&approval.candidate?.candidateDigest===candidate.candidateDigest&&approval.review?.reviewDigest===review.reviewDigest&&approval.review?.decision==='accept';}
function reviewInputComplete(input){return Boolean(input&&ALLOWED_REVIEW_DECISIONS.includes(input.reviewDecision)&&input.reviewerCode==='TL'&&validDate(input.reviewedAt)&&String(input.reviewSummary||'').trim());}
function approvalInputComplete(input){return Boolean(input&&input.reviewDecision==='accept'&&ALLOWED_APPROVAL_DECISIONS.includes(input.approvalDecision)&&input.approverCode==='TL'&&validDate(input.approvedAt)&&String(input.approvalSummary||'').trim());}
function publicationInputComplete(input){return Boolean(input&&input.reviewDecision==='accept'&&input.approvalDecision==='approve'&&ALLOWED_PUBLICATION_DECISIONS.includes(input.publicationDecision)&&input.publisherCode==='TL'&&validDate(input.decidedAt)&&String(input.publicationSummary||'').trim());}

async function ensureCandidate(root,batchCode,node,submission) {
  const brief=await readJson(root,briefPath(batchCode,node.nodeCode)); validateEnglishText({...submission,nodeCode:node.nodeCode});
  const candidate=buildEnglishCandidate(brief,{title:String(submission.title).trim(),summary:String(submission.summary).trim(),bodyMarkdown:normalize(submission.bodyMarkdown).trim(),sectionHeadings:submission.sectionHeadings||[],terminologyTermsUsed:submission.terminologyTermsUsed||[],producer:String(submission.submittedBy).trim(),candidateState:'ready_for_human_review'});
  const validation=validateAblCandidate(candidate,brief); if(!validation.valid)throw fail('ABL3_CANDIDATE_INVALID',`${node.nodeCode}:${validation.errors.join(',')}`);
  const rel=candidatePath(node.nodeCode); await ensureJson(root,rel,candidate); const prompt=await readJson(root,promptPath(batchCode,node.nodeCode)); const record=buildCandidateRegistryRecord(candidate,prompt); await ensureRegistryRecord(root,'content/knowledge/production/registry/candidate-registry.json','candidateCode',record); return {candidate,rel};
}
async function ensureReviewApproval(root,nodeCode,input) {
  const candidate=await readJson(root,candidatePath(nodeCode)); let review=null,approval=null;
  if(reviewInputComplete(input)) { review=buildReviewPackage(candidate,input); if(!validateReviewPackage(review,candidate))throw fail('ABL4_REVIEW_INVALID',nodeCode); await ensureJson(root,reviewPath(nodeCode),review); const rec={reviewCode:review.reviewCode,candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,nodeCode,locale:'en',reviewerCode:'TL',decision:review.decision,reviewDigest:review.reviewDigest,reviewedAt:review.reviewedAt,approval:'not_approved',publication:'not_published'}; await ensureRegistryRecord(root,'content/knowledge/production/registry/review-registry.json','reviewCode',rec); }
  if(review?.decision==='accept'&&approvalInputComplete(input)) { approval=buildApprovalPackage(candidate,review,input); if(!validateApprovalPackage(approval,candidate,review)||approval.decision!=='approve') { if(approval.decision==='approve')throw fail('ABL4_APPROVAL_INVALID',nodeCode); } await ensureJson(root,approvalPath(nodeCode),approval); const rec={approvalCode:approval.approvalCode,approvalDigest:approval.approvalDigest,candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,nodeCode,locale:'en',reviewCode:review.reviewCode,reviewDigest:review.reviewDigest,approverCode:'TL',decision:approval.decision,approvedAt:approval.approvedAt,publication:'not_published'}; await ensureRegistryRecord(root,'content/knowledge/production/registry/approval-registry.json','approvalCode',rec); }
  return {review,approval};
}

export async function advanceAbl(root,batchCode='BATCH-001',{apply=true}={}) {
  const p=pathsFor(batchCode); const proposals=await buildAbl1IdentityProposals(root,batchCode);
  if(apply) await ensureJson(root,p.identityProposals,proposals);
  let identityDecisions;
  if(exists(root,p.identityDecisions)) identityDecisions=await readJson(root,p.identityDecisions); else {identityDecisions=buildIdentityDecisionInput(proposals); if(apply)await ensureJson(root,p.identityDecisions,identityDecisions);}
  const identityAuthority=buildIdentityAuthority(proposals,identityDecisions); if(apply) await atomicWrite(abs(root,p.identityAuthority),stable(identityAuthority),{replace:true});
  if(identityAuthority.errors.length) throw fail('ABL1_IDENTITY_DECISIONS_INVALID',JSON.stringify(identityAuthority.errors));
  if(identityAuthority.pendingNodeCodes.length) return {status:'AWAITING_TL_IDENTITY_REVIEW',work:'ABL-1',batchCode,paths:p,summary:{proposalCount:proposals.entries.length,identityAuthorityCount:identityAuthority.recordCount,pendingIdentityCount:identityAuthority.pendingNodeCodes.length}};
  if(!identityAuthority.records.length) return {status:'NO_ENGLISH_IDENTITIES_APPROVED',work:'ABL-1',batchCode,paths:p,summary:{proposalCount:proposals.entries.length,identityAuthorityCount:0}};

  const productionEntries=[];
  for(const identity of identityAuthority.records){ const brief=await buildAblEnglishBrief(root,batchCode,identity); const prompt=await buildEnglishPrompt(root,brief); const pv=validateEnglishPrompt(prompt,brief); if(!pv.valid)throw fail('ABL2_PROMPT_INVALID',`${identity.nodeCode}:${JSON.stringify(pv.errors)}`); const bRel=briefPath(batchCode,identity.nodeCode), pRel=promptPath(batchCode,identity.nodeCode); if(apply){await ensureJson(root,bRel,brief);await ensureJson(root,pRel,prompt);} productionEntries.push({nodeCode:identity.nodeCode,locale:'en',identityAuthorityDigest:identityAuthority.authorityDigest,briefPath:bRel,briefCode:brief.briefCode,briefDigest:brief.briefDigest,promptPath:pRel,promptCode:prompt.promptCode,promptDigest:prompt.promptPackageDigest,sameRouteSlug:identity.slug,state:'READY_FOR_INDEPENDENT_ENGLISH_AUTHORING'}); }
  const productionPayload={schemaVersion:'PHI-OS-ABL-2-ENGLISH-PRODUCTION-BATCH-v1.0.0',work:'ABL-2',batchCode,status:'ENGLISH_BRIEF_PROMPT_BATCH_READY',entryCount:productionEntries.length,entries:productionEntries,governance:{independentEnglishAuthoringRequired:true,zhHansArticleTranslationRequired:false,implicitPaidAiInvocationAllowed:false,candidateAuthorityCreated:false,reviewInherited:false,approvalInherited:false,publicationInherited:false}}; const productionBatch={...productionPayload,productionBatchDigest:hashObject(productionPayload)}; if(apply)await atomicWrite(abs(root,p.productionBatch),stable(productionBatch),{replace:true});
  let submissions;
  if(exists(root,p.candidateSubmissions)) submissions=await readJson(root,p.candidateSubmissions); else { submissions={schemaVersion:'PHI-OS-ABL-3-CANDIDATE-SUBMISSION-INPUT-v1.0.0',work:'ABL-3',batchCode,sourceProductionBatchDigest:productionBatch.productionBatchDigest,oneSubmissionPerNodeLocale:true,entries:productionEntries.map(entry=>({nodeCode:entry.nodeCode,locale:'en',briefCode:entry.briefCode,briefDigest:entry.briefDigest,promptCode:entry.promptCode,promptDigest:entry.promptDigest,title:identityAuthority.records.find(x=>x.nodeCode===entry.nodeCode).displayQuestion,summary:null,bodyMarkdown:null,sectionHeadings:[],terminologyTermsUsed:[],submittedBy:null,submittedAt:null,independentAuthoringAttestation:false})),governance:{inputEqualsCandidateAuthority:false,translationFromZhHansAllowed:false,implicitPaidAiInvocationAllowed:false,manualOrGovernedProviderAuthoringAllowed:true}}; if(apply)await ensureJson(root,p.candidateSubmissions,submissions); }
  if(submissions.sourceProductionBatchDigest!==productionBatch.productionBatchDigest)throw fail('ABL3_SUBMISSION_SOURCE_MISMATCH',batchCode);
  const bySubmission=new Map((submissions.entries||[]).map(x=>[x.nodeCode,x])); const complete=[],pending=[];
  for(const entry of productionEntries){const s=bySubmission.get(entry.nodeCode); if(submissionComplete(s))complete.push({entry,submission:s});else pending.push(entry.nodeCode);}
  if(pending.length) return {status:'AWAITING_ENGLISH_CANDIDATE_AUTHORING',work:'ABL-3',batchCode,paths:p,summary:{identityAuthorityCount:identityAuthority.recordCount,briefPromptReadyCount:productionEntries.length,candidateSubmissionCompleteCount:complete.length,pendingCandidateNodeCodes:pending}};
  for(const item of complete) if(apply) await ensureCandidate(root,batchCode,item.entry,item.submission);

  const sourceBatch=await readJson(root,sourceBatchPath(batchCode)); const zhRun=exists(root,sourcePublicationRunPath(batchCode))?await readJson(root,sourcePublicationRunPath(batchCode)):null;
  const reviewEntries=[];
  for(const entry of productionEntries){const candidate=await readJson(root,candidatePath(entry.nodeCode)); const source=sourceBatch.entries.find(x=>x.nodeCode===entry.nodeCode); const zhOutcome=zhRun?.outcomes?.find(x=>x.nodeCode===entry.nodeCode&&x.locale==='zh-Hans'); reviewEntries.push({batchIndex:source?.batchIndex??0,nodeCode:entry.nodeCode,bookCode:source?.bookCode??null,partCode:source?.partCode??null,locale:'en',sameRouteSlug:entry.sameRouteSlug,zhHansPublication:{present:Boolean(zhOutcome?.publicationCreated),decision:zhOutcome?.decision??null,publicReleaseCreated:Boolean(zhOutcome?.publicReleaseCreated)},candidate:{path:candidatePath(entry.nodeCode),candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,state:candidate.candidateState},requiredHumanDecisions:{review:'EXPLICIT_TL_ENGLISH_REVIEW_REQUIRED',approval:'EXPLICIT_TL_ENGLISH_APPROVAL_REQUIRED_AFTER_ACCEPTED_REVIEW',publication:'EXPLICIT_TL_ENGLISH_PUBLICATION_DECISION_REQUIRED_AFTER_APPROVAL'}});}
  const reviewPayload={schemaVersion:'PHI-OS-ABL-4-BILINGUAL-REVIEW-BATCH-v1.0.0',work:'ABL-4',batchCode,status:'AWAITING_TL_ENGLISH_REVIEW_APPROVAL_PUBLICATION',entryCount:reviewEntries.length,entries:reviewEntries,governance:{zhHansPublicationDoesNotApproveEnglish:true,reviewIndependentPerLocale:true,approvalIndependentPerLocale:true,publicationIndependentPerLocale:true,sameRouteSlugShared:true}}; const reviewBatch={...reviewPayload,reviewBatchDigest:hashObject(reviewPayload)}; if(apply)await atomicWrite(abs(root,p.reviewBatch),stable(reviewBatch),{replace:true});
  let human;
  if(exists(root,p.humanDecisions)) human=await readJson(root,p.humanDecisions); else {human={schemaVersion:'PHI-OS-ABL-4-ENGLISH-HUMAN-DECISION-INPUT-v1.0.0',work:'ABL-4',batchCode,sourceReviewBatchDigest:reviewBatch.reviewBatchDigest,allowedReviewDecisions:[...ALLOWED_REVIEW_DECISIONS],allowedApprovalDecisions:[...ALLOWED_APPROVAL_DECISIONS],allowedPublicationDecisions:[...ALLOWED_PUBLICATION_DECISIONS],entries:reviewEntries.map(entry=>({nodeCode:entry.nodeCode,locale:'en',candidateCode:entry.candidate.candidateCode,candidateDigest:entry.candidate.candidateDigest,reviewDecision:null,reviewerCode:null,reviewedAt:null,reviewSummary:null,reviewFindings:[],approvalDecision:null,approverCode:null,approvedAt:null,approvalSummary:null,approvalConditions:[],publicationDecision:null,publisherCode:null,decidedAt:null,publicationSummary:null})),governance:{inputEqualsAuthority:false,bulkLocaleAuthorityCreated:false,zhHansHumanEvidenceInherited:false}};if(apply)await ensureJson(root,p.humanDecisions,human);}
  if(human.sourceReviewBatchDigest!==reviewBatch.reviewBatchDigest)throw fail('ABL4_HUMAN_INPUT_SOURCE_MISMATCH',batchCode);
  const inputMap=new Map((human.entries||[]).map(x=>[x.nodeCode,x])); const bridgeEntries=[];
  for(const entry of reviewEntries){const input=inputMap.get(entry.nodeCode); if(!input||input.candidateDigest!==entry.candidate.candidateDigest)throw fail('ABL4_HUMAN_INPUT_BINDING_INVALID',entry.nodeCode); if(apply&&reviewInputComplete(input))await ensureReviewApproval(root,entry.nodeCode,input); const reviewExists=exists(root,reviewPath(entry.nodeCode)); const approvalExists=exists(root,approvalPath(entry.nodeCode)); const review=reviewExists?await readJson(root,reviewPath(entry.nodeCode)):null; const approval=approvalExists?await readJson(root,approvalPath(entry.nodeCode)):null; const ready=Boolean(review?.decision==='accept'&&approval?.decision==='approve'&&publicationInputComplete(input)); bridgeEntries.push({...entry,humanInput:{reviewDecision:input.reviewDecision,approvalDecision:input.approvalDecision,publicationDecision:input.publicationDecision,publisherCode:input.publisherCode,decidedAt:input.decidedAt,publicationSummary:input.publicationSummary},review:{path:reviewExists?reviewPath(entry.nodeCode):null,accepted:review?.decision==='accept',reviewCode:review?.reviewCode??null,reviewDigest:review?.reviewDigest??null},approval:{path:approvalExists?approvalPath(entry.nodeCode):null,approved:approval?.decision==='approve',approvalCode:approval?.approvalCode??null,approvalDigest:approval?.approvalDigest??null},explicitHumanDecisionComplete:ready});}
  const pendingBridge=bridgeEntries.filter(x=>!x.explicitHumanDecisionComplete).map(x=>x.nodeCode); const bridgePayload={schemaVersion:'PHI-OS-ABL-4-DECISION-BRIDGE-v1.0.0',work:'ABL-4',batchCode,status:pendingBridge.length?'AWAITING_TL_ENGLISH_REVIEW_APPROVAL_PUBLICATION':'READY_FOR_ABL_5_PUBLICATION',entryCount:bridgeEntries.length,pendingNodeCodes:pendingBridge,entries:bridgeEntries,governance:{noHumanDecisionInferred:true,zhHansAuthorityInherited:false,publicationCreated:false}}; const bridge={...bridgePayload,bridgeDigest:hashObject(bridgePayload)}; if(apply)await atomicWrite(abs(root,p.decisionBridge),stable(bridge),{replace:true});
  return {status:bridge.status,work:'ABL-4',batchCode,paths:p,summary:{identityAuthorityCount:identityAuthority.recordCount,briefPromptReadyCount:productionEntries.length,englishCandidateReadyCount:reviewEntries.length,publicationReadyCount:bridgeEntries.filter(x=>x.explicitHumanDecisionComplete).length,pendingHumanNodeCodes:pendingBridge}};
}

function buildAblPublication(candidate,review,approval,identity,input){const payload={publicationType:PUBLICATION_TYPE,publicationSchemaVersion:PUBLICATION_SCHEMA_VERSION,publicationCode:`PUBLICATION-${approval.approvalCode}-V1`,candidate:{candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,nodeCode:candidate.nodeCode,locale:'en'},review:{reviewCode:review.reviewCode,reviewDigest:review.reviewDigest,decision:review.decision},approval:{approvalCode:approval.approvalCode,approvalDigest:approval.approvalDigest,decision:approval.decision},publisher:{publisherCode:'TL',authority:'TL Independent Publication Authority'},decision:'publish',article:{articleCode:`KA-${candidate.nodeCode.replace(/^KN-/,'')}-EN-ARTICLE`,nodeCode:candidate.nodeCode,locale:'en',title:candidate.article.title,summary:candidate.article.summary,bodyMarkdown:candidate.article.bodyMarkdown,slug:identity.slug,href:`/articles/${identity.slug}`,version:'1.0.0'},authority:{canonicalMeaning:'TL',review:'human_review_accepted',approval:'human_approval_recorded',publication:'independent_publication_recorded'},governance:{candidateMutationAllowed:false,reviewMutationAllowed:false,approvalMutationAllowed:false,knowledgeRegistryMutationAllowed:false,publicRuntimeProjectionWritten:false,localeInheritanceAllowed:false},publishedAt:new Date(input.decidedAt).toISOString()};const publication={...payload,publicationDigest:computePublicationDigest(payload)};const v=validatePublication(publication,candidate,review,approval);if(!v.valid)throw fail('ABL5_PUBLICATION_INVALID',JSON.stringify(v.errors));return publication;}
async function ensureAblManifestRecord(root,record){let manifest=exists(root,ABL_MANIFEST)?await readJson(root,ABL_MANIFEST):{schemaVersion:'PHI-OS-ABL-BILINGUAL-RELEASE-MANIFEST-v1.0.0',records:[]};const existing=manifest.records.find(x=>x.nodeCode===record.nodeCode&&x.locale===record.locale);if(existing){if(stable(existing)!==stable(record))throw fail('ABL5_RELEASE_MANIFEST_CONFLICT',`${record.nodeCode}:${record.locale}`);return 'existing_equivalent';}manifest={...manifest,records:[...manifest.records,record]};await atomicWrite(abs(root,ABL_MANIFEST),stable(manifest),{replace:true});return 'create';}
export async function publishAbl(root,batchCode='BATCH-001',{apply=true}={}) {
  const advanced=await advanceAbl(root,batchCode,{apply}); if(advanced.status!=='READY_FOR_ABL_5_PUBLICATION')throw fail('ABL5_EXPLICIT_ENGLISH_HUMAN_DECISIONS_REQUIRED',advanced.status);
  const p=pathsFor(batchCode); const [bridge,authority,sourceBatch,human]=await Promise.all([readJson(root,p.decisionBridge),readJson(root,p.identityAuthority),readJson(root,sourceBatchPath(batchCode)),readJson(root,p.humanDecisions)]); const identityMap=new Map(authority.records.map(x=>[x.nodeCode,x])); const inputMap=new Map(human.entries.map(x=>[x.nodeCode,x])); const outcomes=[];
  const originalVisualManifestDigest=sha(await fs.readFile(abs(root,'content/knowledge/public/visual-article-release.json')));
  for(const entry of bridge.entries){const input=inputMap.get(entry.nodeCode);if(input.publicationDecision!=='publish'){outcomes.push({nodeCode:entry.nodeCode,locale:'en',decision:input.publicationDecision,publicationCreated:false,publicReleaseCreated:false});continue;}const [candidate,review,approval]=await Promise.all([readJson(root,candidatePath(entry.nodeCode)),readJson(root,reviewPath(entry.nodeCode)),readJson(root,approvalPath(entry.nodeCode))]);const publication=buildAblPublication(candidate,review,approval,identityMap.get(entry.nodeCode),input);const ensured=await ensurePublicationAndRegistry(root,publication,{apply});outcomes.push({nodeCode:entry.nodeCode,locale:'en',decision:'publish',publicationCreated:true,publication,publicationPath:ensured.publicationPath,sourceEntry:sourceBatch.entries.find(x=>x.nodeCode===entry.nodeCode)});}
  if(apply&&outcomes.some(x=>x.publicationCreated)){const builtAuthority=writeApsPublishedKnowledgeAuthoritySuccessor(root);for(const outcome of outcomes.filter(x=>x.publicationCreated)){const auth=builtAuthority.registry.records.find(x=>x.nodeCode===outcome.nodeCode&&x.locale==='en');if(!auth)throw fail('ABL5_PKA_RECORD_MISSING',outcome.nodeCode);let presentation=buildCprArticleOnlyProjection({authorityRecord:auth,publication:outcome.publication,packageRecord:{figure:null,visual:null,assets:null}});presentation={...presentation,presentationCode:`PRESENTATION-ARTICLE-${outcome.nodeCode}-EN-ABL-v1`,work:'ABL-5_CPR_SUCCESSOR_ORCHESTRATION'};const cp=cprPath(outcome.nodeCode);await ensureJson(root,cp,presentation);const reviewEntry={batchIndex:outcome.sourceEntry?.batchIndex??0,bookCode:outcome.sourceEntry?.bookCode??null,partCode:outcome.sourceEntry?.partCode??null};const articleBase=buildPublicVisualArticle({publication:outcome.publication,authorityRecord:auth,reviewEntry,presentation});const article={...articleBase,sections:(articleBase.sections||[]).map(section=>section.heading==='正文'?{...section,heading:'Article'}:section)};if(hasCjk(JSON.stringify({title:article.title,summary:article.summary,sections:article.sections,seo:article.seo})))throw fail('ABL5_PUBLIC_ENGLISH_ARTICLE_CONTAINS_CJK',outcome.nodeCode);const va=visualArticlePath(outcome.publication.article.slug);await ensureJson(root,va,article);const routeRel=`articles/${outcome.publication.article.slug}.html`;if(!exists(root,routeRel))throw fail('ABL5_SAME_ROUTE_ZH_ROUTE_REQUIRED',routeRel);const route=await fs.readFile(abs(root,routeRel),'utf8');if(!route.includes(`data-article-slug="${outcome.publication.article.slug}"`))throw fail('ABL5_ROUTE_SLUG_MISMATCH',routeRel);const manifestRecord={nodeCode:outcome.nodeCode,locale:'en',slug:outcome.publication.article.slug,href:outcome.publication.article.href,path:`/${va}`,authorityPath:`content/knowledge/public/authority/articles/en/${outcome.nodeCode}.json`,presentationPath:cp,carState:'NOT_REQUIRED_NO_VISUAL_ASSET',status:'published',source:'ABL-5'};await ensureAblManifestRecord(root,manifestRecord);Object.assign(outcome,{publicReleaseCreated:true,authorityRecordCode:auth.authorityRecordCode,cprPath:cp,visualArticlePath:va,routePath:routeRel,carState:'NOT_REQUIRED_NO_VISUAL_ASSET'});}}
  const currentVisualManifestDigest=sha(await fs.readFile(abs(root,'content/knowledge/public/visual-article-release.json')));if(currentVisualManifestDigest!==originalVisualManifestDigest)throw fail('ABL5_FROZEN_VAP_MANIFEST_MUTATED',currentVisualManifestDigest);
  const payload={schemaVersion:'PHI-OS-ABL-5-BILINGUAL-PUBLICATION-RUN-v1.0.0',work:'ABL-5',batchCode,status:'BILINGUAL_PUBLICATION_ORCHESTRATION_COMPLETED',publishAuthorizedCount:outcomes.filter(x=>x.decision==='publish').length,deferCount:outcomes.filter(x=>x.decision==='defer').length,doNotPublishCount:outcomes.filter(x=>x.decision==='do_not_publish').length,outcomes:outcomes.map(x=>({nodeCode:x.nodeCode,locale:x.locale,decision:x.decision,publicationCreated:x.publicationCreated,publicationPath:x.publicationPath??null,publicReleaseCreated:x.publicReleaseCreated??false,authorityRecordCode:x.authorityRecordCode??null,carState:x.carState??'NOT_APPLICABLE',cprPath:x.cprPath??null,visualArticlePath:x.visualArticlePath??null,routePath:x.routePath??null})),governance:{explicitTlEnglishReviewRequired:true,explicitTlEnglishApprovalRequired:true,explicitTlEnglishPublicationDecisionRequired:true,zhHansAuthorityInherited:false,frozenKnrL10nRegistryMutated:false,frozenVapManifestMutated:false,separateAblReleaseManifest:true,sameRouteLocaleReleaseRequired:true,implicitPaidAiInvocationAllowed:false}};const result={...payload,runDigest:hashObject(payload)};if(apply)await atomicWrite(abs(root,p.publicationRun),stable(result),{replace:true});return result;
}

export async function fillFixtureIdentityApprovals(root,batchCode='BATCH-001') {const p=pathsFor(batchCode),proposals=await readJson(root,p.identityProposals),decisions=await readJson(root,p.identityDecisions);for(const entry of decisions.entries){entry.decision='approve_identity';entry.reviewerCode='TL';entry.reviewedAt='2026-08-16T08:00:00.000Z';entry.summary='Fixture approves the proposed English locale identity for successor testing.';}await atomicWrite(abs(root,p.identityDecisions),stable(decisions),{replace:true});return proposals;}
export async function fillFixtureCandidateSubmissions(root,batchCode='BATCH-001'){const p=pathsFor(batchCode),input=await readJson(root,p.candidateSubmissions);for(const entry of input.entries){entry.summary='This independent English candidate explains the Canonical Meaning while preserving the required distinctions and responsibility boundaries.';entry.bodyMarkdown=`# ${entry.title}\n\n${('This independently authored English article explains the shared Canonical Meaning through systems reasoning, preserves the required distinctions, and does not inherit Chinese review, approval, or publication authority. It remains bounded by the production brief and opens the next question without claiming more than the Canonical Node supports. ').repeat(6)}`;entry.submittedBy='ABL fixture independent English authoring';entry.submittedAt='2026-08-16T08:10:00.000Z';entry.independentAuthoringAttestation=true;}await atomicWrite(abs(root,p.candidateSubmissions),stable(input),{replace:true});}
export async function fillFixtureHumanDecisions(root,batchCode='BATCH-001'){const p=pathsFor(batchCode),input=await readJson(root,p.humanDecisions);for(const entry of input.entries){entry.reviewDecision='accept';entry.reviewerCode='TL';entry.reviewedAt='2026-08-16T08:20:00.000Z';entry.reviewSummary='Fixture accepts the independently authored English candidate.';entry.approvalDecision='approve';entry.approverCode='TL';entry.approvedAt='2026-08-16T08:30:00.000Z';entry.approvalSummary='Fixture independently approves the English candidate.';entry.publicationDecision='publish';entry.publisherCode='TL';entry.decidedAt='2026-08-16T08:40:00.000Z';entry.publicationSummary='Fixture explicitly authorizes English publication.';}await atomicWrite(abs(root,p.humanDecisions),stable(input),{replace:true});}
