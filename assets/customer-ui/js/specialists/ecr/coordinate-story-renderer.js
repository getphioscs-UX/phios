import {esc} from '../../surfaces/runtime-ui.js';

const SCHEMA='PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0';
const arr=value=>Array.isArray(value)?value:[];
const isZh=projection=>projection?.locale==='zh-Hans';
const local=(projection,en,zh)=>isZh(projection)?zh:en;
const by=(items,key,id)=>arr(items).find(item=>item?.[key]===id)||null;
const deg=value=>Number.isFinite(Number(value))?`${Number(value).toFixed(3)}°`:'—';

function label(projection,item){
  if(!item)return '';
  if(isZh(projection))return item.labelZhHans||item.questionZhHans||item.chineseNameZhHans||item.label||item.question||item.canonicalName||item.id||'';
  return item.label||item.question||item.canonicalName||item.labelZhHans||item.questionZhHans||item.chineseNameZhHans||item.id||'';
}

function idOf(item){
  return item?.contextId||item?.grammarId||item?.questionId||item?.capabilityId||item?.driverId||item?.motionId||item?.configurationId||item?.activationId||'';
}

function renderStyle(){
  return `<style>
    .cx-ecr-coordinate-story{display:grid;gap:1rem;margin:1.25rem 0 1.5rem}
    .cx-ecr-coordinate-story section{border:1px solid var(--cx-line,#d8d3c7);border-radius:18px;background:color-mix(in srgb,var(--cx-surface,#fff) 92%,var(--cx-ink,#111));padding:1rem 1.05rem}
    .cx-ecr-coordinate-story h3,.cx-ecr-coordinate-story h4{margin:.15rem 0 .55rem}
    .cx-ecr-coordinate-story p{margin:.35rem 0 .65rem}
    .cx-ecr-coordinate-story details{margin-top:.75rem}
    .cx-ecr-coordinate-story summary{cursor:pointer;font-weight:600}
    .cx-ecr-coordinate-story .cx-meta{margin-top:.65rem}
    .cx-ecr-coordinate-spine{display:grid;gap:.65rem;position:relative;margin-top:.9rem}
    .cx-ecr-coordinate-spine::before{content:'';position:absolute;left:1.05rem;top:.2rem;bottom:.2rem;width:2px;background:color-mix(in srgb,var(--cx-line,#d8d3c7) 75%,transparent)}
    .cx-ecr-coordinate-spine__item{position:relative;display:grid;gap:.15rem;padding:.15rem 0 .15rem 2rem}
    .cx-ecr-coordinate-spine__item::before{content:'';position:absolute;left:.65rem;top:.7rem;width:.82rem;height:.82rem;border-radius:999px;background:var(--cx-surface,#fff);border:2px solid var(--cx-accent,#9b6a16);box-sizing:border-box}
    .cx-ecr-coordinate-spine__item.is-primary::before{background:var(--cx-accent,#9b6a16)}
    .cx-ecr-coordinate-spine__eyebrow{font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:var(--cx-muted,#6b675f);font-weight:700}
    .cx-ecr-coordinate-spine__value{font-weight:700}
    .cx-ecr-pill-row{display:flex;flex-wrap:wrap;gap:.45rem;margin:.55rem 0 0}
    .cx-ecr-pill{display:inline-flex;align-items:center;gap:.35rem;padding:.36rem .62rem;border-radius:999px;border:1px solid var(--cx-line,#d8d3c7);background:var(--cx-surface,#fff);font-size:.92rem}
    .cx-ecr-pill.is-primary{border-color:var(--cx-accent,#9b6a16);background:color-mix(in srgb,var(--cx-accent,#9b6a16) 12%,var(--cx-surface,#fff));font-weight:700}
    .cx-ecr-diagram-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;margin-top:.9rem}
    .cx-ecr-pair-card,.cx-ecr-capability-card{border:1px solid var(--cx-line,#d8d3c7);border-radius:16px;padding:.85rem;background:var(--cx-surface,#fff)}
    .cx-ecr-pair-card.is-current,.cx-ecr-capability-card.is-current{border-color:var(--cx-accent,#9b6a16);box-shadow:0 0 0 1px color-mix(in srgb,var(--cx-accent,#9b6a16) 30%,transparent) inset;background:color-mix(in srgb,var(--cx-accent,#9b6a16) 8%,var(--cx-surface,#fff))}
    .cx-ecr-pair-card__arrow{display:block;margin:.3rem 0;color:var(--cx-muted,#6b675f);font-weight:700}
    .cx-ecr-capability-focus{display:grid;gap:.75rem;align-items:start}
    .cx-ecr-capability-focus__question{border:1px solid var(--cx-accent,#9b6a16);border-radius:18px;padding:1rem;background:color-mix(in srgb,var(--cx-accent,#9b6a16) 8%,var(--cx-surface,#fff))}
    .cx-ecr-capability-focus__question strong{display:block;font-size:1.02rem}
    .cx-ecr-capability-focus__network{display:grid;gap:.7rem}
    .cx-ecr-capability-path{display:grid;grid-template-columns:1fr auto;gap:.7rem;align-items:center;border:1px dashed var(--cx-line,#d8d3c7);border-radius:16px;padding:.75rem .85rem;background:var(--cx-surface,#fff)}
    .cx-ecr-capability-path__label{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--cx-muted,#6b675f);font-weight:700}
    .cx-ecr-capability-path__arrow{font-weight:700;color:var(--cx-accent,#9b6a16)}
    @media (max-width:720px){.cx-ecr-capability-path{grid-template-columns:1fr}.cx-ecr-coordinate-story section{padding:.95rem}.cx-ecr-coordinate-spine::before{left:.95rem}.cx-ecr-coordinate-spine__item{padding-left:1.85rem}}
  </style>`;
}

