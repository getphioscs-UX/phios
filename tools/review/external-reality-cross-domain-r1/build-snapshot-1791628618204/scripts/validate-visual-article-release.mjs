import { buildVisualArticleReleaseCandidate, validateVisualArticleReleaseCandidate } from './lib/visual-article-production/article-release-v1.mjs';
const args = process.argv.slice(2); const nodeCode = args[0] || 'KN-PREFACE-001';
const localeIndex = args.indexOf('--locale'); const locale = localeIndex >= 0 ? args[localeIndex + 1] : 'zh-Hans';
const candidate = buildVisualArticleReleaseCandidate({ nodeCode, locale });
validateVisualArticleReleaseCandidate(candidate, { requireReady: false });
console.log(JSON.stringify({ status: candidate.status, gates: candidate.gates, blockers: candidate.blockers }, null, 2));
