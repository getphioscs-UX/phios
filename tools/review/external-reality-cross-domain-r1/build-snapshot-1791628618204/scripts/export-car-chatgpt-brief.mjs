import { exportChatGptBrief, parseArgs } from './lib/car-production/car-production-v1.mjs';
const { positional } = parseArgs(process.argv.slice(2)); const briefCode = positional[0];
if (!briefCode) throw new Error('USAGE: npm run car:export-chatgpt -- <CAB-CODE>');
const result = await exportChatGptBrief({ briefCode });
console.log(JSON.stringify({ status:'EXPORTED', briefCode, outputDirectory:result.outputDirectory, chatgptBriefDigest:result.intake.chatgptBriefDigest, candidateOnly:true, publicationAuthority:false }, null, 2));
