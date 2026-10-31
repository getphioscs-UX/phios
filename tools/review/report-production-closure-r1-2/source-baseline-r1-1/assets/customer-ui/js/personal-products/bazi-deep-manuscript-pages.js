import {BAZI_EDITORIAL_PARAGRAPHS_R4} from './bazi-editorial-paragraphs-r4.js';
import {renderBaziDiagram} from './bazi-deep-diagrams.js';
import {layoutProfile} from '../../../../functions/personal-reading/publication-fit/bazi-publication-layout-profiles.js';
import {renderReportCoverOverlay} from '../../../../functions/canonical-presentation-runtime/report-cover-overlay.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// BDM_READABILITY_R4: preserve every source span; restore manuscript paragraph boundaries.
function prose(content,locales,sectionId,manuscriptDigest){
 if(manuscriptDigest!==BAZI_EDITORIAL_PARAGRAPHS_R4.manuscriptDigest)return locales.map(locale=>'<div lang="'+locale+'" class="bdm-locale">'+(content?.[locale]||[]).map(s=>'<p data-source-start="'+s.start+'" data-source-end="'+s.end+'" data-source-role="'+s.role+'">'+esc(s.text)+'</p>').join('')+'</div>').join('');
 return locales.map(locale=>{
  const blocks=BAZI_EDITORIAL_PARAGRAPHS_R4.sections[sectionId]?.[locale];
  const entries=content?.[locale]||[],groups=[];
  const paragraph=s=>`<p data-source-start="${s.start}" data-source-end="${s.end}" data-source-role="${s.role}">${esc(s.text)}</p>`;
  if(!blocks)return `<div lang="${locale}" class="bdm-locale">${entries.map(paragraph).join('')}</div>`;
  let current=[],last=-1;
  for(const s of entries){
   const index=blocks.findIndex(b=>Number(s.start)>=b.start&&Number(s.end)<=b.end);
   if(index<0)throw Error('EDITORIAL_SOURCE_SPAN_OUTSIDE_PARAGRAPH '+sectionId+' '+locale+' '+s.start);
   if(current.length&&index!==last){groups.push(current);current=[];}
   current.push(s);last=index;
  }
  if(current.length)groups.push(current);
  return `<div lang="${locale}" class="bdm-locale">${groups.map(group=>'<div class="bdm-editorial-prose-group">'+group.map(paragraph).join(locale==='en'?' ':'')+'</div>').join('')}</div>`;
 }).join('');
}
export function renderBaziDeepManuscript(ir){
 const revised=ir.qualityRevision==='BZR-R1.1';
 if(ir.method!=='BAZI'||(revised?ir.publication?.pages?.length!==ir.publication?.pageCount:ir.publication?.pages?.length!==48)||ir.technical?.diagrams?.length!==15)throw Error('BDM_RESOLVED_IR_REQUIRED');
 if(revised&&!ir.reviewOnly&&!ir.publicationIdentity?.approvedCommercialPolicyRef)throw Error('BZR_COMMERCIAL_WATERMARK_ADMISSION_REQUIRED');
 const mode=ir.presentationMode,locales=layoutProfile(mode).locales;const title=t=>mode==='EN'?esc(t.en):mode==='ZH_HANS'?esc(t.zh):esc(t.zh)+'<small lang="en">'+esc(t.en)+'</small>';
 const identity={displayName:null,birthDate:null,birthTime:null,timeAccuracy:'UNKNOWN',...ir.identity};
 const basis=ir.consistency?.timeBasis;
 const calculationNote=basis?'<p style="font-size:14px;line-height:1.5">出生地 / Place: '+esc(basis.coordinate.latitude)+', '+esc(basis.coordinate.longitude)+' · '+esc(basis.timezone.timezoneId)+'<br>民用 / Civil '+esc(basis.recordedCivilTime.localTime)+' → 真太阳时 / Apparent solar '+esc(basis.trueSolarTime.trueSolarIso.slice(11,19))+'<br>总修正 / Total correction '+Number(basis.trueSolarTime.totalCorrectionMinutes).toFixed(3)+' min</p>':'';
 const toc=revised?calculationNote+'<nav aria-label="Report contents" style="font-size:14px;line-height:1.5;margin-top:4mm;background:#f8f3e8ed;padding:3mm;border:1px solid #cbb88e">'+ir.publication.pages.filter(p=>p.role==='SECTION_OPENER').map(p=>'<a href="#bzr-page-'+p.pageNumber+'" style="display:flex;justify-content:space-between;gap:4mm;margin:1mm 0;color:#23364a;text-decoration:none"><span>'+esc(p.title.zh)+'<span lang="en" style="display:block;font:14px/1.4 Georgia,serif">'+esc(p.title.en)+'</span></span><span>'+p.pageNumber+'</span></a>').join('')+'</nav>':'';
 const pages=ir.publication.pages.map(p=>{
  let body;
  if(p.staticAsset){body=`<div class="pub-decoration pub-decoration--single"><img class="pub-page-background" src="${esc(p.staticAsset)}" alt="${esc(p.title.zh)}"></div>`+(p.staticFolioMasks||[]).map(m=>`<span class="bdm-static-folio-mask" data-pagination-owner="BDM_GLOBAL_PAGINATION" style="left:${m.left}%;top:${m.top}%;width:${m.width}%;height:${m.height}%"><b>${String(p.pageNumber).padStart(2,'0')}</b>${m.mode==='PAGE_TOTAL'?'<small>/ '+ir.publication.pageCount+'</small>':''}</span>`).join('')+(p.pageNumber===1?renderReportCoverOverlay({methodId:'BZR',subject:identity,locale:mode==='EN'?'en':mode==='ZH_HANS'?'zh-Hans':'bilingual'}):'');
  if(revised&&p.contentsRows){body+=p.contentsRows.map(r=>'<a href="#bzr-page-'+r.physicalPageNumber1+'" aria-label="'+esc(r.titleZh+' / '+r.titleEn)+'" style="position:absolute;left:'+(r.rect[0]*100)+'%;top:'+((1-r.rect[3])*100)+'%;width:'+((r.rect[2]-r.rect[0])*100)+'%;height:'+((r.rect[3]-r.rect[1])*100)+'%;z-index:5;color:#23364a;font:16px Georgia,serif"><span style="position:absolute;right:'+((r.rect[2]-r.xRight)/(r.rect[2]-r.rect[0])*100)+'%;top:'+((r.rect[3]-r.y)/(r.rect[3]-r.rect[1])*100)+'%;transform:translateY(-50%)">'+r.physicalPageNumber1+'</span></a>').join('');}
  }else{
   const diagrams=ir.technical.diagrams.filter(d=>d.id===p.diagramId||p.diagramIds?.includes(d.id));
   const heading=`<div class="pub-heading"><h2>${title(p.title)}</h2></div>`;
   const decoration=`<div class="pub-decoration pub-decoration--single"><img class="pub-page-background" src="${esc(p.sectionMasterAsset||p.bodyAsset)}" alt=""></div>`;
   const content=p.insightCards?`<div class="bdm-insights">${Array.from({length:3},(_,i)=>`<div><b>0${i+1}</b>${locales.map(l=>{const v=p.insightCards[l][i];return v?`<p lang="${l}" data-source-start="${v.start}" data-source-end="${v.end}" data-source-role="${v.role}">${esc(v.text)}</p>`:'<p data-missing-required="true">'+(mode==='EN'?'Editorial selection pending':'待补齐审阅选段')+'</p>';}).join('')}</div>`).join('')}</div>`:diagrams.length?diagrams.map(d=>renderBaziDiagram(d,mode,diagrams.length===2)).join(''):p.role==='OVERVIEW'?`<div class="bdm-overview"${revised?' style="margin-top:3mm;padding:6mm"':''}><p>${mode==='EN'?'Natal pillars':mode==='ZH_HANS'?'四柱':'四柱 / Natal pillars'}</p><h3>${ir.technical.diagrams[0].nodes.map(n=>esc(n.value)).join(' · ')}</h3><p>${mode==='EN'?'Day Master':mode==='ZH_HANS'?'日主':'日主 / Day Master'}：${esc(revised?ir.identity.dayMaster:ir.technical.diagrams[3].nodes[0].value)}</p><p>${mode==='EN'?'The following foundation pages distinguish inventory, functional support and natal relations.':mode==='ZH_HANS'?'以下基础页分别呈现四柱藏干、五行十神、日主支持与原局关系。':'以下基础页分别呈现四柱藏干、五行十神、日主支持与原局关系。 / The following pages separate inventory, support and natal relations.'}</p></div>`:prose(p.content,locales,p.sectionId,ir.manuscript.digest);
   body=decoration+`<header class="pub-header"><span>P H I O S</span><span>${mode==='EN'?'BaZi':mode==='ZH_HANS'?'八字':'八字 / BaZi'}</span></header>`+heading+`<div class="bdm-content">${revised&&p.diagramId==='D01'?calculationNote:''}${content}${p.role==='OVERVIEW'?toc:''}</div>`;
  }
  const closure=revised?`<div class="bdm-closure-mark" style="position:absolute;top:1.5mm;left:17mm;right:17mm;font:10px sans-serif;text-align:center;color:#815746;z-index:9">${ir.reviewOnly?'SYNTHETIC QA · NOT A CUSTOMER REPORT':esc(ir.publicationIdentity.watermarkText)} · ${esc(ir.publicationIdentity?.reportRef||'')}</div>`:'';
  return `<section${revised?' id="bzr-page-'+p.pageNumber+'"':''} class="pub-page bdm-page${p.staticAsset?' bdm-static':''}" data-page-number="${p.pageNumber}" data-page-role="${p.role}" data-section-id="${p.sectionId||''}">${body}${closure}${revised&&p.contentsRows?'<footer class="pub-footer bdm-contents-folio" style="position:absolute!important;bottom:1.5mm!important;left:48%!important;right:auto!important;background:transparent!important;padding:0!important;z-index:6;font:10px Georgia,serif;color:#23364a">'+p.pageNumber+' / '+ir.publication.pageCount+'</footer>':`<footer class="pub-footer"><span>${mode==='EN'?'Your life, in context':mode==='ZH_HANS'?'在情境中理解人生':'在情境中理解人生 / Your life, in context'}</span><span>${p.pageNumber} / ${ir.publication.pageCount}</span></footer>`}</section>`;
 });
 return `<article class="pub-report bdm-report" ${revised?'data-publication-page-count="'+ir.publication.pageCount+'" ':''}data-recompose-pass="${ir.publication.recomposePass||0}" data-presentation-mode="${mode}" data-method="BZR" data-print-shell="PHI-OS-REPORT-PRINT-SHELL-V2" data-manuscript-digest="${esc(ir.manuscript.digest)}">${pages.join('')}</article>`;
}
// Browser/PDF/print readiness is technical. No provider or authoring dependency.
export function inspectBaziDeepLayout(root){
 const pages=[...root.querySelectorAll('.bdm-page')];const overflowPages=pages.filter(p=>{const c=p.querySelector('.bdm-content'),footer=p.querySelector('footer');return p.scrollWidth>p.clientWidth+2||p.scrollHeight>p.clientHeight+2||c&&footer&&c.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-4;}).map(p=>Number(p.dataset.pageNumber));
 const missingAssets=[...root.querySelectorAll('img')].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src);
 return {pageCount:pages.length,overflowPages,missingAssets,browserReady:pages.length===48&&!overflowPages.length&&!missingAssets.length};
}
