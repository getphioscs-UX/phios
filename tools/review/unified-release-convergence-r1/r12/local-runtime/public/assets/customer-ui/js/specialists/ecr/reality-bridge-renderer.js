import {mountPhiMandalaRealityBridgeVisual} from './mandala-renderer.js';
import {esc} from '../../surfaces/runtime-ui.js';

export const ECR_HD_REALITY_BRIDGE_RENDERER_VERSION='PHI-OS-ECR-R3-ECR-HD-REALITY-BRIDGE-RENDERER-v1.0.0';
export const ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION='PHI-OS-ECR-R3-ECR-HD-REALITY-BRIDGE-RESPONSE-v1.0.0';
const BRIDGE_SCHEMA='PHI-OS-ECR-R3-ECR-HD-REALITY-BRIDGE-IR-v1.0.0';
const arr=value=>Array.isArray(value)?value:[];
const local=(bridge,en,zh)=>bridge?.locale==='zh-Hans'?zh:en;
const token=value=>String(value||'item').trim().replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'item';
function isRenderable(bridge){
  return Boolean(
    bridge?.schemaVersion===BRIDGE_SCHEMA&&
    bridge?.state==='OBSERVATION_BRIDGE_READY'&&
    bridge?.boundaries?.bridgeCreatesMeaning===false&&
    bridge?.boundaries?.observationPromptOnly===true&&
    bridge?.boundaries?.currentRealityEvidenceCreated===false&&
    bridge?.boundaries?.currentRealityConclusionCreated===false&&
    bridge?.boundaries?.userResponseIsReportedContextNotEvidence===true&&
    bridge?.boundaries?.automaticPersistence===false
  );
}
function renderPrompt(bridge,prompt,index){
  const options=arr(bridge.responseOptions);
  if(!prompt?.promptId||!prompt?.observationQuestion||!options.length)return '';
  const promptToken=token(prompt.promptId);
  return `<article class="cx-ecr-reality-bridge__prompt" data-ecr-reality-prompt="${esc(prompt.promptId)}" data-dimension-id="${esc(prompt.dimensionId||'')}">
    <header><small>${String(index+1).padStart(2,'0')} · ${esc(prompt.label||prompt.dimensionId||'')}</small><h4>${esc(prompt.observationQuestion)}</h4></header>
    <div class="cx-ecr-reality-bridge__choices" role="group" aria-label="${esc(local(bridge,'How does this relate to your experience?','这与你的现实经验有什么关系？'))}">${options.map(option=>`<button type="button" data-ecr-reality-response="${esc(option.code)}" aria-pressed="false">${esc(option.label)}</button>`).join('')}</div>
    <label class="cx-ecr-reality-bridge__note" for="ecr-rb-note-${esc(promptToken)}"><span>${esc(local(bridge,'Optional note or counterexample','可选：补充观察或反例'))}</span><textarea id="ecr-rb-note-${esc(promptToken)}" maxlength="240" data-ecr-reality-note placeholder="${esc(local(bridge,'What happened, in what context, or what did not fit?','发生了什么？在什么情境？哪里不符合？'))}"></textarea></label>
    <footer><span>${esc(local(bridge,'Your response remains reported context, not proof.','你的回应只会作为已申报的现实上下文，不会自动变成证据。'))}</span></footer>
  </article>`;
}
export function renderEcrHumanDesignRealityBridge(bridge){
  if(!isRenderable(bridge))return '';
  const prompts=arr(bridge.prompts).map((prompt,index)=>renderPrompt(bridge,prompt,index)).filter(Boolean).join('');
  if(!prompts)return '';
  return `<section id="ecr-section-10" class="cx-ecr-reality-bridge" data-ecr-reality-bridge="true" data-bridge-digest="${esc(bridge.bridgeDigest||'')}" data-source-comparison-digest="${esc(bridge.sourceComparisonDigest||'')}" data-renderer-version="${esc(ECR_HD_REALITY_BRIDGE_RENDERER_VERSION)}" tabindex="-1">
    <header class="cx-ecr-reality-bridge__hero"><p class="cx-eyebrow">10 · REALITY BRIDGE</p><h3>${esc(local(bridge,'Bring the comparison back to lived experience','把比较带回你的现实经验'))}</h3><p>${esc(local(bridge,'Choose only what you have actually observed. Repetition, context dependence, uncertainty and contradiction are all valid outcomes. Nothing in this section changes the ECR calculation or the Human Design chart you confirmed.','只选择你真正观察到的情况。稳定重复、依赖情境、暂时看不清，以及与读取相反，都是有效结果。这里的任何选择都不会改写 ECR 计算，也不会改写你已确认的人类图。'))}</p></header>
    <div class="cx-ecr-reality-bridge__grid">${prompts}</div>
    <aside class="cx-ecr-reality-bridge__boundary"><strong>${esc(local(bridge,'What happens if you continue to My Reality?','如果继续到 My Reality，会发生什么？'))}</strong><p>${esc(local(bridge,'Only the responses you explicitly choose are carried forward as user-reported context after the existing handoff consent step. They are not promoted to evidence, findings or facts, and nothing is saved automatically here.','只有你明确选择的回应，才会在既有的带入同意步骤之后，作为用户已申报上下文带到 My Reality。它们不会被升级成证据、发现或事实，这里也不会自动保存任何内容。'))}</p></aside>
  </section>`;
}
function installInteractions(section){
  section?.querySelectorAll?.('[data-ecr-reality-prompt]').forEach(prompt=>{
    prompt.querySelectorAll('[data-ecr-reality-response]').forEach(button=>button.addEventListener('click',()=>{
      const pressed=button.getAttribute('aria-pressed')==='true';
      prompt.querySelectorAll('[data-ecr-reality-response]').forEach(other=>other.setAttribute('aria-pressed','false'));
      button.setAttribute('aria-pressed',pressed?'false':'true');
      prompt.dataset.responseCode=pressed?'':button.dataset.ecrRealityResponse||'';
    }));
  });
}
function installNavButton(host,bridge){
  const nav=host?.querySelector?.('.cx-ecr-product-nav');
  if(!nav||nav.querySelector('[data-ecr-reality-bridge-nav]'))return Boolean(nav);
  const button=document.createElement('button');
  button.type='button';
  button.dataset.pprR3NavTarget='#ecr-section-10';
  button.dataset.ecrRealityBridgeNav='true';
  button.textContent=local(bridge,'10 Reality bridge','10 现实对照');
  const before=nav.querySelector('[data-ppr-r3-nav-target="#ecr-section-11"]');
  nav.insertBefore(button,before||null);
  return true;
}
function installSection(host,bridge){
  const reading=host?.querySelector?.('[data-ppr-r3-specialist-reading-mount]');
  if(!reading)return false;
  const existing=reading.querySelector('[data-ecr-reality-bridge="true"]');
  if(existing){installNavButton(host,bridge);installInteractions(existing);mountPhiMandalaRealityBridgeVisual(bridge,host);return true}
  const html=renderEcrHumanDesignRealityBridge(bridge);
  if(!html)return false;
  const comparison=reading.querySelector('[data-ecr-hd-comparison="true"]');
  const cards=reading.querySelector('#ecr-section-11');
  if(comparison)comparison.insertAdjacentHTML('afterend',html);
  else if(cards)cards.insertAdjacentHTML('beforebegin',html);
  else if(host.dataset.pprR3RendererState==='SPECIALIST_RENDERED')reading.insertAdjacentHTML('beforeend',html);
  else return false;
  const section=reading.querySelector('[data-ecr-reality-bridge="true"]');
  installInteractions(section);
  installNavButton(host,bridge);
  mountPhiMandalaRealityBridgeVisual(bridge,host);
  return true;
}
export function collectEcrHumanDesignRealityBridgeResponse(productsRoot){
  const section=productsRoot?.querySelector?.('[data-ecr-reality-bridge="true"]');
  if(!section)return null;
  const entries=[...section.querySelectorAll('[data-ecr-reality-prompt]')].map(prompt=>{
    const responseCode=prompt.dataset.responseCode||prompt.querySelector('[data-ecr-reality-response][aria-pressed="true"]')?.dataset?.ecrRealityResponse||'';
    if(!responseCode)return null;
    const note=prompt.querySelector('[data-ecr-reality-note]')?.value?.trim().slice(0,240)||null;
    return {promptId:prompt.dataset.ecrRealityPrompt||'',dimensionId:prompt.dataset.dimensionId||'',responseCode,note};
  }).filter(Boolean);
  if(!entries.length)return null;
  return Object.freeze({
    schemaVersion:ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION,
    bridgeDigest:section.dataset.bridgeDigest||null,
    sourceComparisonDigest:section.dataset.sourceComparisonDigest||null,
    entries:Object.freeze(entries.map(entry=>Object.freeze(entry))),
    boundaries:Object.freeze({customerReported:true,realityEvidence:false,realityConclusion:false,perspectiveTruthClaim:false,automaticPersistence:false})
  });
}
export function mountEcrHumanDesignRealityBridge(bridge,productsRoot){
  productsRoot?.querySelectorAll?.('[data-ecr-reality-bridge="true"]').forEach(node=>node.remove());
  productsRoot?.querySelectorAll?.('[data-ecr-reality-bridge-nav]').forEach(node=>node.remove());
  if(!isRenderable(bridge)||!productsRoot)return Object.freeze({state:'NOT_RENDERED',reason:'GOVERNED_REALITY_BRIDGE_REQUIRED'});
  const product=productsRoot.querySelector('[data-ppr-r3-product="true"][data-method="ECR"]');
  const host=product?.querySelector?.('[data-ppr-r3-specialist-host="true"]');
  if(!host)return Object.freeze({state:'NOT_RENDERED',reason:'ECR_SPECIALIST_HOST_REQUIRED'});
  if(installSection(host,bridge))return Object.freeze({state:'RENDERED',bridgeDigest:bridge.bridgeDigest||null});
  if(typeof MutationObserver!=='function')return Object.freeze({state:'WAITING_FOR_SPECIALIST_RENDERER',bridgeDigest:bridge.bridgeDigest||null});
  const observer=new MutationObserver(()=>{if(installSection(host,bridge)){observer.disconnect();return}if(['GENERIC_FALLBACK','FAIL_CLOSED_UPSTREAM'].includes(host.dataset.pprR3RendererState||''))observer.disconnect()});
  observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['data-ppr-r3-renderer-state']});
  return Object.freeze({state:'WAITING_FOR_SPECIALIST_RENDERER',bridgeDigest:bridge.bridgeDigest||null});
}
export default Object.freeze({ECR_HD_REALITY_BRIDGE_RENDERER_VERSION,ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION,renderEcrHumanDesignRealityBridge,mountEcrHumanDesignRealityBridge,collectEcrHumanDesignRealityBridgeResponse});
