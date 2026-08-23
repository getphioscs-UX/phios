/** PHI OS TARI-W4-W6 deterministic Tarot reality-comparison composition; no prediction or decision authority. */
export const TAROT_REALITY_QUESTIONS=Object.freeze([
  'Does your current evidence support that lens?',
  'What contradicts it?',
  'What remains unknown?',
  'What requires observation?',
  'What decision remains yours?'
]);
const PREDICTION_PATTERNS=Object.freeze([/\bwill happen\b/i,/\bwill marry\b/i,/\bwill divorce\b/i,/\bwill get rich\b/i,/\bwill get sick\b/i,/\bwill die\b/i]);
const DECISION_PATTERNS=Object.freeze([/\bquit your job\b/i,/\byou should invest\b/i,/\binvest your money\b/i,/\bleave your partner\b/i,/\bend your relationship\b/i,/\bstop treatment\b/i,/\bstop your medication\b/i]);
function scanGenerated(v,path='$'){
  if(typeof v==='string'){
    for(const r of PREDICTION_PATTERNS) if(r.test(v)) throw new TypeError(`TAROT_NON_PREDICTION_BOUNDARY:${path}`);
    for(const r of DECISION_PATTERNS) if(r.test(v)) throw new TypeError(`TAROT_DECISION_BOUNDARY:${path}`);
    return;
  }
  if(Array.isArray(v)){v.forEach((x,i)=>scanGenerated(x,`${path}[${i}]`));return;}
  if(v&&typeof v==='object') for(const [k,x] of Object.entries(v)) scanGenerated(x,`${path}.${k}`);
}
function lensFromCandidate(candidate){
  const generated=Object.freeze({
    lensIntroduction:`This card introduces “${candidate.lensLabel}” as a source-bound lens.`,
    evidenceQuestion:TAROT_REALITY_QUESTIONS[0],
    claimRef:candidate.claimId,
    sourceId:candidate.sourceId,
    perspectiveId:candidate.perspectiveId,
    perspectiveClass:candidate.perspectiveClass,
    provenance:structuredClone(candidate.provenance)
  });
  scanGenerated(generated);
  return Object.freeze({...generated,sourceClaim:Object.freeze({claim:candidate.claim,sourceBound:true,predictionPromotedToSystemClaim:false,decisionDirectivePromotedToSystemClaim:false})});
}
export function composeTarotRealityComparison(bundle){
  if(bundle?.schemaVersion!=='PHI-OS-TAROT-SOURCE-BOUND-INTERPRETATION-v1.0.0') throw new TypeError('TAROT_SOURCE_BOUND_INTERPRETATION_REQUIRED');
  const cards=Object.freeze(bundle.cards.map(card=>Object.freeze({
    projectionRef:card.projectionRef,
    card:Object.freeze({cardId:card.structuralCard.cardId,cardIdentity:card.structuralCard.cardIdentity,canonicalTitle:card.structuralCard.canonicalTitle,orientation:card.structuralCard.orientation,position:structuredClone(card.structuralCard.position)}),
    symbolDimensions:structuredClone(card.symbolDimensions),
    lenses:Object.freeze(card.commentaryCandidates.map(lensFromCandidate)),
    perspectiveComparison:structuredClone(card.crossSourceInterpretation),
    realityQuestions:TAROT_REALITY_QUESTIONS,
    coverage:card.coverage
  })));
  const out=Object.freeze({
    schemaVersion:'PHI-OS-TAROT-REALITY-COMPARISON-v1.0.0',mode:'DETERMINISTIC_STRUCTURED_PRESENTATION',methodCode:'TAROT',cards,
    rules:Object.freeze({cardSaysFramingUsed:false,lensFramingRequired:true,realityMayContradictLens:true,unknownMayRemainUnknown:true,userDecisionAuthority:true}),
    authority:Object.freeze({compositionOwnsCanonicalMeaning:false,compositionOwnsRealityTruth:false,compositionOwnsPrediction:false,compositionOwnsDecision:false,professionalInstructionAllowed:false}),
    allowedOutputClasses:Object.freeze(['REFLECTION','QUESTION','PERSPECTIVE']),aiUsed:false,providerUsed:false,productionEligible:false
  });
  // Historical/source-bound claims are intentionally not scanned as PHI OS system claims.
  scanGenerated({rules:out.rules,authority:out.authority,allowedOutputClasses:out.allowedOutputClasses,cards:out.cards.map(c=>({lenses:c.lenses.map(l=>({lensIntroduction:l.lensIntroduction,evidenceQuestion:l.evidenceQuestion})),realityQuestions:c.realityQuestions}))});
  return out;
}
export function assertTarotGeneratedBoundaries(value){scanGenerated(value);return true;}
