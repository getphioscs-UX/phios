import fs from 'node:fs';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {REPORT_PAGE_FAMILIES} from '../functions/canonical-presentation-runtime/report-section-contract.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));

function units(text,locale){
 const s=String(text||'').trim();
 if(locale==='zh-Hans') return (s.match(/[\u3400-\u9fff]/g)||[]).length;
 return (s.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)?/g)||[]).length;
}
function normalize(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim();}
function shingles(text,n=5){
 const toks=(normalize(text).match(/[a-z0-9]+|[\u3400-\u9fff]/g)||[]);
 const out=new Set();
 for(let i=0;i<=toks.length-n;i++)out.add(toks.slice(i,i+n).join(' '));
 return out;
}
function overlap(a,b){
 const A=shingles(a),B=shingles(b);
 if(!A.size||!B.size)return 0;
 let hit=0;for(const x of A)if(B.has(x))hit++;
 return hit/Math.max(1,Math.min(A.size,B.size));
}

const output={version:'BAZI_R8_BASELINE_RENDER_AUDIT_V1',generatedAt:new Date().toISOString(),source:'docs/guided-report-successor-r2/bazi-source.json',locales:{}};

for(const locale of ['en','zh-Hans']){
 const projection=await projectBaziSectionPublication({reading:source.reading,locale,temporalContext:source.temporalSnapshot,composition:{}});
 const pages=projection.pages;
 const rows=pages.map(p=>{
  const family=REPORT_PAGE_FAMILIES[p.pageFamily];
  const text=(p.paragraphs||[]).join(' ');
  const textUnits=units(text,locale);
  const itemUnits=(p.items||[]).map(x=>units(x,locale));
  const min=family?.budget?.[locale==='en'?'en':'zh']?.[0]??null;
  const max=family?.budget?.[locale==='en'?'en':'zh']?.[1]??null;
  return {
   pageNumber:p.pageNumber,pageKey:p.pageKey,definitionKey:p.definitionKey,sectionKey:p.sectionKey,title:p.title,pageFamily:p.pageFamily,
   paragraphCount:(p.paragraphs||[]).length,itemCount:(p.items||[]).length,textUnits,itemUnits,
   hasVisual:Boolean(p.primaryVisualRef||p.primaryVisualHtml),hasTemporal:Boolean(p.temporal),observationCount:(p.observations||[]).length,
   boundaryUnits:units(p.boundary,locale),min,max,
   thin:Boolean(min!==null&&!p.primaryVisualRef&&textUnits<min),
   empty:Boolean(!textUnits&&!(p.items||[]).length&&!p.primaryVisualRef&&!p.primaryVisualHtml)
  };
 });
 const duplicatePairs=[];
 for(let i=0;i<pages.length;i++)for(let j=i+1;j<pages.length;j++){
  const a=[...(pages[i].paragraphs||[]),...(pages[i].items||[])].join(' ');
  const b=[...(pages[j].paragraphs||[]),...(pages[j].items||[])].join(' ');
  const score=overlap(a,b);
  if(score>=0.45)duplicatePairs.push({a:pages[i].pageKey,b:pages[j].pageKey,score:Number(score.toFixed(3))});
 }
 const continuations=rows.filter(r=>/_CONT_\d+$/.test(r.pageKey));
 output.locales[locale]={
  bodyPages:pages.length,totalPages:pages.length+6,
  sections:Object.fromEntries([...new Set(rows.map(r=>r.sectionKey))].map(k=>[k,rows.filter(r=>r.sectionKey===k).length])),
  emptyPages:rows.filter(r=>r.empty),
  thinPages:rows.filter(r=>r.thin),
  continuations,
  duplicatePairs,
  pages:rows
 };
}

const en=output.locales.en.pages,zh=output.locales['zh-Hans'].pages;
output.semanticParity={
 sameDefinitionSequence:JSON.stringify(en.map(x=>[x.sectionKey,x.definitionKey,x.pageFamily]))===JSON.stringify(zh.map(x=>[x.sectionKey,x.definitionKey,x.pageFamily])),
 enBodyPages:en.length,zhBodyPages:zh.length,
 enTotal:en.length+6,zhTotal:zh.length+6
};
fs.mkdirSync('docs/acceptance/bazi-paid-report/r8',{recursive:true});
fs.writeFileSync('docs/acceptance/bazi-paid-report/r8/BAZI-R8-BASELINE-RENDER-AUDIT.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({
 en:{total:output.locales.en.totalPages,empty:output.locales.en.emptyPages.length,thin:output.locales.en.thinPages.length,continuations:output.locales.en.continuations.length,duplicates:output.locales.en.duplicatePairs.length},
 zh:{total:output.locales['zh-Hans'].totalPages,empty:output.locales['zh-Hans'].emptyPages.length,thin:output.locales['zh-Hans'].thinPages.length,continuations:output.locales['zh-Hans'].continuations.length,duplicates:output.locales['zh-Hans'].duplicatePairs.length},
 parity:output.semanticParity
},null,2));
