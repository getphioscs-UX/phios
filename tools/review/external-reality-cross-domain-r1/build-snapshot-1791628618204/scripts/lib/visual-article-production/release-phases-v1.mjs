import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { buildVisualArticleReleaseCandidate } from './article-release-v1.mjs';

const ROOT = process.cwd();
const base = 'content/production/visual-article/release';
export const phasePaths = {
  w26: `${base}/authority/VAP-W26-KN-PREFACE-001-ZH-HANS.json`,
  w27: `${base}/website/VAP-W27-KN-PREFACE-001-ZH-HANS.json`,
  w28: `${base}/acceptance/VAP-W28-KN-PREFACE-001-ZH-HANS.json`,
  w29: `${base}/freeze/VAP-W29-KN-PREFACE-001-ZH-HANS.json`
};
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const read = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const fileDigest = (root, relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');

export function buildReleasePhase({ root = ROOT, work }) {
  const w25 = buildVisualArticleReleaseCandidate({ root });
  const article = read(root, 'content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json');
  const configs = {
    w26: { work: 'VAP-W26', title: 'Published Authority Projection', executes: ['published_knowledge_authority_projection'], requires: ['W25_READY_FOR_RELEASE'] },
    w27: { work: 'VAP-W27', title: 'Website Article Release', executes: ['knowledge_publish','published_authority_build','published_retrieval_build','public_build'], requires: ['W26_EXECUTED'] },
    w28: { work: 'VAP-W28', title: 'Production Visual Acceptance', executes: ['production_url_acceptance'], requires: ['W27_EXECUTED'] },
    w29: { work: 'VAP-W29', title: 'First Visual Article Freeze', executes: ['vertical_slice_freeze'], requires: ['W28_ACCEPTED'] }
  };
  const config = configs[work]; if (!config) throw new Error('VAP_RELEASE_PHASE_UNSUPPORTED');
  const priorPath = work === 'w26' ? null : phasePaths[`w${Number(work.slice(1)) - 1}`];
  const prior = priorPath && fs.existsSync(path.join(root, priorPath)) ? read(root, priorPath) : null;
  const upstreamReady = work === 'w26' ? w25.status === 'READY_FOR_RELEASE' : prior?.status === (work === 'w29' ? 'ACCEPTED' : 'EXECUTED');
  const blocker = w25.status === 'AWAITING_HUMAN_ASSET_REVIEW' ? 'BLOCKED_BY_HUMAN_ASSET_REVIEW' : `BLOCKED_BY_${config.requires[0]}`;
  const body = {
    schemaVersion: 'PHI-OS-VAP-ARTICLE-RELEASE-PHASE-v1.0.0', work: config.work, title: config.title,
    nodeCode: 'KN-PREFACE-001', locale: 'zh-Hans', slug: article.article.slug, href: article.article.href,
    status: upstreamReady ? 'READY_NOT_EXECUTED' : blocker,
    executionPerformed: false, plannedOperations: config.executes, requiredGate: config.requires[0],
    upstream: { w25Status: w25.status, w25Digest: w25.releaseCandidateDigest, priorPath, priorDigest: priorPath && fs.existsSync(path.join(root, priorPath)) ? fileDigest(root, priorPath) : null },
    governance: { checkerWritesState: false, automaticApprovalForbidden: true, automaticPublicationForbidden: true, automaticDeploymentForbidden: true, productionUrlCheckedBeforeRelease: false }
  };
  return { ...body, phaseDigest: digest(body) };
}

export function validateReleasePhase(record, { root = ROOT } = {}) {
  const copy = { ...record }; delete copy.phaseDigest;
  if (record.phaseDigest !== digest(copy)) throw new Error('VAP_RELEASE_PHASE_DIGEST_INVALID');
  const key = record.work.toLowerCase().replace('vap-', '');
  if (JSON.stringify(record) !== JSON.stringify(buildReleasePhase({ root, work: key }))) throw new Error('VAP_RELEASE_PHASE_NOT_CANONICAL');
  if (record.executionPerformed !== false) throw new Error('VAP_RELEASE_PHASE_FALSE_EXECUTION');
  return record;
}

export async function writeReleasePhase({ root = ROOT, work }) {
  const record = buildReleasePhase({ root, work }); const relative = phasePaths[work]; const target = path.join(root, relative);
  await fsp.mkdir(path.dirname(target), { recursive: true }); await fsp.writeFile(target, `${JSON.stringify(record, null, 2)}\n`); return { record, path: relative };
}
