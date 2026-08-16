import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { runAps7Publication } from './lib/article-simplification/publication-orchestrator-v1.mjs';
import { buildAps6DecisionBridge } from './lib/article-simplification/human-decision-bridge-v1.mjs';
import { FROZEN_PJA_PUBLICATION_SHA256 } from './lib/article-simplification/pja-publication-successor-v1.mjs';

const root = process.cwd();
const ABL5_RUN_REL = 'content/production/article-simplification/bilingual/BATCH-001/publication-run.v1.json';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const frozenPath = 'scripts/lib/knowledge-production/publication-v1.mjs';
const baselineFrozenDigest = sha(await fs.readFile(path.join(root, frozenPath)));
assert.equal(baselineFrozenDigest, FROZEN_PJA_PUBLICATION_SHA256);

const current = await buildAps6DecisionBridge(root, 'BATCH-001');
assert.equal(current.bridge.errors.length, 0, JSON.stringify(current.bridge.errors));
const realRunPath = path.join(root, 'content/production/article-simplification/batches/BATCH-001/publication-run.v1.json');
const realRunExists = await exists(realRunPath);
if (current.bridge.status === 'AWAITING_EXPLICIT_TL_PUBLICATION_DECISIONS') {
  await assert.rejects(
    () => runAps7Publication(root, 'BATCH-001', { apply: false }),
    error => error?.code === 'APS7_EXPLICIT_HUMAN_DECISIONS_REQUIRED'
  );
  assert.equal(realRunExists, false, 'Pending Human decisions cannot have an APS-7 publication run artifact.');
  await runMixedPrePublicationFixture();
} else {
  assert.equal(current.bridge.status, 'READY_FOR_APS_7_PUBLICATION');
  assert.equal(current.bridge.humanDecisionCount, 6);
  if (realRunExists) {
    const realRun = JSON.parse(await fs.readFile(realRunPath, 'utf8'));
    assert.equal(realRun.humanDecisionCount, 6);
    for (const outcome of realRun.outcomes) {
      const input = current.humanDecisions.entries.find(item => item.nodeCode === outcome.nodeCode && item.locale === outcome.locale);
      assert.equal(outcome.decision, input.publicationDecision);
      if (outcome.decision === 'publish') assert.equal(outcome.publicReleaseCreated, true);
      else assert.equal(outcome.publicationCreated, false);
    }
    await runPublishedStateIdempotenceFixture(realRun);
  } else {
    const dry = await runAps7Publication(root, 'BATCH-001', { apply: false });
    assert.equal(dry.result.humanDecisionCount, 6);
    assert.equal(dry.result.w11Applied, false);
  }
}

assert.equal(sha(await fs.readFile(path.join(root, frozenPath))), baselineFrozenDigest);
console.log('✓ APS-7 One-command Publication + ABL-5 additive successor reconciliation passed.');
console.log(`✓ Current BATCH-001 state ${current.bridge.status} is handled fail-closed before publication and successor-aware after publication.`);
console.log('✓ APS-6 fixture preserves independent publish / defer / do_not_publish Human outcomes; only publish may enter PJA Publication.');
console.log('✓ Frozen PJA Publication W1 implementation remains byte-identical; APS uses exact frozen Candidate-bound briefs through a successor adapter.');
console.log('✓ Published fixture/state reaches Published Knowledge Authority → conditional CAR (not required when no visual asset) → CPR → Visual Article → same-route locale release.');
console.log('✓ article:publish is idempotent and byte-stable for an already-published equivalent state.');

