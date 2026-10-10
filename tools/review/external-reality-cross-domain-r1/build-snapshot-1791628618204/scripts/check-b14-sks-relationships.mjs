import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateStructuredRelationships} from './lib/structured-relationship-checker.mjs';
import {currentDedupReport} from './build-b14-sks-dedup.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),base='content/knowledge/structured/';
currentDedupReport();
const data={graph:read(base+'structured-knowledge-relationships-v1.json'),objects:read(base+'structured-knowledge-registry-v1.json').objects,schema:read(base+'schema/structured-knowledge-relationship-v1.schema.json')};
const result=validateStructuredRelationships(data);
for(const path of [...new Set(data.objects.map(o=>o.registryPath))]){
 const registry=read(path),rows=registry.objects||registry.patterns||registry.entries;
 const relationships=rows.flatMap(o=>{for(const e of o.relationships||[])assert.equal(e.sourceObjectId,o.objectId,'EMBEDDED_RELATIONSHIP_OWNER_MISMATCH');return o.relationships||[];});
 validateStructuredRelationships({...data,graph:{relationships,proposedRelationships:[]}});
}
let count=0;const reject=(edit,pattern)=>{const c=structuredClone(data);edit(c);assert.throws(()=>validateStructuredRelationships(c),pattern);count++;};
reject(c=>c.graph.proposedRelationships[0].sourceObjectId='MISSING',/MISSING_RELATIONSHIP_SOURCE/);
reject(c=>c.graph.proposedRelationships[0].targetObjectId='MISSING',/MISSING_RELATIONSHIP_TARGET/);
reject(c=>c.graph.proposedRelationships[0].role='CAUSES',/INVALID_PROPOSAL_ROLE/);
reject(c=>c.graph.proposedRelationships[0].retrievalEligible=true,/PROPOSAL_RETRIEVAL_PROMOTED/);
reject(c=>c.graph.proposedRelationships.push(c.graph.proposedRelationships[0]),/DUPLICATE_RELATIONSHIP_ID/);
reject(c=>c.graph.proposedRelationships[0].sourceBacklinkIds=[],/MISSING_PROPOSAL_BACKLINK/);
const fixture=structuredClone(data),e=fixture.graph.proposedRelationships[0];e.targetObjectId=e.sourceObjectId;e.sourceBacklinkIds=[e.sourceObjectId];
assert.throws(()=>validateStructuredRelationships(fixture),/SELF_LOOP_NOT_AUTHORIZED/);count++;
fixture.selfLoopAllowances=[{relationshipId:e.relationshipId,objectId:e.sourceObjectId,type:e.role,rationale:'Fixture only',approvalRef:'fixture:not-production'}];validateStructuredRelationships(fixture);
const semantic={relationshipId:'FIXTURE',sourceObjectId:e.sourceObjectId,targetObjectId:data.graph.proposedRelationships[0].targetObjectId,relationshipType:'INVALID',claimStrength:'CONCEPTUAL',sourceRefs:{canonicalNodeCodes:['fixture'],manuscriptSectionRefs:['fixture'],publishedArticleRefs:[],figureRefs:[],relatedStructuredObjectIds:[]},evidenceState:'UNREVIEWED'};
reject(c=>c.graph.relationships.push(semantic),/INVALID_RELATIONSHIP_SCHEMA/);
validateStructuredRelationships({...data,graph:{relationships:[{...semantic,relationshipType:'PRECEDES'}],proposedRelationships:[]}});
console.log(`✓ W66: ${result.semanticEdges} semantic edges, ${result.proposals} pending reading proposals; ${count} invalid cases rejected. Production self-loop allowances remain empty.`);
