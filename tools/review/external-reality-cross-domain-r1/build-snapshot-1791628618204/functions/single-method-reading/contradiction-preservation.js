import {SMR_R2_CONTRADICTION_RULES} from './smr-w6-w8-rules.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function stateFor(claim){
  if(list(claim.counterEvidenceRefs).length)return 'COUNTERBALANCED';
  return SMR_R2_CONTRADICTION_RULES.claimTypeState[claim.claimType]||null;
}
function lineageRefs(claim){return uniq([
  claim.lineage?.productionAdmissionRef,claim.lineage?.readingAuthorityRef,
  ...list(claim.lineage?.interpretationUnitRefs),...list(claim.lineage?.projectionRefs),...list(claim.lineage?.meaningRefs),...list(claim.lineage?.ruleRefs),...list(claim.lineage?.boundaryRefs)
])}
function themeState(relations){
  const states=new Set(relations.map(item=>item.state));
  if(states.has('COUNTERBALANCED'))return 'COUNTERBALANCED';
  if(states.has('TENSION')&&(states.has('SUPPORT')||states.has('CONDITIONAL')||states.has('OPEN')))return 'COUNTERBALANCED';
  if(states.has('TENSION'))return 'TENSION';
  if(states.has('CONDITIONAL'))return 'CONDITIONAL';
  if(states.has('OPEN'))return 'OPEN';
  if(states.has('SUPPORT'))return 'SUPPORT';
  return null;
}

export function preserveContradictions({priorityResolution,themeCollection=null,claimDedup=null}={}){
  if(priorityResolution?.schemaVersion!=='PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0')fail('SMR_R2_PRIORITY_RESOLUTION_REQUIRED');
  if(themeCollection&&themeCollection.schemaVersion!=='PHI-OS-CUSTOMER-THEME-IR-COLLECTION-v1.0.0')fail('SMR_R2_THEME_COLLECTION_INVALID');
  if(claimDedup&&claimDedup.schemaVersion!=='PHI-OS-SMR-R2-CLAIM-DEDUP-v1.0.0')fail('SMR_R2_CLAIM_DEDUP_INVALID');
  const dedupByClaim=new Map(list(claimDedup?.decisions).map(item=>[item.claimRef,item]));
  const themeRefsByClaim=new Map();
  for(const theme of list(themeCollection?.themes))for(const ref of list(theme.claimRefs)){if(!themeRefsByClaim.has(ref))themeRefsByClaim.set(ref,[]);themeRefsByClaim.get(ref).push(theme.themeId)}
  const relations=[];
  for(const claim of list(priorityResolution.claims)){
    const state=stateFor(claim);if(!state)continue;
    const dedup=dedupByClaim.get(claim.claimId)||null;
    let narrativeDisposition=dedup?.decision||'PRIMARY_EXPLANATION';
    if(['TENSION','CONDITIONAL','COUNTERBALANCED','OPEN'].includes(state)&&narrativeDisposition==='SUPPRESSED_DUPLICATE')narrativeDisposition='CONTEXT_DERIVATIVE_REQUIRED';
    relations.push(freeze({
      relationId:`SMR2-CONTRADICTION:${state}:${claim.claimId}`,claimRef:claim.claimId,themeRefs:uniq(themeRefsByClaim.get(claim.claimId)||[]),semanticDimension:claim.semanticDimension,
      state,claimType:claim.claimType,headline:claim.headline,structuralMeaning:claim.structuralMeaning,
      evidenceRefs:uniq(claim.evidenceRefs),counterEvidenceRefs:uniq(claim.counterEvidenceRefs),conditionRefs:uniq(claim.conditions),boundaryRefs:uniq(claim.boundaries),lineageRefs:lineageRefs(claim),
      dedupDecision:dedup?.decision||null,narrativeDisposition,
      boundary:freeze({sourceClaimPreserved:true,newMeaningCreated:false,oneSidedCollapseAllowed:false})
    }));
  }
  const themeStates=list(themeCollection?.themes).map(theme=>{
    const themeRelations=relations.filter(item=>item.themeRefs.includes(theme.themeId));
    const state=themeState(themeRelations);
    return freeze({
      themeRef:theme.themeId,state,
      supportClaimRefs:themeRelations.filter(item=>item.state==='SUPPORT').map(item=>item.claimRef),
      tensionClaimRefs:themeRelations.filter(item=>item.state==='TENSION').map(item=>item.claimRef),
      conditionalClaimRefs:themeRelations.filter(item=>item.state==='CONDITIONAL').map(item=>item.claimRef),
      counterbalancedClaimRefs:themeRelations.filter(item=>item.state==='COUNTERBALANCED').map(item=>item.claimRef),
      openClaimRefs:themeRelations.filter(item=>item.state==='OPEN').map(item=>item.claimRef)
    });
  });
  const requiredClaims=list(priorityResolution.claims).filter(claim=>SMR_R2_CONTRADICTION_RULES.preserveClaimTypes.includes(claim.claimType)||list(claim.counterEvidenceRefs).length).map(claim=>claim.claimId);
  const preservedClaimRefs=uniq(relations.filter(item=>['TENSION','CONDITIONAL','COUNTERBALANCED','OPEN'].includes(item.state)).map(item=>item.claimRef));
  for(const ref of requiredClaims)if(!preservedClaimRefs.includes(ref))fail('SMR_R2_CONTRADICTION_NOT_PRESERVED',{claimRef:ref});
  const expectedCounter=uniq(list(priorityResolution.claims).flatMap(claim=>list(claim.counterEvidenceRefs)));
  const preservedCounterEvidenceRefs=uniq(relations.flatMap(item=>item.counterEvidenceRefs));
  for(const ref of expectedCounter)if(!preservedCounterEvidenceRefs.includes(ref))fail('SMR_R2_COUNTER_EVIDENCE_NOT_PRESERVED',{counterEvidenceRef:ref});
  return freeze({
    schemaVersion:'PHI-OS-SMR-R2-CONTRADICTION-PRESERVATION-v1.0.0',methodId:priorityResolution.methodId,readingAuthorityRef:priorityResolution.readingAuthorityRef,semanticDigest:priorityResolution.semanticDigest,
    rulesVersion:SMR_R2_CONTRADICTION_RULES.schemaVersion,relations:relations.sort((a,b)=>a.claimRef.localeCompare(b.claimRef)),themeStates,
    preservedClaimRefs,preservedCounterEvidenceRefs,
    counts:freeze(Object.fromEntries(SMR_R2_CONTRADICTION_RULES.states.map(state=>[state,relations.filter(item=>item.state===state).length]))),
    boundary:freeze({deterministic:true,tensionDeleted:false,conditionDeleted:false,openDeleted:false,counterEvidenceDeleted:false,oneSidedCollapseAllowed:false,newMeaningCreated:false})
  });
}
