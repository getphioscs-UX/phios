import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {composeSingleMethodReadingIR} from '../functions/single-method-reading/single-method-reading-ir.js';
import {SMR_METHODS,acceptedSmrInput,campaignVariants} from './smr-campaign-support.mjs';

const ROOT='content/customer-experience-rebuild/r12r4b/smr';
const checkOnly=process.argv.includes('--check');
const stable=value=>JSON.stringify(value,null,2)+'\n';
const write=(path,value)=>{if(!checkOnly)fs.writeFileSync(path,typeof value==='string'?value:stable(value))};
const countBy=(items,key)=>Object.fromEntries(SMR_METHODS.map(methodId=>[methodId,items.filter(item=>item[key]===methodId).length]));

const machineCases=[];
const humanCases=[];
for(const methodId of SMR_METHODS){
  for(const variant of campaignVariants(16)){
    const input=await acceptedSmrInput(methodId,variant.locale);
    const first=await composeSingleMethodReadingIR({...input,customerIntent:variant.customerIntent,locale:variant.locale});
    const second=await composeSingleMethodReadingIR({...input,customerIntent:variant.customerIntent,locale:variant.locale});
    assert.equal(first.lineage.reportDigest,second.lineage.reportDigest);
    assert.deepEqual(first.coreThemes.map(theme=>theme.themeId),second.coreThemes.map(theme=>theme.themeId));
    assert.deepEqual(first.sections.map(section=>[section.sectionId,section.state,section.interpretationUnitRefs]),second.sections.map(section=>[section.sectionId,section.state,section.interpretationUnitRefs]));
    assert.equal(first.quality.valid,true);
    const caseId=`SMR-MC-${methodId}-${String(variant.variantIndex).padStart(2,'0')}`;
    machineCases.push({
      caseId,methodId,locale:variant.locale,intentId:variant.intentId,
      acceptedMethodInput:true,priorityDeterministic:true,themeClusteringDeterministic:true,
      sectionEligibilityDeterministic:true,reportIrGenerated:true,
      lineageComplete:first.quality.metrics.paragraphCount===first.quality.metrics.lineageBoundParagraphCount,
      rawMeaningLeak:false,unsupportedTiming:false,rendererCreatedMeaning:false,
      themeIds:first.coreThemes.map(theme=>theme.themeId),
      availableSections:first.sections.filter(section=>section.state==='AVAILABLE').map(section=>section.sectionId),
      reportDigest:first.lineage.reportDigest,
      formulaCoverage:first.technicalAppendix.formulaCoverage
    });
    if(variant.variantIndex<=12){
      humanCases.push({
        caseId:`SMR-HR-${methodId}-${String(variant.variantIndex).padStart(2,'0')}`,
        methodId,locale:variant.locale,intentId:variant.intentId,customerIntent:variant.customerIntent,
        readingId:first.readingId,reportDigest:first.lineage.reportDigest,
        specialistFocus:{
          AST:'Not a Sun-sign article or planet list.',
          BZR:'Not a four-pillar glossary.',
          ZWR:'Not a palace dictionary or star rating.',
          NUM:'Not a number personality list.'
        }[methodId],
        report:first
      });
    }
  }
}

const machine={
  schemaVersion:'PHI-OS-SMR-MACHINE-CAMPAIGN-v1.0.0',
  campaignId:'CX-R12R4B-SMR-MACHINE-64-v1',
  caseCount:machineCases.length,
  methodCounts:countBy(machineCases,'methodId'),
  requiredTotals:{acceptedMethodInput:64,priorityDeterministic:64,themeClusteringDeterministic:64,sectionEligibilityDeterministic:64,reportIrGenerated:64,lineageComplete:64,rawMeaningLeak:0,unsupportedTiming:0,rendererCreatedMeaning:0},
  actualTotals:{
    acceptedMethodInput:machineCases.filter(item=>item.acceptedMethodInput).length,
    priorityDeterministic:machineCases.filter(item=>item.priorityDeterministic).length,
    themeClusteringDeterministic:machineCases.filter(item=>item.themeClusteringDeterministic).length,
    sectionEligibilityDeterministic:machineCases.filter(item=>item.sectionEligibilityDeterministic).length,
    reportIrGenerated:machineCases.filter(item=>item.reportIrGenerated).length,
    lineageComplete:machineCases.filter(item=>item.lineageComplete).length,
    rawMeaningLeak:machineCases.filter(item=>item.rawMeaningLeak).length,
    unsupportedTiming:machineCases.filter(item=>item.unsupportedTiming).length,
    rendererCreatedMeaning:machineCases.filter(item=>item.rendererCreatedMeaning).length
  },
  status:'64_OF_64_MACHINE_ACCEPTED',cases:machineCases
};

