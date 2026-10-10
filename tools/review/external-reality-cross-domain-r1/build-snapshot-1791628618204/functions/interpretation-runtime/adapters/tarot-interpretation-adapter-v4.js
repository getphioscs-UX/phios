/**
 * PHI OS TPA-J0 — 78-card product interpretation successor.
 *
 * Binds canonical card identity + meaning-free TAR-VIS + Waite T1 source
 * locators + governed 78/78 editorial paraphrases + 78/78 card-specific
 * reflective questions. No universal meaning, Reality truth, prediction,
 * diagnosis, hidden-state fact, or decision authority is created.
 */
export const TAROT_PRODUCT_INTERPRETATION_ADAPTER_CODE='TAROT_PRODUCT_INTERPRETATION_ADAPTER';
export const TAROT_PRODUCT_INTERPRETATION_ADAPTER_VERSION='3.0.0';

const clone=value=>structuredClone(value);
const VALID_PERSPECTIVE_CLASSES=Object.freeze(['TRADITIONAL','PSYCHOLOGICAL','REFLECTIVE','AUTHOR_SPECIFIC']);
function obj(value,message){if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError(message);}
function oneBy(items,key,label){const m=new Map();for(const item of items||[]){const id=item?.[key];if(typeof id!=='string'||!id)throw new TypeError(`${label}_IDENTITY_REQUIRED`);if(m.has(id))throw new TypeError(`${label}_DUPLICATE:${id}`);m.set(id,item);}return m;}
function assertProjection(projection){obj(projection,'TAROT_CANONICAL_PROJECTION_REQUIRED');if(projection.schemaVersion!=='PHI-OS-CANONICAL-PROJECTION-v1.0.0'||projection.projectionType!=='CARD'||projection.projectionSource?.methodCode!=='TAROT'||projection.projectionSource?.pluginCode!=='TAR'||projection.interpretationCreated!==false)throw new TypeError('INVALID_TAROT_CANONICAL_PROJECTION');}
function assertAuthorities(a){
  obj(a,'TAROT_PRODUCT_INTERPRETATION_AUTHORITIES_REQUIRED');
  for(const k of ['cardRegistry','visualCorpus','visualLocator','sourceRegistry','perspectiveRegistry','waiteCorpus','editorialCorpus','cardReflectiveCorpus','productCompositionCorpus','noSourceBlendingContract','corpusFreeze','productInterpretationFreeze'])obj(a[k],`TAROT_${k.toUpperCase()}_REQUIRED`);
  for(const [k,n] of [['cardRegistry',78],['visualCorpus',78],['visualLocator',78],['waiteCorpus',78],['editorialCorpus',78],['cardReflectiveCorpus',78],['productCompositionCorpus',78]]){
    const list=k==='cardRegistry'?a[k].entries:a[k].entries;if((list||[]).length!==n)throw new TypeError(`TAROT_${k.toUpperCase()}_78_REQUIRED`);
  }
  if(a.noSourceBlendingContract.forbidden?.universalSynthesis!==true||a.noSourceBlendingContract.forbidden?.sourceVoting!==true)throw new TypeError('TAROT_NO_SOURCE_BLENDING_REQUIRED');
  if(a.productInterpretationFreeze.productionBoundary?.runAllowed!==false)throw new TypeError('TAROT_J0_FREEZE_RUN_ALLOWED_MUST_REMAIN_FALSE');
}
function structuralCard(projection,entry){
  if(!entry)throw new TypeError('UNKNOWN_TAROT_CARD_ID');const pv=projection.projectionValue;
  if(entry.cardIdentity!==pv.card.cardIdentity||entry.deckId!==pv.deck.deckId||entry.deckVersion!==pv.deck.deckVersion)throw new TypeError('TAROT_CARD_IDENTITY_PROJECTION_MISMATCH');
  return Object.freeze({cardId:entry.cardId,cardIdentity:entry.cardIdentity,deckId:entry.deckId,deckVersion:entry.deckVersion,arcana:entry.arcana,suit:entry.suit,rank:entry.rank,number:entry.number,rankOrder:entry.rankOrder,canonicalTitle:entry.canonicalTitle,orientation:pv.orientation,position:clone(pv.position)});
}
function perspectivesByClass(registry){const m=new Map();for(const p of registry.perspectives||[]){if(!VALID_PERSPECTIVE_CLASSES.includes(p.perspectiveClass))throw new TypeError(`TAROT_PERSPECTIVE_CLASS_INVALID:${p.perspectiveClass}`);if(m.has(p.perspectiveClass))throw new TypeError(`TAROT_PERSPECTIVE_CLASS_DUPLICATE:${p.perspectiveClass}`);m.set(p.perspectiveClass,p);}return m;}
function editorialClaim(entry){return Object.freeze({claimId:entry.editorialClaimId,sourceId:entry.sourceId,perspectiveId:entry.perspectiveId,orientation:entry.orientation,spreadScope:Object.freeze([...(entry.spreadScope||[])]),lensLabelEn:entry.lensLabelEn,lensLabelZhHans:entry.lensLabelZhHans,claimEn:entry.paraphraseEn,claimZhHans:entry.paraphraseZhHans,sourceUnitIds:Object.freeze([...(entry.sourceUnitIds||[])]),sourceLocators:Object.freeze((entry.sourceLocators||[]).map(clone)),provenance:clone(entry.provenance),sourceBound:true,universalMeaning:false,realityTruth:false,prediction:false,diagnosis:false,hiddenStateFact:false,decisionAuthority:false,reviewStatus:entry.reviewStatus});}
function reflectivePrompts(entry){return Object.freeze((entry.prompts||[]).map(p=>Object.freeze({...clone(p),sourceBound:false,cardSpecificInquiry:true,universalMeaning:false,realityTruth:false})));}

