import assert from 'node:assert/strict';
export const conflictStates=Object.freeze(['SUPERSEDED','REFINED','CONTEXT_SPECIFIC','UNRESOLVED']);
// Validation never changes either source definition or applies a resolution to retrieval.
export function validateConflict(record,candidates){
 assert.ok(record.conflictId,'CONFLICT_ID_REQUIRED');
 assert.ok(conflictStates.includes(record.state),'INVALID_CONFLICT_STATE');
 assert.equal(record.automaticWriteback,false,'WRITEBACK_FORBIDDEN');
 assert.equal(record.variants.length,2,'TWO_VARIANTS_REQUIRED');
 assert.notEqual(record.variants[0].candidateId,record.variants[1].candidateId,'DISTINCT_VARIANTS_REQUIRED');
 for(const variant of record.variants){
  const source=candidates.find(c=>c.candidateId===variant.candidateId);assert.ok(source,'UNKNOWN_VARIANT');
  assert.deepEqual(variant,conflictVariant(source),'VARIANT_SOURCE_DRIFT');
  assert.ok(typeof source.proposedMeaning==='string'&&source.proposedMeaning.trim(),'MISSING_MEANING');
 }
 if(record.state==='UNRESOLVED'){assert.equal(record.resolution,null,'UNREVIEWED_RESOLUTION');return true;}
 const resolution=record.resolution;
 assert.ok(resolution?.reviewer?.trim()&&resolution?.rationale?.trim(),'HUMAN_RESOLUTION_REQUIRED');
 assert.ok(resolution.evidenceRefs?.length&&resolution.evidenceRefs.every(r=>typeof r==='string'&&r.trim()),'RESOLUTION_EVIDENCE_REQUIRED');
 if(record.state==='CONTEXT_SPECIFIC'){
  assert.equal(resolution.contexts?.length,2,'TWO_CONTEXTS_REQUIRED');
  assert.deepEqual([...resolution.contexts.map(c=>c.candidateId)].sort(),record.variants.map(v=>v.candidateId).sort(),'CONTEXT_VARIANTS_MISMATCH');
  assert.ok(resolution.contexts.every(c=>c.scope?.trim()),'EXPLICIT_CONTEXT_REQUIRED');
 }else{
  const ids=record.variants.map(v=>v.candidateId);
  assert.ok(ids.includes(resolution.predecessorId)&&ids.includes(resolution.successorId)&&resolution.predecessorId!==resolution.successorId,'EXPLICIT_DIRECTION_REQUIRED');
 }
 return true;
}
export function conflictVariant(c){return {candidateId:c.candidateId,bookCode:c.bookCode,nodeCode:c.nodeCode,meaning:c.proposedMeaning,meaningKind:c.meaningKind,sourceQuoteRefs:c.sourceQuoteRefs,manuscriptRef:c.manuscriptRef};}
export function buildConflictRegistry(dedup){
 return {version:'1.0.0',stage:'B14-SKS-W61',supportedStates:conflictStates,conflicts:[],reviewCandidates:dedup.findings.map(f=>({candidateId:f.findingId,candidateIds:f.candidateIds,evidence:f.evidence,reasons:f.reasons,state:'UNRESOLVED',confirmedConflict:false,resolution:null,reviewState:'PENDING_HUMAN_REVIEW'})),coverage:dedup.coverage,sourceDedup:dedup.input,policy:{silentOverwriteAllowed:false,automaticWriteback:false,bookOrderEstablishesPrecedence:false,duplicateTextEstablishesConflict:false,resolvedRecordsRequireExplicitHumanEvidence:true,customerRetrievalCutover:false},humanAcceptanceComplete:false};
}
