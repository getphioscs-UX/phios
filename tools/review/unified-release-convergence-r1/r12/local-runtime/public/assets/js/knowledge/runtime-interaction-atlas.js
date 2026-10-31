import {mountProgressiveExplorer} from './progressive-explorer.js';
import {enhanceExplorerShell} from './explorer-shell.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderRuntimeAtlas(host,{patterns,locale='en',locationRef=window.location,historyRef=window.history,eventTarget=window}){
 const zh=locale==='zh-Hans',tr=(en,cn)=>zh?cn:en;
 const labels={INDIVIDUAL:tr('Individual','个体'),DYAD:tr('Dyad','双人'),GROUP:tr('Group','群体'),ORGANIZATION:tr('Organization','组织'),COLLECTIVE:tr('Collective','集体')};
 const title=o=>zh?o.title:o.titleEn;
 host.innerHTML=`<h2>${tr('Runtime Interaction Atlas','运行互动图谱')}</h2><p>${tr('Explore source chapters across runtime levels. This reading framework does not describe your relationship or replace evidence or professional judgment. Definitions and feedback loops are still being reviewed.','按运行层级探索来源章节。这是阅读框架，不描述你的关系，也不替代事实证据或专业判断。定义与反馈回路仍待提取审核。')}</p><label>${tr('Search','搜索')} <input type="search" data-runtime-search></label><label>${tr('Runtime level','运行层级')} <select data-runtime-level><option value="">${tr('All levels','全部层级')}</option>${Object.entries(labels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><div class="runtime-atlas-layout"><nav data-runtime-list aria-label="${tr('Reading topics','阅读主题')}"></nav><article data-runtime-inspector></article></div><label>${tr('Compare chapter scope','比较章节范围')} <select data-runtime-compare><option value="">${tr('Choose a second topic','选择第二个主题')}</option>${patterns.map(o=>`<option value="${esc(o.objectId)}">${esc(title(o))}</option>`).join('')}</select></label><div data-runtime-comparison></div>`;
 const q=s=>host.querySelector(s),search=q('[data-runtime-search]'),level=q('[data-runtime-level]'),compare=q('[data-runtime-compare]');
 let selected;
 function details(o){return `<h3>${esc(title(o))}</h3><p>${esc(o.canonicalQuestion)}</p><p>${esc(labels[o.runtimeLevel])}</p><ul>${o.sourceSections.map(s=>`<li>${esc(s.heading)} · ${s.startPage}–${s.endPage}</li>`).join('')}</ul><p>${tr('Definition, interaction direction and feedback effect have not been independently extracted.','定义、互动方向与反馈效果尚未单独提取。')}</p>`;}
 function renderList(){q('[data-runtime-list]').innerHTML=patterns.filter(o=>(!level.value||level.value===o.runtimeLevel)&&`${o.title} ${o.titleEn}`.toLowerCase().includes(search.value.trim().toLowerCase())).map(o=>`<button type="button" data-runtime-object="${esc(o.objectId)}" aria-pressed="${selected?.objectId===o.objectId}">${esc(title(o))}</button>`).join('')||`<p role="status">${tr('No matching topics','没有符合的主题')}</p>`;}
 function renderComparison(){const second=patterns.find(o=>o.objectId===compare.value);q('[data-runtime-comparison]').innerHTML=selected&&second?`<div class="runtime-atlas-layout">${[selected,second].map(o=>`<article>${details(o)}</article>`).join('')}</div>`:'';}
 function select(id,push=false){selected=patterns.find(o=>o.objectId===id);q('[data-runtime-inspector]').innerHTML=selected?details(selected):`<p>${tr('Topic unavailable. Choose another topic.','主题不可用，请选择其他主题。')}</p>`;if(push){const url=new URL(locationRef.href);url.searchParams.set('pattern',id);url.hash='runtime-atlas';historyRef.pushState(null,'',url);}renderList();renderComparison();}
 const sync=()=>select(new URL(locationRef.href).searchParams.get('pattern')||patterns[0]?.objectId);
 const click=e=>{const b=e.target.closest('[data-runtime-object]');if(b&&host.contains(b)){select(b.dataset.runtimeObject,true);q(`[data-runtime-object="${b.dataset.runtimeObject}"]`)?.focus();}};
 host.addEventListener('click',click);search.addEventListener('input',renderList);level.addEventListener('change',renderList);compare.addEventListener('change',renderComparison);eventTarget.addEventListener('popstate',sync);sync();
 const disposeShell=enhanceExplorerShell(host,{layout:'.runtime-atlas-layout',nav:'[data-runtime-list]',inspector:'[data-runtime-inspector]',locale});
 return ()=>{disposeShell();host.removeEventListener('click',click);search.removeEventListener('input',renderList);level.removeEventListener('change',renderList);compare.removeEventListener('change',renderComparison);eventTarget.removeEventListener('popstate',sync);};
}
async function mountFullReadingView(host,locale){
 try{const response=await fetch('/content/knowledge/structured/book-2/book-2-runtime-pattern-registry-v1.json');if(!response.ok)throw new Error('unavailable');const {patterns}=await response.json();if(!host.isConnected)return ()=>{};return renderRuntimeAtlas(host,{patterns,locale});}
 catch{host.textContent=locale==='zh-Hans'?'图谱暂不可用，请使用书籍章节入口。':'Atlas unavailable. Use the book chapter links.';return ()=>{};}
}

export async function mountRuntimeAtlas(host,locale){
 try{return await mountProgressiveExplorer(host,'BOOK-2',locale,()=>mountFullReadingView(host,locale));}catch{host.textContent=locale==='zh-Hans'?'主题暂不可用，请阅读书籍章节。':'Topics unavailable. Use the book chapter links.';return ()=>{};}
}
