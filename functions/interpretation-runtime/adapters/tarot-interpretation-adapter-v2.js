/**
 * PHI OS TPA-W21 — corpus-bound Tarot interpretation successor.
 *
 * This adapter binds the frozen TPA-E corpus to Tarot projections without
 * creating a second card identity, universal meaning, reality truth,
 * prediction, diagnosis, or decision authority.
 */
export const TAROT_CORPUS_BOUND_ADAPTER_CODE='TAROT_CORPUS_BOUND_INTERPRETATION_ADAPTER';
export const TAROT_CORPUS_BOUND_ADAPTER_VERSION='2.0.0';

const clone=value=>structuredClone(value);
const VALID_PERSPECTIVE_CLASSES=Object.freeze(['TRADITIONAL','PSYCHOLOGICAL','REFLECTIVE','AUTHOR_SPECIFIC']);
const VALID_AVAILABILITY=Object.freeze(['AVAILABLE','PARTIAL','NOT_INGESTED','SOURCE_RESTRICTED','UNKNOWN']);

function obj(value,message){
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new TypeError(message);
}
function oneBy(items,key,label){
  const map=new Map();
  for(const item of items||[]){
    const id=item?.[key];
    if(typeof id!=='string'||!id) throw new TypeError(`${label}_IDENTITY_REQUIRED`);
    if(map.has(id)) throw new TypeError(`${label}_DUPLICATE:${id}`);
    map.set(id,item);
  }
  return map;
}
function assertProjection(projection){
  obj(projection,'TAROT_CANONICAL_PROJECTION_REQUIRED');
  if(projection.schemaVersion!=='PHI-OS-CANONICAL-PROJECTION-v1.0.0'||projection.projectionType!=='CARD'||projection.projectionSource?.methodCode!=='TAROT'||projection.projectionSource?.pluginCode!=='TAR'||projection.interpretationCreated!==false) throw new TypeError('INVALID_TAROT_CANONICAL_PROJECTION');
  if(!projection.projectionValue?.deck?.deckId||!projection.projectionValue?.deck?.deckVersion||!projection.projectionValue?.card?.cardId||!projection.projectionValue?.card?.cardIdentity||!projection.projectionValue?.position?.positionId) throw new TypeError('INCOMPLETE_TAROT_CANONICAL_PROJECTION');
}
function assertAuthorities(a){
  obj(a,'TAROT_CORPUS_AUTHORITIES_REQUIRED');
  for(const key of ['cardRegistry','visualCorpus','visualLocator','sourceRegistry','perspectiveRegistry','waiteCorpus','predecessorMeaningCorpus','reflectiveLensRegistry','noSourceBlendingContract','corpusFreeze']) obj(a[key],`TAROT_${key.toUpperCase()}_REQUIRED`);
  if((a.cardRegistry.entries||[]).length!==78) throw new TypeError('TAROT_78_CARD_REGISTRY_REQUIRED');
  if((a.visualCorpus.entries||[]).length!==78) throw new TypeError('TAROT_78_VISUAL_CORPUS_REQUIRED');
  if((a.visualLocator.entries||[]).length!==78) throw new TypeError('TAROT_78_VISUAL_LOCATORS_REQUIRED');
  if((a.waiteCorpus.entries||[]).length!==78) throw new TypeError('TAROT_78_WAITE_SOURCE_MAPPINGS_REQUIRED');
  if(a.waiteCorpus.coverage?.totalSourceUnits!==100) throw new TypeError('TAROT_100_WAITE_SOURCE_UNITS_REQUIRED');
  if((a.reflectiveLensRegistry.lensUnits||[]).length!==16) throw new TypeError('TAROT_16_REFLECTIVE_LENSES_REQUIRED');
  if(a.noSourceBlendingContract.forbidden?.universalSynthesis!==true||a.noSourceBlendingContract.forbidden?.sourceVoting!==true) throw new TypeError('TAROT_NO_SOURCE_BLENDING_CONTRACT_REQUIRED');
  if(a.corpusFreeze.invariants?.sourceOriginsMayNotBeBlended!==true||a.corpusFreeze.invariants?.publicRunAllowedRemainsFalse!==true) throw new TypeError('TAROT_CORPUS_FREEZE_BOUNDARY_INVALID');
}
function structuralCard(projection,entry){
  if(!entry) throw new TypeError('UNKNOWN_TAROT_CARD_ID');
  const pv=projection.projectionValue;
  if(entry.cardIdentity!==pv.card.cardIdentity||entry.deckId!==pv.deck.deckId||entry.deckVersion!==pv.deck.deckVersion) throw new TypeError('TAROT_CARD_IDENTITY_PROJECTION_MISMATCH');
  return Object.freeze({
    cardId:entry.cardId,
    cardIdentity:entry.cardIdentity,
    deckId:entry.deckId,
    deckVersion:entry.deckVersion,
    arcana:entry.arcana,
    suit:entry.suit,
    rank:entry.rank,
    number:entry.number,
    rankOrder:entry.rankOrder,
    canonicalTitle:entry.canonicalTitle,
    orientation:pv.orientation,
    position:clone(pv.position)
  });
}
function sourceClaimsForCard(cardId,meaningCorpus){
  return Object.freeze((meaningCorpus.entries||[]).filter(x=>x.cardId===cardId).map(x=>Object.freeze({
    claimId:x.claimId,
    sourceId:x.sourceId,
    perspectiveId:x.perspectiveId,
    orientation:x.orientation,
    spreadScope:Object.freeze([...(x.spreadScope||[])]),
    lensLabel:x.lensLabel,
    claim:x.claim,
    provenance:clone(x.provenance),
    sourceBound:true,
    universalMeaning:false,
    realityTruth:false,
    prediction:false,
    diagnosis:false,
    hiddenStateFact:false,
    decisionAuthority:false
  })));
}
function reflectiveForClass(className,lensRegistry){
  return Object.freeze((lensRegistry.lensUnits||[])
    .filter(x=>(x.eligiblePerspectiveClasses||[]).includes(className))
    .map(x=>Object.freeze({
      lensId:x.lensId,
      focusId:x.focusId,
      labelEn:x.labelEn,
      labelZhHans:x.labelZhHans,
      questionEn:x.questionEn,
      questionZhHans:x.questionZhHans,
      outputMode:x.outputMode,
      sourceBound:false,
      cardSpecificMeaning:false,
      mayAssertPresence:false,
      mayInferHiddenState:false,
      mayDiagnose:false,
      mayPredict:false,
      requiresRealityCheck:true
    })));
}
function perspectiveByClass(registry){
  const out=new Map();
  for(const p of registry.perspectives||[]){
    if(!VALID_PERSPECTIVE_CLASSES.includes(p.perspectiveClass)) throw new TypeError(`TAROT_PERSPECTIVE_CLASS_INVALID:${p.perspectiveClass}`);
    if(!VALID_AVAILABILITY.includes(p.availability)) throw new TypeError(`TAROT_PERSPECTIVE_AVAILABILITY_INVALID:${p.availability}`);
    if(out.has(p.perspectiveClass)) throw new TypeError(`TAROT_PERSPECTIVE_CLASS_DUPLICATE:${p.perspectiveClass}`);
    out.set(p.perspectiveClass,p);
  }
  return out;
}

