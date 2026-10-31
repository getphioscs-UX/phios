import {mountPhiMandalaCrossEvidenceRail} from './mandala-renderer.js';
import {esc} from '../../surfaces/runtime-ui.js';

export const ECR_HD_CUSTOMER_COMPARISON_RENDERER_VERSION='PHI-OS-ECR-R3-ECR-HD-CUSTOMER-COMPARISON-RENDERER-v1.0.0';
const COMPARISON_SCHEMA='PHI-OS-ECR-R3-ECR-HD-COMPARISON-IR-v1.0.0';
const arr=value=>Array.isArray(value)?value:[];
const local=(comparison,en,zh)=>comparison?.locale==='zh-Hans'?zh:en;
const token=value=>String(value||'item').trim().replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'item';

function readableValue(value){
  if(value==null||value==='')return '';
  if(Array.isArray(value))return value.map(readableValue).filter(Boolean).join(' · ');
  if(typeof value==='object')return Object.values(value).map(readableValue).filter(Boolean).join(' · ');
  return String(value);
}
function relationLabel(comparison,relationClass){
  const labels={
    SHARED_OBSERVATION_DOMAIN:["Shared observation domain","共同观察领域"],
    COMPLEMENTARY_LENSES:["Complementary lenses","互补视角"],
    NO_DIRECT_EQUIVALENCE:["No direct equivalent","没有直接对应"]
  };
  const pair=labels[relationClass]||[relationClass,relationClass];
  return local(comparison,pair[0],pair[1]);
}
function statusLabel(comparison,status){
  const labels={
    READY:["Both perspectives available","两个视角都有资料"],
    ECR_ONLY:["ECR available · Human Design not confirmed here","ECR 有资料 · Human Design 此处未确认"],
    HUMAN_DESIGN_ONLY:["Human Design available · ECR not represented here","Human Design 有资料 · ECR 此处未呈现"],
    NO_SOURCE_MATERIAL:["No source material for this dimension","这个维度没有可呈现资料"]
  };
  const pair=labels[status]||[status,status];
  return local(comparison,pair[0],pair[1]);
}
function isRenderable(comparison){
  return Boolean(
    comparison?.schemaVersion===COMPARISON_SCHEMA&&
    comparison?.publicationState==='COMPARISON_IR_READY'&&
    comparison?.boundaries?.rendererCreatesMeaning===false&&
    comparison?.boundaries?.ecrRemainsPhiOsNative===true&&
    comparison?.boundaries?.humanDesignRemainsCustomerSuppliedExternalContext===true&&
    comparison?.boundaries?.directFieldEquivalenceCreated===false&&
    comparison?.boundaries?.methodAgreementClaimed===false&&
    comparison?.boundaries?.compatibilityScoreCreated===false
  );
}
function renderEcrUnits(comparison,dimension){
  const units=arr(dimension?.ecr?.units);
  if(!units.length)return `<div class="cx-ecr-hd-comparison__empty">${esc(local(comparison,'No ECR interpretation unit is represented in this comparison dimension. Nothing is inferred.','这个比较维度没有可呈现的 ECR interpretation unit；系统不会补推。'))}</div>`;
  return `<ul class="cx-ecr-hd-comparison__source-list">${units.map(unit=>`<li data-ecr-interpretation-unit="${esc(unit.interpretationUnitId||'')}"><strong>${esc(unit.title||local(comparison,'ECR interpretation','ECR 解读'))}</strong>${unit.plainLanguageExplanation?`<p>${esc(unit.plainLanguageExplanation)}</p>`:unit.summary?`<p>${esc(unit.summary)}</p>`:''}</li>`).join('')}</ul>`;
}
function renderHdClaims(comparison,dimension){
  const claims=arr(dimension?.humanDesign?.claims);
  if(!claims.length)return `<div class="cx-ecr-hd-comparison__empty">${esc(local(comparison,'No matching Human Design field is present in the chart information you confirmed. PHI OS does not fill in or calculate a missing field here.','你已确认的人类图资料中没有这个比较维度需要的对应字段；PHI OS 不会在这里补填或重新计算缺失字段。'))}</div>`;
  return `<ul class="cx-ecr-hd-comparison__source-list">${claims.map(claim=>{const value=readableValue(claim.value);return `<li data-hd-claim-code="${esc(claim.claimCode||'')}"><strong>${esc(claim.label||claim.claimCode||local(comparison,'Confirmed Human Design field','已确认 Human Design 字段'))}${value?`: ${esc(value)}`:''}</strong>${claim.explanation?`<p>${esc(claim.explanation)}</p>`:''}<small>${esc(local(comparison,'Confirmed external chart · not calculated by PHI OS','已确认外部图表 · 非 PHI OS 计算'))}</small></li>`}).join('')}</ul>`;
}
function renderDimension(comparison,dimension,index){
  if(!dimension||dimension.status==='NO_SOURCE_MATERIAL')return '';
  const id=`ecr-hd-dimension-${token(dimension.dimensionId||index+1)}`;
  return `<article id="${esc(id)}" class="cx-ecr-hd-comparison__dimension" data-relation-class="${esc(dimension.relationClass||'')}" data-comparison-status="${esc(dimension.status||'')}">
    <header><div class="cx-ecr-hd-comparison__badges"><span>${esc(relationLabel(comparison,dimension.relationClass))}</span><small>${esc(statusLabel(comparison,dimension.status))}</small></div><h4>${esc(dimension.label||dimension.dimensionId||'')}</h4>${dimension.comparisonStatement?`<p>${esc(dimension.comparisonStatement)}</p>`:''}</header>
    <div class="cx-ecr-hd-comparison__columns">
      <section aria-label="${esc(local(comparison,'PHI OS ECR','PHI OS ECR'))}"><p class="cx-eyebrow">PHI OS · ECR</p><h5>${esc(local(comparison,'Native ECR reading','原生 ECR 解读'))}</h5>${renderEcrUnits(comparison,dimension)}</section>
      <section aria-label="${esc(local(comparison,'Confirmed Human Design','已确认 Human Design'))}"><p class="cx-eyebrow">HUMAN DESIGN</p><h5>${esc(local(comparison,'Your confirmed external chart','你已确认的外部图表'))}</h5>${renderHdClaims(comparison,dimension)}</section>
    </div>
    ${dimension.observationQuestion?`<aside class="cx-ecr-hd-comparison__question"><span>${esc(local(comparison,'QUESTION TO OBSERVE','可继续观察的问题'))}</span><p>${esc(dimension.observationQuestion)}</p></aside>`:''}
  </article>`;
}
function summaryText(comparison){
  const summary=comparison?.summary||{};
  const shared=arr(summary.sharedObservationDomainIds).length;
  const complementary=arr(summary.complementaryLensIds).length;
  const nonEquivalent=arr(summary.noDirectEquivalenceIds).length;
  return local(
    comparison,
    `${shared} shared observation domain${shared===1?'':'s'} · ${complementary} complementary lens${complementary===1?'':'es'} · ${nonEquivalent} explicitly non-equivalent dimension${nonEquivalent===1?'':'s'}`,
    `${shared} 个共同观察领域 · ${complementary} 个互补视角 · ${nonEquivalent} 个明确不等价维度`
  );
}

