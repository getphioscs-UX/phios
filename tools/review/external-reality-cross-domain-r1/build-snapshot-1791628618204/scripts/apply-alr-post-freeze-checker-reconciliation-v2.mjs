import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const W33 = 'scripts/check-alr-w33-w35-access.mjs';
const W42 = 'scripts/check-alr-w42-w46-governance-production-freeze.mjs';
const V1 = 'docs/alr/reconciliation/alr-post-freeze-checker-reconciliation-v1.json';
const V2 = 'docs/alr/reconciliation/alr-post-freeze-checker-reconciliation-v2.json';

const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const readText = file => normalize(fs.readFileSync(path.join(root, file), 'utf8'));
const digestSource = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
const digestFile = file => digestSource(readText(file));
const writeText = (file, source) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, normalize(source), 'utf8');
};
const readJson = file => JSON.parse(readText(file));

for (const file of [W33, W42, V1, 'package.json']) {
  assert.ok(fs.existsSync(path.join(root, file)), `MISSING:${file}`);
}

const v1 = readJson(V1);
assert.equal(v1.reconciliationCode, 'PHI-OS-ALR-POST-FREEZE-CHECKER-RECONCILIATION-v1');
assert.equal(v1.status, 'ACCEPTED_SUCCESSOR_RECONCILIATION');
assert.equal(v1.frozenAliasRegistryRewritten, false);
assert.equal(v1.alrFreezeRewritten, false);
assert.equal(v1.authorityExpansionGranted, false);

const v1W33 = v1.entries.find(entry => entry.implementationFile === W33);
const v1W42 = v1.entries.find(entry => entry.implementationFile === W42);
assert.ok(v1W33, 'ALR_V1_W33_SUCCESSOR_MISSING');
assert.ok(v1W42, 'ALR_V1_W42_SUCCESSOR_MISSING');

// W33: replace whitespace-sensitive raw string prefix with command-token prefix validation.
let w33 = readText(W33);
const w33Marker = 'ALR_POSTCHECK_COMMAND_PREFIX_V2';
if (!w33.includes(w33Marker)) {
  assert.equal(digestSource(w33), v1W33.successorDigest, 'ALR_W33_V1_SUCCESSOR_DIGEST_UNEXPECTED');

  const oldBlock = `const requiredPostcheckPrefix = 'npm run check:governance-data-closure && npm run check:alr-foundation && npm run check:alr-capability && npm run check:alr-learning-architecture && npm run check:car-reconciliation && npm run check:icr-foundation && npm run check:icr-runtime &&  npm run check:rmo && npm run check:alr-knowledge-learning && npm run check:alr-practice && npm run check:alr-assessment && npm run check:alr-progress && npm run check:alr-access && ';\nassert.ok(pkg.scripts.postcheck.startsWith(requiredPostcheckPrefix));`;

  const newBlock = `// ALR_POSTCHECK_COMMAND_PREFIX_V2\n// Compare normalized command tokens instead of raw whitespace so legitimate\n// post-freeze tail additions remain possible without weakening required order.\nconst requiredPostcheckPrefixCommands = Object.freeze([\n  'npm run check:governance-data-closure',\n  'npm run check:alr-foundation',\n  'npm run check:alr-capability',\n  'npm run check:alr-learning-architecture',\n  'npm run check:car-reconciliation',\n  'npm run check:icr-foundation',\n  'npm run check:icr-runtime',\n  'npm run check:rmo',\n  'npm run check:alr-knowledge-learning',\n  'npm run check:alr-practice',\n  'npm run check:alr-assessment',\n  'npm run check:alr-progress',\n  'npm run check:alr-access'\n]);\nconst postcheckCommands = pkg.scripts.postcheck\n  .split('&&')\n  .map(command => command.trim())\n  .filter(Boolean);\nassert.deepEqual(\n  postcheckCommands.slice(0, requiredPostcheckPrefixCommands.length),\n  requiredPostcheckPrefixCommands,\n  'ALR_W33_POSTCHECK_COMMAND_PREFIX_DRIFT'\n);`;

  assert.ok(w33.includes(oldBlock), 'ALR_W33_POSTCHECK_PREFIX_ANCHOR_NOT_FOUND');
  w33 = w33.replace(oldBlock, newBlock);
  writeText(W33, w33);
}

const w33V2Digest = digestFile(W33);

