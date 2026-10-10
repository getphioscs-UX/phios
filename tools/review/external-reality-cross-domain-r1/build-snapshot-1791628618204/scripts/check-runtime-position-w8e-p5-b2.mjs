import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(root,'content/civilization-atlas/reconfiguration');
const read=f=>JSON.parse(fs.readFileSync(path.join(base,f),'utf8').replace(/^\uFEFF/,''));
const data=read('runtime-position-w8e-p5-b2-comparable-period-extraction-v1.json');
const manifest=read('runtime-position-w8e-p5-b1-primary-filing-manifest-v1.json');
const receipts=read('runtime-position-w8e-p5-b1-acquisition-receipt-v1.json');
assert.equal(data.status,'COMPARABLE_PERIOD_EXTRACTION_COMPLETE_B3_PENDING');
assert.deepEqual(data.packets.map(p=>p.issuer),['AAPL','MSFT','AMZN','NVDA','JPM']);
const totals={AAPL:[383285,391035,416161],MSFT:[211915,245122,281724],AMZN:[574785,637959,716924],NVDA:[26974,60922,130497],JPM:[154328,163199,178556]};
for(const p of data.packets){
 assert.equal(p.filings.length,3);assert.equal(p.scope,'SUBSYSTEM');
 assert.equal(p.structuralChangeDerivation,'B3_PENDING');assert.equal(p.g14Admission,'NOT_ADMITTED');assert.equal(p.representativeness,'NOT_ESTABLISHED');
 for(const f of p.filings){
  const s=manifest.records.find(s=>s.sourceId===f.sourceId);assert(s);
  const receipt=receipts.records.find(r=>r.sourceId===f.sourceId);assert.equal(f.sha256,receipt.sha256);
  const bytes=fs.readFileSync(path.join(base,'p5-b1-filings',s.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
  assert.equal(f.admissionState,'NOT_ADMITTED');assert.equal(f.url,s.url);assert.equal(f.filingFiscalYear,s.fiscalYear);
  assert.equal(f.observations.length,3);
  for(const o of f.observations){
   assert.equal(o.denominatorValue,o.segments.reduce((n,s)=>n+s.revenue,0));
   assert(Math.abs(o.segments.reduce((n,s)=>n+s.sharePercent,0)-100)<0.001);
   for(const s of o.segments)assert(Math.abs(s.sharePercent-s.revenue/o.denominatorValue*100)<0.00006);
  }
 }
 assert.deepEqual(p.selectedComparablePeriods.map(o=>o.fiscalYear),[2023,2024,2025]);
 assert.deepEqual(p.selectedComparablePeriods.map(o=>o.denominatorValue),totals[p.issuer]);
 const selected=p.filings[2].observations.filter(o=>o.fiscalYear>=2023).sort((a,b)=>a.fiscalYear-b.fiscalYear);
 assert.deepEqual(p.selectedComparablePeriods,selected,'Latest-basis provenance');
 assert.equal(p.comparability.selectedBasisSourceId,p.filings[2].sourceId);
 assert.equal(p.definitionEvidence.sha256,p.filings.find(f=>f.sourceId===p.definitionEvidence.sourceId).sha256);
 assert.equal(p.comparability.asFiledBreaks,p.issuer==='MSFT'?2:p.issuer==='JPM'?1:0);
 if(p.issuer==='JPM'){
  const old=p.filings[0].observations[0].segments;
  assert.equal(old[1].revenue+old[2].revenue,p.selectedComparablePeriods[0].segments[1].revenue);
  for(const o of selected){assert.equal(o.metric,'TOTAL_NET_REVENUE_MANAGED_FTE');assert.equal(o.denominator,'SUM_OF_REPORTABLE_SEGMENTS_EXCLUDES_CORPORATE');}
 }
 console.log('PASS B2 '+p.issuer+': 3 source filings, 3 selected periods; as-filed breaks='+p.comparability.asFiledBreaks);
}
for(const key of ['g14Candidates','dossierGlobalPromotions','runtimePositionCandidates'])assert.equal(data.completed[key],0);
assert.equal(data.completed.sourceFilings,15);assert.equal(data.completed.selectedComparablePeriods,15);assert.equal(data.completed.issuersWithAsFiledBreaks,2);
console.log('PASS B2: source hashes, fiscal periods, revenue reconciliation, share arithmetic and recast boundaries verified; G14=0; RP=0.');
