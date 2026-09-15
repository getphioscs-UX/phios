import {structuredLoader} from './structured-loader.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export async function mountProgressiveExplorer(host,bookCode,locale,openFullReadingView){
 const tr=(en,zh)=>locale==='zh-Hans'?zh:en,param={'BOOK-1':'mechanism','BOOK-2':'pattern','BOOK-3':'topic','BOOK-4':'expansion'}[bookCode];
 let disposed=false,revision=0,activeFamily,items=[],selectedId,fullDispose;
 const title=o=>locale==='en'?(o.titleEn||o.title):o.title;
 const familyNames={STATE:'状态',MECHANISM:'机制',PATTERN:'模式',CONDITION:'条件',FEEDBACK:'反馈',TRANSITION:'转换',CAPACITY:'承载能力',CARRIER:'载体',INDIVIDUAL:'个人',DYAD:'双人',GROUP:'群体',ORGANIZATION:'组织',COLLECTIVE:'集体',MAINTENANCE_SIGNAL:'维持讯号',LOAD:'负荷',DEGRADATION:'退化',FAILURE_MODE:'失效模式',RECOVERY_MODE:'恢复模式',ADAPTATION:'适应',CONTINUITY_STATE:'连续状态',EXPANSION_PRESSURE:'扩展压力',REPLICATION:'复制',DISTRIBUTION:'分布',AMPLIFICATION:'放大',NETWORK_EFFECT:'网络效应',SCALE_THRESHOLD:'尺度阈值',SCALE_SHIFT:'尺度转换',CARRIER_EXPANSION:'载体扩展',EXPANSION_CONSTRAINT:'扩展约束',INFRASTRUCTURE_REQUIREMENT:'基础设施需求',MAINTENANCE_COST:'维持成本',CIVILIZATION_THRESHOLD:'文明阈值'};
 const book=await structuredLoader.book(bookCode);if(!host.isConnected)return ()=>{};
 host.innerHTML=`<h2>${tr('Explore source topics','探索来源主题')}</h2><p>${tr('Structured preview awaiting review. Source chapters do not diagnose your situation.','结构化预览仍待审核，来源章节不用于诊断个人处境。')}</p><label>${tr('Topic group','主题组')} <select data-family>${Object.keys(book.families).map(f=>`<option>${esc(f)}</option>`).join('')}</select></label><label>${tr('Find in this group','在此组查找')} <input type="search"></label><div class="structured-explorer-layout"><nav data-topics></nav><aside data-detail aria-live="polite"></aside></div>`;
 const select=host.querySelector('select'),search=host.querySelector('input'),nav=host.querySelector('nav'),detail=host.querySelector('aside');
 host.classList.add('structured-explorer','structured-progressive');
 for(const option of select.options){const key=option.value;option.value=key;option.textContent=locale==='zh-Hans'?(familyNames[key]||key):key.toLowerCase().replaceAll('_',' ');}
 nav.setAttribute('aria-label',tr('Source topics','来源主题'));
 function list(id){nav.innerHTML=items.filter(o=>`${o.title} ${o.titleEn||''}`.toLowerCase().includes(search.value.toLowerCase())).map(o=>`<button type="button" data-id="${esc(o.objectId)}" aria-pressed="${o.objectId===id}">${esc(title(o))}</button>`).join('')||`<p>${tr('No matching topics','没有符合的主题')}</p>`;}
 async function show(id,push=false){
  const ticket=++revision;detail.textContent=tr('Loading…','正在加载…');
  try{
   if(!book.objects[id])throw new Error('UNKNOWN_OBJECT');const family=book.objects[id].family;
   const f=await structuredLoader.family(bookCode,family);if(disposed||ticket!==revision)return;
   if(activeFamily!==family)search.value='';activeFamily=family;selectedId=id;items=f.items;select.value=family;list(id);
   const r=await structuredLoader.object(bookCode,id);if(disposed||ticket!==revision)return;
   const o=r.object,d=r.detail,b=r.backlink,meaning=(locale==='en'?d?.summaryEn:null)||o.canonicalMeaning||o.definition;
   const articles=b.publishedArticles.filter(a=>a.locale===locale);
   const related=[...new Set([...(d?.relatedMechanisms||[]),...(o.sourceRefs?.relatedStructuredObjectIds||[])])].filter(ref=>book.objects[ref]);
   detail.innerHTML=`<h3>${esc(title({...o,titleEn:d?.titleEn||o.titleEn}))}</h3><p>${esc(meaning||tr('Definition has not yet been extracted. Read the source chapter.','定义尚未提取，请阅读来源章节。'))}</p>${articles.map(a=>`<p><a href="${esc(a.href)}">${esc(a.title)}</a></p>`).join('')}<h4>${tr('Source pages','来源页码')}</h4><ul>${b.manuscriptSections.map(s=>`<li>${esc(s.sectionCode)} · ${s.startPage}–${s.endPage}</li>`).join('')}</ul><a href="${esc(b.bookSection.href)}">${tr('Read book section','阅读书籍章节')}</a><p><a href="/knowledge/ask/?${esc(new URLSearchParams({contextType:'KNOWLEDGE',contextRef:'CONCEPT:'+id.toLowerCase(),contextLabel:o.title,readingPath:b.explorerHref}).toString())}">${tr('Ask about this topic','就此主题提问')}</a></p>${related.map(ref=>`<button type="button" data-id="${esc(ref)}">${tr('Related topic','相关主题')} ${esc(ref)}</button>`).join('')}`;
   for(const button of detail.querySelectorAll('[data-id]'))button.textContent=tr('Related: ','相关：')+title(book.objects[button.dataset.id]);
   if(!meaning&&articles.length){const paragraph=host.ownerDocument.createElement('p');paragraph.textContent=tr('Article summary: ','文章摘要：')+(o.articles?.find(a=>a.locale===locale)?.summary||'');if(o.articles?.some(a=>a.locale===locale&&a.summary))detail.append(paragraph);}
   if(push){const url=new URL(location.href);url.searchParams.set(param,id);history.pushState(null,'',url);}
  }catch{if(!disposed&&ticket===revision)detail.textContent=tr('Topic unavailable. Choose another topic or use the book chapters.','主题暂不可用，请选择其他主题或阅读书籍章节。');}
 }
 const sync=()=>{const q=new URL(location.href).searchParams;return show(q.get(param)||q.get(bookCode==='BOOK-3'?'degradation':'scale')||Object.keys(book.objects)[0]);};
 const click=e=>{const button=e.target.closest('[data-id]');if(button&&host.contains(button))void show(button.dataset.id,true);};
 const change=async()=>{const ticket=++revision;try{const f=await structuredLoader.family(bookCode,select.value);if(!disposed&&ticket===revision)await show(f.items[0].objectId,true);}catch{detail.textContent=tr('Topics unavailable','主题暂不可用');}};
 const filter=()=>list(selectedId);
 const keyboard=e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;const buttons=[...nav.querySelectorAll('button')];const index=buttons.indexOf(e.target);if(index<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+(e.key==='ArrowDown'?1:-1)));buttons[next]?.focus();};
 nav.addEventListener('keydown',keyboard);
 host.addEventListener('click',click);select.addEventListener('change',change);search.addEventListener('input',filter);window.addEventListener('popstate',sync);await sync();
 const cleanup=()=>{disposed=true;revision++;nav.removeEventListener('keydown',keyboard);host.removeEventListener('click',click);select.removeEventListener('change',change);search.removeEventListener('input',filter);window.removeEventListener('popstate',sync);};
 if(openFullReadingView){const button=host.ownerDocument.createElement('button');button.type='button';button.textContent=tr('Open full reading map and comparisons','打开完整阅读图与比较');button.addEventListener('click',async()=>{cleanup();fullDispose=await openFullReadingView();if(!host.isConnected)fullDispose?.();},{once:true});host.append(button);}
 return ()=>{cleanup();fullDispose?.();};
}
