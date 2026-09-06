import {BOOK_ROUTE_BY_ID,articleHref,figureHasCanonicalBookOwnership,loadCanonicalParts,loadFigureRegistry,loadPublishedArticles} from '../../../js/cx-knowledge-source-adapter.js';
import {hydrateCustomerAssets} from '../assets.js';

const $=(selector,scope=document)=>scope.querySelector(selector);
const $$=(selector,scope=document)=>[...scope.querySelectorAll(selector)];
const clean=value=>String(value??'').trim();
const esc=value=>clean(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const locale=()=>String(document.documentElement.lang||'en').toLowerCase().startsWith('zh')?'zh-Hans':'en';
const tr=(en,zh)=>locale()==='zh-Hans'?zh:en;
const label=(value)=>typeof value==='object'?(value?.[locale()]||value?.en||value?.['zh-Hans']||''):clean(value);
const fetchJson=async path=>{const response=await fetch(path,{credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`CX_KNOWLEDGE_SOURCE_UNAVAILABLE:${path}`);return response.json()};
const state={articles:new Map(),books:null,concepts:null,figures:null,parts:null};

const BOOK_ROLE={
 'BOOK-1':{en:'How reality forms',zh:'现实如何形成'},
 'BOOK-2':{en:'How reality runs',zh:'现实如何运行'},
 'BOOK-3':{en:'How reality maintains continuity',zh:'现实如何维持与延续'},
 'BOOK-4':{en:'How reality scales into civilization',zh:'现实如何扩展到文明尺度'},
 'BOOK-5':{en:'How reality is navigated and reviewed',zh:'现实如何被导航与复核'}
};
const BOOK_ASSET={'BOOK-1':'BOOK-1-HARDCOVER','BOOK-2':'BOOK-2-HARDCOVER','BOOK-3':'BOOK-3-HARDCOVER','BOOK-4':'BOOK-4-HARDCOVER','BOOK-5':'BOOK-5-HARDCOVER'};
const BOOK_ROUTE={'BOOK-1':'/books/reality-formation/','BOOK-2':'/books/reality-runtime/','BOOK-3':'/books/reality-continuity/','BOOK-4':'/books/reality-civilization/','BOOK-5':'/books/reality-navigation/'};

function askHref(kind,ref,labelText,route){
 const params=new URLSearchParams({contextType:'KNOWLEDGE',contextRef:`${kind}:${ref}`,contextLabel:clean(labelText).slice(0,160),contextRoute:clean(route).slice(0,240)});
 return `/knowledge/ask/?${params.toString()}`;
}
function relatedLabel(article){
 const context=article?.publicationContext||{};
 const part=label(context.partTitle)||clean(context.partCode);
 const book=label(context.bookTitle)||clean(context.publicationBookCode||context.bookCode);
 const related=[book,part].filter(Boolean);
 return related.join(' · ')||tr('Published PHI OS knowledge','已发布 PHI OS 知识');
}
function articleCard(article){
 const href=articleHref(article);
 const title=clean(article?.title)||tr('Untitled article','未命名文章');
 const date=clean(article?.publishedAt);
 return `<article class="cx-knowledge-article-card"><div class="cx-stack"><div class="cx-knowledge-meta-row"><span>${esc(tr('Article','文章'))}</span>${date?`<time datetime="${esc(date)}">${esc(date.slice(0,10))}</time>`:''}</div><h3 class="cx-heading-3">${esc(title)}</h3><p>${esc(article?.summary||article?.shortAnswer||'')}</p><div class="cx-meta">${esc(relatedLabel(article))}</div></div><div class="cx-cluster"><a class="cx-button cx-button--text" href="${esc(href)}">${esc(tr('Read article →','阅读文章 →'))}</a><a class="cx-button cx-button--quiet" href="${esc(askHref('ARTICLE',article.slug,title,href))}">${esc(tr('Ask about this','针对这个提问'))}</a></div></article>`;
}
async function articlesForLocale(){
 const key=locale();
 if(!state.articles.has(key))state.articles.set(key,loadPublishedArticles(key));
 return state.articles.get(key);
}
async function books(){if(!state.books)state.books=fetchJson('/content/registry/books.json');return state.books}
async function concepts(){if(!state.concepts)state.concepts=fetchJson('/content/registry/concepts.json');return state.concepts}
async function figures(){if(!state.figures)state.figures=loadFigureRegistry();return state.figures}
async function parts(){if(!state.parts)state.parts=loadCanonicalParts();return state.parts}
function loading(node){if(node)node.innerHTML=`<div class="cx-knowledge-state">${esc(tr('Loading published knowledge…','正在读取已发布知识……'))}</div>`}
function unavailable(node){if(node)node.innerHTML=`<div class="cx-knowledge-state">${esc(tr('This knowledge view is temporarily unavailable.','这个知识视图暂时无法读取。'))}</div>`}

async function renderHome(){
 const node=$('[data-cx-knowledge-featured]');if(!node)return;loading(node);
 try{const list=[...(await articlesForLocale())].sort((a,b)=>clean(b.publishedAt).localeCompare(clean(a.publishedAt))||Number(a.publicationOrder)-Number(b.publicationOrder)).slice(0,3);node.innerHTML=list.length?list.map(articleCard).join(''):`<div class="cx-knowledge-state">${esc(tr('No published articles are available in this language yet.','这个语言目前还没有可显示的已发布文章。'))}</div>`}catch{unavailable(node)}
}

function bookCard(book){
 const code=book.bookCode;const title=label(book.title);const subtitle=label(book.subtitle);const role=BOOK_ROLE[code]?.[locale()==='zh-Hans'?'zh':'en']||subtitle;const href=BOOK_ROUTE[code]||BOOK_ROUTE_BY_ID[book.book_id]||'/books/';
 return `<article class="cx-knowledge-book-card"><figure class="cx-knowledge-book-card__cover cx-visual"><img data-cx-asset="${esc(BOOK_ASSET[code])}" alt="${esc(title)}"><span class="cx-knowledge__asset-fallback cx-meta" data-cx-asset-fallback hidden>${esc(tr('Cover temporarily unavailable','封面暂时无法显示'))}</span></figure><div class="cx-knowledge-book-card__body"><div class="cx-knowledge-meta-row"><span>${esc(tr(`Volume ${book.volume}`,`第 ${book.volume} 册`))}</span><span>${esc(clean(book.content_status).replaceAll('-',' '))}</span></div><h2 class="cx-heading-2">${esc(title)}</h2><p class="cx-knowledge-book-card__role">${esc(role)}</p>${subtitle&&subtitle!==role?`<p class="cx-meta">${esc(subtitle)}</p>`:''}<div class="cx-cluster"><a class="cx-button cx-button--secondary" href="${esc(href)}">${esc(tr('Open volume','打开本册'))}</a><a class="cx-button cx-button--quiet" href="${esc(askHref('BOOK',code,title,href))}">${esc(tr('Ask about this','针对这册提问'))}</a></div></div></article>`;
}
async function renderBooks(){const node=$('[data-cx-book-grid]');if(!node)return;loading(node);try{const registry=await books();node.innerHTML=(registry.books||[]).sort((a,b)=>Number(a.volume)-Number(b.volume)).map(bookCard).join('');await hydrateCustomerAssets(node)}catch{unavailable(node)}}

function articleVolume(article){const context=article?.publicationContext||{};if(Number.isInteger(context.publicationVolume))return String(context.publicationVolume);const code=clean(context.publicationBookCode||context.bookCode);const match=code.match(/BOOK-(\d+)/);return match?match[1]:'unknown'}
function articleTopics(article){const tags=article?.taxonomy?.tags||[];const theme=clean(article?.taxonomy?.themeCode);return [...new Set([theme,...tags].map(clean).filter(Boolean))]}
async function renderArticles(){
 const grid=$('[data-cx-article-grid]'),filters=$('[data-cx-article-filters]'),summary=$('[data-cx-article-summary]');if(!grid||!filters)return;loading(grid);
 try{const list=await articlesForLocale();const volumeSelect=$('select[name="volume"]',filters),topicSelect=$('select[name="topic"]',filters);const volumes=[...new Set(list.map(articleVolume).filter(v=>/^\d+$/.test(v)))].sort((a,b)=>Number(a)-Number(b));const topics=[...new Set(list.flatMap(articleTopics))].sort((a,b)=>a.localeCompare(b));
  volumeSelect.innerHTML=`<option value="all">${esc(tr('All volumes','全部册别'))}</option>`+volumes.map(v=>`<option value="${esc(v)}">${esc(tr(`Volume ${v}`,`第 ${v} 册`))}</option>`).join('');topicSelect.innerHTML=`<option value="all">${esc(tr('All topics','全部主题'))}</option>`+topics.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
  const draw=()=>{const order=filters.elements?.order?.value||$('select[name="order"]',filters)?.value||'latest',volume=volumeSelect.value,topic=topicSelect.value;let visible=list.filter(a=>(volume==='all'||articleVolume(a)===volume)&&(topic==='all'||articleTopics(a).includes(topic)));visible=[...visible].sort(order==='latest'?((a,b)=>clean(b.publishedAt).localeCompare(clean(a.publishedAt))||Number(a.publicationOrder)-Number(b.publicationOrder)):((a,b)=>Number(a.publicationOrder)-Number(b.publicationOrder)));grid.innerHTML=visible.length?visible.map(articleCard).join(''):`<div class="cx-knowledge-state">${esc(tr('No published articles match these filters.','没有已发布文章符合这些筛选条件。'))}</div>`;if(summary)summary.textContent=tr(`${visible.length} published articles`,`${visible.length} 篇已发布文章`)};
  filters.addEventListener('change',draw,{once:false});draw();
 }catch{unavailable(grid)}
}

function figureCard(figure){const title=label(figure.title)||`Figure ${figure.figure_number}`;const route=`/figure?id=${encodeURIComponent(figure.figure_id)}`;return `<article class="cx-knowledge-figure-card" id="${esc(figure.figure_id)}"><div class="cx-knowledge-figure-card__mark"><strong>FIG ${esc(figure.figure_number)}</strong><span>${esc(tr(`Part ${figure.part}`,`第 ${figure.part} 部分`))}</span></div><div class="cx-stack"><div class="cx-knowledge-meta-row"><span>${esc(tr(`Book ${figure.book}`,`第 ${figure.book} 册`))}</span><span>${esc(clean(figure.status).replaceAll('-',' '))}</span></div><h3 class="cx-heading-3">${esc(title)}</h3><p>${esc(figure.purpose)}</p></div><div class="cx-cluster"><a class="cx-button cx-button--text" href="${esc(route)}">${esc(tr('Open figure →','打开图示 →'))}</a><a class="cx-button cx-button--quiet" href="${esc(askHref('FIGURE',figure.figure_id,title,route))}">${esc(tr('Ask about this','针对这张图提问'))}</a></div></article>`}
async function renderFigures(){const grid=$('[data-cx-figure-grid]'),select=$('[data-cx-figure-part]'),summary=$('[data-cx-figure-summary]');if(!grid||!select)return;loading(grid);try{const [registry,partsRegistry]=await Promise.all([figures(),parts()]);const list=(registry.figures||[]).filter(f=>figureHasCanonicalBookOwnership(f,partsRegistry));const partValues=[...new Set(list.map(f=>String(f.part)))].sort((a,b)=>Number(a)-Number(b));select.innerHTML=`<option value="all">${esc(tr('All parts','全部部分'))}</option>`+partValues.map(v=>`<option value="${esc(v)}">${esc(tr(`Part ${v}`,`第 ${v} 部分`))}</option>`).join('');const draw=()=>{const selected=select.value;const visible=list.filter(f=>selected==='all'||String(f.part)===selected);grid.innerHTML=visible.map(figureCard).join('');if(summary)summary.textContent=tr(`${visible.length} canonical figures`,`${visible.length} 张规范图示`)};select.addEventListener('change',draw);draw()}catch{unavailable(grid)}}

function conceptDefinition(concept,enMap){if(locale()==='zh-Hans')return clean(concept.definition);return clean(enMap.get(concept.id)||concept.definition)}
async function loadEnglishConceptDefinitions(){try{const data=await fetchJson('/content/knowledge/glossary-en.json');if(data?.definitions&&typeof data.definitions==='object'&&!Array.isArray(data.definitions))return new Map(Object.entries(data.definitions).map(([key,value])=>[clean(key),clean(value)]).filter(([k,v])=>k&&v));const rows=Array.isArray(data)?data:(data.terms||data.concepts||data.entries||[]);return new Map(rows.map(row=>[clean(row.id||row.key||row.termId||row.slug),clean(row.definition||row.en||row.meaning)]).filter(([k,v])=>k&&v))}catch{return new Map()}}
function conceptCard(concept,enMap){const title=locale()==='zh-Hans'?clean(concept['zh-Hans']):clean(concept.en);return `<article class="cx-knowledge-concept-card" id="term-${esc(concept.id)}"><div class="cx-knowledge-meta-row"><span>${esc(tr(`Part ${concept.part}`,`第 ${concept.part} 部分`))}</span><span>${esc(clean(concept.status))}</span></div><h3 class="cx-heading-3">${esc(title)}</h3><p>${esc(conceptDefinition(concept,enMap))}</p>${locale()==='zh-Hans'&&concept.en?`<div class="cx-meta">${esc(concept.en)}</div>`:''}</article>`}
async function renderConcepts(){const grid=$('[data-cx-concept-grid]'),form=$('[data-cx-concept-search-form]'),summary=$('[data-cx-concept-summary]');if(!grid||!form)return;loading(grid);try{const [registry,enMap]=await Promise.all([concepts(),loadEnglishConceptDefinitions()]);const list=registry.concepts||[];const draw=()=>{const q=clean(form.elements.q?.value).toLowerCase();const visible=list.filter(c=>!q||[c.id,c.en,c['zh-Hans'],c.definition,enMap.get(c.id)].map(clean).join(' ').toLowerCase().includes(q));grid.innerHTML=visible.map(c=>conceptCard(c,enMap)).join('');if(summary)summary.textContent=tr(`${visible.length} concepts`,`${visible.length} 个概念`)};form.addEventListener('submit',event=>{event.preventDefault();draw()});form.elements.q?.addEventListener('input',draw);draw()}catch{unavailable(grid)}}

async function searchCorpus(){
 const [articleList,bookRegistry,conceptRegistry,figureRegistry,partsRegistry]=await Promise.all([articlesForLocale().catch(()=>[]),books().catch(()=>({books:[]})),concepts().catch(()=>({concepts:[]})),figures().catch(()=>({figures:[]})),parts().catch(()=>({parts:[]}))]);
 const articleRows=articleList.map(a=>({type:'ARTICLE',title:a.title,summary:a.summary||a.shortAnswer,source:relatedLabel(a),related:articleTopics(a).slice(0,3).join(' · '),href:articleHref(a),ask:askHref('ARTICLE',a.slug,a.title,articleHref(a)),terms:[a.title,a.summary,a.shortAnswer,a.displayQuestion,...articleTopics(a)].join(' ')}));
 const bookRows=(bookRegistry.books||[]).map(b=>{const title=label(b.title),href=BOOK_ROUTE[b.bookCode]||'/books/';return {type:'BOOK',title,summary:label(b.subtitle),source:tr(`PHI OS Volume ${b.volume}`,`PHI OS 第 ${b.volume} 册`),related:BOOK_ROLE[b.bookCode]?.[locale()==='zh-Hans'?'zh':'en']||'',href,ask:askHref('BOOK',b.bookCode,title,href),terms:[title,label(b.subtitle),BOOK_ROLE[b.bookCode]?.en,BOOK_ROLE[b.bookCode]?.zh].join(' ')}});
 const conceptRows=(conceptRegistry.concepts||[]).map(c=>({type:'CONCEPT',title:locale()==='zh-Hans'?c['zh-Hans']:c.en,summary:c.definition,source:tr('PHI OS concept registry','PHI OS 概念表'),related:tr(`Part ${c.part}`,`第 ${c.part} 部分`),href:`/knowledge/concepts/#term-${encodeURIComponent(c.id)}`,ask:null,terms:[c.id,c.en,c['zh-Hans'],c.definition].join(' ')}));
 const figureRows=(figureRegistry.figures||[]).filter(f=>figureHasCanonicalBookOwnership(f,partsRegistry)).map(f=>{const title=label(f.title),href=`/figure?id=${encodeURIComponent(f.figure_id)}`;return {type:'FIGURE',title,summary:f.purpose,source:tr(`Book ${f.book} · Figure ${f.figure_number}`,`第 ${f.book} 册 · 图 ${f.figure_number}`),related:tr(`Part ${f.part}`,`第 ${f.part} 部分`),href,ask:askHref('FIGURE',f.figure_id,title,href),terms:[title,f.purpose,f.figure_number,f.figure_id].join(' ')}});
 return [...articleRows,...bookRows,...figureRows,...conceptRows];
}
function resultType(type){return ({ARTICLE:tr('Article','文章'),BOOK:tr('Book','书籍'),FIGURE:tr('Figure','图示'),CONCEPT:tr('Concept','概念')})[type]||type}
function resultCard(item){return `<article class="cx-knowledge-result"><div class="cx-knowledge-result__type">${esc(resultType(item.type))}</div><div class="cx-stack"><h2 class="cx-heading-3"><a href="${esc(item.href)}">${esc(item.title)}</a></h2><p>${esc(item.summary)}</p><dl class="cx-knowledge-result__facts"><div><dt>${esc(tr('Source','来源'))}</dt><dd>${esc(item.source)}</dd></div><div><dt>${esc(tr('Related','相关'))}</dt><dd>${esc(item.related||tr('PHI OS knowledge','PHI OS 知识'))}</dd></div></dl><div class="cx-cluster"><a class="cx-button cx-button--text" href="${esc(item.href)}">${esc(tr('Open →','打开 →'))}</a>${item.ask?`<a class="cx-button cx-button--quiet" href="${esc(item.ask)}">${esc(tr('Ask about this','针对这个提问'))}</a>`:''}</div></div></article>`}
async function renderSearch(){const form=$('[data-cx-knowledge-search-form]'),node=$('[data-cx-knowledge-search-results]'),summary=$('[data-cx-knowledge-search-summary]');if(!form||!node)return;loading(node);try{const corpus=await searchCorpus();const params=new URLSearchParams(location.search),initial=clean(params.get('q'));if(initial)form.elements.q.value=initial;const draw=()=>{const q=clean(form.elements.q.value).toLowerCase();const words=q.split(/\s+/).filter(Boolean);let rows=!words.length?corpus.slice(0,12):corpus.map(item=>{const hay=clean(item.terms).toLowerCase();const score=words.reduce((n,w)=>n+(hay.includes(w)?1:0),0);return {...item,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));node.innerHTML=rows.length?rows.map(resultCard).join(''):`<div class="cx-knowledge-state">${esc(tr('No published knowledge matched this search.','没有已发布知识符合这次搜索。'))}</div>`;summary.textContent=q?tr(`${rows.length} results for “${q}”`,`${rows.length} 个与“${q}”相关的结果`):tr('Showing a mixed starting set across articles, books, figures and concepts.','先显示文章、书籍、图示与概念的混合入口。')};form.addEventListener('submit',event=>{event.preventDefault();draw();const url=new URL(location.href);const q=clean(form.elements.q.value);q?url.searchParams.set('q',q):url.searchParams.delete('q');history.replaceState({},'',url)});draw()}catch{unavailable(node)}}

async function render(){
 const view=document.body.dataset.cxKnowledgeView;
 if(view==='home')await renderHome();
 if(view==='search')await renderSearch();
 if(view==='articles')await renderArticles();
 if(view==='books')await renderBooks();
 if(view==='figures')await renderFigures();
 if(view==='concepts')await renderConcepts();
}

let rendering=false;
async function boot(){if(rendering)return;rendering=true;try{await render()}finally{rendering=false}}
window.addEventListener('phios:localechange',()=>boot());
boot();
