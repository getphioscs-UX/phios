import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { C3_CONTRACT, C3_INDEX, C3_SUMMARY, resolveProductionReadiness, validateProductionReadiness } from './lib/knowledge-readiness/universal-production-readiness.mjs';

const root = process.cwd(), read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const pkg = read('package.json');
assert.equal(pkg.scripts['check:pja-w2f-c3'], 'npm run check:pja-w2f-c2 && node scripts/check-pja-w2f-c3-universal-production-readiness.mjs');
assert.equal(pkg.scripts['knowledge:assess-production-readiness'], 'node scripts/assess-book-i-production-readiness.mjs');
assert.equal(pkg.scripts['knowledge:apply-production-readiness'], 'node scripts/apply-book-i-production-readiness.mjs');
assert.equal(pkg.scripts['knowledge:validate-production-readiness'], 'node scripts/validate-book-i-production-readiness.mjs');

const registry = read('content/knowledge/registry/nodes.json');
const c1 = read('content/knowledge/readiness/canonical-readiness-index.json');
const c2 = read('content/knowledge/editorial/c2/canonical-thesis-boundary-index.json');
const contract = read(C3_CONTRACT), index = read(C3_INDEX), summary = read(C3_SUMMARY);
const nodeCount = c1.entries.length;
assert.equal(c2.entries.length, nodeCount); assert.equal(index.entries.length, nodeCount);
assert.equal(new Set(index.entries.map(entry => entry.nodeCode)).size, nodeCount);
assert.deepEqual(new Set(index.entries.map(entry => entry.nodeCode)), new Set(c1.entries.map(entry => entry.nodeCode)));
assert(c1.entries.every(entry => registry.nodes.some(node => node.nodeCode === entry.nodeCode)));
assert.equal(contract.systemStatus, 'frozen'); assert.equal(contract.freezeLabel, 'PJA-W2F-C3-v1.0.0-Frozen');
assert.deepEqual(contract.states, ['not_assessed', 'blocked_by_c2', 'editorial_review_required', 'human_approval_required', 'production_blocked', 'production_ready', 'conflicted']);
assert.equal(summary.assessed, nodeCount); assert.equal(summary.c2Frozen, c2.entries.filter(entry => entry.status === 'frozen').length);
assert.equal(summary.c2Blocked, c2.entries.filter(entry => entry.status !== 'frozen').length);
assert.equal(summary.productionReady, index.entries.filter(entry => entry.productionReady).length);
assert.equal(summary.productionBlocked, index.entries.filter(entry => !entry.productionReady).length);
assert.equal(summary.humanProductionDecisionEligible, index.entries.filter(entry => entry.humanProductionDecisionEligible).length);
assert.equal(summary.exportGenerated, false); assert.equal(summary.published, false);

for (const entry of index.entries) {
  const assessment = read(entry.assessmentFile);
  assert.equal(assessment.effects.articleGenerated, false); assert.equal(assessment.effects.productionExportGenerated, false); assert.equal(assessment.effects.published, false);
  assert.equal(assessment.publicationState, 'not_published');
  if (assessment.productionReady) {
    assert.equal(assessment.status, 'production_ready'); assert.equal(assessment.exportability, 'allowed');
    for (const gate of contract.requiredGates) assert.equal(assessment.gates[gate].status, 'passed', `${entry.nodeCode}:${gate}`);
    assert(assessment.authority.c2FreezeRecord); assert.equal(assessment.authority.c2FreezeHashMatched, true);
  } else assert.equal(assessment.exportability, 'blocked');
}

const frozenC2 = c2.entries.filter(entry => entry.status === 'frozen');
for (const c2Entry of frozenC2) {
  const result = resolveProductionReadiness(root, c2Entry.nodeCode), assessment = read(result.assessmentFile);
  assert.equal(assessment.gates.c2FrozenThesisBoundary.status, 'passed');
  if (assessment.productionReady) {
    assert.equal(assessment.gates.humanProductionApproval.status, 'passed'); assert.equal(assessment.gates.exportability.status, 'passed');
  } else {
    assert.equal(assessment.gates.humanProductionApproval.status, 'failed'); assert.equal(assessment.gates.exportability.status, 'failed');
  }
}
for (const c2Entry of c2.entries.filter(entry => entry.status !== 'frozen')) assert.equal(resolveProductionReadiness(root, c2Entry.nodeCode).status, 'blocked_by_c2');

