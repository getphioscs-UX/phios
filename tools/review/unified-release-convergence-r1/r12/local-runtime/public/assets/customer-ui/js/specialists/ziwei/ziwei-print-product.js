import {esc} from '../../surfaces/runtime-ui.js';

export const ZIWEI_CX_R1_PRINT_CONTRACT='PHI-OS-ZIWEI-CX-R1-PRINT-PRODUCT-v1.0.0';
const arr=v=>Array.isArray(v)?v:[];
const tx=(l,en,zh)=>l==='zh-Hans'?zh:en;

export function buildZiweiPrintCoverHtml(product,presentation){
  const p=presentation||{};
  const l=p.locale||product?.locale||'en';
  const hero=p.hero||{};
  const facts=arr(hero.anchors).slice(0,4);
  const patterns=arr(hero.patterns);
  const reportTitle=hero.title||tx(l,'Zi Wei professional reading','紫微斗数专业读取');
  const summary=hero.subtitle||product?.hero?.summary||'';
  return `<header class="cx-ziwei-print-cover cx-ziwei-print-only" data-ziwei-print-cover="true" data-ziwei-print-contract="${ZIWEI_CX_R1_PRINT_CONTRACT}" aria-hidden="true"><div><p class="cx-eyebrow">${esc(tx(l,'PHI OS · ZI WEI DOU SHU','PHI OS · 紫微斗数'))}</p><h1>${esc(reportTitle)}</h1>${summary?`<p class="cx-ziwei-print-cover__summary">${esc(summary)}</p>`:''}<dl>${facts.map(x=>`<div><dt>${esc(x.label||'')}</dt><dd>${esc(x.value||'—')}</dd></div>`).join('')}<div><dt>${esc(tx(l,'Admitted patterns','已准入格局'))}</dt><dd>${esc(patterns.length?patterns.join(l==='zh-Hans'?'、':', '):tx(l,'No admitted pattern matched','当前没有已准入格局命中'))}</dd></div></dl></div><footer>${esc(tx(l,'Professional Zi Wei print view · twelve-palace reading, topics, timing, evidence and technical lineage follow','专业紫微打印版 · 后续包含十二宫、主题读取、大限流年、证据与技术来源链'))}</footer></header>`;
}

export default Object.freeze({ZIWEI_CX_R1_PRINT_CONTRACT,buildZiweiPrintCoverHtml});
