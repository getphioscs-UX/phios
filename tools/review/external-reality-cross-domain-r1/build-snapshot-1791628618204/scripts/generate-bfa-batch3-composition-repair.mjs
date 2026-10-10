import fs from 'node:fs';
import path from 'node:path';
import { digest, serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';
import { projectPjaBrief, buildAuthoringPrompt, publicArticlePurityFindings } from './lib/bilingual-final-approval/bfa-runtime-v1.mjs';
import { buildBfaBatchFromAps } from './lib/bilingual-final-approval/bfa-batch-builder-v1.mjs';

const root=process.cwd();
const BASELINE='a86f7343219b5939eed3e3cfbe09b1cde99531aa';
const PROG='content/production/bilingual-final-approval/progression-v2';
const contentRel=`${PROG}/composition-repair/BATCH-003-article-composition-content-v1.json`;
const unitsRel=`${PROG}/composition/article-composition-unit-registry-v1.json`;
const planRel=`${PROG}/composition/complete-article-composition-batch-plan-v1.json`;
const decisionsRel=`${PROG}/human-decisions/BATCH-003-c2-human-decisions-v1.json`;
const c2ReviewRel=`${PROG}/review/BATCH-003-c2-review-v1.json`;
const batchDir='content/production/article-simplification/batches/BATCH-003';
const bfaDir='content/production/bilingual-final-approval/BATCH-003';
const archiveDir=`${bfaDir}/archive/pre-composition-single-node-v1`;
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,v)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,serialize(v));};
const exists=rel=>fs.existsSync(path.join(root,rel));
const copyIf=(src,dst)=>{if(exists(src)){const a=path.join(root,src),b=path.join(root,dst);fs.mkdirSync(path.dirname(b),{recursive:true});fs.cpSync(a,b,{recursive:true});}};
const rmContents=rel=>{const d=path.join(root,rel);if(!fs.existsSync(d))return;for(const f of fs.readdirSync(d))fs.rmSync(path.join(d,f),{recursive:true,force:true});};
const without=(v,key)=>{const c=structuredClone(v);delete c[key];return c;};

const source=read(contentRel);const reg=read(unitsRel);const batchPlan=read(planRel);const decisions=read(decisionsRel);const c2=read(c2ReviewRel);
const b3=batchPlan.batches.find(x=>x.batchCode==='BATCH-003');
if(!b3||b3.articleUnitCount!==5||b3.canonicalNodeCoverageCount!==23)throw new Error('BATCH-003 composition plan mismatch');
const content=source.content;
const unitMap=new Map(reg.articleUnits.map(x=>[x.articleUnitCode,x]));
const c2Map=new Map(c2.entries.map(x=>[x.nodeCode,x]));
const approved=new Set(decisions.decisions.filter(x=>x.decision==='freeze_approved').map(x=>x.nodeCode));
const deferred=decisions.decisions.filter(x=>x.decision==='defer').map(x=>x.nodeCode);
if(approved.size!==23||deferred.length!==1||deferred[0]!=='KN-PREFACE-003')throw new Error('Expected 23 approved + explicit KN-PREFACE-003 defer');
for(const code of b3.articleUnitCodes){for(const n of unitMap.get(code).memberNodeCodes)if(!approved.has(n))throw new Error(`${code} contains non-approved ${n}`);}

