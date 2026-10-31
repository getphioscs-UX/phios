import {esc} from '../../surfaces/runtime-ui.js';
import {list,local,by,authorityLabel,customerLayerLabel,selectedCatalog} from './customer-language.js';
import {renderCapabilityNetworkVisual} from './capability-network-renderer.js';

const SCHEMA='PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0';
const deg=value=>Number.isFinite(Number(value))?`${Number(value).toFixed(3)}°`:'—';


function renderSpineItem(title,presentation,copy,primary=false){
  return `<div class="cx-ecr-coordinate-spine__item${primary?' is-primary':''}"><span class="cx-ecr-coordinate-spine__eyebrow">${esc(title)}</span><div class="cx-ecr-coordinate-spine__value">${esc(presentation.primary)}</div><small>${esc(presentation.secondary)}</small>${copy?`<small>${esc(copy)}</small>`:''}</div>`;
}

function renderSelectedCoordinateSpine(projection){
  const selected=selectedCatalog(projection),s=projection.selected||{},drivers=list(s.driverPriority).slice(0,3);
  const context=customerLayerLabel(projection,'CC12',selected.context),grammar=customerLayerLabel(projection,'G16',selected.grammar),question=customerLayerLabel(projection,'Q16',selected.question),primary=customerLayerLabel(projection,'R9',selected.primaryCapability,{role:'PRIMARY'}),motion=customerLayerLabel(projection,'M8',selected.motion),configuration=customerLayerLabel(projection,'H64',selected.configuration),activation=customerLayerLabel(projection,'A8',selected.activation);
  const driverPresentation={primary:drivers.map(item=>`${authorityLabel(projection,item)}${item.rank?` · ${local(projection,`rank ${item.rank}`,`第 ${item.rank} 位`)}`:''}`).join(' / '),secondary:drivers.map(item=>item.driverId).join(' · ')};
  return `<section class="cx-ecr-coordinate-story__section cx-ecr-selected-coordinate" data-ecr-selected-coordinate-spine tabindex="-1"><p class="cx-eyebrow">${esc(local(projection,'SELECTED COORDINATE SPINE','构型坐标主线'))}</p><h3>${esc(local(projection,'Why these coordinates appear together','为什么这些坐标会一起出现'))}</h3><p>${esc(local(projection,'Read this as one governed coordinate path, not a set of unrelated internal codes. Each customer label comes first; the technical index remains secondary for traceability.','这不是一组彼此无关的内部代码，而是一条受治理的坐标主线。客户可读名称放在前面，技术索引仅作为次级追溯信息保留。'))}</p><div class="cx-ecr-coordinate-spine">${renderSpineItem(local(projection,'Long-range context','长期方向背景'),context,local(projection,`Solar anchor ${deg(projection.anchor?.longitude)} falls inside this interval.`,`太阳锚点 ${deg(projection.anchor?.longitude)} 落在这个区间内。`),true)}${renderSpineItem(local(projection,'Reality Grammar','现实语法'),grammar,local(projection,'This grammar position pairs to a baseline question by ordinal.','这个语法位置会按序号配对一个基础问题。'))}${renderSpineItem(local(projection,'Baseline question','基础问题'),question,local(projection,'The question becomes structurally relevant when the paired grammar appears.','当对应语法模式出现时，这个问题会在结构上变得重要。'))}${renderSpineItem(local(projection,'Response capability','回应能力'),primary,selected.supportingCapabilities.length?local(projection,`Supporting: ${selected.supportingCapabilities.map(item=>customerLayerLabel(projection,'R9',item,{role:'SUPPORTING'}).primary).join(' / ')}`,`辅助：${selected.supportingCapabilities.map(item=>customerLayerLabel(projection,'R9',item,{role:'SUPPORTING'}).primary).join(' / ')}`):'')}${renderSpineItem(local(projection,'Baseline driver stack','出生基线驱动'),driverPresentation,local(projection,'Affinity ordering only; not current Reality priority.','这里只表示亲和度排序，不代表当前现实优先级。'))}${renderSpineItem(local(projection,'Change motion','变化运动'),motion,local(projection,'Trigram identity is reused without importing I Ching fortune meaning.','只复用卦象身份，不导入易经吉凶意义。'))}${renderSpineItem(local(projection,'Environment-response configuration','环境—回应构型'),configuration,local(projection,`Environment ${selected.configuration?.environmentPriorityMotionId||'—'} · Response ${selected.configuration?.embodiedResponseMotionId||'—'}.`,`环境 ${selected.configuration?.environmentPriorityMotionId||'—'} · 回应 ${selected.configuration?.embodiedResponseMotionId||'—'}。`))}${renderSpineItem(local(projection,'Activation stage','激活阶段'),activation,local(projection,'A runtime stage, not a good/bad verdict or guaranteed event.','这是运行阶段，不是吉凶判断，也不是必然事件。'))}</div><p class="cx-meta">${esc(local(projection,'Calculation determines the coordinate; meaning authority determines how it may be read. The renderer creates neither.','计算决定坐标；meaning authority 决定这些坐标可以怎样解释。Renderer 两者都不创造。'))}</p></section>`;
}

