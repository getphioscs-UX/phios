import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeApsPublishedKnowledgeAuthoritySuccessor } from '../article-simplification/published-authority-successor-v1.mjs';
import { readJson, pathsFor, advanceAbl, fillFixtureIdentityApprovals, fillFixtureCandidateSubmissions, fillFixtureHumanDecisions } from './abl-v1.mjs';

const normalize = value => String(value ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
export const shaText = value => crypto.createHash('sha256').update(normalize(value), 'utf8').digest('hex');
export const shaFile = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const rel = (root, value) => path.join(root, value);
export const exists = (root, value) => fs.existsSync(rel(root, value));
export const json = (root, value) => JSON.parse(normalize(fs.readFileSync(rel(root, value), 'utf8')));

export function verifyKnrL10nFreeze(root) {
  const freeze = json(root, 'content/knowledge/l10n/knr-l10n-w1-freeze-v1.json');
  for (const [relative, expected] of Object.entries(freeze.digests)) {
    const actual = shaFile(rel(root, `content/knowledge/l10n/${relative}`));
    if (actual !== expected) throw new Error(`KNR-L10N frozen digest drift: ${relative}:${actual}`);
  }
  return freeze;
}

export function makeFixtureRoot(root, label) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), `phios-${label}-`));
  fs.cpSync(root, target, {
    recursive: true,
    filter: source => !source.includes(`${path.sep}.git${path.sep}`) && !source.endsWith(`${path.sep}.git`) && !source.includes(`${path.sep}node_modules${path.sep}`) && !source.endsWith(`${path.sep}node_modules`)
  });
  resetAblFixture(target, 'BATCH-001');
  return target;
}

export function removeFixtureRoot(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

function writeRegistry(root, relative, registry) {
  fs.writeFileSync(rel(root, relative), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function stripRegistry(root, relative, nodeCodes) {
  const registry = json(root, relative);
  const records = (registry.records || []).filter(record => !(record.locale === 'en' && nodeCodes.has(record.nodeCode)));
  writeRegistry(root, relative, { ...registry, records });
}

export function resetAblFixture(root, batchCode = 'BATCH-001') {
  const batch = json(root, `content/production/article-simplification/batches/${batchCode}/batch-plan.v1.json`);
  const nodeCodes = new Set(batch.entries.map(entry => entry.nodeCode));
  const slugByNode = new Map(batch.entries.map(entry => [entry.nodeCode, entry.slug || null]));
  const l10n = json(root, 'content/knowledge/l10n/multilingual-node-projection-registry.json');
  for (const record of l10n.records || []) {
    if (nodeCodes.has(record.nodeCode)) slugByNode.set(record.nodeCode, record.locales?.['zh-Hans']?.slug || slugByNode.get(record.nodeCode));
  }

  fs.rmSync(rel(root, `content/production/article-simplification/bilingual/${batchCode}`), { recursive: true, force: true });
  for (const nodeCode of nodeCodes) {
    for (const kind of ['candidates','reviews','approvals','publications']) fs.rmSync(rel(root, `content/knowledge/production/${kind}/en/${nodeCode}`), { recursive: true, force: true });
    fs.rmSync(rel(root, `content/knowledge/public/authority/articles/en/${nodeCode}.json`), { force: true });
    fs.rmSync(rel(root, `content/production/cpr/presentations/PRESENTATION-ARTICLE-${nodeCode}-EN-ABL-v1.json`), { force: true });
    const slug = slugByNode.get(nodeCode);
    if (slug) fs.rmSync(rel(root, `content/knowledge/public/visual-articles/en/${slug}.json`), { force: true });
  }
  stripRegistry(root, 'content/knowledge/production/registry/candidate-registry.json', nodeCodes);
  stripRegistry(root, 'content/knowledge/production/registry/review-registry.json', nodeCodes);
  stripRegistry(root, 'content/knowledge/production/registry/approval-registry.json', nodeCodes);
  stripRegistry(root, 'content/knowledge/production/registry/publication-registry.json', nodeCodes);
  const manifest = json(root, 'content/knowledge/public/abl-bilingual-release.json');
  writeRegistry(root, 'content/knowledge/public/abl-bilingual-release.json', { ...manifest, records: (manifest.records || []).filter(record => !(record.locale === 'en' && nodeCodes.has(record.nodeCode))) });
  writeApsPublishedKnowledgeAuthoritySuccessor(root);
}

export async function progressFixtureTo(root, target) {
  let result = await advanceAbl(root, 'BATCH-001', { apply: true });
  if (target === 'ABL-1') return result;
  await fillFixtureIdentityApprovals(root);
  result = await advanceAbl(root, 'BATCH-001', { apply: true });
  if (target === 'ABL-2') return result;
  await fillFixtureCandidateSubmissions(root);
  result = await advanceAbl(root, 'BATCH-001', { apply: true });
  if (target === 'ABL-3') return result;
  await fillFixtureHumanDecisions(root);
  result = await advanceAbl(root, 'BATCH-001', { apply: true });
  return result;
}

export function runChecker(root, script) {
  return execFileSync(process.execPath, [script], { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
}

export async function readAbl(root, batchCode, key) {
  return readJson(root, pathsFor(batchCode)[key]);
}
