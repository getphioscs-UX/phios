import {spawnSync} from 'node:child_process';

const steps=[
  'scripts/check-hd-pro-r3-w0-current-authority.mjs',
  'scripts/check-hd-pro-r3-w1-semantic-coverage.mjs',
  'scripts/check-hd-pro-r3-w2-source-authority.mjs',
  'scripts/check-hd-pro-r3-w3-claim-ir.mjs',
  'scripts/check-hd-pro-r3-w3r-report-blueprint.mjs',
  'scripts/check-hd-pro-r3-w4-type-semantic-corpus.mjs',
  'scripts/check-hd-pro-r3-w5-authority-semantic-corpus.mjs',
  'scripts/check-hd-pro-r3-w6-profile-semantic-corpus.mjs'
];

for(const script of steps){
  const result=spawnSync(process.execPath,[script],{stdio:'inherit'});
  if(result.status!==0) process.exit(result.status??1);
}

console.log('✓ HD-PRO-R3 W0-W6 aggregate passed.');
console.log('  R3 remains SHADOW_CANDIDATE; Type, Authority and Profile semantic production are admitted through W6; composition and customer publication remain gated without changing R2 CUSTOMER_PUBLISHED authority.');
