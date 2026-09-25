import fs from 'node:fs';
import path from 'node:path';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {REPORT_PAGE_FAMILIES,textUnits,validateExpandedSections} from '../functions/canonical-presentation-runtime/report-section-contract.js';

const root='artifacts/bazi-r8-baseline';
fs.mkdirSync(root,{recursive:true});
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const locales=['en','zh-Hans'];
const audits=[];
const semanticRows=report=>{
 const rows=[];
 for(const p of report.pages){
  const row=[p.sectionKey,p.definitionKey,p.pageFamily];
  const prev=rows.at(-1);
  if(!prev||prev.some((v,i)=>v!==row[i]))rows.push(row);
 }
 return rows;
};
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g,' ').trim();

for(const locale of locales){
 const built=await projectBaziSectionPublication({
  reading:source.reading,
  locale,
  temporalContext:source.temporalSnapshot,
  composition:{}
 });
 validateExpandedSections(built.pages);
 const pages=built.pages;
 const rows=[];
 const textMap=new Map();
 for(const p of pages){
  const prose=(p.paragraphs||[]).join(' ');
  const items=(p.items||[]).join(' ');
  const combined=[prose,items].filter(Boolean).join(' ');
  const family=REPORT_PAGE_FAMILIES[p.pageFamily];
  const range=family?.budget?.[locale==='en'?'en':'zh']||null;
  const units=textUnits(prose,locale);
  const itemRange=family?.budget?.[locale==='en'?'enItem':'zhItem']||null;
  const itemUnits=(p.items||[]).map(x=>textUnits(x,locale));
  const key=normalize(combined);
  if(key){
   const list=textMap.get(key)||[];
   list.push(p.pageKey);
   textMap.set(key,list);
  }
  rows.push({
   pageNumber:p.pageNumber,
   pageKey:p.pageKey,
   definitionKey:p.definitionKey,
   sectionKey:p.sectionKey,
   title:p.title,
   pageFamily:p.pageFamily,
   paragraphUnits:units,
   paragraphBudget:range,
   itemUnits,
   itemBudget:itemRange,
   paragraphCount:(p.paragraphs||[]).length,
   itemCount:(p.items||[]).length,
   hasVisual:Boolean(p.primaryVisualRef||p.primaryVisualHtml),
   hasTemporal:Boolean(p.temporal),
   observationCount:(p.observations||[]).length,
   boundary:Boolean(p.boundary),
   continuation:/_CONT_\d+$/.test(p.pageKey)
  });
 }
 const duplicateGroups=[...textMap.entries()].filter(([,keys])=>keys.length>1).map(([text,keys])=>({keys,text:text.slice(0,240)}));
 const thin=rows.filter(r=>r.paragraphBudget&&!r.hasVisual&&r.paragraphUnits<r.paragraphBudget[0]);
 const over=rows.filter(r=>r.paragraphBudget&&r.paragraphUnits>r.paragraphBudget[1]);
 const badItems=rows.filter(r=>r.itemBudget&&r.itemUnits.some(n=>n<r.itemBudget[0]||n>r.itemBudget[1]));
 const empty=rows.filter(r=>!r.hasVisual&&r.paragraphCount===0&&r.itemCount===0);
 const continuations=rows.filter(r=>r.continuation);
 const sectionCounts=Object.fromEntries([...new Set(rows.map(r=>r.sectionKey))].map(s=>[s,rows.filter(r=>r.sectionKey===s).length]));
 const audit={
  locale,
  bodyPages:pages.length,
  totalPages:pages.length+6,
  sectionCounts,
  empty,
  thin,
  over,
  badItems,
  duplicateGroups,
  continuations,
  rows,
  diagnostics:built.internalSections.map(s=>({sectionKey:s.sectionKey,...s.diagnostics}))
 };
 audits.push(audit);
 fs.writeFileSync(path.join(root,`report-${locale}.json`),JSON.stringify({locale,totalPages:pages.length+6,pages},null,2)+'\n');
 fs.writeFileSync(path.join(root,`audit-${locale}.json`),JSON.stringify(audit,null,2)+'\n');
}

const parity={
 semanticStructureEqual:JSON.stringify(semanticRows({pages:JSON.parse(fs.readFileSync(path.join(root,'report-en.json'))).pages}))===JSON.stringify(semanticRows({pages:JSON.parse(fs.readFileSync(path.join(root,'report-zh-Hans.json'))).pages})),
 enTotal:audits.find(x=>x.locale==='en').totalPages,
 zhTotal:audits.find(x=>x.locale==='zh-Hans').totalPages
};
const summary={
 version:'BAZI_R8_BASELINE_RENDER_AUDIT_V1',
 generatedAt:new Date().toISOString(),
 parity,
 locales:audits.map(a=>({
  locale:a.locale,totalPages:a.totalPages,bodyPages:a.bodyPages,sectionCounts:a.sectionCounts,
  emptyCount:a.empty.length,thinCount:a.thin.length,overCount:a.over.length,
  badItemCount:a.badItems.length,duplicateGroupCount:a.duplicateGroups.length,
  continuationCount:a.continuations.length
 }))
};
fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
