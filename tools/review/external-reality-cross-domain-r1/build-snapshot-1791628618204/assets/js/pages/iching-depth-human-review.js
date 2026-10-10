const q=selector=>document.querySelector(selector);
const arr=value=>Array.isArray(value)?value:[];
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const ENDPOINT='/api/review/iching-execute?mode=depth';
const state={campaign:null,rubric:null,results:null,review:null,session:null,execution:null};

function rowFor(id){return state.results?.sessions?.find(item=>item.sessionId===id);}
function sessionFor(id){return state.campaign?.sessions?.find(item=>item.sessionId===id);}

function setAuthority(ready,title,detail){
  const node=q('[data-review-authority]');
  node.dataset.ready=String(ready);
  node.innerHTML='<strong>'+escape(title)+'</strong><span>'+escape(detail)+'</span>';
}

function totals(){
  const rows=arr(state.results?.sessions);
  const reviewed=rows.filter(item=>item.humanReviewed===true).length;
  const accepted=rows.filter(item=>item.humanReviewed===true&&item.decision==='ACCEPTED').length;
  const critical=rows.filter(item=>item.humanReviewed===true&&item.criticalBoundaryFailure===true).length;
  state.results.humanReviewed=reviewed;
  state.results.accepted=accepted;
  state.results.rejected=rows.filter(item=>item.humanReviewed===true&&item.decision==='REJECTED').length;
  state.results.needsFix=rows.filter(item=>item.humanReviewed===true&&item.decision==='NEEDS_FIX').length;
  state.results.criticalBoundaryFailures=critical;
  state.results.humanAcceptanceComplete=accepted===state.results.minimumAccepted&&critical===0;
  state.results.productionPromotionAllowed=false;
  state.results.publicRunAllowed=false;
  q('[data-progress]').textContent=reviewed+' / '+state.results.planned+' reviewed';
  q('[data-accepted]').textContent=accepted+' accepted · '+critical+' critical';
}

function renderCaseList(){
  q('[data-case-list]').innerHTML=state.campaign.sessions.map(session=>{
    const row=rowFor(session.sessionId);
    const label=session.sessionId.replace('ICHI-DEPTH-HR-','');
    return '<button type="button" class="hr-case-button" data-case-id="'+escape(session.sessionId)+'" data-decision="'+escape(row?.decision||'PENDING')+'" aria-current="'+String(state.session?.sessionId===session.sessionId)+'"><strong>'+escape(label)+'</strong><small>'+escape(session.scenario)+'</small><em>'+escape(row?.decision||'PENDING')+'</em></button>';
  }).join('');
  document.querySelectorAll('[data-case-id]').forEach(button=>button.addEventListener('click',()=>selectCase(button.dataset.caseId)));
}

function selectCase(id){
  state.session=sessionFor(id);
  state.execution=null;
  q('[data-empty-state]').hidden=true;
  q('[data-case]').hidden=false;
  q('[data-result]').hidden=true;
  q('[data-review-form]').hidden=true;
  const session=state.session;
  q('[data-case-meta]').textContent=session.sessionId+' · '+session.scope+' · '+session.locale;
  q('[data-case-title]').textContent=session.scenario;
  q('[data-case-focus]').textContent=session.reviewFocus;
  q('[data-case-fixture]').innerHTML='<div><span>Hexagram</span><strong>'+escape(session.hexagramId)+'</strong></div><div><span>Scope</span><strong>'+escape(session.scope)+'</strong></div><div><span>Line</span><strong>'+escape(session.linePosition||'whole')+'</strong></div><div><span>Source claims</span><strong>'+arr(session.sourceClaimRefs).length+'</strong></div>';
  q('[data-execute-case]').textContent='Load governed candidate';
  q('[data-execution-status]').textContent='';
  renderCaseList();
}

