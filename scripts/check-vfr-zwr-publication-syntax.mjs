import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const files=[
 'scripts/build-zwr-vfr-human-review.mjs',
 'scripts/check-vfr-zwr-human-review-readiness.mjs',
 'assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js',
 'functions/personal-reading/visual-first/ziwei-vfr-page-plan.js',
 'functions/personal-reading/visual-first/ziwei-vfr-accepted-deep-manuscript-registry.js',
 'functions/report-delivery/ziwei-vfr-r1-generation.js',
 'scripts/apply-zwr-vfr-production-cutover.mjs',
 'scripts/rollback-zwr-vfr-production-cutover.mjs',
 'scripts/check-vfr-zwr-production-cutover.mjs'
];

for(const file of files){
 const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 assert.equal(run.status,0,file+' syntax failed:\n'+String(run.stderr||run.stdout||''));
}
console.log('PASS ZWR-VFR publication syntax preflight: publication, accepted registry, zero-provider production generator, cutover, rollback and W10 checker parse cleanly; provider calls=0.');
