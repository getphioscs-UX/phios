import { getLocale, onLocaleChange } from '../i18n.js';
import { askPhios } from '../knowledge/ask-phios-client.js';

const form=document.querySelector('[data-knowledge-search-form]');
const input=document.querySelector('[data-knowledge-query]');
const depth=document.querySelector('[data-answer-depth]');
const status=document.querySelector('[data-knowledge-status]');
const results=document.querySelector('[data-knowledge-results]');
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

function copy(){
  const zh=getLocale()==='zh-Hans';
  return zh?{
    answer:'回答',mechanism:'为什么会这样',why:'为什么重要',observe:'可以观察什么',unknown:'仍然未知',related:'相关知识',sources:'依据',boundary:'边界',
    sourcePublished:'已发布 Canonical Knowledge',sourceManuscript:'已审核 Manuscript Knowledge',searching:'正在读取受治理 PHI OS Knowledge…',
    empty:'请输入一个问题。',failed:'目前无法完成 Ask PHI OS 回答。',coverage:'Knowledge coverage',noAi:'本次回答没有使用生成式 AI。'
  }:{
    answer:'Answer',mechanism:'Why this can happen',why:'Why it matters',observe:'What to observe',unknown:'What remains unknown',related:'Related knowledge',sources:'Grounding',boundary:'Boundary',
    sourcePublished:'Published canonical knowledge',sourceManuscript:'Reviewed manuscript knowledge',searching:'Reading governed PHI OS Knowledge…',
    empty:'Enter a question for Ask PHI OS.',failed:'Ask PHI OS could not complete this answer.',coverage:'Knowledge coverage',noAi:'No generative AI was used for this answer.'
  };
}

function setStatus(message,state='idle'){status.textContent=message;status.dataset.state=state;}
function listSection(title,items){
  if(!items?.length)return '';
  return `<section class="knowledge-source-group"><h2>${escapeHtml(title)}</h2><ul>${items.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
}
function sourceLabel(source,c){return source.sourceType==='PUBLISHED_CANONICAL_ARTICLE'?c.sourcePublished:c.sourceManuscript;}
function renderSources(payload,c){
  if(!payload.sources?.length)return '';
  return `<section class="knowledge-source-group"><h2>${escapeHtml(c.sources)}</h2><div class="knowledge-manuscript-results">${payload.sources.map(source=>`<article class="knowledge-manuscript-source">
    <p class="knowledge-eyebrow">${escapeHtml(sourceLabel(source,c))}</p>
    <p>${escapeHtml(source.questionScopedExcerpt||'')}</p>
    <p class="knowledge-source-meta">${escapeHtml([source.nodeCode,source.fragmentCode||source.sectionCode,source.partCode].filter(Boolean).join(' · '))}</p>
    ${source.href?`<a class="knowledge-action" href="${escapeHtml(source.href)}">${escapeHtml(getLocale()==='zh-Hans'?'查看已发布知识':'Open published knowledge')}</a>`:''}
  </article>`).join('')}</div></section>`;
}
function render(payload){
  const c=copy();
  const answer=payload.answer;
  const content=answer?.content||{};
  const article=document.createElement('article');
  article.className='knowledge-search-result';
  article.innerHTML=`
    <section class="knowledge-source-group knowledge-grounded-answer">
      <p class="knowledge-eyebrow">Ask PHI OS · ${escapeHtml(payload.answerDepth)} · ${escapeHtml(answer.coverageStatus)}</p>
      <h2>${escapeHtml(c.answer)}</h2>
      <p>${escapeHtml(content.directAnswer||'')}</p>
      <p class="knowledge-source-meta">${escapeHtml(c.noAi)}</p>
    </section>
    ${listSection(c.mechanism,content.mechanism)}
    ${listSection(c.why,content.whyItMatters)}
    ${listSection(c.observe,content.whatToObserve)}
    ${listSection(c.unknown,content.unknowns)}
    ${listSection(c.related,content.relatedKnowledge)}
    ${renderSources(payload,c)}
    <aside class="knowledge-search-boundary"><strong>${escapeHtml(c.boundary)}</strong>${(payload.boundary?.limits||content.boundaries||[]).map(item=>`<p>${escapeHtml(item)}</p>`).join('')}</aside>`;
  results.replaceChildren(article);
  setStatus(`${c.coverage}: ${answer.coverageStatus}. ${payload.sources?.length||0} governed source projection(s).`,'results');
}
async function submit(event){
  event?.preventDefault();
  const query=input.value.trim();
  const c=copy();
  if(!query){setStatus(c.empty,'invalid');input.focus();return;}
  setStatus(c.searching,'loading');results.replaceChildren();
  try{
    render(await askPhios({query,locale:getLocale(),depth:depth?.value||'STANDARD',source:'hybrid'}));
  }catch(error){
    setStatus(`${c.failed}${error?.code?` (${error.code})`:''}`,'error');
  }
}
form?.addEventListener('submit',submit);
onLocaleChange(()=>{if(input.value.trim())submit();});
const initialQuery=new URLSearchParams(location.search).get('q');
if(initialQuery){input.value=initialQuery;queueMicrotask(()=>submit());}
