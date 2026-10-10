import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const dir='content/production-closure/live-customer-commercial-convergence',head=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
const checks=[];
for(const [script,stages] of [['scripts/check-controlled-purchase-integration.mjs',['W07','W33','W35','W36']],['scripts/check-commerce-stripe-r1.mjs',['W33','W36']]]){
 const r=spawnSync(process.execPath,['--import','./scripts/lib/report-zero-cost-preload.mjs',script],{encoding:'utf8',maxBuffer:8*1024*1024});const log=`MASTER-${script.split('/').pop()}.log`;fs.writeFileSync(`${dir}/${log}`,(r.stdout||'')+(r.stderr||''));checks.push({script,stages,head,sourceSHA256:createHash('sha256').update(fs.readFileSync(script)).digest('hex'),result:r.status===0?'PASS':'FAIL',scope:'LOCAL_SQL_AND_INJECTED_STRIPE_NOT_CUSTOMER_DELIVERY',log});
}
const precheckLog=`${dir}/MASTER-CURRENT-PRECHECK.log`;
if(fs.existsSync(precheckLog)&&fs.readFileSync(precheckLog,'utf8').includes('EPERM'))checks.push({script:'node scripts/run-zero-cost-regression.mjs precheck',stages:['W36'],head,result:'FAIL',scope:'BOOK_I_SYNCHRONIZER_FIXTURE_TEMP_RENAME_EPERM_NOT_PRODUCT_PASS',log:'MASTER-CURRENT-PRECHECK.log'});
fs.writeFileSync(`${dir}/MASTER-CURRENT-ZERO-COST-CHECKS.json`,JSON.stringify({head,createdAt:new Date().toISOString(),providerCalls:0,realPayments:0,checks},null,2)+'\n');if(checks.some(c=>c.result==='FAIL'))process.exitCode=1;
