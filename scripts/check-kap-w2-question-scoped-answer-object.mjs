import assert from 'node:assert/strict';
import {BASELINE,ROOT,readJson} from './lib/knowledge-answer-projection/kap-foundation-v1.mjs';
const c=readJson(`${ROOT}/contracts/kap-w2-question-scoped-answer-contract-v1.json`); const s=readJson(`${ROOT}/schemas/question-scoped-knowledge-answer-v1.schema.json`); const f=readJson(`${ROOT}/fixtures/question-scoped-knowledge-answer.foundation.valid.json`);
assert.equal(c.step,'KAP-W2'); assert.equal(c.baselineCommit,BASELINE); assert.equal(c.status,'FOUNDATION_CONTRACT_FROZEN_NO_RUNTIME_ACTIVATION');
assert.equal(c.objectType,'QuestionScopedKnowledgeAnswer'); assert.equal(c.semantics.nonAuthoritative,true); assert.equal(c.semantics.notPublication,true); assert.equal(c.semantics.notRealityReading,true); assert.equal(c.semantics.doesNotCreatePersistentCase,true);
assert.equal(s.properties.authorityClass.const,'QUESTION_SCOPED_NON_AUTHORITATIVE_PROJECTION'); assert.equal(s.properties.governance.properties.publicationStatus.const,'NOT_PUBLICATION'); assert.equal(s.properties.governance.properties.canonicalAuthorityStatus.const,'NONE'); assert.equal(s.properties.governance.properties.realityReadingStatus.const,'NOT_REALITY_READING');
assert.equal(f.authorityClass,'QUESTION_SCOPED_NON_AUTHORITATIVE_PROJECTION'); assert.deepEqual(f.governance,c.requiredGovernanceConstants); assert.equal(f.lifecycle.persistentCaseCreated,false); assert.equal(f.generation.generativeModelUsed,false);
for(const v of Object.values(c.runtimeActivation)) assert.equal(v,false);
console.log('✓ KAP-W2 QuestionScopedKnowledgeAnswer foundation contract passed.');