function renderSpineItem(title, value, copy, primary=false){
  return `<div class="cx-ecr-coordinate-spine__item${primary?' is-primary':''}"><span class="cx-ecr-coordinate-spine__eyebrow">${esc(title)}</span><div class="cx-ecr-coordinate-spine__value">${esc(value)}</div>${copy?`<small>${esc(copy)}</small>`:''}</div>`;
}

function renderSelectedCoordinateSpine(projection){
  const s=projection.selected||{};
  const context=by(projection.catalogs?.contexts,'contextId',s.contextId);
  const grammar=by(projection.catalogs?.grammars,'grammarId',s.grammarId);
  const question=by(projection.catalogs?.questions,'questionId',s.questionId);
  const primary=by(projection.catalogs?.capabilities,'capabilityId',s.primaryCapabilityId);
  const supporting=arr(s.supportingCapabilityIds).map(id=>by(projection.catalogs?.capabilities,'capabilityId',id)).filter(Boolean);
  const topDrivers=arr(s.driverPriority).slice(0,3);
  const motion=by(projection.catalogs?.motions,'motionId',s.motionId);
  const configuration=by(projection.catalogs?.configurations,'configurationId',s.configurationId);
  const activation=by(projection.catalogs?.activations,'activationId',s.activationId);
  const title=local(projection,'Why these coordinates appear together','为什么这些坐标会一起出现');
  const intro=local(projection,'Read this as one governed coordinate path, not as a set of unrelated labels. The spine shows how the selected background, grammar, question, capability, driver, motion, configuration and activation stage belong to the same PHI Configuration.','这不是一组彼此无关的标签，而是一条受治理的坐标主线。下面这条 spine 会把背景、语法、问题、能力、驱动、运动、构型与激活阶段连成同一个 PHI 构型。');
  const driverText=topDrivers.map(item=>`${item.driverId} · ${label(projection,item)}${item.rank?` · ${local(projection,`rank ${item.rank}`,`第 ${item.rank} 位`)}`:''}`).join(' / ');
  return `<section class="cx-ecr-coordinate-story__section cx-ecr-selected-coordinate" data-ecr-selected-coordinate-spine><p class="cx-eyebrow">${esc(local(projection,'SELECTED COORDINATE SPINE','Selected Coordinate Spine'))}</p><h3>${esc(title)}</h3><p>${esc(intro)}</p><div class="cx-ecr-coordinate-spine">${renderSpineItem(local(projection,'Long-range context','长期方向背景'),`${idOf(context)} · ${label(projection,context)}`,local(projection,`Solar anchor ${deg(projection.anchor?.longitude)} falls inside this context interval.`,`太阳锚点 ${deg(projection.anchor?.longitude)} 落在这个背景区间内。`),idOf(context)===s.contextId)}${renderSpineItem(local(projection,'Reality Grammar','现实语法'),`${idOf(grammar)} · ${label(projection,grammar)}`,local(projection,'The selected grammar determines which baseline question is paired by ordinal.','这个语法位置会按序号配对出对应的基础问题。'))}${renderSpineItem(local(projection,'Baseline question','基础问题'),`${idOf(question)} · ${label(projection,question)}`,local(projection,'This is the question that becomes structurally important when that grammar appears.','当这个语法模式出现时，这个问题会在结构上变得重要。'))}${renderSpineItem(local(projection,'Response capability','回应能力'),`${idOf(primary)} · ${label(projection,primary)}`,supporting.length?local(projection,`Supporting: ${supporting.map(item=>`${item.capabilityId} · ${label(projection,item)}`).join(' / ')}`,`辅助能力：${supporting.map(item=>`${item.capabilityId} · ${label(projection,item)}`).join(' / ')}`):local(projection,'No supporting capability listed.','没有列出辅助能力。'),true)}${renderSpineItem(local(projection,'Baseline driver stack','出生基线驱动'),driverText,local(projection,'Affinity ordering only. Birth-baseline driver proximity is not a claim about current Reality priority.','这里只表示出生基线亲和度排序，不代表当前现实中的实际优先级。'))}${renderSpineItem(local(projection,'Change motion','变化运动'),`${idOf(motion)} · ${label(projection,motion)}`,local(projection,'PHI OS reuses the trigram identity for an organization-change motion without importing I Ching fortune meaning.','PHI OS 只复用卦象身份来表示变化运动，不导入易经吉凶意义。'))}${renderSpineItem(local(projection,'Environment-response configuration','环境—回应构型'),`${idOf(configuration)} · ${label(projection,configuration)}`,local(projection,`Environment priority ${configuration?.environmentPriorityMotionId||'—'}; embodied response ${configuration?.embodiedResponseMotionId||'—'}.`,`环境优先运动 ${configuration?.environmentPriorityMotionId||'—'}；载体回应运动 ${configuration?.embodiedResponseMotionId||'—'}。`))}${renderSpineItem(local(projection,'Activation stage','激活阶段'),`${idOf(activation)} · ${label(projection,activation)}`,local(projection,'A runtime stage, not a good/bad verdict or guaranteed event.','这是一个运行阶段，不是吉凶判断，也不是必然事件。'))}</div><p class="cx-meta">${esc(local(projection,'Calculation determines the coordinate. Meaning authority determines how it may be read. This spine creates neither.','计算决定坐标；meaning authority 决定可如何阅读。这个 spine 不创造两者。'))}</p></section>`;
}

