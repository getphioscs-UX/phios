import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);
const root = 'content/client/knowledge-ask';

const projections = [
  ['contracts/cka-entry-contract-v1.json','contracts/cka-w0-ask-entry-contract-v1.json','CKA-W0','ASK_ENTRY'],
  ['contracts/cka-question-composer-contract-v1.json','contracts/cka-w1-question-composer-contract-v1.json','CKA-W1','QUESTION_COMPOSER'],
  ['contracts/cka-answer-surface-contract-v1.json','contracts/cka-w2-answer-surface-contract-v1.json','CKA-W2','ANSWER_SURFACE'],
  ['contracts/cka-knowledge-card-contract-v1.json','contracts/cka-w3-knowledge-card-contract-v1.json','CKA-W3','KNOWLEDGE_CARD'],
  ['contracts/cka-follow-up-contract-v1.json','contracts/cka-w4-follow-up-contract-v1.json','CKA-W4','FOLLOW_UP'],
  ['contracts/cka-guided-context-contract-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W5','GUIDED_CONTEXT'],
  ['contracts/cka-account-boundary-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W7','ACCOUNT_BOUNDARY'],
  ['contracts/cka-retrieval-contract-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W8','RETRIEVAL_PIPELINE'],
  ['contracts/cka-grounded-answer-binding-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W9','GROUNDED_ANSWER_BINDING'],
  ['contracts/cka-answer-state-model-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W10','ANSWER_STATE_MODEL'],
  ['contracts/cka-external-authority-handoff-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W11','CURRENT_EXTERNAL_AUTHORITY_AND_PROFESSIONAL_BOUNDARY'],
  ['contracts/cka-method-boundary-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W12','METHOD_BOUNDARY'],
  ['contracts/cka-reality-context-boundary-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W13','REALITY_CONTEXT_BOUNDARY'],
  ['contracts/cka-related-knowledge-contract-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W14','RELATED_KNOWLEDGE'],
  ['contracts/cka-contextual-entry-contract-v1.json','contracts/cka-w5-w17-batch-b-contract-v1.json','CKA-W15','CONTEXTUAL_ASK'],
  ['acceptance/cka-privacy-acceptance-v1.json','contracts/cka-w18-w33-client-consumption-contract-v1.json','CKA-W25','PRIVACY_ACCEPTANCE'],
  ['acceptance/cka-entitlement-acceptance-v1.json','contracts/cka-w18-w33-client-consumption-contract-v1.json','CKA-W26','ENTITLEMENT_ACCEPTANCE']
];

for (const [relative, sourceRelative, work, capability] of projections) {
  const p = `${root}/${relative}`;
  const sourcePath = `${root}/${sourceRelative}`;
  assert.ok(exists(p), `Missing canonical CKA projection: ${p}`);
  assert.ok(exists(sourcePath), `Missing source authority: ${sourcePath}`);
  const projection = read(p);
  const source = read(sourcePath);
  assert.equal(projection.canonicalFile, path.basename(p));
  assert.equal(projection.projectionOnly, true);
  assert.equal(projection.sourceAuthority.path, sourcePath);
  assert.equal(projection.sourceAuthority.work, work);
  assert.equal(projection.sourceAuthority.capability, capability);
  assert.equal(projection.authorityBoundary.sourceAuthorityRemainsCanonical, true);
  assert.equal(projection.authorityBoundary.mutatesSourceAuthority, false);
  assert.equal(projection.authorityBoundary.futureSemanticChangeRequiresVersionedSourceSuccessor, true);

  if (Array.isArray(source.works)) {
    const sourceWork = source.works.find(item => item.work === work);
    assert.ok(sourceWork, `${p}: source work ${work} missing`);
    assert.equal(sourceWork.capability, capability, `${p}: source capability drift`);
  } else {
    assert.equal(source.work, work, `${p}: direct source work drift`);
  }
}

const rjx = `${root}/contracts/cka-rjx-handoff-contract-v1.json`;
const production = `${root}/acceptance/cka-production-acceptance-v1.json`;
assert.ok(exists(rjx));
assert.ok(exists(production));
const rjxContract = read(rjx);
const productionAcceptance = read(production);
assert.equal(rjxContract.governance.preCreatedRealityTruth, false);
assert.equal(rjxContract.governance.canonicalRealityCreated, false);
assert.equal(productionAcceptance.status, 'CKA_PRODUCTION_READY');
assert.equal(productionAcceptance.globalProductionAccepted, false);

console.log('✓ PART G CKA canonical contract projections passed: 17 compatibility projections + existing RJX handoff + production acceptance = 19/19 required CKA files.');
console.log('  Existing W0–W33 authority remains canonical; no second answer, retrieval, Reality, Method, privacy or entitlement authority was created.');