export function bindTarotCorpusProjections(projections,authorities={}){
  if(!Array.isArray(projections)||![1,3].includes(projections.length)) throw new TypeError('TAROT_ONE_OR_THREE_CARD_PROJECTIONS_REQUIRED');
  projections.forEach(assertProjection);
  assertAuthorities(authorities);

  const cards=oneBy(authorities.cardRegistry.entries,'cardId','TAROT_CARD');
  const visuals=oneBy(authorities.visualCorpus.entries,'cardId','TAROT_VISUAL');
  const locators=oneBy(authorities.visualLocator.entries,'cardId','TAROT_VISUAL_LOCATOR');
  const waite=oneBy(authorities.waiteCorpus.entries,'cardId','TAROT_WAITE_MAPPING');
  const sources=oneBy(authorities.sourceRegistry.sources,'sourceId','TAROT_SOURCE');
  const perspectives=perspectiveByClass(authorities.perspectiveRegistry);

  const authorPerspective=perspectives.get('AUTHOR_SPECIFIC');
  const reflectivePerspective=perspectives.get('REFLECTIVE');
  const psychologicalPerspective=perspectives.get('PSYCHOLOGICAL');
  const traditionalPerspective=perspectives.get('TRADITIONAL');
  if(!authorPerspective||!reflectivePerspective||!psychologicalPerspective||!traditionalPerspective) throw new TypeError('TAROT_FOUR_PERSPECTIVE_CLASSES_REQUIRED');

  const cardBundles=projections.map(projection=>{
    const card=structuralCard(projection,cards.get(projection.projectionValue.card.cardId));
    const visual=visuals.get(card.cardId), locator=locators.get(card.cardId), sourceMapping=waite.get(card.cardId);
    if(!visual||!locator||!sourceMapping) throw new TypeError(`TAROT_CORPUS_BINDING_INCOMPLETE:${card.cardId}`);
    if(visual.cardIdentity!==card.cardIdentity||locator.cardIdentity!==card.cardIdentity||sourceMapping.cardIdentity!==card.cardIdentity) throw new TypeError(`TAROT_CORPUS_CARD_IDENTITY_MISMATCH:${card.cardId}`);
    if(visual.meaningAttached!==false||visual.interpretationAllowedInThisRecord!==false) throw new TypeError(`TAROT_VISUAL_MEANING_BOUNDARY_INVALID:${card.cardId}`);
    if(locator.rightsClass!=='PUBLIC_DOMAIN'||locator.authorityTier!=='T0') throw new TypeError(`TAROT_VISUAL_LOCATOR_RIGHTS_INVALID:${card.cardId}`);
    if(sourceMapping.sourceId!=='TAR-SRC-WAITE-PKT-1910'||sourceMapping.authorityTier!=='T1'||sourceMapping.meaningAuthority!=='SOURCE_BOUND_ONLY') throw new TypeError(`TAROT_WAITE_MAPPING_AUTHORITY_INVALID:${card.cardId}`);

    const source= sources.get(sourceMapping.sourceId);
    if(!source) throw new TypeError(`TAROT_SOURCE_NOT_REGISTERED:${sourceMapping.sourceId}`);
    const editorialClaims=sourceClaimsForCard(card.cardId,authorities.predecessorMeaningCorpus);
    const authorAvailability=editorialClaims.length?'SOURCE_LOCATOR_AND_EDITORIAL_PARAPHRASE_AVAILABLE':'SOURCE_LOCATOR_AVAILABLE_EDITORIAL_PARAPHRASE_NOT_INGESTED';

    const sourcePerspectives=Object.freeze([
      Object.freeze({
        perspectiveId:authorPerspective.perspectiveId,
        perspectiveClass:'AUTHOR_SPECIFIC',
        availability:authorAvailability,
        registryAvailability:authorPerspective.availability,
        authorityTier:'T1',
        sourceId:source.sourceId,
        sourceTitle:source.title,
        sourceEdition:source.edition,
        rightsClass:source.rightsClass,
        meaningAuthority:'SOURCE_BOUND_ONLY',
        sourceUnits:Object.freeze((sourceMapping.sourceUnits||[]).map(clone)),
        editorialClaims,
        universalMeaning:false,
        realityTruth:false,
        prediction:false,
        diagnosis:false,
        decisionAuthority:false
      }),
      Object.freeze({
        perspectiveId:reflectivePerspective.perspectiveId,
        perspectiveClass:'REFLECTIVE',
        availability:reflectivePerspective.availability,
        authorityTier:'T2',
        sourceId:null,
        meaningAuthority:false,
        inquiryUnits:reflectiveForClass('REFLECTIVE',authorities.reflectiveLensRegistry),
        cardSpecificMeaning:false,
        realityTruth:false,
        prediction:false,
        diagnosis:false,
        decisionAuthority:false
      }),
      Object.freeze({
        perspectiveId:psychologicalPerspective.perspectiveId,
        perspectiveClass:'PSYCHOLOGICAL',
        availability:psychologicalPerspective.availability,
        authorityTier:'T2',
        sourceId:null,
        meaningAuthority:false,
        inquiryUnits:reflectiveForClass('PSYCHOLOGICAL',authorities.reflectiveLensRegistry),
        cardSpecificMeaning:false,
        clinicalAuthority:false,
        hiddenStateAuthority:false,
        realityTruth:false,
        prediction:false,
        diagnosis:false,
        decisionAuthority:false
      }),
      Object.freeze({
        perspectiveId:traditionalPerspective.perspectiveId,
        perspectiveClass:'TRADITIONAL',
        availability:traditionalPerspective.availability,
        authorityTier:null,
        sourceId:null,
        meaningAuthority:false,
        inquiryUnits:Object.freeze([]),
        unavailableReason:'NO_GOVERNED_TRADITIONAL_CORPUS_ADMITTED',
        modelMayFill:false
      })
    ]);

    return Object.freeze({
      projectionRef:projection.projectionCode,
      projectionSource:clone(projection.projectionSource),
      structuralCard:card,
      visualObservation:clone(visual),
      visualEvidence:clone(locator),
      sourcePerspectives,
      comparison:Object.freeze({
        mode:'PARALLEL_ORIGIN_PRESERVATION',
        sourceVoting:false,
        universalSynthesis:false,
        convergence:Object.freeze([]),
        divergence:Object.freeze([]),
        unavailable:Object.freeze(sourcePerspectives.filter(x=>x.availability==='NOT_INGESTED'||x.availability==='SOURCE_RESTRICTED'||x.availability==='UNKNOWN').map(x=>Object.freeze({perspectiveClass:x.perspectiveClass,availability:x.availability,reason:x.unavailableReason||'UNAVAILABLE'})))
      })
    });
  });

  return Object.freeze({
    schemaVersion:'PHI-OS-TAROT-CORPUS-BOUND-INTERPRETATION-v2.0.0',
    adapterCode:TAROT_CORPUS_BOUND_ADAPTER_CODE,
    adapterVersion:TAROT_CORPUS_BOUND_ADAPTER_VERSION,
    methodCode:'TAROT',
    corpusFreezeVersion:authorities.corpusFreeze.freezeVersion,
    cards:Object.freeze(cardBundles),
    authority:Object.freeze({
      canonicalCardIdentityOwner:'TAROT_STRUCTURAL_RUNTIME',
      visualObservationOwner:'TAR_VIS_CANONICAL_CORPUS',
      historicalSourceOwner:'TAR_SRC_SOURCE_BOUND_CORPUS',
      reflectiveInquiryOwner:'PHI_OS_T2_GOVERNED_REFLECTIVE_LENS',
      adapterMayOverrideCardIdentity:false,
      adapterMayAttachMeaningToVisualObservation:false,
      adapterMayCreateUniversalMeaning:false,
      adapterMayCreateRealityTruth:false,
      adapterMayPredictOutcome:false,
      adapterMayDiagnose:false,
      adapterMayInferHiddenState:false,
      adapterMayDirectDecision:false,
      privateReferenceRuntimeUse:false,
      webDiscoveryRuntimeUse:false
    }),
    aiUsed:false,
    providerUsed:false,
    productionEligible:false
  });
}