function renderGrammarQuestionPair(projection,pair,current=false){
  const grammar=by(projection.catalogs?.grammars,'grammarId',pair.grammarId);
  const question=by(projection.catalogs?.questions,'questionId',pair.questionId);
  return `<article class="cx-ecr-pair-card${current?' is-current':''}" data-grammar-id="${esc(pair.grammarId)}" data-question-id="${esc(pair.questionId)}"><span class="cx-eyebrow">${esc(current?local(projection,'CURRENT PAIR','当前配对'):local(projection,'PAIR','配对'))}</span><h4>${esc(`${pair.grammarId} · ${label(projection,grammar)}`)}</h4><span class="cx-ecr-pair-card__arrow">↓</span><p><strong>${esc(`${pair.questionId}`)}</strong> · ${esc(label(projection,question))}</p></article>`;
}

function renderGrammarQuestionDiagram(projection){
  const pairs=arr(projection.relations?.grammarQuestion);
  const currentPair=pairs.find(item=>item.grammarId===projection.selected?.grammarId&&item.questionId===projection.selected?.questionId) || null;
  const title=local(projection,'Reality Grammar → Baseline Question','现实语法 → 基础问题');
  const intro=local(projection,'Each of the sixteen Reality Grammar positions is paired to one baseline question by ordinal. The currently selected pair is shown first; expand the full diagram to see the entire governed relationship set.','16 个现实语法位置会按序号各自配对一个基础问题。当前命中的配对会先显示；展开后可查看完整关系图。');
  return `<section class="cx-ecr-coordinate-story__section" data-ecr-grammar-question-diagram><p class="cx-eyebrow">${esc(local(projection,'W7 · LIVING RELATIONSHIP DIAGRAM','W7 · Living Relationship Diagram'))}</p><h3>${esc(title)}</h3><p>${esc(intro)}</p>${currentPair?`<div class="cx-ecr-diagram-grid">${renderGrammarQuestionPair(projection,currentPair,true)}</div>`:''}<details><summary>${esc(local(projection,'View all 16 grammar-question positions','查看全部 16 个运行位置'))}</summary><div class="cx-ecr-diagram-grid">${pairs.map(pair=>renderGrammarQuestionPair(projection,pair,pair.grammarId===projection.selected?.grammarId)).join('')}</div></details></section>`;
}

