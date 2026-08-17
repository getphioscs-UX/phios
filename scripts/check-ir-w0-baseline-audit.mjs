import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const auditPath = 'content/interpretation/audit/interpretation-runtime-baseline-audit-v1.json';
const overlapPath = 'content/interpretation/audit/interpretation-runtime-authority-overlap-v1.json';
assert.ok(fs.existsSync(auditPath));
assert.ok(fs.existsSync(overlapPath));
const audit = readJson(auditPath);
const overlap = readJson(overlapPath);
assert.equal(audit.status, 'FROZEN_BASELINE_RECONCILED');
assert.equal(audit.sharedInterpretationRuntimeFinding.authority, 'candidate_only');
assert.equal(audit.sharedInterpretationRuntimeFinding.actualAuthority.derivationAuthority, false);
assert.equal(audit.sharedInterpretationRuntimeFinding.actualAuthority.meaningAuthority, false);
assert.equal(audit.sharedInterpretationRuntimeFinding.actualAuthority.compositionAuthority, true);
assert.equal(audit.canonicalInterpretationDerivationFinding.status, 'RESERVED_SINGLETON_UNINSTANTIATED');
assert.equal(audit.canonicalInterpretationDerivationFinding.runtimeCreatedByMir1, false);
assert.equal(audit.canonicalInterpretationDerivationFinding.singleAuthoritySlotOnly, true);
assert.equal(audit.auditConclusions.duplicateInterpretationRuntimeExists, false);
assert.equal(audit.auditConclusions.duplicateMeaningRuntimeExists, false);
assert.equal(overlap.status, 'NO_UNRESOLVED_DUPLICATE_AUTHORITY');
for (const [name, evidence] of Object.entries(audit.sourceEvidence)) {
  assert.ok(fs.existsSync(evidence.path), `${name}: missing ${evidence.path}`);
  assert.equal(sha(evidence.path), evidence.sha256, `${name}: predecessor byte drift`);
}
const shared = readJson('content/professional/method-runtime/shared-interpretation-runtime-v1.json');
assert.equal(shared.authority, 'candidate_only');
assert.equal(shared.output, 'Interpretation Candidate');
console.log('✓ IR-W0 baseline audit passed: existing Shared Interpretation is candidate-only composition; canonical derivation remains one uninstantiated singleton slot.');
