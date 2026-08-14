import fs from 'node:fs';
import path from 'node:path';
import { APS2_DEFAULT_OUTPUT, buildArticleReadiness, stableJson } from './lib/article-simplification/single-readiness-v1.mjs';

const root = process.cwd();
const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const bookCode = valueAfter('--book') || 'BOOK-1';
const locale = valueAfter('--locale') || 'zh-Hans';
const explicitOutput = valueAfter('--output');
const defaultOutput = bookCode === 'BOOK-1' && locale === 'zh-Hans'
  ? APS2_DEFAULT_OUTPUT
  : `content/production/article-simplification/readiness/${bookCode.toLowerCase()}.${locale}.article-readiness.v1.json`;
const output = explicitOutput || defaultOutput;
const readiness = buildArticleReadiness(root, { bookCode, locale });
fs.mkdirSync(path.dirname(path.join(root, output)), { recursive: true });
fs.writeFileSync(path.join(root, output), stableJson(readiness), 'utf8');
console.log(`✓ APS-2 Single Readiness built: ${output}`);
console.log(`✓ ${readiness.summary.readyCount}/${readiness.summary.evaluatedCount} nodes are ARTICLE_READY for ${bookCode} ${locale}.`);
console.log('✓ Derived projection only; no Human, C2/C3, Candidate, Provider or Publication authority was created.');
