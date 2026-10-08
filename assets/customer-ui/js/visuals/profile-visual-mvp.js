import {evidenceLabel,evidenceStatement,evidenceValueRows} from './personal-evidence-copy.js';
const list=v=>Array.isArray(v)?v:[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zh=l=>l==='zh-Hans';
const humanize=(v,locale)=>evidenceLabel(v,locale);
const figBy=(projection,id)=>list(projection?.figures).find(x=>x?.pfig===id)||null;
const stateReady=fig=>fig?.state==='READY';

function nativeValue(v,locale){
  if(v==null)return '—';
  if(typeof v==='number'||typeof v==='string')return evidenceLabel(v,locale);
  if(typeof v.normalizedSelfReportIndex==='number')return `${Math.round(v.normalizedSelfReportIndex)}/100`;
  if(typeof v.score==='number')return String(v.score);
  if(typeof v.rawScore==='number')return String(v.rawScore);
  if(typeof v.correctCount==='number')return String(v.correctCount);
  const pairs=evidenceValueRows(v,locale).slice(0,2);
  return pairs.length?pairs.map(([k,x])=>`${k} ${x}`).join(' · '):'—';
}

const empty=(fig,locale,detail='')=>`<section class="prf-pfig prf-pfig--empty" data-pfig="${esc(fig?.pfig||'')}"><div class="prf-pfig-empty__mark" aria-hidden="true"></div><div><p class="prf-pfig__eyebrow">${zh(locale)?'资料仍在形成':'Evidence still forming'}</p><h3>${esc(evidenceLabel(fig?.customerLabel?.[locale]||fig?.customerLabel?.en||'Evidence view',locale))}</h3><p>${esc(detail|| (zh(locale)?'目前没有足够、可直接投影的证据；PHI OS 不会补写缺失结果。':'There is not enough governed evidence to render this view yet. PHI OS will not fill the gaps.'))}</p></div></section>`;

function dimensionMap(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'完成一个个人证据来源后，这里会按来源分别显示可观察维度。':'Complete an evidence source to see its dimensions here, kept separate by source.');
  const lanes=list(fig.data?.lanes);
  return `<section class="prf-pfig prf-pfig--dimension" data-pfig="PFIG-001"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'来源分层':'SOURCE-AWARE'}</p><h3>${zh(locale)?'个人证据维度地图':'Personal evidence dimension map'}</h3></div><p>${zh(locale)?'每一组都保留原始来源，不把不同测量体系合成同一分数。':'Each lane keeps its original source. Different instruments are not merged into one score.'}</p></header><div class="prf-dimension-lanes">${lanes.map(l=>`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(l.providerFamily||l.sourceClass||l.sourceKey,locale))}</span><small>${esc(humanize(l.sourceClass||'',locale))}</small></div><div class="prf-dimension-lane__items">${list(l.dimensions).map(d=>`<div class="prf-dimension-chip"><span>${esc(humanize(d.facetId||d.domainId||'Signal',locale))}</span><strong>${esc(nativeValue(d.value,locale))}</strong></div>`).join('')}</div></article>`).join('')}</div></section>`;
}

function itemLabel(x,locale){return evidenceStatement(x?.label||x?.title||x?.statement||x?.note,locale)|| (zh(locale)?'已观察模式':'Observed pattern');}
function strengthCost(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当你确认某个已观察模式“帮助我”“消耗我”或两者兼有时，这里才会出现资源／成本地图。':'This view appears only when an observed pattern is confirmed as helping, costing, or both.');
  const resources=list(fig.data?.resources), costs=list(fig.data?.costs);
  const col=(rows,type)=>`<div class="prf-sc-col" data-kind="${type}"><div class="prf-sc-col__title"><span aria-hidden="true"></span><b>${type==='resource'?(zh(locale)?'可调用资源':'Observed resources'):(zh(locale)?'成本与张力':'Costs & tensions')}</b></div>${rows.length?rows.map(x=>`<article><strong>${esc(itemLabel(x,locale))}</strong>${x?.contextType?`<small>${esc(humanize(x.contextType,locale))}</small>`:''}</article>`).join(''):`<p class="prf-sc-col__none">${zh(locale)?'目前没有已确认项目':'No confirmed items yet'}</p>`}</div>`;
  return `<section class="prf-pfig" data-pfig="PFIG-003"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'现实确认':'REALITY-CONFIRMED'}</p><h3>${zh(locale)?'资源与成本地图':'Resource & cost map'}</h3></div><p>${zh(locale)?'高分不会自动变成优势，低分也不会自动变成弱点。这里只显示已有证据与现实确认。':'High scores do not automatically become strengths, and low scores do not become weaknesses. This view uses governed evidence and reality confirmation only.'}</p></header><div class="prf-sc-grid">${col(resources,'resource')}${col(costs,'cost')}</div></section>`;
}