function renderCapabilityRow(projection, relation, current=false){
  const question=by(projection.catalogs?.questions,'questionId',relation.questionId);
  const primary=by(projection.catalogs?.capabilities,'capabilityId',relation.primaryCapabilityId);
  const supporting=arr(relation.supportingCapabilityIds).map(id=>by(projection.catalogs?.capabilities,'capabilityId',id)).filter(Boolean);
  return `<article class="cx-ecr-capability-card${current?' is-current':''}" data-question-id="${esc(relation.questionId)}"><span class="cx-eyebrow">${esc(current?local(projection,'CURRENT QUESTION','当前问题'):local(projection,'QUESTION','问题'))}</span><h4>${esc(`${relation.questionId} · ${label(projection,question)}`)}</h4><div class="cx-ecr-pill-row"><span class="cx-ecr-pill is-primary">${esc(local(projection,'Primary','主要'))} · ${esc(`${relation.primaryCapabilityId} · ${label(projection,primary)}`)}</span>${supporting.map(item=>`<span class="cx-ecr-pill">${esc(local(projection,'Supporting','辅助'))} · ${esc(`${item.capabilityId} · ${label(projection,item)}`)}</span>`).join('')}</div></article>`;
}

function renderCapabilityNetwork(projection){
  const relations=arr(projection.relations?.questionCapability);
  const current=relations.find(item=>item.questionId===projection.selected?.questionId) || null;
  const question=by(projection.catalogs?.questions,'questionId',projection.selected?.questionId);
  const primary=by(projection.catalogs?.capabilities,'capabilityId',projection.selected?.primaryCapabilityId);
  const supporting=arr(projection.selected?.supportingCapabilityIds).map(id=>by(projection.catalogs?.capabilities,'capabilityId',id)).filter(Boolean);
  const intro=local(projection,'The mandala already marks the current question-to-capability relation. This section makes the relationship legible as a governed network: the selected baseline question sits at the center, then points to its primary and supporting response capabilities.','Mandala 里已经标出了当前的问题—能力关系；这里把它单独展开成可阅读的受治理网络：当前基础问题位于中心，并连接到它的主要与辅助回应能力。');
  return `<section class="cx-ecr-coordinate-story__section" data-ecr-capability-network><p class="cx-eyebrow">${esc(local(projection,'W8 · QUESTION → CAPABILITY NETWORK','W8 · 问题 → 能力网络'))}</p><h3>${esc(local(projection,'How the current question maps to response capabilities','当前问题如何映射到回应能力'))}</h3><p>${esc(intro)}</p><div class="cx-ecr-capability-focus"><div class="cx-ecr-capability-focus__question"><span class="cx-eyebrow">${esc(local(projection,'CENTER QUESTION','中心问题'))}</span><strong>${esc(`${projection.selected?.questionId||''} · ${label(projection,question)}`)}</strong><p>${esc(local(projection,'This is the structurally paired question for the selected grammar position.','这是当前现实语法位置在结构上配对出的基础问题。'))}</p></div><div class="cx-ecr-capability-focus__network"><div class="cx-ecr-capability-path"><div><div class="cx-ecr-capability-path__label">${esc(local(projection,'Primary capability','主要能力'))}</div><strong>${esc(`${projection.selected?.primaryCapabilityId||''} · ${label(projection,primary)}`)}</strong></div><div class="cx-ecr-capability-path__arrow">${esc(local(projection,'Q → R','Q → R'))}</div></div>${supporting.map(item=>`<div class="cx-ecr-capability-path"><div><div class="cx-ecr-capability-path__label">${esc(local(projection,'Supporting capability','辅助能力'))}</div><strong>${esc(`${item.capabilityId} · ${label(projection,item)}`)}</strong></div><div class="cx-ecr-capability-path__arrow">${esc(local(projection,'Q ⇢ R','Q ⇢ R'))}</div></div>`).join('')}</div></div><details><summary>${esc(local(projection,'Explore the full question-capability map','查看完整问题—能力图'))}</summary><div class="cx-ecr-diagram-grid">${relations.map(relation=>renderCapabilityRow(projection,relation,relation.questionId===projection.selected?.questionId)).join('')}</div></details>${current?`<p class="cx-meta">${esc(local(projection,`Current governed mapping: ${current.questionId} → ${current.primaryCapabilityId}${arr(current.supportingCapabilityIds).length?` + ${arr(current.supportingCapabilityIds).join(', ')}`:''}.`,`当前受治理映射：${current.questionId} → ${current.primaryCapabilityId}${arr(current.supportingCapabilityIds).length?` + ${arr(current.supportingCapabilityIds).join('、')}`:''}。`))}</p>`:''}</section>`;
}

export function renderCoordinateStoryVisual(visual){
  const projection=visual?.payload;
  if(projection?.schemaVersion!==SCHEMA)return '';
  return `${renderStyle()}<div class="cx-ecr-coordinate-story" data-ecr-coordinate-story>${renderSelectedCoordinateSpine(projection)}${renderGrammarQuestionDiagram(projection)}${renderCapabilityNetwork(projection)}</div>`;
}

export default Object.freeze({renderCoordinateStoryVisual});
