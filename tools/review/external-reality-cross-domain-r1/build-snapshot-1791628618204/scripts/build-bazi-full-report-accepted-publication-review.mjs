import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {buildBaziCustomerPublication} from '../functions/personal-reading/bazi-customer-publication.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const compositionR1=process.argv.includes('--composition-r1');
if(compositionR1&&fs.existsSync('docs/acceptance/bazi-paid-report/composition-r1/HUMAN-ACCEPTANCE.json')){
 console.log('FROZEN: Composition R1 has human ACCEPT; existing review artifacts are retained. Use the independent controlled-subject proof for binding work.');process.exit(0);
}
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

// MR-W1: use the customer composer and renderer, including the six opening
// pages. The historical side-by-side section review above remains available.
const sourceDigest=createHash('sha256').update(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json')).digest('hex');
const css=['assets/css/tokens.css','assets/customer-ui/surfaces/visual-report.css','assets/customer-ui/surfaces/report-publication.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n').replaceAll('url(/','url(../../');
const artifacts=[];
const reviewRuntime=await build({stdin:{contents:`import {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';
const root=document.querySelector('main');
if(new URLSearchParams(location.search).get('mode')==='customer')document.querySelector('.review-notice')?.setAttribute('hidden','');
await document.fonts.ready;
await settlePublicationAssets(root);
const pageFit=fitPublicationForPrint(root);
window.reviewQuality={pageFit,overflowPages:pageFit.filter(p=>!p.fits),humanDecision:null};
window.measureReport=()=>{const fit=fitPublicationForPrint(root);return {pageFit:fit,overflowPages:fit.filter(p=>!p.fits)}};
window.batchReady=true;`,resolveDir:process.cwd(),sourcefile:'full-report-review-entry.js'},bundle:true,write:false,format:'esm',platform:'browser',minify:true});
const runtime=reviewRuntime.outputFiles[0].text.replaceAll('</script','<\\/script');
for(const [locale,suffix] of [['zh-Hans','ZH'],['en','EN']]){
 const report=await buildBaziCustomerPublication({reading:source.reading,locale,temporalSnapshot:source.temporalSnapshot,full:true,compositionR1});
 const body=renderPublicationReport(report).replaceAll('src="/','src="../../').replaceAll('url(/','url(../../');
 const file=`tools/review/BAZI-FULL-REPORT-${compositionR1?'COMPOSITION-R1':'REVIEW'}-${suffix}.html`;
 const notice=locale==='en'
  ?'Full customer reading order. Human decision pending: ACCEPT / REJECT. This historical chart fixture has no trusted account subject binding; identity acceptance remains blocked. Do not attach an invented name or birth date. Remote editorial images require network access.'
  :'完整客户阅读顺序。等待人工决定：ACCEPT / REJECT。此历史命盘样本缺少可信账户主体绑定，身份验收仍受阻；不得补造姓名或出生日期。远端编辑图片需要联网。';
 fs.writeFileSync(file,`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>BaZi Full Report Review ${suffix}</title><style>${css}\nbody{margin:0;background:#e8e5de}.review-notice{max-width:940px;margin:24px auto;padding:20px;background:white;font:16px/1.6 system-ui;overflow-wrap:anywhere}@media print{.review-notice{display:none}}</style></head><body><aside class="review-notice"><h1>BaZi · ${suffix}</h1><p>${notice}</p><p>SHA-256: ${sourceDigest}</p><p>${report.totalPages} pages · fixture: 己巳・庚午・癸丑・戊午</p></aside><main>${body}</main><script type="module">${runtime}</script></body></html>`);
 artifacts.push({locale,path:file,totalPages:report.totalPages,sections:[...new Set(report.pages.map(p=>p.sectionKey))],sourceDigest,subjectBindingVerified:false,...(compositionR1?{physicalPageCount:report.totalPages,sectionPageMap:report.pages.map(p=>({physicalPageNumber:p.pageNumber,sectionId:p.sectionId,compositionGroupId:p.compositionGroupId,physicalPageRole:p.physicalPageRole,sourceNodeIds:p.sourceNodeIds,fitMode:'UNMEASURED',mergedNodeCount:p.sourceNodeIds.length,overflow:'UNMEASURED'})),coverage:report.physicalComposition.coverage,deduplications:report.physicalComposition.deduplications}: {})});
 if(compositionR1)fs.writeFileSync(`docs/acceptance/bazi-paid-report/composition-r1/composed-${locale}.json`,JSON.stringify(report,null,2)+'\n');
 console.log(`PASS: wrote ${file} (${report.totalPages} pages)`);
}
fs.mkdirSync('content/reports/shared',{recursive:true});
if(!compositionR1)fs.writeFileSync('content/reports/shared/bazi-full-review-manifest.json',JSON.stringify({workId:'PHI-OS-METHOD-REPORTS-PRODUCTION-ROLLOUT',status:'READY_FOR_REVIEW',humanDecision:null,allowedDecisions:['ACCEPT','REJECT'],artifacts,blockers:['TRUSTED_SUBJECT_BINDING_MISSING_IN_HISTORICAL_FIXTURE'],productionAdmissionGranted:false},null,2)+'\n');
else {
 const baseline=JSON.parse(fs.readFileSync('docs/acceptance/bazi-paid-report/composition-r1/baseline.json'));
 const introRoles=['COVER','WHAT_IS_BAZI','ORIGIN','PHI_OS_LENS','HOW_TO_READ','CHART_SNAPSHOT'];
 for(const artifact of artifacts)artifact.sectionPageMap=[...introRoles.map((physicalPageRole,i)=>({physicalPageNumber:i+1,sectionId:'INTRO',compositionGroupId:`INTRO:P${i+1}`,physicalPageRole,sourceNodeIds:[`FIXED_INTRO_P${i+1}`],fitMode:'STANDARD',mergedNodeCount:1,overflow:'UNMEASURED'})),...artifact.sectionPageMap];
 const manifest={workId:'BAZI-FULL-REPORT-COMPOSITION-R1',status:'AWAITING_MACHINE_MEASUREMENT',editorial:'ACCEPT',compositionDecision:null,subjectBinding:'UNRESOLVED_INDEPENDENT_GATE',productionAdmissionGranted:false,acceptedCopyDigests:baseline.acceptedCopyDigests,artifacts};
 fs.writeFileSync('content/reports/shared/bazi-composition-r1-manifest.json',JSON.stringify(manifest,null,2)+'\n');
 const data=JSON.stringify(artifacts).replaceAll('<','\\u003c');
 fs.writeFileSync('tools/review/BAZI-FULL-REPORT-COMPOSITION-R1-REVIEW.html',`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><title>BaZi Composition R1 Review</title><style>body{margin:0;font:15px/1.6 system-ui;background:#eee9df;color:#203440}header{padding:18px 24px}button,a{margin-right:14px}main{display:grid;grid-template-columns:300px 1fr;height:85vh}aside{overflow:auto;padding:12px}iframe{border:0;width:100%;height:100%}table{font-size:12px;border-collapse:collapse}td{padding:5px;border-bottom:1px solid #ccc}code{overflow-wrap:anywhere}</style><header><h1>BaZi · Composition R1</h1><button id="zh">中文</button><button id="en">English</button><a id="customer" target="_blank">Customer view</a><span>正文已接受 · 编排待人工 ACCEPT / REJECT · 主体绑定独立待验</span></header><main><aside id="meta"></aside><iframe id="report" title="Full report"></iframe></main><script>const data=${data};function show(i){const a=data[i],f=a.path.split('/').pop();report.src=f;customer.href=f+'?mode=customer';meta.innerHTML='<h2>'+a.locale+' · '+a.physicalPageCount+' pages</h2><table>'+a.sectionPageMap.map(p=>'<tr><td>'+p.physicalPageNumber+' '+p.sectionId+'</td><td>'+p.physicalPageRole+'<br>'+p.mergedNodeCount+' nodes<details><summary>Sources</summary>'+p.sourceNodeIds.join('<br>')+'</details><span id="fit-'+p.physicalPageNumber+'">'+p.fitMode+' · '+p.overflow+'</span></td></tr>').join('')+'</table>';}zh.onclick=()=>show(0);en.onclick=()=>show(1);show(0);</script></html>`);
}
