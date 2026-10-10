import {createSymbolicPublicViewModel} from './symbolic-public-view-model.js';

export const TAROT_PRODUCT_VIEW_MODEL_VERSION='2.0.0';
const clean=v=>String(v??'').normalize('NFKC').trim();
const clone=v=>structuredClone(v);
const arr=v=>Array.isArray(v)?v:[];

function artworkFor(observation){
  const e=observation?.visualEvidence||{};
  return Object.freeze({
    artworkId:e.artworkId||null,
    sourceId:e.sourceId||null,
    src:e.deliveryAssetUrl||e.originalFileUrl||null,
    sourcePage:e.commonsFilePage||null,
    originalFileUrl:e.originalFileUrl||null,
    rightsStatus:e.rightsClass||null,
    authorityTier:e.authorityTier||null,
    repoBundledAsset:e.repoBundledAsset===true,
    altTextEn:`Rider-Waite-Smith card artwork: ${observation?.canonicalTitle||observation?.cardId||'Tarot card'}`,
    altTextZhHans:`Rider-Waite-Smith 塔罗牌图像：${observation?.canonicalTitle||observation?.cardId||'塔罗牌'}`
  });
}
function visibleObservation(observation){
  const v=observation?.visualObservation||{};
  const fields=['figures','objects','posture','direction','environment','foreground','background','numbers','writtenMarks','animals','plants','celestialObjects','architecturalObjects','visibleSymbols'];
  return Object.freeze(Object.fromEntries(fields.map(k=>[k,clone(arr(v[k]))])));
}
function sourceDisplay(perspective){
  if(!perspective||perspective.perspectiveClass!=='AUTHOR_SPECIFIC') return null;
  return Object.freeze({
    sourceId:perspective.sourceId,
    sourceTitle:perspective.sourceTitle||null,
    sourceEdition:perspective.sourceEdition||null,
    perspectiveId:perspective.perspectiveId||null,
    perspectiveClass:perspective.perspectiveClass,
    availability:perspective.availability,
    authorityTier:perspective.authorityTier||null,
    rightsClass:perspective.rightsClass||null,
    sourceUnits:Object.freeze(arr(perspective.sourceUnits).map(u=>Object.freeze({
      interpretationUnitId:u.interpretationUnitId||null,
      unitType:u.unitType||null,
      sourceHeading:u.sourceHeading||null,
      printedPage:u.printedPage??null,
      scanPageIndex:u.scanPageIndex??null,
      sourceUrl:u.wikisourcePageUrl||null
    }))),
    editorialClaims:Object.freeze(arr(perspective.editorialClaims).map(clone))
  });
}
function perspectiveCard(readingIr, observation, sourceRecord){
  const group=readingIr.sourcePerspectives.find(x=>x.cardId===observation.cardId);
  const perspectives=arr(group?.perspectives);
  const waite=perspectives.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC')||null;
  const reflective=perspectives.find(x=>x.perspectiveClass==='REFLECTIVE')||null;
  const psychological=perspectives.find(x=>x.perspectiveClass==='PSYCHOLOGICAL')||null;
  const traditional=perspectives.find(x=>x.perspectiveClass==='TRADITIONAL')||null;
  const question=readingIr.reflectiveComposition?.questions?.find(x=>x.cardId===observation.cardId)||null;
  return Object.freeze({
    cardId:observation.cardId,
    canonicalTitle:observation.canonicalTitle,
    orientation:observation.orientation,
    position:clone(observation.position||{}),
    artwork:artworkFor(observation),
    visibleObservation:visibleObservation(observation),
    waitePerspective:waite?Object.freeze({availability:waite.availability,source:sourceRecord,editorialClaims:Object.freeze(arr(waite.editorialClaims).map(clone)),universalMeaning:false,realityTruth:false}):null,
    reflectivePerspective:reflective?Object.freeze({availability:reflective.availability,question:question?Object.freeze({questionEn:question.questionEn,questionZhHans:question.questionZhHans,focusId:question.focusId,selectionBasis:question.selectionBasis}):null,cardSpecificMeaning:false}):null,
    psychologicalReflectivePerspective:psychological?Object.freeze({availability:psychological.availability,clinicalAuthority:false,hiddenStateAuthority:false,cardSpecificMeaning:false}):null,
    traditionalPerspective:traditional?Object.freeze({availability:traditional.availability,unavailableReason:traditional.unavailableReason||null,modelMayFill:false}):null,
    productInterpretation:group?.productInterpretation?clone(group.productInterpretation):null
  });
}
function evidenceLayer(ir){
  return Object.freeze({
    deck:clone(ir.drawEvidence.deck),
    draw:Object.freeze(ir.drawEvidence.cards.map(c=>Object.freeze({cardId:c.cardId,orientation:c.orientation,position:clone(c.position)}))),
    orientation:'UPRIGHT_ONLY',
    spread:clone(ir.drawEvidence.spread),
    position:Object.freeze(ir.drawEvidence.cards.map(c=>clone(c.position))),
    drawEvidenceId:ir.drawEvidence.drawEvidenceId,
    deterministic:ir.drawEvidence.deterministic===true,
    aiUsed:ir.drawEvidence.aiUsed===true
  });
}
function realityLayer(ir){
  return Object.freeze({
    supportingEvidence:clone(ir.rcc.supportingEvidence),
    contradictoryEvidence:clone(ir.rcc.contradictoryEvidence),
    unknown:clone(ir.rcc.unknown),
    observation:clone(ir.rcc.observation),
    tarotCardIsRealityEvidence:false,
    sourceClaimIsRealityEvidence:false,
    realityMayContradictReading:true
  });
}
function uncertaintyLayer(ir){
  return Object.freeze(ir.uncertainty.states.map(x=>Object.freeze({status:x.status,reason:x.reason,scope:x.scope})));
}
function localizedNextActions(ir){
  return Object.freeze([
    ...arr(ir.reflectiveComposition?.questions).map(q=>Object.freeze({en:q.questionEn,zhHans:q.questionZhHans})),
    Object.freeze({en:'Your decision remains yours.',zhHans:'决定权仍然属于你。'})
  ]);
}


