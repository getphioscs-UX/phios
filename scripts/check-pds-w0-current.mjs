import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import './check-master-governance.mjs';

const root = process.cwd();
const text = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = relativePath => JSON.parse(text(relativePath));
const canonicalTextSha256 = relativePath => crypto.createHash('sha256').update(text(relativePath), 'utf8').digest('hex');
const canonicalTextGitBlobSha = relativePath => {
  const source = Buffer.from(text(relativePath), 'utf8');
  return crypto.createHash('sha1').update(`blob ${source.length}\0`).update(source).digest('hex');
};
const exists = relativePath => fs.existsSync(path.join(root, relativePath));
const git = args => execFileSync('git', args, {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
}).trim();
const gitObjectExists = spec => {
  try {
    execFileSync('git', ['cat-file', '-e', spec], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const paths = Object.freeze({
  contract: 'content/registry/pds-w0-baseline-boundary.json',
  fixture: 'tests/fixtures/pds-w0-baseline-boundary.json',
  freezeDocument: 'docs/design-system/PDS-W0-BASELINE-AND-BOUNDARY-FREEZE.md',
  historicalChecker: 'scripts/check-pds-w0-baseline-boundary.mjs',
  postFreezeRegistry: 'docs/design-system/pds-w0-post-freeze-protected-path-additions-v1.json',
  successor: 'content/web-production/reconciliation/pds-w0-hpc2-pre-asset-resolver-successor-v1.json',
  pxrResolverSuccessor: 'content/web-production/reconciliation/pds-w0-pxr-asset-resolver-successor-v2.json',
  migrationRegistry: 'content/registry/runtime-migrations.json',
  package: 'package.json'
});

for (const relativePath of Object.values(paths)) assert.ok(exists(relativePath), `PDS_W0_CURRENT_DEPENDENCY_MISSING:${relativePath}`);

const contract = read(paths.contract);
const fixture = read(paths.fixture);
const postFreezeRegistry = read(paths.postFreezeRegistry);
const successor = read(paths.successor);
const pxrResolverSuccessor = read(paths.pxrResolverSuccessor);
const migrationRegistry = read(paths.migrationRegistry);
const pkg = read(paths.package);

assert.equal(contract.milestone, 'PDS-W0');
assert.equal(contract.status, 'baseline-and-boundary-frozen');
assert.equal(contract.baseline.commit, fixture.expectedBaseline.commit);
assert.equal(contract.baseline.tree, fixture.expectedBaseline.tree);
assert.equal(git(['rev-parse', `${contract.baseline.commit}^{commit}`]), contract.baseline.commit);
assert.equal(git(['rev-parse', `${contract.baseline.commit}^{tree}`]), contract.baseline.tree);
assert.deepEqual(contract.protectedScopes.flatMap(scope => scope.paths), fixture.protectedPaths);

assert.equal(successor.work, 'PDS-W0-CURRENT-PROTECTED-PATH-RECONCILIATION');
assert.equal(successor.baselineCommit, 'aab18446a012938ccd24043751469866831fe4e0');
assert.equal(successor.status, 'ACTIVE_ADDITIVE_CANONICAL_TEXT_AND_EXACT_BLOB_SUCCESSOR_PDS_W0_AND_WPR_B_HISTORY_PRESERVED');
for (const record of Object.values(successor.historicalAuthority)) {
  if (!record || typeof record !== 'object' || !record.path) continue;
  assert.equal(canonicalTextSha256(record.path), record.sha256, `PDS_W0_FROZEN_ARTIFACT_DRIFT:${record.path}`);
}
assert.equal(successor.historicalAuthority.historicalArtifactsRewritten, false);
assert.equal(successor.historicalAuthority.postFreezeAdditionRegistry.authorizationMode, 'ADD_ONLY_EXACT_GIT_BLOB');
assert.equal(postFreezeRegistry.status, 'canonical');
assert.equal(postFreezeRegistry.authorizationMode, 'ADD_ONLY_EXACT_GIT_BLOB');
assert.equal(postFreezeRegistry.pdsBaseline.commit, contract.baseline.commit);
assert.equal(postFreezeRegistry.rules.pdsBaselineCommitRemainsFrozen, true);
assert.equal(postFreezeRegistry.rules.baselineFileModificationAllowed, false);
assert.equal(postFreezeRegistry.rules.baselineFileDeletionAllowed, false);
assert.equal(postFreezeRegistry.rules.unregisteredProtectedPathAdditionAllowed, false);

const transition = successor.assetResolverTransition;
const originalEntry = postFreezeRegistry.entries.find(entry => entry.path === transition.path);
assert.ok(originalEntry, 'PDS_W0_ASSET_RESOLVER_ORIGINAL_AUTHORIZATION_MISSING');
assert.equal(originalEntry.protectedPath, transition.protectedPath);
assert.equal(originalEntry.gitBlobSha, transition.originalWprBBlobSha);
assert.equal(originalEntry.introducedByCommit, transition.originalWprBCommit);
assert.equal(originalEntry.immutable, true);
assert.equal(gitObjectExists(`${contract.baseline.commit}:${transition.path}`), false, 'ASSET_RESOLVER_EXISTED_IN_PDS_BASELINE');
assert.equal(git(['rev-parse', `${transition.originalWprBCommit}:${transition.path}`]), transition.originalWprBBlobSha);
assert.equal(git(['rev-parse', `${transition.successorCommit}:${transition.path}`]), transition.successorBlobSha);
assert.equal(pxrResolverSuccessor.work, 'PDS-W0-PXR-ASSET-RESOLVER-CURRENT-SUCCESSOR');
assert.equal(pxrResolverSuccessor.status, 'ACTIVE_ADDITIVE_PXR_GROUP_MEMBER_SUCCESSOR_PDS_W0_HISTORY_PRESERVED');
assert.equal(pxrResolverSuccessor.predecessor.path, transition.path);
assert.equal(pxrResolverSuccessor.predecessor.sha256, transition.successorSha256);
assert.equal(pxrResolverSuccessor.predecessor.gitBlobSha, transition.successorBlobSha);
assert.equal(pxrResolverSuccessor.predecessor.rewritten, false);
assert.equal(pxrResolverSuccessor.pxrAuthority.path, 'content/web-production/pxr/successors/pxr-asset-resolver-group-member-successor-v1.json');
assert.equal(canonicalTextSha256(pxrResolverSuccessor.pxrAuthority.path), pxrResolverSuccessor.pxrAuthority.sha256);
assert.equal(canonicalTextGitBlobSha(transition.path), pxrResolverSuccessor.current.gitBlobSha, 'PDS_W0_CURRENT_ASSET_RESOLVER_BLOB_DRIFT');
assert.equal(canonicalTextSha256(transition.path), pxrResolverSuccessor.current.sha256, 'PDS_W0_CURRENT_ASSET_RESOLVER_SHA256_DRIFT');
assert.equal(pxrResolverSuccessor.current.singleResolverIdentityPreserved, true);
assert.equal(pxrResolverSuccessor.current.groupMemberOnlyExtension, true);
for (const value of Object.values(pxrResolverSuccessor.authorityBoundary)) assert.equal(value, false);
assert.equal(transition.resolverIdentityChanged, false);
assert.equal(transition.secondResolverCreated, false);
assert.equal(transition.urlResolutionAuthorityChanged, false);
assert.equal(transition.registryAuthorityChanged, false);
assert.equal(transition.baselineRuntimeFileModified, false);

for (const evidence of successor.successorAuthorityEvidence) {
  assert.equal(canonicalTextSha256(evidence.path), evidence.sha256, `PDS_W0_SUCCESSOR_AUTHORITY_DRIFT:${evidence.path}`);
}
const wprHpc2Successor = read(successor.successorAuthorityEvidence[0].path);
const deliveryActivation = read(successor.successorAuthorityEvidence[1].path);
const homepageConsumption = read(successor.successorAuthorityEvidence[2].path);
const hpc2PreFreeze = read(successor.successorAuthorityEvidence[3].path);
assert.equal(wprHpc2Successor.successorRules.existingAssetResolverRemainsSingleAuthority, true);
assert.equal(deliveryActivation.resolver, transition.path);
assert.equal(deliveryActivation.secondResolverCreated, false);
assert.equal(homepageConsumption.resolver, transition.path);
assert.equal(homepageConsumption.consumerModule, 'assets/js/pages/home-production.js');
assert.equal(hpc2PreFreeze.implementationDigests[transition.path], transition.successorSha256);

const resolverSource = text(transition.path);
for (const field of transition.authorizedAdditiveReturnFields) {
  assert.match(resolverSource, new RegExp(`\\b${field}\\s*[:,]`), `PDS_W0_ASSET_RESOLVER_FIELD_MISSING:${field}`);
}
const resolverFiles = fs.readdirSync(path.join(root, 'assets/js/runtime/web-production')).sort();
assert.deepEqual(resolverFiles, [
  'asset-resolver.js',
  'composition-resolver.js',
  'locale-resolver.js',
  'vocabulary-resolver.js'
]);

const unchangedSuccessors = new Map(successor.unchangedRegisteredAdditions.map(entry => [entry.path, entry]));
for (const [relativePath, expected] of unchangedSuccessors) {
  const registered = postFreezeRegistry.entries.find(entry => entry.path === relativePath);
  assert.ok(registered, `PDS_W0_REGISTERED_ADDITION_MISSING:${relativePath}`);
  assert.equal(registered.gitBlobSha, expected.gitBlobSha);
  assert.equal(canonicalTextGitBlobSha(relativePath), expected.gitBlobSha, `PDS_W0_REGISTERED_ADDITION_DRIFT:${relativePath}`);
}

const authorizedRuntimePaths = new Set([transition.path, ...unchangedSuccessors.keys()]);
const registeredMigrations = new Set(
  migrationRegistry.migrations
    .filter(migration => migration.immutable === true)
    .map(migration => migration.file)
);

for (const protectedPath of fixture.protectedPaths) {
  const baselineFiles = git([
    'ls-tree',
    '-r',
    '--name-only',
    contract.baseline.commit,
    '--',
    protectedPath
  ]).split('\n').filter(Boolean);
  assert.ok(baselineFiles.length > 0, `PDS_W0_PROTECTED_PATH_MISSING_FROM_BASELINE:${protectedPath}`);

  const changedFiles = git([
    'diff',
    '--name-only',
    contract.baseline.commit,
    '--',
    protectedPath
  ]).split('\n').filter(Boolean);
  if (!changedFiles.length) continue;

  if (protectedPath === 'db/migrations') {
    assert.ok(changedFiles.every(file => !baselineFiles.includes(file) && registeredMigrations.has(file)), 'PDS_W0_UNAUTHORIZED_MIGRATION_CHANGE');
    continue;
  }

  if (protectedPath === transition.protectedPath) {
    assert.deepEqual([...changedFiles].sort(), [...authorizedRuntimePaths].sort(), 'PDS_W0_RUNTIME_PROTECTED_PATH_TOPOLOGY_DRIFT');
    for (const file of changedFiles) assert.equal(baselineFiles.includes(file), false, `PDS_W0_BASELINE_RUNTIME_FILE_CHANGED:${file}`);
    continue;
  }

  const exactBaselineRecovery = changedFiles.every(file => {
    if (!baselineFiles.includes(file) || !exists(file)) return false;
    return git(['rev-parse', `${contract.baseline.commit}:${file}`]) === git(['hash-object', file]);
  });
  assert.equal(exactBaselineRecovery, true, `PDS_W0_UNAUTHORIZED_PROTECTED_PATH_CHANGE:${protectedPath}`);
}

for (const boundary of Object.values(successor.boundaries)) assert.equal(boundary, false);
assert.equal(successor.successorPolicy.failClosed, true);
assert.equal(successor.successorPolicy.deterministic, true);
assert.equal(successor.successorPolicy.exactGitBlobRequired, true);
assert.equal(successor.successorPolicy.exactSha256Required, true);
assert.equal(successor.successorPolicy.textDigestNormalization, 'UTF8_BOM_STRIPPED_LF');
assert.equal(successor.successorPolicy.unregisteredProtectedPathChangeForbidden, true);
assert.equal(successor.successorPolicy.baselineFileModificationOrDeletionForbidden, true);

assert.equal(pkg.scripts['check:pds-w0'], 'node scripts/check-pds-w0-baseline-boundary.mjs');
assert.equal(pkg.scripts['check:pds-w0-current'], 'node scripts/check-pds-w0-current.mjs');
assert.deepEqual(
  pkg.scripts.precheck.split(' && ').slice(0, 2),
  [
    'npm run check:cloudflare-function-import-compat',
    'node scripts/check-pds-w0-current.mjs'
  ],
  'CLOUDFLARE_FUNCTION_IMPORT_COMPAT_AND_PDS_W0_CURRENT_PRECHECK_ORDER_DRIFT'
);
assert.equal(pkg.scripts.precheck.includes('nodescripts/'), false, 'PDS_W0_CURRENT_PRECHECK_COMMAND_CONCATENATION_DRIFT');

console.log('âœ“ PDS-W0 current protected-path successor passed.');
console.log('âœ“ Frozen PDS-W0 artifacts remain canonical-text exact across LF/CRLF checkout policy; the original WPR-B registry is unchanged.');
console.log('âœ“ HPC2-PRE asset-resolver successor ec25872c is accepted from its exact commit/blob and freeze evidence.');
console.log('âœ“ Four existing WPR resolver identities remain singular; baseline mutation and unregistered drift remain fail-closed.');