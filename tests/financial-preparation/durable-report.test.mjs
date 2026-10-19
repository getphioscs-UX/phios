import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import path from 'node:path';
test('three independent processes resume stored candidate then reopen the same durable artifact without provider dispatch',()=>{
 const root=path.resolve('.tmp',`finance-durable-${Date.now()}-${process.pid}`);
 for(const mode of ['prepare','resume','open']){const r=spawnSync(process.execPath,['tests/financial-preparation/durable-report-worker.mjs',mode,root],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert(r.stdout.includes(mode==='prepare'?'RETRYABLE_CANDIDATE_DURABLE':mode==='resume'?'ACCOUNT_AVAILABLE_NEW_PROCESS':'OPENED_SAME_ARTIFACT_THIRD_PROCESS'));}
});
