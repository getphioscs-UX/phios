import {mountProgressiveExplorer} from './progressive-explorer.js';
import {enhanceExplorerShell} from './explorer-shell.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const BASE='/content/knowledge/structured/book-1/';
export function formationAskHref(object,detail,locale='en'){
 const params=new URLSearchParams({contextType:'KNOWLEDGE',contextRef:`CONCEPT:${detail.conceptId.replaceAll('_','-')}`,contextLabel:locale==='zh-Hans'?object.title:detail.titleEn,contextRoute:'/books/reality-formation/',readingPath:`/books/reality-formation/?mechanism=${object.objectId}#explorer`,relatedKnowledgeRef:`CONCEPT:${detail.conceptId.replaceAll('_','-')}`});
 return `/knowledge/ask/?${params}`;
}
export function renderFormationExplorer(host,{registry,chains,comparisons,locale='en',locationRef=window.location,historyRef=window.history,eventTarget=window}={}){
 const zh=locale==='zh-Hans',tr=(en,cn)=>zh?cn:en;
 const objects=registry.objects||[],details=registry.details||{};
 const title=o=>zh?o.title:details[o.objectId].titleEn;
 const summary=o=>zh?o.canonicalMeaning:details[o.objectId].summaryEn;
 let current;
 host.innerHTML=`<div class="formation-heading"><p>${tr('BOOK I · EXPLORE','第一册 · 探索')}</p><h2>${tr('How does reality take form?','现实怎样形成？')}</h2><p>${tr('Explore source-based definitions and their chapter connections. This structured preview is awaiting review; it does not diagnose your situation.','探索有来源的定义与章节关联。结构化预览仍待审核，不用于判断你的个人处境。')}</p></div><div class="formation-layout"><nav aria-label="${tr('Mechanisms and states','机制与状态')}"><label>${tr('Search','搜索')}<input type="search" data-formation-search></label><label>${tr('Type','类型')}<select data-formation-type><option value="">${tr('All types','全部类型')}</option>${[...new Set(objects.map(o=>o.objectType))].map(type=>`<option>${type}</option>`).join('')}</select></label><div data-formation-list></div></nav><div><h3>${tr('Formation sequence','形成顺序')}</h3><p>${tr('A partial G1–G4 reading sequence, not a causal guarantee.','G1–G4 的部分阅读顺序，不表示必然因果。')}</p><ol class="formation-chain">${chains.chains[0].stageSequence.map(id=>{const o=objects.find(x=>x.objectId===id);return `<li><button type="button" data-object="${esc(id)}">${esc(title(o))}</button></li>`;}).join('')}</ol><h3>${tr('Compare definitions','比较定义')}</h3>${comparisons.families.map(f=>`<div class="formation-comparison"><p>${esc(f.sharedDimension[locale])}</p>${f.memberIds.map(id=>{const o=objects.find(x=>x.objectId===id);return `<article><button type="button" data-object="${id}">${esc(title(o))}</button><p>${esc(summary(o))}</p></article>`;}).join('')}</div>`).join('')}</div><aside data-formation-inspector aria-label="${tr('Selected concept','所选概念')}"></aside></div>`;
 const input=host.querySelector('[data-formation-search]'),filter=host.querySelector('[data-formation-type]'),list=host.querySelector('[data-formation-list]'),inspector=host.querySelector('[data-formation-inspector]');
 function renderList(){const term=input.value.trim().toLowerCase();const matches=objects.filter(o=>(!filter.value||o.objectType===filter.value)&&`${title(o)} ${o.title} ${summary(o)}`.toLowerCase().includes(term));list.innerHTML=matches.length?matches.map(o=>`<button type="button" data-object="${o.objectId}" aria-pressed="${o.objectId===current}">${esc(title(o))}</button>`).join(''):`<p role="status">${tr('No matching concepts.','没有符合的概念。')}</p>`;}
 function select(id,push=false){
  const object=objects.find(o=>o.objectId===id);
  if(!object){current=null;inspector.innerHTML=`<h3>${tr('Concept unavailable','概念不可用')}</h3><p>${tr('Choose a concept from the list.','请从列表选择概念。')}</p>`;renderList();return;}
  current=id;const d=details[id];
  if(push){const url=new URL(locationRef.href);url.searchParams.set('mechanism',id);url.hash='explorer';historyRef.pushState(null,'',url);}
  inspector.innerHTML=`<h3>${esc(title(object))}</h3><p>${esc(summary(object))}</p>${!zh?`<p class="formation-note">English translation preview</p>`:''}<h4>${tr('Conditions, inputs and outputs','条件、输入与输出')}</h4><p>${tr('Not yet separately specified by the source mapping.','现有来源映射尚未分别明确这些字段。')}</p><h4>${tr('Related concepts','相关概念')}</h4>${d.relatedMechanisms.length?d.relatedMechanisms.map(ref=>`<button type="button" data-object="${ref}">${esc(title(objects.find(o=>o.objectId===ref)))}</button>`).join(''):`<p>${tr('No separately established links.','尚无单独确认的关联。')}</p>`}<h4>${tr('Transitions and examples','转换与例子')}</h4><p>${tr('No additional transitions or examples have been established for this preview.','本预览尚未单独确认其他转换或例子。')}</p><h4>${tr('Read the source','阅读来源')}</h4><ul>${d.sourceSections.map(s=>`<li>${esc(s.heading)} · ${tr('pages','页')} ${s.startPage}–${s.endPage} <small>${esc(s.sectionCode)}</small></li>`).join('')}</ul><a href="/book-one-preview">${tr('Open Book I preview','打开第一册试读')}</a><p>${tr('Chapter availability depends on your book access.','章节是否可读取决于书籍访问权限。')}</p>${d.articles.filter(a=>a.locale===locale).map(a=>`<p><a href="${esc(a.href)}">${esc(a.title)}</a></p>`).join('')}<p><a class="knowledge-action" data-formation-ask href="${esc(formationAskHref(object,d,locale))}">${tr('Ask about this concept','就此概念提问')}</a></p><details><summary>${tr('Source and evidence boundary','来源与证据边界')}</summary><p>${esc(object.nodeCode)}</p><p>${tr('Definition copied from the canonical concept registry and connected to approved manuscript mappings. Object classification and translation await human review.','定义来自规范概念登记，并连接已获准的稿件映射。对象分类与翻译仍待人工审核。')}</p></details>`;
  renderList();
  host.querySelectorAll('.formation-chain [data-object]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.object===current)));
 }
 const sync=()=>select(new URL(locationRef.href).searchParams.get('mechanism')||objects[0]?.objectId);
 const click=e=>{const button=e.target.closest('[data-object]');if(button&&host.contains(button)){const id=button.dataset.object;select(id,true);host.querySelector(`[data-object="${id}"]`)?.focus();}};
 host.addEventListener('click',click);input.addEventListener('input',renderList);filter.addEventListener('change',renderList);eventTarget.addEventListener('popstate',sync);sync();
 const disposeShell=enhanceExplorerShell(host,{layout:'.formation-layout',nav:'nav',inspector:'[data-formation-inspector]',locale});
 return ()=>{disposeShell();host.removeEventListener('click',click);input.removeEventListener('input',renderList);filter.removeEventListener('change',renderList);eventTarget.removeEventListener('popstate',sync);};
}
async function mountFullReadingView(host,locale){
 host.textContent=locale==='zh-Hans'?'正在加载形成探索器…':'Loading Formation Explorer…';
 try {const load=async name=>{const response=await fetch(BASE+name);if(!response.ok)throw new Error('FORMATION_SOURCE_UNAVAILABLE');return response.json();};const [registry,chains,comparisons]=await Promise.all(['book-1-mechanism-registry-v1.json','book-1-formation-chain-registry-v1.json','book-1-mechanism-comparison-families-v1.json'].map(load));if(!host.isConnected)return ()=>{};return renderFormationExplorer(host,{registry,chains,comparisons,locale});}
 catch {host.textContent=locale==='zh-Hans'?'探索器暂时无法加载，请使用上方阅读入口。':'The explorer is temporarily unavailable. Use the reading links above.';return ()=>{};}
}

export async function mountFormationExplorer(host,locale){
 try{return await mountProgressiveExplorer(host,'BOOK-1',locale,()=>mountFullReadingView(host,locale));}catch{host.textContent=locale==='zh-Hans'?'主题暂不可用，请阅读书籍章节。':'Topics unavailable. Use the book chapter links.';return ()=>{};}
}
