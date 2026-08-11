import { buildProductionBrief, parseArgs, persistBrief } from './lib/car-production/car-production-v1.mjs';
const { positional, options } = parseArgs(process.argv.slice(2));
const nodeCode = positional[0];
if (!nodeCode || !options.type) throw new Error('USAGE: npm run car:build-brief -- <NODE> --type mechanism_diagram|hero_illustration --locale zh-Hans');
const { brief, kind, meaningMode } = buildProductionBrief({ nodeCode, type: options.type, locale: options.locale || 'zh-Hans' });
const relative = await persistBrief({ brief });
console.log(JSON.stringify({ status:'BUILT', briefCode:brief.briefCode, briefDigest:brief.briefDigest, assetType:brief.assetType, productionKind:kind.kind, meaningAuthorityMode:meaningMode, output:relative }, null, 2));
