import fs from 'node:fs';
import {W28_PATH,W29_PATH,buildW29,writeJson} from './lib/visual-article-production/production-visual-acceptance-freeze-v1.mjs';
const root=process.cwd(); const w28=JSON.parse(fs.readFileSync(W28_PATH,'utf8')); const record=buildW29({root,w28});
if(record.status!=='FROZEN') throw new Error('VAP_W29_REQUIRES_ACCEPTED_W28_INTERACTIVE_BROWSER_EVIDENCE');
await writeJson(root,W29_PATH,record); console.log('✓ VAP-W29 First Visual Article frozen.');
