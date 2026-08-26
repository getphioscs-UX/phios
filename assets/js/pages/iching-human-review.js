const q=selector=>document.querySelector(selector);
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const arr=value=>Array.isArray(value)?value:[];
const ENDPOINT='/api/review/iching-execute';
const state={campaign:null,rubric:null,results:null,review:null,session:null,execution:null};

function setAuthority(ready,title,detail){
  const node=q('[data-review-authority]');node.dataset.ready=String(ready);node.innerHTML=`<strong>${escape(title)}</strong><span>${escape(detail)}</span>`;
}

function rowFor(id){return state.results?.sessions?.find(item=>item.sessionId===id);}
function sessionFor(id){return state.campaign?.sessions?.find(item=>item.sessionId===id);}

function totals(){
  const rows=arr(state.results?.sessions);const reviewed=rows.filter(x=>x.humanReviewed).length;const accepted=rows.filter(x=>x.decision==='ACCEPTED').length;const critical=rows.filter(x=>x.criticalBoundaryFailure===true).length;
  state.results.humanReviewed=reviewed;state.results.accepted=accepted;state.results.rejected=rows.filter(x=>x.decision==='REJECTED').length;state.results.needsFix=rows.filter(x=>x.decision==='NEEDS_FIX').length;state.results.criticalBoundaryFailures=critical;state.results.humanAcceptanceComplete=accepted>=state.results.minimumAccepted&&critical===0;state.results.productionPromotionAllowed=false;state.results.publicRunAllowed=false;
  q('[data-progress]').textContent=`${reviewed} / ${state.results.planned} reviewed`;q('[data-accepted]').textContent=`${accepted} accepted · ${critical} critical`;
}

function renderCaseList(){
  q('[data-case-list]').innerHTML=state.campaign.sessions.map(session=>{const row=rowFor(session.sessionId);return `<button type="button" class="hr-case-button" data-case-id="${escape(session.sessionId)}" data-decision="${escape(row?.decision||'PENDING')}" aria-current="${state.session?.sessionId===session.sessionId}"><strong>${escape(session.sessionId.replace('ICH-HR2-',''))}</strong><small>${escape(session.scenario)}</small><em>${escape(row?.decision||'PENDING')}</em></button>`;}).join('');
  document.querySelectorAll('[data-case-id]').forEach(button=>button.addEventListener('click',()=>selectCase(button.dataset.caseId)));
}

function selectCase(id){
  state.session=sessionFor(id);state.execution=null;q('[data-empty-state]').hidden=true;q('[data-case]').hidden=false;q('[data-result]').hidden=true;q('[data-review-form]').hidden=true;
  const s=state.session;q('[data-case-meta]').textContent=`${s.sessionId} · ${s.group} · ${s.locale} · ${s.accountMode}`;q('[data-case-title]').textContent=s.scenario;q('[data-case-focus]').textContent=s.reviewFocus;
  q('[data-case-fixture]').innerHTML=`<div><span>Fixed lines</span><strong>${s.lineValues.join(' · ')}</strong></div><div><span>Expected primary</span><strong>${escape(s.expected.primaryHexagramId)}</strong></div><div><span>Changing lines</span><strong>${s.expected.changingLines.join(', ')||'none'}</strong></div><div><span>Expected relating</span><strong>${escape(s.expected.relatingHexagramId)}</strong></div>`;
  q('[data-execution-status]').textContent='';renderCaseList();
}

