import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PACKAGE_TYPE,
  PACKAGE_SCHEMA_VERSION,
  sha256,
  bindFinalPackageDigest,
  computeFinalPackageDigest,
  validateCompletePublicationPackage,
  verifyFinalPackageDigest,
  isFinalApprovalCurrent
} from './lib/bilingual-final-approval/bfa-package-v1.mjs';

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const contract = readJson('content/production/bilingual-final-approval/contracts/bfa-complete-publication-package-contract-v1.json');
const schema = readJson('content/production/bilingual-final-approval/schemas/bfa-complete-publication-package-v1.schema.json');
const approvalContract = readJson('content/production/bilingual-final-approval/contracts/bfa-final-approval-authority-contract-v1.json');

assert.equal(contract.work, 'BFA-W1');
assert.equal(contract.packageType, PACKAGE_TYPE);
assert.equal(contract.baselineCommit, 'dcfcc7685aa31c6af4a32e77022365a01847493b');
for (const required of [
  'canonicalAuthority', 'pjaBrief', 'locales.zh-Hans', 'locales.en', 'localeIdentity', 'sameRouteIdentity',
  'figure', 'automaticEvidence', 'presentationPreview', 'publicationReadiness', 'finalPackageDigest'
]) assert.ok(contract.requiredComponents.includes(required), `Missing package component: ${required}`);
assert.equal(contract.digestContract.algorithm, 'sha256');
assert.equal(contract.approvalBinding.mustBindExactFinalPackageDigest, true);
assert.equal(contract.approvalBinding.digestMismatchState, 'STALE_REVIEW_REQUIRED');
assert.equal(contract.approvalBinding.priorApprovalMayBeReusedAfterDigestChange, false);
assert.equal(contract.governance.packageMayCreateCanonicalMeaning, false);
assert.equal(contract.governance.packageMayCreateArticleCandidate, false);
assert.equal(contract.governance.packageMayCreateFigureCandidate, false);
assert.equal(contract.governance.packageMayApproveCarAsset, false);
assert.equal(contract.governance.packageMayCreateCprPresentationAuthority, false);
assert.equal(contract.governance.packageMayPublish, false);
assert.equal(contract.governance.packageIsReviewAggregationNotAuthorityCollapse, true);

assert.equal(schema.$id, 'PHI-OS-BFA-COMPLETE-PUBLICATION-PACKAGE-v1');
for (const required of ['canonicalAuthority', 'pjaBrief', 'locales', 'localeIdentity', 'sameRouteIdentity', 'figure', 'automaticEvidence', 'presentationPreview', 'publicationReadiness', 'finalPackageDigest']) {
  assert.ok(schema.required.includes(required), `Schema missing required field: ${required}`);
}
assert.deepEqual(schema.properties.locales.required, ['zh-Hans', 'en']);

const d = (label) => sha256(label);
const sample = bindFinalPackageDigest({
  packageType: PACKAGE_TYPE,
  packageSchemaVersion: PACKAGE_SCHEMA_VERSION,
  packageCode: 'BFA-PACKAGE-KN-B1-P2-009-v1',
  batchCode: 'BATCH-002',
  nodeCode: 'KN-B1-P2-009',
  bookCode: 'BOOK-1',
  canonicalAuthority: {
    sourceDigest: d('canonical-authority'),
    authorityOwner: 'Canonical Knowledge Authority',
    authorityPath: 'content/knowledge/registry/nodes.json'
  },
  pjaBrief: {
    sourceDigest: d('pja-brief'),
    briefCode: 'BRIEF-KN-B1-P2-009-ZH-HANS-V1',
    briefDigest: d('brief-record')
  },
  locales: {
    'zh-Hans': {
      locale: 'zh-Hans',
      candidateCode: 'CANDIDATE-KN-B1-P2-009-ZH-HANS-V1',
      candidateDigest: d('zh-candidate'),
      article: {
        title: '为什么投影会产生偏向、失真、稳定与更新',
        summary: '中文摘要',
        bodyMarkdown: '中文正文'
      }
    },
    en: {
      locale: 'en',
      candidateCode: 'CANDIDATE-KN-B1-P2-009-EN-V1',
      candidateDigest: d('en-candidate'),
      article: {
        title: 'How Do Bias, Distortion, Stability, and Renewal Shape Projection?',
        summary: 'English summary',
        bodyMarkdown: 'English body'
      }
    }
  },
  localeIdentity: {
    sourceDigest: d('locale-identity'),
    identityDigest: d('identity-record'),
    locales: ['zh-Hans', 'en']
  },
  sameRouteIdentity: {
    sourceDigest: d('same-route'),
    slug: 'projection-bias-distortion-stability-and-renewal',
    href: '/articles/projection-bias-distortion-stability-and-renewal'
  },
  figure: {
    sourceDigest: d('figure-requirement-and-asset'),
    requirement: 'REQUIRED',
    asset: { mediaDigest: d('figure-media') },
    alt: 'Projection remains revisable through feedback.'
  },
  automaticEvidence: {
    sourceDigest: d('automatic-evidence'),
    state: 'PASS'
  },
  presentationPreview: {
    sourceDigest: d('presentation-preview'),
    desktopDigest: d('desktop-preview'),
    mobileDigest: d('mobile-preview')
  },
  publicationReadiness: {
    sourceDigest: d('publication-readiness'),
    state: 'READY_FOR_FINAL_APPROVAL'
  },
  assembledAt: '2026-08-17T08:45:00+08:00',
  reviewState: 'PENDING',
  decisionState: 'PENDING'
});

