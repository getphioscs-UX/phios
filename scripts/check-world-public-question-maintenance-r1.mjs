import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {parseWorldQuestion,worldQuestionTarget,worldCountryProfileURL} from '../assets/js/pages/civilization-atlas/world-journey-state-r3.js';
import {countryEvidenceCoverage} from '../functions/_lib/world-country-evidence.js';

for(const question of ['Compare BaZi and Zi Wei differences','我的公司如何扣税','What can my company deduct?'])assert.equal(worldQuestionTarget(question),null);
const comparison=parseWorldQuestion('Compare Malaysia and Singapore economy');
assert.deepEqual(comparison.requestedComparison,['MYS','SGP']);
const time=parseWorldQuestion('Compare Malaysia economy in 2023 and 2024');
assert.equal(time.requestedJourney,'now');assert.deepEqual(time.requestedComparison,[]);
assert.equal(time.requestedPeriod.start,2023);assert.equal(time.requestedPeriod.end,2024);
const previous=parseWorldQuestion('Malaysia economy in 2024');
const followup=parseWorldQuestion('compare with last year',{previous});
assert.equal(followup.resolvedCountryCode,'MYS');assert.deepEqual(followup.requestedComparison,[]);
assert.equal(followup.requestedPeriod.start,2023);assert.equal(followup.requestedPeriod.end,2024);
assert.equal(parseWorldQuestion('Malaysia economy latest').requestedPeriod.kind,'LATEST_REQUESTED');
assert.equal(parseWorldQuestion('Malaysia economy').requestedPeriod,null);
assert.equal(new URL(worldQuestionTarget('Malaysia economy').href,'https://local').hash.includes('year='),false);
assert.equal(parseWorldQuestion('What is my bank balance?'),null);
const profile=new URL(worldCountryProfileURL(previous),'https://local');
assert.equal(profile.searchParams.get('q'),previous.originalQuestion);assert.equal(profile.searchParams.get('year'),'2024');
const pointer=JSON.parse(fs.readFileSync('content/world/world-country-public-evidence-current.json'));
const coverage=countryEvidenceCoverage(JSON.parse(fs.readFileSync(pointer.snapshotPath)));
assert.ok(coverage.length>170);
assert.deepEqual(coverage.filter(c=>c.state!=='OUTSIDE_NATIVE_DATA_COVERAGE').map(c=>c.countryCode).sort(),['IDN','MYS','SGP']);
assert.ok(coverage.filter(c=>c.state==='OUTSIDE_NATIVE_DATA_COVERAGE').every(c=>c.validIndicators===0));
await build({entryPoints:[
  'assets/js/pages/civilization-atlas/world-journey-shell-r3.js',
  'assets/customer-ui/js/surfaces/profile-country-r1.js',
  'functions/profile/public-country-profile-r1.js'
],bundle:true,platform:'neutral',format:'esm',outdir:'.tmp/world-maintenance-compile',write:false,logLevel:'silent'});
console.log('PASS World public question maintenance: bounded routing, explicit/relative periods, private-query denial, source coverage and current module compilation.');
