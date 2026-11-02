import {mountProgressiveExplorer} from './progressive-explorer.js';
import {enhanceExplorerShell} from './explorer-shell.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderMaintenanceExplorer(host,{entries,locale='en',locationRef=globalThis.location||{href:'https://local/'},historyRef=globalThis.history,eventTarget=globalThis.window}){
 const zh=locale==='zh-Hans',tr=(en,cn)=>zh?cn:en;
 host.innerHTML=`<h2>${tr('Maintenance and recovery','维持与恢复')}</h2><p>${tr('Explore Book III source chapters. These topics do not classify your current state or prescribe recovery. Source titles remain in Chinese while translation is reviewed.','探索第三册来源章节。以下主题不判定你的当前状态，也不提供恢复处方。定义与状态转换将集中审核。')}</p><label>${tr('Find a topic','查找主题')} <input type="search"></label><div class="maintenance-layout"><nav class="maintenance-topics"></nav><article data-maintenance-inspector></article></div>`;
 const input=host.querySelector('input'),list=host.querySelector('.maintenance-topics');
 const render=()=>{const matches=entries.filter(e=>`${e.title} ${e.canonicalQuestion} ${e.family}`.toLowerCase().includes(input.value.trim().toLowerCase()));list.innerHTML=matches.map(e=>`<details data-topic="${esc(e.objectId)}"><summary>${esc(e.title)}</summary><p>${esc(e.canonicalQuestion)}</p><p>${tr('Source pages','来源页码')} ${e.sourceSections.map(s=>`${s.startPage}–${s.endPage}`).join(', ')}</p><p>${tr('Observable indicators, thresholds and recovery windows await paragraph extraction and review.','可观察指标、阈值与恢复窗口仍待正文提取和审核。')}</p><small>${esc(e.nodeCode)}</small></details>`).join('')||`<p role="status">${tr('No matching topics','没有符合的主题')}</p>`;};
 input.addEventListener('input',render);render();
 const show=id=>{const e=entries.find(e=>e.objectId===id);host.querySelector('[data-maintenance-inspector]').innerHTML=e?`<h3>${esc(e.title)}</h3><p>${esc(e.canonicalQuestion)}</p><p>${tr('Source pages','来源页码')} ${e.sourceSections.map(s=>s.startPage+'–'+s.endPage).join(', ')}</p><p>${tr('Indicators and transitions await paragraph extraction and review.','指标与转换仍待正文提取和审核。')}</p>`:`<h3>${tr('Choose a topic','选择主题')}</h3>`;};
 const sync=()=>{const url=new URL(locationRef.href),id=url.searchParams.get('topic')||url.searchParams.get('degradation');for(const item of list.querySelectorAll('details'))item.open=item.dataset.topic===id;show(id);};
 const click=e=>{const summary=e.target.closest('summary');if(!summary||!list.contains(summary))return;const url=new URL(locationRef.href);if(summary.parentElement.open)url.searchParams.delete('topic');else url.searchParams.set('topic',summary.parentElement.dataset.topic);url.searchParams.delete('degradation');url.hash='maintenance';historyRef?.pushState(null,'',url);show(url.searchParams.get('topic'));};
 const restore=()=>sync();input.addEventListener('input',restore);host.addEventListener('click',click);eventTarget?.addEventListener('popstate',sync);sync();
 const disposeShell=enhanceExplorerShell(host,{layout:'.maintenance-layout',nav:'.maintenance-topics',inspector:'[data-maintenance-inspector]',locale});
 return ()=>{disposeShell();input.removeEventListener('input',render);input.removeEventListener('input',restore);host.removeEventListener('click',click);eventTarget?.removeEventListener('popstate',sync);};
}
async function mountFullReadingView(host,locale){
 try{const response=await fetch('/content/knowledge/structured/book-3/book-3-maintenance-signal-registry-v1.json');if(!response.ok)throw new Error('unavailable');const {entries}=await response.json();if(!host.isConnected)return ()=>{};return renderMaintenanceExplorer(host,{entries,locale});}
 catch{host.textContent=locale==='zh-Hans'?'维持与恢复目录暂不可用。':'Maintenance topics are unavailable.';return ()=>{};}
}

export async function mountMaintenanceExplorer(host,locale){
 try{return await mountProgressiveExplorer(host,'BOOK-3',locale,()=>mountFullReadingView(host,locale));}catch{host.textContent=locale==='zh-Hans'?'主题暂不可用，请阅读书籍章节。':'Topics unavailable. Use the book chapter links.';return ()=>{};}
}
