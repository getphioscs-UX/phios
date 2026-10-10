/** PHI OS TARI-W0-W3 validation-only, source-bound Tarot interpretation adapter. */
export const TAROT_INTERPRETATION_ADAPTER_CODE='TAROT_SOURCE_BOUND_INTERPRETATION_ADAPTER';
export const TAROT_INTERPRETATION_ADAPTER_VERSION='1.0.0';
const clone=v=>structuredClone(v);
const PERSPECTIVE_CLASSES=Object.freeze(['TRADITIONAL','PSYCHOLOGICAL','REFLECTIVE','AUTHOR_SPECIFIC']);
function obj(v,m){if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError(m);}
function assertProjection(p){
  obj(p,'TAROT_CANONICAL_PROJECTION_REQUIRED');
  if(p.schemaVersion!=='PHI-OS-CANONICAL-PROJECTION-v1.0.0'||p.projectionType!=='CARD'||p.projectionSource?.methodCode!=='TAROT'||p.projectionSource?.pluginCode!=='TAR'||p.interpretationCreated!==false) throw new TypeError('INVALID_TAROT_CANONICAL_PROJECTION');
  if(!p.projectionValue?.deck?.deckId||!p.projectionValue?.deck?.deckVersion||!p.projectionValue?.card?.cardId||!p.projectionValue?.card?.cardIdentity||!p.projectionValue?.position?.positionId) throw new TypeError('INCOMPLETE_TAROT_CANONICAL_PROJECTION');
}
function maps(cardRegistry,sourceRegistry,perspectiveRegistry){
  const cards=new Map((cardRegistry?.entries||[]).map(x=>[x.cardId,x]));
  const sources=new Map((sourceRegistry?.sources||[]).map(x=>[x.sourceId,x]));
  const perspectives=new Map((perspectiveRegistry?.perspectives||[]).map(x=>[x.perspectiveId,x]));
  if(cards.size!==78) throw new TypeError('TAROT_78_CARD_REGISTRY_REQUIRED');
  return {cards,sources,perspectives};
}
function structuralCard(projection,entry){
  if(!entry) throw new TypeError('UNKNOWN_TAROT_CARD_ID');
  const pv=projection.projectionValue;
  if(entry.cardIdentity!==pv.card.cardIdentity||entry.deckId!==pv.deck.deckId||entry.deckVersion!==pv.deck.deckVersion) throw new TypeError('TAROT_CARD_IDENTITY_PROJECTION_MISMATCH');
  return Object.freeze({
    cardId:entry.cardId,cardIdentity:entry.cardIdentity,deckId:entry.deckId,deckVersion:entry.deckVersion,arcana:entry.arcana,suit:entry.suit,rank:entry.rank,number:entry.number,rankOrder:entry.rankOrder,canonicalTitle:entry.canonicalTitle,orientation:pv.orientation,position:clone(pv.position)
  });
}
function dimensions(card){
  const courtRanks=new Set(['PAGE','KNIGHT','QUEEN','KING']);
  return Object.freeze({
    visualObject:Object.freeze({status:'NOT_INGESTED',objects:Object.freeze([]),directObservationRequired:true,meaningAttached:false}),
    number:Object.freeze({number:card.number,rankOrder:card.rankOrder,meaningAttached:false}),
    suit:Object.freeze({value:card.suit,meaningAttached:false}),
    figure:Object.freeze({value:courtRanks.has(card.rank)?card.rank:null,classification:'COURT_RANK_ONLY',meaningAttached:false}),
    orientation:Object.freeze({value:card.orientation,meaningAttached:false}),
    position:Object.freeze({spreadId:card.position.spreadId,positionId:card.position.positionId,order:card.position.order,label:card.position.label,meaningAttached:false}),
    semanticMeaningAttached:false
  });
}
function eligible(entry,card){
  if(entry.cardId!==card.cardId) return false;
  if(entry.orientation!=='ANY'&&entry.orientation!==card.orientation) return false;
  const scopes=Array.isArray(entry.spreadScope)?entry.spreadScope:[];
  return scopes.includes('ANY')||scopes.includes(card.position.spreadId)||scopes.includes(card.position.positionId);
}
function candidate(entry,card,sources,perspectives){
  const source=sources.get(entry.sourceId), perspective=perspectives.get(entry.perspectiveId);
  if(!source||!perspective) throw new TypeError('TAROT_COMMENTARY_SOURCE_OR_PERSPECTIVE_UNKNOWN');
  if(!(perspective.sourceIds||[]).includes(entry.sourceId)) throw new TypeError('TAROT_PERSPECTIVE_SOURCE_BINDING_INVALID');
  if(!PERSPECTIVE_CLASSES.includes(perspective.perspectiveClass)) throw new TypeError('TAROT_PERSPECTIVE_CLASS_INVALID');
  return Object.freeze({
    claimId:entry.claimId,cardId:entry.cardId,cardIdentity:card.cardIdentity,sourceId:entry.sourceId,perspectiveId:entry.perspectiveId,perspectiveClass:perspective.perspectiveClass,orientation:entry.orientation,spreadScope:Object.freeze([...entry.spreadScope]),lensLabel:entry.lensLabel,claim:entry.claim,provenance:clone(entry.provenance),sourceBound:true,universalMeaning:false,realityTruth:false,prediction:false,decisionAuthority:false,canonicalIdentityOverride:false
  });
}
function groupByPerspectiveClass(candidates,perspectiveRegistry){
  const allowed=perspectiveRegistry.allowedPerspectiveClasses||PERSPECTIVE_CLASSES;
  return Object.freeze(allowed.map(perspectiveClass=>{
    const claims=candidates.filter(x=>x.perspectiveClass===perspectiveClass);
    const bySource=new Map();
    for(const c of claims){if(!bySource.has(c.sourceId))bySource.set(c.sourceId,[]);bySource.get(c.sourceId).push(c);}
    return Object.freeze({
      perspectiveClass,
      availability:claims.length?'SOURCE_BOUND_CLAIMS_AVAILABLE':'SOURCE_COMMENTARY_NOT_YET_INGESTED',
      sources:Object.freeze([...bySource.entries()].map(([sourceId,items])=>Object.freeze({sourceId,claims:Object.freeze(items)})))
    });
  }));
}
export function adaptTarotProjections(projections,{cardRegistry,sourceRegistry,perspectiveRegistry,symbolDimensionRegistry,corpus,selectedSourceIds=null,selectedPerspectiveIds=null}={}){
  if(!Array.isArray(projections)||![1,3].includes(projections.length)) throw new TypeError('TAROT_ONE_OR_THREE_CARD_PROJECTIONS_REQUIRED');
  projections.forEach(assertProjection); obj(cardRegistry,'TAROT_CARD_REGISTRY_REQUIRED');obj(sourceRegistry,'TAROT_SOURCE_REGISTRY_REQUIRED');obj(perspectiveRegistry,'TAROT_PERSPECTIVE_REGISTRY_REQUIRED');obj(symbolDimensionRegistry,'TAROT_SYMBOL_DIMENSION_REGISTRY_REQUIRED');obj(corpus,'TAROT_CORPUS_REQUIRED');
  if(symbolDimensionRegistry.rules?.universalMeaningLookupAllowed!==false||symbolDimensionRegistry.rules?.deathEqualsTransformationUniversalMappingAllowed!==false) throw new TypeError('TAROT_SYMBOL_DIMENSION_MEANING_BOUNDARY_INVALID');
  const {cards,sources,perspectives}=maps(cardRegistry,sourceRegistry,perspectiveRegistry);
  const sourceFilter=selectedSourceIds?new Set(selectedSourceIds):null, perspectiveFilter=selectedPerspectiveIds?new Set(selectedPerspectiveIds):null;
  const covered=new Set(corpus.coverage?.coveredCardIds||[]);
  const cardBundles=projections.map(projection=>{
    const card=structuralCard(projection,cards.get(projection.projectionValue.card.cardId));
    const candidates=[];
    for(const entry of corpus.entries||[]){
      if(sourceFilter&&!sourceFilter.has(entry.sourceId)) continue;
      if(perspectiveFilter&&!perspectiveFilter.has(entry.perspectiveId)) continue;
      if(eligible(entry,card)) candidates.push(candidate(entry,card,sources,perspectives));
    }
    return Object.freeze({
      projectionRef:projection.projectionCode,
      structuralCard:card,
      symbolDimensions:dimensions(card),
      commentaryCandidates:Object.freeze(candidates),
      crossSourceInterpretation:groupByPerspectiveClass(candidates,perspectiveRegistry),
      coverage:covered.has(card.cardId)?'SOURCE_COMMENTARY_AVAILABLE':'SOURCE_COMMENTARY_NOT_YET_INGESTED',
      sourceProjection:clone(projection)
    });
  });
  return Object.freeze({
    schemaVersion:'PHI-OS-TAROT-SOURCE-BOUND-INTERPRETATION-v1.0.0',adapterCode:TAROT_INTERPRETATION_ADAPTER_CODE,adapterVersion:TAROT_INTERPRETATION_ADAPTER_VERSION,methodCode:'TAROT',cards:Object.freeze(cardBundles),partialCorpus:corpus.coverage?.complete!==true,
    authority:Object.freeze({canonicalCardIdentityOwner:'TAROT_STRUCTURAL_RUNTIME',interpretationOwner:'SOURCE_BOUND_INTERPRETATION_LAYER',adapterMayOverrideCardIdentity:false,adapterMayCreateUniversalMeaning:false,adapterMayCreateRealityTruth:false,adapterMayPredictOutcome:false,adapterMayDirectDecision:false}),
    aiUsed:false,providerUsed:false,productionEligible:false
  });
}
