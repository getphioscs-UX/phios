import { writeArticleReleaseExecution } from './lib/visual-article-production/article-release-execution-v1.mjs';
const output = writeArticleReleaseExecution();
console.log(`VAP-W26 ${output.authority.status}: ${output.authority.href}`);
console.log(`VAP-W27 ${output.website.status}: ${output.website.routePath}`);
