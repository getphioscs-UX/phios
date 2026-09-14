const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderMaintenanceExplorer(host,{entries,locale='en'}){
 const zh=locale==='zh-Hans',tr=(en,cn)=>zh?cn:en;
 host.innerHTML=`<h2>${tr('Maintenance and recovery','维持与恢复')}</h2><p>${tr('Explore Book III source chapters. These topics do not classify your current state or prescribe recovery. Source titles remain in Chinese while translation is reviewed.','探索第三册来源章节。以下主题不判定你的当前状态，也不提供恢复处方。定义与状态转换将集中审核。')}</p><label>${tr('Find a topic','查找主题')} <input type="search"></label><div class="maintenance-topics"></div>`;
 const input=host.querySelector('input'),list=host.querySelector('.maintenance-topics');
 const render=()=>{const matches=entries.filter(e=>`${e.title} ${e.canonicalQuestion} ${e.family}`.toLowerCase().includes(input.value.trim().toLowerCase()));list.innerHTML=matches.map(e=>`<details><summary>${esc(e.title)}</summary><p>${esc(e.canonicalQuestion)}</p><p>${tr('Source pages','来源页码')} ${e.sourceSections.map(s=>`${s.startPage}–${s.endPage}`).join(', ')}</p><p>${tr('Observable indicators, thresholds and recovery windows await paragraph extraction and review.','可观察指标、阈值与恢复窗口仍待正文提取和审核。')}</p><small>${esc(e.nodeCode)}</small></details>`).join('')||`<p role="status">${tr('No matching topics','没有符合的主题')}</p>`;};
 input.addEventListener('input',render);render();
 const topic=new URL(globalThis.location?.href||'https://local/').searchParams.get('topic');
 const index=entries.findIndex(e=>e.objectId===topic);
 if(index>=0)list.querySelectorAll('details')[index]?.setAttribute('open','');
 return ()=>input.removeEventListener('input',render);
}
export async function mountMaintenanceExplorer(host,locale){
 try{const response=await fetch('/content/knowledge/structured/book-3/book-3-maintenance-signal-registry-v1.json');if(!response.ok)throw new Error('unavailable');const {entries}=await response.json();if(!host.isConnected)return ()=>{};return renderMaintenanceExplorer(host,{entries,locale});}
 catch{host.textContent=locale==='zh-Hans'?'维持与恢复目录暂不可用。':'Maintenance topics are unavailable.';return ()=>{};}
}
