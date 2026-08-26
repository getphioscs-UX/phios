import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ROOT='content/interpretation/iching';
const REVIEW='content/production/symbolic-method/human-review';
const OUTPUT='tools/review/iching-depth-editorial-review.html';

const registry=read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json');
const canonical=read(`${ROOT}/corpus/iching-public-domain-canonical-corpus-v2.json`);
const hexagramCandidates=read(`${ROOT}/corpus/iching-depth-hexagram-editorial-candidates-v1.json`);
const lineCandidates=read(`${ROOT}/corpus/iching-depth-line-editorial-candidates-v1.json`);
const campaign=read(`${REVIEW}/iching-depth-human-review-campaign-v1.json`);
const rubric=read(`${REVIEW}/iching-depth-human-review-rubric-v1.json`);
const results=read(`${REVIEW}/iching-depth-human-review-results-v1.json`);

const candidates=new Map([...hexagramCandidates.entries,...lineCandidates.entries].map(entry=>[entry.interpretationId,entry]));
const claims=new Map(canonical.entries.map(entry=>[entry.claimId,entry]));
const sessions=new Map(campaign.sessions.map(item=>[item.interpretationId,item]));
const registryRows=new Map(registry.entries.map(item=>[item.hexagramId,item]));

const units=[...candidates.values()].map(candidate=>{
  const session=sessions.get(candidate.interpretationId);
  if(!session)throw new Error(`Missing campaign session for ${candidate.interpretationId}`);
  return {
    session,
    candidate,
    candidateDigest:digest(candidate),
    sourceClaims:candidate.sourceBindings.sourceClaimRefs.map(claimId=>{
      const claim=claims.get(claimId);
      if(!claim)throw new Error(`Missing canonical claim ${claimId}`);
      return claim;
    })
  };
});

const groups=registry.entries.map(hexagram=>({
  hexagram,
  units:units.filter(item=>item.candidate.hexagramId===hexagram.hexagramId).sort((a,b)=>{
    if(a.candidate.scope!==b.candidate.scope)return a.candidate.scope==='HEXAGRAM'?-1:1;
    return (a.candidate.linePosition||0)-(b.candidate.linePosition||0);
  })
}));

if(groups.length!==64||groups.some(group=>group.units.length!==7))throw new Error('Expected 64 groups with seven review units each.');

const payload={
  authority:{
    state:'OFFLINE_REVIEW_WORKSPACE_NOT_ROUTE_AUTHORITY',
    canonicalReviewRoute:'/review/iching/?mode=depth',
    canonicalResultsPath:`${REVIEW}/iching-depth-human-review-results-v1.json`,
    admissionScript:'scripts/admit-iching-depth-reviewed-candidates.mjs',
    publicRunAllowed:false,
    productionPromotionAllowed:false
  },
  campaign:{...campaign,sessions:undefined},
  rubric,
  resultsTemplate:results,
  groups
};

