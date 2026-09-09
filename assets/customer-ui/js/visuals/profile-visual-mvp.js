const list=v=>Array.isArray(v)?v:[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zh=l=>l==='zh-Hans';
const humanize=v=>String(v??'').replaceAll('::',' · ').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const figBy=(projection,id)=>list(projection?.figures).find(x=>x?.pfig===id)||null;
const stateReady=fig=>fig?.state==='READY';

function nativeValue(v){
  if(v==null)return '—';
  if(typeof v==='number'||typeof v==='string')return String(v);
  if(typeof v.normalizedSelfReportIndex==='number')return `${Math.round(v.normalizedSelfReportIndex)}/100`;
  if(typeof v.score==='number')return String(v.score);
  if(typeof v.rawScore==='number')return String(v.rawScore);
  if(typeof v.correctCount==='number')return String(v.correctCount);
  const pairs=Object.entries(v).filter(([,x])=>['number','string','boolean'].includes(typeof x)).slice(0,2);
  return pairs.length?pairs.map(([k,x])=>`${humanize(k)} ${x}`).join(' · '):'—';
}

const empty=(fig,locale,detail='')=>`<section class="prf-pfig prf-pfig--empty" data-pfig="${esc(fig?.pfig||'')}"><div class="prf-pfig-empty__mark" aria-hidden="true"></div><div><p class="prf-pfig__eyebrow">${zh(locale)?'资料仍在形成':'Evidence still forming'}</p><h3>${esc(fig?.customerLabel?.[locale]||fig?.customerLabel?.en||'Profile view')}</h3><p>${esc(detail|| (zh(locale)?'目前没有足够、可直接投影的证据；PHI OS 不会补写缺失结果。':'There is not enough governed evidence to render this view yet. PHI OS will not fill the gaps.'))}</p></div></section>`;

function dimensionMap(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'完成一个 Profile 来源后，这里会按来源分别显示可观察维度。':'Complete a Profile source to see its dimensions here, kept separate by source.');
  const lanes=list(fig.data?.lanes);
  return `<section class="prf-pfig prf-pfig--dimension" data-pfig="PFIG-001"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'来源分层':'SOURCE-AWARE'}</p><h3>${zh(locale)?'Profile 维度地图':'Profile dimension map'}</h3></div><p>${zh(locale)?'每一组都保留原始来源，不把不同测量体系合成同一分数。':'Each lane keeps its original source. Different instruments are not merged into one score.'}</p></header><div class="prf-dimension-lanes">${lanes.map(l=>`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(l.providerFamily||l.sourceClass||l.sourceKey))}</span><small>${esc(humanize(l.sourceClass||''))}</small></div><div class="prf-dimension-lane__items">${list(l.dimensions).map(d=>`<div class="prf-dimension-chip"><span>${esc(humanize(d.facetId||d.domainId||'Signal'))}</span><strong>${esc(nativeValue(d.value))}</strong></div>`).join('')}</div></article>`).join('')}</div></section>`;
}

function itemLabel(x){return x?.label||x?.title||x?.statement||x?.note||humanize(x?.lensId||x?.signalRef||x?.id||x?.kind||'Observed pattern');}
function strengthCost(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当你确认某个已观察模式“帮助我”“消耗我”或两者兼有时，这里才会出现资源／成本地图。':'This view appears only when an observed pattern is confirmed as helping, costing, or both.');
  const resources=list(fig.data?.resources), costs=list(fig.data?.costs);
  const col=(rows,type)=>`<div class="prf-sc-col" data-kind="${type}"><div class="prf-sc-col__title"><span aria-hidden="true"></span><b>${type==='resource'?(zh(locale)?'可调用资源':'Observed resources'):(zh(locale)?'成本与张力':'Costs & tensions')}</b></div>${rows.length?rows.map(x=>`<article><strong>${esc(itemLabel(x))}</strong>${x?.contextType?`<small>${esc(humanize(x.contextType))}</small>`:''}</article>`).join(''):`<p class="prf-sc-col__none">${zh(locale)?'目前没有已确认项目':'No confirmed items yet'}</p>`}</div>`;
  return `<section class="prf-pfig" data-pfig="PFIG-003"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'现实确认':'REALITY-CONFIRMED'}</p><h3>${zh(locale)?'资源与成本地图':'Resource & cost map'}</h3></div><p>${zh(locale)?'高分不会自动变成优势，低分也不会自动变成弱点。这里只显示已有证据与现实确认。':'High scores do not automatically become strengths, and low scores do not become weaknesses. This view uses governed evidence and reality confirmation only.'}</p></header><div class="prf-sc-grid">${col(resources,'resource')}${col(costs,'cost')}</div></section>`;
}

