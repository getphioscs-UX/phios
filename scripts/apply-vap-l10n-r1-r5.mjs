import { activateR1R5 } from './lib/visual-article-production/vap-l10n-r1-r5-v1.mjs';
try {
  const out = activateR1R5();
  console.log(`✓ VAP-L10N-R1 successor authority active: ${out.successorAuthority.authorityRecordCode}`);
  console.log(`✓ VAP-L10N-R2 EN CAR locale projection active: ${out.carProjection.projectionCode}`);
  console.log(`✓ VAP-L10N-R3 EN CPR production presentation active: ${out.presentation.presentationCode}`);
  console.log('✓ VAP-L10N-R4 EN visual article published into the visual release manifest.');
  console.log(`✓ VAP-L10N-R5 same-route locale runtime frozen: ${out.freeze.freezeDigest}`);
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
}
