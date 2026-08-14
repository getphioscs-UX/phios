import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildR6Preflight,
  PREFLIGHT_PATH,
  digest
} from './lib/visual-article-production/vap-l10n-r6-production-browser-acceptance-v1.mjs';

const built = buildR6Preflight();
assert.equal(built.status, 'READY_FOR_PRODUCTION_BROWSER_REVIEW');
assert(Object.values(built.gates).every(Boolean));
assert.equal(built.localEvidence.r5Accepted, true);
assert.equal(built.localEvidence.r5Frozen, true);
assert.equal(built.localEvidence.samePhysicalFigure, true);
assert.equal(built.localEvidence.moduleContractValid, true);
assert.equal(built.governance.browserReviewCannotBeAutoApproved, true);
const copy = { ...built }; delete copy.preflightDigest;
assert.equal(built.preflightDigest, digest(copy));
if (fs.existsSync(PREFLIGHT_PATH)) {
  const recorded = JSON.parse(fs.readFileSync(PREFLIGHT_PATH, 'utf8'));
  assert.equal(recorded.status, 'READY_FOR_PRODUCTION_BROWSER_REVIEW');
}
console.log('✓ VAP-L10N-R6 local preflight passed.');
console.log('✓ R5 remains frozen and unmodified; both locale projections and shared figure are ready for production browser review.');
