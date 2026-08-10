import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CONTRACT_PATH = 'content/production/visual-article/contracts/vap-w2-cloudflare-production-sha-verification-v1.json';
export const EVIDENCE_PATH = 'content/production/visual-article/deployment/vap-w2-cloudflare-production-sha-verification-v1.json';

export const stable = value => JSON.stringify(sortDeep(value), null, 2) + '\n';
export const digest = value => `sha256:${crypto.createHash('sha256').update(stable(value), 'utf8').digest('hex')}`;
export const readJson = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

export function loadVapW2Contract(root = process.cwd()) {
  return readJson(root, CONTRACT_PATH);
}

export function loadVapW2Evidence(root = process.cwd()) {
  return readJson(root, EVIDENCE_PATH);
}

export function normalizeCloudflareDeployments(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.result)
      ? payload.result
      : Array.isArray(payload?.deployments)
        ? payload.deployments
        : [];
  return list.map((raw, index) => normalizeDeployment(raw, index)).filter(Boolean);
}

// Compatibility export retained for VAP-W2 v1 callers. Exact SHA authority is now REST API metadata.
export const normalizeWranglerDeployments = normalizeCloudflareDeployments;

export function selectProductionDeployment(deployments, contract) {
  const productionHost = new URL(contract.cloudflare.productionUrl).host.toLowerCase();
  const candidates = deployments
    .filter(item => !item.environment || item.environment === contract.cloudflare.environment)
    .sort((a, b) => Date.parse(b.createdOn || 0) - Date.parse(a.createdOn || 0));
  const aliasOwner = candidates.find(item => item.aliasHosts.includes(productionHost));
  if (aliasOwner) return { deployment: aliasOwner, selectionMode: 'PRODUCTION_ALIAS_OWNER' };
  const successful = candidates.find(item => isSuccessfulStage(item.stageStatus));
  if (successful) return { deployment: successful, selectionMode: 'NEWEST_SUCCESSFUL_PRODUCTION_DEPLOYMENT' };
  return { deployment: candidates[0] ?? null, selectionMode: candidates[0] ? 'NEWEST_PRODUCTION_DEPLOYMENT_NOT_SUCCESSFUL' : 'NONE' };
}

export function isSuccessfulStage(value) {
  const normalized = String(value ?? '').toLowerCase();
  return ['success', 'successful', 'ready', 'active'].includes(normalized);
}

export function isFullGitSha(value) {
  return /^[a-f0-9]{40}$/i.test(String(value ?? ''));
}

export function buildVerificationRecord({ contract, repository, deployment, selectionMode, reachability, verifiedAt, rawDeploymentCount, metadataContext }) {
  const checks = {
    originMainEqualsImplementationBaseline: repository.originMain === contract.implementationBaselineCommit,
    headEqualsOriginMain: repository.head === repository.originMain,
    productionEnvironment: deployment?.environment === contract.cloudflare.environment,
    productionBranch: deployment?.branch === contract.cloudflare.productionBranch,
    productionCommitIsFullGitSha: isFullGitSha(deployment?.commitHash),
    productionCommitEqualsOriginMain: deployment?.commitHash === repository.originMain,
    productionCommitClean: deployment?.commitDirty === false,
    deploymentSuccessful: isSuccessfulStage(deployment?.stageStatus),
    productionUrlReachable: reachability?.reachable === true
  };
  const verified = Object.values(checks).every(Boolean);
  const status = verified ? 'VERIFIED_CURRENT_MAIN_DEPLOYED' : classifyFailure(checks, deployment, reachability);
  const record = {
    verificationCode: 'PHI-OS-VAP-W2-CLOUDFLARE-PRODUCTION-SHA-VERIFICATION-v1',
    verificationVersion: '1.0.1',
    work: 'VAP-W2',
    status,
    implementationBaselineCommit: contract.implementationBaselineCommit,
    verifiedAt,
    contractReference: CONTRACT_PATH,
    method: contract.cloudflare.metadataAuthority,
    repository,
    cloudflare: {
      projectName: contract.cloudflare.projectName,
      environment: contract.cloudflare.environment,
      productionUrl: contract.cloudflare.productionUrl,
      accountId: metadataContext?.accountId ?? null,
      accountName: metadataContext?.accountName ?? null,
      authenticationType: metadataContext?.authenticationType ?? null,
      apiOperation: metadataContext?.apiOperation ?? contract.cloudflare.apiOperation,
      rawDeploymentCount,
      selectionMode,
      deployment
    },
    reachability,
    checks,
    alignment: {
      verified,
      deployedCommit: deployment?.commitHash ?? null,
      originMainCommit: repository.originMain,
      exactCommitMatch: deployment?.commitHash === repository.originMain
    },
    security: {
      credentialPersisted: false,
      credentialLogged: false,
      cloudflareMutationPerformed: false
    },
    effects: {
      deploymentCreated: false,
      deploymentChanged: false,
      rollbackPerformed: false,
      repositoryContentChangedByVerification: false,
      candidateCreated: false,
      publicationCreated: false
    },
    vapW3Allowed: verified
  };
  return { ...record, verificationDigest: digest(record) };
}

