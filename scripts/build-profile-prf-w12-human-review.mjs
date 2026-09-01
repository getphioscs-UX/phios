import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const BASE='3a8e0658e26fa931257b491204a6ed2dcb345725';
const read=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const write=(rel,v)=>{const a=path.join(ROOT,rel);fs.mkdirSync(path.dirname(a),{recursive:true});fs.writeFileSync(a,JSON.stringify(v,null,2)+'\n')};
const machine=read('content/profile/campaign/profile-prf-w12-machine-results-v1.json');
if(machine.status!=='PASS_24_OF_24'||machine.cases.length!==24)throw new Error('PRF_W12_MACHINE_24_OF_24_REQUIRED_BEFORE_HUMAN_REVIEW');
const criteria=[
  {id:'SOURCE_CLASS_CLARITY',en:'Measured/task, self-reported, external and symbolic sources remain clearly different.',zh:'任务表现、自陈、外部结果与象征来源是否清楚区分。'},
  {id:'NO_PSEUDO_QUOTIENT',en:'No pseudo-scientific IQ/EQ-style quotient or universal profile score is implied.',zh:'是否没有暗示伪科学式 IQ/EQ 商数或统一人格总分。'},
  {id:'NO_DIAGNOSIS',en:'No diagnosis or clinical inference is created from profile answers.',zh:'是否没有从 Profile 答案生成诊断或临床推断。'},
  {id:'NO_COMPATIBILITY_SCORE',en:'Relationship profile evidence never becomes a compatibility percentage.',zh:'关系 Profile 证据是否没有变成相容度百分比。'},
  {id:'NO_PARTNER_MIND_READING',en:'No partner hidden-state or private-thought inference is made.',zh:'是否没有推断伴侣隐藏状态或私人想法。'},
  {id:'ASSESSMENT_UNDERSTANDABLE',en:'The assessment result is understandable to a customer without governance jargon.',zh:'客户是否能在不理解治理术语的情况下读懂评估结果。'},
  {id:'PROFILE_VISUAL_READABLE',en:'Six-domain radar/profile visual is readable and does not imply a master score.',zh:'六维雷达／Profile 视觉是否易读且不暗示总分。'},
  {id:'PROVENANCE_ON_DEMAND',en:'Source/provider/date/provenance remains available on demand.',zh:'来源、提供方、日期与出处是否可按需查看。'},
  {id:'UNIFIED_NOT_FLATTENED',en:'PHI OS feels unified while evidence classes remain distinct.',zh:'PHI OS 是否呈现统一语言，同时没有把不同证据类别抹平。'}
];
const cases=machine.cases.map((c,i)=>({
  reviewCaseId:`PRF-W12-HR-${String(i+1).padStart(2,'0')}`,
  machineCaseId:c.caseId,
  coverage:c.coverage,
  title:c.title,
  mode:c.mode,
  participantRef:c.participantRef,
  sourceClasses:c.sourceClasses,
  oldResultWarning:c.oldResultWarning,
  radar:c.view.selfAssessmentRadar,
  sourceLegend:c.view.sourceLegend,
  currentReality:c.view.currentReality,
  crossSource:c.view.crossSource,
  relationshipProfile:c.view.relationshipProfile,
  freshness:c.view.freshness,
  signalCards:c.view.signalCards,
  boundaries:c.view.boundaries,
  publication:c.view.customerPublication,
  reviewCriteria:criteria.map(x=>x.id)
}));
write('content/profile/review/profile-prf-w12-human-review-cases-v1.json',{schemaVersion:'PHI-OS-PRF-W12-HUMAN-REVIEW-CASES-v1.0.0',work:'PRF-W12',baselineCommit:BASE,status:'READY_FOR_NEW_HUMAN_REVIEW',requiredCases:24,criteria,cases});
write('content/profile/review/profile-prf-w12-human-review-results-v1.json',{schemaVersion:'PHI-OS-PRF-W12-HUMAN-REVIEW-RESULTS-v1.0.0',work:'PRF-W12',baselineCommit:BASE,status:'PENDING_24_OF_24',requiredCases:24,accepted:0,rejected:0,pending:24,inheritedAcceptance:false,results:cases.map(c=>({reviewCaseId:c.reviewCaseId,machineCaseId:c.machineCaseId,decision:'PENDING',reviewerNote:null})),governance:{machinePassDoesNotEqualHumanAcceptance:true,customerPublicationAllowed:false,profileSurfaceCutoverAllowed:false}});
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const caseHtml=cases.map(c=>{
  const axes=(c.radar?.axes||[]).map(a=>`<div class="axis"><span>${esc(a.label)}</span><div class="track"><i style="width:${a.value??0}%"></i></div><b>${a.value==null?'—':Math.round(a.value)}</b></div>`).join('');
  const legend=(c.sourceLegend||[]).map(x=>`<span class="chip">${esc(x.label)} · ${esc(x.sourceClass)}</span>`).join('');
  const reality=c.currentReality?`<div class="sub"><strong>${esc(c.currentReality.label)}</strong><pre>${esc(JSON.stringify(c.currentReality.counts,null,2))}</pre></div>`:'';
  const cross=c.crossSource?`<div class="sub"><strong>Cross-source</strong><p>${esc(c.crossSource.boundary)}</p></div>`:'';
  const rel=c.relationshipProfile?`<div class="sub"><strong>Relationship profile</strong><p>${esc(c.relationshipProfile.boundary)}</p></div>`:'';
  return `<article class="case" data-case="${esc(c.reviewCaseId)}"><header><div><small>${esc(c.reviewCaseId)} · ${esc(c.coverage)}</small><h2>${esc(c.title)}</h2><p>${esc(c.mode)} · ${esc(c.participantRef||'multi/context')}</p></div><span class="state">PENDING</span></header><div class="chips">${legend||'<span class="chip">No source signal</span>'}</div>${c.oldResultWarning?`<div class="warning">Older result warning is required and present.</div>`:''}<section><h3>Profile visual</h3>${axes||'<p>No self-assessment radar for this source lane.</p>'}</section>${reality}${cross}${rel}<details><summary>Source / provenance / boundaries</summary><pre>${esc(JSON.stringify({signals:c.signalCards,freshness:c.freshness,boundaries:c.boundaries,publication:c.publication},null,2))}</pre></details><section class="criteria"><h3>Human criteria</h3>${criteria.map(x=>`<label><input type="checkbox" data-criterion="${x.id}"> <b>${esc(x.zh)}</b><small>${esc(x.en)}</small></label>`).join('')}</section><div class="decision"><button data-decision="ACCEPTED">Accept</button><button data-decision="REVISE">Revise</button><button data-decision="REJECTED">Reject</button><textarea placeholder="Reviewer note / 审核备注"></textarea></div></article>`;
}).join('\n');
const embedded=JSON.stringify({schemaVersion:'PHI-OS-PRF-W12-HUMAN-REVIEW-EXPORT-v1.0.0',requiredCases:24,criteria:criteria.map(x=>x.id),cases:cases.map(c=>({reviewCaseId:c.reviewCaseId,machineCaseId:c.machineCaseId}))}).replace(/</g,'\\u003c');
const html=`<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>PRF-W12 · 24 Human Review</title><style>:root{font-family:Inter,system-ui,sans-serif;color:#15213a;background:#f5f7fb}body{margin:0}.wrap{max-width:1180px;margin:auto;padding:32px}.hero,.case{background:#fff;border:1px solid #dce3ee;border-radius:20px;box-shadow:0 10px 30px rgba(20,35,60,.06)}.hero{padding:28px;margin-bottom:24px}.hero h1{margin:6px 0}.hero p{max-width:850px;line-height:1.6}.summary{display:flex;gap:12px;flex-wrap:wrap}.pill,.chip,.state{border:1px solid #ccd7e8;border-radius:999px;padding:7px 11px;background:#f8fbff;font-size:12px}.case{padding:24px;margin:18px 0}.case header{display:flex;justify-content:space-between;gap:16px}.case h2{margin:5px 0 4px;font-size:20px}.case header p,.case small{color:#60708b}.chips{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.axis{display:grid;grid-template-columns:minmax(160px,1fr) 3fr 42px;align-items:center;gap:12px;margin:9px 0}.track{height:10px;background:#e8edf5;border-radius:999px;overflow:hidden}.track i{display:block;height:100%;background:linear-gradient(90deg,#355eaa,#7b5fb3)}.warning{padding:12px;border-radius:12px;background:#fff4d7;border:1px solid #f0d48a}.sub{border-left:3px solid #8094bd;padding:8px 14px;margin:14px 0}.criteria{display:grid;gap:8px;margin-top:18px}.criteria label{display:block;border:1px solid #e1e6ef;border-radius:12px;padding:10px}.criteria small{display:block;margin-left:24px;margin-top:4px}.decision{display:grid;grid-template-columns:repeat(3,auto) 1fr;gap:8px;margin-top:16px}.decision button{padding:9px 14px;border:1px solid #8ca1c6;background:#fff;border-radius:9px;cursor:pointer}.decision button.active{background:#173b76;color:#fff}.decision textarea{min-height:42px;border:1px solid #ccd5e3;border-radius:9px;padding:8px}.toolbar{position:sticky;bottom:12px;display:flex;justify-content:flex-end;gap:10px;padding:12px;background:rgba(245,247,251,.92);backdrop-filter:blur(8px)}.toolbar button{padding:12px 18px;border:0;border-radius:10px;background:#173b76;color:#fff;font-weight:700}pre{white-space:pre-wrap;word-break:break-word;font-size:12px;background:#f7f9fc;padding:12px;border-radius:10px}@media(max-width:760px){.wrap{padding:16px}.decision{grid-template-columns:1fr}.axis{grid-template-columns:1fr}.case header{display:block}}</style></head><body><main class="wrap"><section class="hero"><small>PHI OS · PRF-W12</small><h1>Profile 24-case Human Review</h1><p>这是新的 Profile 人工验收包。Machine campaign 已经 24/24 PASS，但这<strong>不等于</strong>人工验收。每案需检查证据类别、非诊断、非 IQ／商数、关系边界、可读性、来源可见性与统一语言。</p><div class="summary"><span class="pill">24 cases</span><span class="pill">9 criteria / case</span><span class="pill">Accepted 0</span><span class="pill">Pending 24</span></div></section>${caseHtml}<div class="toolbar"><button id="export">Export review JSON</button></div></main><script>const seed=${embedded};const state=Object.fromEntries(seed.cases.map(c=>[c.reviewCaseId,{...c,decision:'PENDING',reviewerNote:null,criteria:{}}]));document.querySelectorAll('.case').forEach(card=>{const id=card.dataset.case;card.querySelectorAll('[data-criterion]').forEach(x=>x.addEventListener('change',()=>state[id].criteria[x.dataset.criterion]=x.checked));card.querySelectorAll('[data-decision]').forEach(b=>b.addEventListener('click',()=>{card.querySelectorAll('[data-decision]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state[id].decision=b.dataset.decision;card.querySelector('.state').textContent=b.dataset.decision}));card.querySelector('textarea').addEventListener('input',e=>state[id].reviewerNote=e.target.value||null)});document.getElementById('export').addEventListener('click',()=>{const results=Object.values(state);const accepted=results.filter(x=>x.decision==='ACCEPTED').length,rejected=results.filter(x=>x.decision==='REJECTED'||x.decision==='REVISE').length,pending=results.filter(x=>x.decision==='PENDING').length;const out={schemaVersion:'PHI-OS-PRF-W12-HUMAN-REVIEW-RESULTS-v1.0.0',work:'PRF-W12',baselineCommit:'${BASE}',status:pending===0&&rejected===0&&accepted===24?'ACCEPTED_24_OF_24':'REVIEW_IN_PROGRESS',requiredCases:24,accepted,rejected,pending,inheritedAcceptance:false,results,governance:{machinePassDoesNotEqualHumanAcceptance:true}};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));a.download='profile-prf-w12-human-review-results-v1.json';a.click();URL.revokeObjectURL(a.href)});</script></body></html>`;
fs.writeFileSync(path.join(ROOT,'content/profile/review/profile-prf-w12-human-review.html'),html);
console.log('✓ PRF-W12 new human review pack generated: 24 cases, 24 pending.');