const embedded=JSON.stringify(payload).replaceAll('<','\\u003c');
const html=String.raw`<!doctype html>
<html lang="zh-Hans" data-authority="OFFLINE_REVIEW_WORKSPACE_NOT_ROUTE_AUTHORITY">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>PHI OS · I Ching Depth Article Approval</title>
<style>
:root{font-family:Inter,"Noto Sans SC",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55;color:#18201d;background:#f2f1eb;--ink:#18201d;--muted:#66706b;--line:#d8d8cf;--paper:#fff;--accent:#285a48;--soft:#e9f1ed;--warn:#8b4b16;--bad:#8d2f2f}*{box-sizing:border-box}body{margin:0}button,input,select,textarea{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #2c7358;outline-offset:2px}.top{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.97);border-bottom:1px solid var(--line);padding:12px 18px}.brand{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}.brand strong{font-size:19px}.muted{color:var(--muted)}.authority{color:#7a3f15;font-size:13px}.summary,.filters,.actions,.tabs,.unit-tabs{display:flex;gap:7px;flex-wrap:wrap}.summary{margin-top:8px}.pill{border:1px solid var(--line);border-radius:999px;padding:3px 9px;background:#fff}.filters{margin-top:9px}.filters button,.tabs button,.unit-tabs button{border:1px solid var(--line);background:#fff;border-radius:9px;padding:6px 9px}.filters button[aria-pressed="true"],.tabs button[aria-selected="true"],.unit-tabs button[aria-selected="true"]{background:var(--ink);color:#fff;border-color:var(--ink)}.shell{display:grid;grid-template-columns:300px minmax(0,1fr);min-height:calc(100vh - 150px)}.nav{border-right:1px solid var(--line);background:#fff;padding:12px;overflow:auto}.node{width:100%;text-align:left;border:1px solid var(--line);background:#fff;padding:10px;margin:0 0 8px;border-radius:11px}.node.active{border:2px solid var(--accent)}.node-head{display:flex;justify-content:space-between;gap:8px}.node small{display:block;color:var(--muted)}.status{font-size:12px;font-weight:700}.status.ACCEPTED{color:var(--accent)}.status.NEEDS_FIX{color:var(--warn)}.status.REJECTED{color:var(--bad)}.main{padding:18px}.setup{display:grid;grid-template-columns:repeat(4,minmax(160px,1fr));gap:10px}.setup label{font-size:12px;color:var(--muted)}.setup input{display:block;width:100%;margin-top:3px;border:1px solid var(--line);border-radius:8px;padding:8px;background:#fff}.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}.card h1,.card h2,.card h3{margin-top:0}.review-grid{display:grid;grid-template-columns:minmax(230px,.66fr) minmax(0,1.5fr);gap:16px;align-items:start}.source{position:sticky;top:190px}.canonical{font-family:Georgia,"Noto Serif SC",serif;font-size:21px;background:#faf7ee;border-left:4px solid #a68247;padding:14px}.locator{overflow-wrap:anywhere}.projection-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.projection{border:1px solid var(--line);border-radius:12px;padding:14px}.projection h3{font-size:15px}.projection p{margin:.7em 0}.projection ul{padding-left:20px}.compare-table{width:100%;border-collapse:collapse}.compare-table th,.compare-table td{border-bottom:1px solid var(--line);padding:9px;text-align:left;vertical-align:top}.criteria{display:grid;grid-template-columns:1fr 1fr;gap:8px}.criterion{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:9px;padding:9px}.criterion input{margin-top:5px}.criterion small{display:block;color:var(--muted)}.decision{position:sticky;bottom:0;background:rgba(255,255,255,.98);border:1px solid var(--line);border-radius:12px;padding:11px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}.decision button,.actions button{border:1px solid var(--line);border-radius:8px;background:#fff;padding:8px 11px}.decision .approve,.actions .approve{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:700}.danger{color:var(--bad)}.note{width:min(520px,100%);border:1px solid var(--line);border-radius:8px;padding:8px}.bulk{border-top:1px solid var(--line);margin-top:10px;padding-top:10px}.selected-label{display:flex;align-items:center;gap:6px}.hidden{display:none!important}.banner{padding:10px 12px;border-radius:9px;background:var(--soft);margin:10px 0}.banner.warn{background:#fff0df;color:#713c12}@media(max-width:1050px){.setup{grid-template-columns:1fr 1fr}.review-grid{grid-template-columns:1fr}.source{position:static}.projection-grid{grid-template-columns:1fr}}@media(max-width:760px){.top{position:static}.shell{grid-template-columns:1fr}.nav{border-right:0;border-bottom:1px solid var(--line);max-height:260px}.main{padding:12px}.setup,.criteria{grid-template-columns:1fr}.decision{position:static}}
</style>
</head>
<body>
<header class="top">
  <div class="brand"><strong>PHI OS · I Ching Depth Article Approval</strong><span class="authority">OFFLINE REVIEW WORKSPACE · 非第二套页面 authority</span></div>
  <div class="summary" id="summary"></div>
  <div class="filters" role="group" aria-label="Review filters">
    <button data-filter="ALL" aria-pressed="true">全部 64 卦</button>
    <button data-filter="PENDING">待审核</button>
    <button data-filter="ACCEPTED">已通过</button>
    <button data-filter="NEEDS_FIX">需修订</button>
    <button data-filter="REJECTED">不通过</button>
  </div>
</header>
<div class="shell">
  <nav class="nav" aria-label="Hexagram review groups"><div id="nodes"></div></nav>
  <main class="main">
    <section class="card">
      <h2>一次填写审核证据</h2>
      <p class="muted">448 个 unit 仍保留逐项结果，但操作按 64 个卦组进行。批量通过前必须确认你已检查 canonical witness、双语含义和全部 boundary criteria。</p>
      <div class="setup">
        <label>Reviewer ID<input id="reviewer" value="TL" autocomplete="off"></label>
        <label>Reviewed source / deployment SHA<input id="deploymentSha" placeholder="部署或审核版本的 40 位 git SHA" maxlength="40" autocomplete="off"></label>
        <label>HTTPS review environment<input id="environmentUrl" value="https://phios-github.pages.dev/review/iching/?mode=depth" type="url" autocomplete="off"></label>
        <label>Aggregate screenshot / evidence reference<input id="evidenceRef" placeholder="例如：IMG_ICHING_DEPTH_APPROVAL.png" autocomplete="off"></label>
      </div>
      <div class="bulk actions">
        <button id="importButton">导入已有 results JSON</button><input class="hidden" id="importFile" type="file" accept="application/json,.json">
        <button id="exportButton">导出 iching-depth-human-review-results-v1.json</button>
        <button id="approveSelected" class="approve">通过所选卦组</button>
        <button id="approveAll" class="approve">通过全部 preflight-passing units</button>
      </div>
      <div id="message" class="banner">结果只保存在当前页面内存；每次阶段性审核后请导出 JSON。</div>
    </section>
    <section id="review"></section>
  </main>
</div>
<script id="review-data" type="application/json">${embedded}</script>
<script>
(function(){
'use strict';
var data=JSON.parse(document.getElementById('review-data').textContent);
var state={groupIndex:0,unitIndex:0,locale:'compare',filter:'ALL',selected:new Set(),results:structuredClone(data.resultsTemplate)};
var criterionIds=data.rubric.criteria.map(function(item){return item.id;});
var criticalIds=new Set(data.rubric.criteria.filter(function(item){return item.critical;}).map(function(item){return item.id;}));
function byId(id){return document.getElementById(id)}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}
function arr(value){return Array.isArray(value)?value:[]}
function rowFor(sessionId){return state.results.sessions.find(function(row){return row.sessionId===sessionId})}
function groupDecision(group){var decisions=group.units.map(function(unit){return rowFor(unit.session.sessionId).decision});if(decisions.every(function(x){return x==='ACCEPTED'}))return'ACCEPTED';if(decisions.some(function(x){return x==='NEEDS_FIX'}))return'NEEDS_FIX';if(decisions.some(function(x){return x==='REJECTED'}))return'REJECTED';return'PENDING'}
function recompute(){var rows=state.results.sessions;state.results.humanReviewed=rows.filter(function(row){return row.humanReviewed===true}).length;state.results.accepted=rows.filter(function(row){return row.humanReviewed===true&&row.decision==='ACCEPTED'}).length;state.results.rejected=rows.filter(function(row){return row.humanReviewed===true&&row.decision==='REJECTED'}).length;state.results.needsFix=rows.filter(function(row){return row.humanReviewed===true&&row.decision==='NEEDS_FIX'}).length;state.results.criticalBoundaryFailures=rows.filter(function(row){return row.humanReviewed===true&&row.criticalBoundaryFailure===true}).length;state.results.humanAcceptanceComplete=state.results.accepted===448&&state.results.criticalBoundaryFailures===0;state.results.status=state.results.humanAcceptanceComplete?'HUMAN_EDITORIAL_ACCEPTANCE_REACHED_PENDING_ADMISSION':'HUMAN_REVIEW_IN_PROGRESS';state.results.productionPromotionAllowed=false;state.results.publicRunAllowed=false}
function renderSummary(){recompute();var groupsAccepted=data.groups.filter(function(group){return groupDecision(group)==='ACCEPTED'}).length;byId('summary').innerHTML='<span class="pill">卦组 '+groupsAccepted+' / 64 approved</span><span class="pill">Units '+state.results.humanReviewed+' / 448 reviewed</span><span class="pill">Accepted '+state.results.accepted+'</span><span class="pill">Needs fix '+state.results.needsFix+'</span><span class="pill">Critical '+state.results.criticalBoundaryFailures+'</span><span class="pill">publicRunAllowed = false</span>'}
function filteredGroups(){return data.groups.filter(function(group){return state.filter==='ALL'||groupDecision(group)===state.filter})}
function renderNodes(){var groups=filteredGroups();byId('nodes').innerHTML=groups.map(function(group){var index=data.groups.indexOf(group);var decision=groupDecision(group);var h=group.hexagram;var accepted=group.units.filter(function(unit){return rowFor(unit.session.sessionId).decision==='ACCEPTED'}).length;return '<div class="node '+(index===state.groupIndex?'active':'')+'"><div class="node-head"><label class="selected-label"><input type="checkbox" data-select="'+esc(h.hexagramId)+'" '+(state.selected.has(h.hexagramId)?'checked':'')+'>选择</label><span class="status '+decision+'">'+decision+'</span></div><button type="button" data-group="'+index+'" style="border:0;background:transparent;text-align:left;padding:4px 0 0;width:100%"><strong>'+String(h.number).padStart(2,'0')+' · '+esc(h.chineseNameZhHans)+' '+esc(h.canonicalName)+'</strong><small>'+accepted+' / 7 accepted · '+esc(h.hexagramId)+'</small></button></div>'}).join('')||'<p class="muted">此筛选暂无卦组。</p>';document.querySelectorAll('[data-group]').forEach(function(button){button.onclick=function(){state.groupIndex=Number(button.dataset.group);state.unitIndex=0;render()}});document.querySelectorAll('[data-select]').forEach(function(box){box.onchange=function(){if(box.checked)state.selected.add(box.dataset.select);else state.selected.delete(box.dataset.select)}})}
function list(title,items){return '<p><strong>'+esc(title)+'</strong></p><ul>'+arr(items).map(function(item){return '<li>'+esc(item)+'</li>'}).join('')+'</ul>'}
function projection(locale,value){var language=locale==='zh-Hans'?'简体中文':'English';return '<article class="projection"><h3>'+language+'</h3><p><strong>Plain meaning</strong><br>'+esc(value.plainMeaning)+'</p><p><strong>Situation / stage</strong><br>'+esc(value.situationOrStage)+'</p><p><strong>Central tension</strong><br>'+esc(value.centralTension)+'</p><p><strong>Constructive expression</strong><br>'+esc(value.constructiveExpressionOrMovement)+'</p><p><strong>Distortion risk</strong><br>'+esc(value.distortionOrFailureRisk)+'</p><p><strong>Timing / condition</strong><br>'+esc(value.timingOrCondition)+'</p>'+list('What to observe',value.whatToObserve)+list('Reflection questions',value.reflectionQuestions)+list('Misreading warnings',value.misreadingWarnings)+'</article>'}
function criteria(row){return '<div class="criteria">'+data.rubric.criteria.map(function(item){var value=row.criteria&&row.criteria[item.id];return '<label class="criterion"><input type="checkbox" data-criterion="'+esc(item.id)+'" '+(value===true?'checked':'')+'><span><strong>'+esc(item.id)+(item.critical?' · CRITICAL':'')+'</strong><small>'+esc(item.question)+'</small></span></label>'}).join('')+'</div>'}
function renderReview(){var group=data.groups[state.groupIndex];if(!group){byId('review').innerHTML='';return}var unit=group.units[state.unitIndex]||group.units[0];var candidate=unit.candidate;var row=rowFor(unit.session.sessionId);var h=group.hexagram;var title=candidate.scope==='HEXAGRAM'?'Whole hexagram / 卦义':'Line '+candidate.linePosition+' / 第'+candidate.linePosition+'爻';var sources=unit.sourceClaims.map(function(source){return '<div class="canonical">'+esc(source.claim)+'</div><p class="locator"><strong>'+esc(source.claimId)+'</strong><br>'+esc(source.sourceId)+' · '+esc(source.provenance&&source.provenance.sourceLocator)+'</p>'}).join('');var localeHtml=state.locale==='zh-Hans'?projection('zh-Hans',candidate.localeProjections['zh-Hans']):state.locale==='en'?projection('en',candidate.localeProjections.en):'<div class="projection-grid">'+projection('zh-Hans',candidate.localeProjections['zh-Hans'])+projection('en',candidate.localeProjections.en)+'</div>';byId('review').innerHTML='<div class="card"><div class="node-head"><div><h1>'+String(h.number).padStart(2,'0')+' · '+esc(h.chineseNameZhHans)+' '+esc(h.canonicalName)+'</h1><p class="muted">'+esc(h.hexagramId)+' · 1 whole-hexagram + 6 line units</p></div><span class="status '+groupDecision(group)+'">'+groupDecision(group)+'</span></div><div class="unit-tabs" role="tablist">'+group.units.map(function(item,index){var r=rowFor(item.session.sessionId);var label=item.candidate.scope==='HEXAGRAM'?'卦义':'爻 '+item.candidate.linePosition;return '<button data-unit="'+index+'" aria-selected="'+(index===state.unitIndex)+'">'+label+' · '+r.decision+'</button>'}).join('')+'</div></div><div class="review-grid"><aside class="source card"><h2>Canonical source witness</h2>'+sources+'<p class="muted">Scope '+esc(candidate.scope)+(candidate.linePosition?' · bottom-to-top line '+candidate.linePosition:'')+'</p><p class="muted">Candidate digest<br><span class="locator">'+esc(unit.candidateDigest)+'</span></p></aside><div><section class="card"><div class="tabs" role="tablist"><button data-locale="compare" aria-selected="'+(state.locale==='compare')+'">双语对照</button><button data-locale="zh-Hans" aria-selected="'+(state.locale==='zh-Hans')+'">简体中文</button><button data-locale="en" aria-selected="'+(state.locale==='en')+'">English</button></div><h2>'+esc(title)+'</h2>'+localeHtml+'</section><section class="card"><h2>12 项 editorial criteria</h2><p class="muted">单项记录时逐项勾选。逐卦/批量批准表示你确认相应 unit 的 12 项全部通过。</p>'+criteria(row)+'</section><div class="decision"><button id="prevGroup">上一卦</button><button id="nextGroup">下一卦</button><input id="unitNote" class="note" value="'+esc(row.notes||'')+'" placeholder="审核备注（可选）"><button data-decision="NEEDS_FIX">标记需修订</button><button data-decision="REJECTED" class="danger">不通过此 unit</button><button data-decision="ACCEPTED" class="approve">通过此 unit</button><button id="approveGroup" class="approve">通过本卦 7 units</button></div></div></div>';document.querySelectorAll('[data-unit]').forEach(function(button){button.onclick=function(){state.unitIndex=Number(button.dataset.unit);renderReview()}});document.querySelectorAll('[data-locale]').forEach(function(button){button.onclick=function(){state.locale=button.dataset.locale;renderReview()}});document.querySelectorAll('[data-decision]').forEach(function(button){button.onclick=function(){recordUnit(unit,button.dataset.decision)}});byId('approveGroup').onclick=function(){approveGroups([group])};byId('prevGroup').onclick=function(){state.groupIndex=Math.max(0,state.groupIndex-1);state.unitIndex=0;render()};byId('nextGroup').onclick=function(){state.groupIndex=Math.min(data.groups.length-1,state.groupIndex+1);state.unitIndex=0;render()}}
function evidence(){var reviewer=byId('reviewer').value.trim();var sha=byId('deploymentSha').value.trim();var environment=byId('environmentUrl').value.trim();var reference=byId('evidenceRef').value.trim();if(!reviewer)throw new Error('Reviewer ID 不能为空。');if(!/^[a-f0-9]{40}$/.test(sha))throw new Error('Reviewed source / deployment SHA 必须是 40 位小写 git SHA。');if(!/^https:\/\//.test(environment))throw new Error('Review environment 必须是 HTTPS URL。');if(!reference)throw new Error('请填写一次 aggregate screenshot / evidence reference。');return{reviewer:reviewer,sha:sha,environment:environment,reference:reference}}
function writeRow(unit,decision,values,criteriaValues,notes){var row=rowFor(unit.session.sessionId);var failedCritical=Object.keys(criteriaValues).some(function(id){return criticalIds.has(id)&&criteriaValues[id]===false});Object.assign(row,{humanReviewed:true,decision:decision,reviewerId:values.reviewer,reviewedAt:new Date().toISOString(),deploymentSha:values.sha,environmentUrl:values.environment,locale:unit.session.locale,viewport:{width:window.innerWidth,height:window.innerHeight},candidateDigest:unit.candidateDigest,sourceClaimIds:unit.sourceClaims.map(function(source){return source.claimId}),screenshotRefs:[values.reference],criteria:criteriaValues,criticalBoundaryFailure:failedCritical,notes:notes||('Recorded through grouped article-approval workspace; aggregate evidence '+values.reference+'. Public activation remains separate.')})}
function allPassCriteria(){var value={};criterionIds.forEach(function(id){value[id]=true});return value}
function recordUnit(unit,decision){try{var values=evidence();var criteriaValues={};document.querySelectorAll('[data-criterion]').forEach(function(box){criteriaValues[box.dataset.criterion]=box.checked});if(decision==='ACCEPTED'&&criterionIds.some(function(id){return criteriaValues[id]!==true}))throw new Error('ACCEPTED 要求 12 项 criteria 全部勾选。');var note=byId('unitNote').value.trim();writeRow(unit,decision,values,criteriaValues,note);message('已记录 '+unit.session.sessionId+' = '+decision+'；请及时导出 JSON。',false);render()}catch(error){message(error.message,true)}}
function approveGroups(groups){try{var values=evidence();var units=groups.flatMap(function(group){return group.units});var label=groups.length===64?'全部 64 卦 / 448 units':groups.length+' 个卦组 / '+units.length+' units';if(!confirm('你确认已经人工检查 '+label+' 的 canonical source、双语含义与 12 项 criteria，并批准全部通过吗？'))return;var now=new Date().toISOString();units.forEach(function(unit){writeRow(unit,'ACCEPTED',values,allPassCriteria(),'Human-approved in grouped article-approval workflow at '+now+'; aggregate reviewer-controlled evidence '+values.reference+'.')});message('已记录 '+label+' 为 ACCEPTED。导出 JSON 后再运行 governed admission script。',false);render()}catch(error){message(error.message,true)}}
function message(text,isWarning){var node=byId('message');node.textContent=text;node.className='banner'+(isWarning?' warn':'')}
function exportResults(){recompute();var blob=new Blob([JSON.stringify(state.results,null,2)+'\n'],{type:'application/json'});var url=URL.createObjectURL(blob);var link=document.createElement('a');link.href=url;link.download='iching-depth-human-review-results-v1.json';link.click();setTimeout(function(){URL.revokeObjectURL(url)},1000);message('已导出 canonical results JSON。publicRunAllowed 仍为 false。',false)}
async function importResults(file){try{var value=JSON.parse(await file.text());if(value.schemaVersion!==state.results.schemaVersion||!Array.isArray(value.sessions)||value.sessions.length!==448)throw new Error('不兼容的 results 文件。');var ids=new Set(state.results.sessions.map(function(row){return row.sessionId}));if(value.sessions.some(function(row){return !ids.has(row.sessionId)}))throw new Error('results 中包含未知 session。');state.results=value;message('已导入 results JSON。',false);render()}catch(error){message('导入失败：'+error.message,true)}}
function render(){renderSummary();renderNodes();renderReview()}
document.querySelectorAll('[data-filter]').forEach(function(button){button.onclick=function(){state.filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(function(item){item.setAttribute('aria-pressed',String(item===button))});renderNodes()}});
byId('exportButton').onclick=exportResults;byId('importButton').onclick=function(){byId('importFile').click()};byId('importFile').onchange=function(event){if(event.target.files&&event.target.files[0])importResults(event.target.files[0])};byId('approveSelected').onclick=function(){var groups=data.groups.filter(function(group){return state.selected.has(group.hexagram.hexagramId)});if(!groups.length){message('请先在左侧选择至少一个卦组。',true);return}approveGroups(groups);state.selected.clear()};byId('approveAll').onclick=function(){approveGroups(data.groups)};
render();
})();
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUTPUT),{recursive:true});
fs.writeFileSync(OUTPUT,html);
console.log(`✓ Generated ${OUTPUT}: 64 grouped hexagrams, 448 evidence-preserving review units.`);
console.log('  This offline workspace is not a second route authority; it exports the canonical depth results JSON.');