export function validateVerificationRecord(contract, evidence) {
  const errors = [];
  const add = (code, detail) => errors.push({ code, detail });
  if (evidence?.work !== 'VAP-W2') add('VAP_W2_WORK_INVALID', evidence?.work);
  if (evidence?.status !== 'VERIFIED_CURRENT_MAIN_DEPLOYED') add('VAP_W2_NOT_VERIFIED', evidence?.status);
  if (evidence?.implementationBaselineCommit !== contract.implementationBaselineCommit) add('VAP_W2_BASELINE_MISMATCH', evidence?.implementationBaselineCommit);
  if (evidence?.method !== contract.cloudflare.metadataAuthority) add('VAP_W2_METADATA_AUTHORITY_MISMATCH', evidence?.method);
  if (evidence?.cloudflare?.projectName !== contract.cloudflare.projectName) add('VAP_W2_PROJECT_MISMATCH', evidence?.cloudflare?.projectName);
  if (evidence?.cloudflare?.environment !== contract.cloudflare.environment) add('VAP_W2_ENVIRONMENT_MISMATCH', evidence?.cloudflare?.environment);
  if (!/^[a-f0-9]{32}$/i.test(String(evidence?.cloudflare?.accountId ?? ''))) add('VAP_W2_ACCOUNT_ID_INVALID', evidence?.cloudflare?.accountId);
  if (evidence?.repository?.originMain !== contract.implementationBaselineCommit) add('VAP_W2_ORIGIN_MAIN_NOT_BASELINE', evidence?.repository?.originMain);
  if (evidence?.repository?.head !== evidence?.repository?.originMain) add('VAP_W2_HEAD_NOT_ORIGIN_MAIN', evidence?.repository?.head);
  if (evidence?.cloudflare?.deployment?.environment !== contract.cloudflare.environment) add('VAP_W2_DEPLOYMENT_ENVIRONMENT_INVALID', evidence?.cloudflare?.deployment?.environment);
  if (evidence?.cloudflare?.deployment?.branch !== contract.cloudflare.productionBranch) add('VAP_W2_DEPLOYMENT_BRANCH_INVALID', evidence?.cloudflare?.deployment?.branch);
  if (!isFullGitSha(evidence?.cloudflare?.deployment?.commitHash)) add('VAP_W2_DEPLOYED_SHA_NOT_FULL', evidence?.cloudflare?.deployment?.commitHash);
  if (evidence?.cloudflare?.deployment?.commitHash !== evidence?.repository?.originMain) add('VAP_W2_DEPLOYED_SHA_MISMATCH', evidence?.cloudflare?.deployment?.commitHash);
  if (evidence?.cloudflare?.deployment?.commitDirty !== false) add('VAP_W2_DIRTY_DEPLOYMENT', evidence?.cloudflare?.deployment?.commitDirty);
  if (!isSuccessfulStage(evidence?.cloudflare?.deployment?.stageStatus)) add('VAP_W2_DEPLOYMENT_NOT_SUCCESSFUL', evidence?.cloudflare?.deployment?.stageStatus);
  if (evidence?.reachability?.reachable !== true) add('VAP_W2_PRODUCTION_URL_UNREACHABLE', evidence?.reachability?.status);
  if (evidence?.security?.credentialPersisted !== false || evidence?.security?.credentialLogged !== false) add('VAP_W2_CREDENTIAL_BOUNDARY_INVALID', evidence?.security);
  if (evidence?.alignment?.verified !== true || evidence?.alignment?.exactCommitMatch !== true) add('VAP_W2_ALIGNMENT_NOT_VERIFIED', evidence?.alignment);
  if (evidence?.vapW3Allowed !== true) add('VAP_W2_VAP_W3_NOT_ALLOWED', evidence?.vapW3Allowed);
  const copy = structuredClone(evidence); delete copy.verificationDigest;
  if (evidence?.verificationDigest !== digest(copy)) add('VAP_W2_VERIFICATION_DIGEST_INVALID', evidence?.verificationDigest);
  return { valid: errors.length === 0, errors };
}