const validation = validateCompletePublicationPackage(sample);
assert.equal(validation.valid, true, validation.errors.join('\n'));
assert.match(sample.finalPackageDigest, /^[a-f0-9]{64}$/);
assert.equal(verifyFinalPackageDigest(sample), true);
assert.equal(sample.finalPackageDigest, computeFinalPackageDigest(sample));

// Operational state/timestamps do not invalidate a content-equivalent package.
const operationalOnly = structuredClone(sample);
operationalOnly.assembledAt = '2026-08-17T09:00:00+08:00';
operationalOnly.reviewState = 'OPENED';
operationalOnly.decisionState = 'PENDING_REVIEW';
assert.equal(computeFinalPackageDigest(operationalOnly), sample.finalPackageDigest);

// Every user-visible or authority-bearing package mutation must stale the old approval.
const mutationCases = [
  ['title', (x) => { x.locales.en.article.title += ' Revised'; }],
  ['body', (x) => { x.locales['zh-Hans'].article.bodyMarkdown += '\n变化'; }],
  ['figure', (x) => { x.figure.asset.mediaDigest = d('replacement-figure-media'); }],
  ['alt', (x) => { x.figure.alt = 'Revised alt.'; }],
  ['locale identity', (x) => { x.localeIdentity.identityDigest = d('replacement-locale-identity'); }]
];
for (const [label, mutate] of mutationCases) {
  const changed = structuredClone(sample);
  mutate(changed);
  assert.notEqual(computeFinalPackageDigest(changed), sample.finalPackageDigest, `${label} must change finalPackageDigest`);
  assert.equal(verifyFinalPackageDigest(changed), false, `${label} mutation must stale stored digest`);
}

const approval = {
  authorityType: approvalContract.authorityType,
  batchCode: sample.batchCode,
  nodeCode: sample.nodeCode,
  finalPackageDigest: sample.finalPackageDigest,
  decision: 'approve_for_publication',
  reviewerCode: 'TL'
};
assert.equal(isFinalApprovalCurrent(approval, sample), true);
const revised = structuredClone(sample);
revised.locales.en.article.bodyMarkdown += '\nRevised.';
const revisedBound = bindFinalPackageDigest(revised);
assert.notEqual(revisedBound.finalPackageDigest, sample.finalPackageDigest);
assert.equal(isFinalApprovalCurrent(approval, revisedBound), false, 'Old TL approval must become stale after package digest change');

// Fail closed when any mandatory package component is absent.
const incomplete = structuredClone(sample);
delete incomplete.presentationPreview;
const incompleteBound = bindFinalPackageDigest(incomplete);
const incompleteValidation = validateCompletePublicationPackage(incompleteBound);
assert.equal(incompleteValidation.valid, false);
assert.ok(incompleteValidation.errors.some((x) => x.startsWith('presentationPreview')));

console.log('✓ BFA-W1 Complete Publication Package Contract passed.');
console.log('✓ A package requires Canonical authority + PJA brief + zh-Hans/en Candidates + locale/same-route identity + Figure + evidence + CPR preview + readiness.');
console.log('✓ finalPackageDigest is deterministic and ignores only operational review timestamps/state.');
console.log('✓ Title/body/Figure/alt/locale-identity changes invalidate the digest and stale the prior TL Final Approval.');
console.log('✓ The package is review aggregation only: it creates no Canonical Meaning, Candidate, CAR approval, CPR authority or Publication authority.');