const stateMeta=(locale)=>({
  CONVERGES:{label:zh(locale)?'趋同':'Converges',hint:zh(locale)?'不同来源指向相近观察':'Sources point toward a similar observation'},
  CONTEXT_DEPENDENT:{label:zh(locale)?'视情境而变':'Context-dependent',hint:zh(locale)?'差异可由明确情境证据解释':'Difference is tied to explicit context evidence'},
  DIVERGES:{label:zh(locale)?'分歧':'Diverges',hint:zh(locale)?'来源之间存在明确不一致':'Sources remain explicitly different'},
  UNKNOWN:{label:zh(locale)?'尚未确认':'Unknown',hint:zh(locale)?'证据不足，不强行归类':'Insufficient evidence; no forced classification'}
});
function convergence(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'加入第二个可比较来源，或与 Current Reality 对照后，这里才会显示跨来源关系。':'Add another comparable source, or compare with Current Reality, to open this cross-source view.');
  const rows=list(fig.data?.perspectives), meta=stateMeta(locale);
  const groups=['CONVERGES','CONTEXT_DEPENDENT','DIVERGES','UNKNOWN'];
  return `<section class="prf-pfig" data-pfig="PFIG-005"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'跨来源':'CROSS-SOURCE'}</p><h3>${zh(locale)?'趋同、情境与分歧':'Convergence & divergence'}</h3></div><p>${zh(locale)?'相似不代表互相验证；分歧也可以保留。':'Similarity does not validate one source with another; disagreement is allowed to remain visible.'}</p></header><div class="prf-convergence-grid">${groups.map(g=>{const hits=rows.filter(x=>x.projectionState===g);return `<article class="prf-convergence-state" data-state="${g}"><div class="prf-convergence-state__top"><span></span><strong>${esc(meta[g].label)}</strong><b>${hits.length}</b></div><small>${esc(meta[g].hint)}</small>${hits.slice(0,3).map(x=>`<p>${esc(x.statement||humanize(x.nativeGroup||''))}</p>`).join('')}</article>`}).join('')}</div></section>`;
}

function realityBridge(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当 Profile 与 Current Reality、矛盾证据或已有观察问题发生连接时，这里会形成现实桥接。':'This bridge appears when Profile evidence connects to Current Reality, contradictions, or an admitted observation question.');
  const contradictions=list(fig.data?.contradictions), questions=list(fig.data?.questions); const hasContext=Boolean(fig.data?.contextEvidence);
  const stage=(n,title,body,active=true)=>`<div class="prf-bridge-stage" data-active="${active?'true':'false'}"><span class="prf-bridge-stage__n">${n}</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`;
  return `<section class="prf-pfig prf-pfig--bridge" data-pfig="PFIG-009"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'现实桥接':'REALITY BRIDGE'}</p><h3>${zh(locale)?'从 Profile 回到现实':'Bring Profile back to reality'}</h3></div><p>${zh(locale)?'Profile 提供观察角度，Current Reality 提供当下情境；二者不会互相证明。':'Profile offers a lens; Current Reality supplies present context. Neither validates the other.'}</p></header><div class="prf-bridge-flow">${stage('01',zh(locale)?'Profile 证据':'Profile evidence',zh(locale)?'保留来源与时间':'Source and date stay visible',true)}${stage('02',zh(locale)?'Current Reality':'Current Reality',hasContext?(zh(locale)?'已有当前情境证据':'Current context evidence is available'):(zh(locale)?'尚未连接当前情境':'No current context linked yet'),hasContext)}${stage('03',zh(locale)?'需要观察的差异':'What to observe',contradictions.length?(zh(locale)?`${contradictions.length} 个来源／情境差异仍可见`:`${contradictions.length} source/context difference(s) remain visible`):(zh(locale)?'目前没有明确矛盾':'No explicit contradiction in this result'),contradictions.length>0)}${stage('04',zh(locale)?'现实问题':'Reality question',questions[0]?.text|| (zh(locale)?'加入 Current Reality 后再继续观察。':'Add Current Reality to continue the observation.'),questions.length>0)}</div><div class="prf-bridge-actions"><a class="cx-button" href="/perspectives/personal/#cx-current-reality">${zh(locale)?'与 Current Reality 对照':'Compare with Current Reality'}</a></div></section>`;
}

export function renderProfileVisualMvp(projection,{locale='en'}={}){
  if(!projection||!Array.isArray(projection.figures)) return '';
  return `<div class="prf-visual-mvp" data-pvp-profile-mvp="W8"><div class="prf-visual-mvp__intro"><p class="cx-eyebrow">PROFILE VISUAL</p><h2>${zh(locale)?'把证据变成可阅读的地图':'Turn evidence into a readable map'}</h2><p>${zh(locale)?'视觉只投影已有 Profile/PPR 证据；没有资料的地方会明确保持空白。':'These visuals project governed Profile/PPR evidence only. Missing evidence remains visibly unresolved.'}</p></div>${dimensionMap(figBy(projection,'PFIG-001'),locale)}${strengthCost(figBy(projection,'PFIG-003'),locale)}${convergence(figBy(projection,'PFIG-005'),locale)}${realityBridge(figBy(projection,'PFIG-009'),locale)}</div>`;
}

export function mountProfileVisualMvp(root,projection,options={}){
  if(!root)return false;
  root.innerHTML=renderProfileVisualMvp(projection,options);
  root.hidden=!root.innerHTML;
  return !root.hidden;
}

export const PROFILE_VISUAL_MVP_IDS=Object.freeze(['PFIG-001','PFIG-003','PFIG-005','PFIG-009']);
