import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const W33 = 'scripts/check-alr-w33-w35-access.mjs';
const W42 = 'scripts/check-alr-w42-w46-governance-production-freeze.mjs';
const RECON = 'docs/alr/reconciliation/alr-post-freeze-checker-reconciliation-v1.json';

const FROZEN_W33 = 'f2992f64f4d723b3c3c0da760dc8dddd738a4928f7b7db1985079b5a3cfc1c8d';
const SUCCESSOR_W33 = 'd38c77ffdcc60f97d5b292ae8fcb2c4e953f7dde01d961c234eb93fbe81324c4';
const FROZEN_W42 = '820507dedaf75f7c1f46f4de092ce344943d240d0beecc48fb66a6a2d2104144';

const readText = file => fs.readFileSync(path.join(root, file), 'utf8');
const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digestSource = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
const digestFile = file => digestSource(readText(file));
const writeText = (file, source) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, normalize(source), 'utf8');
};

for (const file of [W33, W42, 'content/academy/academy-learning-runtime/registries/alr-checker-alias-registry-v1.json']) {
  assert.ok(fs.existsSync(path.join(root, file)), `MISSING:${file}`);
}

// 1) Reconcile W33 by removing only the stale cross-runtime VAP tail assertion.
// If the user already applied the change, preserve it exactly.
let w33 = normalize(readText(W33));
let w33Digest = digestSource(w33);

if (w33Digest === FROZEN_W33) {
  const start = w33.indexOf('const vapTail = pkg.scripts.postcheck.match(');
  const endMarker = "console.log('✓ ALR-W33～W35 Access passed.');";
  const end = w33.indexOf(endMarker);

  assert.ok(start >= 0, 'W33_STALE_VAP_TAIL_BLOCK_NOT_FOUND');
  assert.ok(end > start, 'W33_COMPLETION_MARKER_NOT_FOUND');

  w33 = w33.slice(0, start).trimEnd() + '\n\n' + w33.slice(end);
  writeText(W33, w33);
  w33Digest = digestFile(W33);
}

assert.equal(
  w33Digest,
  SUCCESSOR_W33,
  `W33_SUCCESSOR_DIGEST_UNEXPECTED:${w33Digest}`
);

// 2) Patch W42/W46 checker itself:
//    a) make frozen digest verification reconciliation-aware;
//    b) remove its own stale VAP-tail ownership assertion.
let w42 = normalize(readText(W42));
const initialW42Digest = digestSource(w42);

assert.ok(
  initialW42Digest === FROZEN_W42 || w42.includes('ALR_POST_FREEZE_CHECKER_RECONCILIATION'),
  `W42_BASELINE_DIGEST_UNEXPECTED:${initialW42Digest}`
);

if (!w42.includes('ALR_POST_FREEZE_CHECKER_RECONCILIATION')) {
  const oldLoop = `for (const entry of context.alrCheckerAliasRegistry.entries) {
  await fs.access(path.join(root, entry.implementationFile));
  assert.equal(await digest(entry.implementationFile), entry.implementationDigest,
    \`\${entry.workCode} checker digest\`);
}`;

  const newLoop = `const checkerReconciliation = await read(
  'docs/alr/reconciliation/alr-post-freeze-checker-reconciliation-v1.json'
);
assert.equal(
  checkerReconciliation.reconciliationCode,
  'PHI-OS-ALR-POST-FREEZE-CHECKER-RECONCILIATION-v1',
  'ALR_POST_FREEZE_CHECKER_RECONCILIATION'
);
assert.equal(checkerReconciliation.status, 'ACCEPTED_SUCCESSOR_RECONCILIATION');
assert.equal(checkerReconciliation.frozenAliasRegistryRewritten, false);
assert.equal(checkerReconciliation.authorityExpansionGranted, false);

for (const entry of context.alrCheckerAliasRegistry.entries) {
  await fs.access(path.join(root, entry.implementationFile));
  const actualDigest = await digest(entry.implementationFile);
  if (actualDigest === entry.implementationDigest) continue;

  const successor = checkerReconciliation.entries.find(item =>
    item.implementationFile === entry.implementationFile
  );

  assert.ok(successor, \`\${entry.workCode} checker digest\`);
  assert.equal(successor.frozenDigest, entry.implementationDigest,
    \`\${entry.workCode} frozen checker digest\`);
  assert.equal(actualDigest, successor.successorDigest,
    \`\${entry.workCode} successor checker digest\`);
  assert.equal(successor.authorityExpansionGranted, false);
  assert.equal(successor.runtimeSemanticAuthorityChanged, false);
}`;

  assert.ok(w42.includes(oldLoop), 'W42_DIGEST_LOOP_ANCHOR_NOT_FOUND');
  w42 = w42.replace(oldLoop, newLoop);

  const vapStart = w42.indexOf('const vapTail = postcheck.match(');
  const freezeStart = w42.indexOf("const freeze = await read(`${base}/freeze/alr-v2-freeze-v1.json`);");

  assert.ok(vapStart >= 0, 'W42_STALE_VAP_TAIL_BLOCK_NOT_FOUND');
  assert.ok(freezeStart > vapStart, 'W42_FREEZE_ANCHOR_NOT_FOUND');

  w42 = w42.slice(0, vapStart).trimEnd() + '\n\n' + w42.slice(freezeStart);
  writeText(W42, w42);
}