// Preserve the exact pre-composition BATCH-003 package/approval/bridge/review state once.
const archiveAlreadyExists=exists(`${PROG}/composition-repair/BATCH-003-stale-final-approval-registry-v1.json`);
if(!archiveAlreadyExists){
 for(const child of ['packages','approvals','authority-bridges'])copyIf(`${bfaDir}/${child}`,`${archiveDir}/${child}`);
 for(const file of ['review-data.json','review.html','review-session.v1.json'])copyIf(`${bfaDir}/${file}`,`${archiveDir}/${file}`);
 copyIf(`${batchDir}/batch-plan.v1.json`,`${archiveDir}/aps/${path.basename(batchDir)}-batch-plan.v1.json`);
 copyIf(`${batchDir}/candidate-orchestration.v1.json`,`${archiveDir}/aps/${path.basename(batchDir)}-candidate-orchestration.v1.json`);
}
const staleApprovals=archiveAlreadyExists?(read(`${PROG}/composition-repair/BATCH-003-stale-final-approval-registry-v1.json`).records??[]):(exists(`${bfaDir}/approvals`)?fs.readdirSync(path.join(root,bfaDir,'approvals')).filter(x=>x.endsWith('.json')).map(f=>read(`${bfaDir}/approvals/${f}`)):[]);
const staleRegistryBase={schemaVersion:'PHI-OS-BFA-COMPOSITION-STALE-APPROVAL-REGISTRY-v1.0.0',batchCode:'BATCH-003',reason:'ARTICLE_COMPOSITION_REPAIR_CHANGED_CANDIDATE_AND_FINAL_PACKAGE_DIGEST',historicalApprovalsPreserved:true,currentAuthorization:false,approvalCount:staleApprovals.length,records:staleApprovals.map(x=>({nodeCode:x.nodeCode,finalPackageDigest:x.finalPackageDigest,authorityDigest:x.authorityDigest,decision:x.decision,reviewerCode:x.reviewerCode,decidedAt:x.decidedAt}))};
write(`${PROG}/composition-repair/BATCH-003-stale-final-approval-registry-v1.json`,{...staleRegistryBase,sourceDigest:digest(staleRegistryBase)});
rmContents(`${bfaDir}/packages`);rmContents(`${bfaDir}/approvals`);rmContents(`${bfaDir}/authority-bridges`);

