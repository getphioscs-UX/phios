import {esc} from '../../surfaces/runtime-ui.js';
import {list,local,customerLayerLabel} from './customer-language.js';
const SCHEMA='PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0';
export function renderActivationTimelineVisual(visual){
  const p=visual?.payload;if(p?.schemaVersion!==SCHEMA)return '';
  const xs=list(p.catalogs?.activations);
  return `<section id="ecr-section-06" class="cx-ecr-activation" data-ecr-activation-timeline tabindex="-1"><p class="cx-eyebrow">${esc(local(p,'A1–A8 · RUNTIME PHASE ARC','A1–A8 · 运行阶段弧'))}</p><h3>${esc(local(p,'Where the baseline sits in the activation cycle','这组基线目前位于哪个激活阶段'))}</h3><div class="cx-ecr-activation__arc" role="list" aria-label="${esc(local(p,'Eight activation stages','八个激活阶段'))}">${xs.map(x=>{const y=customerLayerLabel(p,'A8',x),sel=x.activationId===p.selected?.activationId;return `<div class="cx-ecr-activation__stage${sel?' is-current':''}" role="listitem"${sel?' aria-current="step"':''}><strong>${esc(y.primary)}</strong><small>${esc(y.secondary)}</small>${sel?`<p>${esc(local(p,'Current calculated stage','当前计算阶段'))}</p>`:''}</div>`}).join('')}</div><div class="cx-ecr-activation__boundary" aria-label="${esc(local(p,'Interpretive boundaries','解释边界'))}"><span>${esc(local(p,'Stage ≠ good/bad','阶段 ≠ 吉凶'))}</span><span>${esc(local(p,'Stage ≠ success probability','阶段 ≠ 成功概率'))}</span><span>${esc(local(p,'Stage ≠ guaranteed event','阶段 ≠ 必然事件'))}</span></div></section>`;
}
export default Object.freeze({renderActivationTimelineVisual});
