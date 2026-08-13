import fs from 'node:fs';
import path from 'node:path';
import {REVIEW_PATH,W28_PATH,W29_PATH,buildW28,buildW29,collectProductionEvidence,writeJson} from './lib/visual-article-production/production-visual-acceptance-freeze-v1.mjs';
const root=process.cwd(); const i=process.argv.indexOf('--browser-review'); const reviewPath=i>=0?process.argv[i+1]:REVIEW_PATH;
const browserReview=fs.existsSync(path.join(root,reviewPath))?JSON.parse(fs.readFileSync(path.join(root,reviewPath),'utf8')):null;
const evidence=await collectProductionEvidence({root}); const record=buildW28({root,evidence,browserReview}); await writeJson(root,W28_PATH,record);
await writeJson(root,W29_PATH,buildW29({root,w28:record}));
console.log(`✓ VAP-W28 ${record.status}; automated production evidence ${evidence.allAutomatedPassed?'passed':'failed'}.`);
if(record.status!=='ACCEPTED') console.log(`  TL interactive browser acceptance required at ${REVIEW_PATH}.`);