const registryRel='content/knowledge/production/registry/candidate-registry.json';
const candidateRegistry=read(registryRel);
const orchestration=[];const batchEntries=[];const generated=[];
const langKey={'zh-Hans':'zh',en:'en'};
function compositionPaths(code,locale){
 const base=`content/knowledge/production/article-compositions/BATCH-003/${code}/${locale}`;
 return {base,brief:`${base}/production-brief.v1.json`,prompt:`${base}/production-prompt.v1.json`,candidate:`${base}/candidate.v1.json`};
}
function memberMeaning(unit,locale){return unit.memberNodeCodes.map(nodeCode=>{const e=c2Map.get(nodeCode);return {nodeCode,canonicalTitle:locale==='zh-Hans'?e?.titleZhHans??nodeCode:null,canonicalThesis:e?.proposedCanonicalThesis??null,sourceC2Review:c2ReviewRel};});}
function makeBrief(code,unit,locale,article){
 const isZh=locale==='zh-Hans';
 const members=memberMeaning(unit,locale);
 const central=article.summary;
 const payload={briefType:'article_composition_production_brief',briefSchemaVersion:'PHI-OS-BFA-ARTICLE-COMPOSITION-BRIEF-v1.0.0',briefCode:`BRIEF-${code}-${isZh?'ZH-HANS':'EN'}-V1`,nodeCode:unit.anchorNodeCode,articleUnitCode:code,memberNodeCodes:unit.memberNodeCodes,memberNodeCount:unit.memberNodeCount,locale,repositoryCommit:BASELINE,authority:{canonicalMeaning:'COMPOSITION_OF_TL_C2_FROZEN_MEMBER_MEANINGS',localizedIdentity:'BFA_ARTICLE_COMPOSITION_UNIT_V1',review:'BFA_FINAL_REVIEW',approval:'BFA_FINAL_HUMAN_APPROVAL',publication:'independent_publication_execution',authoring:isZh?'independent_zh_hans_composition_authoring':'independent_english_composition_authoring'},canonicalMeaning:{canonicalTitle:article.title,canonicalQuestion:article.title,centralThesis:central,nodeType:'article_composition_unit',domainCode:null,themeCode:code,relationships:{parentNodeCodes:[],childNodeCodes:[],prerequisiteNodeCodes:[],relatedNodeCodes:unit.memberNodeCodes.slice(1),nextNodeCodes:[]},memberCanonicalMeanings:members},localizedIdentity:{displayQuestion:article.title,localizedTitle:article.title,localizedSummary:article.summary,searchAliases:[],slug:content[code].slug,semanticParityStatus:'candidate_pending_bfa_final_review'},articleBoundary:{mustEstablish:article.headings.map(requirement=>({label:null,requirement})),requiredDistinctions:[],mustNotClaim:article.mustNotClaim,includedScope:[isZh?`整合 ${unit.memberNodeCount} 个相邻 Canonical Nodes 的形成链，不复制书稿章节。`:`Integrate the formation chain across ${unit.memberNodeCount} adjacent Canonical Nodes without reproducing manuscript chapters.`],excludedScope:[isZh?'个案诊断、专业判断与未经来源支持的具体外部事实。':'Case-specific diagnosis, professional judgment, and unsupported specific external factual claims.']},governance:{registryMutationAllowed:false,reviewInheritanceAllowed:false,approvalInheritanceAllowed:false,publicationInheritanceAllowed:false,generatedContentAuthority:'candidate_only',publishedContentAllowed:false,independentAuthoringRequired:true,nodeToArticleIdentityOneToOne:false},terminologyProjection:{registryVersion:'BFA-ARTICLE-COMPOSITION-v1',terms:[]},sourceSnapshot:{inputFiles:[contentRel,unitsRel,decisionsRel,c2ReviewRel],inputDigest:digest({articleUnitCode:code,memberNodeCodes:unit.memberNodeCodes,c2ReviewDigest:c2.reviewBatchDigest,decisionDigest:decisions.sourceReviewBatchDigest,compositionContentDigest:source.contentDigest})},outputContract:{candidateLocale:locale,allowedCandidateStates:['draft','ready_for_human_review','changes_required'],forbiddenCandidateStates:['approved','publication_ready','published','human_approved'],requiredIndependentReview:true,requiredIndependentApproval:true,requiredIndependentPublication:true,translationProhibited:locale==='en'}};
 return {...payload,briefDigest:digest(payload)};
}
function makePrompt(brief){const p=buildAuthoringPrompt(projectPjaBrief(brief,{locale:brief.locale}),brief.locale);const payload={promptPackageType:'article_composition_authoring_prompt',promptSchemaVersion:'PHI-OS-BFA-ARTICLE-COMPOSITION-PROMPT-v1.0.0',promptCode:`PROMPT-${brief.articleUnitCode}-${brief.locale==='zh-Hans'?'ZH-HANS':'EN'}-V1`,articleUnitCode:brief.articleUnitCode,nodeCode:brief.nodeCode,locale:brief.locale,sourceBrief:{briefCode:brief.briefCode,briefSchemaVersion:brief.briefSchemaVersion,briefDigest:brief.briefDigest,repositoryCommit:brief.repositoryCommit},renderedPrompt:p.prompt,writerRole:'article_composition_writer',writingContract:{outputMode:'rich_article_body',independentLocaleAuthoring:true,publicArticlePurityRequired:true,fixedGovernanceHeadingTemplateForbidden:true,targetCanonicalNodesPerArticle:[4,5]}};return {...payload,promptPackageDigest:digest(payload)};}
function makeCandidate(code,unit,locale,article,brief,prompt){const isZh=locale==='zh-Hans';const payload={candidateType:'canonical_article_candidate',candidateSchemaVersion:'PHI-OS-BFA-ARTICLE-COMPOSITION-CANDIDATE-v1.0.0',candidateCode:`CANDIDATE-${code}-${isZh?'ZH-HANS':'EN'}-V1`,nodeCode:unit.anchorNodeCode,articleUnitCode:code,compositionNodeCodes:unit.memberNodeCodes,compositionNodeCount:unit.memberNodeCount,publicArticleRole:'ARTICLE_COMPOSITION_UNIT',locale,sourceBrief:{briefCode:brief.briefCode,briefSchemaVersion:brief.briefSchemaVersion,briefDigest:brief.briefDigest,repositoryCommit:brief.repositoryCommit},authority:{canonicalMeaning:'COMPOSED_FROM_TL_C2_FROZEN_MEMBER_MEANINGS',candidateContent:'candidate_only',humanReview:'not_reviewed',approval:'not_approved',publication:'not_published'},candidateState:'ready_for_human_review',article:{title:article.title,summary:article.summary,bodyMarkdown:article.body,sectionHeadings:article.headings,terminologyTermsUsed:[],articleUnitCode:code,compositionNodeCodes:unit.memberNodeCodes},governance:{registryMutationAllowed:false,canonicalMeaningMutationAllowed:false,reviewRecorded:false,approvalRecorded:false,publicationRecorded:false,localeStatePromotionAllowed:false,translationFromZhHansAllowed:false},provenance:{productionMode:'multi_node_article_composition',producer:isZh?'BFA Article Composition Repair independent zh-Hans authoring':'BFA Article Composition Repair independent English authoring',independentLocaleAuthoring:true,sourceCanonicalNodes:unit.memberNodeCodes,articleCompositionRepair:'BFA_BATCH_003_COMPOSITION_REPAIR_V1'},promptDigest:prompt.promptPackageDigest};return {...payload,candidateDigest:digest(payload)};}

