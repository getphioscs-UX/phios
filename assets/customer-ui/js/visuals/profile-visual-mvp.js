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
  return `<section class="prf-pfig prf-pfig--dimension" data-pfig="PFIG-001"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'来源分层':'SOURCE-AWARE'}</p><h3>${zh(locale)?'个人证据维度地图':'Personal evidence dimension map'}</h3></div><p>${zh(locale)?'每一组都保留原始来源，不把不同测量体系合成同一分数。':'Each lane keeps its original source. Different instruments are not merged into one score.'}</p></header><div class="prf-dimension-lanes">${lanes.map(l=>`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(l.providerFamily||l.sourceClass||l.sourceKey))}</span><small>${esc(humanize(l.sourceClass||''))}</small></div><div class="prf-dimension-lane__items">${list(l.dimensions).map(d=>`<div class="prf-dimension-chip"><span>${esc(humanize(d.facetId||d.domainId||'Signal'))}</span><strong>${esc(nativeValue(d.value))}</strong></div>`).join('')}</div></article>`).join('')}</div></section>`;
}

function itemLabel(x){return x?.label||x?.title||x?.statement||x?.note||humanize(x?.lensId||x?.signalRef||x?.id||x?.kind||'Observed pattern');}
function strengthCost(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当你确认某个已观察模式“帮助我”“消耗我”或两者兼有时，这里才会出现资源／成本地图。':'This view appears only when an observed pattern is confirmed as helping, costing, or both.');
  const resources=list(fig.data?.resources), costs=list(fig.data?.costs);
  const col=(rows,type)=>`<div class="prf-sc-col" data-kind="${type}"><div class="prf-sc-col__title"><span aria-hidden="true"></span><b>${type==='resource'?(zh(locale)?'可调用资源':'Observed resources'):(zh(locale)?'成本与张力':'Costs & tensions')}</b></div>${rows.length?rows.map(x=>`<article><strong>${esc(itemLabel(x))}</strong>${x?.contextType?`<small>${esc(humanize(x.contextType))}</small>`:''}</article>`).join(''):`<p class="prf-sc-col__none">${zh(locale)?'目前没有已确认项目':'No confirmed items yet'}</p>`}</div>`;
  return `<section class="prf-pfig" data-pfig="PFIG-003"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'现实确认':'REALITY-CONFIRMED'}</p><h3>${zh(locale)?'资源与成本地图':'Resource & cost map'}</h3></div><p>${zh(locale)?'高分不会自动变成优势，低分也不会自动变成弱点。这里只显示已有证据与现实确认。':'High scores do not automatically become strengths, and low scores do not become weaknesses. This view uses governed evidence and reality confirmation only.'}</p></header><div class="prf-sc-grid">${col(resources,'resource')}${col(costs,'cost')}</div></section>`;
}


function patternRadar(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当同一来源具有至少两个可比较维度时，这里会显示来源内的模式分布。':'A source-native pattern appears here when one source has at least two comparable dimensions.');
  const series=list(fig.data?.series);
  return `<section class="prf-pfig" data-pfig="PFIG-002"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'来源内模式':'WITHIN-SOURCE'}</p><h3>${zh(locale)?'测评模式':'Assessment pattern'}</h3></div><p>${zh(locale)?'每条序列只属于自己的来源；不同测评不会合并成总人格雷达。':'Each series stays within its own source. Different instruments are not merged into one master personality radar.'}</p></header><div class="prf-dimension-lanes">${series.map(row=>`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(row.providerFamily||row.sourceClass||row.sourceKey))}</span><small>${esc(humanize(row.sourceClass||''))}</small></div><div class="prf-dimension-lane__items">${list(row.points).map(p=>`<div class="prf-dimension-chip"><span>${esc(humanize(p.axis))}</span><strong>${esc(nativeValue(p.value))}</strong></div>`).join('')}</div></article>`).join('')}</div></section>`;
}

function contextVariation(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'加入带有明确情境的现实观察后，这里会显示证据如何随情境变化。':'Add explicit context observations to see how evidence varies across contexts.');
  const observations=list(fig.data?.observations);
  const ctxs=list(fig.data?.contexts);
  return `<section class="prf-pfig" data-pfig="PFIG-004"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'情境':'CONTEXT'}</p><h3>${zh(locale)?'情境变化':'Context variation'}</h3></div><p>${zh(locale)?'这里只显示明确记录的情境；未观察到的情境继续保持未知。':'Only explicitly recorded contexts appear here. Unobserved contexts remain unknown.'}</p></header><div class="prf-dimension-lanes">${ctxs.map(ctx=>{const rows=observations.filter(x=>x.contextType===ctx);return `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(ctx))}</span><small>${rows.length} ${zh(locale)?'项观察':'observation(s)'}</small></div><div class="prf-dimension-lane__items">${rows.map(x=>`<div class="prf-dimension-chip"><span>${esc(itemLabel(x))}</span><strong>${esc(humanize(x.confirmation||'UNSURE'))}</strong></div>`).join('')}</div></article>`}).join('')}</div></section>`;
}

