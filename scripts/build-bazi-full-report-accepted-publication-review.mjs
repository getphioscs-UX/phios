import fs from 'node:fs';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const renderLocale=async locale=>{
 const projection=await projectBaziSectionPublication({reading:source.reading,locale,temporalContext:source.temporalSnapshot,composition:{},allowUnselectedTiming:false});
 const bySection=new Map();
 for(const p of projection.pages){if(!bySection.has(p.sectionKey))bySection.set(p.sectionKey,[]);bySection.get(p.sectionKey).push(p);}
 return [...bySection.entries()].map(([sectionKey,pages])=>{
  const opener=pages.find(p=>p.pageFamily==='SECTION_OPENER_PAGE'),body=pages.filter(p=>p!==opener);
  return '<section class="section"><article class="opener" style="--hero:url(&quot;'+esc(opener?.visualBinding?.url||'')+'&quot;)"><div class="scrim"><span class="number">'+esc(opener?.sectionNumber)+'</span><h2>'+esc(opener?.title)+'</h2>'+(opener?.paragraphs||[]).map(x=>'<p>'+esc(x)+'</p>').join('')+'</div></article>'+body.map(p=>'<article class="page"><div class="meta">'+esc(p.pageNumber)+' · '+esc(p.pageFamily)+' · '+esc(p.pageKey)+'</div><h3>'+esc(p.title)+'</h3>'+(p.paragraphs||[]).map(x=>'<p>'+esc(x)+'</p>').join('')+(p.items?.length?'<ul>'+p.items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+(p.boundary?'<div class="boundary">'+esc(p.boundary)+'</div>':'')+'</article>').join('')+'</section>';
 }).join('');
};
const zh=await renderLocale('zh-Hans'),en=await renderLocale('en');
const html='<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>BaZi Full Report · Accepted Publication Review</title><style>body{margin:0;background:#ece8df;color:#213239;font:16px/1.72 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:1500px;margin:auto;padding:28px}.banner{background:#fff;border:1px solid #d8cdbc;border-radius:16px;padding:22px;margin-bottom:24px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:22px}.locale>h1{position:sticky;top:0;background:#ece8df;padding:10px 0;z-index:2}.section{margin-bottom:28px}.opener{min-height:260px;border-radius:16px;overflow:hidden;background-image:linear-gradient(rgba(15,25,30,.5),rgba(15,25,30,.64)),var(--hero);background-size:cover;background-position:center;color:#fff;display:flex;align-items:end}.scrim{padding:28px}.number{font-size:13px;letter-spacing:.18em}.opener h2{font-size:28px;margin:8px 0}.page{background:#fffdf8;border:1px solid #d8cdbc;border-radius:14px;padding:22px;margin-top:12px}.page h3{margin:5px 0 14px;font-size:21px}.meta{font:12px/1.4 ui-monospace,Consolas,monospace;color:#7a7168}.boundary{margin-top:15px;padding:12px;border-radius:9px;background:#f1ede5;color:#655f58}.status{font-family:ui-monospace,Consolas,monospace}@media(max-width:1000px){.cols{grid-template-columns:1fr}}</style><main><div class="banner"><h1>BaZi Full Report · Canonical Publication Review</h1><p>This is generated from the actual <code>projectBaziSectionPublication()</code> output, not from planning prompts. S02–S10 owner-accepted copy is frozen; T2/T3/provider rewriting is disabled for those sections.</p><div class="status">fixture: 己巳・庚午・癸丑・戊午 · 甲戌 34–44 · 2026 丙午 · provider calls: 0 · production activation: separate</div></div><div class="cols"><div class="locale"><h1>中文 publication</h1>'+zh+'</div><div class="locale"><h1>English publication</h1>'+en+'</div></div></main></html>';
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('tools/review/BAZI-FULL-REPORT-ACCEPTED-PUBLICATION-REVIEW.html',html);
console.log('PASS: wrote tools/review/BAZI-FULL-REPORT-ACCEPTED-PUBLICATION-REVIEW.html');
console.log('  Source: actual canonical section publication output; provider calls 0.');
