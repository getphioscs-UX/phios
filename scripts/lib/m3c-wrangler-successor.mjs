import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const read = async p => (await fs.readFile(p, 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const json = async p => JSON.parse(await read(p));
const sha = async p => crypto.createHash('sha256').update(await read(p)).digest('hex');

// Historical M3C hashes remain frozen; only this exact configuration delta is recognized.
export async function assertM3cWranglerSuccessor(expectedBaseline) {
  const predecessorPath = 'content/knowledge/registry/m3c-w3-wrangler-successor-reconciliation-v1.json';
  const predecessor = await json(predecessorPath);
  assert.equal(predecessor.predecessor.wranglerSha256, expectedBaseline);
  const next = await json('content/knowledge/registry/m3c-w3-wrangler-successor-reconciliation-v2.json');
  assert.equal(next.status, 'ENGINEERING_RECONCILIATION');
  assert.equal(next.predecessor, predecessorPath);
  assert.equal(await sha(predecessorPath), next.predecessorSha256);
  assert.equal(next.previousPath, 'content/knowledge/registry/m3c-w3-wrangler-before-read-only-v2.jsonc');
  assert.equal(next.previousSha256, predecessor.successor.wranglerSha256);
  assert.equal(await sha(next.previousPath), next.previousSha256);
  assert.deepEqual(next.allowedVars, {PHIOS_D1_MAINTENANCE_MODE: 'READ_ONLY'});
  for (const flag of ['productionActivationVerified', 'deploymentExecuted', 'd1MutationExecuted']) assert.equal(next[flag], false);
  assert.equal(await sha('wrangler.jsonc'), next.successorSha256);
  const previous = await json(next.previousPath);
  assert.deepEqual(await json('wrangler.jsonc'), {...previous, vars: {...previous.vars, ...next.allowedVars}},
    'M3C Wrangler changes exceed registered read-only maintenance successor');
}
