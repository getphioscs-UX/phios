/**
 * PHI OS ICH-PROD-W3 — deterministic I Ching product Reading IR.
 *
 * This successor consumes the frozen structural calculation/projection and the
 * source-bound ICHI interpretation bundle. It does not add divination,
 * diagnosis, hidden-state inference, professional advice, or decision authority.
 */

export const ICHING_READING_IR_VERSION='1.0.0';
export const ICHING_READING_IR_SCHEMA='PHI-OS-ICHING-READING-IR-v1.0.0';

const clone=value=>structuredClone(value);
const arr=value=>Array.isArray(value)?value:[];
const text=value=>typeof value==='string'?value.normalize('NFKC').trim():'';
const VALID_UNCERTAINTY=new Set(['UNKNOWN','UNRESOLVED','CONTRADICTORY','NOT_SUPPORTED_BY_REALITY','SOURCE_DISAGREEMENT']);

function evidenceItem(item,index,kind){
  if(typeof item==='string') return Object.freeze({evidenceId:`${kind}-${index+1}`,statement:text(item),source:'USER_SUPPLIED_REALITY_CONTEXT',provenance:null});
  if(!item||typeof item!=='object'||Array.isArray(item)) throw new TypeError(`ICHING_RCC_${kind}_ITEM_INVALID`);
  const statement=text(item.statement||item.claim||item.observation||item.text);
  if(!statement) throw new TypeError(`ICHING_RCC_${kind}_STATEMENT_REQUIRED`);
  return Object.freeze({evidenceId:text(item.evidenceId)||`${kind}-${index+1}`,statement,source:text(item.source)||'USER_SUPPLIED_REALITY_CONTEXT',provenance:item.provenance?clone(item.provenance):null});
}

function normalizeRcc(input={}){
  const supporting=arr(input.supportingEvidence).map((x,i)=>evidenceItem(x,i,'SUPPORT'));
  const contradictory=arr(input.contradictoryEvidence).map((x,i)=>evidenceItem(x,i,'CONTRADICT'));
  const observation=arr(input.observation||input.observations).map((x,i)=>evidenceItem(x,i,'OBSERVATION'));
  const unknown=arr(input.unknown||input.unknowns).map((x,i)=>evidenceItem(x,i,'UNKNOWN'));
  if(!supporting.length&&!contradictory.length&&!observation.length&&!unknown.length){
    unknown.push(Object.freeze({evidenceId:'UNKNOWN-1',statement:'No real-world evidence was supplied for comparison.',source:'SYSTEM_BOUNDARY_NOTICE',provenance:null}));
  }
  return Object.freeze({
    required:true,
    supportingEvidence:Object.freeze(supporting),
    contradictoryEvidence:Object.freeze(contradictory),
    unknown:Object.freeze(unknown),
    observation:Object.freeze(observation),
    questions:Object.freeze([
      'What in your current reality supports this lens?',
      'What contradicts it?',
      'What remains unknown?',
      'What requires observation?',
      'What decision remains yours?'
    ]),
    rules:Object.freeze({hexagramIsRealityEvidence:false,sourceClaimIsRealityEvidence:false,reflectionIsRealityEvidence:false,realityMayContradictReading:true,unknownMayRemainUnknown:true})
  });
}

function uncertaintyFor(bundle,rcc,input={}){
  const states=[];
  const add=(status,reason,scope='READING')=>{
    if(!VALID_UNCERTAINTY.has(status)) throw new TypeError(`ICHING_UNCERTAINTY_STATUS_INVALID:${status}`);
    if(!states.some(x=>x.status===status&&x.reason===reason&&x.scope===scope)) states.push(Object.freeze({status,reason,scope}));
  };
  if(rcc.unknown.length) add('UNKNOWN','REALITY_CONTEXT_CONTAINS_UNKNOWN_OR_MISSING_EVIDENCE');
  if(rcc.contradictoryEvidence.length) add('CONTRADICTORY','REALITY_EVIDENCE_CONTRADICTS_OR_COMPLICATES_THE_SYMBOLIC_LENS');
  if(input.notSupportedByReality===true) add('NOT_SUPPORTED_BY_REALITY','USER_OR_GOVERNED_REALITY_CHECK_MARKED_LENS_NOT_SUPPORTED');
  if(input.sourceDisagreement===true) add('SOURCE_DISAGREEMENT','GOVERNED_SOURCE_PERSPECTIVES_ARE_MARKED_AS_DISAGREEING');
  const missing=[];
  if(bundle.coverage?.primary!=='SOURCE_COMMENTARY_AVAILABLE') missing.push('PRIMARY');
  if(bundle.coverage?.relating!=='SOURCE_COMMENTARY_AVAILABLE') missing.push('RELATING');
  if(missing.length) add('UNRESOLVED',`SOURCE_COMMENTARY_NOT_YET_INGESTED_FOR_${missing.join('_AND_')}`,'SOURCE_COVERAGE');
  if(!states.length) add('UNRESOLVED','NO_SINGLE_REALITY_CONCLUSION_IS_AUTHORIZED');
  return Object.freeze({required:true,states:Object.freeze(states),mayRemainUnresolved:true,modelMayNotEraseUncertainty:true});
}

