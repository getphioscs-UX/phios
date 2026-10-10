import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { matchExistingNode, assertProposalOnly, projectSectionMappings } from './lib/knowledge-authoring/knowledge-authoring-foundation-v1.mjs';

const root = process.cwd();
const readJson = async p => JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const exists = async p => !!(await fs.stat(path.join(root,p)).catch(()=>null));
const base='content/knowledge/authoring';
const required=[
 `${base}/audits/kau-baseline-audit-v1.json`,`${base}/audits/kau-authority-boundary-v1.json`,`${base}/audits/kau-existing-authoring-reconciliation-v1.json`,
 `${base}/schemas/authoring-source-v1.schema.json`,`${base}/schemas/authoring-manuscript-reference-v1.schema.json`,`${base}/schemas/authoring-extraction-candidate-v1.schema.json`,`${base}/schemas/authoring-node-match-v1.schema.json`,`${base}/schemas/canonical-node-proposal-v1.schema.json`,`${base}/schemas/authoring-supporting-question-v1.schema.json`,`${base}/schemas/section-node-mapping-proposal-v1.schema.json`,
 `${base}/registries/authoring-source-registry-v1.json`,`${base}/registries/authoring-manuscript-registry-v1.json`,`${base}/registries/authoring-section-inventory-v1.json`,`${base}/registries/authoring-extraction-candidate-registry-v1.json`,`${base}/registries/authoring-node-match-registry-v1.json`,`${base}/registries/canonical-node-proposal-registry-v1.json`,`${base}/registries/authoring-supporting-question-mapping-v1.json`,`${base}/registries/section-node-mapping-proposal-registry-v1.json`,`${base}/freeze/kau-w0-w8-authoring-foundation-freeze-v1.json`
];
for (const p of required) assert.equal(await exists(p),true,`KAU_FILE_MISSING:${p}`);

const validateRequired = async (schemaPath, items) => {
  const schema = await readJson(schemaPath);
  for (const item of items) {
    for (const field of schema.required || []) assert.ok(Object.hasOwn(item, field), `${schemaPath}: missing ${field}`);
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(item)) assert.ok(allowed.has(key), `${schemaPath}: unexpected ${key}`);
    }
  }
};
const sources=await readJson(`${base}/registries/authoring-source-registry-v1.json`);
await validateRequired(`${base}/schemas/authoring-source-v1.schema.json`,sources.entries);
const manuscripts=await readJson(`${base}/registries/authoring-manuscript-registry-v1.json`);
await validateRequired(`${base}/schemas/authoring-manuscript-reference-v1.schema.json`,manuscripts.entries);
const candidates=await readJson(`${base}/registries/authoring-extraction-candidate-registry-v1.json`);
await validateRequired(`${base}/schemas/authoring-extraction-candidate-v1.schema.json`,candidates.candidates);
const matches=await readJson(`${base}/registries/authoring-node-match-registry-v1.json`);
await validateRequired(`${base}/schemas/authoring-node-match-v1.schema.json`,matches.matches);
const proposal=await readJson(`${base}/fixtures/canonical-node-proposal.valid.json`);
await validateRequired(`${base}/schemas/canonical-node-proposal-v1.schema.json`,[proposal]);
const sq=await readJson(`${base}/registries/authoring-supporting-question-mapping-v1.json`);
await validateRequired(`${base}/schemas/authoring-supporting-question-v1.schema.json`,sq.entries);
const maps=await readJson(`${base}/registries/section-node-mapping-proposal-registry-v1.json`);
await validateRequired(`${base}/schemas/section-node-mapping-proposal-v1.schema.json`,maps.entries);

const nodes=await readJson('content/knowledge/registry/nodes.json');
const nodeCodes=new Set(nodes.nodes.map(n=>n.nodeCode));
const support=await readJson('content/knowledge/registry/supporting-questions.json');
const sqCodes=new Set(support.supportingQuestions.map(q=>q.questionCode));
for(const candidate of candidates.candidates){ const result=matchExistingNode(candidate,nodeCodes,sqCodes); assert.equal(result.automaticCreationAllowed,false); assert.ok(result.nodeMatches.length>0,'existing mapped candidate must resolve existing node'); }
assert.throws(()=>assertProposalOnly('create_canonical_node'),/KAU_AUTHORITY_BOUNDARY_DENIED/);
assert.equal(assertProposalOnly('create_extraction_candidate'),true);

const inventory=await readJson('content/knowledge/manuscripts/book-1/section-inventory-v2.json');
const legacy=await readJson('content/knowledge/manuscripts/book-1/node-manuscript-mapping.json');
const projected=projectSectionMappings(inventory,legacy);
assert.equal(projected.length,legacy.mappings.length);
assert.ok(projected.every(x=>x.authorityMode==='proposal_only' && x.sectionCode));

const boundary=await readJson(`${base}/audits/kau-authority-boundary-v1.json`);
for(const forbidden of ['create_canonical_node','mutate_nodes_registry','approve_knowledge','publish_article']) assert.ok(boundary.forbidden.includes(forbidden));
const proposals=await readJson(`${base}/registries/canonical-node-proposal-registry-v1.json`);
assert.deepEqual(proposals.productionProposals,[],'No fixture may become a production canonical-node proposal.');
const freeze=await readJson(`${base}/freeze/kau-w0-w8-authoring-foundation-freeze-v1.json`);
assert.equal(freeze.productionStatus,'validation_only');
assert.equal(freeze.boundaries.knowledgeRegistryMutation,false);
assert.equal(freeze.boundaries.automaticCanonicalNodeCreation,false);

console.log('✓ KAU-W0～W8 Authoring Foundation passed.');
console.log('✓ Existing manuscript, section, node and supporting-question authorities are reused instead of rebuilt.');
console.log('✓ Extraction, matching, node proposals and section mappings remain proposal-only and human-governed.');
console.log('✓ KAU cannot create Canonical Nodes, mutate Knowledge Authority, approve knowledge or publish articles.');