function renderGrammarQuestionPair(projection,pair,current=false){
  const grammar=by(projection.catalogs?.grammars,'grammarId',pair.grammarId),question=by(projection.catalogs?.questions,'questionId',pair.questionId),g=customerLayerLabel(projection,'G16',grammar),q=customerLayerLabel(projection,'Q16',question);
  return `<article class="cx-ecr-pair-card${current?' is-current':''}" data-grammar-id="${esc(pair.grammarId)}" data-question-id="${esc(pair.questionId)}"><span class="cx-eyebrow">${esc(current?local(projection,'CURRENT PAIR','当前配对'):local(projection,'PAIR','配对'))}</span><h4>${esc(g.primary)}</h4><small>${esc(g.secondary)}</small><span class="cx-ecr-pair-card__arrow">↓</span><p><strong>${esc(q.primary)}</strong><br><small>${esc(q.secondary)}</small></p></article>`;
}

function renderGrammarQuestionDiagram(projection){
  const pairs=list(projection.relations?.grammarQuestion),currentPair=pairs.find(item=>item.grammarId===projection.selected?.grammarId&&item.questionId===projection.selected?.questionId)||null;
  return `<section class="cx-ecr-coordinate-story__section" data-ecr-grammar-question-diagram tabindex="-1"><p class="cx-eyebrow">${esc(local(projection,'REALITY GRAMMAR → BASELINE QUESTION','现实语法 → 基础问题'))}</p><h3>${esc(local(projection,'Sixteen governed grammar-question positions','16 组受治理的语法—问题配对'))}</h3><p>${esc(local(projection,'Each Reality Grammar position is paired to one baseline question by ordinal. The current pair is shown first; the complete diagram remains available without making the customer memorize internal codes.','每个现实语法位置按序号配对一个基础问题。当前命中的配对先显示；完整关系图仍可展开查看，但客户不需要先记住内部代码。'))}</p>${currentPair?`<div class="cx-ecr-diagram-grid">${renderGrammarQuestionPair(projection,currentPair,true)}</div>`:''}<details><summary>${esc(local(projection,'View all 16 grammar-question positions','查看全部 16 个运行位置'))}</summary><div class="cx-ecr-diagram-grid">${pairs.map(pair=>renderGrammarQuestionPair(projection,pair,pair.grammarId===projection.selected?.grammarId)).join('')}</div></details></section>`;
}

export function renderCoordinateStoryVisual(visual){
  const projection=visual?.payload;if(projection?.schemaVersion!==SCHEMA)return '';
  return `<div id="ecr-section-03" class="cx-ecr-coordinate-story" data-ecr-coordinate-story tabindex="-1">${renderSelectedCoordinateSpine(projection)}${renderGrammarQuestionDiagram(projection)}${renderCapabilityNetworkVisual(visual)}</div>`;
}

export default Object.freeze({renderCoordinateStoryVisual});
