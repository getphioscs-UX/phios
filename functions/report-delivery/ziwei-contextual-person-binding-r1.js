import {generateAccountZiweiCandidate} from './ziwei-canonical-person-binding.js';
import {controlledZiweiIdentity,ZIWEI_PRODUCT} from './ziwei-production-generation-v1.js';
import {consumeOwnedRealityBrief} from '../report-context/report-context-store.js';
import {reportMode,assertReportRealityBrief,fail} from '../report-context/report-context-admission.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {bindZiweiReportVisual} from '../canonical-presentation-runtime/ziwei-report-visuals.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export const ZIWEI_CONTEXT_COMPOSITION='ZIWEI-CONTEXTUAL-RCA-R1';
const MATCH={CURRENTLY_RESONANT:['与你目前描述的情况有明显对应','Corresponds with your current account'],PARTIALLY_RESONANT:['部分与当前情况相符，但并不完整','Partly corresponds with your account'],CURRENTLY_NOT_RESONANT:['目前的现实并没有呈现这一主题','Your current account does not present this theme'],OPEN:['目前还没有足够现实资料进行对照','The comparison remains open']};
export async function overlayZiweiContext(candidate,brief){
 await assertReportRealityBrief(brief,{ownerAccountId:candidate.customerId,personId:candidate.personId,reportProductId:ZIWEI_PRODUCT,methodId:'ZWR'});
 if(candidate.snapshot.compositionVersion!=='ZIWEI-PROFESSIONAL-SYNTHESIS-R5'||candidate.snapshot.semanticContent.report.totalPages!==39||brief.observations.length!==1)fail('CONTEXTUAL_REPORT_AUTHORITY_UNAVAILABLE',503);
 const s=structuredClone(candidate.snapshot.semanticContent),zh=candidate.locale==='zh-Hans',observation=brief.observations[0],section=s.sections.find(x=>x.sectionId===observation.sectionId);
 const theme=section?.synthesisIr?.keyInsights?.[0],claim=section?.synthesisIr?.claims?.[0]||section?.claims?.[0];
 if(!theme||!claim?.claimId)fail('CONTEXTUAL_REPORT_AUTHORITY_UNAVAILABLE',503);
 const state=observation.comparisonState,comparison=MATCH[state]?.[zh?0:1];if(!comparison)fail('REPORT_COMPARISON_INVALID');
 const boundary=zh?'这是你确认的当前描述与该主题之间的对照，不证明它由命盘造成，也不保证之后的结果。':'This compares your confirmed account with the theme; it establishes neither causation by the chart nor a guaranteed outcome.';
 const contextualParagraph=(zh?'这份读取在此关注：':'This reading places emphasis on: ')+theme+(zh?'。你目前表示：“':' Your current account is: “')+observation.statement+(zh?'”。':'” ') +comparison+(zh?'。':' ')+boundary;
 const trace={methodClaimRef:claim.claimId,realityObservationRefs:[observation.observationId],realityBriefId:brief.realityBriefId,comparisonState:state,knowledgeState:'CUSTOMER_SELF_REPORTED',reportSectionId:section.sectionId,canonicalReadingRef:candidate.snapshot.semanticSnapshotId,allowedUse:'CURRENT_COMPARISON'};
 const template=s.report.pages.find(p=>p.sectionId===section.sectionId&&p.pageFamily!=='SECTION_OPENER_PAGE');if(!template)fail('CONTEXTUAL_REPORT_AUTHORITY_UNAVAILABLE',503);
 const make=(key,title,paragraphs)=>({...structuredClone(template),pageKey:'ZWR:CONTEXT:'+key,definitionKey:'ZWR:CONTEXT:'+key,physicalPageRole:'CONTEXTUAL_COMPARISON',compositionGroupId:'ZWR:CONTEXT:'+key,title,paragraphs,compositionNodes:undefined,primaryVisualHtml:null,items:[],facts:[],observations:[],boundary:'',sourceClaimRefs:[claim.claimId],sourceNodeIds:[observation.observationId],contextualTrace:trace});
 const extra=make('CURRENT',zh?'本报告结合的当前情况':'Current context used in this report',[(zh?'你希望理解：':'You would like to understand: ')+brief.primaryQuestion,contextualParagraph,(zh?'资料来自你本人；尚未独立验证。':'This material is customer-reported and has not been independently verified.')]);
 const lastIndex=s.report.pages.map(p=>p.sectionId).lastIndexOf(section.sectionId);s.report.pages.splice(lastIndex+1,0,extra);
 const summary=make('INTEGRATION',zh?'当这份读取遇见你现在的现实':'When This Reading Meets Your Current Reality',[comparison+(zh?'。':' ')+(zh?'这次对照保留你所描述的实际情况；不相符的部分无需改写成一致。':'This comparison retains your actual account; disagreement does not need to be rewritten as agreement.'),(zh?'接下来值得观察的是：这段具体情境发生变化时，你确认的描述是否也改变。新的观察可以用于下一份读取，已发布的这份报告保持原样。':'The next useful observation is whether your account changes when this specific situation changes. A new observation can inform a later reading; this released report remains unchanged.')]);
 s.report.pages.push(summary);s.report.pages.forEach((p,i)=>{p.pageNumber=i+7;if(p.contextualTrace)p.visualBinding=bindZiweiReportVisual({sectionId:p.sectionId,pageNumber:p.pageNumber,isMaster:false});});s.report.totalPages=41;
 s.report.physicalComposition={...s.report.physicalComposition,version:ZIWEI_CONTEXT_COMPOSITION};
 s.reportContext={reportMode:'CONTEXTUAL_READING',realityBriefId:brief.realityBriefId,realityBriefDigest:brief.realityBriefDigest,realityAsOf:brief.asOf,admissionState:brief.admissionState,primaryQuestionRef:brief.contextIntentId,observationIds:brief.observations.map(o=>o.observationId),canonicalMethodDigest:await sha256Stable({sections:s.sections,evidence:s.evidence}),authorityLanes:{methodAuthority:{canonicalSnapshotId:candidate.snapshot.semanticSnapshotId,authorityVersion:candidate.snapshot.authorityVersion},personalEvidence:null,currentReality:brief,reportIntent:{primaryQuestion:brief.primaryQuestion,reportMode:brief.reportMode}},traces:[trace],automaticPersistence:false};
 const snapshot=await createCustomerDeliverySnapshot({...candidate.snapshot,compositionVersion:ZIWEI_CONTEXT_COMPOSITION,semanticContent:s});
 return {...candidate,snapshot,generationSuccessor:ZIWEI_CONTEXT_COMPOSITION,productionAdmissionGranted:false};
}
export {assertZiweiContextSnapshot} from '../report-context/ziwei-contextual-snapshot-contract.js';
export async function generateContextualAccountZiweiCandidate(context,selection){
 if(!selection||Object.keys(selection).some(k=>!['personId','locale','targetContext','reportMode','realityBriefId'].includes(k)))fail('ZIWEI_SELECTION_INVALID');
 const mode=reportMode(selection.reportMode),canonical={personId:selection.personId,locale:selection.locale,targetContext:selection.targetContext};
 if(mode==='CANONICAL_READING'){if(selection.realityBriefId)fail('CANONICAL_HAS_NO_REALITY_BRIEF');return generateAccountZiweiCandidate(context,canonical);}
 const owner=controlledZiweiIdentity(context).userId;if(!owner||typeof selection.realityBriefId!=='string')fail('CONTEXTUAL_REALITY_BRIEF_REQUIRED');
 const brief=await consumeOwnedRealityBrief(context,selection.realityBriefId,selection.personId,selection.locale);
 const candidate=await generateAccountZiweiCandidate(context,canonical);return overlayZiweiContext(candidate,brief);
}