function workMap(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'加入职业兴趣或工作情境观察后，这里会形成工作证据地图。':'Add career-interest or work-context evidence to open this work map.');
  const interest=fig.data?.interestEvidence;
  const observed=list(fig.data?.observedExpression);
  const axes=list(interest?.axes);
  return `<section class="prf-pfig" data-pfig="PFIG-006"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'工作证据':'WORK EVIDENCE'}</p><h3>${zh(locale)?'工作兴趣与表达':'Work interest & expression'}</h3></div><p>${zh(locale)?'职业兴趣不是能力或就业适配结论；现实观察可以补充它在工作中的实际表达。':'Career interest is not an ability or job-fit verdict. Real-world observations may add evidence about expression at work.'}</p></header><div class="prf-dimension-lanes">${axes.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>RIASEC</span><small>${zh(locale)?'职业兴趣':'Career interest'}</small></div><div class="prf-dimension-lane__items">${axes.map(a=>`<div class="prf-dimension-chip"><span>${esc(a.label||a.code||'Interest')}</span><strong>${esc(nativeValue(a.score))}</strong></div>`).join('')}</div></article>`:''}${observed.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'现实观察':'Observed expression'}</span><small>WORK</small></div><div class="prf-dimension-lane__items">${observed.map(x=>`<div class="prf-dimension-chip"><span>${esc(itemLabel(x))}</span><strong>${esc(humanize(x.confirmation||'UNSURE'))}</strong></div>`).join('')}</div></article>`:''}</div></section>`;
}

function relationshipMap(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'加入关系情境的观察或已治理的关系证据后，这里会显示互动证据。':'Add relationship observations or evidence to open this interaction view.');
  const observed=list(fig.data?.observations);
  const rel=fig.data?.relationshipEvidence;
  return `<section class="prf-pfig" data-pfig="PFIG-007"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'关系证据':'RELATIONSHIP EVIDENCE'}</p><h3>${zh(locale)?'关系互动':'Relationship interaction'}</h3></div><p>${zh(locale)?'这里不产生兼容度、对方隐藏状态或关系结果预测。':'This view does not create compatibility scores, hidden-partner inference, or outcome predictions.'}</p></header><div class="prf-dimension-lanes">${observed.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'已观察互动':'Observed interaction'}</span><small>RELATIONSHIP</small></div><div class="prf-dimension-lane__items">${observed.map(x=>`<div class="prf-dimension-chip"><span>${esc(itemLabel(x))}</span><strong>${esc(humanize(x.confirmation||'UNSURE'))}</strong></div>`).join('')}</div></article>`:''}${rel?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'关系来源':'Relationship source'}</span><small>${esc(humanize(rel.sourceClass||rel.kind||'EVIDENCE'))}</small></div><div class="prf-dimension-lane__items"><div class="prf-dimension-chip"><span>${esc(itemLabel(rel))}</span><strong>${zh(locale)?'保留来源':'Source preserved'}</strong></div></div></article>`:''}</div></section>`;
}

