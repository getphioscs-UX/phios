/**
 * PHI OS TPA-W22–W26 — deterministic structured Tarot Reading IR.
 * No prose model, prediction, diagnosis, hidden-state inference, or decision
 * authority is introduced here.
 */
import {bindTarotProductInterpretationProjections} from './adapters/tarot-interpretation-adapter-v3.js';

export const TAROT_READING_IR_VERSION='2.0.0';
export const TAROT_READING_IR_SCHEMA='PHI-OS-TAROT-READING-IR-v2.0.0';

const clone=value=>structuredClone(value);
const VALID_UNCERTAINTY=new Set(['UNKNOWN','UNRESOLVED','CONTRADICTORY','NOT_SUPPORTED_BY_REALITY','SOURCE_DISAGREEMENT']);
const POSITION_FOCUS=Object.freeze({
  WHAT_DESERVES_ATTENTION:'ATTENTION',
  SITUATION:'ATTENTION',
  TENSION:'TENSION',
  CONSIDERATION:'NEXT_OBSERVATION'
});

function arr(value){return Array.isArray(value)?value:[];}
function text(value){return typeof value==='string'?value.trim():'';}
function freezeList(value){return Object.freeze(arr(value).map(clone));}
function evidenceItem(item,index,kind){
  if(typeof item==='string') return Object.freeze({evidenceId:`${kind}-${index+1}`,statement:item,source:'USER_SUPPLIED_REALITY_CONTEXT'});
  if(!item||typeof item!=='object'||Array.isArray(item)) throw new TypeError(`TAROT_RCC_${kind}_ITEM_INVALID`);
  const statement=text(item.statement||item.claim||item.observation||item.text);
  if(!statement) throw new TypeError(`TAROT_RCC_${kind}_STATEMENT_REQUIRED`);
  return Object.freeze({evidenceId:text(item.evidenceId)||`${kind}-${index+1}`,statement,source:text(item.source)||'USER_SUPPLIED_REALITY_CONTEXT',provenance:item.provenance?clone(item.provenance):null});
}
function normalizeRcc(input={}){
  const supporting=arr(input.supportingEvidence).map((x,i)=>evidenceItem(x,i,'SUPPORT'));
  const contradictory=arr(input.contradictoryEvidence).map((x,i)=>evidenceItem(x,i,'CONTRADICT'));
  const observations=arr(input.observation||input.observations).map((x,i)=>evidenceItem(x,i,'OBSERVATION'));
  const unknown=arr(input.unknown||input.unknowns).map((x,i)=>evidenceItem(x,i,'UNKNOWN'));
  if(!supporting.length&&!contradictory.length&&!observations.length&&!unknown.length){
    unknown.push(Object.freeze({evidenceId:'UNKNOWN-1',statement:'No real-world evidence was supplied for comparison.',source:'SYSTEM_BOUNDARY_NOTICE',provenance:null}));
  }
  return Object.freeze({
    required:true,
    supportingEvidence:Object.freeze(supporting),
    contradictoryEvidence:Object.freeze(contradictory),
    unknown:Object.freeze(unknown),
    observation:Object.freeze(observations),
    rules:Object.freeze({tarotCardIsEvidence:false,sourceClaimIsRealityEvidence:false,reflectionIsEvidence:false,realityMayContradictReading:true,unknownMayRemainUnknown:true})
  });
}
function uncertaintyFor(binding,rcc,input={}){
  const states=[];
  const add=(status,reason,scope='READING')=>{if(!VALID_UNCERTAINTY.has(status))throw new TypeError(`TAROT_UNCERTAINTY_STATUS_INVALID:${status}`); if(!states.some(x=>x.status===status&&x.reason===reason&&x.scope===scope))states.push(Object.freeze({status,reason,scope}));};
  if(rcc.unknown.length) add('UNKNOWN','REALITY_CONTEXT_CONTAINS_UNKNOWN_OR_MISSING_EVIDENCE');
  if(rcc.contradictoryEvidence.length) add('CONTRADICTORY','REALITY_EVIDENCE_CONTRADICTS_OR_COMPLICATES_THE_REFLECTION');
  if(input.notSupportedByReality===true) add('NOT_SUPPORTED_BY_REALITY','USER_OR_GOVERNED_REALITY_CHECK_MARKED_REFLECTION_NOT_SUPPORTED');
  if(input.sourceDisagreement===true) add('SOURCE_DISAGREEMENT','GOVERNED_SOURCE_PERSPECTIVES_ARE_MARKED_AS_DISAGREEING');
  const editorialMissing=binding.cards.filter(card=>card.sourcePerspectives.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC')?.editorialClaims.length!==1);
  if(editorialMissing.length) throw new TypeError(`TAROT_J0_EDITORIAL_COMPLETION_REQUIRED:${editorialMissing.map(x=>x.structuralCard.cardId).join(',')}`);
  if(!states.length) add('UNRESOLVED','NO_SINGLE_REALITY_CONCLUSION_IS_AUTHORIZED');
  return Object.freeze({required:true,states:Object.freeze(states),mayRemainUnresolved:true,modelMayNotEraseUncertainty:true});
}
function selectedReflectiveQuestion(card){
  const focus=POSITION_FOCUS[card.structuralCard.position.positionId]||'NEXT_OBSERVATION';
  const reflective=card.sourcePerspectives.find(x=>x.perspectiveClass==='REFLECTIVE');
  const unit=reflective?.inquiryUnits?.find(x=>x.focusId===focus)||reflective?.inquiryUnits?.find(x=>x.focusId==='NEXT_OBSERVATION');
  if(!unit) throw new TypeError(`TAROT_CARD_SPECIFIC_REFLECTIVE_QUESTION_UNAVAILABLE:${card.structuralCard.cardId}`);
  return Object.freeze({
    cardId:card.structuralCard.cardId,
    positionId:card.structuralCard.position.positionId,
    promptId:unit.promptId,
    focusId:unit.focusId,
    questionEn:unit.questionEn,
    questionZhHans:unit.questionZhHans,
    selectionBasis:'CARD_SPECIFIC_GOVERNED_PROMPT_SELECTED_BY_SPREAD_POSITION',
    cardSpecificInquiry:true,
    universalMeaning:false,
    requiresRealityCheck:true
  });
}
function drawEvidence(projections){
  const first=projections[0];
  const commonInputDigest=first.projectionSource?.inputDigest;
  if(!commonInputDigest||!projections.every(p=>p.projectionSource?.inputDigest===commonInputDigest)) throw new TypeError('TAROT_SHARED_DRAW_INPUT_DIGEST_REQUIRED');
  const cards=projections.map(p=>Object.freeze({
    projectionCode:p.projectionCode,
    calculationId:p.projectionSource.calculationId,
    inputDigest:p.projectionSource.inputDigest,
    outputDigest:p.projectionSource.outputDigest,
    cardId:p.projectionValue.card.cardId,
    cardIdentity:p.projectionValue.card.cardIdentity,
    orientation:p.projectionValue.orientation,
    position:clone(p.projectionValue.position)
  }));
  return Object.freeze({
    drawEvidenceId:`TAR-DRAW-${commonInputDigest.slice(0,24).toUpperCase()}`,
    deck:clone(first.projectionValue.deck),
    spread:Object.freeze({spreadId:first.projectionValue.position.spreadId,spreadVersion:first.projectionValue.position.spreadVersion,cardCount:projections.length}),
    cards:Object.freeze(cards),
    inputDigest:commonInputDigest,
    deterministic:projections.every(p=>p.deterministic===true),
    aiUsed:false,
    providerUsed:false,
    redrawInsideInterpretation:false
  });
}
function compositionEvidenceRecord({binding,draw,authorities,evidence={}}){
  const sourceIds=[...new Set(binding.cards.flatMap(card=>card.sourcePerspectives.map(x=>x.sourceId).filter(Boolean)))].sort();
  const requiredDigests=evidence.authorityDigests||{};
  const generatedAt=text(evidence.generatedAt);
  if(!generatedAt) throw new TypeError('TAROT_COMPOSITION_EVIDENCE_GENERATED_AT_REQUIRED');
  if(!text(requiredDigests.corpusFreezeSha256)) throw new TypeError('TAROT_COMPOSITION_EVIDENCE_CORPUS_FREEZE_DIGEST_REQUIRED');
  if(!text(requiredDigests.productInterpretationFreezeSha256)) throw new TypeError('TAROT_COMPOSITION_EVIDENCE_PRODUCT_INTERPRETATION_FREEZE_DIGEST_REQUIRED');
  return Object.freeze({
    readingIrVersion:TAROT_READING_IR_VERSION,
    corpusFreezeVersion:authorities.corpusFreeze.freezeVersion,
    corpusFreezeSha256:requiredDigests.corpusFreezeSha256,
    productInterpretationFreezeVersion:authorities.productInterpretationFreeze.freezeVersion,
    productInterpretationFreezeSha256:requiredDigests.productInterpretationFreezeSha256,
    editorialCorpusVersion:authorities.editorialCorpus.corpusVersion,
    cardReflectiveCorpusVersion:authorities.cardReflectiveCorpus.corpusVersion,
    productCompositionCorpusVersion:authorities.productCompositionCorpus.corpusVersion,
    cardRegistryVersion:authorities.cardRegistry.registryVersion,
    visualCorpusVersion:authorities.visualCorpus.corpusVersion||authorities.visualCorpus.registryVersion||'1.0.0',
    sourceRegistryVersion:authorities.sourceRegistry.registryVersion,
    waiteSourceCorpusVersion:authorities.waiteCorpus.corpusVersion,
    perspectiveRegistryVersion:authorities.perspectiveRegistry.registryVersion,
    noSourceBlendingContractVersion:authorities.noSourceBlendingContract.contractVersion,
    boundaryContractVersions:Object.freeze({...evidence.boundaryContractVersions}),
    sourceIds:Object.freeze(sourceIds),
    drawEvidenceId:draw.drawEvidenceId,
    provider:Object.freeze({used:false,providerId:null,modelId:null}),
    generatedAt,
    semanticBoundaryDeterministic:true,
    modelCalculationAllowed:false,
    modelMayMutateEvidence:false
  });
}

export function createTarotReadingIR({question='',contextDisclosure={},projections,authorities,realityEvidence={},compositionEvidence={}}={}){
  const q=text(question);
  if(!q) throw new TypeError('TAROT_READING_QUESTION_REQUIRED');
  const binding=bindTarotProductInterpretationProjections(projections,authorities);
  const draw=drawEvidence(projections);
  const rcc=normalizeRcc(realityEvidence);
  const uncertainty=uncertaintyFor(binding,rcc,realityEvidence);
  const cardObservations=Object.freeze(binding.cards.map(card=>Object.freeze({
    cardId:card.structuralCard.cardId,
    cardIdentity:card.structuralCard.cardIdentity,
    canonicalTitle:card.structuralCard.canonicalTitle,
    orientation:card.structuralCard.orientation,
    position:clone(card.structuralCard.position),
    visualObservation:clone(card.visualObservation),
    visualEvidence:clone(card.visualEvidence)
  })));
  const sourcePerspectives=Object.freeze(binding.cards.map(card=>Object.freeze({
    cardId:card.structuralCard.cardId,
    productInterpretation:clone(card.productInterpretation),
    perspectives:clone(card.sourcePerspectives)
  })));
  const comparison=Object.freeze({
    mode:'PARALLEL_PRESENTATION_NO_SOURCE_VOTING',
    cards:Object.freeze(binding.cards.map(card=>Object.freeze({cardId:card.structuralCard.cardId,...clone(card.comparison)}))),
    convergence:Object.freeze([]),
    divergence:Object.freeze([]),
    unavailable:Object.freeze(binding.cards.flatMap(card=>card.comparison.unavailable.map(x=>Object.freeze({cardId:card.structuralCard.cardId,...clone(x)})))),
    universalMeaningSelected:false,
    realityTruthSelected:false
  });
  const reflectiveComposition=Object.freeze({
    mode:'DETERMINISTIC_CARD_SPECIFIC_REFLECTIVE_QUESTION_SELECTION',
    questions:Object.freeze(binding.cards.map(selectedReflectiveQuestion)),
    selectionUsesCardSpecificGovernedInquiry:true,
    selectionUsesSpreadPositionToChoosePrompt:true,
    selectionUsesUniversalMeaning:false,
    diagnosisAllowed:false,
    predictionAllowed:false
  });
  const agency=Object.freeze({
    required:true,
    decisionAuthority:'USER',
    tarotMayInformReflection:true,
    tarotMayDecide:false,
    cardMayCompelAction:false,
    sourceMayCompelAction:false,
    systemMayCompelAction:false,
    professionalDirectiveAuthority:false,
    hiddenStateAuthority:false,
    userDecisionRemainsYours:true
  });
  const evidence=compositionEvidenceRecord({binding,draw,authorities,evidence:compositionEvidence});

  return Object.freeze({
    schemaVersion:TAROT_READING_IR_SCHEMA,
    readingIrVersion:TAROT_READING_IR_VERSION,
    methodCode:'TAROT',
    question:q,
    contextDisclosure:Object.freeze({
      currentRealityContextUsed:contextDisclosure.currentRealityContextUsed===true,
      currentRealityContextLabel:text(contextDisclosure.currentRealityContextLabel)||null,
      contextUseWasExplicit:contextDisclosure.contextUseWasExplicit===true,
      silentPrivateContextConsumption:false
    }),
    drawEvidence:draw,
    cardObservations,
    sourcePerspectives,
    comparison,
    reflectiveComposition,
    rcc,
    uncertainty,
    agency,
    compositionEvidence:evidence,
    authority:Object.freeze({
      canonicalCardIdentityOwner:'TAROT_STRUCTURAL_RUNTIME',
      interpretationSuccessor:'TAROT_PRODUCT_INTERPRETATION_V3',
      realityTruthOwner:'USER_REALITY_AND_GOVERNED_EVIDENCE',
      decisionOwner:'USER',
      readingMayPredict:false,
      readingMayDiagnose:false,
      readingMayInferThirdPartyHiddenState:false,
      readingMayCreateProfessionalDirective:false,
      privateReferenceRuntimeUse:false,
      webDiscoveryRuntimeUse:false
    }),
    aiUsed:false,
    providerUsed:false,
    productInterpretationComplete:true,
    productionEligible:false
  });
}
