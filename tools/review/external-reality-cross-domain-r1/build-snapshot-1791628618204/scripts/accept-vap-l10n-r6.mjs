import { writeR6Acceptance } from './lib/visual-article-production/vap-l10n-r6-production-browser-acceptance-v1.mjs';
const result = await writeR6Acceptance();
console.log(`VAP-L10N-R6 ${result.status}`);
console.log(`Production: ${result.productionOrigin}${result.href}`);
if (result.status === 'ACCEPTED_PRODUCTION_BROWSER') {
  console.log(`✓ Production browser acceptance digest: ${result.acceptanceDigest}`);
} else {
  console.log('R6 remains non-accepted. Inspect automated evidence and the TL browser review before retrying.');
  process.exitCode = 2;
}
