import {profileEvidenceApi} from '../../account/profile-evidence-store.js';
import {draftApi} from '../../account/financial-will-draft-store.js';
import {personIdentity} from '../../account/canonical-person-store.js';
import {digest} from '../../account/oidc-auth.js';
import {boundedReportParagraphs} from './membership-navigation-pack.js';
import {approvedCrossLocaleSearch} from '../../knowledge-runtime/approved-terminology-context.js';

// Explicit context consent; existing encrypted stores retain ownership,
// expiry/integrity and source permissions. No new persistence or provider.
export async function buildOwnedMaterialMembershipPack(context,input,{profileReader=profileEvidenceApi,financialReader=draftApi}={}){
 const owner=personIdentity(context).userId;
 if(input.processingConsent!==true||!['PROFILE','FINANCIAL'].includes(input.family)||typeof input.objectId!=='string'||!input.objectId||typeof input.question!=='string'||!input.question.trim()||input.question.length>2000||!['en','zh-Hans'].includes(input.locale))throw Error('OWNED_MATERIAL_CONSENT_OR_INPUT_REQUIRED');
 const url=new URL(input.family==='PROFILE'?'/api/account-profile-evidence':'/api/account-financial-will-drafts',context.request.url);url.searchParams.set('id',input.objectId);
 const response=await (input.family==='PROFILE'?profileReader:financialReader)({...context,request:new Request(url,{headers:context.request.headers})});
 const result=await response.json();if(!response.ok||result.ok!==true)throw Object.assign(Error(result.code||'OWNED_MATERIAL_UNAVAILABLE'),{status:response.status});
 let sections,version,sourceClass;
 if(input.family==='PROFILE'){
  if(result.accountObject?.objectId!==input.objectId||result.view?.participantRef!==owner)throw Error('PROFILE_OWNER_IDENTITY_MISMATCH');
  // Approved unreleased dossier is deliberately excluded. Existing saved view
  // is evidence supplied/confirmed by the customer, not a released paid report.
  sections=[{sectionId:'profile-view',...result.view}];version=await digest(JSON.stringify({version:result.accountObject.version,view:result.view}));sourceClass='OWNED_PROFILE_EVIDENCE_NOT_RELEASED_DOSSIER';
 }else{
  if(result.draftId!==input.objectId||result.draftType!=='FINANCIAL'||!result.digest||await digest(JSON.stringify(result.payload))!==result.digest)throw Error('FINANCIAL_DRAFT_IDENTITY_MISMATCH');
  sections=Object.entries(result.payload).map(([key,value])=>({sectionId:key,body:JSON.stringify(value)}));version=result.digest;sourceClass='CUSTOMER_CONSENTED_INTAKE_NOT_EXTERNAL_FACT';
 }
 if(input.expectedSourceVersion&&input.expectedSourceVersion!==version)throw Error('OWNED_MATERIAL_VERSION_CHANGED');
 const query=input.locale==='en'?approvedCrossLocaleSearch(input.question,'en','zh-Hans').retrievalQuery:input.question;
 const paragraphs=boundedReportParagraphs({generatedSections:sections},query),sources=await Promise.all(paragraphs.map(async(p,i)=>({id:`S${i+1}`,chapterId:p.sectionId,sourceVersion:version,sourceSha256:version,sourceClass,sourceLanguage:/[\u3400-\u9fff]/u.test(p.text)?'zh-Hans':'en',text:p.text,support:{textSha256:await digest(p.text),paragraph:p.paragraph},fullReportAccess:false})));
 const pack={question:input.question,locale:input.locale,sources,glossary:[],ownerAccountId:owner,objectId:input.objectId,sourceVersion:version,accessBasis:'MEMBERSHIP_SHARED_CREDITS',state:sources.length?'OWNED_MATERIAL_PACK_READY':'RELEVANT_PROJECTION_UNAVAILABLE',constraints:{customerMaterialNotEstablishedFact:true,noUnreleasedDossier:true,noThirdPersonPsychology:true,noNewReport:true,noProviderInvocation:true},providerCalls:0};
 pack.packDigest=await digest(JSON.stringify(pack));return pack;
}
