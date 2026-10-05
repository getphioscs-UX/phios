import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='docs/reports/ziwei/vfr-r1',decision=String(process.argv[2]||'').toUpperCase();
if(decision!=='ACCEPT')throw Error('EXPLICIT_ACCEPT_REQUIRED');
for(const p of [root+'/LIVE-RESULT.json',root+'/LIVE-EVIDENCE.json','tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html'])if(!fs.existsSync(p))throw Error('ZWR_VFR_REVIEW_ARTIFACT_REQUIRED:'+p);
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const receipt={schemaVersion:'ZWR-VFR-R1-HUMAN-DECISION-v1',decision:'ACCEPT',acceptedAt:new Date().toISOString(),liveResultSha256:hash(root+'/LIVE-RESULT.json'),reviewHtmlSha256:hash('tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html'),scope:'Browser/print visual-first publication candidate only; no authority expansion; production cutover separately gated.'};
fs.writeFileSync(root+'/HUMAN-DECISION.json',JSON.stringify(receipt,null,2)+'\n');
console.log('HUMAN ACCEPT ZWR-VFR-R1 recorded. Production cutover is still not automatic.');