const wave1 = ['KN-PREFACE-004','KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004'];
for (const code of wave1) {
  const assessment = read(`content/knowledge/editorial/c3/assessments/${code.toLowerCase()}-production-readiness.json`);
  assert.equal(assessment.status, 'production_ready'); assert.equal(assessment.productionReady, true); assert.equal(assessment.humanProductionDecisionEligible, false);
  for (const gate of Object.values(assessment.gates)) assert.equal(gate.status, 'passed', code);
  assert.deepEqual(assessment.blocking, []);
  assert.equal(assessment.authority.humanEditorialApproved, true);
  assert.equal(assessment.authority.editorialRecord, 'content/knowledge/production-planning/review/wave1-c2-human-editorial-freeze-resolution-v1.json');
  assert.equal(assessment.authority.wave1C3ClosureRecord, 'content/knowledge/editorial/c3/closures/wave1-c3-readiness-closure-v1.json');
  assert.equal(assessment.authority.humanProductionDecisionEligible, false);
  assert.equal(assessment.authority.humanProductionApproved, true);
  assert.equal(assessment.authority.humanProductionDecisionRecord, 'content/knowledge/production-planning/production/wave1/human-production-decision-v1.json');
  assert.equal(assessment.authority.c3HumanProductionApprovalRecord, 'content/knowledge/editorial/c3/closures/wave1-human-production-approval-v1.json');
}
const preface = read('content/knowledge/editorial/c3/assessments/kn-preface-004-production-readiness.json');
assert.equal(preface.authority.wave1FigureDecisionState, 'passed');
assert.equal(preface.authority.existingPublicationReconciliation, 'EXISTING_PUBLISHED_CONTENT_RECONCILED_NO_NEW_PUBLICATION');
assert.deepEqual(preface.authority.existingPublishedContentReferences, ['KA-PREFACE-004-ZH-ARTICLE','KA-PREFACE-004-EN-ARTICLE']);
for (const code of ['KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004']) {
  const assessment = read(`content/knowledge/editorial/c3/assessments/${code.toLowerCase()}-production-readiness.json`);
  assert.equal(assessment.authority.wave1SourceClosureState, 'passed');
}

assert.throws(() => resolveProductionReadiness(root, 'KN-NOT-REGISTERED-999'), error => error.code === 'NODE_NOT_FOUND');
assert.equal(validateProductionReadiness(root).valid, true);
const dry = run('scripts/assess-book-i-production-readiness.mjs'); assert.equal(dry.status, 0, dry.stderr); const dryReport = parse(dry.stdout); assert.equal(dryReport.create, 0); assert.equal(dryReport.update, 0); assert.deepEqual(dryReport.filesThatWouldChange, []);
const explicitDry = run('scripts/assess-book-i-production-readiness.mjs', '--dry-run'); assert.equal(explicitDry.status, 0, explicitDry.stderr);
const apply = run('scripts/apply-book-i-production-readiness.mjs'); assert.equal(apply.status, 0, apply.stderr); assert(apply.stdout.includes('apply no-op'));

const negativeGuards = [
  () => reject(contract.approvalBoundary.c2FreezeIsProductionApproval), () => reject(contract.exportBoundary.generatesExport), () => reject(contract.exportBoundary.publishes),
  () => reject(index.entries.length !== nodeCount), () => reject(new Set(index.entries.map(entry => entry.nodeCode)).size !== nodeCount),
  () => reject(summary.productionReady + summary.productionBlocked !== nodeCount), () => reject(summary.c2Frozen + summary.c2Blocked !== nodeCount),
  () => reject(index.entries.some(entry => entry.productionReady && entry.exportability !== 'allowed')), () => reject(index.entries.some(entry => entry.productionReady && entry.blocking.length > 0)),
  () => reject(index.entries.some(entry => entry.status === 'blocked_by_c2' && entry.productionReady)), () => reject(frozenC2.some(entry => !entry.freezeRecord)),
  () => reject(frozenC2.some(entry => read(entry.record).contentHash !== read(entry.freezeRecord).contentHash)), () => reject(contract.approvalBoundary.forbiddenApprovers.includes('TL')),
  () => reject(!contract.approvalBoundary.forbiddenApprovers.includes('AI')), () => reject(!contract.approvalBoundary.distinctProductionApprovalRequired),
  () => reject(summary.exportGenerated), () => reject(summary.published), () => reject(index.entries.some(entry => read(entry.assessmentFile).effects.productionExportGenerated))
];
for (const guard of negativeGuards) assert.throws(guard, /NEGATIVE_FIXTURE_REJECTED/);
console.log('✓ PJA-W2F-C3 Universal Production Readiness rebuilt after Wave 1 C2 Human Freeze.');
console.log(`✓ ${nodeCount} assessed; ${summary.c2Frozen} C2 frozen; ${summary.c2Blocked} blocked by C2; ${summary.productionReady} production ready; ${summary.productionBlocked} production blocked.`);
console.log('✓ Wave 1 Human Production Decision is reconciled; 4/4 items are production_ready and exportable for governed production brief generation.');
console.log('✓ Existing KN-PREFACE-004 publication is explicitly reconciled without creating a new publication.');
function reject(condition){if(!condition)throw new Error('NEGATIVE_FIXTURE_REJECTED');}
function run(script,...args){return spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'});}
function parse(value){return JSON.parse(value.slice(value.indexOf('{'),value.lastIndexOf('}')+1));}
