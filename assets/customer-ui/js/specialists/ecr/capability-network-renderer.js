import {esc} from '../../surfaces/runtime-ui.js';
import {list,local,by,authorityLabel,customerLayerLabel} from './customer-language.js';

const SCHEMA='PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0';

function renderCapabilityRow(projection, relation, current=false){
  const question=by(projection.catalogs?.questions,'questionId',relation.questionId);
  const primary=by(projection.catalogs?.capabilities,'capabilityId',relation.primaryCapabilityId);
  const supporting=list(relation.supportingCapabilityIds).map(id=>by(projection.catalogs?.capabilities,'capabilityId',id)).filter(Boolean);
  const q=customerLayerLabel(projection,'Q16',question),p=customerLayerLabel(projection,'R9',primary,{role:'PRIMARY'});
  return `<article class="cx-ecr-capability-card${current?' is-current':''}" data-question-id="${esc(relation.questionId)}"><span class="cx-eyebrow">${esc(current?local(projection,'CURRENT QUESTION','当前问题'):local(projection,'QUESTION','问题'))}</span><h4>${esc(q.primary)}</h4><small>${esc(q.secondary)}</small><div class="cx-ecr-pill-row"><span class="cx-ecr-pill is-primary">${esc(p.primary)}<small>${esc(p.secondary)}</small></span>${supporting.map(item=>{const x=customerLayerLabel(projection,'R9',item,{role:'SUPPORTING'});return `<span class="cx-ecr-pill">${esc(x.primary)}<small>${esc(x.secondary)}</small></span>`;}).join('')}</div></article>`;
}

export function renderCapabilityNetworkVisual(visual){
  const projection=visual?.payload;
  if(projection?.schemaVersion!==SCHEMA)return '';
  const relations=list(projection.relations?.questionCapability),current=relations.find(item=>item.questionId===projection.selected?.questionId)||null;
  const question=by(projection.catalogs?.questions,'questionId',projection.selected?.questionId),primary=by(projection.catalogs?.capabilities,'capabilityId',projection.selected?.primaryCapabilityId),supporting=list(projection.selected?.supportingCapabilityIds).map(id=>by(projection.catalogs?.capabilities,'capabilityId',id)).filter(Boolean);
  const q=customerLayerLabel(projection,'Q16',question),p=customerLayerLabel(projection,'R9',primary,{role:'PRIMARY'});
  const intro=local(projection,'The selected baseline question is linked to a primary response capability and, where the governed matrix specifies it, supporting capabilities. This relationship comes from the versioned ECR question-capability matrix, not from the browser renderer.','当前基础问题会连接到一个主要回应能力，并在受治理矩阵规定时连接辅助能力。这组关系来自版本化 ECR 问题—能力矩阵，不由浏览器 renderer 自行决定。');
  return `<section id="ecr-section-03-capability" class="cx-ecr-coordinate-story__section cx-ecr-capability-network" data-ecr-capability-network><p class="cx-eyebrow">${esc(local(projection,'QUESTION → CAPABILITY','问题 → 能力'))}</p><h3>${esc(local(projection,'How this question maps to response capability','这个问题如何映射到回应能力'))}</h3><p>${esc(intro)}</p><div class="cx-ecr-capability-focus"><div class="cx-ecr-capability-focus__question"><span class="cx-eyebrow">${esc(local(projection,'CENTER QUESTION','中心问题'))}</span><strong>${esc(q.primary)}</strong><small>${esc(q.secondary)}</small><p>${esc(local(projection,'This is the baseline question paired to the selected Reality Grammar position.','这是当前现实语法位置所配对的基础问题。'))}</p></div><div class="cx-ecr-capability-focus__network"><div class="cx-ecr-capability-path is-primary"><div><div class="cx-ecr-capability-path__label">${esc(local(projection,'Primary capability','主要能力'))}</div><strong>${esc(p.primary)}</strong><small>${esc(p.secondary)}</small></div><div class="cx-ecr-capability-path__arrow">Q → R</div></div>${supporting.map(item=>{const x=customerLayerLabel(projection,'R9',item,{role:'SUPPORTING'});return `<div class="cx-ecr-capability-path"><div><div class="cx-ecr-capability-path__label">${esc(local(projection,'Supporting capability','辅助能力'))}</div><strong>${esc(x.primary)}</strong><small>${esc(x.secondary)}</small></div><div class="cx-ecr-capability-path__arrow">Q ⇢ R</div></div>`;}).join('')}</div></div><details><summary>${esc(local(projection,'Explore the full question-capability map','查看完整问题—能力图'))}</summary><div class="cx-ecr-diagram-grid">${relations.map(relation=>renderCapabilityRow(projection,relation,relation.questionId===projection.selected?.questionId)).join('')}</div></details>${current?`<p class="cx-meta">${esc(local(projection,`Governed mapping: ${current.questionId} → ${current.primaryCapabilityId}${list(current.supportingCapabilityIds).length?` + ${list(current.supportingCapabilityIds).join(', ')}`:''}.`,`受治理映射：${current.questionId} → ${current.primaryCapabilityId}${list(current.supportingCapabilityIds).length?` + ${list(current.supportingCapabilityIds).join('、')}`:''}。`))}</p>`:''}</section>`;
}

export default Object.freeze({renderCapabilityNetworkVisual});