export function renderEcrHumanDesignComparison(comparison){
  if(!isRenderable(comparison))return '';
  const dimensions=arr(comparison.dimensions).map((dimension,index)=>renderDimension(comparison,dimension,index)).filter(Boolean).join('');
  if(!dimensions)return '';
  return `<section id="ecr-hd-comparison" class="cx-ecr-hd-comparison" data-ecr-hd-comparison="true" data-comparison-digest="${esc(comparison.comparisonDigest||'')}" data-renderer-version="${esc(ECR_HD_CUSTOMER_COMPARISON_RENDERER_VERSION)}" tabindex="-1">
    <header class="cx-ecr-hd-comparison__hero"><p class="cx-eyebrow">ECR × CONFIRMED HUMAN DESIGN</p><h3>${esc(local(comparison,'The same birth context, two different questions','同一份出生背景，两种不同的问题'))}</h3><p>${esc(local(comparison,'ECR remains a PHI OS native calculation and interpretation. The Human Design side below uses only the external chart information you confirmed. This comparison can show shared observation domains, complementary lenses and explicit non-equivalence; it does not turn fields into equivalents, produce a compatibility score, or decide which system is “more correct.”','ECR 仍然是 PHI OS 原生计算与解释；下方 Human Design 一侧只使用你已经确认的外部图表资料。这里可以呈现共同观察领域、互补视角，以及明确没有直接对应的部分；不会把字段硬转成等价关系，不会产生相容度评分，也不会判断哪个体系“更正确”。'))}</p><div class="cx-ecr-hd-comparison__summary"><span>${esc(summaryText(comparison))}</span><small>${esc(local(comparison,'Comparison IR only · no new calculation','只呈现 Comparison IR · 不进行第二次计算'))}</small></div></header>
    <div class="cx-ecr-hd-comparison__dimensions">${dimensions}</div>
    <details class="cx-ecr-hd-comparison__boundary"><summary>${esc(local(comparison,'How to read this comparison','如何理解这份比较'))}</summary><p>${esc(local(comparison,'A shared observation domain is not agreement or proof. A complementary lens is not a field mapping. “No direct equivalent” is intentionally preserved when the two systems describe different structures. The questions above are prompts for later observation; they are not Current Reality evidence or conclusions.','共同观察领域不等于一致或证明；互补视角不等于字段映射；当两个体系描述的是不同结构时，「没有直接对应」会被刻意保留。上面的提问只是后续观察入口，不是 Current Reality 的证据或结论。'))}</p></details>
  </section>`;
}