function patternRadar(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当同一来源具有至少两个可比较维度时，这里会显示来源内的模式分布。':'A source-native pattern appears here when one source has at least two comparable dimensions.');
  const series=list(fig.data?.series);
  return `<section class="prf-pfig" data-pfig="PFIG-002"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'来源内模式':'WITHIN-SOURCE'}</p><h3>${zh(locale)?'测评模式':'Assessment pattern'}</h3></div><p>${zh(locale)?'每条序列只属于自己的来源；不同测评不会合并成总人格雷达。':'Each series stays within its own source. Different instruments are not merged into one master personality radar.'}</p></header><div class="prf-dimension-lanes">${series.map(row=>`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(row.providerFamily||row.sourceClass||row.sourceKey,locale))}</span><small>${esc(humanize(row.sourceClass||'',locale))}</small></div><div class="prf-dimension-lane__items">${list(row.points).map(p=>`<div class="prf-dimension-chip"><span>${esc(humanize(p.axis,locale))}</span><strong>${esc(nativeValue(p.value,locale))}</strong></div>`).join('')}</div></article>`).join('')}</div></section>`;
}

function contextVariation(fig,locale){
  if(!hasRenderablePersonalEvidenceFigure(fig)) return empty(fig,locale,zh(locale)?'加入带有明确情境的现实观察后，这里会显示证据如何随情境变化。':'Add explicit context observations to see how evidence varies across contexts.');
  const observations=list(fig.data?.observations);
  const ctxs=list(fig.data?.contexts);
  return `<section class="prf-pfig" data-pfig="PFIG-004"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'情境':'CONTEXT'}</p><h3>${zh(locale)?'情境变化':'Context variation'}</h3></div><p>${zh(locale)?'这里只显示明确记录的情境；未观察到的情境继续保持未知。':'Only explicitly recorded contexts appear here. Unobserved contexts remain unknown.'}</p></header><div class="prf-dimension-lanes">${ctxs.map(ctx=>{const rows=observations.filter(x=>x.contextType===ctx);return `<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${esc(humanize(ctx,locale))}</span><small>${rows.length} ${zh(locale)?'项观察':'observation(s)'}</small></div><div class="prf-dimension-lane__items">${rows.map(x=>`<div class="prf-dimension-chip"><span>${esc(itemLabel(x,locale))}</span><strong>${esc(humanize(x.confirmation||'UNSURE',locale))}</strong></div>`).join('')}</div></article>`}).join('')}</div></section>`;
}

function workMap(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'加入职业兴趣或工作情境观察后，这里会形成工作证据地图。':'Add career-interest or work-context evidence to open this work map.');
  const interest=fig.data?.interestEvidence;
  const observed=list(fig.data?.observedExpression);
  const axes=list(interest?.axes);
  return `<section class="prf-pfig" data-pfig="PFIG-006"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'工作证据':'WORK EVIDENCE'}</p><h3>${zh(locale)?'工作兴趣与表达':'Work interest & expression'}</h3></div><p>${zh(locale)?'职业兴趣不是能力或就业适配结论；现实观察可以补充它在工作中的实际表达。':'Career interest is not an ability or job-fit verdict. Real-world observations may add evidence about expression at work.'}</p></header><div class="prf-dimension-lanes">${axes.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>RIASEC</span><small>${zh(locale)?'职业兴趣':'Career interest'}</small></div><div class="prf-dimension-lane__items">${axes.map(a=>`<div class="prf-dimension-chip"><span>${esc(evidenceLabel(a.label||a.code||'Interest',locale))}</span><strong>${esc(nativeValue(a.score,locale))}</strong></div>`).join('')}</div></article>`:''}${observed.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'现实观察':'Observed expression'}</span><small>${zh(locale)?'工作':'Work'}</small></div><div class="prf-dimension-lane__items">${observed.map(x=>`<div class="prf-dimension-chip"><span>${esc(itemLabel(x,locale))}</span><strong>${esc(humanize(x.confirmation||'UNSURE',locale))}</strong></div>`).join('')}</div></article>`:''}</div></section>`;
}

function relationshipMap(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'加入关系情境的观察或已治理的关系证据后，这里会显示互动证据。':'Add relationship observations or evidence to open this interaction view.');
  const observed=list(fig.data?.observations);
  const rel=fig.data?.relationshipEvidence;
  return `<section class="prf-pfig" data-pfig="PFIG-007"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'关系证据':'RELATIONSHIP EVIDENCE'}</p><h3>${zh(locale)?'关系互动':'Relationship interaction'}</h3></div><p>${zh(locale)?'这里不产生兼容度、对方隐藏状态或关系结果预测。':'This view does not create compatibility scores, hidden-partner inference, or outcome predictions.'}</p></header><div class="prf-dimension-lanes">${observed.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'已观察互动':'Observed interaction'}</span><small>${zh(locale)?'关系':'Relationship'}</small></div><div class="prf-dimension-lane__items">${observed.map(x=>`<div class="prf-dimension-chip"><span>${esc(itemLabel(x,locale))}</span><strong>${esc(humanize(x.confirmation||'UNSURE',locale))}</strong></div>`).join('')}</div></article>`:''}${rel?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'关系来源':'Relationship source'}</span><small>${esc(humanize(rel.sourceClass||rel.kind||'EVIDENCE',locale))}</small></div><div class="prf-dimension-lane__items"><div class="prf-dimension-chip"><span>${esc(list(rel.evidence).map(x=>itemLabel(x,locale)).join(' · ')||itemLabel(rel,locale))}</span><strong>${zh(locale)?'保留来源':'Source preserved'}</strong></div></div></article>`:''}</div></section>`;
}

