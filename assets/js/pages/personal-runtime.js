import { initializeI18n, onLocaleChange, t } from '../i18n.js';
import { escapeHTML } from '../shared.js';
import {
  buildCanonicalBirthInput,
  evaluateSurfaceEligibility,
  executeCanonicalProjection,
  renderSurfaceProjection,
  summarizeResults,
  validateCanonicalInputShape
} from '../method-client-delivery/personal-runtime-surface-runtime.js';

const SURFACE_REGISTRY_URL='/content/professional/method-client-delivery/registries/mcd-7-personal-runtime-result-surface-registry-v1.json';
let registry=null;
let results=new Map();
let lastCanonicalInput=null;
let lastRequestedEntries=[];
let lastConsentGranted=false;

function locale(){ return document.documentElement.lang==='zh-Hans'?'zh-Hans':'en'; }
async function readJson(url){ const response=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'}); if(!response.ok)throw new Error('MCD7_SURFACE_AUTHORITY_UNAVAILABLE'); return response.json(); }
function value(id){ return document.getElementById(id)?.value?.trim()||''; }
function selected(name){ return document.querySelector(`[name="${name}"]`)?.value||'unknown'; }
function checked(id){ return document.getElementById(id)?.checked===true; }
function randomId(prefix){ const id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`; return `${prefix}-${id}`; }
function methodEntries(){ return (registry?.productionTabs||[]).filter(entry=>entry.methodResult===true&&entry.productionTab===true); }
function requestedEntries(){ const selectedCodes=new Set([...document.querySelectorAll('[data-mcd7-method-checkbox]:checked')].map(el=>el.value)); return methodEntries().filter(entry=>selectedCodes.has(entry.tabCode)); }
function fieldSnapshot(){ return {
  birthDate:value('birthDate'),birthDatePrecision:selected('BirthDatePrecision'),birthTime:value('birthTime'),birthTimePrecision:selected('BirthTimePrecision'),
  birthPlace:value('birthPlace'),birthPlacePrecision:selected('BirthPlacePrecision'),countryCode:value('birthCountryCode'),birthTimezone:value('birthTimezone'),
  utcOffsetAtBirth:value('utcOffsetAtBirth'),timezonePrecision:selected('TimezonePrecision'),latitude:value('birthLatitude'),longitude:value('birthLongitude'),
  coordinatesPrecision:selected('CoordinatesPrecision')
}; }
function canonicalInput({consentRecordId='',consentGranted=false}={}){ return buildCanonicalBirthInput(fieldSnapshot(),{locale:locale(),consentRecordId,consentGranted}); }
function setFlow(active){ const order=['input','eligibility','processing','results']; const index=order.indexOf(active); document.querySelectorAll('[data-flow-step]').forEach(el=>{ const i=order.indexOf(el.dataset.flowStep); el.dataset.state=i<index?'complete':i===index?'active':'pending'; }); }
function labelFor(entry){ return entry?.label?.[locale()]||entry?.label?.en||entry?.tabCode||'Method'; }
function renderMethodSelection(){ const target=document.querySelector('[data-mcd7-method-selection]'); if(!target)return; target.innerHTML=methodEntries().map((entry,index)=>`<label class="pr-method-choice"><input type="checkbox" data-mcd7-method-checkbox value="${escapeHTML(entry.tabCode)}" ${index===0?'checked':''}><span><strong>${escapeHTML(labelFor(entry))}</strong><small>${escapeHTML(entry.publicMethodCode)}</small></span></label>`).join(''); }
function renderEligibility(input,entries){ const target=document.querySelector('[data-mcd7-eligibility]'); if(!target)return []; const targetDate=value('targetDate')||null; const checks=entries.map(entry=>({entry,evaluation:evaluateSurfaceEligibility(entry,input,{targetDate})})); target.innerHTML=checks.length?checks.map(({entry,evaluation})=>`<article class="pr-eligibility-card" data-state="${escapeHTML(evaluation.state)}"><strong>${escapeHTML(labelFor(entry))}</strong><span>${escapeHTML(evaluation.state)}</span>${evaluation.missingFields.length?`<small>${escapeHTML(evaluation.missingFields.join(' · '))}</small>`:''}<em>${escapeHTML(locale()==='zh-Hans'?'真正 dispatch 由 MPA 在 Processing 阶段决定':'Actual dispatch is decided by MPA during Processing')}</em></article>`).join(''):`<p>${escapeHTML(t('personalRuntime.noMethodsSelected'))}</p>`; return checks; }
function checkReadiness(){
  const input=canonicalInput(); const shape=validateCanonicalInputShape(input); const entries=requestedEntries(); const evaluations=renderEligibility(input,entries); const confirmed=checked('customerConfirmation');
  const panel=document.querySelector('[data-personal-runtime-readiness]'); const message=document.querySelector('[data-personal-runtime-readiness-message]'); if(panel)panel.hidden=false;
  const requestable=evaluations.filter(x=>x.evaluation.state!=='INPUT_INCOMPLETE').length; const ready=shape.valid&&confirmed&&entries.length>0&&requestable>0;
  if(panel)panel.dataset.state=ready?'ready':'incomplete'; if(message)message.textContent=ready?t('personalRuntime.ready'):t('personalRuntime.incomplete');
  const process=document.getElementById('processPersonalRuntime'); if(process)process.disabled=!(ready&&checked('executionConsent'));
  setFlow('eligibility'); return {input,shape,entries,evaluations,ready};
}
function resultTarget(tabCode){ return document.querySelector(`[data-mcd7-result="${tabCode}"]`); }
function renderBlocked(entry,result){ const target=resultTarget(entry.tabCode); if(!target)return; const reasons=(result?.reasonCodes||[]).join(' · '); target.innerHTML=`<section class="pr-result-state pr-result-state--blocked"><h3>${escapeHTML(labelFor(entry))}</h3><strong>${escapeHTML(result?.error||'BLOCKED')}</strong>${reasons?`<code>${escapeHTML(reasons)}</code>`:''}</section>`; }
function renderNotRequested(entry){ const target=resultTarget(entry.tabCode); if(!target)return; target.innerHTML=`<section class="pr-result-state"><h3>${escapeHTML(labelFor(entry))}</h3><p>${escapeHTML(t('personalRuntime.notRequested'))}</p></section>`; }
function renderResults(entries){
  for(const entry of methodEntries()){
    const result=results.get(entry.tabCode); if(!entries.some(x=>x.tabCode===entry.tabCode)){renderNotRequested(entry);continue;}
    if(!result?.ok){renderBlocked(entry,result);continue;}
    try{const rendered=renderSurfaceProjection(result.canonicalProjection,{locale:locale()}); const target=resultTarget(entry.tabCode); if(target)target.innerHTML=rendered.html;}catch{renderBlocked(entry,{error:'CANONICAL_RENDERING_BLOCKED',reasonCodes:['MCD7_CANONICAL_RENDERING_BLOCKED']});}
  }
  renderOverview(entries); renderReading(entries); const section=document.querySelector('[data-mcd7-results]'); if(section)section.hidden=false; setFlow('results'); activateTab('overview');
}
function renderOverview(entries){
  const target=document.querySelector('[data-mcd7-overview]'); if(!target)return; const summary=summarizeResults({requestedEntries:entries,results,canonicalInput:lastCanonicalInput,consentGranted:lastConsentGranted});
  const controlled=registry?.controlledAvailability; const executed=summary.executed.map(code=>labelFor(methodEntries().find(x=>x.tabCode===code))).join(', ')||'—'; const requested=summary.requested.map(code=>labelFor(methodEntries().find(x=>x.tabCode===code))).join(', ')||'—';
  const blocked=summary.blocked.length?summary.blocked.map(x=>`${labelFor(methodEntries().find(e=>e.tabCode===x.tabCode))}: ${x.error}`).join(' · '):'—';
  target.innerHTML=`<div class="pr-overview-grid">
    <article><small>${escapeHTML(t('personalRuntime.overview.requested'))}</small><strong>${escapeHTML(requested)}</strong></article>
    <article><small>${escapeHTML(t('personalRuntime.overview.executed'))}</small><strong>${escapeHTML(executed)}</strong></article>
    <article><small>${escapeHTML(t('personalRuntime.overview.blocked'))}</small><strong>${escapeHTML(blocked)}</strong></article>
    <article><small>${escapeHTML(t('personalRuntime.overview.input'))}</small><strong>${escapeHTML(summary.inputComplete?'VALID':'INCOMPLETE')}</strong></article>
    <article><small>${escapeHTML(t('personalRuntime.overview.unknown'))}</small><strong>${summary.unknownCount}</strong></article>
    <article><small>${escapeHTML(t('personalRuntime.overview.consent'))}</small><strong>${escapeHTML(summary.consentGranted?'GRANTED':'NOT_GRANTED')}</strong></article>
    <article><small>${escapeHTML(t('personalRuntime.overview.version'))}</small><strong>${escapeHTML(summary.projectionContractVersions.join(', ')||'—')}</strong></article>
    <article><small>${escapeHTML(t('personalRuntime.overview.execution'))}</small><strong>${escapeHTML(summary.executionStatuses.map(x=>`${x.tabCode}:${x.status}`).join(' · ')||'—')}</strong></article>
  </div>
  <section class="pr-controlled-status"><span>${escapeHTML(controlled?.label?.[locale()]||controlled?.label?.en||'Personal Runtime Projection')}</span><strong>${escapeHTML(t('personalRuntime.currentlyUnavailable'))}</strong><small>${escapeHTML(t('personalRuntime.visibilityBoundary'))}</small></section>`;
}
function renderReading(entries){ const target=document.querySelector('[data-mcd7-reading-sources]'); if(!target)return; const refs=entries.map(entry=>results.get(entry.tabCode)?.canonicalProjection).filter(Boolean).map(c=>({label:c.method?.publicLabel||c.method?.publicMethodCode,ref:c.projectionId})); target.innerHTML=refs.length?`<ul class="pr-reading-sources">${refs.map(x=>`<li><strong>${escapeHTML(x.label)}</strong><code>${escapeHTML(x.ref)}</code></li>`).join('')}</ul>`:`<p>${escapeHTML(t('personalRuntime.readingNoSources'))}</p>`; }
async function processSelected(){
  const state=checkReadiness(); if(!state.ready||!checked('executionConsent'))return; const consentRecordId=randomId('CONSENT-MCD7'); const input=canonicalInput({consentRecordId,consentGranted:true}); const targetDate=value('targetDate')||null;
  results=new Map(); lastCanonicalInput=input; lastRequestedEntries=state.entries; lastConsentGranted=true; setFlow('processing'); const processing=document.querySelector('[data-mcd7-processing]'); if(processing)processing.hidden=false; const button=document.getElementById('processPersonalRuntime'); if(button)button.disabled=true;
  await Promise.all(state.evaluations.map(async ({entry,evaluation})=>{
    if(evaluation.state==='INPUT_INCOMPLETE'){ results.set(entry.tabCode,Object.freeze({ok:false,error:'INPUT_INCOMPLETE',reasonCodes:evaluation.missingFields.map(x=>`MISSING_${x.toUpperCase().replaceAll('.','_')}`)})); return; }
    const result=await executeCanonicalProjection(entry,{canonicalInput:input,consentRecordId,requestId:randomId('MCD7'),targetDate}); results.set(entry.tabCode,result);
  }));
  if(processing)processing.hidden=true; renderResults(state.entries); if(button)button.disabled=false;
}
function activateTab(code){ document.querySelectorAll('[data-mcd7-tabs] [role="tab"]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.tab===code))); document.querySelectorAll('[data-panel]').forEach(panel=>{panel.hidden=panel.dataset.panel!==code;}); }
function bindTabs(){ document.querySelectorAll('[data-mcd7-tabs] [role="tab"]').forEach(button=>button.addEventListener('click',()=>activateTab(button.dataset.tab))); }
function bindPrecision(){ document.querySelectorAll('[data-precision-for]').forEach(select=>select.addEventListener('change',()=>{ const target=select.dataset.precisionFor; if(select.value!=='unknown')return; if(target==='coordinates'){document.getElementById('birthLatitude').value='';document.getElementById('birthLongitude').value='';return;} if(target==='timezone'){document.getElementById('birthTimezone').value='';document.getElementById('utcOffsetAtBirth').value='';return;} const el=document.getElementById(target); if(el)el.value=''; })); }
function clearInputs(){ document.getElementById('personalRuntimeInput')?.reset(); results=new Map(); lastCanonicalInput=null; lastRequestedEntries=[]; lastConsentGranted=false; document.querySelector('[data-personal-runtime-readiness]')?.setAttribute('hidden',''); document.querySelector('[data-mcd7-processing]')?.setAttribute('hidden',''); document.querySelector('[data-mcd7-results]')?.setAttribute('hidden',''); setFlow('input'); renderMethodSelection(); const process=document.getElementById('processPersonalRuntime'); if(process)process.disabled=true; }
function bindStateRefresh(){ document.getElementById('executionConsent')?.addEventListener('change',checkReadiness); document.querySelector('[data-mcd7-method-selection]')?.addEventListener('change',checkReadiness); }
async function boot(){
  initializeI18n();
  try{ registry=await readJson(SURFACE_REGISTRY_URL); if(registry.status!=='ACTIVE')throw new Error('MCD7_SURFACE_REGISTRY_INACTIVE'); renderMethodSelection(); bindPrecision(); bindTabs(); bindStateRefresh(); document.getElementById('checkPersonalRuntimeInput')?.addEventListener('click',checkReadiness); document.getElementById('processPersonalRuntime')?.addEventListener('click',processSelected); document.getElementById('clearPersonalRuntimeInput')?.addEventListener('click',clearInputs); onLocaleChange(()=>{renderMethodSelection(); if(lastCanonicalInput&&lastRequestedEntries.length)renderResults(lastRequestedEntries);}); }
  catch{ const target=document.querySelector('[data-personal-runtime-readiness]'); const message=document.querySelector('[data-personal-runtime-readiness-message]'); if(target)target.hidden=false; if(message)message.textContent=t('personalRuntime.authorityUnavailable'); }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
