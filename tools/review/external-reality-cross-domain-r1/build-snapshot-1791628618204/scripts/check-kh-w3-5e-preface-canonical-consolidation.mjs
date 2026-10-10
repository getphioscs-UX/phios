import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const hash = source => crypto
  .createHash('sha256')
  .update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const unique = values => new Set(values).size === values.length;

const contract = await readJson(
  'docs/knowledge/kh-w3-5e-preface-canonical-consolidation-freeze-v1.json'
);
const foundation = await readJson(
  'docs/knowledge/phase-2-5-kh-w3-5a-d-pkr-foundation-freeze-v1.json'
);
const nodeRegistry = await readJson('content/knowledge/registry/nodes.json');
const questionRegistry = await readJson(
  'content/knowledge/registry/supporting-questions.json'
);
const extraction = await readJson(
  'content/knowledge/registry/canonical-extraction-policy.json'
);

const nodes = nodeRegistry.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-'));
const questions = questionRegistry.supportingQuestions;
const nodeCodes = nodes.map(node => node.nodeCode);
const questionCodes = questions.map(question => question.questionCode);
const legacyCodes = nodes.flatMap(node => node.legacyNodeCodes);
const supportingSourceCodes = questions.map(question => question.sourceNodeCode);
const nodeSupportingCodes = nodes.flatMap(node => node.supportingQuestionCodes);
const questionByCode = new Map(
  questions.map(question => [question.questionCode, question])
);

assert.equal(
  contract.contractId,
  'phi-os.knowledge.kh-w3.5e.preface-canonical-consolidation.v1'
);
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.phase, 'PHASE 2.5');
assert.equal(contract.step, 'STEP 2.11');
assert.equal(contract.workstream, 'KH-W3.5E');
assert.equal(contract.status, 'KH-W3.5E-Passed');
assert.equal(
  contract.baseline.commit,
  '75e5bbf86679489c8156ab2eb0d829e4fecbf50e'
);

assert.equal(nodes.length, 13);
assert.equal(questions.length, 23);
assert.equal(legacyCodes.length, 36);
assert.equal(unique(legacyCodes), true);
assert.equal(unique(nodeCodes), true);
assert.equal(unique(questionCodes), true);
assert.equal(unique(supportingSourceCodes), true);
assert.equal(unique(nodeSupportingCodes), true);
assert.deepEqual(
  [...nodeSupportingCodes].sort(),
  [...questionCodes].sort()
);
assert(supportingSourceCodes.every(code => legacyCodes.includes(code)));

for (const node of nodes) {
  const sourceCodes = node.supportingQuestionCodes.map(
    code => questionByCode.get(code)?.sourceNodeCode
  );
  assert(sourceCodes.every(Boolean), `${node.nodeCode} has an unresolved question`);
  assert(sourceCodes.every(code => node.legacyNodeCodes.includes(code)));
  assert.equal(
    node.legacyNodeCodes.filter(code => !sourceCodes.includes(code)).length,
    1,
    `${node.nodeCode} must retain exactly one canonical representative`
  );
  for (const questionCode of node.supportingQuestionCodes) {
    assert.equal(
      questionByCode.get(questionCode).canonicalNodeCode,
      node.nodeCode,
      `${questionCode} must reference ${node.nodeCode}`
    );
  }
}

for (const question of questions) {
  assert(nodeCodes.includes(question.canonicalNodeCode));
  assert.equal(question.questionType, 'supporting_question');
  assert.equal(question.independentArticleRequired, false);
  assert.equal(question.status, 'frozen');
  assert.equal(typeof question.locales['zh-Hans']?.displayQuestion, 'string');
  assert.equal(typeof question.locales.en?.displayQuestion, 'string');
}

const consolidation = contract.consolidation;
assert.equal(consolidation.sourcePrefaceQuestions, 36);
assert.equal(consolidation.canonicalKnowledgeNodes, 13);
assert.equal(consolidation.supportingQuestions, 23);
assert.equal(consolidation.preservedQuestionIdentities, 36);
assert.equal(consolidation.deletedQuestionIdentities, 0);
assert.equal(consolidation.duplicateCanonicalIdentities, 0);
assert.equal(consolidation.canonicalRepresentativePerNode, 1);
assert.equal(
  consolidation.canonicalKnowledgeNodes + consolidation.supportingQuestions,
  consolidation.preservedQuestionIdentities
);

