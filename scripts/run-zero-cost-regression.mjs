import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const commands=JSON.parse(fs.readFileSync('config/reports/zero-cost-check-commands.json','utf8'));
const key=process.argv[2];if(!commands[key])throw Error('ZERO_COST_COMMAND_UNKNOWN');
const preload=pathToFileURL(path.resolve('scripts/lib/report-zero-cost-preload.mjs')).href;
const jsonPreload=pathToFileURL(path.resolve('scripts/lib/pages-json-import-preload.mjs')).href;
const inherited=process.env.NODE_OPTIONS||'';
let nodeOptions=inherited;
for(const module of [preload,jsonPreload])if(!nodeOptions.includes(module))nodeOptions+=` --import=${module}`;
const env={...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true',NODE_OPTIONS:nodeOptions};
// Non-Node grandchildren cannot spend using inherited model credentials either.
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
const extra=process.argv.slice(3);if(extra.some(a=>!/^[-A-Za-z0-9:_.=]+$/.test(a)))throw Error('ZERO_COST_ARGUMENT_INVALID');
const result=spawnSync(commands[key]+(extra.length?' '+extra.join(' '):''),{shell:true,stdio:'inherit',env});
if(result.error)throw result.error;process.exit(result.status??1);
