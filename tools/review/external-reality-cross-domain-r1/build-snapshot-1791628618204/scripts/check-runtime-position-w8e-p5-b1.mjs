import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(root,'content/civilization-atlas/reconfiguration');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const manifest=read(path.join(base,'runtime-position-w8e-p5-b1-primary-filing-manifest-v1.json'));
const receipt=read(path.join(base,'runtime-position-w8e-p5-b1-acquisition-receipt-v1.json'));
assert.equal(manifest.records.length,15);assert.equal(receipt.records.length,15);
assert.equal(new Set(manifest.records.map(r=>r.sourceId)).size,15);
assert.equal(new Set(receipt.records.map(r=>r.sourceId)).size,15);
for(const issuer of ['AAPL','MSFT','AMZN','NVDA','JPM']){
 assert.deepEqual(manifest.records.filter(r=>r.issuer===issuer).map(r=>r.fiscalYear).sort(),[2023,2024,2025]);
}
for(const r of manifest.records){
 const rec=receipt.records.find(x=>x.sourceId===r.sourceId);assert(rec,r.sourceId);
 for(const key of ['issuer','cik','fiscalYear','periodEnd','url','file'])assert.equal(rec[key],r[key],`${r.sourceId}:${key}`);
 assert.equal(rec.state,'RAW_PRIMARY_FILING_ACQUIRED');
 assert.equal(r.admissionState,'NOT_ADMITTED');assert.equal(r.comparability,'NOT_ASSESSED');
 const location=path.resolve(base,'p5-b1-filings',r.file);
 assert(location.startsWith(path.resolve(base,'p5-b1-filings')+path.sep),'Unsafe source path');
 const bytes=fs.readFileSync(location);
 assert.equal(bytes.length,rec.bytes,r.sourceId+':BYTES');
 assert(bytes.length>=100000,r.sourceId+':TRUNCATED');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),rec.sha256,r.sourceId+':SHA256');
 const html=bytes.toString('utf8');
 const fact=name=>{
  const m=html.match(new RegExp('<ix:nonNumeric\\b[^>]*name=["\x27]dei:'+name+'["\x27][^>]*>([\\s\\S]*?)</ix:nonNumeric>','i'));
  assert(m,r.sourceId+':'+name);return m[1].replace(/<[^>]+>/g,'').trim();
 };
 assert.equal(fact('DocumentType'),'10-K');
 assert.equal(fact('EntityCentralIndexKey').padStart(10,'0'),r.cik);
 assert.equal(Number(fact('DocumentFiscalYearFocus')),r.fiscalYear);
 assert(r.url.endsWith('-'+r.periodEnd.replaceAll('-','')+'.htm'),r.sourceId+':PERIOD_URL');
 console.log('PASS '+r.sourceId);
}
assert.equal(receipt.status,'RAW_ACQUISITION_COMPLETE_B2_PENDING');
assert.equal(receipt.completed.filingsAcquired,15);assert.equal(receipt.completed.filingsRequired,15);
for(const key of ['g14Candidates','dossierGlobalPromotions','runtimePositionCandidates'])assert.equal(receipt.completed[key],0,key);
console.log('PASS B1: 15/15 original filings and receipt hashes verified; B2 pending; G14=0; RP=0.');
