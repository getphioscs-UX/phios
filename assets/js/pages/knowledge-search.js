import { getLocale, onLocaleChange } from '../i18n.js';
import { queryPublishedKnowledge } from '../knowledge/published-api-client.js';

const form=document.querySelector('[data-knowledge-search-form]');
const input=document.querySelector('[data-knowledge-query]');
const mode=document.querySelector('[data-projection-mode]');
const status=document.querySelector('[data-knowledge-status]');
const results=document.querySelector('[data-knowledge-results]');
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

function setStatus(message,state='idle'){status.textContent=message;status.dataset.state=state;}
function render(payload){
  if(payload.coverage.level==='none'){results.replaceChildren();setStatus('No published coverage is available for this query.','no_coverage');return;}
  const projection=payload.projection;
  const article=document.createElement('article');
  article.className='knowledge-search-result';
  article.innerHTML=`
    <header>
      <p class="knowledge-eyebrow">Published knowledge · ${escapeHtml(payload.coverage.level)} coverage</p>
      <h2>${escapeHtml(payload.results[0].title)}</h2>
      <p>${escapeHtml(payload.results[0].summary)}</p>
      <a class="knowledge-action knowledge-action--primary" href="${escapeHtml(payload.results[0].href)}">Read published article</a>
    </header>
    <div class="knowledge-search-fragments">
      ${projection.fragments.map(fragment=>fragment.kind==='heading'
        ? `<h3>${escapeHtml(fragment.text.replace(/^#\\s*/,''))}</h3>`
        : `<p>${escapeHtml(fragment.text)}</p>`).join('')}
    </div>
    ${payload.readingPath.blockedContinuations.length?`<aside class="knowledge-search-boundary"><strong>Continuation not yet public</strong><p>${escapeHtml(payload.readingPath.blockedContinuations.map(x=>x.targetNodeCode).join(', '))}</p></aside>`:''}
  `;
  results.replaceChildren(article);
  setStatus(`${payload.results.length} published result. Projection mode: ${projection.mode}.`,'results');
}
async function submit(event){
  event?.preventDefault();
  const query=input.value.trim();
  if(!query){setStatus('Enter a question to search published knowledge.','invalid');input.focus();return;}
  setStatus('Searching published knowledge…','loading');results.replaceChildren();
  try{render(await queryPublishedKnowledge({query,locale:getLocale(),mode:mode.value}));}
  catch{setStatus('Published knowledge could not be loaded. Please try again.','error');}
}
form?.addEventListener('submit',submit);
onLocaleChange(()=>{ if(input.value.trim()) submit(); });
