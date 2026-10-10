import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='content/knowledge/structured/successors/master-a-v2-batch3';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const log='tools/review/MASTER-A-V2-A-BATCH-3-RELOCATION-FULL-CHECK.log';
const moved='tools/review/MASTER-A-V2-A-BATCH-3-VALIDATION-CAPTURE-R1-REGRESSION-REVIEW.html';
fs.writeFileSync(dir+'/relocation-validation-v1.json',JSON.stringify({status:'TARGETED_PASS_FULL_CHECK_FAILED',targetedCheck:{command:'node --import ./scripts/lib/report-zero-cost-preload.mjs scripts/check-pja-w2a-canonical-article-editorial-contract.mjs',exitCode:0},fullCheck:{command:'npm run check',finished:true,exitCode:1,log,logSha256:sha(log),blocker:'scripts/check-ziwei-natural-composer-r4.mjs:51',assertion:'binding.includes("ziwei-professional-synthesis-r5-generation.js")',postcheck:'NOT_RUN'},artifact:{path:moved,sha256:sha(moved),bytesUnchanged:true},knowledgeHtmlExemptionChanged:false,providerCalls:0,providerProtection:'Absolute inherited zero-cost preload; live provider disallowed',unrelatedZiweiBindingEdited:false,baziR2ImplementationOrPublicationEdited:false,commit:false,push:false,deploy:false,globalPassClaim:false},null,2)+'\n');