const successorW42Digest = digestFile(W42);

// 3) Write explicit post-freeze successor reconciliation.
// The original ALR alias registry and ALR freeze remain untouched.
const reconciliation = {
  reconciliationCode: 'PHI-OS-ALR-POST-FREEZE-CHECKER-RECONCILIATION-v1',
  reconciliationVersion: '1.0.0',
  status: 'ACCEPTED_SUCCESSOR_RECONCILIATION',
  baselineCommit: '3dd903344945ecd3b585c8aafe48b93d7894caa9',
  purpose:
    'Accept narrowly scoped post-freeze checker successors after removal of stale cross-runtime postcheck tail ownership assertions without reopening ALR runtime semantics, authority, registries, or freeze.',
  frozenAliasRegistry:
    'content/academy/academy-learning-runtime/registries/alr-checker-alias-registry-v1.json',
  frozenAliasRegistryRewritten: false,
  alrFreezeRewritten: false,
  authorityExpansionGranted: false,
  entries: [
    {
      implementationFile: W33,
      affectedWorks: ['ALR-W33', 'ALR-W34', 'ALR-W35'],
      frozenDigest: FROZEN_W33,
      successorDigest: w33Digest,
      changeScope: 'REMOVE_STALE_CROSS_RUNTIME_POSTCHECK_VAP_TAIL_ASSERTION_ONLY',
      runtimeSemanticAuthorityChanged: false,
      academyAccessSemanticsChanged: false,
      entitlementAuthorityChanged: false,
      professionalBoundaryChanged: false,
      authorityExpansionGranted: false
    },
    {
      implementationFile: W42,
      affectedWorks: ['ALR-W42', 'ALR-W43', 'ALR-W44', 'ALR-W45', 'ALR-W46'],
      frozenDigest: FROZEN_W42,
      successorDigest: successorW42Digest,
      changeScope:
        'ADD_POST_FREEZE_CHECKER_SUCCESSOR_RECONCILIATION_AND_REMOVE_STALE_CROSS_RUNTIME_POSTCHECK_VAP_TAIL_ASSERTION',
      runtimeSemanticAuthorityChanged: false,
      alrGovernanceSemanticsChanged: false,
      freezeDecisionChanged: false,
      authorityExpansionGranted: false
    }
  ],
  rules: {
    frozenAliasRegistryDigestValuesRemainHistoricalAuthority: true,
    successorDigestMustMatchExactFileContent: true,
    onlyListedImplementationFilesMayUseSuccessorDigest: true,
    unlistedCheckerDigestDriftFailsClosed: true,
    futureSuccessorChangeRequiresNewVersionedReconciliation: true,
    alrDoesNotOwnFuturePostcheckTail: true,
    vapRuntimeAuthorityUnchanged: true,
    rreRuntimeAuthorityUnchanged: true,
    mpaRuntimeAuthorityUnchanged: true
  }
};

writeText(RECON, JSON.stringify(reconciliation, null, 2) + '\n');

// 4) Final local invariants.
const aliasRegistry = JSON.parse(readText(
  'content/academy/academy-learning-runtime/registries/alr-checker-alias-registry-v1.json'
));
const w33Entries = aliasRegistry.entries.filter(item =>
  ['ALR-W33', 'ALR-W34', 'ALR-W35'].includes(item.workCode)
);
const w42Entries = aliasRegistry.entries.filter(item =>
  ['ALR-W42', 'ALR-W43', 'ALR-W44', 'ALR-W45', 'ALR-W46'].includes(item.workCode)
);

assert.ok(w33Entries.every(item => item.implementationDigest === FROZEN_W33));
assert.ok(w42Entries.every(item => item.implementationDigest === FROZEN_W42));
assert.equal(digestFile(W33), w33Digest);
assert.equal(digestFile(W42), successorW42Digest);

console.log('✓ ALR post-freeze checker reconciliation applied.');
console.log(`✓ W33 successor digest: ${w33Digest}`);
console.log(`✓ W42-W46 successor digest: ${successorW42Digest}`);
console.log('✓ Frozen ALR alias registry was not rewritten.');
console.log('✓ ALR runtime/access/governance authority was not expanded.');
console.log('');
console.log('Next:');
console.log('  npm run check:alr-w33-w35');
console.log('  npm run check:alr-w42-w46');
console.log('  npm run check:alr');
console.log('  npm run check');
