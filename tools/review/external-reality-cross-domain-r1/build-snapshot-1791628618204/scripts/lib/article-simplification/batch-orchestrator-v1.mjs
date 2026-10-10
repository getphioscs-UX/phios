import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildArticleReadiness, stableJson } from './single-readiness-v1.mjs';

export const APS3_BASELINE = 'b7df645a7c4a5ab2fa5e80f5cae57a26e2803e39';
export const APS3_CONTRACT = 'content/production/article-simplification/contracts/aps-3-batch-orchestrator-contract-v1.json';
export const APS3_BATCH_DIR = 'content/production/article-simplification/batches';
export const APS3_WAVE_MAXIMUM = 24;

const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
const abs = (root, relative) => path.join(root, relative);

function batchPlanPaths(root) {
  const base = abs(root, APS3_BATCH_DIR);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^BATCH-\d{3,}$/.test(entry.name))
    .map(entry => `${APS3_BATCH_DIR}/${entry.name}/batch-plan.v1.json`)
    .filter(relative => fs.existsSync(abs(root, relative)))
    .sort();
}

function readJson(root, relative) {
  return JSON.parse(fs.readFileSync(abs(root, relative), 'utf8'));
}

function sameRequest(plan, request, readinessDigest) {
  return plan?.work === 'APS-3' &&
    plan?.request?.bookCode === request.bookCode &&
    plan?.request?.locale === request.locale &&
    plan?.request?.requestedCount === request.requestedCount &&
    plan?.sourceReadiness?.readinessDigest === readinessDigest;
}

function nextBatchCode(paths) {
  const numbers = paths.map(relative => Number(relative.match(/BATCH-(\d+)/)?.[1] || 0));
  const next = Math.max(0, ...numbers) + 1;
  return `BATCH-${String(next).padStart(3, '0')}`;
}

function chunksFor(entries) {
  const chunks = [];
  for (let index = 0; index < entries.length; index += APS3_WAVE_MAXIMUM) {
    const slice = entries.slice(index, index + APS3_WAVE_MAXIMUM);
    chunks.push({
      chunkCode: `CHUNK-${String(chunks.length + 1).padStart(3, '0')}`,
      maximum: APS3_WAVE_MAXIMUM,
      nodeCodes: slice.map(entry => entry.nodeCode)
    });
  }
  return chunks;
}

function selectedEntry(entry, index) {
  return {
    batchIndex: index + 1,
    nodeCode: entry.nodeCode,
    bookCode: entry.bookCode,
    partCode: entry.partCode,
    locale: entry.locale,
    title: entry.title,
    readinessState: entry.state,
    readinessBlockers: entry.blockers,
    readinessAuthorityEvidence: entry.authorityEvidence
  };
}

export function buildBatchPlan(root, { bookCode = 'BOOK-1', locale = 'zh-Hans', count = 30, batchCode = null, createdAt = null } = {}) {
  if (!Number.isInteger(count) || count <= 0) throw new Error(`--count must be a positive integer; received ${count}`);
  const readiness = buildArticleReadiness(root, { bookCode, locale });
  const request = {
    bookCode,
    locale,
    requestedCount: count,
    requestedCountMeaning: 'maximum_not_quota'
  };
  const existingPaths = batchPlanPaths(root);
  if (!batchCode) {
    for (const relative of existingPaths) {
      const plan = readJson(root, relative);
      if (sameRequest(plan, request, readiness.readinessDigest)) {
        return { plan, outputPath: relative, reusedExistingPlan: true };
      }
    }
  }

  const resolvedBatchCode = batchCode || nextBatchCode(existingPaths);
  const outputPath = `${APS3_BATCH_DIR}/${resolvedBatchCode}/batch-plan.v1.json`;
  if (batchCode && fs.existsSync(abs(root, outputPath))) {
    const existing = readJson(root, outputPath);
    if (!sameRequest(existing, request, readiness.readinessDigest)) {
      throw new Error(`${resolvedBatchCode} already exists with a different request or readiness digest`);
    }
    return { plan: existing, outputPath, reusedExistingPlan: true };
  }

  const available = readiness.entries.filter(entry => entry.state === 'ARTICLE_READY');
  const selectedRaw = available.slice(0, count);
  const entries = selectedRaw.map(selectedEntry);
  const plan = {
    schemaVersion: 'PHI-OS-APS-3-ARTICLE-BATCH-PLAN-v1.0.0',
    work: 'APS-3',
    status: entries.length > 0 ? 'READY_FOR_APS_4_CANDIDATE_ORCHESTRATION' : 'NO_ARTICLE_READY_NODES',
    implementationBaselineCommit: APS3_BASELINE,
    contractReference: APS3_CONTRACT,
    batchCode: resolvedBatchCode,
    createdAt: createdAt || new Date().toISOString(),
    request,
    sourceReadiness: {
      work: 'APS-2',
      schemaVersion: readiness.schemaVersion,
      readinessDigest: readiness.readinessDigest,
      readyStateConsumed: 'ARTICLE_READY',
      readyCount: readiness.summary.readyCount
    },
    selection: {
      availableReadyCount: available.length,
      selectedCount: entries.length,
      shortfallCount: Math.max(0, count - entries.length),
      unselectedReadyCount: Math.max(0, available.length - entries.length),
      downstreamPjaWaveMaximum: APS3_WAVE_MAXIMUM,
      chunks: chunksFor(entries)
    },
    entries,
    governance: {
      nonAuthoritativeOrchestrationPlan: true,
      consumesSingleReadinessOnly: true,
      reinterpretsUnderlyingGateInternals: false,
      createsCanonicalKnowledgeAuthority: false,
      createsHumanDecisionAuthority: false,
      freezesC2OrC3: false,
      createsCandidate: false,
      invokesProvider: false,
      createsPublication: false,
      countIsMaximumNotQuota: true
    },
    nextWork: 'APS-4_CANDIDATE_ORCHESTRATION'
  };
  const digestInput = structuredClone(plan);
  plan.batchDigest = `sha256:${sha(stableJson(digestInput))}`;
  return { plan, outputPath, reusedExistingPlan: false };
}

export function writeBatchPlan(root, options = {}) {
  const result = buildBatchPlan(root, options);
  if (!result.reusedExistingPlan) {
    const target = abs(root, result.outputPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, stableJson(result.plan), 'utf8');
  }
  return result;
}
