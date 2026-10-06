import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const files=[
 'scripts/build-zwr-vfr-human-review.mjs',
 'scripts/check-vfr-zwr-human-review-readiness.mjs',
 'assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js',
 'functions/personal-reading/visual-first/ziwei-vfr-page-plan.js'
];

for(const file of files){
 const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 assert.equal(run.status,0,file+' syntax failed:\n'+String(run.stderr||run.stdout||''));
}
console.log('PASS ZWR-VFR publication syntax preflight: builder, readiness checker, renderer and page plan parse cleanly; provider calls=0.');
