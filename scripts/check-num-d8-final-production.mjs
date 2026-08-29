import {execFileSync} from 'node:child_process';
const node=process.execPath;const run=script=>execFileSync(node,[script],{stdio:'inherit'});
run('scripts/check-num-d8-human-admission.mjs');
run('scripts/check-num-d1-d8.mjs');
run('scripts/check-num-d8-customer-cutover.mjs');
run('scripts/check-num-r18-final-production.mjs');
run('scripts/check-num-r1-r8.mjs');
run('scripts/check-cx-r12r4b-smr-num.mjs');
console.log('✓ NUM-D8 final production gate passed: human admission, depth runtime, default customer cutover, R18 predecessor compatibility, historical successor reconciliation, and SMR-NUM integration are all current.');
