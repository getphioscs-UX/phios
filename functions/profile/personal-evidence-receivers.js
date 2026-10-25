// Dispatch only: target owners create their own views; source owner rechecks every request.
import {receivePersonalEvidenceQuestion} from '../customer-projection/contextual-ask-customer-projection.js';
import {receivePersonalEvidenceFinancial} from '../customer-projection/financial-customer-projection.js';
import {receivePersonalEvidenceWorld} from '../customer-projection/ric-world-session.js';
import {onRequestPost as financialSummary} from '../api/account-financial-summary.js';
import {onRequestGet as worldRead} from '../api/world-observations.js';
import {selectEcrReflection,compareEcrReflection} from '../ecr-phi-card/ecr-user-reflection-r2.js';
import {projectExperienceHandoff,evidenceError} from './personal-evidence-records.js';
import {evidenceRequest} from '../_lib/world-evidence.js';
import {createConsentDataPurposeRuntime} from '../method-production-activation/consent-data-purpose-runtime.js';
import purposes from '../../content/governance/reality-data-governance/registries/canonical-data-purpose-registry-v1.json';
import classes from '../../content/governance/reality-data-governance/registries/canonical-consent-class-registry-v1.json';
import retention from '../../content/governance/reality-data-governance/registries/canonical-data-retention-registry-v1.json';
import visibility from '../../content/governance/reality-data-governance/registries/data-visibility-scope-registry-v1.json';
import {ECR_PHI_CARD_DECK} from '../ecr-phi-card/ecr-card-runtime-authority.js';
export const receiverConsentOwner=createConsentDataPurposeRuntime({purposeCodes:purposes.purposeCodes,consentClasses:classes.consentClasses,retentionClasses:retention.entries.map(x=>x.retentionClass),visibilityScopes:visibility.scopes});
export function personalEvidenceReceiverChoices(locale='en'){return ECR_PHI_CARD_DECK.cards.filter(c=>c.customerSelectable).map(c=>({id:c.cardId,title:c.title[locale]}));}
export async function receiveSelectedPersonalEvidence(context,records,input,{ownerId,now}){
 const source=projectExperienceHandoff(records,input,{ownerId,now}),locale=input.locale==='zh-Hans'?'zh-Hans':'en';
 let view;
 if(input.target==='ASK')view=receivePersonalEvidenceQuestion({references:source.references,question:input.purpose,locale});
 else if(input.target==='FINANCIAL'){
  let summary=null;
  if(input.savedDraftRef){if(input.financialConsent!==true)throw evidenceError('FINANCIAL_SOURCE_CONSENT_REQUIRED',403);
   const response=await financialSummary({...context,request:new Request(context.request.url,{method:'POST',headers:{'content-type':'application/json',origin:new URL(context.request.url).origin},body:JSON.stringify({savedDraftRef:input.savedDraftRef,consent:true,locale})})});
   summary=await response.json();if(!response.ok)throw evidenceError(summary.code||'FINANCIAL_SOURCE_UNAVAILABLE',response.status);
  }
  view=receivePersonalEvidenceFinancial({references:source.references,summary,locale});
 }else if(input.target==='WORLD'){
  let evidence=null;if(input.worldQuery){let query;try{query=evidenceRequest(input.worldQuery);}catch{throw evidenceError('WORLD_QUERY_INVALID',422);}const url=new URL('/api/world-observations',context.request.url);for(const[k,v]of Object.entries(query))url.searchParams.set(k,v);const response=await worldRead({request:new Request(url),env:context.env});const body=await response.json();if(!response.ok||!body.evidence)throw evidenceError('WORLD_QUERY_INVALID',422);evidence=body.evidence;}
  view=receivePersonalEvidenceWorld({references:source.references,evidence,locale});
 }else if(input.target==='CONFIGURATION'){
  if(input.configurationConsent!==true||!input.reflection)throw evidenceError('CONFIGURATION_SELECTION_CONSENT_REQUIRED',403);
  const reflection=selectEcrReflection({cardIds:input.reflection.cardIds,locale});
  const comparison=compareEcrReflection({reflection,feedback:input.reflection.feedback,counterexample:input.reflection.counterexample||'',observation:source.references.map(r=>r.observationPeriod.start+': '+r.action+'; '+r.unknowns).join('\n').slice(0,4000)});
  view={surface:'CONFIGURATION',received:true,interpretation:comparison.reflection.cards,observedEvidence:source.references,comparison,configurationSource:'USER_SELECTED_PHI_CARD_REFLECTION_NOT_BIRTH_CONFIGURATION',birthConfigurationState:'NO_AUTHORIZED_PRIVATE_READER',predictionValidated:false,providerCalls:0};
 }else throw evidenceError('RECEIVER_TARGET_NOT_ADMITTED');
 return {target:input.target,view,sourceReferences:source.references,purpose:source.purpose,expiresAt:source.expiresAt,receiverState:'CONSUMED_BY_EXISTING_OWNER',automaticPersistence:false,providerCalls:0};
}
