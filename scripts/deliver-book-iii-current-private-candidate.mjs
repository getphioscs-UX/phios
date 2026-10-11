import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const acceptancePath='content/knowledge/manuscripts/review/book-3-owner-final-20261011-efbfdd21fa21-source-acceptance.json';
const acceptance=JSON.parse(fs.readFileSync(acceptancePath));
const comparison=JSON.parse(fs.readFileSync('tools/review/free-ask-manuscript-r1/BOOK-III-CURRENT-COMPLETE-CORPUS-COMPARISON.json'));
const bytes=fs.readFileSync(comparison.corpusPath),corpus=JSON.parse(bytes);
assert.equal(corpus.sourceSha256,acceptance.sourceSha256);assert.equal(acceptance.status,'HUMAN_ACCEPTED_SOURCE_IDENTITY');
assert.equal(corpus.records.filter(r=>r.segmentType==='SECTION').length,103);assert.equal(corpus.records.length,106);
assert.equal(sha(corpus.records.map(r=>r.text).join('')),corpus.corpusSha256);
const objectKey='books/book-3/materialized/'+acceptance.version+'/positioned-v1/retrieval-corpus.json';
process.env.WRANGLER_LOG_PATH='C:/phios/.tmp/book3-current-private-candidate.log';process.env.WRANGLER_SEND_METRICS='false';
const auth=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','auth','token','--json'],{encoding:'utf8'}));
const headers={Authorization:`Bearer ${auth.token}`};
const url='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/r2/buckets/phios-private-manuscripts/objects/'+objectKey;
const before=await fetch(url,{headers});let created=false;
if(before.ok){assert.equal(sha(Buffer.from(await before.arrayBuffer())),sha(bytes),'EXISTING_CANDIDATE_CHANGED_NO_OVERWRITE');}
else{assert.equal(before.status,404);const written=await fetch(url,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:bytes});assert(written.ok);created=true;}
const after=await fetch(url,{headers});assert(after.ok);const readback=Buffer.from(await after.arrayBuffer());assert.equal(sha(readback),sha(bytes));
const receipt={at:new Date().toISOString(),bookCode:'BOOK-3',bucket:'phios-private-manuscripts',objectKey,sourceSha256:corpus.sourceSha256,sourceAcceptancePath:acceptancePath,sourceAcceptanceSha256:sha(fs.readFileSync(acceptancePath)),corpusSha256:corpus.corpusSha256,corpusBytesSha256:sha(bytes),readbackBytesSha256:sha(readback),records:106,chapters:103,created,overwritten:false,oldObjectsPreserved:true,publicExposure:false,productionAdmission:false,extractionQuality:'CURRENT_TEXT_LAYER_CANDIDATE_NOT_FULL_PDF_LOSSLESS',answerAcceptance:false,providerCalls:0};
fs.writeFileSync('tools/review/free-ask-manuscript-r1/BOOK-III-CURRENT-PRIVATE-CANDIDATE-RECEIPT.json',JSON.stringify(receipt,null,2)+'\n');console.log({objectKey,readbackVerified:true,productionAdmission:false,chapters:103});
