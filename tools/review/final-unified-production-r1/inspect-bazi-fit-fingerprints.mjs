import fs from 'node:fs';import crypto from 'node:crypto';
const wt='C:/phios/.worktrees/final-unified-production-r1',root='docs/acceptance/bazi-paid-report/deep-manuscript-r2/',h=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const mode of ['BILINGUAL','EN','ZH_HANS']){const r=JSON.parse(fs.readFileSync(wt+'/'+root+'fit-closure/'+mode+'-FIT-RECEIPT.json'));console.log(JSON.stringify({mode,all:r.renderFingerprints.map(f=>({...f,actual:h(fs.readFileSync(wt+'/'+f.path))})).filter(f=>f.sha256!==f.actual)}));}
