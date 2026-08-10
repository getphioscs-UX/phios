import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const baselinePath = 'content/production/visual-article/baseline/vap-production-baseline-v1.json';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(read(relative));
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const normalizeTextBytes = value => Buffer.from(
  value.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'),
  'utf8'
);

const baseline = readJson(baselinePath);
const pkg = readJson('package.json');

assert.equal(baseline.schemaVersion, 'PHI-OS-VAP-W0-PRODUCTION-BASELINE-v1.0.0');
assert.equal(baseline.baselineVersion, '1.0.1');
assert.equal(baseline.work, 'VAP-W0');
assert.equal(baseline.status, 'FROZEN_WITH_KNOWN_REPAIR_GATES');
assert.equal(baseline.sourceDigestMode, 'GIT_CANONICAL_TEXT_LF');
assert.match(baseline.baselineCommit, /^[0-9a-f]{40}$/);
assert.equal(baseline.repository.originMainVerified, true);
assert.equal(baseline.repository.repositoryClean, true);
assert.equal(baseline.repository.fullCheckPassed, true);
assert.equal(baseline.repository.sandboxReplay.logicFailureObserved, false);
assert.equal(pkg.scripts['check:vap-w0'], 'node scripts/check-vap-w0-production-baseline.mjs');
assert.equal(pkg.scripts['check:vap'], 'npm run check:vap-w0');
assert(pkg.scripts.postcheck.includes('npm run check:vap-w0'));

const expectedDigest = baseline.baselineDigest;
const digestInput = structuredClone(baseline);
delete digestInput.baselineDigest;
const actualBaselineDigest = 'sha256:' + sha256(JSON.stringify(sortDeep(digestInput)));
assert.equal(actualBaselineDigest, expectedDigest, 'VAP-W0 baseline self-digest drifted.');

const gitAvailable = hasGitRepository();
if (gitAvailable) {
  execFileSync('git', ['cat-file', '-e', `${baseline.baselineCommit}^{commit}`], { cwd: root, stdio: 'pipe' });
}

for (const [relative, expected] of Object.entries(baseline.sourceDigests)) {
  const source = gitAvailable
    ? execFileSync('git', ['show', `${baseline.baselineCommit}:${relative}`], { cwd: root })
    : normalizeTextBytes(fs.readFileSync(path.join(root, relative)));
  assert.equal('sha256:' + sha256(source), expected, `Baseline source digest mismatch: ${relative}`);
}

const pja = baseline.systemStatus.pja;
assert.deepEqual(
  { assessed: pja.assessed, c2Frozen: pja.c2Frozen, c2Blocked: pja.c2Blocked, productionReady: pja.productionReady, productionBlocked: pja.productionBlocked },
  { assessed: 78, c2Frozen: 5, c2Blocked: 73, productionReady: 5, productionBlocked: 73 }
);
assert.equal(pja.wave1ProductionReady, 4);

const kpp = baseline.systemStatus.kpp;
assert.equal(kpp.runtimeStatus, 'frozen');
assert.equal(kpp.runtimeProductionStatus, 'validation_only');
assert.equal(kpp.wave1Status, 'AUTHORIZED_FOR_GOVERNED_PRODUCTION_BRIEF_GENERATION');
assert.equal(kpp.productionPlanFrozen, true);
assert.equal(kpp.productionWaveFrozen, true);
assert.equal(kpp.briefGenerationAllowed, true);
assert.equal(kpp.candidateCreationAllowed, false);
assert.equal(kpp.providerInvocationAllowed, false);
assert.equal(kpp.publicationAllowed, false);

const car = baseline.systemStatus.car;
assert.equal(car.runtimeStatus, 'frozen');
assert.equal(car.productionStatus, 'validation_only');
assert.equal(car.productionActivationAllowed, false);
assert.equal(car.productionCandidateCount, 0);
assert.equal(car.publishedAssetCount, 0);
assert.equal(car.wave1BriefHandoffAuthorized, true);
assert.equal(car.productionBriefCreated, false);

const cpr = baseline.systemStatus.cpr;
assert.equal(cpr.runtimeStatus, 'frozen');
assert.equal(cpr.productionStatus, 'contract_frozen');
assert.equal(cpr.productionRecordCount, 0);

const pds = baseline.systemStatus.pds;
assert.equal(pds.status, 'implementation-complete-production-revalidation-required');
assert.equal(pds.productionRevalidationRequired, true);
assert.deepEqual(pds.viewports, [360, 768, 1440]);
assert.deepEqual(pds.locales, ['en', 'zh-Hans']);

const published = baseline.systemStatus.publishedKnowledge;
assert.equal(published.authorityRecordCount, 2);
assert.equal(published.canonicalNodeCount, 1);
assert.equal(published.integrityStatus, 'REPAIR_REQUIRED');
assert(published.integrityFindings.some(f => f.code === 'PUBLISHED_SUMMARY_CORRUPTED_SHA256_FILE_LIST' && f.nodeCode === 'KN-PREFACE-001' && f.locale === 'zh-Hans'));

const cloudflare = baseline.systemStatus.cloudflare;
assert.equal(cloudflare.deploymentStatus, 'DEPLOYMENT_COMMIT_ALIGNMENT_UNVERIFIED');
assert.equal(cloudflare.verificationOwner, 'VAP-W2');

assert.equal(baseline.productionBoundary.governedProductionBriefGenerationAllowed, true);
assert.equal(baseline.productionBoundary.pjaBriefGenerationAllowed, true);
assert.equal(baseline.productionBoundary.carBriefGenerationAllowed, true);
assert.equal(baseline.productionBoundary.candidateCreationAllowed, false);
assert.equal(baseline.productionBoundary.providerInvocationAllowed, false);
assert.equal(baseline.productionBoundary.assetCreationAllowed, false);
assert.equal(baseline.productionBoundary.publicationAllowed, false);
assert.equal(baseline.nextWork, 'VAP-W1_PUBLISHED_KNOWLEDGE_INTEGRITY_REPAIR');

console.log('✓ VAP-W0 Production Baseline Freeze R1 passed.');
console.log(`  Baseline origin/main: ${baseline.baselineCommit}`);
console.log('  Source digests use Git-canonical LF bytes; Windows CRLF archive fallback is normalized before hashing.');
console.log('  PJA: 5 production-ready / 73 C2-blocked; Wave 1 4/4 ready for governed briefs.');
console.log('  KPP: plan/wave frozen; brief generation allowed; candidate/provider/publication remain closed.');
console.log('  CAR/CPR remain frozen with zero production records; PDS requires production revalidation.');
console.log('  Published Knowledge records the KN-PREFACE-001 zh-Hans summary integrity gap for VAP-W1.');
console.log('  Cloudflare deployment SHA alignment remains explicitly deferred to VAP-W2.');

function hasGitRepository() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortDeep(value[key])]))
  }
  return value;
}
