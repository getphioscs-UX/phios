import {ASK_CAPABILITIES} from './ask-entry-capabilities.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zh=()=>document.documentElement.lang==='zh-Hans';
const tr=(en,cn)=>zh()?cn:en;
export function renderEntryResult(root,route){
 if(!root)return;
 const messages={NO_MATCH:tr('No supported match yet. You can clarify the question or browse knowledge.','目前没有可靠匹配。你可以补充问题，或直接浏览知识。'),NEEDS_INPUT:tr('Enter a question to continue.','请输入问题再继续。'),MULTI_DOMAIN_CLARIFY:route.clarification,PROFESSIONAL_HANDOFF:tr('Prioritize real-world care. This is not a diagnosis or a paid gate.','请优先进入现实照护。这不是诊断，也不会以付费作为门槛。'),KNOWLEDGE_LOOKUP:tr('Read existing sources; no new AI synthesis is generated.','阅读已有来源，不生成新的 AI 综合。')};
 root.innerHTML=`<h2>${esc(tr('A useful next step','可以继续的一步'))}</h2><p>${esc(messages[route.outcome]||tr('Choose a relevant function. Nothing has been generated or saved.','选择相关功能。尚未生成或保存资料。'))}</p>${route.clarification&&route.outcome!=='MULTI_DOMAIN_CLARIFY'?`<p>${esc(route.clarification)}</p>`:''}<ul class="ask-r1-graph" aria-label="${esc(tr('Function navigation, not personal relationships','功能导航，不是个人关系图'))}">${(route.candidates||[]).map(c=>`<li><span>${esc(tr('Your question → can enter','你的问题 → 可以进入'))}</span><a href="${esc(c.canonicalRoute)}">${esc(c.displayLabels?.[zh()?'zh-Hans':'en']||c.label)}</a><p>${esc(c.reason)}</p></li>`).join('')}</ul><a href="/knowledge/">${esc(tr('Read knowledge','阅读知识'))}</a> · <a href="/account/">${esc(tr('Account / reports','账户／报告'))}</a>`;
 root.hidden=false;
}
export function installCapabilityOverview(parent){
 if(parent.querySelector('[data-ask-r1-overview]'))return;
 const d=document.createElement('details');d.dataset.askR1Overview='';parent.append(d);
 const paint=()=>{d.innerHTML=`<summary>${esc(tr('Explore eight entrances','展开八类入口'))}</summary><ul class="ask-r1-graph">${ASK_CAPABILITIES.capabilities.slice(0,8).map(c=>`<li><a href="${esc(c.canonicalRoute)}">${esc(c.displayLabels[zh()?'zh-Hans':'en'])}</a><small>${esc(tr('Open the existing function; its input and access rules still apply.','进入现有功能；继续遵守其输入和权限规则。'))}</small></li>`).join('')}</ul><a href="/knowledge/">${esc(tr('Knowledge','知识'))}</a> · <a href="/account/">${esc(tr('Account help','账户帮助'))}</a>`;};paint();new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