function decisionMap(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当规划、风险意识、决策纪律或现实决策观察可用时，这里会显示决策证据。':'Decision evidence appears when planning, risk awareness, decision discipline, or relevant current observations are available.');
  const dims=list(fig.data?.decisionEvidence);
  const current=list(fig.data?.currentPattern);
  return `<section class="prf-pfig" data-pfig="PFIG-008"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'决策证据':'DECISION EVIDENCE'}</p><h3>${zh(locale)?'当前决策证据':'Current decision evidence'}</h3></div><p>${zh(locale)?'它不是固定决策类型，也不构成财务建议。':'This is not a fixed decision type and it does not constitute financial advice.'}</p></header><div class="prf-dimension-lanes">${dims.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'来源维度':'Source dimensions'}</span><small>${dims.length}</small></div><div class="prf-dimension-lane__items">${dims.map(x=>`<div class="prf-dimension-chip"><span>${esc(humanize(x.facetId||x.domainId||'Decision'))}</span><strong>${esc(nativeValue(x.value))}</strong></div>`).join('')}</div></article>`:''}${current.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>Current Reality</span><small>${zh(locale)?'现实观察':'Observed context'}</small></div><div class="prf-dimension-lane__items">${current.map(x=>`<div class="prf-dimension-chip"><span>${esc(itemLabel(x))}</span><strong>${esc(humanize(x.confirmation||'UNSURE'))}</strong></div>`).join('')}</div></article>`:''}</div></section>`;
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
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当个人证据与 Current Reality、矛盾证据或已有观察问题发生连接时，这里会形成现实桥接。':'This bridge appears when personal evidence connects to Current Reality, contradictions, or an admitted observation question.');
  const contradictions=list(fig.data?.contradictions), questions=list(fig.data?.questions); const hasContext=Boolean(fig.data?.contextEvidence);
  const stage=(n,title,body,active=true)=>`<div class="prf-bridge-stage" data-active="${active?'true':'false'}"><span class="prf-bridge-stage__n">${n}</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`;
  return `<section class="prf-pfig prf-pfig--bridge" data-pfig="PFIG-009"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'现实桥接':'REALITY BRIDGE'}</p><h3>${zh(locale)?'从个人证据回到现实':'Bring personal evidence back to reality'}</h3></div><p>${zh(locale)?'个人证据提供观察角度，Current Reality 提供当下情境；二者不会互相证明。':'Personal evidence offers a lens; Current Reality supplies present context. Neither validates the other.'}</p></header><div class="prf-bridge-flow">${stage('01',zh(locale)?'个人证据':'Personal evidence',zh(locale)?'保留来源与时间':'Source and date stay visible',true)}${stage('02',zh(locale)?'Current Reality':'Current Reality',hasContext?(zh(locale)?'已有当前情境证据':'Current context evidence is available'):(zh(locale)?'尚未连接当前情境':'No current context linked yet'),hasContext)}${stage('03',zh(locale)?'需要观察的差异':'What to observe',contradictions.length?(zh(locale)?`${contradictions.length} 个来源／情境差异仍可见`:`${contradictions.length} source/context difference(s) remain visible`):(zh(locale)?'目前没有明确矛盾':'No explicit contradiction in this result'),contradictions.length>0)}${stage('04',zh(locale)?'现实问题':'Reality question',questions[0]?.text|| (zh(locale)?'加入 Current Reality 后再继续观察。':'Add Current Reality to continue the observation.'),questions.length>0)}</div><div class="prf-bridge-actions"><a class="cx-button" href="/perspectives/personal/#cx-current-reality">${zh(locale)?'与 Current Reality 对照':'Compare with Current Reality'}</a></div></section>`;
}

export function renderProfileVisualMvp(projection,{locale='en'}={}){
  if(!projection||!Array.isArray(projection.figures)) return '';
  return `<div class="prf-visual-mvp" data-pvp-profile-mvp="W8"><div class="prf-visual-mvp__intro"><p class="cx-eyebrow">PERSONAL EVIDENCE VISUAL</p><h2>${zh(locale)?'把证据变成可阅读的地图':'Turn evidence into a readable map'}</h2><p>${zh(locale)?'视觉只投影已有 个人证据；没有资料的地方会明确保持空白。':'These visuals project governed personal evidence only. Missing evidence remains visibly unresolved.'}</p></div>${dimensionMap(figBy(projection,'PFIG-001'),locale)}${patternRadar(figBy(projection,'PFIG-002'),locale)}${strengthCost(figBy(projection,'PFIG-003'),locale)}${contextVariation(figBy(projection,'PFIG-004'),locale)}${convergence(figBy(projection,'PFIG-005'),locale)}${workMap(figBy(projection,'PFIG-006'),locale)}${relationshipMap(figBy(projection,'PFIG-007'),locale)}${decisionMap(figBy(projection,'PFIG-008'),locale)}${realityBridge(figBy(projection,'PFIG-009'),locale)}</div>`;
}

export function mountProfileVisualMvp(root,projection,options={}){
  if(!root)return false;
  root.innerHTML=renderProfileVisualMvp(projection,options);
  root.hidden=!root.innerHTML;
  return !root.hidden;
}

export const PROFILE_VISUAL_MVP_IDS=Object.freeze(['PFIG-001','PFIG-002','PFIG-003','PFIG-004','PFIG-005','PFIG-006','PFIG-007','PFIG-008','PFIG-009']);

// Dossier composition reuses the same governed figure without the screen opener.
export function renderPersonalEvidenceFigure(figure,{locale='en'}={}){
  const renderers={'PFIG-001':dimensionMap,'PFIG-002':patternRadar,'PFIG-003':strengthCost,'PFIG-004':contextVariation,'PFIG-005':convergence,'PFIG-006':workMap,'PFIG-007':relationshipMap,'PFIG-008':decisionMap,'PFIG-009':realityBridge};
  const render=renderers[figure?.pfig];
  if(!render)throw new Error('PERSONAL_EVIDENCE_FIGURE_NOT_ADMITTED');
  return render(figure,locale);
}
