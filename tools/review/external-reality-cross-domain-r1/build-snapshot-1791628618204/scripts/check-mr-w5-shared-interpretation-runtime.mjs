import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  createSharedInterpretationRuntime,
  SHARED_INTERPRETATION_RUNTIME_CODE
} from '../functions/method-runtime/shared-interpretation-runtime.js';

const schema = JSON.parse(await fs.readFile('content/professional/method-runtime/canonical-interpretation-candidate-v1.schema.json','utf8'));
const manifest = JSON.parse(await fs.readFile('content/professional/method-runtime/shared-interpretation-runtime-v1.json','utf8'));
assert.equal(schema.properties.runtimeCode.const, SHARED_INTERPRETATION_RUNTIME_CODE);
assert.deepEqual(manifest.allowedProviders, ['WORKERS_AI','OPENAI']);
assert.equal(manifest.authority, 'candidate_only');

const projection = {
  schemaVersion:'PHI-OS-CANONICAL-PROJECTION-v1.0.0', projectionType:'GATE',
  projectionCode:'PRJ-GATE-0123456789ABCDEF01234567', projectionVersion:'1.0.0',
  projectionValue:{gate:1}, projectionSource:{}, projectionConfidence:{level:'exact'},
  deterministic:true, providerUsed:false, aiUsed:false, interpretationCreated:false,
  knowledgeCreated:false, realityConclusionCreated:false, professionalConclusionCreated:false
};
const frozen = JSON.stringify(projection);
const runtime = createSharedInterpretationRuntime({
  knowledgeLookup: async () => ({lookupCode:'KNR',lookupVersion:'1.0.0',queryDigest:'q',resultDigest:'r',publishedOnly:true,registryLed:true,matches:[{nodeCode:'KN-1'}]}),
  journeyRuntime: async () => ({journeyRuntimeCode:'JOURNEY_RUNTIME',journeyRuntimeVersion:'1.0.0',journeyId:'J-1',contextDigest:'j',finalConclusionCreated:false,professionalReportCreated:false,realityDecisionCreated:false}),
  providers:[{providerCode:'WORKERS_AI',providerVersion:'1.0.0',interpret:async()=>({summary:'Candidate only',observations:['o'],knowledgeReferences:['KN-1'],limitations:['Human review required']})}]
});
const request={runtimeCode:SHARED_INTERPRETATION_RUNTIME_CODE,projection,providerCode:'WORKERS_AI',journeyId:'J-1',locale:'en',candidateVersion:'1.0.0'};
const a=await runtime.interpret(request); const b=await runtime.interpret(request);
assert.equal(a.candidateStatus,'candidate');
assert.equal(a.candidateCode,b.candidateCode);
assert.equal(a.providerUsed,true); assert.equal(a.aiUsed,true);
assert.equal(a.finalConclusionCreated,false); assert.equal(a.professionalReportCreated,false); assert.equal(a.realityDecisionCreated,false);
assert.equal(JSON.stringify(projection),frozen);
await assert.rejects(()=>runtime.interpret({...request,finalConclusion:'x'}),/forbidden/i);
assert.throws(()=>createSharedInterpretationRuntime({knowledgeLookup:async()=>({}),journeyRuntime:async()=>({}),providers:[{providerCode:'OTHER',providerVersion:'1',interpret:async()=>({})}]}),/WORKERS_AI or OPENAI/);
console.log('✓ MR-W5 Shared Interpretation Runtime passed.');
console.log('  Projection → Knowledge Lookup → Journey Runtime → AI → Interpretation Candidate.');
console.log('  Final Conclusion, Professional Report and Reality Decision remain forbidden.');