function decisionMap(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当规划、风险意识、决策纪律或现实决策观察可用时，这里会显示决策证据。':'Decision evidence appears when planning, risk awareness, decision discipline, or relevant current observations are available.');
  const dims=list(fig.data?.decisionEvidence);
  const current=list(fig.data?.currentPattern);
  return `<section class="prf-pfig" data-pfig="PFIG-008"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'决策证据':'DECISION EVIDENCE'}</p><h3>${zh(locale)?'当前决策证据':'Current decision evidence'}</h3></div><p>${zh(locale)?'它不是固定决策类型，也不构成财务建议。':'This is not a fixed decision type and it does not constitute financial advice.'}</p></header><div class="prf-dimension-lanes">${dims.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'来源维度':'Source dimensions'}</span><small>${dims.length}</small></div><div class="prf-dimension-lane__items">${dims.map(x=>`<div class="prf-dimension-chip"><span>${esc(humanize(x.facetId||x.domainId||'Decision',locale))}</span><strong>${esc(nativeValue(x.value,locale))}</strong></div>`).join('')}</div></article>`:''}${current.length?`<article class="prf-dimension-lane"><div class="prf-dimension-lane__source"><span>${zh(locale)?'当下现实':'Current reality'}</span><small>${zh(locale)?'现实观察':'Observed context'}</small></div><div class="prf-dimension-lane__items">${current.map(x=>`<div class="prf-dimension-chip"><span>${esc(itemLabel(x,locale))}</span><strong>${esc(humanize(x.confirmation||'UNSURE',locale))}</strong></div>`).join('')}</div></article>`:''}</div></section>`;
}

const stateMeta=(locale)=>({
  CONVERGES:{label:zh(locale)?'趋同':'Converges',hint:zh(locale)?'不同来源指向相近观察':'Sources point toward a similar observation'},
  CONTEXT_DEPENDENT:{label:zh(locale)?'视情境而变':'Context-dependent',hint:zh(locale)?'差异可由明确情境证据解释':'Difference is tied to explicit context evidence'},
  DIVERGES:{label:zh(locale)?'分歧':'Diverges',hint:zh(locale)?'来源之间存在明确不一致':'Sources remain explicitly different'},
  UNKNOWN:{label:zh(locale)?'尚未确认':'Unknown',hint:zh(locale)?'证据不足，不强行归类':'Insufficient evidence; no forced classification'}
});
function convergence(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'加入第二个可比较来源，或与当下现实 对照后，这里才会显示跨来源关系。':'Add another comparable source, or compare with current reality, to open this cross-source view.');
  const rows=list(fig.data?.perspectives), meta=stateMeta(locale);
  const groups=['CONVERGES','CONTEXT_DEPENDENT','DIVERGES','UNKNOWN'];
  return `<section class="prf-pfig" data-pfig="PFIG-005"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'跨来源':'CROSS-SOURCE'}</p><h3>${zh(locale)?'趋同、情境与分歧':'Convergence & divergence'}</h3></div><p>${zh(locale)?'相似不代表互相验证；分歧也可以保留。':'Similarity does not validate one source with another; disagreement is allowed to remain visible.'}</p></header><div class="prf-convergence-grid">${groups.map(g=>{const hits=rows.filter(x=>x.projectionState===g);return `<article class="prf-convergence-state" data-state="${g}"><div class="prf-convergence-state__top"><span></span><strong>${esc(meta[g].label)}</strong><b>${hits.length}</b></div><small>${esc(meta[g].hint)}</small>${hits.slice(0,3).map(x=>`<p>${esc(evidenceStatement(x.statement,locale)||meta[g].hint)}</p>`).join('')}</article>`}).join('')}</div></section>`;
}

function realityBridge(fig,locale){
  if(!stateReady(fig)) return empty(fig,locale,zh(locale)?'当个人证据与当下现实、矛盾证据或已有观察问题发生连接时，这里会形成现实桥接。':'This bridge appears when personal evidence connects to current reality, contradictions, or an admitted observation question.');
  const contradictions=list(fig.data?.contradictions), questions=list(fig.data?.questions); const hasContext=Boolean(fig.data?.contextEvidence?.currentReality);
  const stage=(n,title,body,active=true)=>`<div class="prf-bridge-stage" data-active="${active?'true':'false'}"><span class="prf-bridge-stage__n">${n}</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`;
  return `<section class="prf-pfig prf-pfig--bridge" data-pfig="PFIG-009"><header class="prf-pfig__head"><div><p class="prf-pfig__eyebrow">${zh(locale)?'现实桥接':'REALITY BRIDGE'}</p><h3>${zh(locale)?'从个人证据回到现实':'Bring personal evidence back to reality'}</h3></div><p>${zh(locale)?'个人证据提供观察角度，当下现实提供当下情境；二者不会互相证明。':'Personal evidence offers a lens; current reality supplies present context. Neither validates the other.'}</p></header><div class="prf-bridge-flow">${stage('01',zh(locale)?'个人证据':'Personal evidence',zh(locale)?'保留来源与时间':'Source and date stay visible',true)}${stage('02',zh(locale)?'当下现实':'Current reality',hasContext?(zh(locale)?'已有当前情境证据':'Current context evidence is available'):(zh(locale)?'尚未连接当前情境':'No current context linked yet'),hasContext)}${stage('03',zh(locale)?'需要观察的差异':'What to observe',contradictions.length?(zh(locale)?`${contradictions.length} 个来源／情境差异仍可见`:`${contradictions.length} source/context difference(s) remain visible`):(zh(locale)?'目前没有明确矛盾':'No explicit contradiction in this result'),contradictions.length>0)}${stage('04',zh(locale)?'现实问题':'Reality question',evidenceStatement(questions[0]?.text,locale)|| (zh(locale)?'加入当下现实 后再继续观察。':'Add current reality to continue the observation.'),questions.length>0)}</div><div class="prf-bridge-actions"><a class="cx-button" href="/perspectives/personal/#cx-current-reality">${zh(locale)?'与当下现实 对照':'Compare with current reality'}</a></div></section>`;
}

export function renderProfileVisualMvp(projection,{locale='en'}={}){
  if(!projection||!Array.isArray(projection.figures)) return '';
  return `<div class="prf-visual-mvp" data-pvp-profile-mvp="W8"><div class="prf-visual-mvp__intro"><p class="cx-eyebrow">${zh(locale)?'个人证据视觉':'Personal evidence visual'}</p><h2>${zh(locale)?'把证据变成可阅读的地图':'Turn evidence into a readable map'}</h2><p>${zh(locale)?'视觉只投影已有 个人证据；没有资料的地方会明确保持空白。':'These visuals project governed personal evidence only. Missing evidence remains visibly unresolved.'}</p></div>${dimensionMap(figBy(projection,'PFIG-001'),locale)}${patternRadar(figBy(projection,'PFIG-002'),locale)}${strengthCost(figBy(projection,'PFIG-003'),locale)}${contextVariation(figBy(projection,'PFIG-004'),locale)}${convergence(figBy(projection,'PFIG-005'),locale)}${workMap(figBy(projection,'PFIG-006'),locale)}${relationshipMap(figBy(projection,'PFIG-007'),locale)}${decisionMap(figBy(projection,'PFIG-008'),locale)}${realityBridge(figBy(projection,'PFIG-009'),locale)}</div>`;
}

export function mountProfileVisualMvp(root,projection,options={}){
  if(!root)return false;
  root.innerHTML=renderProfileVisualMvp(projection,options);
  root.hidden=!root.innerHTML;
  return !root.hidden;
}

export const PROFILE_VISUAL_MVP_IDS=Object.freeze(['PFIG-001','PFIG-002','PFIG-003','PFIG-004','PFIG-005','PFIG-006','PFIG-007','PFIG-008','PFIG-009']);

// Publication composition of the same source-bound PFIGs. Diagram state is
// presentation metadata only; no evidence state or interpreted claim is added.
const paired=(a,b)=>`${esc(a)}<span lang="en">${esc(b)}</span>`;
const named=v=>paired(evidenceLabel(v,'zh-Hans'),evidenceLabel(v,'en'));
const sourceNote=(cards)=>{
 const rows=list(cards),providers=[...new Set(rows.map(c=>c.providerFamily||c.sourceClass).filter(Boolean))],dates=[...new Set(rows.map(c=>c.assessmentDate).filter(Boolean))];
 return `<p class="pe-diagram-provenance">${paired('来源 / 日期','Source / date')}: ${providers.map(named).join(' · ')||paired('未提供','Not supplied')} · ${esc(dates.join(' · ')||'日期未提供 / Date not supplied')}</p>`;
};
const diagram=(grammar,title,description,body)=>`<div class="pe-semantic-diagram" data-diagram-grammar="${grammar}" role="group" aria-label="${esc(title)}"><p class="pe-diagram-description">${description}</p>${body}</div>`;
const edge=(from,to,active=false,conceptual=false)=>`<div class="pe-diagram-edge" data-edge-from="${esc(from)}" data-edge-to="${esc(to)}" data-edge-state="${conceptual?'conceptual':active?'recorded':'missing'}" aria-label="${conceptual?'概念顺序 / Conceptual sequence':active?'已有记录连接 / Recorded link':'连接未记录 / Link not recorded'}">${conceptual?'↓':'⋮'}<span>${conceptual?'概念顺序 / Conceptual sequence':active?'已有来源关联 / Recorded source link':'未连接 / Not linked'}</span></div>`;
const node=(id,label,detail,state='missing',refs=[])=>`<div class="pe-diagram-node" data-node-id="${esc(id)}" data-node-state="${state}" data-evidence-refs="${esc(refs.join(' '))}"><strong>${label}</strong><p>${detail}</p><small>${state==='recorded'?'有记录 / Recorded':state==='source-linked'?'来源主题 / Source-linked topic':state==='conceptual'?'概念提示 / Conceptual prompt':'未记录 / Not recorded'}</small></div>`;
const textAlternative=html=>`<p class="pe-diagram-alternative">${html}</p>`;

function publicationStructure(figure,{publicationRows=[],publicationSources=[]}){
 const id=figure.pfig,data=figure.data||{},cards=list(publicationSources),ready=figure.state==='READY';
 const title=paired(evidenceLabel(figure.customerLabel?.['zh-Hans'],'zh-Hans'),evidenceLabel(figure.customerLabel?.en,'en'));
 const states={READY:'已有来源 / Source available',EMPTY:'当前无资料 / Empty',UNKNOWN:'未知 / Unknown'};
 let graphic='',grammar='';
 if(id==='PFIG-001'){
  grammar='source-domain-topology';
  graphic=diagram(grammar,'来源与维度覆盖 / Source and domain coverage',paired('连接表示同一来源的覆盖，不代表领域能力高低。','Links show coverage by a source, not relative ability.'),list(data.lanes).map(l=>`<section class="pe-source-topology" data-source-key="${esc(l.sourceKey)}"><div class="pe-source-root">${node('source',named(l.providerFamily||l.sourceClass),named(l.sourceClass),'recorded')}</div><div class="pe-topology-branches">${list(l.dimensions).map(d=>`<div class="pe-topology-branch" data-edge-from="${esc(l.sourceKey)}" data-edge-to="${esc(d.signalRef)}" data-edge-state="recorded">${node(d.signalRef,named(d.facetId||d.domainId),`<b data-native-value="${esc(typeof d.value==='number'?d.value:d.value?.normalizedSelfReportIndex??'')}" >${esc(nativeValue(d.value,'en'))}</b><br>${esc(d.assessmentDate||'日期未提供 / Date not supplied')}`,'recorded',[d.signalRef])}</div>`).join('')}</div></section>`).join('')||node('source',paired('证据来源','Evidence source'),paired('尚未记录维度覆盖','Domain coverage not recorded')))+textAlternative(paired('相同的自陈位置不证明相同的能力；原值和来源分别保留。','Equal self-report positions do not establish equal ability. Native values and source identity remain separate.'));
 }
 if(id==='PFIG-002'){
  grammar='source-native-pattern';
  const panels=list(data.series).map(row=>{
   const points=list(row.points),native=row.sourceClass==='CUSTOMER_SELF_REPORT'&&points.length>=2&&points.every(p=>Number.isFinite(p.value)&&p.value>=0&&p.value<=100),xy=(i,r)=>[160+Math.sin(i*2*Math.PI/points.length)*r,150-Math.cos(i*2*Math.PI/points.length)*r];
   const plot=native?`<svg class="pe-native-radar" viewBox="0 0 320 320" role="img" aria-label="单一来源自陈位置，轴标签见配对图例 / Single-source self-report positions; axes identified in paired legend" data-source-key="${esc(row.sourceKey)}"><title>单源自陈 / Single-source self-report</title><desc>同一来源内的记录位置；不代表总人格或能力 / Recorded positions within one source; not a global personality or ability result</desc>${[25,50,75,100].map(r=>`<polygon points="${points.map((_,i)=>xy(i,r).join(',')).join(' ')}" fill="none" stroke="#baa77e"/>`).join('')}${points.map((_,i)=>{const [x,y]=xy(i,100);return `<line x1="160" y1="150" x2="${x}" y2="${y}" stroke="#baa77e"/>`;}).join('')}<polygon data-native-values="${points.map(p=>p.value).join(',')}" points="${points.map((p,i)=>xy(i,p.value).join(',')).join(' ')}" fill="#648caa38" stroke="#416781" stroke-width="2"/>${points.map((p,i)=>{const [x,y]=xy(i,120);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="16">${String.fromCharCode(65+i)} · ${p.value}</text>`;}).join('')}<text x="160" y="312" text-anchor="middle" font-size="14">0–100 · 自陈 / Self-report</text></svg>`:'';
   return `<section class="pe-pattern-panel" data-source-key="${esc(row.sourceKey)}" data-native-scale="${native?'SELF_REPORT_0_100':'SOURCE_NATIVE_ONLY'}"><h3>${named(row.providerFamily||row.sourceClass)}</h3>${plot}<div class="pe-axis-legend">${points.map((p,i)=>`<div data-axis-ref="${esc(p.signalRef)}"><b>${String.fromCharCode(65+i)}</b><span>${named(p.axis)}</span><strong>${esc(nativeValue(p.nativeValue??p.value,'en'))}</strong></div>`).join('')}</div></section>`;
  }).join('');
  const ipip=cards.filter(c=>c.providerFamily==='IPIP_BIG_FIVE'&&(Number.isFinite(c.value)||Number.isFinite(c.value?.rawMean)));
  const imported=ipip.length?`<section class="pe-native-series" data-source-series="IPIP_BIG_FIVE"><h3>${paired('大五来源原值','Big Five source-native values')}</h3><p>${paired('独立原生量尺；不投影到自陈多边形。','Independent native scale; not plotted onto the self-report polygon.')}</p>${ipip.map(c=>`<div data-evidence-ref="${esc(c.signalRef)}">${named(c.facetId||c.domainId)}: <b>${esc(typeof c.value==='number'?c.value:c.value.rawMean)}</b></div>`).join('')}</section>`:'';
  graphic=diagram(grammar,'单源模式与独立量尺 / Source-native pattern and independent scales',paired('每条序列只属于自己的来源；不同测评不会合并成总人格雷达。','Each series stays within its own source. Different instruments are not merged into one master personality radar.'),panels||node('pattern',paired('来源内模式','Within-source pattern'),paired('缺少可比较的原生维度','Comparable source-native dimensions not recorded')))+imported+textAlternative(paired('多边形表示回答位置，不证明整体人格、统一能力或跨领域差异。','The polygon shows response positions, not global personality, uniform ability or inferred domain differences.'));
 }
 if(id==='PFIG-003'){
  grammar='confirmation-slots';
  const slots=[['help','帮助','Help',list(data.resources).filter(x=>x.confirmation!=='BOTH')],['cost','成本','Cost',list(data.costs).filter(x=>x.confirmation!=='BOTH')],['both','两者兼有','Both',list(data.resources).filter(x=>x.confirmation==='BOTH')]];
  graphic=diagram(grammar,'帮助与成本的证据资格 / Qualification of help and cost evidence',paired('仅在具体观察被明确确认后，概念槽位才成为已记录项目。','A conceptual slot becomes a recorded item only after a specific observation is explicitly confirmed.'),node('observation',paired('具体观察与确认','Specific observation and confirmation'),ready?paired('仅列已有记录','Only supplied records are listed'):paired('缺少具体帮助／成本确认','Specific help or cost confirmation missing'))+`<div class="pe-slot-branches">${slots.map(([key,a,b,rows])=>`<section data-confirmation-slot="${key}">${edge('observation',key,rows.length>0)}${node(key,paired(a,b),rows.length?rows.map(x=>paired(itemLabel(x,'zh-Hans'),itemLabel(x,'en'))).join('<br>'):paired('尚无证据支持的结论','No evidenced conclusion'),rows.length?'recorded':'missing',rows.map(x=>x.signalRef).filter(Boolean))}</section>`).join('')}</div>`)+textAlternative(paired('高分不会自动变成优势，低分也不会自动变成弱点。','High scores do not automatically become strengths, and low scores do not become weaknesses.'));
 }
 if(id==='PFIG-004'){
  grammar='context-observation-lanes';
  const observations=list(data.observations);
  graphic=diagram(grammar,'来源与情境输入 / Source and contextual inputs',paired('情境节点是待记录的位置；虚线不表示已观察到变化。','Context nodes are input slots. Dashed links do not represent observed variation.'),node('source',paired('来源证据','Source evidence'),cards.length?paired('保留来源与日期','Source and date preserved'):paired('来源尚未记录','Source not recorded'),cards.length?'recorded':'missing')+`<div class="pe-context-lanes">${[['WORK','工作','Work'],['RELATIONSHIP','关系','Relationship'],['CURRENT_REALITY','当前情境','Current context']].map(([key,a,b])=>{const rows=observations.filter(x=>x.contextType===key);return `<div data-context-slot="${key}">${edge('source',key,rows.length>0)}${node(key,paired(a,b),rows.length?rows.map(x=>paired(itemLabel(x,'zh-Hans'),itemLabel(x,'en'))).join('<br>'):paired('没有明确情境观察','No explicit contextual observation'),rows.length?'recorded':'missing',rows.map(x=>x.signalRef).filter(Boolean))}</div>`;}).join('')}</div>`)+textAlternative(paired('未观察到的情境继续保持未知。','Unobserved contexts remain unknown.'));
 }
 if(id==='PFIG-005'){
  grammar='separated-source-comparison';
  const perspectives=list(data.perspectives),groups=stateMeta('en'),zhgroups=stateMeta('zh-Hans');
  graphic=diagram(grammar,'可比较来源与现实关联 / Comparable sources and reality links',paired('相似不代表互相验证；没有明确对照时，来源之间保持未连接。','Similarity does not validate sources. Without an explicit comparison, sources remain unconnected.'),`<div class="pe-comparison-inputs">${node('source-one',paired('已记录来源','Recorded source'),cards.length?paired('各原值分别保留','Native values retained separately'):paired('来源未记录','Source not recorded'),cards.length?'recorded':'missing')}${node('source-two',paired('第二可比较来源／现实关联','Second comparable source / reality link'),perspectives.length?paired('仅使用已有对照','Only supplied comparisons'):paired('没有明确对照','No explicit comparison'),perspectives.length?'recorded':'missing')}</div>${edge('source-one','source-two',false)}<div class="pe-comparison-states">${['CONVERGES','CONTEXT_DEPENDENT','DIVERGES','UNKNOWN'].map(key=>{const rows=perspectives.filter(p=>p.projectionState===key);return `<div data-comparison-state="${key}">${node(key,paired(zhgroups[key].label,groups[key].label),rows.length?paired('已有对照条目：'+rows.length,'Recorded comparison entries: '+rows.length):paired('暂无已分类条目','No classified entry'),rows.length?'source-linked':'missing',rows.flatMap(p=>[p.perspectiveRef,...list(p.signalRefs),...list(p.realityCorrelationRefs)]).filter(Boolean))}</div>`;}).join('')}</div>`)+textAlternative(perspectives.length?paired('分类只投影现有对照状态，不新增相互证明。','Categories project existing comparison states without adding mutual validation.'):paired('没有第二个明确可比较来源或现实关联；跨来源关系未知。','No second explicitly comparable source or reality link; the cross-source relation is unknown.'));
 }
 if(id==='PFIG-006'){
  grammar='work-evidence-matrix';
  const axes=list(data.interestEvidence?.axes),observed=list(data.observedExpression),codes=[['R','实际操作','Realistic'],['I','探索研究','Investigative'],['A','艺术表达','Artistic'],['S','人际帮助','Social'],['E','组织倡议','Enterprising'],['C','秩序细节','Conventional']];
  graphic=diagram(grammar,'工作阅读框架与证据层 / Work-reading frame and evidence layers',paired('六类是阅读提示；兴趣、任务表现及情境资料分别保留。','Six areas are reading prompts. Interests, task outcomes and context records remain distinct.'),`<div class="pe-work-matrix">${codes.map(([key,a,b])=>{const axis=axes.find(x=>x.code===key);return `<div data-work-lens="${key}">${node(key,paired(a,b),axis?`${paired('兴趣原值','Native interest value')}: ${esc(nativeValue(axis.score,'en'))}`:paired('兴趣输入缺失；概念提示','Interest input missing; conceptual prompt'),axis?'recorded':'conceptual')}</div>`;}).join('')}</div><div class="pe-work-layers">${node('task',paired('任务结果','Task outcomes'),paired('本图未提供任务结果；不据兴趣推断能力','No task outcomes supplied in this figure; interest does not infer ability'))}${node('context',paired('工作情境观察','Work-context observation'),observed.length?observed.map(x=>paired(itemLabel(x,'zh-Hans'),itemLabel(x,'en'))).join('<br>'):paired('实际工作表达尚待观察','Actual work expression awaits observation'),observed.length?'recorded':'missing')}</div>`)+textAlternative(paired('职业兴趣不是能力或就业适配结论；不推断职业成功。','Career interest is not an ability or job-fit verdict. Work success is not inferred.'));
 }
 if(id==='PFIG-007'){
  grammar='relationship-perspective-map';
  const rows=list(publicationRows),observations=list(data.observations),rel=list(data.relationshipEvidence?.evidence);
  const labels=[['self','自我视角','Self-view'],['other','对方视角','Other-person view'],['interaction','共同互动','Shared interaction'],['context','关系情境','Relationship context']];
  graphic=diagram(grammar,'四种关系证据视角 / Four relationship evidence perspectives',paired('这是来源视角地图，不是关系诊断；不推断缺席者的陈述。','This is a source-perspective map, not a relationship diagnosis. Statements by absent people are not inferred.'),`<div class="pe-relationship-perspectives">${labels.map(([key,a,b],i)=>{const r=rows[i],recorded=i===0&&Boolean(r?.sourceIds?.length||cards.length),linked=i===2&&observations.length>0;return node(key,paired(a,b),r?paired(r.stateZh,r.stateEn):i===0&&rel.length?paired('已有关系补充来源','Relationship companion source available'):paired(i===1?'对方观察尚未核实':i===2?'共同互动尚待观察':i===3?'情境尚未连接':'来源状态未提供',i===1?'Other-person observation not corroborated':i===2?'Shared interaction awaits observation':i===3?'Context not linked':'Source state not supplied'),recorded?'source-linked':linked?'recorded':'missing',r?.sourceIds||[]);}).join('')}</div><div class="pe-relationship-links">${edge('self','other')}${edge('self','interaction',observations.length>0)}${edge('interaction','context',observations.some(x=>x.contextType==='RELATIONSHIP'))}</div>`)+textAlternative(paired('不产生兼容度、对方隐藏状态或关系结果预测。','No compatibility score, hidden-partner inference or outcome prediction.'));
 }
 if(id==='PFIG-008'){
  grammar='conceptual-decision-sequence';
  const labels=[['notice','注意','Notice'],['understand','理解','Understand'],['weigh','权衡','Weigh'],['choose','选择','Choose'],['adapt','调整','Adapt']];
  graphic=diagram(grammar,'五阶段决策阅读框架 / Five-stage decision reading framework',paired('箭头仅表示概念顺序，不是已观察的个人决策历史。','Arrows indicate conceptual sequence only, not an observed personal decision history.'),`<div class="pe-decision-sequence">${labels.map(([key,a,b],i)=>{const r=publicationRows[i],refs=r?.sourceIds||[],linked=key!=='choose'&&refs.length>0;return (i?edge(labels[i-1][0],key,false,true):'')+node(key,paired(a,b),key==='choose'?paired('实际选择尚待观察','Actual choice awaits observation'):r?paired(r.stateZh,r.stateEn):paired('概念阅读提示；尚无具体记录','Conceptual reading prompt; no specific record'),linked?'source-linked':key==='choose'?'missing':'conceptual',refs);}).join('')}</div>`)+textAlternative(paired('来源关联的主题不证明该阶段已发生；它不是固定决策类型，也不构成财务建议。','A source-linked topic does not establish that a stage occurred. This is not a fixed decision type or financial advice.'));
 }
 if(id==='PFIG-009'){
  grammar='bounded-reality-prerequisites';
  const reality=data.contextEvidence?.currentReality,contradictions=list(data.contradictions),questions=list(data.questions),nodes=[['evidence','个人证据','Personal evidence',cards.length>0,paired('保留原来源与日期','Original source and date preserved')],['context','当前情境','Current context',Boolean(reality),reality?paired('已有现实对照条目：'+reality.total,'Recorded reality comparisons: '+reality.total):paired('尚未连接当前情境','No current context linked yet')],['difference','可能的差异','Potential difference',contradictions.length>0,contradictions.length?paired('已有差异记录：'+contradictions.length,'Recorded differences: '+contradictions.length):paired('没有明确差异记录；不推断一致','No explicit difference recorded; agreement not inferred')],['question','已有观察问题','Admitted observation question',questions.length>0,questions.length?paired(evidenceStatement(questions[0]?.text,'zh-Hans'),evidenceStatement(questions[0]?.text,'en')):paired('尚无已记录观察问题','No admitted observation question recorded')],['relation','解读关系','Interpreted relationship',false,paired('仅允许有证据边界的对照；不形成相互证明','Bounded comparison only; no mutual validation')]];
  graphic=diagram(grammar,'现实桥接的前提与缺失连接 / Reality bridge prerequisites and missing links',paired('节点记录与连线资格分开；没有资料时，桥接仍未知。','Node records and link qualification are separate. Without evidence, the bridge remains unknown.'),`<div class="pe-reality-prerequisites">${nodes.map(([key,a,b,active,detail],i)=>(i?edge(nodes[i-1][0],key,key==='context'&&Boolean(reality)&&cards.length>0):'')+node(key,paired(a,b),detail,active?'recorded':'missing')).join('')}</div>`)+textAlternative(paired('个人证据提供观察角度，当下现实提供当下情境；二者不会互相证明。','Personal evidence offers a lens; current reality supplies present context. Neither validates the other.'));
 }
 return `<figure class="pe-support-figure" data-pfig="${esc(id)}" data-pfig-state="${esc(figure.state)}" data-interpretation-ready="false" aria-label="${esc(figure.customerLabel?.en||id)}"><figcaption>${title} · ${states[figure.state]}</figcaption>${sourceNote(cards)}${graphic}</figure>`;
}

