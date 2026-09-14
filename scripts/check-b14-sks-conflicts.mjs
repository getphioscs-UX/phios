import fs from 'node:fs';
import assert from 'node:assert/strict';
import {currentConflictRegistry,output} from './build-b14-sks-conflicts.mjs';
import {conflictVariant,validateConflict} from './lib/structured-conflicts.mjs';
const source=id=>({candidateId:id,bookCode:id==='a'?'BOOK-1':'BOOK-3',nodeCode:id,proposedMeaning:id==='a'?'Original definition':'Later contextual refinement',meaningKind:'SOURCE_DEFINITION',sourceQuoteRefs:[{path:'fixture',pointer:'/definition',sha256:'fixture-only'}],manuscriptRef:[]});
const candidates=[source('a'),source('b')];
const unresolved={conflictId:'FIXTURE',state:'UNRESOLVED',variants:candidates.map(conflictVariant),resolution:null,automaticWriteback:false};
const before=JSON.stringify(candidates);
assert.equal(validateConflict(unresolved,candidates),true);
for(const state of ['SUPERSEDED','REFINED']){
 const record={...unresolved,state,resolution:{reviewer:'Fixture reviewer',rationale:'Test only',evidenceRefs:['fixture'],predecessorId:'a',successorId:'b'}};
 assert.equal(validateConflict(record,candidates),true);
 assert.throws(()=>validateConflict({...record,resolution:null},candidates),/HUMAN_RESOLUTION_REQUIRED/);
 assert.throws(()=>validateConflict({...record,resolution:{...record.resolution,successorId:'a'}},candidates),/EXPLICIT_DIRECTION_REQUIRED/);
}
assert.equal(validateConflict({...unresolved,state:'CONTEXT_SPECIFIC',resolution:{reviewer:'Fixture',rationale:'Distinct scope',evidenceRefs:['fixture'],contexts:[{candidateId:'a',scope:'Formation'},{candidateId:'b',scope:'Maintenance'}]}},candidates),true);
assert.throws(()=>validateConflict({...unresolved,state:'AUTO_REPLACE'},candidates),/INVALID_CONFLICT_STATE/);
assert.throws(()=>validateConflict({...unresolved,automaticWriteback:true},candidates),/WRITEBACK_FORBIDDEN/);
const tampered=structuredClone(unresolved);tampered.variants[0].meaning='changed';assert.throws(()=>validateConflict(tampered,candidates),/VARIANT_SOURCE_DRIFT/);
assert.equal(JSON.stringify(candidates),before);
const actual=JSON.parse(fs.readFileSync(output));assert.deepEqual(actual,currentConflictRegistry());
assert.equal(actual.conflicts.length,0);assert.equal(actual.reviewCandidates.length,5);assert.equal(actual.coverage.meaningUnavailable.length,40);
assert.ok(actual.reviewCandidates.every(c=>c.state==='UNRESOLVED'&&!c.confirmedConflict&&c.resolution===null));
console.log('✓ W61: four conflict states, explicit direction/context, source preservation and review boundaries passed; five clues remain unconfirmed.');