function localeLayer(locale,value){
  const list=(title,items)=>'<p><strong>'+title+'</strong></p><ul>'+arr(items).map(item=>'<li>'+escape(item)+'</li>').join('')+'</ul>';
  return '<article class="hr-layer"><header><span>'+(locale==='zh-Hans'?'中':'EN')+'</span><h3>'+escape(locale)+' editorial candidate</h3></header><div class="hr-layer__body">'
    +'<p><strong>Plain meaning</strong><br>'+escape(value.plainMeaning)+'</p>'
    +'<p><strong>Situation / stage</strong><br>'+escape(value.situationOrStage)+'</p>'
    +'<p><strong>Central tension</strong><br>'+escape(value.centralTension)+'</p>'
    +'<p><strong>Constructive expression</strong><br>'+escape(value.constructiveExpressionOrMovement)+'</p>'
    +'<p><strong>Distortion risk</strong><br>'+escape(value.distortionOrFailureRisk)+'</p>'
    +'<p><strong>Timing / condition</strong><br>'+escape(value.timingOrCondition)+'</p>'
    +list('What to observe',value.whatToObserve)
    +list('Reflection questions',value.reflectionQuestions)
    +list('Misreading warnings',value.misreadingWarnings)
    +'</div></article>';
}

function renderCriteria(row){
  q('[data-criteria]').innerHTML=state.rubric.criteria.map(item=>{
    const existing=row?.criteria?.[item.id];
    return '<label class="hr-criterion"><span><strong>'+escape(item.id)+(item.critical?' · CRITICAL':'')+'</strong><p>'+escape(item.question)+'</p></span><select data-criterion="'+escape(item.id)+'"><option value="">Select…</option><option value="true"'+(existing===true?' selected':'')+'>PASS</option><option value="false"'+(existing===false?' selected':'')+'>FAIL</option></select></label>';
  }).join('');
  q('[data-decision]').value=row?.decision||'';
  q('[data-screenshot-refs]').value=arr(row?.screenshotRefs).join('\n');
  q('[data-notes]').value=row?.notes||'';
  q('[data-critical-failure]').checked=row?.criticalBoundaryFailure===true;
}

function renderCandidate(payload){
  state.execution=payload;
  const candidate=payload.candidate;
  q('[data-result]').hidden=false;
  q('[data-review-form]').hidden=false;
  q('[data-result-summary]').innerHTML='<div><span>Hexagram</span><strong>'+escape(candidate.hexagramId)+'</strong></div><div><span>Scope</span><strong>'+escape(candidate.scope)+'</strong></div><div><span>Line</span><strong>'+escape(candidate.linePosition||'whole')+'</strong></div><div><span>Claims</span><strong>'+arr(payload.sourceClaims).length+'</strong></div>';
  q('[data-result-layers]').innerHTML=['zh-Hans','en'].map(locale=>localeLayer(locale,candidate.localeProjections?.[locale]||{})).join('');
  q('[data-result-sources]').innerHTML=arr(payload.sourceClaims).map(source=>'<article class="hr-source-card"><strong>'+escape(source.claimId)+'</strong><p>'+escape(source.claim)+'</p><small>'+escape(source.sourceId)+' · '+escape(source.provenance?.sourceLocator||'no locator')+'</small></article>').join('');
  q('[data-machine-digest]').textContent='Candidate evidence '+payload.candidateDigest;
  renderCriteria(rowFor(state.session.sessionId));
}

async function executeCase(){
  if(!state.session)return;
  const button=q('[data-execute-case]');
  button.disabled=true;
  q('[data-execution-status]').textContent='Loading governed editorial candidate…';
  try{
    const response=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify({sessionId:state.session.sessionId})});
    const payload=await response.json();
    if(!response.ok||!payload.ok)throw new Error(payload?.error?.code||'DEPTH_REVIEW_CANDIDATE_UNAVAILABLE');
    renderCandidate(payload);
    q('[data-execution-status]').textContent='Candidate loaded. Review both locales, source witness and every criterion.';
  }catch(error){
    q('[data-execution-status]').textContent='Candidate unavailable: '+error.message;
  }finally{
    button.disabled=false;
  }
}

