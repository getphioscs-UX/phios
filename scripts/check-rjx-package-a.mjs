import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const base='content/runtime/journey-runtime';
const requested=process.argv[2] ?? 'ALL';
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
const j=p=>JSON.parse(read(p));
const h=p=>crypto.createHash('sha256').update(read(p),'utf8').digest('hex');
const run=(code,fn)=>{if(requested==='ALL'||requested===code){fn(); console.log('✓ '+code+' passed.')}};
const canonicalPath='content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json';
const canonical=j(canonicalPath);

run('RJX-W0',()=>{
  const c=j(base+'/contracts/reality-journey-role-contract-v1.json');
  const r=j(base+'/registries/reality-request-route-registry-v1.json');
  const a=j(base+'/audits/rjx-w0-role-reconciliation-v1.json');
  assert.equal(c.activation.productionEffect,'none');
  assert.equal(c.boundaries.allQuestionsDefaultToJourney,false);
  assert.deepEqual(c.requestClasses.map(x=>x.code),['KNOWLEDGE_REQUEST','METHOD_ONLY','SIMPLE_REALITY_CASE','COMPLEX_REALITY_CASE','PROFESSIONAL_BOUNDARY','UNSUPPORTED']);
  assert.equal(r.default.requestClass,'UNSUPPORTED'); assert.equal(r.default.silentAcceptance,false);
  assert.equal(a.acceptanceEvidence.publicPrivateBoundaryCrossingCount,0);
});

run('RJX-W1-AUTHORITY',()=>{
  const a=j(base+'/audits/rjx-w1-runtime-authority-reconciliation-v1.json');
  assert.equal(a.nodeAccounting.canonicalNodeCount,931); assert.equal(a.nodeAccounting.frozenRuntimeMutationCount,0);
  for(const x of a.upstreamAuthorities){assert.ok(fs.existsSync(path.join(root,x.reference)),'Missing authority '+x.reference); assert.equal(h(x.reference),x.sha256,'Authority drift '+x.reference)}
  assert.equal(a.journeyStateOrderReconciliation.runtimeStateMutation,false);
});

run('RJX-W1-RULE-CANDIDATES',()=>{
  const e=j(base+'/registries/canonical-node-rule-eligibility-v1.json'); const b=j(base+'/registries/canonical-node-rule-binding-candidates-v1.json');
  assert.equal(canonical.nodes.length,931); assert.equal(e.entries.length,931); assert.equal(b.bindings.length,931);
  assert.equal(new Set(e.entries.map(x=>x.nodeCode)).size,931); assert.equal(new Set(b.bindings.map(x=>x.sourceNodeCodes[0])).size,931);
  assert.deepEqual(new Set(e.entries.map(x=>x.nodeCode)),new Set(canonical.nodes.map(x=>x.nodeCode)));
  assert.ok(e.entries.every(x=>x.selectedDisposition==='DEFER'&&x.activeRule===false&&x.productionEffect==='none'&&x.canonicalMutation===false&&x.humanAcceptance===null));
  assert.ok(b.bindings.every(x=>x.sourceNodeCodes.length===1&&x.predicate===null&&x.activeRule===false&&x.productionEffect==='none'&&x.humanAcceptance===null));
  assert.equal(e.authority.canonicalRegistry.sha256,h(canonicalPath));
});

run('RJX-W2',()=>{
  const c=j(base+'/contracts/client-stage-projection-contract-v1.json'); const r=j(base+'/registries/client-stage-projection-registry-v1.json');
  const frozen=j(base+'/registries/canonical-journey-stage-registry-v2.json');
  assert.equal(c.backendStateCount,8); assert.equal(c.clientStageCount,3); assert.deepEqual(r.canonicalBackendOrder,frozen.canonicalOrder);
  assert.equal(new Set(r.projections.map(x=>x.runtimeState)).size,8); assert.deepEqual(new Set(r.projections.map(x=>x.runtimeState)),new Set(frozen.canonicalOrder));
  assert.ok(r.projections.every(x=>['Understand','Choose','Review'].includes(x.clientStage)));
  assert.equal(c.invariants.runtimeStateNotUrl,true); assert.equal(c.invariants.runtimeStateNotScreen,true); assert.equal(c.invariants.backendStateMutationAllowed,false);
});

run('RJX-W3',()=>{
  const c=j(base+'/contracts/client-journey-simplification-contract-v1.json'); const r=j(base+'/registries/client-stage-copy-registry-v1.json');
  assert.deepEqual(c.clientStages,['Understand','Choose','Review']); assert.equal(c.boundaries.clientNeedsToKnowICR,false); assert.equal(c.boundaries.clientNeedsToKnowRMO,false); assert.equal(c.boundaries.clientNeedsToKnowRDG,false);
  assert.ok(r.locales.en&&r.locales['zh-Hans']); assert.equal(r.productionEffect,'none');
});

run('RJX-ENTRY-PROVIDER-OPT-IN',()=>{
  const p=j(base+'/policies/rjx-entry-openai-opt-in-repair-candidate-v1.json');
  assert.equal(p.rule.defaultOpenAIAllowed,false); assert.equal(p.rule.explicitTrueRequired,true);
  const router=read('functions/runtime/entry/provider-router.js'); const api=read('functions/api/reconstruct-reality.js');
  assert.ok(router.includes('options.openAIAllowed === true && Boolean(cleanText(env?.OPENAI_API_KEY))'));
  assert.ok(!router.includes('options.openAIAllowed !== false && Boolean(cleanText(env?.OPENAI_API_KEY))'));
  assert.ok(api.includes('?.openAIAllowed === true'));
});

if(requested==='ALL') console.log('✓ RJX Package A W0-W3 candidate implementation passed: 931 nodes accounted, zero rule activation, frozen JR order preserved, 8→3 client projection valid, and Runtime Entry OpenAI is explicit opt-in.');