// W42: consume the full versioned reconciliation chain instead of only v1.
let w42 = readText(W42);
const w42Marker = 'ALR_POST_FREEZE_CHECKER_RECONCILIATION_CHAIN_V2';
if (!w42.includes(w42Marker)) {
  assert.equal(digestSource(w42), v1W42.successorDigest, 'ALR_W42_V1_SUCCESSOR_DIGEST_UNEXPECTED');

  const oldBlock = `const checkerReconciliation = await read(\n  'docs/alr/reconciliation/alr-post-freeze-checker-reconciliation-v1.json'\n);\nassert.equal(\n  checkerReconciliation.reconciliationCode,\n  'PHI-OS-ALR-POST-FREEZE-CHECKER-RECONCILIATION-v1',\n  'ALR_POST_FREEZE_CHECKER_RECONCILIATION'\n);\nassert.equal(checkerReconciliation.status, 'ACCEPTED_SUCCESSOR_RECONCILIATION');\nassert.equal(checkerReconciliation.frozenAliasRegistryRewritten, false);\nassert.equal(checkerReconciliation.authorityExpansionGranted, false);\n\nfor (const entry of context.alrCheckerAliasRegistry.entries) {\n  await fs.access(path.join(root, entry.implementationFile));\n  const actualDigest = await digest(entry.implementationFile);\n  if (actualDigest === entry.implementationDigest) continue;\n\n  const successor = checkerReconciliation.entries.find(item =>\n    item.implementationFile === entry.implementationFile\n  );\n\n  assert.ok(successor, \`\${entry.workCode} checker digest\`);\n  assert.equal(successor.frozenDigest, entry.implementationDigest,\n    \`\${entry.workCode} frozen checker digest\`);\n  assert.equal(actualDigest, successor.successorDigest,\n    \`\${entry.workCode} successor checker digest\`);\n  assert.equal(successor.authorityExpansionGranted, false);\n  assert.equal(successor.runtimeSemanticAuthorityChanged, false);\n}`;

  const newBlock = `// ALR_POST_FREEZE_CHECKER_RECONCILIATION_CHAIN_V2\nconst checkerReconciliations = [\n  await read('docs/alr/reconciliation/alr-post-freeze-checker-reconciliation-v1.json'),\n  await read('docs/alr/reconciliation/alr-post-freeze-checker-reconciliation-v2.json')\n];\nassert.deepEqual(\n  checkerReconciliations.map(item => item.reconciliationCode),\n  [\n    'PHI-OS-ALR-POST-FREEZE-CHECKER-RECONCILIATION-v1',\n    'PHI-OS-ALR-POST-FREEZE-CHECKER-RECONCILIATION-v2'\n  ],\n  'ALR_POST_FREEZE_CHECKER_RECONCILIATION_CHAIN'\n);\nfor (const reconciliation of checkerReconciliations) {\n  assert.equal(reconciliation.status, 'ACCEPTED_SUCCESSOR_RECONCILIATION');\n  assert.equal(reconciliation.frozenAliasRegistryRewritten, false);\n  assert.equal(reconciliation.alrFreezeRewritten, false);\n  assert.equal(reconciliation.authorityExpansionGranted, false);\n}\n\nfor (const entry of context.alrCheckerAliasRegistry.entries) {\n  await fs.access(path.join(root, entry.implementationFile));\n  const actualDigest = await digest(entry.implementationFile);\n  let acceptedDigest = entry.implementationDigest;\n\n  for (const reconciliation of checkerReconciliations) {\n    const successor = reconciliation.entries.find(item =>\n      item.implementationFile === entry.implementationFile\n    );\n    if (!successor) continue;\n\n    const predecessorDigest = successor.predecessorDigest ?? successor.frozenDigest;\n    assert.equal(predecessorDigest, acceptedDigest,\n      \`\${entry.workCode} reconciliation predecessor digest\`);\n    assert.equal(successor.authorityExpansionGranted, false);\n    assert.equal(successor.runtimeSemanticAuthorityChanged, false);\n    acceptedDigest = successor.successorDigest;\n  }\n\n  assert.equal(actualDigest, acceptedDigest,\n    \`\${entry.workCode} latest accepted checker digest\`);\n}`;

  assert.ok(w42.includes(oldBlock), 'ALR_W42_RECONCILIATION_ANCHOR_NOT_FOUND');
  w42 = w42.replace(oldBlock, newBlock);
  writeText(W42, w42);
}

const w42V2Digest = digestFile(W42);

