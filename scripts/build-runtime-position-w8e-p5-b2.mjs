import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(root,'content/civilization-atlas/reconfiguration');
const read=f=>JSON.parse(fs.readFileSync(path.join(base,f),'utf8').replace(/^\uFEFF/,''));
const manifest=read('runtime-position-w8e-p5-b1-primary-filing-manifest-v1.json');
const receipt=read('runtime-position-w8e-p5-b1-acquisition-receipt-v1.json');
const hash=x=>createHash('sha256').update(x).digest('hex');
const clean=s=>s.replace(/<[^>]+>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&[lg]t;/g,' ').replace(/\s+/g,' ').trim();
function tables(html){
 const result=[],stack=[];
 for(const m of html.matchAll(/<\/?table\b[^>]*>/gi)){
  if(/^<\//.test(m[0])){const start=stack.pop();assert(start!==undefined);result.push({start,end:m.index+m[0].length});}
  else stack.push(m.index);
 }
 assert.equal(stack.length,0);return result.sort((a,b)=>a.start-b.start).map(t=>({...t,html:html.slice(t.start,t.end)}));
}
const segments={AAPL:['Americas','Europe','Greater China','Japan','Rest of Asia Pacific'],MSFT:['Productivity and Business Processes','Intelligent Cloud','More Personal Computing'],AMZN:['North America','International','AWS'],NVDA:['Compute & Networking','Graphics'],JPM:['Consumer & Community Banking','Commercial & Investment Bank','Asset & Wealth Management']};
const indices={AAPL:[14,14,14],MSFT:[76,78,71],AMZN:[70,68,69],NVDA:[55,56,55],JPM:[636,646,643]};
const packets=[];
for(const issuer of Object.keys(segments)){
 const filings=[];
 for(const source of manifest.records.filter(r=>r.issuer===issuer).sort((a,b)=>a.fiscalYear-b.fiscalYear)){
  const rec=receipt.records.find(r=>r.sourceId===source.sourceId);assert.equal(rec.state,'RAW_PRIMARY_FILING_ACQUIRED');
  const bytes=fs.readFileSync(path.join(base,'p5-b1-filings',source.file));assert.equal(hash(bytes),rec.sha256);
  const html=bytes.toString('utf8');const tableIndex=indices[issuer][source.fiscalYear-2023];const table=tables(html)[tableIndex];assert(table);
  const rows=[...table.html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c=>clean(c[1])).filter(Boolean));
  const nums=row=>row.slice(1).filter(x=>/^\d[\d,]*$/.test(x)&&Number(x.replaceAll(',',''))>1000).map(x=>Number(x.replaceAll(',','')));
  const years=issuer==='AMZN'?[source.fiscalYear-2,source.fiscalYear-1,source.fiscalYear]:[source.fiscalYear,source.fiscalYear-1,source.fiscalYear-2];
  const names=issuer==='JPM'&&source.fiscalYear===2023?['Consumer & Community Banking','Corporate & Investment Bank','Commercial Banking','Asset & Wealth Management']:segments[issuer];
  const values={};
  if(issuer==='AAPL')for(const name of names){const r=rows.find(r=>r[0]===name);assert(r,name);values[name]=nums(r);}
  if(issuer==='MSFT'&&source.fiscalYear<2025)for(const name of names){const r=rows.find(r=>r[0]===name);assert(r,name);values[name]=nums(r);}
  if(issuer==='MSFT'&&source.fiscalYear===2025){const revenue=rows.filter(r=>r[0]==='Revenue');assert.equal(revenue.length,4);names.forEach((name,i)=>values[name]=nums(revenue[i]));}
  if(issuer==='AMZN'){const revenue=rows.filter(r=>r[0]==='Net sales');assert.equal(revenue.length,4);names.forEach((name,i)=>values[name]=nums(revenue[i]));}
  if(issuer==='NVDA'){const revenue=rows.filter(r=>r[0]==='Revenue');assert.equal(revenue.length,3);names.forEach((name,i)=>values[name]=revenue.map(r=>nums(r)[i]));}
  if(issuer==='JPM'){const r=rows.find(r=>r[0]==='Total net revenue');assert(r);const n=nums(r);assert.equal(n.length,names.length*3);names.forEach((name,i)=>values[name]=n.slice(i*3,i*3+3));}
  for(const name of names)assert.equal(values[name].length,3,issuer+name);
  const observations=years.map((year,i)=>{
   const total=names.reduce((sum,name)=>sum+values[name][i],0);
   return {fiscalYear:year,unit:'USD_MILLIONS',metric:issuer==='JPM'?'TOTAL_NET_REVENUE_MANAGED_FTE':'SEGMENT_REVENUE_OR_NET_SALES',
    denominator:issuer==='JPM'?'SUM_OF_REPORTABLE_SEGMENTS_EXCLUDES_CORPORATE':'SUM_OF_REPORTABLE_SEGMENTS',denominatorValue:total,
    segments:names.map(name=>({name,revenue:values[name][i],sharePercent:Math.round(values[name][i]/total*1e6)/1e4}))};
  });
  filings.push({sourceId:source.sourceId,url:source.url,filingFiscalYear:source.fiscalYear,documentPeriodEnd:source.periodEnd,sha256:rec.sha256,
   authorityTarget:'OFFICIAL_PRIMARY',admissionState:'NOT_ADMITTED',locator:{tableIndexZeroBased:tableIndex,startByte:Buffer.byteLength(html.slice(0,table.start)),tableSha256:hash(table.html)},observations});
 }
 const latest=filings.at(-1);const selected=latest.observations.filter(o=>o.fiscalYear>=2023).sort((a,b)=>a.fiscalYear-b.fiscalYear);
 assert.equal(selected.length,3);
 const comparisons=filings.slice(0,2).map(f=>{
  const original=f.observations.find(o=>o.fiscalYear===f.filingFiscalYear),revised=selected.find(o=>o.fiscalYear===f.filingFiscalYear);
  const sameNames=JSON.stringify(original.segments.map(s=>s.name))===JSON.stringify(revised.segments.map(s=>s.name));
  return {fiscalYear:f.filingFiscalYear,originalSourceId:f.sourceId,comparisonSourceId:latest.sourceId,
   state:sameNames&&original.segments.every((s,i)=>s.revenue===revised.segments[i].revenue)?'MATCHING_REVENUE_AND_SEGMENT_LABELS':'COMPARABILITY_BREAK_AS_FILED_VS_LATEST_BASIS',
   originalSegments:original.segments,revisedSegments:revised.segments};
 });
 const breaks=comparisons.filter(c=>c.state.startsWith('COMPARABILITY_BREAK'));
 const notes={AAPL:'Geographic reportable segments retained for revenue comparison. Product/service categories are not treated as operating segments. Expense disclosure changes are outside this revenue-only comparison.',
  MSFT:'FY2025 reporting composition changed, including Microsoft 365 commercial components brought together in Productivity and Business Processes. Prior-period segment information was recast. Do not splice FY2023/FY2024 original segment revenue with FY2025 new-basis revenue.',
  AMZN:'North America, International and AWS retained for this revenue comparison. Product/service sales categories are separate classifications.',
  NVDA:'Compute & Networking and Graphics retained for this revenue comparison. Data Center is a market-platform classification, not substituted for a reportable operating segment.',
  JPM:'From Q2 2024 the former Corporate & Investment Bank and Commercial Banking were combined into Commercial & Investment Bank. Use the issuer-revised comparative series. Segment net revenue is managed/FTE, not firmwide GAAP revenue. Corporate is excluded from the share denominator.'};
 const document=fs.readFileSync(path.join(base,'p5-b1-filings',manifest.records.find(r=>r.sourceId===latest.sourceId).file),'utf8');
 const plain=clean(document);
 const anchors={AAPL:'reportable segments',MSFT:'In August 2024',AMZN:'three segments',NVDA:'two operating segments',JPM:'Effective in the second quarter of 2024'};
 let anchorSource=latest,anchorText=plain;
 if(issuer==='JPM'){anchorSource=filings[1];anchorText=clean(fs.readFileSync(path.join(base,'p5-b1-filings',manifest.records.find(r=>r.sourceId===anchorSource.sourceId).file),'utf8'));}
 const offset=anchorText.toLowerCase().indexOf(anchors[issuer].toLowerCase());assert(offset>=0,issuer+':definition anchor absent');
 packets.push({issuer,workOrderId:'W8E-P5-FILING-US-'+issuer,scope:'SUBSYSTEM',filings,
  definitionEvidence:{sourceId:anchorSource.sourceId,sha256:anchorSource.sha256,normalizedTextOffset:offset,searchAnchor:anchors[issuer],summary:notes[issuer]},
  comparability:{state:breaks.length?'COMPARABLE_ON_ISSUER_RECAST_BASIS_ONLY':'REVENUE_COMPARABLE_WITH_MATCHING_OVERLAPS',scope:'Reportable-segment revenue only; no assertion that all accounting/expense metrics are comparable.',comparisons,
   selectedBasisSourceId:latest.sourceId,selectedYears:[2023,2024,2025],asFiledBreaks:breaks.length},selectedComparablePeriods:selected,
  structuralChangeDerivation:'B3_PENDING',g14Admission:'NOT_ADMITTED',representativeness:'NOT_ESTABLISHED'});
}
const output={version:'1.0.0',work:'R1-W8E-P5-B2',status:'COMPARABLE_PERIOD_EXTRACTION_COMPLETE_B3_PENDING',
 completed:{issuers:5,sourceFilings:15,selectedComparablePeriods:15,issuersWithAsFiledBreaks:2,g14Candidates:0,dossierGlobalPromotions:0,runtimePositionCandidates:0},packets,
 boundary:'B2 factual extraction only. W8A/B/C/D governed claim admission remains pending. Revenue share is computed, not issuer-reported; no G14 or national-system inference.'};
