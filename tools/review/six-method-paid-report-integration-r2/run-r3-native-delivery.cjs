const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{spawnSync}=require('node:child_process');
const base='D:/PHIOS/QA-TEMP/SIX-METHOD-R2',stat=fs.statfsSync(base,{bigint:true});if(stat.bavail*stat.bsize<50000000000n)throw Error('D_SPACE_REQUIREMENT');
const root=path.join(base,'r3-native-delivery-'+Date.now());fs.mkdirSync(root);const outfile=path.join(root,'delivery.mjs');
createRequire('C:/phios/package.json')('esbuild').buildSync({entryPoints:[path.join(__dirname,'check-r3-native-delivery.mjs')],outfile,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const env={...process.env,PHIOS_R3_QA_RUN:root,TEMP:root,TMP:root,NODE_COMPILE_CACHE:path.join(root,'node-cache'),REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true'};
for(const k of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(k))delete env[k];
const r=spawnSync(process.execPath,['--import','file:///C:/phios/scripts/lib/report-zero-cost-preload.mjs',outfile],{cwd:path.resolve(__dirname,'../../..'),env,encoding:'utf8',timeout:300000,maxBuffer:3000000});
fs.writeFileSync(root+'/stdout.log',r.stdout||'');fs.writeFileSync(root+'/stderr.log',r.stderr||'');console.log(JSON.stringify({root,exitCode:r.status}));if(r.status!==0){console.error(r.stderr);if(r.error)console.error(r.error);process.exit(r.status||1);}console.log(r.stdout);
