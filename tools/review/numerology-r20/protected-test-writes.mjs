import fs from'node:fs';import path from'node:path';
const original=fs.writeFileSync.bind(fs),known=path.resolve('content/professional/num-production/customer/evidence/num-cx-w14-machine-campaign-evidence-v1.json'),redirect=path.resolve('tools/review/numerology-r20/num-cx-w14-current-evidence.json');
fs.writeFileSync=function(file,...args){const p=path.resolve(String(file));if(p===known)return original(redirect,...args);if(!p.startsWith(path.resolve('tools/review/numerology-r20')+path.sep))throw Error('NUM_R20_SHARED_TEST_WRITE_BLOCKED:'+p);return original(file,...args);};