function installNavButton(host,comparison){
  const nav=host?.querySelector?.('.cx-ecr-product-nav');
  if(!nav||nav.querySelector('[data-ecr-hd-comparison-nav]'))return Boolean(nav);
  const button=document.createElement('button');
  button.type='button';
  button.dataset.pprR3NavTarget='#ecr-hd-comparison';
  button.dataset.ecrHdComparisonNav='true';
  button.textContent=local(comparison,'HD · ECR × Human Design','HD · ECR × Human Design');
  const before=nav.querySelector('[data-ppr-r3-nav-target="#ecr-section-11"]');
  nav.insertBefore(button,before||null);
  return true;
}
function installSection(host,comparison){
  const reading=host?.querySelector?.('[data-ppr-r3-specialist-reading-mount]');
  if(!reading)return false;
  const existing=reading.querySelector('[data-ecr-hd-comparison="true"]');
  if(existing){installNavButton(host,comparison);mountPhiMandalaCrossEvidenceRail(comparison,host);return true}
  const html=renderEcrHumanDesignComparison(comparison);
  if(!html)return false;
  const cards=reading.querySelector('#ecr-section-11');
  if(cards)cards.insertAdjacentHTML('beforebegin',html);
  else if(host.dataset.pprR3RendererState==='SPECIALIST_RENDERED')reading.insertAdjacentHTML('beforeend',html);
  else return false;
  installNavButton(host,comparison);
  mountPhiMandalaCrossEvidenceRail(comparison,host);
  return true;
}

export function mountEcrHumanDesignComparison(comparison,productsRoot){
  productsRoot?.querySelectorAll?.('[data-ecr-hd-comparison="true"]').forEach(node=>node.remove());
  productsRoot?.querySelectorAll?.('[data-ecr-hd-comparison-nav]').forEach(node=>node.remove());
  if(!isRenderable(comparison)||!productsRoot)return Object.freeze({state:'NOT_RENDERED',reason:'GOVERNED_COMPARISON_REQUIRED'});
  const product=productsRoot.querySelector('[data-ppr-r3-product="true"][data-method="ECR"]');
  const host=product?.querySelector?.('[data-ppr-r3-specialist-host="true"]');
  if(!host)return Object.freeze({state:'NOT_RENDERED',reason:'ECR_SPECIALIST_HOST_REQUIRED'});
  if(installSection(host,comparison))return Object.freeze({state:'RENDERED',comparisonDigest:comparison.comparisonDigest||null});
  if(typeof MutationObserver!=='function')return Object.freeze({state:'WAITING_FOR_SPECIALIST_RENDERER',comparisonDigest:comparison.comparisonDigest||null});
  const observer=new MutationObserver(()=>{if(installSection(host,comparison)){observer.disconnect();return}if(['GENERIC_FALLBACK','FAIL_CLOSED_UPSTREAM'].includes(host.dataset.pprR3RendererState||''))observer.disconnect()});
  observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['data-ppr-r3-renderer-state']});
  return Object.freeze({state:'WAITING_FOR_SPECIALIST_RENDERER',comparisonDigest:comparison.comparisonDigest||null});
}

export default Object.freeze({ECR_HD_CUSTOMER_COMPARISON_RENDERER_VERSION,renderEcrHumanDesignComparison,mountEcrHumanDesignComparison});
