import { freezeBrief, parseArgs, resolveBriefByCode, validateProductionBrief } from './lib/car-production/car-production-v1.mjs';
const { positional } = parseArgs(process.argv.slice(2)); const briefCode = positional[0];
if (!briefCode) throw new Error('USAGE: npm run car:validate-brief -- <CAB-CODE>');
const { brief } = resolveBriefByCode(process.cwd(), briefCode); const validation = validateProductionBrief({ brief }); const frozen = await freezeBrief({ brief });
console.log(JSON.stringify({ status:'VALIDATED_FROZEN', briefCode, briefDigest:brief.briefDigest, checks:validation.checks, meaningAuthorityMode:validation.meaningAuthorityMode, freeze:frozen.relative }, null, 2));
