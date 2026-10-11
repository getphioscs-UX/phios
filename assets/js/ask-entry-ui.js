import {ASK_CAPABILITIES} from './ask-entry-capabilities.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zh=()=>document.documentElement.lang==='zh-Hans';
const tr=(en,cn)=>zh()?cn:en;
export function renderEntryResult(root,route,actions={}){
 if(!root||!route){if(root)root.hidden=true;return;}
 root._askR1Actions=Object.keys(actions).length?actions:root._askR1Actions||{};
 if(root._askR1Route!==route){root._askR1Route=route;root._askR1OriginalLocale=document.documentElement.lang;}
 if(!root._askR1LocaleObserver){root._askR1LocaleObserver=new MutationObserver(()=>renderEntryResult(root,root._askR1Route));root._askR1LocaleObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}
 const clarification=document.documentElement.lang===root._askR1OriginalLocale?route.clarification:tr('Clarify the topic or resubmit in this language.','补充主题，或以当前语言重新提交。');
 const messages={LIMITED_SUPPORT:tr('This request exceeds the available function','这项请求超出现有功能范围'),PLATFORM_INTRODUCTION:tr('Discover PHI OS','认识 PHI OS'),NO_MATCH:tr('What would you like to explore?','你想探索哪方面？'),NEEDS_INPUT:tr('Enter a question to continue.','请输入问题再继续。'),MULTI_DOMAIN_CLARIFY:tr('Choose one area to start','先选择一个方面'),NEEDS_CLARIFICATION:tr('A little more context will help','请再说明具体主题'),KNOWLEDGE_SOURCE_INSUFFICIENT:tr('More specific sources are needed','需要更具体的知识来源'),INDEX_LOADING_FAILED:tr('Knowledge sources could not be loaded','知识索引未能加载'),SERVICE_FAILURE:tr('The service could not complete this request','服务暂时无法完成请求'),PROFESSIONAL_HANDOFF:tr('Prioritize real-world care','请优先进入现实照护'),KNOWLEDGE_LOOKUP:tr('Explore existing knowledge','探索现有知识'),KNOWLEDGE_RESULTS:tr('Relevant published knowledge','相关的已发布知识')};
 const candidates=route.candidates||[],first=candidates[0];
 const primary=route.primaryAction||(first?{href:first.canonicalRoute,label:first.displayLabels?.[zh()?'zh-Hans':'en']||first.label}:{kind:'CLARIFY',label:tr('Clarify the question','补充问题')});
 const auxiliary=route.auxiliaryActions||candidates.slice(1).map(c=>({href:c.canonicalRoute,label:c.displayLabels?.[zh()?'zh-Hans':'en']||c.label}));
 const href=value=>typeof value==='string'&&value.startsWith('/')&&!value.startsWith('//')?value:null;
 const choose=route.outcome==='MULTI_DOMAIN_CLARIFY'&&typeof root._askR1Actions.select==='function';
 const link=(action,main=false)=>choose&&candidates.find(c=>c.canonicalRoute===action.href)?'<button type="button" class="'+(main?'ask-entry-primary':'ask-entry-secondary')+'" data-entry-select="'+esc(candidates.find(c=>c.canonicalRoute===action.href).capabilityId)+'" data-entry-method="'+esc(candidates.find(c=>c.canonicalRoute===action.href).methodId||'')+'">'+esc(action.label)+'</button>':href(action.href)?'<a class="'+(main?'ask-entry-primary':'ask-entry-secondary')+'" href="'+esc(action.href)+'">'+esc(action.label)+'</a>':'<button type="button" class="ask-entry-primary" data-entry-action="'+esc(action.kind||'CLARIFY')+'">'+esc(action.label)+'</button>';
 root.dataset.entryState=route.outcome;
 root.innerHTML='<h2>'+esc(messages[route.outcome]||tr('Choose a useful next step','选择下一步'))+'</h2>'+(clarification?'<p>'+esc(clarification)+'</p>':'')+(route.outcome==='PLATFORM_INTRODUCTION'?'<p>'+esc(tr('Read the existing About introduction, then explore knowledge or bring a situation to My Reality.','阅读现有 About 介绍，再探索知识或把一个处境带入 My Reality。'))+'</p>':'')+(route.outcome==='INDEX_LOADING_FAILED'||route.outcome==='SERVICE_FAILURE'?'<p>'+esc(tr('Retry this request. Nothing has been generated, saved or charged.','请重试本次请求。没有生成、保存资料或收费。'))+'</p>':'')+(route.knowledge?.results?.length?'<div class="ask-entry-sources">'+route.knowledge.results.slice(0,2).map((item,i)=>'<p><strong>'+esc(item.title)+'</strong>'+(i===0&&route.knowledge.fragments?.[0]?.text?'<span>'+esc(route.knowledge.fragments[0].text)+'</span>':'')+'</p>').join('')+'</div>':'')+'<div class="ask-entry-actions">'+link(primary,true)+auxiliary.slice(0,2).map(a=>link(a)).join('')+'</div>';
 root.querySelector('[data-entry-action]')?.addEventListener('click',event=>{const kind=event.currentTarget.dataset.entryAction;if(kind==='RETRY')root._askR1Actions.retry?.();else root._askR1Actions.clarify?.();});
 root.querySelectorAll('[data-entry-select]').forEach(button=>button.addEventListener('click',()=>root._askR1Actions.select?.({capabilityId:button.dataset.entrySelect,selectedMethodId:button.dataset.entryMethod||undefined})));
 root.hidden=false;
}
export function installCapabilityOverview(parent){
 if(parent.querySelector('[data-ask-r1-overview]'))return;
 const d=document.createElement('details');d.dataset.askR1Overview='';parent.append(d);
 const paint=()=>{d.innerHTML=`<summary>${esc(tr('Explore eight entrances','展开八类入口'))}</summary><ul class="ask-r1-graph">${ASK_CAPABILITIES.capabilities.slice(0,8).map(c=>`<li><a href="${esc(c.canonicalRoute)}">${esc(c.displayLabels[zh()?'zh-Hans':'en'])}</a><small>${esc(tr('Open the existing function; its input and access rules still apply.','进入现有功能；继续遵守其输入和权限规则。'))}</small></li>`).join('')}</ul><a href="/knowledge/">${esc(tr('Knowledge','知识'))}</a> · <a href="/account/">${esc(tr('Account help','账户帮助'))}</a>`;};paint();new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