export function createTarotProductPublicViewModel(readingIr={}){
  if(readingIr?.schemaVersion!=='PHI-OS-TAROT-READING-IR-v2.0.0'||readingIr?.methodCode!=='TAROT') throw new TypeError('TAROT_READING_IR_REQUIRED');
  if(readingIr?.agency?.decisionAuthority!=='USER'||readingIr?.rcc?.required!==true||readingIr?.uncertainty?.required!==true) throw new TypeError('TAROT_READING_IR_BOUNDARY_REQUIRED');
  const sourceList=[];
  const sourceByCard=new Map();
  for(const group of arr(readingIr.sourcePerspectives)){
    const author=arr(group.perspectives).find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC');
    const source=sourceDisplay(author);
    if(source){sourceList.push(Object.freeze({cardId:group.cardId,...clone(source)}));sourceByCard.set(group.cardId,source);}
  }
  const cards=Object.freeze(readingIr.cardObservations.map(o=>perspectiveCard(readingIr,o,sourceByCard.get(o.cardId)||null)));
  const interpretation=Object.freeze({
    mode:'PARALLEL_SOURCE_BOUND_SYMBOLIC_PERSPECTIVE',cards,
    comparison:clone(readingIr.comparison),
    noSourceVoting:true,noUniversalMeaning:true,noPrediction:true,noDiagnosis:true,noHiddenStateCertainty:true,
    agency:clone(readingIr.agency)
  });
  const projection=Object.freeze({type:'TAROT_CARD_PROJECTION',cards:Object.freeze(cards.map(c=>Object.freeze({cardId:c.cardId,canonicalTitle:c.canonicalTitle,orientation:c.orientation,position:clone(c.position),artwork:clone(c.artwork)})))});
  const view=createSymbolicPublicViewModel({
    method:'TAROT',question:readingIr.question,methodEvidence:evidenceLayer(readingIr),projection,interpretation,
    realityComparison:realityLayer(readingIr),unknowns:uncertaintyLayer(readingIr),nextActions:[],sources:sourceList,
    realityContext:{usingCurrentRealityContext:readingIr.contextDisclosure?.currentRealityContextUsed===true,contextItems:readingIr.contextDisclosure?.currentRealityContextLabel?[{label:'Context',value:readingIr.contextDisclosure.currentRealityContextLabel}]:[]},
    complexity:{isComplex:false}
  });
  const hierarchy=Object.freeze(view.hierarchy.map(layer=>{
    if(layer.id==='WHAT_REMAINS_UNCERTAIN') return Object.freeze({...layer,data:uncertaintyLayer(readingIr)});
    if(layer.id==='POSSIBLE_NEXT_QUESTIONS_ACTIONS') return Object.freeze({...layer,data:localizedNextActions(readingIr)});
    return layer;
  }));
  return Object.freeze({...view,hierarchy,schemaVersion:'PHI-OS-TAROT-PRODUCT-PUBLIC-VIEW-MODEL-v2.0.0',viewModelVersion:TAROT_PRODUCT_VIEW_MODEL_VERSION,readingIrVersion:readingIr.readingIrVersion,tarotSurface:Object.freeze({cards,agency:clone(readingIr.agency),uncertainty:clone(readingIr.uncertainty),compositionEvidence:clone(readingIr.compositionEvidence)}),production:Object.freeze({surfaceReady:true,productInterpretationComplete:true,runAllowed:false,productionCapabilityPromoted:false})});
}
