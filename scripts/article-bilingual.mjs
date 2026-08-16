import { advanceAbl } from './lib/article-bilingual-production/abl-v1.mjs';
const args=process.argv.slice(2);const ix=args.indexOf('--batch');const batchCode=ix>=0?args[ix+1]:'BATCH-001';
const result=await advanceAbl(process.cwd(),batchCode,{apply:true});
console.log(`✓ ABL ${batchCode}: ${result.status}`);
for(const [key,value] of Object.entries(result.summary||{})) console.log(`  ${key}: ${Array.isArray(value)?value.join(', '):value}`);
if(result.status==='AWAITING_TL_IDENTITY_REVIEW') console.log(`→ Fill content/production/article-simplification/bilingual/${batchCode}/identity-decisions.v1.json, then rerun article:bilingual.`);
if(result.status==='AWAITING_ENGLISH_CANDIDATE_AUTHORING') console.log(`→ Fill content/production/article-simplification/bilingual/${batchCode}/candidate-submissions.v1.json with independently authored English content, then rerun article:bilingual.`);
if(result.status==='AWAITING_TL_ENGLISH_REVIEW_APPROVAL_PUBLICATION') console.log(`→ Fill content/production/article-simplification/bilingual/${batchCode}/english-human-decisions.v1.json, then rerun article:bilingual.`);
if(result.status==='READY_FOR_ABL_5_PUBLICATION') console.log(`→ Run: npm run article:bilingual:publish -- --batch ${batchCode}`);