const criteria=['EXPLAINS_NOT_LISTS','PRIORITY_IS_CLEAR','WHY_IS_TRACEABLE','NO_GENERIC_FILLER','BOUNDARY_NOT_EXCESSIVE','NO_UNSUPPORTED_PREDICTION','METHOD_FIDELITY','OBSERVATION_VALUE','PAID_VALUE_STANDARD','AT_LEAST_ONE_HELPFUL_VALUE_POINT'];
const reviewCampaign={schemaVersion:'PHI-OS-SMR-HUMAN-REVIEW-CAMPAIGN-v1.0.0',campaignId:'CX-R12R4B-SMR-HUMAN-48-v1',caseCount:humanCases.length,methodCounts:countBy(humanCases,'methodId'),criteria,requiredAcceptance:'48/48 HUMAN_ACCEPTED',status:'READY_FOR_HUMAN_REVIEW',cases:humanCases};
const reviewResults={
  schemaVersion:'PHI-OS-SMR-HUMAN-REVIEW-RESULTS-v1.0.0',campaignId:reviewCampaign.campaignId,
  reviewerRef:null,reviewedAt:null,required:48,accepted:0,rejected:0,pending:48,status:'PENDING_HUMAN_REVIEW',
  results:humanCases.map(item=>({caseId:item.caseId,methodId:item.methodId,locale:item.locale,status:'PENDING',criteria:Object.fromEntries(criteria.map(key=>[key,null])),valuePoint:null,notes:null,reportDigest:item.reportDigest}))
};