function assertInputs({question,evidence,calculationResult,projection,bundle,composition}){
  if(!text(question)) throw new TypeError('ICHING_READING_QUESTION_REQUIRED');
  if(evidence?.schemaVersion!=='PHI-OS-SYMBOLIC-METHOD-EVIDENCE-v1.0.0'||evidence?.methodId!=='I_CHING') throw new TypeError('ICHING_METHOD_EVIDENCE_REQUIRED');
  if(calculationResult?.output?.schemaVersion!=='PHI-OS-ICHING-CALCULATION-OUTPUT-v1.0.0'||calculationResult?.methodCode!=='I_CHING') throw new TypeError('ICHING_CALCULATION_RESULT_REQUIRED');
  if(projection?.schemaVersion!=='PHI-OS-CANONICAL-PROJECTION-v1.0.0'||projection?.projectionType!=='HEXAGRAM') throw new TypeError('ICHING_CANONICAL_PROJECTION_REQUIRED');
  if(bundle?.schemaVersion!=='PHI-OS-ICHING-SOURCE-BOUND-INTERPRETATION-v1.0.0') throw new TypeError('ICHING_SOURCE_BOUND_INTERPRETATION_REQUIRED');
  if(composition?.schemaVersion!=='PHI-OS-ICHING-PHIOS-INTERPRETATION-COMPOSITION-v1.0.0') throw new TypeError('ICHING_REALITY_COMPOSITION_REQUIRED');
}

function compositionRecord({evidence,calculationResult,projection,bundle,authorityVersions={},authorityDigests={},generatedAt}){
  const at=text(generatedAt||evidence.timestamp);
  if(!at||Number.isNaN(Date.parse(at))) throw new TypeError('ICHING_COMPOSITION_EVIDENCE_TIMESTAMP_REQUIRED');
  return Object.freeze({
    readingIrVersion:ICHING_READING_IR_VERSION,
    structuralRuntimeVersion:calculationResult.output.runtimeVersion,
    projectionVersion:projection.projectionVersion,
    interpretationAdapterVersion:bundle.adapterVersion,
    hexagramRegistryVersion:text(authorityVersions.hexagramRegistryVersion)||'1.0.0',
    sourceRegistryVersion:text(authorityVersions.sourceRegistryVersion)||'1.0.0',
    perspectiveRegistryVersion:text(authorityVersions.perspectiveRegistryVersion)||'1.0.0',
    corpusVersion:text(authorityVersions.corpusVersion)||'1.0.0',
    authorityDigests:Object.freeze({...authorityDigests}),
    calculationId:calculationResult.calculationId,
    calculationInputDigest:calculationResult.inputDigest,
    calculationOutputDigest:calculationResult.outputDigest,
    projectionCode:projection.projectionCode,
    sourceIds:Object.freeze([...new Set(bundle.commentaryCandidates.map(x=>x.sourceId))].sort()),
    claimIds:Object.freeze(bundle.commentaryCandidates.map(x=>x.claimId).sort()),
    provider:Object.freeze({used:false,providerId:null,modelId:null}),
    generatedAt:at,
    sameEvidenceSameStructure:true,
    modelCalculationAllowed:false,
    modelMayMutateEvidence:false
  });
}

