const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const owner=path.resolve(__dirname,'../../..'),base='D:/PHIOS/QA-TEMP/SIX-METHOD-R2',stat=fs.statfsSync(base,{bigint:true});if(stat.bavail*stat.bsize<50_000_000_000n)throw Error('D_SPACE_REQUIREMENT');
const run=path.join(base,'r27-num-native-'+Date.now());fs.mkdirSync(run);const out=path.join(run,'native.mjs');
createRequire('C:/phios/package.json')('esbuild').buildSync({entryPoints:[path.join(__dirname,'check-r27-num-native.mjs')],outfile:out,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const env={...process.env,PHIOS_R27_QA_RUN:run,TEMP:run,TMP:run,NODE_COMPILE_CACHE:path.join(run,'node-cache'),REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true'};
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
const result=spawnSync(process.execPath,['--import','file:///C:/phios/scripts/lib/report-zero-cost-preload.mjs',out],{cwd:owner,env,encoding:'utf8',timeout:300000,maxBuffer:3*1024*1024});
fs.writeFileSync(run+'/stdout.log',result.stdout||'');fs.writeFileSync(run+'/stderr.log',result.stderr||'');console.log(JSON.stringify({run,exitCode:result.status}));if(result.status!==0){console.error(result.stderr);if(result.error)console.error(result.error.message);process.exit(result.status||1);}console.log(result.stdout);
