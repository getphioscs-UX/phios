import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const dir='content/knowledge/book-vii/v2-cutover',pub='content/knowledge/public/successors/book-vii-v2-source-refresh-v1',records=[];
const env={...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true',NODE_OPTIONS:`${process.env.NODE_OPTIONS||''} --import=${pathToFileURL(path.resolve('scripts/lib/report-zero-cost-preload.mjs')).href}`};
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
for(const alias of ['knowledge:public:build','check:pages-build']){const r=spawnSync(`npm run ${alias}`,{shell:true,encoding:'utf8',env,maxBuffer:32*1024*1024});const log=`${dir}/final-${alias.replaceAll(':','-')}.log`;fs.writeFileSync(log,(r.stdout||'')+(r.stderr||''));records.push({command:`npm run ${alias}`,exitCode:r.status,log});assert.equal(r.status,0,log);console.log(`PASS final ${alias}`);}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),release=read(`${pub}/published-projection.json`),index=read(`${pub}/retrieval/fragments.json`);
assert.ok(release.projections.fragments.every(f=>index.records.some(i=>i.fragmentCode===f.fragmentCode&&i.digest===f.digest&&i.sourceDigest===f.sourceDigest)));
assert.equal(sha(`${pub}/published-projection.json`),sha(`.pages-output/${pub}/published-projection.json`));assert.equal(fs.existsSync('.pages-output/content/knowledge/book-vii/v2-cutover/verified-source-v2.json'),false);
fs.writeFileSync(`${dir}/final-projection-build-v1.json`,JSON.stringify({status:'PASS',records,indexFragmentSourceShaMatch:true,pagesPublishedReleaseShaMatch:true,privateV2Excluded:true,publishedReleaseSha256:sha(`${pub}/published-projection.json`),workerSha256:sha('.pages-output/_worker.js'),providerRequests:0},null,2)+'\n');
