// Exact candidate adapter only. Existing frozen readers are deliberately unchanged.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readPreConsumerSource} from './unified-country-consumer-reception-r1.mjs';
import {validateMain096ReceiverGovernance} from './ppr-five-method-preentry-successor.mjs';
const RECORD='docs/ziwei-customer-copy-r2-20261124/SOURCESET.json';
const HASH='14cce7b76679193ae76d9dcb41638725f926cd2a3e990c260bed5baea8720f68';
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=(ref,p)=>execFileSync('git',['cat-file','blob',ref+':'+p],{env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_OPTIONAL_LOCKS:'0'},maxBuffer:4e6,stdio:['ignore','pipe','pipe']});
export function validateZiweiCopyReceiverCandidate({recordBytes=fs.readFileSync(RECORD),readCurrent=p=>fs.readFileSync(p),readGit=git}={}){
 assert.equal(hash(recordBytes),HASH,'ZIWEI_EXACT_CANDIDATE_RECORD');
 const r=JSON.parse(recordBytes);
 assert.equal(r.base,'13cb96fa3965acd1870b7b79869a0c0d9de4eed2');
 assert.deepEqual(r.files.map(f=>f.path),['assets/customer-ui/media/preentry-r5/ziwei/zh-Hans.html','assets/customer-ui/media/preentry-r5/ziwei/interaction.json']);
 for(const v of Object.values(r.boundaries))assert.equal(v,false);
 const previous=new Map();
 for(const f of r.files){assert.equal(hash(readCurrent(f.path)),f.sha256,'ZIWEI_CURRENT:'+f.path);const old=readGit(r.base,f.path);assert.equal(hash(old),f.previousSHA256,'ZIWEI_PREDECESSOR:'+f.path);previous.set(f.path,Buffer.from(old));}
 for(const f of r.unchanged)assert.equal(hash(readCurrent(f.path)),f.sha256,'ZIWEI_PROTECTED:'+f.path);
 // Validate BOTH current resources first; only then supply exact old bytes to the
 // unchanged historical authority. No current acceptance or release is inferred.
 const historical=validateMain096ReceiverGovernance({readCurrent:p=>previous.get(p)||readPreConsumerSource(p)});
 return {record:r,historical,readerRegistrationImplemented:false,productionActivated:false};
}