// Dossier composition reuses the same governed figure without the screen opener.
export function renderPersonalEvidenceFigure(figure,{locale='en',publicationRows=[],publicationSources=[]}={}){
  const renderers={'PFIG-001':dimensionMap,'PFIG-002':patternRadar,'PFIG-003':strengthCost,'PFIG-004':contextVariation,'PFIG-005':convergence,'PFIG-006':workMap,'PFIG-007':relationshipMap,'PFIG-008':decisionMap,'PFIG-009':realityBridge};
  const render=renderers[figure?.pfig];
  if(!render)throw new Error('PERSONAL_EVIDENCE_FIGURE_NOT_ADMITTED');
  if(locale==='bilingual'){
    if(!['READY','EMPTY','UNKNOWN'].includes(figure.state))throw new Error('PERSONAL_EVIDENCE_FIGURE_STATE_INVALID');
    return publicationStructure(figure,{publicationRows,publicationSources});
  }
  return render(figure,locale);
}

// Renderability is a presentation constraint; the canonical PFIG payload is untouched.
export function hasRenderablePersonalEvidenceFigure(fig){
 if(fig?.state!=='READY')return false;
 const d=fig.data||{};
 if(fig.pfig==='PFIG-004')return list(d.contexts).some(c=>list(d.observations).some(x=>x.contextType===c&&Boolean(x.label||x.title||x.statement||x.note)));
 return ({'PFIG-001':()=>list(d.lanes).some(x=>list(x.dimensions).length),'PFIG-002':()=>list(d.series).some(x=>list(x.points).length),'PFIG-003':()=>list(d.resources).length||list(d.costs).length,'PFIG-005':()=>list(d.perspectives).length,'PFIG-006':()=>list(d.interestEvidence?.axes).length||list(d.observedExpression).length,'PFIG-007':()=>list(d.observations).length||list(d.relationshipEvidence?.evidence).length,'PFIG-008':()=>list(d.decisionEvidence).length||list(d.currentPattern).length,'PFIG-009':()=>Boolean(d.contextEvidence?.currentReality)||list(d.contradictions).length||list(d.questions).length}[fig.pfig]?.())?true:false;
}
