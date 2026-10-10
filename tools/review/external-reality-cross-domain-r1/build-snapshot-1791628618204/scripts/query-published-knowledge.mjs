import { runPublishedRetrieval } from './lib/knowledge-runtime/knr-package-a-v1.mjs';
const args = process.argv.slice(2);
const query = args[0];
const localeArg = args.find(arg => arg.startsWith('--locale='));
const locale = localeArg ? localeArg.slice('--locale='.length) : 'zh-Hans';
if (!query) {
  console.error('USAGE: npm run knowledge:query:published -- "<query>" --locale=zh-Hans');
  process.exit(1);
}
const result = await runPublishedRetrieval(query, locale);
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
