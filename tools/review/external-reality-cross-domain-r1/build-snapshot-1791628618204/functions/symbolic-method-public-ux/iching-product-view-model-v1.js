/** PHI OS ICH-PROD-W4 — I Ching product surface projection. */
import {createSymbolicPublicViewModel} from './symbolic-public-view-model.js';

export const ICHING_PRODUCT_VIEW_MODEL_VERSION='1.0.0';
const clone=value=>structuredClone(value);
const arr=value=>Array.isArray(value)?value:[];

function sourceDisplay(candidate,sourceRegistry,perspectiveRegistry){
  const source=arr(sourceRegistry?.sources).find(x=>x.sourceId===candidate.sourceId)||{};
  const perspective=arr(perspectiveRegistry?.perspectives).find(x=>x.perspectiveId===candidate.perspectiveId)||{};
  return Object.freeze({
    sourceId:candidate.sourceId,
    sourceTitle:source.title||candidate.sourceId,
    sourceEdition:source.edition||null,
    perspectiveId:candidate.perspectiveId,
    perspectiveClass:perspective.perspectiveClass||perspective.label||'SOURCE_BOUND',
    availability:'SOURCE_COMMENTARY_AVAILABLE',
    authorityTier:source.authorityTier||'PUBLIC_DOMAIN_SOURCE_BOUND',
    rightsClass:source.rightsStatus||null,
    digitalWitness:source.digitalWitness||null,
    sourceUnits:Object.freeze([{unitType:candidate.scope,sourceHeading:`${candidate.hexagramId}${candidate.linePosition?` · line ${candidate.linePosition}`:''}`,sourceUrl:source.digitalWitness||null,sourceLocator:candidate.provenance?.sourceLocator||null}]),
    provenance:clone(candidate.provenance||{})
  });
}

function uniqueSources(readingIr,authorities){
  const out=[];const seen=new Set();
  for(const candidate of arr(readingIr.sourceInterpretation?.commentaryCandidates)){
    const key=`${candidate.sourceId}|${candidate.perspectiveId}`;
    if(seen.has(key)) continue;
    seen.add(key);out.push(sourceDisplay(candidate,authorities?.sourceRegistry,authorities?.perspectiveRegistry));
  }
  return Object.freeze(out);
}

function realityLayer(ir){
  return Object.freeze({
    supportingEvidence:clone(ir.rcc.supportingEvidence),
    contradictoryEvidence:clone(ir.rcc.contradictoryEvidence),
    unknown:clone(ir.rcc.unknown),
    observation:clone(ir.rcc.observation),
    questions:clone(ir.rcc.questions),
    hexagramIsRealityEvidence:false,
    sourceClaimIsRealityEvidence:false,
    realityMayContradictReading:true
  });
}

const NEXT_ACTIONS=Object.freeze([
  Object.freeze({en:'What in your current reality supports this lens?',zhHans:'当前现实中，什么支持这个视角？'}),
  Object.freeze({en:'What contradicts it?',zhHans:'什么与它相矛盾？'}),
  Object.freeze({en:'What remains unknown?',zhHans:'哪些部分仍然未知？'}),
  Object.freeze({en:'What requires observation?',zhHans:'接下来需要观察什么？'}),
  Object.freeze({en:'Your decision remains yours.',zhHans:'决定权仍然属于你。'})
]);

export function createIChingProductPublicViewModel(readingIr={},authorities={}){
  if(readingIr?.schemaVersion!=='PHI-OS-ICHING-READING-IR-v1.0.0'||readingIr?.methodCode!=='I_CHING') throw new TypeError('ICHING_READING_IR_REQUIRED');
  if(readingIr?.agency?.decisionAuthority!=='USER'||readingIr?.rcc?.required!==true||readingIr?.uncertainty?.required!==true) throw new TypeError('ICHING_READING_IR_BOUNDARY_REQUIRED');
  const sources=uniqueSources(readingIr,authorities);
  const interpretation=Object.freeze({
    mode:readingIr.sourceInterpretation.mode,
    structuralPattern:clone(readingIr.sourceInterpretation.composition.structuralPattern),
    possibleTension:clone(readingIr.sourceInterpretation.composition.possibleTension),
    possibleTransition:clone(readingIr.sourceInterpretation.composition.possibleTransition),
    commentaryCandidates:clone(readingIr.sourceInterpretation.commentaryCandidates),
    crossSourceComparison:clone(readingIr.sourceInterpretation.crossSourceComparison),
    coverage:clone(readingIr.sourceInterpretation.coverage),
    noSourceVoting:true,
    noUniversalMeaning:true,
    noPrediction:true,
    noDiagnosis:true,
    agency:clone(readingIr.agency)
  });
  const view=createSymbolicPublicViewModel({
    method:'I_CHING',
    question:readingIr.question,
    methodEvidence:readingIr.methodEvidence,
    projection:readingIr.structuralProjection,
    interpretation,
    realityComparison:realityLayer(readingIr),
    unknowns:readingIr.uncertainty.states,
    nextActions:NEXT_ACTIONS,
    sources,
    realityContext:{usingCurrentRealityContext:readingIr.contextDisclosure.currentRealityContextUsed,contextItems:readingIr.contextDisclosure.currentRealityContextLabel?[{label:'Context',value:readingIr.contextDisclosure.currentRealityContextLabel}]:[]},
    complexity:{isComplex:false}
  });
  return Object.freeze({...view,
    schemaVersion:'PHI-OS-ICHING-PRODUCT-PUBLIC-VIEW-MODEL-v1.0.0',
    viewModelVersion:ICHING_PRODUCT_VIEW_MODEL_VERSION,
    readingIrVersion:readingIr.readingIrVersion,
    ichingSurface:Object.freeze({
      lineOrder:readingIr.methodEvidence.lineOrder,
      lines:clone(readingIr.methodEvidence.sixLines),
      primary:clone(readingIr.structuralProjection.primary),
      changingLines:clone(readingIr.structuralProjection.changingLines),
      relating:clone(readingIr.structuralProjection.relating),
      agency:clone(readingIr.agency),
      uncertainty:clone(readingIr.uncertainty),
      compositionEvidence:clone(readingIr.compositionEvidence)
    }),
    production:Object.freeze({surfaceReady:true,sourceRuntimeReady:true,runAllowed:false,productionCapabilityPromoted:false})
  });
}
