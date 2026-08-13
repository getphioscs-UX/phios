import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildReleasePhase, phasePaths, validateReleasePhase } from './lib/visual-article-production/release-phases-v1.mjs';
for (const work of ['w26','w27','w28','w29']) {
  const record = JSON.parse(fs.readFileSync(phasePaths[work], 'utf8')); assert.deepEqual(record, buildReleasePhase({ work })); validateReleasePhase(record);
  assert.equal(record.status, 'BLOCKED_BY_HUMAN_ASSET_REVIEW'); assert.equal(record.executionPerformed, false); assert.equal(record.governance.productionUrlCheckedBeforeRelease, false);
}
const source = fs.readFileSync('scripts/check-vap-w26-w29-release-gates.mjs', 'utf8');
for (const name of ['writeFileSync','writeFile','rename','mkdir','publish','deploy']) assert.equal(new RegExp(`(?:fs\\.)?${name}\\s*\\(`).test(source), false, `VAP_RELEASE_CHECKER_WRITER_FORBIDDEN:${name}`);
console.log('✓ VAP-W26–W29 gates exist and are canonically blocked by TL Human Asset Review.');
console.log('✓ No authority projection, publication build, production URL acceptance, deployment or freeze was executed.');
