import { releaseVisualArticle } from './lib/visual-article-production/article-release-v1.mjs';
const args = process.argv.slice(2); const nodeCode = args[0] || 'KN-PREFACE-001';
const localeIndex = args.indexOf('--locale'); const locale = localeIndex >= 0 ? args[localeIndex + 1] : 'zh-Hans';
releaseVisualArticle({ nodeCode, locale });
