import fs from 'node:fs';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
import {validateHistoricalRentalObservation} from './lib/finance-historical-rental-observation.mjs';
const root='tools/review/financial-publication-r3-1';const files=fs.readdirSync('tests/financial-preparation').filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/financial-preparation/'+f);
const result=spawnSync(process.execPath,['--import','./scripts/p9-d1i1-json-loader.mjs','--test','--test-reporter=tap',...files],{encoding:'utf8',maxBuffer:8*1024*1024});
fs.writeFileSync(`${root}/financial-regression.tap`,result.stdout+result.stderr);
const historical=validateHistoricalRentalObservation(result.stdout,result.status);assert(historical.pass,JSON.stringify(historical));
const observedTests=Number(result.stdout.match(/^# tests (\d+)/m)?.[1]),pass=Number(result.stdout.match(/^# pass (\d+)/m)?.[1]),fail=Number(result.stdout.match(/^# fail (\d+)/m)?.[1]);assert.equal(fail,5);
const unchangedFiles=['tests/financial-preparation/finance-tools.test.mjs','tests/financial-preparation/portfolio-successor.test.mjs','functions/financial/calculation-runtime/customer-finance-tools.js','functions/financial/calculation-runtime/rental-metric-semantics-v2.js','functions/financial/calculation-runtime/rental-fact-metadata.js','functions/api/customer-finance-tools.js'];
const diff=spawnSync('git',['diff','--name-only','--',...unchangedFiles],{encoding:'utf8'});assert.equal(diff.status,0);assert.equal(diff.stdout.trim(),'');
const output={status:'PASS_NO_NEW_FAILURES_EXACT_REVIEWED_HISTORICAL_FIVE',rawExitCode:result.status,observedTests,pass,fail,knownHistoricalExceptions:historical.failures,unchangedFiles,providerCalls:0};fs.writeFileSync(`${root}/regression-verification.json`,JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({status:output.status,observedTests,pass,fail}));

