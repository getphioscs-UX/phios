import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {validateZiweiCopyReceiverCandidate} from './lib/ziwei-copy-r2-receiver-candidate.mjs';
const result=validateZiweiCopyReceiverCandidate(),tests=['Exact two-resource current hashes and immutable predecessors','Unchanged 72-product historical receiver replay'];
for(const f of result.record.files){
 assert.throws(()=>validateZiweiCopyReceiverCandidate({readCurrent:p=>p===f.path?Buffer.concat([fs.readFileSync(p),Buffer.from(' ')]):fs.readFileSync(p)}),/ZIWEI_CURRENT/);tests.push('Reject unknown current byte: '+f.path);
 assert.throws(()=>validateZiweiCopyReceiverCandidate({readGit:(ref,p)=>p===f.path?Buffer.from('unregistered predecessor'):execFileSync('git',['cat-file','blob',ref+':'+p],{maxBuffer:4e6})}),/ZIWEI_PREDECESSOR/);tests.push('Reject substituted predecessor: '+f.path);
}
const recordBytes=fs.readFileSync('docs/ziwei-customer-copy-r2-20261124/SOURCESET.json');
assert.throws(()=>validateZiweiCopyReceiverCandidate({recordBytes:Buffer.concat([recordBytes,Buffer.from(' ')] )}),/ZIWEI_EXACT_CANDIDATE_RECORD/);tests.push('Reject modified record including authority flags');
const protectedFile=result.record.unchanged[0].path;
assert.throws(()=>validateZiweiCopyReceiverCandidate({readCurrent:p=>p===protectedFile?Buffer.from('unregistered'):fs.readFileSync(p)}),/ZIWEI_PROTECTED/);tests.push('Reject protected English resource drift');
console.log(JSON.stringify({status:'PASS_EXACT_CANDIDATE_NOT_READER_REGISTRATION',tests,historicalProductFiles:result.historical.record.productFiles.length,readerRegistrationImplemented:false,providerCalls:0,productionActivated:false},null,2));
