// Local compatibility candidate. Existing owners must supply immutable admitted
// results and authenticated access; this module grants neither.
import {selectEcrPhiCards} from '../../functions/ecr-phi-card/ecr-card-selector.js';
export const GROUPS=Object.freeze(['CORE','DRIVER','GIFT','TENSION','FIELD','PHASE']);
const clone=x=>structuredClone(x),text=(x,l)=>x?.[l]||'';
export function createPhiCardReadingCandidate({deck,mapping,assets,resolveOwnedResult}){
 const byId=new Map(deck.cards.map(c=>[c.cardId,c]));
 const fixed=(c,locale)=>({cardId:c.cardId,groupId:c.groupId,title:text(c.title,locale),subtitle:text(c.subtitle,locale),meaning:text(c.canonicalCustomerMeaning,locale),insight:text(c.oneLineInsight,locale),prompt:text(c.observationPrompt,locale),asset:clone(assets.assets.find(a=>a.cardId===c.cardId)),assetStatus:'ASSET_NOT_VERIFIED'});
 const requireLocale=l=>{if(!['en','zh-Hans'].includes(l))throw Error('CARD_LANGUAGE_UNSUPPORTED');};
 return Object.freeze({
  gallery(locale){requireLocale(locale);return deck.cards.map(c=>fixed(c,locale));},
  async personal({principal,resultId,locale}){
   requireLocale(locale);
   // The resolver is a server-side adapter of the existing result/entitlement
   // owner, never an entitlement flag submitted by the browser.
   const result=await resolveOwnedResult({principal,resultId});
   if(!principal||!result||result.ownerId!==principal.userId||result.entitlementProductId!=='ECR_FULL_REPORT')throw Error('CARD_RESULT_ACCESS_DENIED');
   if(!result.interpretationVersion||!result.calculationVersion||!result.resultDigest||result.customerPublishable!==true||!result.admissionRef)throw Error('CARD_ADMITTED_RESULT_REQUIRED');
   if(!result.coordinate||!result.interpretations?.[locale]?.length)throw Error('CARD_MAPPING_OR_LANGUAGE_NOT_ADMITTED');
   const drivers=result.coordinate.ECR_DRIVER_PRIORITY||[];
   if(drivers.some(x=>x.meta?.classification!=='BASELINE_AFFINITY_NOT_CURRENT_REALITY_PRIORITY'))throw Error('CARD_BASELINE_DRIVER_SOURCE_REQUIRED');
   const units=result.interpretations[locale];
   const selection=selectEcrPhiCards({coordinate:result.coordinate,interpretationUnits:units,customerPublishable:true},mapping,deck);
   const cards=GROUPS.flatMap(group=>{
    const selected=selection.groups[group];if(!selected){if(group==='TENSION')return [];throw Error('CARD_MAPPING_INCOMPLETE:'+group);}
    const card=byId.get(selected.cardId);if(!card||card.groupId!==group)throw Error('CARD_MAPPING_IDENTITY_MISMATCH');
    // Context is restricted to explicit group bindings supplied by the same
    // admitted interpretation owner. No keyword match or first-unit fallback.
    const bound=new Set(result.cardContextUnitIds?.[group]||[]);
    const context=units.filter(u=>bound.has(u.interpretationUnitId));
    return [{...fixed(card,locale),why:group==='TENSION'?(locale==='en'?'An existing mapping condition is satisfied; this is not a current negative fact.':'现有映射条件满足；这并非当前负面事实。'):(locale==='en'?'Selected by the frozen mapping from this configuration.':'由本次配置通过冻结映射选出。'),context:context.map(u=>({id:u.interpretationUnitId,signal:u.observableSignals?.[0]||null,question:u.realityComparisonQuestions?.[0]||null})),contextStatus:context.length?'BOUND_EXISTING_INTERPRETATION':'CONTEXT_NOT_BOUND',lineage:{selectionReasons:selected.reasons,unitIds:context.map(u=>u.interpretationUnitId)}}];
   });
   return {title:locale==='en'?'PHI Card Reading':'PHI 配置卡片阅读',resultId,calculationVersion:result.calculationVersion,interpretationVersion:result.interpretationVersion,resultDigest:result.resultDigest,admissionRef:result.admissionRef,cards,providerCalls:0,newCheckout:false,phasePredictsFuture:false,driverScope:'BIRTH_BASELINE_NOT_CURRENT_REALITY',customerProductionAdmitted:false};
  },
  reflection({cardIds,locale}){requireLocale(locale);if(!Array.isArray(cardIds)||![1,3].includes(cardIds.length)||new Set(cardIds).size!==cardIds.length||cardIds.some(id=>!byId.has(id)))throw Error('REFLECTION_ONE_OR_THREE_REGISTERED_CARDS');return {cards:cardIds.map(id=>fixed(byId.get(id),locale)),personalEvidenceWritten:false,profileDimensionsChanged:false,meaningIsPersonalEvidence:false,saveRequiresExistingEvidenceOwnerAndExplicitConsent:true};}
 });
}