function layerBody(layer){
  const data=layer.data||{};
  if(layer.id==='YOUR_INPUT') return `<blockquote>${escape(data.question||'')}</blockquote>`;
  if(layer.id==='METHOD_EVIDENCE') return `<div class="hr-line-grid">${arr(data.sixLines).map((line,index)=>{const value=typeof line==='object'?line.lineValue:line;const changing=typeof line==='object'?line.changing:[6,9].includes(Number(value));return `<div><small>Line ${index+1}</small><strong>${escape(value)}</strong>${changing?'<em>changing</em>':''}</div>`;}).join('')}</div><p>Order: ${escape(data.lineOrder)} · AI selected: ${escape(data.aiSelected)} · rerolled: ${escape(data.rerolledInsideCalculation)}</p>`;
  if(layer.id==='PROJECTION') return `<p><strong>${escape(data.primary?.hexagramId)}</strong> → <strong>${escape(data.relating?.hexagramId)}</strong></p><p>Changing lines: ${arr(data.changingLines).join(', ')||'none'}</p>`;
  if(layer.id==='SYMBOLIC_INTERPRETATION') return `<p>Coverage: primary ${escape(data.coverage?.primary)} · relating ${escape(data.coverage?.relating)}</p>${arr(data.commentaryCandidates).map(item=>`<article class="hr-claim"><strong>${escape(item.claimId)} · ${escape(item.hexagramRole)}${item.linePosition?` · line ${item.linePosition}`:''}</strong><p>${escape(item.claim)}</p><small>${escape(item.sourceId)} · ${escape(item.perspectiveId)} · ${escape(item.provenance?.sourceLocator||'no locator')}</small></article>`).join('')}`;
  if(layer.id==='REALITY_COMPARISON') return `<div class="hr-rcc">${[['Supporting',data.supportingEvidence],['Contradictory',data.contradictoryEvidence],['Unknown',data.unknown],['Observation',data.observation]].map(([label,items])=>`<div><strong>${label}</strong>${arr(items).length?`<ul>${items.map(x=>`<li>${escape(x.statement||x)}</li>`).join('')}</ul>`:'<p>None supplied.</p>'}</div>`).join('')}</div>`;
  if(layer.id==='WHAT_REMAINS_UNCERTAIN') return arr(data).map(x=>`<p><strong>${escape(x.status)}</strong> · ${escape(x.reason)}</p>`).join('');
  if(layer.id==='POSSIBLE_NEXT_QUESTIONS_ACTIONS') return `<ul>${arr(data).map(x=>`<li>${escape(state.session.locale==='zh-Hans'?x.zhHans:x.en)}</li>`).join('')}</ul>`;
  return `<pre>${escape(JSON.stringify(data,null,2))}</pre>`;
}

function renderExecution(payload){
  state.execution=payload;const evidence=payload.machineEvidence;const projection=evidence.actualProjection;
  q('[data-result]').hidden=false;q('[data-review-form]').hidden=false;
  q('[data-result-summary]').innerHTML=`<div><span>Actual primary</span><strong>${escape(projection.primaryHexagramId)}</strong></div><div><span>Changing lines</span><strong>${projection.changingLines.join(', ')||'none'}</strong></div><div><span>Actual relating</span><strong>${escape(projection.relatingHexagramId)}</strong></div><div><span>Sources</span><strong>${evidence.sourceIds.length}</strong></div>`;
  q('[data-result-layers]').innerHTML=payload.publicView.hierarchy.map((layer,index)=>`<article class="hr-layer"><header><span>${index+1}</span><h3>${escape(layer.id.replaceAll('_',' '))}</h3></header><div class="hr-layer__body">${layerBody(layer)}</div></article>`).join('');
  q('[data-result-sources]').innerHTML=arr(payload.publicView.sourceVisibility?.sources).map(source=>`<article class="hr-source-card"><strong>${escape(source.sourceTitle||source.sourceId)}</strong><p>${escape(source.sourceId)} · ${escape(source.perspectiveId)} · ${escape(source.rightsClass||'')}</p>${arr(source.sourceUnits).map(unit=>`<small>${escape(unit.unitType)} · ${escape(unit.sourceHeading)} · ${escape(unit.sourceLocator||'no locator')}</small>`).join('')}</article>`).join('');
  q('[data-machine-digest]').textContent=`Machine evidence ${evidence.machineEvidenceDigest}`;
  renderCriteria(rowFor(state.session.sessionId));
}

function renderCriteria(row){
  q('[data-criteria]').innerHTML=state.rubric.criteria.map(item=>{const existing=row?.criteria?.[item.id];return `<label class="hr-criterion"><span><strong>${escape(item.id)}${item.critical?' · CRITICAL':''}</strong><p>${escape(item.question)}</p></span><select data-criterion="${escape(item.id)}"><option value="">Select…</option><option value="true"${existing===true?' selected':''}>PASS</option><option value="false"${existing===false?' selected':''}>FAIL</option></select></label>`;}).join('');
  q('[data-decision]').value=row?.decision||'';q('[data-screenshot-refs]').value=arr(row?.screenshotRefs).join('\n');q('[data-notes]').value=row?.notes||'';q('[data-critical-failure]').checked=row?.criticalBoundaryFailure===true;
}

async function executeCase(){
  if(!state.session)return;const button=q('[data-execute-case]');button.disabled=true;q('[data-execution-status]').textContent='Executing governed fixed input…';
  try{const response=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify({sessionId:state.session.sessionId,question:'CLIENT_OVERRIDE_FORBIDDEN',lines:[6,6,6,6,6,6]})});const payload=await response.json();if(!response.ok||!payload.ok)throw new Error(payload?.error?.code||'REVIEW_EXECUTION_UNAVAILABLE');renderExecution(payload);q('[data-execution-status]').textContent='Fixed case executed. Review every visible layer and criterion.';}catch(error){q('[data-execution-status]').textContent=`Execution unavailable: ${error.message}`;}finally{button.disabled=false;}
}

