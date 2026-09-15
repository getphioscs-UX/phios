import assert from 'node:assert/strict';
import Ajv from 'ajv';
export function validateStructuredRelationships({graph,objects,schema,selfLoopAllowances=[]}){
 const ids=new Set(objects.map(o=>o.objectId)),seen=new Set(),pairs=new Set();
 const valid=new Ajv({allErrors:true,strict:false}).compile(schema);
 const edges=[...graph.relationships.map(edge=>({edge,proposed:false})),...graph.proposedRelationships.map(edge=>({edge,proposed:true}))];
 for(const {edge:e,proposed} of edges){
  assert.ok(typeof e.relationshipId==='string'&&e.relationshipId.trim(),'INVALID_RELATIONSHIP_ID');
  assert.ok(!seen.has(e.relationshipId),'DUPLICATE_RELATIONSHIP_ID');seen.add(e.relationshipId);
  assert.ok(ids.has(e.sourceObjectId),'MISSING_RELATIONSHIP_SOURCE');assert.ok(ids.has(e.targetObjectId),'MISSING_RELATIONSHIP_TARGET');
  if(proposed){assert.equal(e.role,'SUGGESTED_READING','INVALID_PROPOSAL_ROLE');assert.equal(e.status,'PENDING_HUMAN_REVIEW','PROPOSAL_PROMOTED');assert.equal(e.retrievalEligible,false,'PROPOSAL_RETRIEVAL_PROMOTED');assert.equal(e.evidenceState,'UNREVIEWED','PROPOSAL_EVIDENCE_PROMOTED');assert.equal(e.claimStrength,'CONCEPTUAL','PROPOSAL_CLAIM_PROMOTED');assert.ok(Array.isArray(e.sourceBacklinkIds)&&[e.sourceObjectId,e.targetObjectId].every(id=>e.sourceBacklinkIds.includes(id)),'MISSING_PROPOSAL_BACKLINK');for(const id of e.sourceBacklinkIds)assert.ok(ids.has(id),'DANGLING_PROPOSAL_BACKLINK');}
  else assert.ok(valid(e),`INVALID_RELATIONSHIP_SCHEMA:${JSON.stringify(valid.errors)}`);
  const key=JSON.stringify([e.sourceObjectId,e.targetObjectId,proposed?e.role:e.relationshipType]);assert.ok(!pairs.has(key),'DUPLICATE_RELATIONSHIP_PAIR');pairs.add(key);
  if(e.sourceObjectId===e.targetObjectId)assert.ok(selfLoopAllowances.some(a=>a.relationshipId===e.relationshipId&&a.objectId===e.sourceObjectId&&a.type===(e.relationshipType||e.role)&&a.rationale?.trim()&&a.approvalRef?.trim()),'SELF_LOOP_NOT_AUTHORIZED');
 }
 for(const a of selfLoopAllowances)assert.ok(edges.some(({edge:e})=>e.relationshipId===a.relationshipId&&e.sourceObjectId===e.targetObjectId),'STALE_SELF_LOOP_ALLOWANCE');
 return {semanticEdges:graph.relationships.length,proposals:graph.proposedRelationships.length};
}
