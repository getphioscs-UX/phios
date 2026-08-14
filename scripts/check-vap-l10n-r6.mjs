import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ACCEPTANCE_PATH,
  REVIEW_PATH,
  digest
} from './lib/visual-article-production/vap-l10n-r6-production-browser-acceptance-v1.mjs';

assert.equal(fs.existsSync(REVIEW_PATH), true, 'TL browser review is required before strict R6 acceptance.');
assert.equal(fs.existsSync(ACCEPTANCE_PATH), true, 'Run npm run vap:l10n:r6:accept before the strict checker.');
const value = JSON.parse(fs.readFileSync(ACCEPTANCE_PATH, 'utf8'));
assert.equal(value.work, 'VAP-L10N-R6');
assert.equal(value.status, 'ACCEPTED_PRODUCTION_BROWSER');
assert.equal(value.testedDeployment.fullShaValid, true);
assert.equal(value.testedDeployment.ancestorOfAcceptanceHead, true);
assert.equal(value.humanReviewAccepted, true);
assert.equal(value.upstream.r5FreezeMutated, false);
assert.equal(value.governance.r1ToR5AuthorityMutationAllowed, false);
assert.equal(value.governance.r5FreezeMutationAllowed, false);
assert(Object.values(value.acceptance).every(Boolean));
for (const key of [
  'routeShell', 'manifestHttp200', 'zhArticleHttp200', 'enArticleHttp200', 'figureHttp200',
  'figureWebpSignatureValid', 'zhRendererContractValid', 'enRendererContractValid',
  'sameRouteManifest', 'samePhysicalFigure', 'liveModuleContractValid'
]) {
  const evidence = value.automatedEvidence;
  if (key === 'routeShell') {
    assert.equal(evidence.routeShell.zhHans, true);
    assert.equal(evidence.routeShell.en, true);
  } else {
    assert.equal(evidence[key], true, `Production evidence failed: ${key}`);
  }
}
const copy = { ...value }; delete copy.acceptanceDigest;
assert.equal(value.acceptanceDigest, digest(copy));
const checker = fs.readFileSync('scripts/check-vap-l10n-r6.mjs', 'utf8');
assert.equal(/fs\.(?:writeFileSync|writeFile|rename|mkdir)\s*\(/.test(checker), false);
console.log('✓ VAP-L10N-R6 Production Browser Acceptance passed.');
console.log(`✓ Tested deployment: ${value.testedDeployment.commitSha}`);
console.log('✓ Same route renders zh-Hans and English with the same physical figure and consistent published article presentation.');