for(let i=0;i<b3.articleUnitCodes.length;i++){
 const code=b3.articleUnitCodes[i],unit=unitMap.get(code),c=content[code]; if(!unit||!c)throw new Error(`Missing ${code}`);
 const paths={};const candidates={};
 for(const locale of ['zh-Hans','en']){
   const article=c[langKey[locale]]; if(publicArticlePurityFindings(article.body).length)throw new Error(`${code}/${locale} purity ${publicArticlePurityFindings(article.body)}`);
   if(/框架说明与外部事实必须分开|一般机制与个案判断必须分开|A general framework and external facts are different|General mechanism and case-specific judgment are different/i.test(article.body))throw new Error(`${code}/${locale} fixed governance heading leakage`);
   const pths=compositionPaths(code,locale),brief=makeBrief(code,unit,locale,article),prompt=makePrompt(brief),candidate=makeCandidate(code,unit,locale,article,brief,prompt);
   write(pths.brief,brief);write(pths.prompt,prompt);write(pths.candidate,candidate);paths[locale]=pths;candidates[locale]=candidate;
   candidateRegistry.records.push({candidateCode:candidate.candidateCode,nodeCode:candidate.nodeCode,articleUnitCode:code,compositionNodeCodes:unit.memberNodeCodes,locale,candidateVersion:'1.0.0',candidateDigest:candidate.candidateDigest,promptCode:prompt.promptCode,promptPackageDigest:prompt.promptPackageDigest,briefCode:brief.briefCode,briefDigest:brief.briefDigest,state:candidate.candidateState,review:'not_reviewed',approval:'not_approved',publication:'not_published',path:pths.candidate,supersedesSingleNodeCandidateForPublicArticle:true});
 }
 const first=c2Map.get(unit.memberNodeCodes[0]);
 const comp={articleUnitCode:code,memberNodeCodes:unit.memberNodeCodes,memberNodeCount:unit.memberNodeCount,briefPaths:{'zh-Hans':paths['zh-Hans'].brief,en:paths.en.brief},candidatePaths:{'zh-Hans':paths['zh-Hans'].candidate,en:paths.en.candidate},promptPaths:{'zh-Hans':paths['zh-Hans'].prompt,en:paths.en.prompt}};
 batchEntries.push({batchIndex:i+1,nodeCode:unit.anchorNodeCode,articleUnitCode:code,bookCode:unit.bookCode,partCode:unit.partCodes[0],locale:'zh-Hans',title:c.zh.title,readinessState:'ARTICLE_COMPOSITION_READY',canonicalNodeCoverageCount:unit.memberNodeCount,compositionUnit:comp});
 orchestration.push({batchIndex:i+1,nodeCode:unit.anchorNodeCode,articleUnitCode:code,bookCode:unit.bookCode,partCode:unit.partCodes[0],title:c.zh.title,sourceSelectionLocale:'zh-Hans',compositionUnit:comp,primaryCandidate:{state:'CANDIDATE_READY',path:paths['zh-Hans'].candidate,candidateCode:candidates['zh-Hans'].candidateCode,candidateDigest:candidates['zh-Hans'].candidateDigest,candidateState:'ready_for_human_review',validCandidateOnlyBoundary:true,blockers:[]},targetLocaleLanes:['zh-Hans','en'].map(locale=>({locale,state:'CANDIDATE_READY_FOR_BFA_FINAL_REVIEW',blockers:[],candidate:{state:'CANDIDATE_READY',path:paths[locale].candidate,candidateCode:candidates[locale].candidateCode,candidateDigest:candidates[locale].candidateDigest,candidateState:'ready_for_human_review',validCandidateOnlyBoundary:true,blockers:[]},localeArticleAuthorityState:'AWAITING_BFA_FINAL_REVIEW'})),apsL10nHandoff:{sequence:['ARTICLE_COMPOSITION_CANDIDATE','BFA_FINAL_REVIEW','PUBLICATION_EXECUTION'],downstreamAuthorityMayBegin:true}});
 generated.push({articleUnitCode:code,anchorNodeCode:unit.anchorNodeCode,memberNodeCodes:unit.memberNodeCodes,slug:c.slug});
}
// Dedupe exact candidateCode (idempotent generation).
const m=new Map();for(const r of candidateRegistry.records)m.set(r.candidateCode,r);candidateRegistry.records=[...m.values()].sort((a,b)=>String(a.candidateCode).localeCompare(String(b.candidateCode)));write(registryRel,candidateRegistry);
const batchBase={schemaVersion:'PHI-OS-APS-3-BFA-ARTICLE-COMPOSITION-v1.0.0',work:'APS-3',status:'READY_FOR_BFA_COMPOSITION_FINAL_REVIEW',implementationBaselineCommit:BASELINE,batchCode:'BATCH-003',createdAt:exists(`${batchDir}/batch-plan.v1.json`)?read(`${batchDir}/batch-plan.v1.json`).createdAt:new Date().toISOString(),request:{bookCode:'BOOK-1',requestedCount:24,requestedCountMeaning:'maximum_canonical_review_window_not_public_article_count'},sourceReadiness:{c2WindowNodeCount:24,freezeApprovedNodeCount:23,deferredNodeCount:1},selection:{selectedArticleUnitCount:5,canonicalNodeCoverageCount:23,explicitDeferredCount:1,deferredNodeCodes:['KN-PREFACE-003'],targetCanonicalNodesPerArticle:[4,5],articleUnitCodes:b3.articleUnitCodes},entries:batchEntries,governance:{canonicalNodeRemainsKnowledgeMinimum:true,publicArticleIsCompositionUnit:true,nodeToArticleOneToOneRequired:false,historicalPublishedArticlesPreserved:true,deferCreatesCandidateAuthority:false,humanFinalApprovalCreated:false,publicationCreated:false}};write(`${batchDir}/batch-plan.v1.json`,{...batchBase,batchDigest:`sha256:${digest(batchBase)}`});
const orchBase={schemaVersion:'PHI-OS-APS-4-ARTICLE-COMPOSITION-ORCHESTRATION-v1.0.0',work:'APS-4',status:'COMPOSITION_CANDIDATES_READY_FOR_BFA_FINAL_REVIEW',batchCode:'BATCH-003',articleUnitCount:5,canonicalNodeCoverageCount:23,localeCandidateCount:10,entries:orchestration,authorityBoundary:{candidateOnly:true,humanFinalApprovalCreated:false,publicationCreated:false}};write(`${batchDir}/candidate-orchestration.v1.json`,{...orchBase,orchestrationDigest:`sha256:${digest(orchBase)}`});
const reconBase={schemaVersion:'PHI-OS-BATCH-003-ARTICLE-COMPOSITION-REPAIR-v1.0.0',work:'BATCH-003_ARTICLE_COMPOSITION_REPAIR',baselineCommit:BASELINE,status:'CANDIDATES_REBUILT_AWAITING_BFA_FINAL_REVIEW',before:{singleNodePublicArticleCandidates:23,localeCandidates:46,liveFinalApprovals:staleApprovals.length},after:{articleCompositionUnits:5,canonicalNodeCoverageCount:23,localeCandidates:10,liveFinalApprovals:0},deferredNode:'KN-PREFACE-003',historicalApprovals:{preservedAt:archiveDir,count:staleApprovals.length,staleByDigest:true,mayAuthorizeCurrentPackages:false},generated};write(`${PROG}/composition-repair/BATCH-003-composition-repair-reconciliation-v1.json`,{...reconBase,sourceDigest:digest(reconBase)});
// Remove stale current review projection before deterministic rebuild.
for(const rel of [`${bfaDir}/review-data.json`,`${bfaDir}/review.html`])if(exists(rel))fs.rmSync(path.join(root,rel),{force:true});
const result=await buildBfaBatchFromAps(root,'BATCH-003',{write:true});
if(result.entries.length!==5||result.entries.some(x=>!x.package))throw new Error(`BFA composition build incomplete ${result.entries.length}`);
console.log(`✓ BATCH-003 Article Composition Repair: 23 TL-C2-approved nodes -> 5 public Article Composition Units -> 10 independent locale Candidates.`);
console.log(`✓ ${staleApprovals.length} pre-repair TL Final Approvals are preserved as stale historical evidence; live current approval count is 0.`);
console.log(`✓ BFA Final Review rebuilt: ${result.entries.filter(x=>x.package?.publicationReadiness?.state==='READY_FOR_FINAL_APPROVAL').length}/5 READY_FOR_FINAL_APPROVAL.`);
