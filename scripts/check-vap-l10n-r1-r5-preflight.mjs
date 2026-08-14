import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, PATHS, containsCjk, buildR1Candidate, buildR2Projection,
  buildR3Presentation, buildR4Candidate, buildR5Preflight, readJson
} from './lib/visual-article-production/vap-l10n-r1-r5-v1.mjs';

const expected = {
  r1: buildR1Candidate(ROOT),
  r2: buildR2Projection(ROOT, { active: false }),
  r3: buildR3Presentation(ROOT, { active: false }),
  r4: buildR4Candidate(ROOT),
  r5: buildR5Preflight(ROOT)
};
const files = [
  [PATHS.successorAuthorityCandidate, expected.r1],
  [PATHS.carProjectionCandidate, expected.r2],
  [PATHS.cprPresentationCandidate, expected.r3],
  [PATHS.visualArticleCandidate, expected.r4],
  [PATHS.r5Preflight, expected.r5]
];
for (const [relative, value] of files) {
  assert.equal(fs.existsSync(path.join(ROOT, relative)), true, `missing ${relative}`);
  assert.deepEqual(readJson(ROOT, relative), value);
}
assert.equal(containsCjk(JSON.stringify(readJson(ROOT, PATHS.repair).article)), false);
assert.equal(expected.r2.physicalMedia.sharedPhysicalMedia, true);
assert.equal(expected.r2.physicalMedia.binaryDuplicated, false);
assert.equal(expected.r3.presentationIdentity, 'PRESENTATION-ARTICLE-KN-PREFACE-001');
assert.equal(expected.r4.article.slug, 'ai-formation-from-civilizational-capability');
assert.equal(Object.entries(expected.r5.gates).filter(([key]) => !key.startsWith('human')).every(([,value]) => value === true), true);
console.log('✓ VAP-L10N-R1–R5 production lane preflight passed.');
console.log(`✓ Human gate state: ${expected.r1.status}.`);
console.log('✓ No predecessor authority mutation, no figure regeneration, no duplicate WebP, and no alternate /en article route are introduced.');
