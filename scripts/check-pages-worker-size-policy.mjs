import assert from 'node:assert/strict';
import {assessWorkerSize,pagesFileSizeAllowed,MAX_WORKER_UNCOMPRESSED_BYTES,WORKER_SIZE_WARNING_BYTES} from './lib/pages-worker-size-policy.mjs';
const MiB=1024*1024,rows=[];
for(const [name,size,gzip,status,warning] of [
  ['A-below-warning',12*MiB,4*MiB,'WORKER_SIZE_PLATFORM_PASS',null],
  ['B-warning-range',49*MiB,4*MiB,'WORKER_SIZE_PLATFORM_PASS','WORKER_SIZE_WARNING'],
  ['C-over-platform',64*MiB+1,1,'WORKER_SIZE_PLATFORM_FAIL','WORKER_SIZE_WARNING'],
  ['D-gzip-over-old-cap',32*MiB,8*MiB,'WORKER_SIZE_PLATFORM_PASS',null],
  ['exact-warning',48*MiB,4*MiB,'WORKER_SIZE_PLATFORM_PASS',null],
  ['exact-hard-limit',64*MiB,8*MiB,'WORKER_SIZE_PLATFORM_PASS','WORKER_SIZE_WARNING'],
  ['module-total-over-limit',40*MiB+25*MiB,1,'WORKER_SIZE_PLATFORM_FAIL','WORKER_SIZE_WARNING']
]){const result=assessWorkerSize({uncompressedBytes:size,gzipBytes:gzip});assert.equal(result.status,status);assert.equal(result.warning,warning);assert.equal(result.gzipStatus,'WORKER_GZIP_INFORMATIONAL_ONLY');rows.push({name,...result});}
assert.equal(MAX_WORKER_UNCOMPRESSED_BYTES,67108864);assert.equal(WORKER_SIZE_WARNING_BYTES,50331648);
assert.equal(pagesFileSizeAllowed('_worker.js',32*MiB),true);
assert.equal(pagesFileSizeAllowed('_worker.js',64*MiB+1),false);
assert.equal(pagesFileSizeAllowed('assets/report.pdf',25*MiB),true);
assert.equal(pagesFileSizeAllowed('assets/report.pdf',25*MiB+1),false);
assert.equal(pagesFileSizeAllowed('assets/_worker.js',25*MiB+1),false);
assert.throws(()=>assessWorkerSize({uncompressedBytes:-1}),/INVALID/);
console.log(JSON.stringify({status:'PASS',rows,staticAssetGuard:'25 MiB retained',largeWorkerFixtureAllocated:false}));
