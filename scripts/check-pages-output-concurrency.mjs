import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {acquirePagesOutputLock} from './lib/pages-output-lock.mjs';

const root=path.resolve('.'),files=['.pages-output/_worker.js','.pages-output/_routes.json'];
const hashes=()=>files.map(p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
const before=hashes(),lease=acquirePagesOutputLock(root,'BUILD');
const run=(script,env={})=>spawnSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,PHIOS_PAGES_CHECK_WAIT_MS:'0',PHIOS_PAGES_BUILD_TOKEN:'',...env}});
try {
 const reader=run('scripts/check-pages-static-assets.mjs');assert.notEqual(reader.status,0);assert.match(reader.stderr,/PAGES_OUTPUT_BUSY/);
 const writer=run('scripts/build-cloudflare-pages.mjs');assert.notEqual(writer.status,0);assert.match(writer.stderr,/PAGES_OUTPUT_BUSY/);
 const invalid=run('scripts/check-pages-static-assets.mjs',{PHIOS_PAGES_BUILD_TOKEN:'invalid'});assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/PAGES_BUILD_LOCK_TOKEN_INVALID/);
 const internal=run('scripts/check-pages-static-assets.mjs',{PHIOS_PAGES_BUILD_TOKEN:lease.token});assert.equal(internal.status,0,internal.stderr);
 assert.deepEqual(hashes(),before,'Blocked competing readers/writers must not mutate real artifacts');
} finally {lease.release();}
const independent=run('scripts/check-pages-static-assets.mjs');assert.equal(independent.status,0,independent.stderr);
// Virtual negative cases leave real build output untouched; none writes a fake
// Worker/routes file. Every missing/empty/invalid case must still fail.
for(const [patch,expected] of [
 ["const original=fs.existsSync;fs.existsSync=p=>String(p).endsWith('.pages-output')?false:original(p);",/does not exist/],
 ["const original=fs.existsSync;fs.existsSync=p=>String(p).endsWith('_worker.js')||String(p).endsWith('_routes.json')?false:original(p);",/_worker.js: missing/],
 ["const original=fs.statSync;fs.statSync=p=>{const r=original(p);return String(p).endsWith('_worker.js')?Object.assign(r,{size:0}):r;};",/_worker.js: empty/],
 ["const original=fs.readFileSync;fs.readFileSync=(p,...args)=>String(p).endsWith('_routes.json')?'{\"version\":1,\"include\":[]}':original(p,...args);",/generated routing contract invalid/]
]){
 const code="import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';"+patch+"syncBuiltinESMExports();await import('./scripts/check-pages-static-assets.mjs');";
 const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,PHIOS_PAGES_BUILD_TOKEN:''}});
 assert.notEqual(r.status,0);assert.match(r.stderr,expected);
}
assert.deepEqual(hashes(),before);
console.log('PASS Pages output concurrency and strict negatives: competing reader/writer excluded; internal verifier passes; unbuilt/missing/empty/invalid output rejected; real artifacts unchanged.');
