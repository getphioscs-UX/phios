import {spawnSync} from 'node:child_process';

const checks=[
  'scripts/check-hd-pro-r3-w0-current-authority.mjs',
  'scripts/check-hd-pro-r3-w1-semantic-coverage.mjs',
  'scripts/check-hd-pro-r3-w2-source-authority.mjs',
  'scripts/check-hd-pro-r3-w3-claim-ir.mjs',
  'scripts/check-hd-pro-r3-w3r-report-blueprint.mjs',
  'scripts/check-hd-pro-r3-w4-type-semantic-corpus.mjs',
  'scripts/check-hd-pro-r3-w5-authority-semantic-corpus.mjs',
  'scripts/check-hd-pro-r3-w6-profile-semantic-corpus.mjs',
  'scripts/check-hd-pro-r3-w7-center-semantic-corpus.mjs',
  'scripts/check-hd-pro-r3-w8-channel-semantic-corpus.mjs',
  'scripts/check-hd-pro-r3-w9-gate-semantic-corpus.mjs',
  'scripts/check-hd-pro-r3-w10-definition-integration.mjs',
  'scripts/check-hd-pro-r3-w11-variable-phs.mjs',
  'scripts/check-hd-pro-r3-w12-composition.mjs',
  'scripts/check-hd-pro-r3-w13-semantic-precedence-dedup.mjs'
];

for(const check of checks){
  const r=spawnSync(process.execPath,[check],{stdio:'inherit'});
  if(r.status!==0) process.exit(r.status??1);
}

console.log('✓ HD-PRO-R3 W0-W13 aggregate passed.');
console.log('  R2 remains CUSTOMER_PUBLISHED; R3 now has source-admitted professional semantics through Variable/PHS, a governed composition engine, and deterministic semantic precedence/dedup, while machine campaign, new R3 human acceptance and customer cutover remain pending.');