fs.writeFileSync(path.join(base,'runtime-position-w8e-p5-b2-comparable-period-extraction-v1.json'),JSON.stringify(output,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const cards=packets.map(p=>'<section><h2>'+p.issuer+'</h2><p>'+esc(p.comparability.state)+'</p><p>'+esc(p.definitionEvidence.summary)+'</p><table><tr><th>Segment</th><th>FY2023</th><th>FY2024</th><th>FY2025</th></tr>'+p.selectedComparablePeriods[0].segments.map((s,i)=>'<tr><td>'+esc(s.name)+'</td>'+p.selectedComparablePeriods.map(o=>'<td>'+o.segments[i].revenue.toLocaleString('en-US')+'<br>'+o.segments[i].sharePercent.toFixed(2)+'%</td>').join('')+'</tr>').join('')+'</table><p>USD millions; shares computed using '+esc(p.selectedComparablePeriods[0].denominator)+'.</p><details><summary>Original vs latest-basis comparisons</summary><pre>'+esc(JSON.stringify(p.comparability.comparisons,null,2))+'</pre></details><p>'+p.filings.map(f=>'<a href="'+esc(f.url)+'">FY'+f.filingFiscalYear+' SEC 10-K</a>').join(' · ')+'</p></section>').join('');
fs.mkdirSync(path.join(root,'tools/review'),{recursive:true});
fs.writeFileSync(path.join(root,'tools/review/PHI-OS-W8E-P5-B2-COMPARABLE-PERIODS.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B2 Comparable Period Extraction</title><style>body{max-width:1050px;margin:auto;padding:28px;font:16px/1.6 system-ui;color:#e8e2d6;background:#121820}h1,h2{color:#dcc18a}section{margin:24px 0;padding:24px;border:1px solid #665840;border-radius:10px}table{border-collapse:collapse;width:100%}td,th{padding:12px;border-bottom:1px solid #4d4d4d;text-align:left}a{color:#dcc18a}pre{white-space:pre-wrap}</style><h1>B2｜Comparable Period Extraction</h1><p>5 issuers · 15 original filings · fixed FY2023–FY2025 historical cohort. B3 pending. G14=0; RP=0.</p><p>Original filing data and issuer-recast comparative data remain separate. JPM shares exclude Corporate and use managed/FTE net revenue.</p>'+cards+'</html>');
console.log('PASS B2 extraction: 5 issuers, 15 source filings, 15 selected periods, 2 issuer comparability breaks; G14=0; RP=0.');
