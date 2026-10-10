import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const bindings=JSON.parse(fs.readFileSync('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json'));
const targets=[['VIS-CIV-CA-T02-06-SECONDARY','.tmp/world-origin-secondary.webp'],['VIS-CIV-T18-HERO','.tmp/world-origin-t18.webp'],['VIS-CIV-T19-HERO','.tmp/world-origin-t19.webp']];
const rows=targets.map(([id,file])=>{const a=bindings.assets.find(a=>a.assetId===id),bytes=fs.readFileSync(file);assert.equal(a.reviewState,'ACCEPTED');assert.equal(bytes.length,a.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);return {assetId:id,file,bucketKey:a.bucketKey,sha256:a.sha256,bytes:a.bytes,byteIdentical:true};});
for(const row of rows){const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','r2','object','put','phios-public-assets/'+row.bucketKey,'--remote','--file',row.file,'--content-type','image/webp'],{stdio:'inherit'});assert.equal(r.status,0);row.originalBytesRepublished=true;}
fs.writeFileSync('docs/acceptance/world-recovery/r2-exact-delivery-repair.json',JSON.stringify({imageRegenerated:false,objectRenamed:false,objectDeleted:false,acceptedBindingRewritten:false,rows},null,2)+'\n');