async function runMixedPrePublicationFixture() {
  const temp = await makeTempRoot();
  try {
    const humanPath = path.join(temp, 'content/production/article-simplification/batches/BATCH-001/human-decisions.v1.json');
    const human = JSON.parse(await fs.readFile(humanPath, 'utf8'));
    const decisions = ['publish', 'publish', 'publish', 'publish', 'defer', 'do_not_publish'];
    human.entries.forEach((entry, index) => {
      entry.publicationDecision = decisions[index];
      entry.publisherCode = 'TL';
      entry.decidedAt = `2026-08-16T0${index + 1}:30:00.000Z`;
      entry.summary = `APS-7 fixture explicit TL ${decisions[index]} decision for ${entry.nodeCode}.`;
    });
    await fs.writeFile(humanPath, `${JSON.stringify(human, null, 2)}\n`, 'utf8');
    const first = await runAps7Publication(temp, 'BATCH-001', { apply: true });
    assert.equal(first.result.status, 'PUBLICATION_ORCHESTRATION_COMPLETED_WITH_NON_PUBLISH_OUTCOMES');
    assert.equal(first.result.publishAuthorizedCount, 4);
    assert.equal(first.result.deferCount, 1);
    assert.equal(first.result.doNotPublishCount, 1);
    await validatePublishedState(temp, first.result, 4);
    const beforeSecond = await snapshot(temp, first.result.outcomes.filter(item => item.decision === 'publish'));
    const second = await runAps7Publication(temp, 'BATCH-001', { apply: true });
    assert.equal(second.result.runDigest, first.result.runDigest);
    assert.deepEqual(await snapshot(temp, first.result.outcomes.filter(item => item.decision === 'publish')), beforeSecond);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

async function runPublishedStateIdempotenceFixture(realRun) {
  const temp = await makeTempRoot();
  try {
    const before = await snapshot(temp, realRun.outcomes.filter(item => item.decision === 'publish'));
    const rerun = await runAps7Publication(temp, 'BATCH-001', { apply: true });
    assert.equal(rerun.result.runDigest, realRun.runDigest, 'Published successor rerun must reproduce the recorded APS-7 run digest.');
    await validatePublishedState(temp, rerun.result, realRun.outcomes.filter(item => item.decision === 'publish').length);
    assert.deepEqual(await snapshot(temp, realRun.outcomes.filter(item => item.decision === 'publish')), before);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

async function makeTempRoot() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'aps7-publish-'));
  for (const rel of ['content/knowledge', 'content/production', 'content/registry', 'articles']) {
    await fs.cp(path.join(root, rel), path.join(temp, rel), { recursive: true });
  }
  await fs.mkdir(path.join(temp, path.dirname(frozenPath)), { recursive: true });
  await fs.copyFile(path.join(root, frozenPath), path.join(temp, frozenPath));
  return temp;
}

async function validatePublishedState(temp, result, publishCount) {
  assert.equal(sha(await fs.readFile(path.join(temp, frozenPath))), baselineFrozenDigest, 'Frozen PJA Publication W1 implementation mutated.');
  const publicationRegistry = JSON.parse(await fs.readFile(path.join(temp, 'content/knowledge/production/registry/publication-registry.json'), 'utf8'));
  for (const outcome of result.outcomes.filter(item => item.decision === 'publish')) {
    assert(publicationRegistry.records.some(record => record.nodeCode === outcome.nodeCode && record.locale === outcome.locale));
    assert.equal(outcome.carState, 'NOT_REQUIRED_NO_VISUAL_ASSET');
    assert(outcome.cprPath && await exists(path.join(temp, outcome.cprPath)));
    assert(outcome.visualArticlePath && await exists(path.join(temp, outcome.visualArticlePath)));
    assert(outcome.routePath && await exists(path.join(temp, outcome.routePath)));
    const article = JSON.parse(await fs.readFile(path.join(temp, outcome.visualArticlePath), 'utf8'));
    assert.equal(article.publicationStatus, 'published');
    assert.equal(article.visualAssets.length, 0);
    assert(article.sections.length > 0);
  }
  for (const outcome of result.outcomes.filter(item => item.decision !== 'publish')) {
    assert.equal(outcome.publicationCreated, false);
    assert.equal(outcome.publicReleaseCreated, false);
    assert(!publicationRegistry.records.some(record => record.nodeCode === outcome.nodeCode && record.locale === outcome.locale));
  }
  const authority = JSON.parse(await fs.readFile(path.join(temp, 'content/knowledge/public/authority/published-knowledge-authority.json'), 'utf8'));
  let ablPublishCount = 0;
  if (await exists(path.join(temp, ABL5_RUN_REL))) {
    const ablRun = JSON.parse(await fs.readFile(path.join(temp, ABL5_RUN_REL), 'utf8'));
    assert.equal(ablRun.work, 'ABL-5');
    const ablPublished = ablRun.outcomes.filter(item => item.locale === 'en' && item.decision === 'publish' && item.publicationCreated === true);
    assert.equal(ablPublished.every(item => item.publicReleaseCreated === true), true);
    ablPublishCount = ablPublished.length;
    for (const outcome of ablPublished) assert(authority.records.some(record => record.nodeCode === outcome.nodeCode && record.locale === 'en'), `Missing ABL-5 PKA record for ${outcome.nodeCode}`);
  }
  assert.equal(authority.recordCount, 2 + publishCount + ablPublishCount, 'Historical two PKA records plus APS-7 outcomes plus attributable ABL-5 additive authority expected.');
  const manifest = JSON.parse(await fs.readFile(path.join(temp, 'content/knowledge/public/visual-article-release.json'), 'utf8'));
  assert.equal(manifest.records.filter(record => result.outcomes.some(item => item.nodeCode === record.nodeCode && item.decision === 'publish')).length, publishCount);
  const w11 = JSON.parse(await fs.readFile(path.join(temp, 'content/production/visual-article/decisions/vap-w11-batch-001-human-publication-decisions-v1.json'), 'utf8'));
  assert.equal(w11.status, 'HUMAN_PUBLICATION_DECISIONS_RECORDED');
  assert(w11.entries.every(entry => entry.decisionState === 'human_decided'));
}

async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
async function snapshot(rootPath, outcomes) {
  const paths = [
    'content/knowledge/production/registry/publication-registry.json',
    'content/knowledge/public/authority/published-knowledge-authority.json',
    'content/knowledge/public/visual-article-release.json',
    'content/production/visual-article/decisions/vap-w11-batch-001-human-publication-decisions-v1.json',
    'content/production/visual-article/publication/vap-w11-batch-001-publication-authorization-manifest-v1.json',
    'content/production/visual-article/activation/vap-w11-publication-handoff-decision-v1.json',
    ...outcomes.flatMap(item => [item.publicationPath, item.cprPath, item.visualArticlePath, item.routePath]).filter(Boolean)
  ];
  const out = {};
  for (const rel of [...new Set(paths)].sort()) out[rel] = sha(await fs.readFile(path.join(rootPath, rel)));
  return out;
}