function recordReview(event){
  event.preventDefault();
  if(!state.execution)return;
  const criteria={};
  let missing=false;
  document.querySelectorAll('[data-criterion]').forEach(select=>{if(!select.value)missing=true;else criteria[select.dataset.criterion]=select.value==='true';});
  const decision=q('[data-decision]').value;
  const screenshotRefs=q('[data-screenshot-refs]').value.split('\n').map(value=>value.trim()).filter(Boolean);
  const criticalIds=new Set(state.rubric.criteria.filter(item=>item.critical).map(item=>item.id));
  const criticalFailure=q('[data-critical-failure]').checked||Object.entries(criteria).some(([id,value])=>criticalIds.has(id)&&value===false);
  if(missing||!decision){q('[data-record-status]').textContent='Select PASS/FAIL for every criterion and choose a decision.';return;}
  if(decision==='ACCEPTED'&&(Object.values(criteria).some(value=>value!==true)||criticalFailure||!screenshotRefs.length)){q('[data-record-status]').textContent='Accepted requires every criterion PASS, zero critical failures and at least one screenshot reference.';return;}
  const row=rowFor(state.session.sessionId);
  Object.assign(row,{
    humanReviewed:true,
    decision,
    reviewerId:state.review.reviewerId,
    reviewedAt:new Date().toISOString(),
    deploymentSha:state.review.deploymentSha,
    environmentUrl:location.origin,
    locale:state.session.locale,
    viewport:{width:window.innerWidth,height:window.innerHeight},
    candidateDigest:state.execution.candidateDigest,
    sourceClaimIds:state.execution.sourceClaims.map(item=>item.claimId),
    screenshotRefs,
    criteria,
    criticalBoundaryFailure:criticalFailure,
    notes:q('[data-notes]').value.trim()||null
  });
  totals();
  renderCaseList();
  q('[data-record-status]').textContent='Recorded in memory. Download the results JSON to preserve it.';
  q('[data-export-results]').disabled=false;
}

function exportResults(){
  totals();
  state.results.status=state.results.humanAcceptanceComplete?'HUMAN_EDITORIAL_ACCEPTANCE_REACHED_PENDING_ADMISSION':'HUMAN_REVIEW_IN_PROGRESS';
  const blob=new Blob([JSON.stringify(state.results,null,2)+'\n'],{type:'application/json'});
  const href=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=href;
  link.download='iching-depth-human-review-results-v1.json';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
}

async function importResults(file){
  try{
    const value=JSON.parse(await file.text());
    if(value.schemaVersion!==state.results.schemaVersion||value.sessions?.length!==state.campaign.targetSessionCount)throw new Error('INCOMPATIBLE_RESULTS_FILE');
    const ids=new Set(state.campaign.sessions.map(item=>item.sessionId));
    if(value.sessions.some(item=>!ids.has(item.sessionId)))throw new Error('UNKNOWN_SESSION_IN_RESULTS');
    state.results=value;
    totals();
    renderCaseList();
    if(state.session)selectCase(state.session.sessionId);
    q('[data-export-results]').disabled=false;
  }catch(error){
    alert('Results import failed: '+error.message);
  }
}

export async function initIChingDepthHumanReview(){
  q('[data-review-title]').textContent='I Ching 448-unit depth review';
  q('[data-review-description]').textContent='The same protected authority reviews 64 hexagram and 384 line editorial candidates. Candidate text is never public output.';
  q('[data-execute-case]').addEventListener('click',executeCase);
  q('[data-review-form]').addEventListener('submit',recordReview);
  q('[data-export-results]').addEventListener('click',exportResults);
  q('[data-import-results]').addEventListener('change',event=>event.target.files?.[0]&&importResults(event.target.files[0]));
  try{
    const response=await fetch(ENDPOINT,{headers:{accept:'application/json'},cache:'no-store'});
    const payload=await response.json();
    if(!response.ok||!payload.ok)throw new Error(payload?.error?.code||'REVIEW_AUTHORITY_REQUIRED');
    Object.assign(state,{campaign:payload.campaign,rubric:payload.rubric,results:payload.results,review:payload.review});
    setAuthority(true,'HUMAN_REVIEW · '+payload.review.reviewerId,'Deployment '+payload.review.deploymentSha+' · public runAllowed remains false');
    totals();
    renderCaseList();
    q('[data-export-results]').disabled=false;
    q('[data-empty-state] h2').textContent='Select the first depth candidate';
    q('[data-empty-state] p').textContent='Public depth requires 448 accepted units, both locales reviewed, and zero critical boundary failures.';
  }catch(error){
    setAuthority(false,'Review route locked',error.message+'. Check Access policy, reviewer allowlist and deployed SHA.');
  }
}
