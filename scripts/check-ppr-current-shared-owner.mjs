import {assertPprCurrentSharedOwnerRegistry,assertPprCurrentSharedOwner} from './lib/ppr-current-shared-owner.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const registry=assertPprCurrentSharedOwnerRegistry();
for(const [path,record] of Object.entries(registry.files))assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'),record.currentSha256,'CURRENT_OWNER_MUST_DESCRIBE_PHYSICAL_SOURCE:'+path);
const read=fs.readFileSync,target='assets/customer-ui/js/surfaces/personal-reality.js',parent='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/SIX-METHOD-MAIN096-RECEIVER-GOVERNANCE-SUCCESSOR.json';
function inject(path){fs.readFileSync=function(file,...options){const value=read.call(fs,file,...options),name=String(file).replaceAll('\\','/');if(name===path||name.endsWith('/'+path)){const bytes=Buffer.concat([Buffer.from(value),Buffer.from(path===parent?' ':'\n// unregistered current-source mutation')]);return typeof value==='string'?bytes.toString('utf8'):bytes;}return value;};}
try{inject(target);assert.throws(()=>assertPprCurrentSharedOwner(target),error=>error instanceof assert.AssertionError&&error.actual!==error.expected);}finally{fs.readFileSync=read;}
try{inject(parent);assert.throws(()=>assertPprCurrentSharedOwner(target),/CURRENT_OWNER_RECEPTION_RECORD_DRIFT/);}finally{fs.readFileSync=read;}
assert.throws(()=>assertPprCurrentSharedOwner(target,{historicalDigest:'0'.repeat(64)}),/historical predecessor is not recognized/);
console.log('PASS current shared owner: '+Object.keys(registry.files).length+' physical identities; unknown source, changed cached parent and unregistered lineage rejected. Existing semantic/provider/ownership restrictions retained.');