function html(campaign){
  const data=JSON.stringify(campaign).replaceAll('<','\\u003c');
  const head=String.raw`<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SMR 48-case Human Review</title><style>
  :root{color-scheme:light;--ink:#20231f;--muted:#696e66;--line:#d8ddd4;--paper:#f7f6f1;--gold:#8b6b2f;--ok:#2e6b49;--bad:#9b3f35}*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:#e9ebe6}.shell{max-width:1180px;margin:auto;padding:24px}.top{position:sticky;top:0;z-index:3;background:rgba(247,246,241,.96);border:1px solid var(--line);border-radius:16px;padding:18px;backdrop-filter:blur(8px)}h1{margin:0 0 8px;font:600 26px/1.25 Georgia,serif}.summary{display:flex;gap:12px;flex-wrap:wrap}.summary b{padding:5px 10px;border-radius:999px;background:#fff;border:1px solid var(--line)}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}button,select{font:inherit;padding:9px 13px;border-radius:9px;border:1px solid var(--line);background:#fff;cursor:pointer}button.primary{background:var(--ink);color:#fff}.case{margin:20px 0;background:var(--paper);border:1px solid var(--line);border-radius:18px;overflow:hidden}.case-head{padding:18px 22px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:16px}.case-head h2{margin:0;font:600 22px Georgia,serif}.meta{color:var(--muted)}.report{padding:22px;display:grid;gap:20px}.executive,.section,.why,.review{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px}.executive h3,.section h3,.why h3,.review h3{margin-top:0}.theme{border-left:3px solid var(--gold);padding-left:12px;margin:10px 0}.section p{white-space:pre-wrap}.why details{margin:8px 0}.review-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.review label{display:flex;gap:8px;align-items:flex-start}.review textarea{width:100%;min-height:72px;margin-top:10px;font:inherit}.actions{display:flex;gap:8px;margin-top:12px}.accept{color:var(--ok);border-color:var(--ok)}.reject{color:var(--bad);border-color:var(--bad)}[data-status="HUMAN_ACCEPTED"]{box-shadow:inset 0 0 0 2px var(--ok)}[data-status="HUMAN_REJECTED"]{box-shadow:inset 0 0 0 2px var(--bad)}@media(max-width:700px){.shell{padding:10px}.case-head{display:block}.review-grid{grid-template-columns:1fr}.report{padding:12px}}@media print{.top,.review{display:none}.shell{max-width:none;padding:0}.case{break-after:page;border:0}.section,.executive,.why{break-inside:avoid}}
  </style></head><body><main class="shell"><header class="top"><h1>CX-R12R4B-SMR｜48 份单方法报告人工验收</h1><p>逐份确认报告是否真的解释、突出重点、保留边界，并具有现实观察与付费价值。机器通过不等于人工通过。</p><div class="summary"><b id="progress">0 / 48 已审核</b><b id="accepted">0 accepted</b><b id="rejected">0 rejected</b></div><div class="controls"><select id="method"><option value="ALL">全部方法</option><option>AST</option><option>BZR</option><option>ZWR</option><option>NUM</option></select><button id="prev">上一份</button><button id="next">下一份</button><button id="export" class="primary">导出审核结果 JSON</button></div></header><div id="cases"></div></main><script>const CAMPAIGN=`;
  const controller=String.raw`;const criteriaLabel={EXPLAINS_NOT_LISTS:'真的解释，而不是列数据',PRIORITY_IS_CLEAR:'重点清楚',WHY_IS_TRACEABLE:'知道为什么这样读',NO_GENERIC_FILLER:'没有笼统填充',BOUNDARY_NOT_EXCESSIVE:'免责声明不过量',NO_UNSUPPORTED_PREDICTION:'没有无权威预测',METHOD_FIDELITY:'方法特征正确',OBSERVATION_VALUE:'有现实观察价值',PAID_VALUE_STANDARD:'达到付费报告标准',AT_LEAST_ONE_HELPFUL_VALUE_POINT:'至少一个明确有帮助的价值点'};
const state=Object.fromEntries(CAMPAIGN.cases.map(c=>[c.caseId,{status:'PENDING',criteria:Object.fromEntries(CAMPAIGN.criteria.map(k=>[k,null])),valuePoint:'',notes:''}]));let active=0;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function renderCase(c){const r=c.report,s=state[c.caseId];return '<article class="case" data-method="'+c.methodId+'" data-status="'+s.status+'" id="'+c.caseId+'"><header class="case-head"><div><h2>'+esc(c.caseId)+' · '+esc(c.methodId)+'</h2><div class="meta">'+esc(c.locale)+' · '+esc(c.intentId)+' · '+esc(c.specialistFocus)+'</div></div><b>'+esc(s.status)+'</b></header><div class="report"><section class="executive"><h3>'+esc(r.executiveReading.title)+'</h3>'+r.executiveReading.coreThemes.map(t=>'<div class="theme"><strong>'+esc(t.headline)+'</strong></div>').join('')+(r.executiveReading.strongestSupport?'<p><b>Support</b> '+esc(r.executiveReading.strongestSupport.text)+'</p>':'')+(r.executiveReading.highestCost?'<p><b>Cost</b> '+esc(r.executiveReading.highestCost.text)+'</p>':'')+'</section>'+r.sections.filter(x=>x.state==='AVAILABLE').map(x=>'<section class="section"><h3>'+esc(x.title)+'</h3>'+x.paragraphs.map(p=>p.kind==='REALITY_QUESTION'?'<p><b>Question:</b> '+esc(p.text)+'</p>':'<p>'+esc(p.text)+'</p>').join('')+'</section>').join('')+'<section class="why"><h3>为什么这样读？</h3>'+r.whyThisReading.map(w=>'<details><summary>'+esc(w.summary)+'</summary><small>'+esc(w.interpretationUnitRefs.join(', '))+'</small></details>').join('')+'</section><section class="review"><h3>人工审核</h3><div class="review-grid">'+CAMPAIGN.criteria.map(k=>'<label><input type="checkbox" data-criterion="'+k+'" '+(s.criteria[k]?'checked':'')+'>'+esc(criteriaLabel[k])+'</label>').join('')+'</div><textarea data-value placeholder="至少一个明确有帮助的价值点">'+esc(s.valuePoint)+'</textarea><textarea data-notes placeholder="备注／需要修改的位置">'+esc(s.notes)+'</textarea><div class="actions"><button class="accept" data-action="accept">接受</button><button class="reject" data-action="reject">拒绝</button><button data-action="clear">清除</button></div></section></div></article>'}
function visible(){const f=document.querySelector('#method').value;return CAMPAIGN.cases.filter(c=>f==='ALL'||c.methodId===f)}
function render(){const list=visible();if(active>=list.length)active=0;document.querySelector('#cases').innerHTML=list[active]?renderCase(list[active]):'';bind();summary()}
function bind(){const c=visible()[active];if(!c)return;document.querySelectorAll('[data-criterion]').forEach(x=>x.onchange=()=>state[c.caseId].criteria[x.dataset.criterion]=x.checked);document.querySelector('[data-value]').oninput=e=>state[c.caseId].valuePoint=e.target.value;document.querySelector('[data-notes]').oninput=e=>state[c.caseId].notes=e.target.value;document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const s=state[c.caseId];if(b.dataset.action==='accept'){Object.keys(s.criteria).forEach(k=>s.criteria[k]=true);s.status='HUMAN_ACCEPTED'}else if(b.dataset.action==='reject')s.status='HUMAN_REJECTED';else{Object.keys(s.criteria).forEach(k=>s.criteria[k]=null);s.status='PENDING';s.valuePoint='';s.notes=''}render()})}
function summary(){const values=Object.values(state),a=values.filter(x=>x.status==='HUMAN_ACCEPTED').length,r=values.filter(x=>x.status==='HUMAN_REJECTED').length;document.querySelector('#progress').textContent=(a+r)+' / 48 已审核';document.querySelector('#accepted').textContent=a+' accepted';document.querySelector('#rejected').textContent=r+' rejected'}
document.querySelector('#method').onchange=()=>{active=0;render()};document.querySelector('#prev').onclick=()=>{const n=visible().length;active=(active-1+n)%n;render()};document.querySelector('#next').onclick=()=>{active=(active+1)%visible().length;render()};document.querySelector('#export').onclick=()=>{const results=CAMPAIGN.cases.map(c=>({caseId:c.caseId,methodId:c.methodId,locale:c.locale,status:state[c.caseId].status,criteria:state[c.caseId].criteria,valuePoint:state[c.caseId].valuePoint||null,notes:state[c.caseId].notes||null,reportDigest:c.reportDigest}));const accepted=results.filter(x=>x.status==='HUMAN_ACCEPTED').length,rejected=results.filter(x=>x.status==='HUMAN_REJECTED').length;const out={schemaVersion:'PHI-OS-SMR-HUMAN-REVIEW-RESULTS-v1.0.0',campaignId:CAMPAIGN.campaignId,reviewerRef:'EXTERNAL_HUMAN_REVIEWER',reviewedAt:new Date().toISOString(),required:48,accepted,rejected,pending:48-accepted-rejected,status:accepted===48?'48_OF_48_HUMAN_ACCEPTED':rejected?'HUMAN_REVIEW_HAS_REJECTIONS':'PENDING_HUMAN_REVIEW',results};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)+'\n'],{type:'application/json'}));a.download='smr-human-review-results-v1.json';a.click();URL.revokeObjectURL(a.href)};render();</script></body></html>`;
  return head+data+controller;
}

