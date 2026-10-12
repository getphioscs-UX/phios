import {reopenCanonicalNavigationHandoff} from '../../customer-projection/canonical-navigation-handoff.js';
import {openOwnedMethodReport} from '../../account/method-report-delivery.js';
import {readReportQuestionHistory} from '../../account/report-followup-store.js';
import {personIdentity} from '../../account/canonical-person-store.js';
import {digest} from '../../account/oidc-auth.js';
function nativeStrings(value){if(typeof value==='string')return [value];if(Array.isArray(value))return value.flatMap(nativeStrings);if(!value||typeof value!=='object')return [];return Object.entries(value).filter(([k])=>!/(id|ref|version|digest|html|image|path|url)$/i.test(k)).flatMap(([,v])=>nativeStrings(v));}
// Preserve entire native paragraphs. Never truncate a long condition to fit a budget.
export function boundedReportParagraphs(artifact,question){
 const words=[...new Intl.Segmenter('zh',{granularity:'word'}).segment(question)].filter(s=>s.isWordLike&&s.segment.length>1).map(s=>s.segment.toLowerCase());
 const rows=(artifact.generatedSections||[]).flatMap((s,index)=>nativeStrings(s).flatMap(x=>x.split(/\n\s*\n/)).filter(x=>x.trim()).map((text,p)=>({text,sectionId:s.sectionId||String(index),paragraph:p,score:words.filter(w=>text.toLowerCase().includes(w)).length}))).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
 const chosen=[];let bytes=0;for(const row of rows){const n=new TextEncoder().encode(row.text).length;if(n>6000||bytes+n>10000)continue;chosen.push(row);bytes+=n;if(chosen.length===3)break;}return chosen;
}
export async function buildNavigationMembershipPack(context,{navigationRecordId,question,locale},{reopen=reopenCanonicalNavigationHandoff,openReport=openOwnedMethodReport,readQuestions=readReportQuestionHistory}={}){
 if(typeof question!=='string'||!question.trim()||question.length>2000||!['en','zh-Hans'].includes(locale)||typeof navigationRecordId!=='string')throw Object.assign(Error('NAVIGATION_ASK_INPUT_INVALID'),{status:400});
 const owner=personIdentity(context).userId,nav=await reopen(context,navigationRecordId);
 if(nav.snapshot.ownerAccountId!==owner||nav.snapshot.consent.processing!==true||nav.persistenceState!=='ESTABLISHED')throw Object.assign(Error('NAVIGATION_OWNER_OR_CONSENT_REQUIRED'),{status:403});
 if(nav.objectScope.productFamily!=='BAZI')throw Object.assign(Error('NAVIGATION_SOURCE_PROSE_ADAPTER_PENDING'),{status:409});
 const {artifact}=await openReport(context,nav.objectScope.objectId);if(!artifact||artifact.customerId!==owner||artifact.artifactDigest!==nav.sourceVersion)throw Object.assign(Error('NAVIGATION_REPORT_VERSION_CHANGED'),{status:409});
 const paragraphs=boundedReportParagraphs(artifact,question),sources=[];for(const p of paragraphs)sources.push({id:'S'+(sources.length+1),chapterId:p.sectionId,sourceClass:'OWNED_REPORT_INTERPRETATION',sourceVersion:artifact.reportContentVersion,sourceSha256:artifact.artifactDigest,support:{textSha256:await digest(p.text),paragraph:p.paragraph},text:p.text,readingHref:'/api/account-method-reports?reportId='+encodeURIComponent(nav.objectScope.objectId),sourceLanguage:locale});
 const history=await readQuestions(context.env,{ownerAccountId:owner,reportId:nav.objectScope.objectId});
 return {question,locale,sources,glossary:[],packDigest:await digest(JSON.stringify({question,locale,sources,navigationRecordId,sourceVersion:nav.sourceVersion})),customerContext:nav.snapshot.reportedContext,sourceIdentity:nav.sourceIdentity,sourceVersion:nav.sourceVersion,navigationRecordId,sourceState:sources.length?'BOUND_NATIVE_REPORT_PARAGRAPHS':'RELEVANT_REPORT_PROJECTION_UNAVAILABLE',accessBasis:history.includedRemaining>0?'EXISTING_INCLUDED_REPORT_FOLLOWUP':'MEMBERSHIP_SHARED_CREDITS',includedRemaining:history.includedRemaining,existingBenefitEndpoint:'/api/account-report-questions',constraints:{noNewReport:true,noPersonalFactInference:true,noHistoryBackfill:true,noDirectionGuarantee:true,sourceOnly:true,claimCitationsRequired:true,answerLocale:locale},providerCalls:0};
}