const v2 = {
  reconciliationCode: 'PHI-OS-ALR-POST-FREEZE-CHECKER-RECONCILIATION-v2',
  reconciliationVersion: '2.0.0',
  status: 'ACCEPTED_SUCCESSOR_RECONCILIATION',
  baselineCommit: '1ebd26901fb63db0753a8fc737ea6423155cf8b0',
  predecessorReconciliation: V1,
  purpose:
    'Replace the ALR-W33 postcheck raw-string prefix assertion with command-token prefix validation and teach the ALR governance checker to verify a versioned checker-successor chain without reopening ALR runtime semantics or freeze.',
  frozenAliasRegistry: 'content/academy/academy-learning-runtime/registries/alr-checker-alias-registry-v1.json',
  frozenAliasRegistryRewritten: false,
  alrFreezeRewritten: false,
  packageJsonMutatedByThisRepair: false,
  authorityExpansionGranted: false,
  entries: [
    {
      implementationFile: W33,
      affectedWorks: ['ALR-W33', 'ALR-W34', 'ALR-W35'],
      predecessorDigest: v1W33.successorDigest,
      successorDigest: w33V2Digest,
      changeScope: 'REPLACE_WHITESPACE_SENSITIVE_POSTCHECK_PREFIX_STRING_WITH_NORMALIZED_COMMAND_TOKEN_PREFIX_VALIDATION',
      runtimeSemanticAuthorityChanged: false,
      academyAccessSemanticsChanged: false,
      entitlementAuthorityChanged: false,
      professionalBoundaryChanged: false,
      postcheckRequiredCommandOrderChanged: false,
      postcheckTailOwnershipClaimed: false,
      authorityExpansionGranted: false
    },
    {
      implementationFile: W42,
      affectedWorks: ['ALR-W42', 'ALR-W43', 'ALR-W44', 'ALR-W45', 'ALR-W46'],
      predecessorDigest: v1W42.successorDigest,
      successorDigest: w42V2Digest,
      changeScope: 'VERIFY_VERSIONED_POST_FREEZE_CHECKER_SUCCESSOR_CHAIN_V1_TO_V2',
      runtimeSemanticAuthorityChanged: false,
      alrGovernanceSemanticsChanged: false,
      freezeDecisionChanged: false,
      postcheckTailOwnershipClaimed: false,
      authorityExpansionGranted: false
    }
  ],
  rules: {
    frozenAliasRegistryDigestValuesRemainHistoricalAuthority: true,
    predecessorReconciliationRemainsImmutable: true,
    successorDigestMustMatchExactFileContent: true,
    onlyListedImplementationFilesMayUseSuccessorDigest: true,
    unlistedCheckerDigestDriftFailsClosed: true,
    postcheckWhitespaceIsNotSemanticAuthority: true,
    requiredPostcheckCommandOrderMustRemainExact: true,
    laterPostcheckTailExpansionAllowedWithoutAlrOwnership: true,
    futureSuccessorChangeRequiresNewVersionedReconciliation: true,
    alrDoesNotOwnFuturePostcheckTail: true,
    rrRuntimeAuthorityUnchanged: true,
    rreRuntimeAuthorityUnchanged: true
  }
};
writeText(V2, JSON.stringify(v2, null, 2) + '\n');

// Final exact digest verification after the reconciliation file exists.
assert.equal(digestFile(W33), v2.entries[0].successorDigest);
assert.equal(digestFile(W42), v2.entries[1].successorDigest);

const pkg = readJson('package.json');
const requiredCommands = [
  'npm run check:governance-data-closure',
  'npm run check:alr-foundation',
  'npm run check:alr-capability',
  'npm run check:alr-learning-architecture',
  'npm run check:car-reconciliation',
  'npm run check:icr-foundation',
  'npm run check:icr-runtime',
  'npm run check:rmo',
  'npm run check:alr-knowledge-learning',
  'npm run check:alr-practice',
  'npm run check:alr-assessment',
  'npm run check:alr-progress',
  'npm run check:alr-access'
];
const commands = pkg.scripts.postcheck.split('&&').map(command => command.trim()).filter(Boolean);
assert.deepEqual(commands.slice(0, requiredCommands.length), requiredCommands,
  'CURRENT_PACKAGE_POSTCHECK_REQUIRED_PREFIX_COMMAND_DRIFT');

console.log('✓ ALR post-freeze checker reconciliation v2 applied.');
console.log('✓ ALR-W33 postcheck validation is command-token based; whitespace is non-semantic.');
console.log('✓ Required ALR/RMO command order remains exact while later RRE/RR tail additions remain allowed.');
console.log('✓ ALR freeze, alias registry, runtime semantics and package.json remain unchanged by this repair.');
