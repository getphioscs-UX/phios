import { getLocale, onLocaleChange } from '../i18n.js';
import { askPhios } from '../knowledge/ask-phios-client.js';
import { checkGuidedReadingEligibility, runGuidedReading } from '../knowledge/guided-reading-client.js';

const form=document.querySelector('[data-knowledge-search-form]');
const input=document.querySelector('[data-knowledge-query]');
const depth=document.querySelector('[data-answer-depth]');
const status=document.querySelector('[data-knowledge-status]');
const results=document.querySelector('[data-knowledge-results]');
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
let lastAskPayload=null;

function copy(){
  const zh=getLocale()==='zh-Hans';
  return zh?{
    answer:'回答',mechanism:'为什么会这样',why:'为什么重要',observe:'可以观察什么',unknown:'仍然未知',related:'相关知识',sources:'依据',boundary:'边界',
    sourcePublished:'已发布 Canonical Knowledge',sourceManuscript:'已审核 Manuscript Knowledge',searching:'正在读取受治理 PHI OS Knowledge…',
    empty:'请输入一个问题。',failed:'目前无法完成 Ask PHI OS 回答。',coverage:'Knowledge coverage',noAi:'本次回答没有使用生成式 AI。',
    guidedTitle:'继续 Guided Reading',guidedCopy:'只有少量与你有关的情境会实质改变答案时，才进入 Guided Reading。不会要求完整 Reality Intake。',guidedCheck:'检查 Guided Reading',guidedContinue:'重新组合回答',guidedLoading:'正在重新读取 Knowledge，并整合你提供的有限情境…',guidedUnavailable:'这次 Ask PHI OS 回答不需要 Guided Reading。',guidedFailed:'Guided Reading 无法完成。',methodContext:'Method context',methodNotRelevant:'这次问题不需要 Method context。',methodOptional:'Method context 可以选择，但不会自动执行。',clientContext:'你提供的情境',methodResult:'Method Result',readingInference:'Reading Inference',stop:'Stop condition',realityBoundary:'只有 REALITY_MODEL_REQUIRED 才能进入 Reality Journey，而且不会自动升级。'
  }:{
    answer:'Answer',mechanism:'Why this can happen',why:'Why it matters',observe:'What to observe',unknown:'What remains unknown',related:'Related knowledge',sources:'Grounding',boundary:'Boundary',
    sourcePublished:'Published canonical knowledge',sourceManuscript:'Reviewed manuscript knowledge',searching:'Reading governed PHI OS Knowledge…',
    empty:'Enter a question for Ask PHI OS.',failed:'Ask PHI OS could not complete this answer.',coverage:'Knowledge coverage',noAi:'No generative AI was used for this answer.',
    guidedTitle:'Continue with Guided Reading',guidedCopy:'Guided Reading is offered only when a small amount of client context can materially change the answer. It does not require a full Reality Intake.',guidedCheck:'Check Guided Reading',guidedContinue:'Recompose answer',guidedLoading:'Re-reading governed Knowledge and integrating only the limited context you provided…',guidedUnavailable:'This Ask PHI OS answer does not need Guided Reading.',guidedFailed:'Guided Reading could not complete.',methodContext:'Method context',methodNotRelevant:'Method context is not relevant to this question.',methodOptional:'Method context is optional and will not execute automatically.',clientContext:'Client statements',methodResult:'Method Result',readingInference:'Reading Inference',stop:'Stop condition',realityBoundary:'Only REALITY_MODEL_REQUIRED may hand off to Reality Journey, and escalation is never automatic.'
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
function questionControl(question){
  if(question.kind==='MECHANISM_DISCRIMINATION')return `<fieldset data-guided-question="${escapeHtml(question.questionId)}"><legend>${escapeHtml(question.prompt)}</legend>${question.options.map(option=>`<label><input type="radio" name="${escapeHtml(question.questionId)}" value="${escapeHtml(option.code)}"> <span>${escapeHtml(option.label)}</span></label>`).join('')}</fieldset>`;
  if(question.kind==='ESCALATION_DISCRIMINATION')return `<fieldset data-guided-question="${escapeHtml(question.questionId)}"><legend>${escapeHtml(question.prompt)}</legend>${question.options.map(option=>`<label><input type="checkbox" name="${escapeHtml(question.questionId)}" value="${escapeHtml(option.code)}"> <span>${escapeHtml(option.label)}</span></label>`).join('')}</fieldset>`;
  return `<label class="knowledge-guided-observation" data-guided-question="${escapeHtml(question.questionId)}"><span>${escapeHtml(question.prompt)}</span><textarea rows="3" maxlength="800" data-guided-observation></textarea></label>`;
}
function collectGuidedAnswers(container,questions){
  return questions.map(question=>{
    if(question.kind==='MECHANISM_DISCRIMINATION')return {questionId:question.questionId,selectedOptionCodes:[...container.querySelectorAll(`input[name="${question.questionId}"]:checked`)].map(x=>x.value)};
    if(question.kind==='ESCALATION_DISCRIMINATION')return {questionId:question.questionId,selectedOptionCodes:[...container.querySelectorAll(`input[name="${question.questionId}"]:checked`)].map(x=>x.value)};
    return {questionId:question.questionId,response:container.querySelector(`[data-guided-question="${question.questionId}"] [data-guided-observation]`)?.value?.trim()||''};
  });
}
function renderGuidedResult(container,payload){
  const c=copy();const content=payload.answer?.content||{};const mechanismMap=new Map((payload.guidedContext?.candidateMechanisms||[]).map(x=>[x.mechanismCode,x.text]));
  container.innerHTML=`<section class="knowledge-guided-result">
    <p class="knowledge-eyebrow">Guided Reading · ${escapeHtml(payload.stopCondition?.status||'')}</p>
    <h3>${escapeHtml(payload.answer?.content?.directAnswer||'')}</h3>
    ${content.clientStatements?.length?`<div><strong>${escapeHtml(c.clientContext)}</strong><ul>${content.clientStatements.map(x=>`<li>${escapeHtml(x.text)}</li>`).join('')}</ul></div>`:''}
    ${content.readingInferences?.length?`<div><strong>${escapeHtml(c.readingInference)}</strong><ul>${content.readingInferences.map(x=>`<li>${escapeHtml(x.text)}<small>${escapeHtml(x.boundary)}</small></li>`).join('')}</ul></div>`:''}
    ${content.methodResults?.length?`<div><strong>${escapeHtml(c.methodResult)}</strong><ul>${content.methodResults.map(x=>`<li>${escapeHtml(x.label)} · ${escapeHtml(x.projectionId)}</li>`).join('')}</ul></div>`:''}
    ${content.unknownMechanisms?.length?`<div><strong>${escapeHtml(c.unknown)}</strong><ul>${content.unknownMechanisms.map(code=>`<li>${escapeHtml(mechanismMap.get(code)||code)}</li>`).join('')}</ul></div>`:''}
    <aside class="knowledge-search-boundary"><strong>${escapeHtml(c.stop)}: ${escapeHtml(payload.stopCondition?.status||'')}</strong><p>${escapeHtml(c.realityBoundary)}</p></aside>
  </section>`;
}
async function attachGuidedReading(article,query,answerDepth){
  const c=copy();const mount=document.createElement('section');mount.className='knowledge-guided-entry';mount.innerHTML=`<p class="knowledge-eyebrow">KAP-W18 · Guided Reading</p><h2>${escapeHtml(c.guidedTitle)}</h2><p>${escapeHtml(c.guidedCopy)}</p><p data-guided-status>${escapeHtml(c.guidedCheck)}…</p>`;article.append(mount);
  try{
    const eligibility=await checkGuidedReadingEligibility({question:query,locale:getLocale(),depth:answerDepth});
    if(!eligibility.eligibility?.eligible){mount.innerHTML=`<p class="knowledge-source-meta">${escapeHtml(c.guidedUnavailable)}</p>`;return;}
    const methodText=eligibility.methodContext?.status==='NOT_RELEVANT'?c.methodNotRelevant:c.methodOptional;
    mount.innerHTML=`<p class="knowledge-eyebrow">KAP-W18 · Guided Reading</p><h2>${escapeHtml(c.guidedTitle)}</h2><p>${escapeHtml(c.guidedCopy)}</p><p class="knowledge-source-meta"><strong>${escapeHtml(c.methodContext)}:</strong> ${escapeHtml(methodText)}</p><form data-guided-form>${(eligibility.questions||[]).map(questionControl).join('')}<button class="knowledge-action knowledge-action--primary" type="submit">${escapeHtml(c.guidedContinue)}</button></form><div data-guided-result></div>`;
    const guidedForm=mount.querySelector('[data-guided-form]');const guidedResult=mount.querySelector('[data-guided-result]');
    guidedForm?.addEventListener('submit',async event=>{event.preventDefault();guidedResult.innerHTML=`<p>${escapeHtml(c.guidedLoading)}</p>`;try{const clarifyingAnswers=collectGuidedAnswers(guidedForm,eligibility.questions||[]);const payload=await runGuidedReading({question:query,locale:getLocale(),depth:answerDepth,clarifyingAnswers,selectedReadingMode:'KNOWLEDGE_ONLY'});renderGuidedResult(guidedResult,payload);}catch(error){guidedResult.innerHTML=`<p class="knowledge-guided-error">${escapeHtml(c.guidedFailed)}${error?.code?` (${escapeHtml(error.code)})`:''}</p>`;}});
  }catch(error){mount.innerHTML=`<p class="knowledge-guided-error">${escapeHtml(c.guidedFailed)}${error?.code?` (${escapeHtml(error.code)})`:''}</p>`;}
}
function render(payload){
  const c=copy();const answer=payload.answer;const content=answer?.content||{};const article=document.createElement('article');article.className='knowledge-search-result';article.innerHTML=`
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
  results.replaceChildren(article);setStatus(`${c.coverage}: ${answer.coverageStatus}. ${payload.sources?.length||0} governed source projection(s).`,'results');attachGuidedReading(article,input.value.trim(),payload.answerDepth);
}
async function submit(event){
  event?.preventDefault();const query=input.value.trim();const c=copy();if(!query){setStatus(c.empty,'invalid');input.focus();return;}setStatus(c.searching,'loading');results.replaceChildren();
  try{lastAskPayload=await askPhios({query,locale:getLocale(),depth:depth?.value||'STANDARD',source:'hybrid'});render(lastAskPayload);}catch(error){setStatus(`${c.failed}${error?.code?` (${error.code})`:''}`,'error');}
}
form?.addEventListener('submit',submit);
onLocaleChange(()=>{if(input.value.trim())submit();});
const initialQuery=new URLSearchParams(location.search).get('q');if(initialQuery){input.value=initialQuery;queueMicrotask(()=>submit());}