export function createIChingReadingIR({question='',evidence,calculationResult,projection,bundle,composition,contextDisclosure={},realityEvidence={},compositionEvidence={},sensitiveDomainBoundary={}}={}){
  assertInputs({question,evidence,calculationResult,projection,bundle,composition});
  const output=calculationResult.output;
  const rcc=normalizeRcc(realityEvidence);
  const uncertainty=uncertaintyFor(bundle,rcc,realityEvidence);
  const agency=Object.freeze({
    required:true,
    decisionAuthority:'USER',
    ichingMayInformReflection:true,
    ichingMayDecide:false,
    hexagramMayCompelAction:false,
    sourceMayCompelAction:false,
    systemMayCompelAction:false,
    professionalDirectiveAuthority:false,
    hiddenStateAuthority:false,
    userDecisionRemainsYours:true
  });
  const methodEvidence=Object.freeze({
    inputMode:evidence.inputMode,
    selectionMode:evidence.selectionMode,
    sessionId:evidence.sessionId,
    timestamp:evidence.timestamp,
    lineOrder:output.lineOrder,
    sixLines:Object.freeze(output.lines.map(clone)),
    selectedSymbols:Object.freeze([...evidence.selectionEvidence.selectedSymbols]),
    selectionOrder:Object.freeze([...evidence.selectionEvidence.selectionOrder]),
    aiSelected:false,
    rerolledInsideCalculation:false,
    replayEvidence:evidence.inputMode==='SYSTEM_RANDOM'?Object.freeze({seed:evidence.selectionEvidence.seed,entropyEvidence:clone(evidence.selectionEvidence.entropyEvidence),replayToken:evidence.selectionEvidence.replayToken}):null
  });
  const structuralProjection=Object.freeze({
    type:'I_CHING_HEXAGRAM_PROJECTION',
    projectionCode:projection.projectionCode,
    primary:clone(bundle.structuralMeaning.primary),
    changingLines:Object.freeze([...bundle.structuralMeaning.changingLines]),
    relating:clone(bundle.structuralMeaning.relating),
    lineOrder:output.lineOrder,
    lines:Object.freeze(output.lines.map(clone)),
    deterministic:true,
    sourceNeutral:true
  });
  const sourceInterpretation=Object.freeze({
    mode:'PARALLEL_SOURCE_BOUND_SYMBOLIC_PERSPECTIVE',
    structuralMeaning:clone(bundle.structuralMeaning),
    commentaryCandidates:clone(bundle.commentaryCandidates),
    crossSourceComparison:clone(bundle.crossSourceComparison),
    coverage:clone(bundle.coverage),
    composition:clone(composition),
    noSourceVoting:true,
    noUniversalMeaning:true,
    noPrediction:true,
    noDiagnosis:true,
    noHiddenStateCertainty:true
  });

  return Object.freeze({
    schemaVersion:ICHING_READING_IR_SCHEMA,
    readingIrVersion:ICHING_READING_IR_VERSION,
    methodCode:'I_CHING',
    question:text(question),
    contextDisclosure:Object.freeze({
      currentRealityContextUsed:contextDisclosure.currentRealityContextUsed===true,
      currentRealityContextLabel:text(contextDisclosure.currentRealityContextLabel)||null,
      contextUseWasExplicit:contextDisclosure.contextUseWasExplicit===true,
      silentPrivateContextConsumption:false
    }),
    methodEvidence,
    structuralProjection,
    sourceInterpretation,
    rcc,
    uncertainty,
    agency,
    sensitiveDomainBoundary:Object.freeze({...sensitiveDomainBoundary}),
    compositionEvidence:compositionRecord({evidence,calculationResult,projection,bundle,...compositionEvidence}),
    authority:Object.freeze({
      canonicalStructureOwner:'I_CHING_STRUCTURAL_RUNTIME_V1_FROZEN',
      projectionOwner:'SHARED_PROJECTION_RUNTIME',
      interpretationSuccessor:'ICHI_SOURCE_BOUND_V1',
      realityTruthOwner:'USER_REALITY_AND_GOVERNED_EVIDENCE',
      decisionOwner:'USER',
      readingMayPredict:false,
      readingMayDiagnose:false,
      readingMayInferThirdPartyHiddenState:false,
      readingMayCreateProfessionalDirective:false,
      sourceGapMayBeFilledByModel:false
    }),
    aiUsed:false,
    providerUsed:false,
    productionEligible:false
  });
}
