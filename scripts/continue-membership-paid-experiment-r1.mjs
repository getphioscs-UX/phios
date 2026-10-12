import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const root='tools/review/membership-ask-credit-r1',sha=b=>createHash('sha256').update(b).digest('hex'),grant=JSON.parse(fs.readFileSync(root+'/PAID-EXPERIMENT-OWNER-GRANT.json'));
if(sha(fs.readFileSync(root+'/EXECUTABLE-REQUESTS.json'))!==grant.requestManifestSha256)throw Error('FROZEN_REQUESTS_CHANGED');
const ledger=JSON.parse(fs.readFileSync(root+'/PAID-EXPERIMENT-LEDGER.json'));if(ledger.entries.length!==2||ledger.entries.some(e=>e.providerStatus!=='completed'||!e.actualOutput||e.actualMicroUSD===null))throw Error('FIRST_PAIR_NOT_COMPLETED_OR_METERED');
const files=['scripts/run-membership-knowledge-experiment-r1.mjs','functions/personal-reading/continuity/membership-model-request.js','functions/provider-cost/knowledge-llm-experiment-budget.js'];const manifest=[];
for(const file of files){const target=root+'/FROZEN-RUNTIME/'+file,bytes=fs.readFileSync(file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);manifest.push({original:file,frozen:target,sha256:sha(bytes)});}
fs.writeFileSync(root+'/FROZEN-RUNTIME-IDENTITY.json',JSON.stringify({manifest,firstPairReview:{transport:'PASS',usageCost:'PASS',semanticSupport:'REVIEWED_AGAINST_NATIVE_ARGUMENT',literalCitation:'FAIL_LAYOUT_NEWLINE_NORMALIZATION; NOT_PROMOTED_TO_DELIVERY_PASS'},instrumentationCorrection:'Single final integer rounding; first-pair original metering retained; no question/source/prompt changes',paidAuthorization:grant.authority},null,2)+'\n');
for(let index=2;index<20;index++){
 for(const item of manifest)if(sha(fs.readFileSync(item.frozen))!==item.sha256)throw Error('FROZEN_RUNTIME_MUTATION');
 const result=spawnSync(process.execPath,[root+'/FROZEN-RUNTIME/scripts/run-membership-knowledge-experiment-r1.mjs',root+'/PAID-EXPERIMENT-OWNER-GRANT.json',String(index)],{encoding:'utf8',env:process.env,maxBuffer:1024*1024});process.stdout.write(result.stdout||'');if(result.status!==0){process.stderr.write(result.stderr||'');throw Error('EXPERIMENT_STOPPED_NO_RETRY');}
}
