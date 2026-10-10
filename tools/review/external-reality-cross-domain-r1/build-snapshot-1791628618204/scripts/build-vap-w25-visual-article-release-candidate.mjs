import { writeVisualArticleReleaseCandidate } from './lib/visual-article-production/article-release-v1.mjs';
const [nodeCode = 'KN-PREFACE-001', locale = 'zh-Hans'] = process.argv.slice(2).filter(value => !value.startsWith('--'));
const output = await writeVisualArticleReleaseCandidate({ nodeCode, locale });
console.log(JSON.stringify({ status: output.candidate.status, output: output.path, blockers: output.candidate.blockers }, null, 2));
