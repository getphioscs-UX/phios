import fs from 'node:fs';
import {refreshMasterOwnerTruth} from './lib/master-owner-truth.mjs';
const truth=refreshMasterOwnerTruth(),dir='content/production-closure/live-customer-commercial-convergence';
const work=JSON.parse(fs.readFileSync(dir+'/MASTER-WORK-STATE.json','utf8'));
const rows=['# 唯一 Master W00–W40 当前进度',`HEAD: ${truth.currentHead}`,'','|阶段|SOURCE|DEPLOYED|LIVE CUSTOMER|下一步|','|---|---|---|---|---|',...work.items.map(w=>`|${w.id} ${w.title}|${w.gates.SOURCE}|${w.gates.DEPLOYED}|${w.gates.LIVE_CUSTOMER}|${w.nextStep}|`),'','W13/W14/W15 layered states, W38 nodes and W39 counts: MASTER-OWNER-TRUTH.json.'];
fs.writeFileSync(dir+'/MASTER-PROGRESS-REPORT.md',rows.join('\n')+'\n');
console.log(JSON.stringify({head:truth.currentHead,W39:{...truth.W39,items:undefined},journeyStops:truth.W38.map(j=>[j.Journey,j.FIRST_STOP_NODE]),soleReview:'MASTER-HUMAN-REVIEW.html'}));