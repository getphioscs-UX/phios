import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const paths = {
  audit: 'content/professional/canonical-meaning-runtime/audits/cmr-baseline-audit-v1.json',
  boundary: 'content/professional/canonical-meaning-runtime/audits/cmr-authority-boundary-v1.json',
  freeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w0-freeze-v1.json'
};
const [audit,boundary,freeze] = await Promise.all(Object.values(paths).map(readJson));
assert.equal(audit.work,'CM-W0');
assert.equal(audit.baselineCommit,'8f7a5b41d36ecc3e1b25ab1dbad2f8e19a87e8e2');
assert.ok(audit.sourceSystems.length >= 19);
for (const record of audit.sourceSystems) {
  assert.equal(record.exists,true,`${record.path} missing`);
  assert.equal(await sha(record.path),record.sha256,`${record.path} changed after audit`);
}
assert.equal(boundary.invariants.khW4G6SemanticRuntimeFreezeModified,false);
assert.equal(boundary.invariants.methodRuntimeFreezeModified,false);
assert.equal(boundary.invariants.duplicateSourceOfTruthCreated,false);
assert.equal(boundary.invariants.canonicalMeaningMayRewriteKnowledge,false);
assert.equal(boundary.invariants.canonicalMeaningMayRewriteMethodProjection,false);
assert.equal(boundary.invariants.providerAllowed,false);
assert.equal(boundary.invariants.aiAllowed,false);
assert.equal(boundary.invariants.promptAllowed,false);
assert.ok(boundary.separations.some(x=>x.left==='Knowledge Semantic Authority'&&x.operator==='!='&&x.right==='Canonical Meaning Authority'));
assert.equal(freeze.status,'frozen');
assert.equal(freeze.work,'CM-W0');
for (const output of freeze.outputs) assert.equal(await sha(output),freeze.digests[output]);
assert.equal(freeze.invariants.knowledgeSemanticFreezeUnchanged,true);
assert.equal(freeze.invariants.methodRuntimeFreezesUnchanged,true);
assert.equal(freeze.invariants.duplicateSourceOfTruth,false);
console.log('✓ CM-W0 Cross-System Baseline Audit passed.');
console.log('✓ Knowledge Semantic Authority remains separate from Canonical Meaning Authority.');
console.log('✓ KH-W4G.6 Semantic Runtime Freeze and Method Runtime freezes remain unchanged.');
console.log('✓ No duplicate Source of Truth, Provider, AI or Prompt authority was created.');
