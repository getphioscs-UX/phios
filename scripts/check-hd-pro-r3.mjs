import {spawnSync} from 'node:child_process';

const steps=[
  'scripts/check-hd-pro-r3-w0-current-authority.mjs',
  'scripts/check-hd-pro-r3-w1-semantic-coverage.mjs',
  'scripts/check-hd-pro-r3-w2-source-authority.mjs',
  'scripts/check-hd-pro-r3-w3-claim-ir.mjs',
  'scripts/check-hd-pro-r3-w3r-report-blueprint.mjs'
];

for(const script of steps){
  const result=spawnSync(process.execPath,[script],{stdio:'inherit'});
  if(result.status!==0) process.exit(result.status??1);
}

console.log('✓ HD-PRO-R3 W0-W3R aggregate passed.');
console.log('  R3 remains SHADOW_CANDIDATE; semantic production continues from W4 without changing R2 CUSTOMER_PUBLISHED authority.');
