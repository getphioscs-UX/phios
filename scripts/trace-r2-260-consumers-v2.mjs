import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {json,writeJson,evidenceDir,sha} from './lib/r2-260-evidence.mjs';
const rows=json('docs/assets/r2-public/r2-260-display-results-v1.json').rows;
const registry=json('content/web-production/registries/client-visual-asset-registry-v1.8.json');
const pub=json('content/registry/public-assets.json');
const files=execFileSync('rg',['--files','-g','*.html','-g','*.js','-g','*.css','-g','!docs/**','-g','!scripts/**','-g','!node_modules/**','-g','!_site/**','-g','!dist/**'],{encoding:'utf8'}).trim().split(/\r?\n/).map(p=>p.replaceAll('\\','/'));
const sources=files.map(path=>({path,text:fs.readFileSync(path,'utf8')}));
const traces=rows.map((r,index)=>{const entry=registry.assets.find(a=>a.r2?.objectKey===r.key),codes=[...new Set([entry?.assetCode,...pub.assets.filter(a=>a.object_key===r.key).map(a=>a.asset_code)].filter(Boolean))];const matches=sources.flatMap(s=>{if(!s.text.includes(r.key)&&!codes.some(c=>s.text.includes(c)))return [];const digest=sha(s.text),lines=s.text.split(/\r?\n/);return lines.flatMap((line,i)=>{const exact=line.includes(r.key),code=codes.find(c=>new RegExp('(?:["\'`=])'+c+'(?:["\'` <])').test(line));return exact||code?[{file:s.path,line:i+1,match:exact?'OBJECT_KEY':code,sourceSha256:digest}]:[]});});return {number:index+1,objectKey:r.key,codes,registrySource:entry?'content/web-production/registries/client-visual-asset-registry-v1.8.json':r.source,expectedConsumers:entry?.expectedConsumers||[],primaryConsumers:entry?.primaryConsumers||[],consumerMode:entry?.consumerMode||null,routeActivation:entry?.routeActivation??null,actualConsumerState:entry?.actualConsumerState||null,sourceMatches:matches};});
writeJson(evidenceDir+'/r2-260-consumer-trace-v2.json',{scope:'Source trace only, never display evidence',scannedSourceFiles:files.length,routeAuthority:'content/customer-experience-rebuild/authority/canonical-customer-route-registry-v5.json',cutoverAuthority:'content/customer-experience-rebuild/migration/priority-route-cutover-registry-v3.json',redirectAuthority:'_redirects',traces});
console.log('Traced',traces.length,'rows across',files.length,'runtime sources');

