import { getLocale, onLocaleChange } from '../i18n.js';
import { queryKnowledgeAccess } from '../knowledge/knowledge-access-client.js';

const form=document.querySelector('[data-knowledge-search-form]');
const input=document.querySelector('[data-knowledge-query]');
const mode=document.querySelector('[data-projection-mode]');
const status=document.querySelector('[data-knowledge-status]');
const results=document.querySelector('[data-knowledge-results]');
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

function setStatus(message,state='idle'){status.textContent=message;status.dataset.state=state;}
function pageLabel(range){return range.start===range.end?`p. ${range.start}`:`pp. ${range.start}–${range.end}`;}
function renderGroundedAnswer(payload){
  const answer=payload.groundedAnswer;
  if(!answer?.present||!answer.text)return '';
  return `<section class="knowledge-source-group knowledge-grounded-answer">
    <p class="knowledge-eyebrow">PHI OS grounded answer · ${escapeHtml(answer.projectionType)}</p>
    <h2>Answer</h2>
    ${answer.text.split(/\n{2,}/).map(paragraph=>`<p>${escapeHtml(paragraph)}</p>`).join('')}
    <p class="knowledge-source-meta">Grounded in ${escapeHtml(String(answer.sourceReferences?.length||0))} governed source fragment(s). No generative model was used.</p>
  </section>`;
}
function renderPublished(payload){
  const published=payload.published;
  if(!published?.projection||published.coverage?.level==='none')return '';
  return `<section class="knowledge-source-group">
    <p class="knowledge-eyebrow">Published canonical knowledge · ${escapeHtml(published.coverage.level)} coverage</p>
    <h2>${escapeHtml(published.results?.[0]?.title||published.projection.nodeCode)}</h2>
    <p>${escapeHtml(published.results?.[0]?.summary||'')}</p>
    ${published.results?.[0]?.href?`<a class="knowledge-action knowledge-action--primary" href="${escapeHtml(published.results[0].href)}">Read published article</a>`:''}
    <div class="knowledge-search-fragments">${published.projection.fragments.map(fragment=>fragment.kind==='heading'?`<h3>${escapeHtml(fragment.text.replace(/^#\s*/,''))}</h3>`:`<p>${escapeHtml(fragment.text)}</p>`).join('')}</div>
  </section>`;
}
function renderManuscript(payload){
  const records=payload.manuscript?.records||[];
  if(!records.length)return '';
  return `<section class="knowledge-source-group">
    <p class="knowledge-eyebrow">Completed manuscript knowledge · question-scoped access</p>
    <div class="knowledge-manuscript-results">${records.map(record=>`<article class="knowledge-manuscript-source">
      <header><p class="knowledge-source-meta">${escapeHtml(record.bookTitle)} · ${escapeHtml(record.partCode)} · ${escapeHtml(pageLabel(record.pageRange))}</p>
      <h3>${escapeHtml(record.heading)}</h3></header>
      <p>${escapeHtml(record.excerpt)}</p>
      <p class="knowledge-source-meta">Canonical binding: ${escapeHtml(record.canonicalBinding.status)}${record.canonicalBinding.nodeCodes?.length?` · ${escapeHtml(record.canonicalBinding.nodeCodes.join(', '))}`:''}</p>
      <p class="knowledge-source-meta">Readability: ${escapeHtml(record.readability?.reviewStatus||'UNREVIEWED')} · risk ${escapeHtml(record.readability?.riskLevel||'UNKNOWN')}</p>
      <a class="knowledge-action" href="${escapeHtml(record.bookRoute)}">Explore the volume</a>
    </article>`).join('')}</div>
  </section>`;
}
function render(payload){
  if(payload.coverage.level==='none'){results.replaceChildren();setStatus('No published or completed-manuscript coverage is available for this query.','no_coverage');return;}
  const article=document.createElement('article');
  article.className='knowledge-search-result';
  article.innerHTML=`${renderGroundedAnswer(payload)}${renderPublished(payload)}${renderManuscript(payload)}<aside class="knowledge-search-boundary"><strong>Knowledge source boundary</strong><p>Published Articles remain publication authority. Completed manuscripts may ground question-scoped knowledge before Article publication. A section with pending Canonical binding is shown as manuscript source and is not presented as a Canonical Node.</p></aside>`;
  results.replaceChildren(article);
  setStatus(`Knowledge coverage: ${payload.coverage.level}. Manuscript sources: ${payload.manuscript?.records?.length||0}.`,'results');
}
async function submit(event){
  event?.preventDefault();
  const query=input.value.trim();
  if(!query){setStatus('Enter a question to search PHI OS knowledge.','invalid');input.focus();return;}
  setStatus('Searching published and completed-manuscript knowledge…','loading');results.replaceChildren();
  try{render(await queryKnowledgeAccess({query,locale:getLocale(),mode:mode.value,source:'hybrid'}));}
  catch(error){setStatus(error.code==='MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE'?'Manuscript knowledge storage is not connected yet.':'Knowledge could not be loaded. Please try again.','error');}
}
form?.addEventListener('submit',submit);
onLocaleChange(()=>{if(input.value.trim())submit();});

const initialQuery=new URLSearchParams(location.search).get('q');
if(initialQuery){input.value=initialQuery;queueMicrotask(()=>submit());}
