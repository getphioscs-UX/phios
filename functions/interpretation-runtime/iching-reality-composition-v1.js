/** PHI OS ICHI-W6-W8 deterministic MIR composition adapter; presentation only. */
const REALITY_QUESTIONS=Object.freeze([
  'What in your current reality supports this lens?',
  'What contradicts it?',
  'What remains unknown?',
  'What requires observation?',
  'What decision remains yours?'
]);
const FORBIDDEN=[/\bguaranteed future\b/i,/\bfate conclusion\b/i,/\bdestined to\b/i,/\bthis will happen\b/i,/\bthe universe is telling you\b/i,/\byour future is\b/i,/\bcareer outcome is certain\b/i,/\brelationship outcome is certain\b/i];
function scan(v,path='$'){if(typeof v==='string'){for(const r of FORBIDDEN)if(r.test(v))throw new TypeError(`ICHING_NON_DIVINATION_BOUNDARY:${path}`);return;}if(Array.isArray(v)){v.forEach((x,i)=>scan(x,`${path}[${i}]`));return;}if(v&&typeof v==='object')for(const [k,x] of Object.entries(v))scan(x,`${path}.${k}`);}
export function composeIChingRealityLens(bundle){
  if(bundle?.schemaVersion!=='PHI-OS-ICHING-SOURCE-BOUND-INTERPRETATION-v1.0.0')throw new TypeError('ICHING_SOURCE_BOUND_INTERPRETATION_REQUIRED');
  const s=bundle.structuralMeaning; const provenance=Object.freeze({projectionRef:bundle.projectionRef,claimRefs:Object.freeze(bundle.commentaryCandidates.map(x=>x.claimId)),sourceRefs:Object.freeze([...new Set(bundle.commentaryCandidates.map(x=>x.sourceId))]),perspectiveRefs:Object.freeze([...new Set(bundle.commentaryCandidates.map(x=>x.perspectiveId))])});
  const primaryCandidates=bundle.commentaryCandidates.filter(x=>x.hexagramRole==='PRIMARY');
  const relatingCandidates=bundle.commentaryCandidates.filter(x=>x.hexagramRole==='RELATING'&&x.scope!=='LINE');
  const out=Object.freeze({schemaVersion:'PHI-OS-ICHING-PHIOS-INTERPRETATION-COMPOSITION-v1.0.0',mode:'DETERMINISTIC_STRUCTURED_PRESENTATION',methodCode:'I_CHING',projectionRef:bundle.projectionRef,
    structuralPattern:Object.freeze({primaryHexagramId:s.primary.hexagramId,upperTrigramId:s.primary.upperTrigramId,lowerTrigramId:s.primary.lowerTrigramId,changingLines:Object.freeze([...s.changingLines]),relatingHexagramId:s.relating.hexagramId,provenance:Object.freeze({authority:'CANONICAL_ICHING_STRUCTURE',projectionRef:bundle.projectionRef})}),
    possibleTension:Object.freeze({status:primaryCandidates.length?'SOURCE_BOUND_LENSES_AVAILABLE':'UNKNOWN',candidates:Object.freeze(primaryCandidates.map(x=>Object.freeze({claimId:x.claimId,claim:x.claim,sourceId:x.sourceId,perspectiveId:x.perspectiveId,scope:x.scope,...(x.linePosition?{linePosition:x.linePosition}:{}),provenance:structuredClone(x.provenance)})))}),
    possibleTransition:Object.freeze({status:s.changingLines.length?'STRUCTURAL_CHANGE_PRESENT':'NO_CHANGING_LINE',fromHexagramId:s.primary.hexagramId,toHexagramId:s.relating.hexagramId,changingLines:Object.freeze([...s.changingLines]),sourceBoundRelatingLenses:Object.freeze(relatingCandidates.map(x=>Object.freeze({claimId:x.claimId,claim:x.claim,sourceId:x.sourceId,perspectiveId:x.perspectiveId,provenance:structuredClone(x.provenance)})))}),
    questionsForReflection:REALITY_QUESTIONS,provenance,authority:Object.freeze({compositionOwnsDerivation:false,compositionOwnsCanonicalMeaning:false,compositionOwnsRealityTruth:false,compositionOwnsFateConclusion:false,userDecisionAuthority:true}),aiUsed:false,providerUsed:false});
  // Only PHI OS generated/composed language is scanned. Historical source material remains source-bound upstream.
  scan({structuralPattern:out.structuralPattern,questionsForReflection:out.questionsForReflection,authority:out.authority});
  return out;
}
export {REALITY_QUESTIONS};