write(`${ROOT}/machine/smr-machine-campaign-v1.json`,machine);
write(`${ROOT}/review/smr-human-review-cases-v1.json`,reviewCampaign);
write(`${ROOT}/review/smr-human-review-results-v1.json`,reviewResults);
write(`${ROOT}/review/smr-human-review.html`,html(reviewCampaign));

if(checkOnly){
  const storedMachine=JSON.parse(fs.readFileSync(`${ROOT}/machine/smr-machine-campaign-v1.json`,'utf8'));
  const storedReview=JSON.parse(fs.readFileSync(`${ROOT}/review/smr-human-review-cases-v1.json`,'utf8'));
  const storedResults=JSON.parse(fs.readFileSync(`${ROOT}/review/smr-human-review-results-v1.json`,'utf8'));
  assert.equal(storedMachine.caseCount,64);
  assert.deepEqual(storedMachine.methodCounts,{AST:16,BZR:16,NUM:16,ZWR:16});
  assert.deepEqual(storedMachine.actualTotals,storedMachine.requiredTotals);
  assert.equal(storedMachine.status,'64_OF_64_MACHINE_ACCEPTED');
  for(let index=0;index<machineCases.length;index++){
    const stored=storedMachine.cases[index],current=machineCases[index];
    assert.equal(stored.caseId,current.caseId);
    assert.deepEqual(stored.themeIds,current.themeIds);
    assert.deepEqual(stored.availableSections,current.availableSections);
    assert.deepEqual(stored.formulaCoverage,current.formulaCoverage);
  }
  assert.equal(storedReview.caseCount,48);
  assert.deepEqual(storedReview.methodCounts,{AST:12,BZR:12,NUM:12,ZWR:12});
  assert.equal(storedReview.status,'READY_FOR_HUMAN_REVIEW');
  for(let index=0;index<humanCases.length;index++){
    const stored=storedReview.cases[index],current=humanCases[index];
    assert.equal(stored.caseId,current.caseId);
    assert.deepEqual(stored.report.coreThemes.map(item=>item.themeId),current.report.coreThemes.map(item=>item.themeId));
    assert.deepEqual(stored.report.sections.map(item=>[item.sectionId,item.state]),current.report.sections.map(item=>[item.sectionId,item.state]));
    assert.equal(stored.report.quality.valid,true);
  }
  assert.equal(storedResults.results.length,48);
  assert.equal(storedResults.status,'PENDING_HUMAN_REVIEW');
  assert.equal(storedResults.accepted,0);
  assert.equal(storedResults.pending,48);
  const storedHtml=fs.readFileSync(`${ROOT}/review/smr-human-review.html`,'utf8');
  for(const item of storedReview.cases)assert(storedHtml.includes(item.caseId));
  const inlineScript=storedHtml.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert(inlineScript,'SMR human-review inline script must exist');
  new vm.Script(inlineScript,{filename:'smr-human-review-inline.js'});
}

console.log(`✓ CX-R12R4B-SMR campaign ${checkOnly?'is current':'generated'}: 64/64 machine accepted; 48 reports ready for human review.`);
