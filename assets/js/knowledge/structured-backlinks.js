import {structuredLoader} from './structured-loader.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderStructuredBacklinks(host,{objects,backlinks,bookCode,locale='en'}){
 const tr=(en,zh)=>locale==='zh-Hans'?zh:en,available=objects.filter(o=>o.bookCode===bookCode),byId=new Map(backlinks.map(b=>[b.objectId,b]));
 host.innerHTML=`<details><summary>${tr('Trace topics to their sources','查看主题的来源回链')}</summary><label>${tr('Source topic (original title)','来源主题（原文标题）')} <select>${available.map(o=>`<option value="${esc(o.objectId)}">${esc(o.title)}</option>`).join('')}</select></label><div data-source-links></div></details>`;
 const select=host.querySelector('select'),target=host.querySelector('[data-source-links]');
 function update(){const b=byId.get(select.value);if(!b){target.textContent=tr('Source unavailable','来源不可用');return;}
 const articles=b.publishedArticles.filter(a=>a.locale===locale);
 target.innerHTML=`<p><a href="${esc(b.explorerHref)}">${tr('Open topic','打开主题')}</a> · <a href="${esc(b.bookSection.href)}">${tr('Book section','书籍章节')} ${esc(b.bookSection.partCode)}</a></p><h4>${tr('Published reading','已发布阅读')}</h4>${articles.length?`<ul>${articles.map(a=>`<li><a href="${esc(a.href)}">${esc(a.title)}</a></li>`).join('')}</ul>`:`<p>${tr('No published article is bound in this language.','此语言尚无已发布文章绑定。')}</p>`}<h4>${tr('Manuscript provenance','稿件来源')}</h4><ul>${b.manuscriptSections.map(s=>`<li>${esc(s.sectionCode)} · ${s.startPage}–${s.endPage}</li>`).join('')}</ul><p>${tr('Page references do not grant access to private manuscript text.','页码引用不授予私有稿件正文访问权限。')}</p><details><summary>${tr('Canonical record','规范记录')}</summary><a href="/${esc(b.canonicalNode.registryPath)}">${esc(b.canonicalNode.nodeCode)}</a></details>`;}
 const refresh=()=>{update();if(!byId.has(select.value))return;const link=host.ownerDocument.createElement('a');link.textContent=tr('Ask about this topic','就此主题提问');link.href='/knowledge/ask/?'+new URLSearchParams({contextType:'KNOWLEDGE',contextRef:'CONCEPT:'+select.value.toLowerCase(),contextLabel:available.find(o=>o.objectId===select.value)?.title||select.value});target.append(link);};
 select.addEventListener('change',refresh);refresh();return ()=>select.removeEventListener('change',refresh);
}
export async function mountStructuredBacklinks(host,bookCode,locale){
 const tr=(en,zh)=>locale==='zh-Hans'?zh:en;let disposed=false,revision=0;
 try{const book=await structuredLoader.book(bookCode);if(!host.isConnected)return ()=>{};
 host.innerHTML='<details><summary>'+tr('Trace topics to their sources','查看主题的来源回链')+'</summary><label>'+tr('Topic','主题')+' <select>'+Object.entries(book.objects).map(([id,o])=>'<option value="'+esc(id)+'">'+esc(locale==='en'?(o.titleEn||o.title):o.title)+'</option>').join('')+'</select></label><div data-lazy-source></div></details>';
 const details=host.querySelector('details'),select=host.querySelector('select'),target=host.querySelector('[data-lazy-source]');
 async function refresh(){if(!details.open)return;const ticket=++revision;target.textContent=tr('Loading…','正在加载…');try{const r=await structuredLoader.object(bookCode,select.value);if(disposed||ticket!==revision)return;target.innerHTML='<ul>'+r.backlink.publishedArticles.filter(a=>a.locale===locale).map(a=>'<li><a href="'+esc(a.href)+'">'+esc(a.title)+'</a></li>').join('')+'</ul><p><a href="'+esc(r.backlink.explorerHref)+'">'+tr('Open topic','打开主题')+'</a></p><ul>'+r.backlink.manuscriptSections.map(s=>'<li>'+esc(s.sectionCode)+' · '+s.startPage+'–'+s.endPage+'</li>').join('')+'</ul><p>'+tr('Page references do not grant access to private manuscript text.','页码引用不授予私有稿件正文访问权限。')+'</p>';}catch{if(!disposed&&ticket===revision)target.textContent=tr('Source unavailable','来源暂不可用');}}
 details.addEventListener('toggle',refresh);select.addEventListener('change',refresh);return ()=>{disposed=true;revision++;details.removeEventListener('toggle',refresh);select.removeEventListener('change',refresh);};
 }catch{host.textContent=tr('Source links unavailable','来源回链暂不可用');return ()=>{};}
}
