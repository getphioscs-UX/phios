import {ECR_PHI_CARD_DECK,ECR_PHI_CARD_ASSETS} from './ecr-card-runtime-authority.js';

export const ECR_REFLECTION_FEEDBACK=Object.freeze(['SUPPORT','PARTIAL','OPPOSE','UNKNOWN']);
export function selectEcrReflection({cardIds,locale='en',selectedConfigurationRefs=[]}={}) {
 if(!['en','zh-Hans'].includes(locale))throw Error('REFLECTION_LANGUAGE_INVALID');
 if(!Array.isArray(cardIds)||![1,3].includes(cardIds.length)||new Set(cardIds).size!==cardIds.length)throw Error('SELECT_ONE_OR_THREE_DISTINCT_CARDS');
 if(!Array.isArray(selectedConfigurationRefs)||selectedConfigurationRefs.some(r=>typeof r!=='string'||!r.trim()||r.length>200))throw Error('EXPLICIT_REFERENCE_INVALID');
 const slots=['CURRENT_FOCUS','CONDITIONS_TO_EXAMINE','POSSIBLE_NEXT_CONSIDERATION'];
 return {schemaVersion:'PHI-OS-ECR-USER-REFLECTION-R2-v1',mode:cardIds.length===1?'USER_SELECTED_ONE':'USER_SELECTED_THREE',locale,
  cards:cardIds.map((id,i)=>{const card=ECR_PHI_CARD_DECK.cards.find(c=>c.cardId===id);if(!card||!card.customerSelectable)throw Error('CARD_NOT_SELECTABLE');return {slot:slots[i],cardId:id,
   title:card.title[locale],meaning:card.canonicalCustomerMeaning[locale],flowingExpression:card.flowingExpression[locale],strainedExpression:card.strainedExpression[locale],question:card.observationPrompt[locale],
   asset:ECR_PHI_CARD_ASSETS.assets.find(a=>a.cardId===id),authorityRef:ECR_PHI_CARD_DECK.schemaVersion};}),
  selectedConfigurationRefs:[...selectedConfigurationRefs],automaticPersistence:false,birthRequired:false,profileRequired:false,randomSelection:false,objectiveVerification:false};
}
export function compareEcrReflection({reflection,feedback,counterexample='',observation=''}={}){
 if(reflection?.schemaVersion!=='PHI-OS-ECR-USER-REFLECTION-R2-v1'||!ECR_REFLECTION_FEEDBACK.includes(feedback))throw Error('REFLECTION_COMPARISON_INVALID');
 if(typeof counterexample!=='string'||typeof observation!=='string'||counterexample.length>4000||observation.length>4000)throw Error('REFLECTION_TEXT_INVALID');
 const canonical=selectEcrReflection({cardIds:reflection.cards?.map(c=>c.cardId),locale:reflection.locale,selectedConfigurationRefs:reflection.selectedConfigurationRefs});
 return {schemaVersion:'PHI-OS-ECR-REFLECTION-COMPARISON-R2-v1',reflection:canonical,feedback,counterexample,observation,provenance:'USER_DECLARATION',objectiveVerification:false,automaticPersistence:false,profileFactCreated:false};
}
