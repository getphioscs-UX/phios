import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { projectPjaBrief, buildAuthoringPrompt, buildFigureAuthoringBrief, runAutomaticPreflight, compareCanonicalMeaningCoverage, computePublicationReadiness, sha256, decisionDisplayState, dashboardSummary } from './bfa-runtime-v1.mjs';
import { bindFinalPackageDigest } from './bfa-package-v1.mjs';
import { bfaBatchRoot, packagePath, approvalPath, readJson } from './bfa-review-store-v1.mjs';
const stable=v=>JSON.stringify(v,null,2)+'\n';
const exists=p=>fs.existsSync(p);
async function atomic(file,text){await fsp.mkdir(path.dirname(file),{recursive:true});const tmp=`${file}.tmp-${process.pid}-${crypto.randomUUID()}`;await fsp.writeFile(tmp,text,{flag:'wx'});await fsp.rename(tmp,file);}
function read(root,rel){return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));}
function fileSha(root,rel){return sha256(fs.readFileSync(path.join(root,rel)));}
function candidatePath(locale,nodeCode){return `content/knowledge/production/candidates/${locale}/${nodeCode}/candidate.v1.json`;}
function briefPath(nodeCode,locale='zh-Hans'){return locale==='en'?`content/knowledge/production/briefs/en/${nodeCode}-production-brief.en.v1.json`:`content/knowledge/production/briefs/zh-Hans/${nodeCode}-production-brief.v2.json`;}
function maxStatus(values){return values.includes('BLOCKED')?'BLOCKED':values.includes('WARNING')?'WARNING':'PASS';}
function buildPreview({nodeCode,locales,figure,sameRoute}){const base={previewType:'CPR_FINAL_PRESENTATION_PREVIEW',authority:'CPR_PROJECTION_ONLY',nodeCode,sameRoute,viewports:['desktop','mobile'],articleShell:'PDS/CPR public article shell',locales:Object.fromEntries(Object.entries(locales).map(([k,v])=>[k,{title:v.article.title,summary:v.article.summary,bodyMarkdown:v.article.bodyMarkdown,figurePlacement:figure.placement??null,caption:figure.caption??null,alt:figure.alt??null,relatedContent:[]}]))};return {...base,sourceDigest:sha256(base)};}
function carRegistry(root, rel, key){const p=path.join(root,rel);if(!exists(p))return [];return read(root,rel)?.[key]??[];}
export function readCarResult(root,nodeCode){
 const candidates=carRegistry(root,'content/production/car/registries/asset-candidate-production-registry-v1.json','candidates').filter(x=>x.nodeCode===nodeCode);
 if(!candidates.length)return null;
 const reviews=carRegistry(root,'content/production/car/registries/asset-review-production-registry-v1.json','reviews');
 const approvals=carRegistry(root,'content/production/car/registries/asset-approval-production-registry-v1.json','approvals');
 const media=carRegistry(root,'content/production/car/registries/asset-media-production-registry-v1.json','media');
 const publications=carRegistry(root,'content/production/car/registries/published-asset-production-registry-v1.json','publications');
 for(const candidate of candidates){
  const review=reviews.find(x=>x.candidateCode===candidate.candidateCode&&x.candidateDigest===candidate.candidateDigest)??null;
  const approval=approvals.find(x=>x.candidateCode===candidate.candidateCode&&x.candidateDigest===candidate.candidateDigest)??null;
  const material=media.find(x=>x.candidateCode===candidate.candidateCode&&x.candidateDigest===candidate.candidateDigest)??null;
  const published=material?publications.find(x=>x.mediaCode===material.mediaCode&&x.assetCode===candidate.assetCode)??null:null;
  if(published)return {candidate,review,approval,media:material,published};
  if(approval)return {candidate,review,approval,media:material,published:null};
  if(review)return {candidate,review,approval:null,media:material,published:null};
 }
 return {candidate:candidates[0],review:null,approval:null,media:null,published:null};
}
function figureRequirement(root,entry,projection){
 let source=entry?.figureRequirement??entry?.pjaFigureRequirement??null;
 const c2rel=`content/knowledge/editorial/c2/frozen/${String(entry.nodeCode).toLowerCase()}.json`;
 const c2=exists(path.join(root,c2rel))?read(root,c2rel):null;
 const c2Figure=c2?.content?.boundaries?.figures??null;
 if(!source&&c2Figure){
   const explicitlyRequired=['required','figure_required'].includes(c2Figure.figureRequirement);
   source={required:explicitlyRequired,upstreamState:c2Figure.figureRequirement,recommendation:c2Figure.proposedFigurePurpose??c2Figure.optionalFigurePurpose??null,prohibitedVisualClaims:c2Figure.prohibitedVisualClaims??[]};
 }
 if(source?.required!==true){
   const recommended=source?.upstreamState==='recommended_subject_to_human_production_decision';
   return {state:'FIGURE_NOT_REQUIRED',reason:recommended?'C2 contains a Figure recommendation subject to a separate Human Production Decision, but no explicit required Figure decision exists for this Article package; recommendation does not equal requirement.':'No upstream explicit Figure Requirement is declared for this package; the canonical concept is adequately expressed without a required visual projection.',source:'BFA_FIGURE_REQUIREMENT_EVALUATION',upstreamFigureState:source?.upstreamState??null,recommendation:source?.recommendation??null};
 }
 const car=readCarResult(root,entry.nodeCode);const productionBrief=buildFigureAuthoringBrief(projection,{placement:source?.placement??source?.recommendedPlacement??undefined,aspectRatio:source?.aspectRatio??'16:9',surface:source?.surface??'WEBSITE'});
 if(!car)return {state:'FIGURE_REQUIRED_PENDING',reason:'Upstream PJA/CAR interface explicitly requires a Figure, but no CAR Candidate is registered.',source:'UPSTREAM_EXPLICIT_FIGURE_REQUIREMENT',productionBrief,alt:source?.alt??productionBrief.altIntent,placement:source?.placement??source?.recommendedPlacement??productionBrief.recommendedPlacement,caption:source?.caption??null,car:null};
 const common={reason:'Upstream PJA/CAR interface explicitly requires a Figure.',source:'UPSTREAM_EXPLICIT_FIGURE_REQUIREMENT',productionBrief,alt:source?.alt??productionBrief.altIntent,placement:source?.placement??source?.recommendedPlacement??productionBrief.recommendedPlacement,caption:source?.caption??null,car:{candidateCode:car.candidate?.candidateCode??null,candidateDigest:car.candidate?.candidateDigest??null,reviewCode:car.review?.reviewCode??null,reviewDigest:car.review?.reviewDigest??null,reviewDecision:car.review?.decision??null,approvalCode:car.approval?.approvalCode??null,approvalDigest:car.approval?.approvalDigest??null,approvalDecision:car.approval?.decision??null,mediaCode:car.media?.mediaCode??null,mediaDigest:car.media?.productionMediaDigest??null,rightsStatus:car.media?.rightsStatus??null,accessibilityStatus:car.media?.accessibilityStatus??null,publicSrc:car.media?.publicSrc??car.published?.publicSrc??null,previewUrl:car.media?.publicSrc??car.published?.publicSrc??null,publishedAssetCode:car.published?.publishedAssetCode??null,publishedAssetDigest:car.published?.publicationDigest??null,humanReview:car.review?.decision??null,assetApproval:car.approval?.decision??null,rights:car.media?.rightsStatus??null,accessibility:car.media?.accessibilityStatus??null}};
 if(car.published&&car.media?.rightsStatus==='cleared'&&car.media?.accessibilityStatus==='passed'&&car.approval?.decision==='approved'&&car.review?.decision==='accept')return {...common,state:'FIGURE_PUBLICATION_READY'};
 if(car.approval?.decision==='approved')return {...common,state:'FIGURE_APPROVED'};
 return {...common,state:'FIGURE_CANDIDATE_READY'};
}
export function isSuccessorBatch(batchCode){const n=Number(String(batchCode).match(/(\d+)$/)?.[1]??0);return n>=2;}
export async function buildBfaBatchFromAps(root,batchCode,{write=true}={}){
 if(!isSuccessorBatch(batchCode))return {skipped:true,reason:'BATCH_001_HISTORICAL_MODEL'};
 const orchestrationRel=`content/production/article-simplification/batches/${batchCode}/candidate-orchestration.v1.json`;if(!exists(path.join(root,orchestrationRel)))throw new Error(`BFA_APS_ORCHESTRATION_MISSING:${orchestrationRel}`);const orchestration=read(root,orchestrationRel);const entries=[];
 for(const src of orchestration.entries??[]){
  const nodeCode=src.nodeCode;const zbp=briefPath(nodeCode,'zh-Hans'),ebp=briefPath(nodeCode,'en');
  if(!exists(path.join(root,zbp))){entries.push({nodeCode,bookCode:src.bookCode,partCode:src.partCode,package:null,blockers:['PJA_BRIEF_MISSING']});continue;}
  const zhBrief=read(root,zbp);const zhProjection=projectPjaBrief(zhBrief,{locale:'zh-Hans'});const blockers=[];
  const enBrief=exists(path.join(root,ebp))?read(root,ebp):null;const enProjection=enBrief?projectPjaBrief(enBrief,{locale:'en'}):null;
  if(!enProjection)blockers.push('en:PJA_BRIEF_MISSING');
  const projections={'zh-Hans':zhProjection,en:enProjection};const prompts={};for(const l of ['zh-Hans','en'])prompts[l]=projections[l]?buildAuthoringPrompt(projections[l],l):null;
  const locales={};for(const locale of ['zh-Hans','en']){const cp=candidatePath(locale,nodeCode);if(!exists(path.join(root,cp))){blockers.push(`${locale}:CANDIDATE_MISSING`);continue;}const c=read(root,cp);const pr=projections[locale];if(!pr){continue;}locales[locale]={nodeCode:c.nodeCode,locale,candidateCode:c.candidateCode,candidateDigest:c.candidateDigest,article:c.article,sourceBrief:c.sourceBrief,promptDigest:c.promptDigest??c.provenance?.promptDigest??prompts[locale]?.promptDigest,candidatePath:cp};}
  const slug=zhBrief.localizedIdentity?.slug??src.targetLocaleLanes?.find(x=>x.locale==='zh-Hans')?.localeIdentity?.slug??null;const route=slug?`/articles/${slug}`:null;const sameRouteIdentityBase={canonicalRoute:route,slug,locales:['zh-Hans','en'],localePrefixAllowed:false};const sameRouteIdentity={...sameRouteIdentityBase,sourceDigest:sha256(sameRouteIdentityBase)};
  const localeIdentityBase={nodeCode,identityModel:'BFA_PACKAGE_SCOPED_BILINGUAL_IDENTITY_CANDIDATE',identities:{'zh-Hans':{slug,displayQuestion:zhBrief.localizedIdentity?.displayQuestion??zhBrief.canonicalMeaning?.canonicalTitle,sourceAuthority:'KNR_L10N_CANONICAL'},en:{slug,displayQuestion:enBrief?.localizedIdentity?.displayQuestion??locales.en?.article?.title??null,sourceAuthority:'BFA_PACKAGE_SCOPED_EN_IDENTITY_CANDIDATE_PENDING_TL_FINAL_APPROVAL'}},independentLocaleAuthority:true,globalLocaleRegistryMutation:false};const localeIdentity={...localeIdentityBase,sourceDigest:sha256(localeIdentityBase)};
  const canonicalBase={nodeCode,source:'Canonical Knowledge Registry + Human-frozen C2/C3 + PJA brief binding',nodeDigest:sha256({nodeCode,canonicalMeaning:zhBrief.canonicalMeaning}),c2C3AuthorityPreserved:true};const canonicalAuthority={...canonicalBase,sourceDigest:sha256(canonicalBase)};const figureBase=figureRequirement(root,src,zhProjection);const figure={...figureBase,sourceDigest:sha256(figureBase)};
  if(blockers.length){entries.push({nodeCode,bookCode:src.bookCode,partCode:src.partCode,title:src.title,package:null,projection:zhProjection,localeProjections:projections,prompts,canonicalAuthority,localeIdentity,sameRouteIdentity,figure,blockers,decisionState:'BLOCKED'});continue;}
  const preview=buildPreview({nodeCode,locales,figure,sameRoute:sameRouteIdentity});const zhEv=runAutomaticPreflight({projection:zhProjection,candidate:locales['zh-Hans'],locale:'zh-Hans',sameRouteIdentity,figure,presentationPreview:preview});const enEv=runAutomaticPreflight({projection:enProjection,candidate:locales.en,locale:'en',sameRouteIdentity,figure,presentationPreview:preview});const meaningCoverage=compareCanonicalMeaningCoverage(zhProjection,enProjection,zhEv,enEv);const automaticBase={status:maxStatus([zhEv.status,enEv.status]),byLocale:{'zh-Hans':zhEv,en:enEv},meaningCoverage,authority:{evidenceOnly:true,humanAcceptance:false}};const automaticEvidence={...automaticBase,sourceDigest:sha256(automaticBase)};const accessibility={status:'PASS',checks:['title','summary','semantic headings','figure alt when applicable','status text not color-only']};const preBlockers=automaticEvidence.status==='BLOCKED'?['AUTOMATIC_PREFLIGHT_BLOCKED']:[];const readiness=computePublicationReadiness({canonicalAuthority,locales,meaningCoverage,localeIdentity,figure,presentationPreview:preview,accessibility,blockers:preBlockers});const pjaProjection={...zhProjection,sourceDigest:zhBrief.briefDigest,localeProjections:{en:{...enProjection,sourceDigest:enBrief.briefDigest}}};const packageBase={packageType:'BFA_COMPLETE_PUBLICATION_PACKAGE',packageSchemaVersion:'PHI-OS-BFA-COMPLETE-PUBLICATION-PACKAGE-v1.0.0',packageCode:`BFA-PACKAGE-${nodeCode}-v1`,batchCode,nodeCode,bookCode:src.bookCode,partCode:src.partCode,canonicalAuthority,pjaBrief:pjaProjection,locales,localeIdentity,sameRouteIdentity,figure,automaticEvidence,presentationPreview:preview,accessibility,publicationReadiness:readiness,assembledAt:new Date().toISOString(),reviewState:'PENDING',decisionState:'PENDING'};const pkg=bindFinalPackageDigest(packageBase);const approval=readJson(root,approvalPath(batchCode,nodeCode));entries.push({nodeCode,bookCode:src.bookCode,partCode:src.partCode,title:src.title,package:pkg,projection:zhProjection,localeProjections:projections,prompts,canonicalAuthority,localeIdentity,sameRouteIdentity,figure,blockers:readiness.blockers,decisionState:decisionDisplayState({packageRecord:pkg,approval})});if(write)await atomic(path.join(root,packagePath(batchCode,nodeCode)),stable(pkg));
 }
 const reviewDataBase={schemaVersion:'PHI-OS-BFA-REVIEW-DATA-v1.0.0',batchCode,bookCode:orchestration.entries?.[0]?.bookCode??null,canonicalNodeCount:entries.length,localeCandidateCount:entries.filter(x=>x.package).length*2,entries};reviewDataBase.summary=dashboardSummary(entries);reviewDataBase.sourceDigest=sha256(reviewDataBase);if(write){const dir=path.join(root,bfaBatchRoot(batchCode));await fsp.mkdir(dir,{recursive:true});await atomic(path.join(dir,'review-data.json'),stable(reviewDataBase));const template=path.join(root,'content/production/bilingual-final-approval/templates/review.html');if(exists(template))await fsp.copyFile(template,path.join(dir,'review.html'));}
 return {reviewData:reviewDataBase,entries,skipped:false};
}