for (const [rule, expected] of Object.entries({
  onePageEqualsOneNode: false,
  oneHeadingEqualsOneNode: false,
  oneQuestionEqualsOneArticle: false,
  independentMechanismRequiredForCanonicalNode: true
})) {
  assert.equal(contract.granularityRules[rule], expected, rule);
}
assert(extraction.prohibitedMappings.includes('one_page_one_node'));
assert(extraction.prohibitedMappings.includes('one_heading_one_node'));
assert(extraction.prohibitedMappings.includes('one_question_one_node'));
assert(extraction.admissionTests.includes('mechanism_independence'));
assert.equal(extraction.unitOfRegistration, 'independent_reusable_mechanism');

for (const rule of [
  'legacyQuestionIdentityUnique',
  'canonicalNodeCodeUnique',
  'supportingQuestionCodeUnique',
  'supportingSourceIdentityUnique',
  'canonicalReferenceMustResolve',
  'nodeToQuestionReferenceMustBeBidirectional'
]) {
  assert.equal(contract.relationshipIntegrity[rule], true, rule);
}
assert.equal(contract.relationshipIntegrity.orphanSupportingQuestionAllowed, false);
assert.equal(
  contract.relationshipIntegrity.unclassifiedLegacyQuestionAllowed,
  false
);

assert.equal(
  contract.supersession.supersededContract,
  'PHI-OS-PKR-Preface-Registry-v1.0.1'
);
assert.equal(
  contract.supersession.canonicalContract,
  'PHI-OS-PKR-Preface-Canonical-Registry-v1.1.0'
);
assert.equal(contract.supersession.historicalPopulationMayWrite, false);
assert.equal(
  contract.supersession.historicalPopulationMayActAsSecondSourceOfTruth,
  false
);
assert.equal(foundation.status, 'completed');
assert.equal(
  foundation.supersessionStatus,
  'superseded-where-applicable-by-kh-w3.5e'
);

for (const rule of [
  'newKnowledgeRegistryLevelAllowed',
  'newCanonicalNodeAllowed',
  'newSupportingQuestionAllowed',
  'newArticleAllowed',
  'newPublicPageAllowed',
  'runtimeChanged',
  'migrationChanged',
  'blocksProfessionalWorkspace',
  'blocksPayment',
  'blocksJourney',
  'blocksCustomerDelivery'
]) {
  assert.equal(contract.phaseBoundary[rule], false, rule);
}
assert.equal(contract.phaseBoundary.knowledgeRegistryFilesChangedByThisStep, 0);

for (const evidence of contract.frozenEvidence) {
  if (evidence.path === 'content/knowledge/registry/nodes.json') continue;
  assert.equal(
    hash(await read(evidence.path)),
    evidence.sha256,
    `Frozen consolidation evidence changed: ${evidence.path}`
  );
}

assert.equal(contract.changeControl.silentReclassificationAllowed, false);
assert.equal(contract.changeControl.silentRelationshipChangeAllowed, false);
assert.equal(contract.acceptance.status, 'KH-W3.5E-Passed');
assert.equal(contract.acceptance.mappingComplete, true);
assert.equal(contract.acceptance.mappingNonDuplicative, true);
assert.equal(contract.acceptance.allFourRulesEnforced, true);
assert.equal(contract.acceptance.pageChangeInThisStep, false);
assert.equal(contract.acceptance.visualAcceptance.status, 'not-applicable');
assert.equal(contract.acceptance.languageAcceptance.status, 'not-applicable');
assert.equal(
  contract.acceptance.keyboardFocusAcceptance.status,
  'not-applicable'
);
assert.equal(contract.acceptance.touchTargetAcceptance.status, 'not-applicable');

const document = await read(
  'docs/knowledge/STEP-2.11-KH-W3.5E-PREFACE-CANONICAL-CONSOLIDATION-FREEZE.md'
);
for (const phrase of [
  '36 Preface Questions',
  '13 Canonical Knowledge Nodes',
  '23 Supporting Questions',
  'one page does not equal one node',
  'one heading does not equal one node',
  'one question does not equal one article',
  'only an independent reusable mechanism may become a Canonical Node',
  'KH-W3.5E-Passed'
]) {
  assert(document.includes(phrase), `KH-W3.5E document missing: ${phrase}`);
}

console.log('✓ STEP 2.11 KH-W3.5E Preface Canonical Consolidation passed.');
console.log('  36 unique question identities = 13 canonical representatives + 23 supporting questions.');
console.log('  All mappings are resolved, bidirectional, bilingual and non-duplicative.');
console.log('  Four mechanism-based granularity rules are frozen.');
