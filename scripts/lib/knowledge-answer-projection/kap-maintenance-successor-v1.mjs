import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const PATHS = Object.freeze([
  'content/knowledge/answer-projection/maintenance/kap-m1-ask-retrieval-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m2-ptrc-ask-quality-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m3-optional-quality-outcome-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m4-formation-grounding-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m5-structured-ask-successor-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m6-structured-customer-presentation-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m7-selected-article-consumption-v1.json',
  'content/knowledge/answer-projection/maintenance/kap-m8-book-v-publication-grounding-v1.json'
]);
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const maintenanceDocs = () => PATHS.filter(path => fs.existsSync(path)).map(path => JSON.parse(fs.readFileSync(path, 'utf8')));
const changesFor = path => maintenanceDocs().flatMap(doc => (doc.changes || []).filter(item => item.path === path).map(item => ({ doc, item })));

export function kapMaintenanceSuccessorSha(path, fallback = null) {
  const changes = changesFor(path);
  if(changes.length && fallback) assertKapEvidenceOrMaintenance({path,sha256:fallback});
  return changes.length ? changes.at(-1).item.successorSha256 : fallback;
}

export function assertKapEvidenceOrMaintenance(entry) {
  assert.ok(fs.existsSync(entry.path), `MISSING_FILE:${entry.path}`);
  const actual = digest(entry.path);
  if (actual === entry.sha256) return;
  const changes = changesFor(entry.path);
  assert.ok(changes.length, `DIGEST_DRIFT:${entry.path}`);

  let expected = entry.sha256;
  let chainStarted = false;
  for (const { doc, item } of changes) {
    const predecessors = [item.frozenSha256, item.baselineSha256, item.predecessorSha256].filter(Boolean);
    if (!chainStarted) {
      if (!predecessors.includes(expected)) continue;
      chainStarted = true;
    } else {
      assert.ok(predecessors.includes(expected), `MAINTENANCE_SUCCESSOR_CHAIN_MISMATCH:${entry.path}`);
    }
    expected = item.successorSha256;
    assert.equal(doc.boundaries?.canonicalKnowledgeCreated, false);
    assert.equal(doc.boundaries?.secondAskRuntimeCreated, false);
    if ('historicalFreezeRewritten' in (doc.boundaries || {})) assert.equal(doc.boundaries.historicalFreezeRewritten, false);
    if ('checksumValidationRelaxed' in (doc.boundaries || {})) assert.equal(doc.boundaries.checksumValidationRelaxed, false);
  }
  assert.ok(chainStarted, `MAINTENANCE_FROZEN_DIGEST_MISMATCH:${entry.path}`);
  assert.equal(actual, expected, `MAINTENANCE_SUCCESSOR_DIGEST_MISMATCH:${entry.path}`);
}