function recordReview(event){
  event.preventDefault();if(!state.execution)return;
  const criteria={};let missing=false;document.querySelectorAll('[data-criterion]').forEach(select=>{if(!select.value)missing=true;else criteria[select.dataset.criterion]=select.value==='true';});
  const decision=q('[data-decision]').value;const screenshotRefs=q('[data-screenshot-refs]').value.split('\n').map(x=>x.trim()).filter(Boolean);const criticalIds=new Set(state.rubric.criteria.filter(x=>x.critical).map(x=>x.id));const criticalFailure=q('[data-critical-failure]').checked||Object.entries(criteria).some(([id,value])=>criticalIds.has(id)&&value===false);
  if(missing||!decision){q('[data-record-status]').textContent='Select PASS/FAIL for every criterion and choose a decision.';return;}
  if(decision==='ACCEPTED'&&(Object.values(criteria).some(value=>value!==true)||criticalFailure||!screenshotRefs.length)){q('[data-record-status]').textContent='Accepted requires every criterion PASS, zero critical failures and at least one screenshot reference.';return;}
  const evidence=state.execution.machineEvidence;const row=rowFor(state.session.sessionId);Object.assign(row,{humanReviewed:true,decision,reviewerId:state.review.reviewerId,reviewedAt:new Date().toISOString(),deploymentSha:state.review.deploymentSha,environmentUrl:location.origin,locale:state.session.locale,viewport:{width:window.innerWidth,height:window.innerHeight},accountMode:state.session.accountMode,runtimeEvidence:{requestDigest:evidence.requestDigest,publicViewDigest:evidence.publicViewDigest,expectedProjection:evidence.expectedProjection,actualProjection:evidence.actualProjection,sourceClaimIds:evidence.sourceClaims.map(x=>x.claimId),sourceLocators:evidence.sourceClaims.map(x=>x.sourceLocator).filter(Boolean)},screenshotRefs,criteria,criticalBoundaryFailure:criticalFailure,notes:q('[data-notes]').value.trim()||null});
  totals();renderCaseList();q('[data-record-status]').textContent='Recorded in memory. Download the results JSON to preserve it.';q('[data-export-results]').disabled=false;
}

function exportResults(){
  totals();state.results.status=state.results.humanAcceptanceComplete?'HUMAN_ACCEPTANCE_THRESHOLD_REACHED_PENDING_CHECKER':'HUMAN_REVIEW_IN_PROGRESS';const blob=new Blob([`${JSON.stringify(state.results,null,2)}\n`],{type:'application/json'});const href=URL.createObjectURL(blob);const link=document.createElement('a');link.href=href;link.download='iching-human-review-results-v2.json';link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
}

async function importResults(file){
  try{const value=JSON.parse(await file.text());if(value.schemaVersion!==state.results.schemaVersion||value.sessions?.length!==24)throw new Error('INCOMPATIBLE_RESULTS_FILE');const ids=new Set(state.campaign.sessions.map(x=>x.sessionId));if(value.sessions.some(x=>!ids.has(x.sessionId)))throw new Error('UNKNOWN_SESSION_IN_RESULTS');state.results=value;totals();renderCaseList();if(state.session)selectCase(state.session.sessionId);q('[data-export-results]').disabled=false;}catch(error){alert(`Results import failed: ${error.message}`);}
}

async function init(){
  try{const response=await fetch(ENDPOINT,{headers:{accept:'application/json'},cache:'no-store'});const payload=await response.json();if(!response.ok||!payload.ok)throw new Error(payload?.error?.code||'REVIEW_AUTHORITY_REQUIRED');Object.assign(state,{campaign:payload.campaign,rubric:payload.rubric,results:payload.results,review:payload.review});setAuthority(true,`HUMAN_REVIEW · ${payload.review.reviewerId}`,`Deployment ${payload.review.deploymentSha} · public runAllowed remains false`);totals();renderCaseList();q('[data-export-results]').disabled=false;q('[data-empty-state] h2').textContent='Select the first fixed case';q('[data-empty-state] p').textContent='Complete all 24 where possible; acceptance requires at least 20 accepted and zero critical boundary failures.';}catch(error){setAuthority(false,'Review route locked',`${error.message}. Check Access policy, reviewer allowlist and deployed SHA.`);}
}

q('[data-execute-case]').addEventListener('click',executeCase);q('[data-review-form]').addEventListener('submit',recordReview);q('[data-export-results]').addEventListener('click',exportResults);q('[data-import-results]').addEventListener('change',event=>event.target.files?.[0]&&importResults(event.target.files[0]));
init();

