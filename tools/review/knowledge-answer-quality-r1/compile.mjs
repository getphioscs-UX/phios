import {build} from 'esbuild';import fs from 'node:fs';
const entry='functions/_lib/knowledge-answer-quality-local.js';
const result=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
fs.writeFileSync('tools/review/knowledge-answer-quality-r1/COMPILE.json',JSON.stringify({at:new Date().toISOString(),entry,exitCode:0,write:false,bytes:result.outputFiles[0].contents.length,productionBuildOrDeploy:false},null,2));console.log('Local candidate bundle PASS; no output written to production.');
