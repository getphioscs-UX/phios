const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const owner=path.resolve(__dirname,'../../..'),base='D:/PHIOS/QA-TEMP/SIX-METHOD-R2';
const stat=fs.statfsSync(base,{bigint:true});if(stat.bavail*stat.bsize<50_000_000_000n)throw Error('D_SPACE_REQUIREMENT');
const run=path.join(base,'r25-source-boundaries-'+Date.now());fs.mkdirSync(run);
const esbuild=createRequire('C:/phios/package.json')('esbuild'),out=path.join(run,'test.mjs');
esbuild.buildSync({entryPoints:[path.join(__dirname,'check-r25-source-boundaries.mjs')],outfile:out,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const env={...process.env,PHIOS_R25_QA_RUN:run,TEMP:run,TMP:run,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true'};
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
const result=spawnSync(process.execPath,['--import','file:///C:/phios/scripts/lib/report-zero-cost-preload.mjs',out],{cwd:owner,encoding:'utf8',env,timeout:120000});
fs.writeFileSync(path.join(run,'stderr.log'),result.stderr||'');
if(result.status!==0){console.error(result.stderr);process.exit(result.status||1);}
const receipt=JSON.parse(result.stdout);fs.writeFileSync(path.join(run,'RESULT.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({run,status:receipt.status,passed:receipt.cases.length,providerCalls:receipt.providerCalls,pdfRenders:receipt.pdfRenders}));
