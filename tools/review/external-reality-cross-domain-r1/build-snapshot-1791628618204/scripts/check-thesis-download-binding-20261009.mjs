import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';import {pathToFileURL} from 'node:url';import {build} from 'esbuild';
const dir='docs/assets/r2-public/wiring-20261009';
await build({entryPoints:['functions/api/thesis-download.js'],bundle:true,platform:'node',format:'esm',outfile:dir+'/thesis-download-test-module.mjs'});
const {onRequestGet}=await import(pathToFileURL(path.resolve(dir+'/thesis-download-test-module.mjs'))),bytes=fs.readFileSync(dir+'/reality-navigation-thesis.pdf');const originalFetch=globalThis.fetch;
try{globalThis.fetch=async()=>new Response(bytes,{headers:{'Content-Type':'application/pdf'}});let r=await onRequestGet();assert.equal(r.status,200);assert.match(r.headers.get('Content-Disposition'),/^attachment;/);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
r=await onRequestGet({request:new Request('http://127.0.0.1/api/thesis-download?view=inline')});assert.equal(r.status,200);assert.match(r.headers.get('Content-Disposition'),/^inline;/);assert.match(r.headers.get('Content-Security-Policy'),/frame-ancestors 'self'/);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
globalThis.fetch=async()=>new Response(Buffer.from('%PDF-replaced-content'),{headers:{'Content-Type':'application/pdf'}});r=await onRequestGet();assert.equal(r.status,502);
globalThis.fetch=async()=>new Response('<html>not a PDF</html>',{headers:{'Content-Type':'text/html'}});r=await onRequestGet();assert.equal(r.status,502);
console.log('Thesis current accepted PDF downloads byte-for-byte; replaced bytes and non-PDF fail closed. Zero external requests.');}finally{globalThis.fetch=originalFetch;}
