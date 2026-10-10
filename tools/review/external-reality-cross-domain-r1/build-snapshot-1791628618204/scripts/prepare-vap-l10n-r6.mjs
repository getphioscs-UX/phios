import fs from 'node:fs';
import path from 'node:path';
import {
  REVIEW_PATH,
  REVIEW_TEMPLATE_PATH,
  writeR6Preflight
} from './lib/visual-article-production/vap-l10n-r6-production-browser-acceptance-v1.mjs';

const result = writeR6Preflight();
console.log(`VAP-L10N-R6 preflight: ${result.status}`);
console.log(`Production: ${result.productionOrigin}${result.href}`);
if (!fs.existsSync(REVIEW_PATH)) {
  console.log(`Next: copy ${REVIEW_TEMPLATE_PATH} -> ${REVIEW_PATH} only after testing the deployed production pages in both locales.`);
} else {
  console.log(`Browser review exists: ${REVIEW_PATH}`);
}
