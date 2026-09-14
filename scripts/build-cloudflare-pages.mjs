import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
const wrangler=path.join(root,'node_modules/wrangler/bin/wrangler.js');
const out=path.join(root,'.wrangler/pages-production-build');
const run=args=>{const result=spawnSync(process.execPath,[wrangler,...args],{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw new Error(`Wrangler failed: ${result.status}`);};
run(['pages','functions','build','--outdir',out,'--output-routes-path',path.join(out,'_routes.json'),'--compatibility-date',config.compatibility_date,'--compatibility-flags',...config.compatibility_flags]);
const files=fs.readdirSync(out);
if(files.some(name=>!['index.js','_routes.json'].includes(name)))throw new Error('Unexpected bundle modules: review before producing a single-file Worker');
const routes=JSON.parse(fs.readFileSync(path.join(out,'_routes.json'),'utf8'));
if(routes.version!==1||!routes.include?.length)throw new Error('Missing generated Functions routes');
const bytes=fs.readFileSync(path.join(out,'index.js'));
const compressed=gzipSync(bytes).length;
console.log(`Pages Worker: ${bytes.length} bytes; gzip ${compressed} bytes`);
// Conservative free-plan ceiling; paid-plan eligibility is not assumed.
if(compressed>3*1024*1024)throw new Error('Worker exceeds the 3 MiB preflight budget');
if(!process.argv.includes('--check-only')){
  fs.writeFileSync(path.join(root,'_worker.js'),bytes);
  fs.copyFileSync(path.join(out,'_routes.json'),path.join(root,'_routes.json'));
  console.log('Generated _worker.js for Pages advanced mode using the lockfile Wrangler. No deployment performed.');
}