export function bindTarotProductInterpretationProjections(projections,authorities={}){
  if(!Array.isArray(projections)||![1,3,5,6,7,10].includes(projections.length))throw new TypeError('TAROT_TSCP_SUPPORTED_CARD_COUNT_REQUIRED');projections.forEach(assertProjection);assertAuthorities(authorities);
  const cards=oneBy(authorities.cardRegistry.entries,'cardId','TAROT_CARD');
  const visuals=oneBy(authorities.visualCorpus.entries,'cardId','TAROT_VISUAL');
  const locators=oneBy(authorities.visualLocator.entries,'cardId','TAROT_VISUAL_LOCATOR');
  const waite=oneBy(authorities.waiteCorpus.entries,'cardId','TAROT_WAITE_MAPPING');
  const editorial=oneBy(authorities.editorialCorpus.entries,'cardId','TAROT_EDITORIAL');
  const reflective=oneBy(authorities.cardReflectiveCorpus.entries,'cardId','TAROT_CARD_REFLECTIVE');
  const composition=oneBy(authorities.productCompositionCorpus.entries,'cardId','TAROT_PRODUCT_COMPOSITION');
  const sources=oneBy(authorities.sourceRegistry.sources,'sourceId','TAROT_SOURCE');
  const p=perspectivesByClass(authorities.perspectiveRegistry);
  const authorPerspective=p.get('AUTHOR_SPECIFIC'), reflectivePerspective=p.get('REFLECTIVE'), psychologicalPerspective=p.get('PSYCHOLOGICAL'), traditionalPerspective=p.get('TRADITIONAL');
  if(!authorPerspective||!reflectivePerspective||!psychologicalPerspective||!traditionalPerspective)throw new TypeError('TAROT_FOUR_PERSPECTIVE_CLASSES_REQUIRED');

  const bundles=projections.map(projection=>{
    const card=structuralCard(projection,cards.get(projection.projectionValue.card.cardId));
    const visual=visuals.get(card.cardId), locator=locators.get(card.cardId), sourceMapping=waite.get(card.cardId), edit=editorial.get(card.cardId), refl=reflective.get(card.cardId), comp=composition.get(card.cardId);
    if(!visual||!locator||!sourceMapping||!edit||!refl||!comp)throw new TypeError(`TAROT_J0_BINDING_INCOMPLETE:${card.cardId}`);
    if([visual,locator,sourceMapping,edit,refl,comp].some(x=>x.cardIdentity!==card.cardIdentity))throw new TypeError(`TAROT_J0_CARD_IDENTITY_MISMATCH:${card.cardId}`);
    if(visual.meaningAttached!==false||visual.interpretationAllowedInThisRecord!==false)throw new TypeError(`TAROT_VISUAL_MEANING_BOUNDARY_INVALID:${card.cardId}`);
    if(locator.rightsClass!=='PUBLIC_DOMAIN'||locator.authorityTier!=='T0')throw new TypeError(`TAROT_VISUAL_RIGHTS_INVALID:${card.cardId}`);
    if(sourceMapping.sourceId!=='TAR-SRC-WAITE-PKT-1910'||sourceMapping.authorityTier!=='T1')throw new TypeError(`TAROT_WAITE_AUTHORITY_INVALID:${card.cardId}`);
    if(edit.sourceId!==sourceMapping.sourceId||edit.boundaries?.sourceBound!==true||edit.boundaries?.universalMeaning!==false||edit.boundaries?.realityTruth!==false)throw new TypeError(`TAROT_EDITORIAL_BOUNDARY_INVALID:${card.cardId}`);
    const mappedIds=new Set((sourceMapping.sourceUnits||[]).map(x=>x.interpretationUnitId));if(!(edit.sourceUnitIds||[]).every(id=>mappedIds.has(id)))throw new TypeError(`TAROT_EDITORIAL_LOCATOR_DRIFT:${card.cardId}`);
    if((refl.prompts||[]).length!==3||new Set(refl.prompts.map(x=>x.focusId)).size!==3)throw new TypeError(`TAROT_CARD_REFLECTIVE_PROMPTS_INVALID:${card.cardId}`);
    if(comp.compositionRules?.decisionAuthority!=='USER'||comp.compositionRules?.realityComparisonRequired!==true)throw new TypeError(`TAROT_PRODUCT_COMPOSITION_BOUNDARY_INVALID:${card.cardId}`);
    const source=sources.get(sourceMapping.sourceId);if(!source)throw new TypeError(`TAROT_SOURCE_NOT_REGISTERED:${sourceMapping.sourceId}`);
    const claim=editorialClaim(edit), prompts=reflectivePrompts(refl);
    const sourcePerspectives=Object.freeze([
      Object.freeze({perspectiveId:authorPerspective.perspectiveId,perspectiveClass:'AUTHOR_SPECIFIC',availability:'SOURCE_LOCATOR_AND_EDITORIAL_PARAPHRASE_AVAILABLE',registryAvailability:authorPerspective.availability,authorityTier:'T1',sourceId:source.sourceId,sourceTitle:source.title,sourceEdition:source.edition,rightsClass:source.rightsClass,meaningAuthority:'SOURCE_BOUND_ONLY',sourceUnits:Object.freeze((sourceMapping.sourceUnits||[]).map(clone)),editorialClaims:Object.freeze([claim]),universalMeaning:false,realityTruth:false,prediction:false,diagnosis:false,decisionAuthority:false}),
      Object.freeze({perspectiveId:reflectivePerspective.perspectiveId,perspectiveClass:'REFLECTIVE',availability:'AVAILABLE',authorityTier:'T2',sourceId:null,meaningAuthority:false,inquiryUnits:prompts,cardSpecificMeaning:false,cardSpecificInquiry:true,realityTruth:false,prediction:false,diagnosis:false,decisionAuthority:false}),
      Object.freeze({perspectiveId:psychologicalPerspective.perspectiveId,perspectiveClass:'PSYCHOLOGICAL',availability:'AVAILABLE',authorityTier:'T2',sourceId:null,meaningAuthority:false,inquiryUnits:prompts,cardSpecificMeaning:false,clinicalAuthority:false,hiddenStateAuthority:false,realityTruth:false,prediction:false,diagnosis:false,decisionAuthority:false}),
      Object.freeze({perspectiveId:traditionalPerspective.perspectiveId,perspectiveClass:'TRADITIONAL',availability:traditionalPerspective.availability,authorityTier:null,sourceId:null,meaningAuthority:false,inquiryUnits:Object.freeze([]),unavailableReason:'NO_GOVERNED_TRADITIONAL_CORPUS_ADMITTED',modelMayFill:false})
    ]);
    return Object.freeze({projectionRef:projection.projectionCode,projectionSource:clone(projection.projectionSource),structuralCard:card,visualObservation:clone(visual),visualEvidence:clone(locator),productInterpretation:clone(comp),sourcePerspectives,comparison:Object.freeze({mode:'PARALLEL_ORIGIN_PRESERVATION',sourceVoting:false,universalSynthesis:false,convergence:Object.freeze([]),divergence:Object.freeze([]),unavailable:Object.freeze(sourcePerspectives.filter(x=>['NOT_INGESTED','SOURCE_RESTRICTED','UNKNOWN'].includes(x.availability)).map(x=>Object.freeze({perspectiveClass:x.perspectiveClass,availability:x.availability,reason:x.unavailableReason||'UNAVAILABLE'})))})});
  });
  return Object.freeze({schemaVersion:'PHI-OS-TAROT-PRODUCT-INTERPRETATION-v3.0.0',adapterCode:TAROT_PRODUCT_INTERPRETATION_ADAPTER_CODE,adapterVersion:TAROT_PRODUCT_INTERPRETATION_ADAPTER_VERSION,methodCode:'TAROT',corpusFreezeVersion:authorities.corpusFreeze.freezeVersion,productInterpretationFreezeVersion:authorities.productInterpretationFreeze.freezeVersion,cards:Object.freeze(bundles),authority:Object.freeze({canonicalCardIdentityOwner:'TAROT_STRUCTURAL_RUNTIME',visualObservationOwner:'TAR_VIS_CANONICAL_CORPUS',historicalSourceOwner:'TAR_SRC_SOURCE_BOUND_CORPUS',editorialOwner:'TAR_J0_WAITE_EDITORIAL_CORPUS',reflectiveInquiryOwner:'TAR_J0_CARD_REFLECTIVE_CORPUS',adapterMayOverrideCardIdentity:false,adapterMayAttachMeaningToVisualObservation:false,adapterMayCreateUniversalMeaning:false,adapterMayCreateRealityTruth:false,adapterMayPredictOutcome:false,adapterMayDiagnose:false,adapterMayInferHiddenState:false,adapterMayDirectDecision:false,privateReferenceRuntimeUse:false,webDiscoveryRuntimeUse:false}),aiUsed:false,providerUsed:false,productionEligible:false});
}
