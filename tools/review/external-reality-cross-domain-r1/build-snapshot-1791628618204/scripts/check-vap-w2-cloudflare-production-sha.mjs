import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadVapW2Contract,
  loadVapW2Evidence,
  normalizeCloudflareDeployments,
  selectProductionDeployment,
  validateVerificationRecord
} from './lib/visual-article-production/cloudflare-production-sha-verification-v1.mjs';

const root = process.cwd();
const contract = loadVapW2Contract(root);
const evidence = loadVapW2Evidence(root);

assert.equal(contract.work, 'VAP-W2');
assert.equal(contract.status, 'active');
assert.equal(contract.contractVersion, '1.0.1');
assert.equal(contract.cloudflare.projectName, 'phios-github');
assert.equal(contract.cloudflare.environment, 'production');
assert.equal(contract.cloudflare.productionBranch, 'main');
assert.equal(contract.cloudflare.productionUrl, 'https://phios-github.pages.dev/');
assert.equal(contract.cloudflare.metadataAuthority, 'CLOUDFLARE_PAGES_DEPLOYMENTS_REST_API_AUTHENTICATED_BY_WRANGLER');
assert.equal(contract.cloudflare.wranglerListOutputIsNotCommitAuthority, true);
assert.equal(contract.requiredVerification.deploymentCommitMustBeFullGitSha, true);
assert.equal(contract.requiredVerification.deploymentCommitMustEqualOriginMain, true);
assert.equal(contract.requiredVerification.deploymentCommitDirtyMustBeFalse, true);
assert.equal(contract.effects.cloudflareDeploymentMutationAllowed, false);
assert.equal(contract.effects.cloudflareRollbackAllowed, false);
assert.equal(contract.effects.vapW3AllowedOnlyAfterVerifiedEvidence, true);

// Parser compatibility fixture mirrors the raw Cloudflare Pages REST API envelope.
const fixture = {
  success: true,
  errors: [],
  messages: [],
  result: [{
    id: 'fixture-deployment',
    short_id: 'fixture1',
    project_name: 'phios-github',
    environment: 'production',
    url: 'https://abcd1234.phios-github.pages.dev',
    aliases: ['https://phios-github.pages.dev'],
    created_on: '2026-08-10T14:00:00.000Z',
    latest_stage: { name: 'deploy', status: 'success' },
    deployment_trigger: { type: 'github:push', metadata: { branch: 'main', commit_hash: contract.implementationBaselineCommit, commit_dirty: false } }
  }]
};
const normalized = normalizeCloudflareDeployments(fixture);
const selected = selectProductionDeployment(normalized, contract);
assert.equal(selected.selectionMode, 'PRODUCTION_ALIAS_OWNER');
assert.equal(selected.deployment.commitHash, contract.implementationBaselineCommit);
assert.equal(selected.deployment.commitHash.length, 40);
assert.equal(selected.deployment.branch, 'main');
assert.equal(selected.deployment.commitDirty, false);

const validation = validateVerificationRecord(contract, evidence);
assert.equal(validation.valid, true, JSON.stringify(validation.errors));

const w0 = JSON.parse(fs.readFileSync(path.join(root, 'content/production/visual-article/baseline/vap-production-baseline-v1.json'), 'utf8'));
assert.equal(w0.systemStatus.cloudflare.deploymentStatus, 'DEPLOYMENT_COMMIT_ALIGNMENT_UNVERIFIED', 'VAP-W0 must remain a historical pre-W2 snapshot.');
assert.equal(w0.baselineFindings.find(item => item.code === 'VAP-W0-CLOUDFLARE-DEPLOYMENT-SHA-UNVERIFIED')?.state, 'OPEN');
const w1 = JSON.parse(fs.readFileSync(path.join(root, 'content/production/visual-article/repairs/vap-w1-published-knowledge-integrity-repair-result-v1.json'), 'utf8'));
assert.equal(w1.status, 'REPAIRED_PROJECTION_READY');

const wave = JSON.parse(fs.readFileSync(path.join(root, 'content/knowledge/production-planning/activation/wave1-production-authorized-v1.json'), 'utf8'));
assert.equal(wave.status, 'AUTHORIZED_FOR_GOVERNED_PRODUCTION_BRIEF_GENERATION');
assert.equal(wave.gateSnapshot?.candidateCreationAllowed ?? wave.productionBoundary?.candidateCreationAllowed ?? false, false);

console.log('✓ VAP-W2 Cloudflare Production SHA Verification R1 passed.');
console.log(`  Production deployment full commit exactly matches ${evidence.repository.originMain}.`);
console.log(`  Cloudflare Pages project ${evidence.cloudflare.projectName} / main / production is authenticated through Wrangler and verified from raw Pages REST deployment metadata.`);
console.log(`  Deployment is successful, commit_dirty=false, and ${contract.cloudflare.productionUrl} is reachable.`);
console.log('  Wrangler seven-character Source output is explicitly non-authoritative for exact SHA verification.');
console.log('  VAP-W0 remains an unchanged historical pre-verification snapshot; no deploy or rollback was performed by VAP-W2.');
console.log('  VAP-W3 is now allowed by the recorded deployment evidence; candidate/provider/publication authority remains unchanged.');
