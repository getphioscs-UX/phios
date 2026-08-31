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
  'scripts/check-hd-pro-r3-w13-semantic-precedence-dedup.mjs',
  'scripts/check-hd-pro-r3-w14-whole-chart-priority.mjs',
  'scripts/check-hd-pro-r3-w15-professional-reading-ir-v2.mjs',
  'scripts/check-hd-pro-r3-w16-customer-editorial.mjs',
  'scripts/check-hd-pro-r3-w17-reality-composition-v2.mjs',
  'scripts/check-hd-pro-r3-w18-relationship-composition.mjs',
  'scripts/check-hd-pro-r3-w19-epistemic-boundary.mjs',
  'scripts/check-hd-pro-r3-w20-machine-campaign.mjs',
  'scripts/check-hd-pro-r3-w21-benchmark.mjs',
  'scripts/check-hd-pro-r3-w22-human-review.mjs',
  'scripts/check-hd-pro-r3-w23-customer-renderer.mjs',
  'scripts/check-hd-pro-r3-w24-visual-reading.mjs',
  'scripts/check-hd-pro-r3-w25-production-cutover.mjs',
  'scripts/check-hd-pro-r3-w26-regression.mjs',
  'scripts/check-hd-pro-r3-w27-checker-architecture.mjs',
  'scripts/check-hd-pro-r3-w28-closure.mjs'
];

for(const check of checks){
  const r=spawnSync(process.execPath,[check],{stdio:'inherit'});
  if(r.status!==0) process.exit(r.status??1);
}

console.log('✓ HD-PRO-R3 W0-W28 aggregate passed.');
console.log('  R3 is CUSTOMER_PUBLISHED after 96/96 machine verification, 12/12 professional benchmark, fresh 24/24 R3 human acceptance, shared-host renderer/visual cutover and clean-overlay regression; R2 remains available as compatibility fallback.');