function normalizeDeployment(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const trigger = raw.deployment_trigger ?? raw.deploymentTrigger ?? raw.trigger ?? {};
  const metadata = trigger.metadata ?? raw.metadata ?? {};
  const source = raw.source ?? {};
  const sourceConfig = source.config ?? {};
  const stage = raw.latest_stage ?? raw.latestStage ?? {};
  const aliases = Array.isArray(raw.aliases) ? raw.aliases : [];
  const url = raw.url ?? raw.deployment_url ?? raw.deploymentUrl ?? null;
  const aliasHosts = [...aliases, url].filter(Boolean).map(value => hostOf(value)).filter(Boolean);
  const commitHash = firstString(
    metadata.commit_hash, metadata.commitHash,
    raw.commit_hash, raw.commitHash,
    sourceConfig.commit_hash, sourceConfig.commitHash,
    source.commit_hash, source.commitHash
  );
  const branch = firstString(metadata.branch, raw.branch, sourceConfig.branch, source.branch);
  const commitDirty = firstBoolean(metadata.commit_dirty, metadata.commitDirty, raw.commit_dirty, raw.commitDirty, sourceConfig.commit_dirty, sourceConfig.commitDirty);
  const environment = firstString(raw.environment, raw.env, source.environment);
  const stageStatus = firstString(stage.status, raw.status, raw.latest_stage_status, raw.latestStageStatus);
  const triggerType = firstString(trigger.type, raw.trigger_type, raw.triggerType, source.type);
  return {
    index,
    id: firstString(raw.id, raw.deployment_id, raw.deploymentId),
    shortId: firstString(raw.short_id, raw.shortId),
    projectName: firstString(raw.project_name, raw.projectName),
    environment,
    url,
    aliases,
    aliasHosts,
    createdOn: firstString(raw.created_on, raw.createdOn, raw.created_at, raw.createdAt),
    modifiedOn: firstString(raw.modified_on, raw.modifiedOn),
    stageName: firstString(stage.name, raw.stage_name, raw.stageName),
    stageStatus,
    triggerType,
    branch,
    commitHash,
    commitDirty
  };
}

function classifyFailure(checks, deployment, reachability) {
  if (!checks.originMainEqualsImplementationBaseline) return 'BASELINE_DRIFT';
  if (!checks.headEqualsOriginMain) return 'HEAD_NOT_AT_ORIGIN_MAIN';
  if (!deployment) return 'NO_PRODUCTION_DEPLOYMENT_FOUND';
  if (!checks.deploymentSuccessful) return 'PRODUCTION_DEPLOYMENT_NOT_SUCCESSFUL';
  if (!checks.productionEnvironment) return 'PRODUCTION_ENVIRONMENT_MISMATCH';
  if (!checks.productionBranch) return 'PRODUCTION_BRANCH_MISMATCH';
  if (!checks.productionCommitIsFullGitSha) return 'PRODUCTION_COMMIT_METADATA_INCOMPLETE';
  if (!checks.productionCommitClean) return 'PRODUCTION_COMMIT_DIRTY';
  if (!checks.productionCommitEqualsOriginMain) return 'PRODUCTION_BEHIND_OR_DIVERGED_FROM_MAIN';
  if (!checks.productionUrlReachable || reachability?.reachable !== true) return 'PRODUCTION_URL_UNREACHABLE';
  return 'VERIFICATION_FAILED';
}

function firstString(...values) {
  for (const value of values) if (typeof value === 'string' && value.length) return value;
  return null;
}
function firstBoolean(...values) {
  for (const value of values) if (typeof value === 'boolean') return value;
  return null;
}
function hostOf(value) {
  try { return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).host.toLowerCase(); }
  catch { return null; }
}
function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortDeep(value[key])]));
  return value;
}
