import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'phios-schema-ci-'));
const files=['provider-closure','runtime-bugs','runtime-freeze-audit','runtime-freeze-closure','runtime-contracts','runtime-modules'].map(n=>'content/registry/'+n+'.json').concat(['data/schemas/book-manifest.json','content/registry/book-1-manifest.json','data/schemas/book-manifest.schema.json']);
const write=(p,s)=>{const f=path.join(temp,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);};
const run=()=>spawnSync(process.execPath,[path.join(root,'scripts/check-schema-references.mjs')],{cwd:temp,encoding:'utf8'});
try{
 for(const f of files)write(f,fs.readFileSync(path.join(root,f)));
 write('.pages-output/broken.json','not json');write('.wrangler/broken.json','not json');
 write('fixtures/bom.json','\uFEFF{"$schema":"bom.schema.json","value":1}');write('fixtures/bom.schema.json','\uFEFF{"type":"object"}');
 assert.equal(run().status,0,'BOM sources and schemas must parse; generated copies must be ignored');
 write('fixtures/bom.json','{broken');let r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/Invalid JSON: fixtures/);
 write('fixtures/bom.json','{"$schema":"missing.schema.json"}');r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/Missing local JSON Schema/);
 write('fixtures/bom.json','{"$schema":"bom.schema.json"}');write('fixtures/bom.schema.json','{broken');r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/Invalid JSON|Referenced JSON Schema is invalid/);
 console.log('PASS schema CI regression: BOM source/schema accepted, build output ignored; malformed source/schema and missing schema rejected.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
