import { runPackageB } from './lib/knowledge-runtime/knr-package-b-v1.mjs';
const args = process.argv.slice(2);
const localeArg = args.find(value => value.startsWith('--locale='));
const modeArg = args.find(value => value.startsWith('--mode='));
const query = args.filter(value => !value.startsWith('--')).join(' ').trim();
if (!query) {
  console.error('USAGE: npm run knowledge:project:published -- "<query>" --locale=zh-Hans --mode=auto');
  process.exit(1);
}
const result = await runPackageB(query, localeArg?.slice(9) || 'zh-Hans', modeArg?.slice(7) || 'auto');
console.log(JSON.stringify(result, null, 2));
