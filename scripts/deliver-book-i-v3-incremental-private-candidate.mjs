import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const root='tools/review/free-ask-manuscript-r1/';
const revision=JSON.parse(fs.readFileSync(root+'BOOK-I-V3-INCREMENTAL-CORPUS.json'));
const acceptance=JSON.parse(fs.readFileSync(revision.sourceAcceptancePath));
const bytes=fs.readFileSync(revision.corpusPath),corpus=JSON.parse(bytes);
assert.equal(corpus.sourceSha256,acceptance.sourceSha256);assert.equal(acceptance.status,'HUMAN_ACCEPTED_SOURCE_IDENTITY');
assert.equal(sha(corpus.records.map(r=>r.text).join('')),corpus.corpusSha256);
const objectKey='books/book-1/materialized/'+acceptance.version+'/incremental-v1/retrieval-corpus.json';
process.env.WRANGLER_LOG_PATH='C:/phios/.tmp/book1-incremental-private-candidate.log';process.env.WRANGLER_SEND_METRICS='false';
const auth=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','auth','token','--json'],{encoding:'utf8'}));
const headers={Authorization:`Bearer ${auth.token}`};
const url='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/r2/buckets/phios-private-manuscripts/objects/'+objectKey;
const before=await fetch(url,{headers});let created=false;
if(before.ok)assert.equal(sha(Buffer.from(await before.arrayBuffer())),sha(bytes),'NO_OVERWRITE_EXISTING_DIFFERENT_BYTES');
else{assert.equal(before.status,404);const put=await fetch(url,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:bytes});assert(put.ok);created=true;}
const after=await fetch(url,{headers});assert(after.ok);const readback=Buffer.from(await after.arrayBuffer());assert.equal(sha(readback),sha(bytes));
const receipt={at:new Date().toISOString(),bookCode:'BOOK-1',bucket:'phios-private-manuscripts',objectKey,sourceSha256:corpus.sourceSha256,corpusBytesSha256:sha(bytes),readbackBytesSha256:sha(readback),created,overwritten:false,sourcePdfNotOverwritten:true,productionAdmission:false,answerAcceptance:false,providerCalls:0};
fs.writeFileSync(root+'BOOK-I-V3-INCREMENTAL-PRIVATE-RECEIPT.json',JSON.stringify(receipt,null,2)+'\n');console.log(receipt);
