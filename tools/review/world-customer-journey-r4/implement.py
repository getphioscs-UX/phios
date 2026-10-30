from pathlib import Path
import re
r=Path('C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios')
here=Path(__file__).parent
def write(rel,s):
 p=r/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(s.encode('utf-8'))
def read(rel):return (r/rel).read_text(encoding='utf-8-sig')
state=(here/'route-state.js').read_text(encoding='utf-8-sig').replace("topic:journey==='connections'?'connections':h.get('topic')","topic:journey==='connections'?(h.get('topic')||'connections'):h.get('topic')")
write('assets/js/pages/civilization-atlas/world-journey-state-r3.js',state)
s=read('world/index.html')
s=re.sub(r'<button type="button" id="world-journey-companies".*?</button>', '<button type="button" id="world-journey-connections" data-world-journey="connections" role="tab" aria-selected="false" aria-controls="world-panel-connections" tabindex="-1"><strong data-ux-copy="Industries & Global Connections|产业与全球连接">Industries & Global Connections</strong><span data-ux-copy="Trade, transport, cities and supply chains|贸易、交通、城市与供应链">Trade, transport, cities and supply chains</span></button>',s,count=1,flags=re.S)
s=s.replace('data-world-ux-r3>','data-world-ux-r3 data-world-load-state="LOADING">',1)
s=re.sub(r'(id="world-panel-now"[^>]*?)(\s*)>',lambda m:m[1]+' hidden>',s,count=1)
s=s.replace('id="world-panel-companies"','id="world-panel-companies"',1)
panel='<section id="world-panel-connections" data-world-ux-panel="connections" role="tabpanel" aria-labelledby="world-journey-connections" hidden><div class="world-ux-connection-intro"><h2 data-ux-copy="How do trade, transport and supply chains connect places?|贸易、交通与供应链怎样连接世界？">How do trade, transport and supply chains connect places?</h2><p data-ux-copy="Choose a place on the existing map, inspect a registered figure, or follow a case. Dated regional background and historical explanations remain distinct.|在现有地图选择地区、查看已登记原图或继续案例；地区背景与历史机制说明分别标明。">Choose a place on the existing map, inspect a registered figure, or follow a case.</p><a class="knowledge-action" href="/world/?worldJourney=companies" data-ux-copy="Company Research · open only when needed|企业研究 · 按需进入">Company Research · open only when needed</a></div></section>'
needle='<section id="world-panel-companies"';assert needle in s;s=s.replace(needle,panel+needle,1)
s=s.replace('/world/?worldJourney=companies&amp;symbol=MYX:0338" data-world-example="company"','/world/?worldJourney=connections" data-world-example="connections"')
s=s.replace('Oriental Kopi · read its filing|Oriental Kopi · 看财报','Trade, transport & cities|贸易、交通与城市').replace('>Oriental Kopi · read its filing</a>','>Trade, transport & cities</a>')
s=s.replace('Explore economies, companies, civilizations and changing conditions through questions and verified sources.|从一个问题开始，探索经济、企业、文明与现实变化。','Explore places, connections, civilizations and change through questions and sources.|从一个问题开始，探索地区、全球连接、文明与变化。')
s=s.replace('Explore economies, companies, civilizations and changing conditions through questions and verified sources.','Explore places, connections, civilizations and change through questions and sources.')
write('world/index.html',s)
s=read('assets/js/pages/civilization-atlas/world-journey-shell-r3.js')
s=s.replace('worldJourneyFromURL,worldJourneyURL,worldNeedsLegacyReader','worldJourneyFromURL,worldJourneyURL,worldNeedsLegacyReader,worldRouteFromURL,worldQuestionTarget')
s="import {installEntryInputReceiver} from '../../entry-context-handoff.js';\ninstallEntryInputReceiver();\n"+s
s=s.replace("const selected=t.dataset.worldJourney===mode;","const selected=t.dataset.worldJourney===(mode==='companies'?'connections':mode);")
s=s.replace("active=mode;root.dataset.worldJourney=mode;","active=mode;root.dataset.worldJourney=mode;root.dataset.worldLoadState='LOADING';")
s=s.replace("if(mode==='companies'){await once('companies',async()=>{const {mountWorldCompany}=await import('./world-company-analysis.js');mountWorldCompany(document.querySelector('[data-world-company]'));});", "if(mode==='landing'){native.hidden=true;legacy.hidden=true;root.dataset.worldLoadState='READY';status.textContent=worldRouteFromURL(location.href).unknownIntent?pair('This direction is not registered. Choose one of the four journeys.','该方向未登记，请选择下方四个方向。'):'';return;}\n  if(mode==='companies'){const query=worldRouteFromURL(location.href).companyQuery,companyHost=document.querySelector('[data-world-company]');let gap=document.querySelector('[data-world-company-gap]');if(!gap){gap=document.createElement('p');gap.dataset.worldCompanyGap='';companyHost.before(gap);}gap.hidden=!query;companyHost.hidden=!!query;if(query){gap.textContent=pair(query+' has no admitted company dataset in this workspace. No other company or live price is substituted. Choose a supported public code or read a published source.',query+' 暂无本工作区获准的企业资料集；不会替换为其他企业或虚构行情。可返回企业研究输入支持的公开代码，或主动查阅来源。');root.dataset.worldLoadState='EMPTY_WITH_REASON';status.textContent='';return;}await once('companies',async()=>{const {mountWorldCompany}=await import('./world-company-analysis.js');mountWorldCompany(companyHost,{symbol:''});});if(n!==epoch)return;")
s=s.replace("if((different||!document.querySelector('[data-company-period]'))&&!f.querySelector('button[type=submit]').disabled)","if(symbol&&(different||!document.querySelector('[data-company-period]'))&&!f.querySelector('button[type=submit]').disabled)")
s=s.replace("await m.worldR2Ready;const h=", "await m.worldR2Ready;if(n!==epoch)return;const route=worldRouteFromURL(location.href);const h=")
s=s.replace("region,topic}}));", "region:region||route.region,topic:topic||route.topic}}));")
s=s.replace("if(n===epoch)status.textContent='';", "if(n===epoch){status.textContent='';root.dataset.worldLoadState='READY';}")
s=s.replace("status.textContent=pair('This view could not load.","root.dataset.worldLoadState='ERROR_RECOVERABLE';status.textContent=pair('This view could not load.")
s=s.replace("if(type==='company'){", "if(type==='connections'){activate('connections',{push:true,topic:'connections',pane:'map'});}else if(type==='company'){")
s=s.replace("const wanted=mode", "const wanted=mode")
needle="window.addEventListener('popstate',()=>activate(worldJourneyFromURL(location.href)));"
addition="document.querySelector('[data-world-query]').addEventListener('submit',e=>{e.preventDefault();const value=document.querySelector('#worldQuestion').value.trim(),target=worldQuestionTarget(value);if(!target){if(/知识|文章|knowledge|article/i.test(value)){location.assign('/search/?q='+encodeURIComponent(value)+'&locale='+getLocale());return;}status.textContent=pair('Choose a supported direction or search published knowledge. No unrelated article has been substituted.','请选择一个支持的方向，或主动搜索知识；没有替换为不相关的文章。');root.dataset.worldLoadState='EMPTY_WITH_REASON';return;}const u=new URL(target.href,location.origin);u.searchParams.set('locale',getLocale());history.pushState(history.state,'',u);activate(target.journey);});\n "
assert needle in s;s=s.replace(needle,addition+needle)
write('assets/js/pages/civilization-atlas/world-journey-shell-r3.js',s)
s=read('assets/js/pages/civilization-atlas/world-company-analysis.js');s=s.replace('export function mountWorldCompany(host){','export function mountWorldCompany(host,{symbol=\'MYX:0338\'}={}){');s=s.replace("selected='MYX:0338'","selected=symbol");write('assets/js/pages/civilization-atlas/world-company-analysis.js',s)
# Existing discovery owner, not a second Home router.
rel='assets/js/customer-entry-topic-map.js';s=read(rel);s="import {worldQuestionTarget} from './pages/civilization-atlas/world-journey-state-r3.js';\n"+s
s=s.replace('/world/?reading=BOOK-6%3Abook6-internet-supply-chains-global-cities','/world/?worldJourney=connections')
marker='export function topicRoute(';at=s.index(marker);body=s.index('{',at)+1
early="\n const wt=worldQuestionTarget(question,{selected:selected==='world'});if(wt){const lang=locale==='zh-Hans'?'zh-Hans':'en',zh=lang==='zh-Hans',generic=wt.journey==='landing',title=zh?'世界探索':'World exploration';const targetURL=new URL(wt.href,'https://getphios.com');targetURL.searchParams.set('locale',lang);const href=targetURL.pathname+targetURL.search+targetURL.hash;return {outcome:generic?'TOPIC_PATHWAYS':'MATCHED_CAPABILITY',worldPresentation:wt.journey,topicIds:['world'],selectedTopic:'world',candidates:[],href,primaryAction:{href,label:zh?'开始探索世界':'Start exploring World'},clarification:zh?'按你明确选择的公开主题进入对应工作区；没有生成或保存个人资料。':'Open the workspace for your explicit public topic. No personal information has been generated or saved.',navigationActions:[{href:'/world/?worldJourney=now&locale='+lang,label:zh?'选择地区，查看事实与来源年份':'Choose a region; check facts and dates'},{href:'/world/?worldJourney=connections&locale='+lang,label:zh?'理解网络、城市与经济联系':'Explore networks, cities and economic connections'},{href:'/knowledge/?locale='+lang,label:zh?'搜索更多公开知识':'Search more published knowledge'}],providerCalls:0,generationMode:'DETERMINISTIC',boundaries:{automaticPersistence:false,methodChosenByClientRouter:false}};}\n"
# Actual signature is checked before editing below.
print('topic signature:',s[at:body])
s=s[:body]+early+s[body:]
s=s.replace("const match=CUSTOMER_TOPICS.find(t=>q===", "const world=worldQuestionTarget(question,{selected:selected==='world'});if(world)return topicRoute(question,locale,selected||'world');const match=CUSTOMER_TOPICS.find(t=>q===")
write(rel,s)
rel='functions/public/client-intent-router.js';s=read(rel);needle=' const explanatory=';assert needle in s;s=s.replace(needle," const worldPresentation=topicRoute(q,locale,input.topicId);if(input.task!=='KNOWLEDGE_BASIC'&&worldPresentation?.worldPresentation)return {...base,...worldPresentation};\n"+needle,1);write(rel,s)
rel='assets/js/pages/client-intent-router.js';s=read(rel);s=s.replace("result.dataset.entryState==='MATCHED_CAPABILITY'","(result.dataset.entryState==='MATCHED_CAPABILITY'||result._askR1Route?.worldPresentation)");write(rel,s)
rel='assets/js/ask-entry-ui.js';s=read(rel);needle="if(route.outcome==='TOPIC_PATHWAYS'){root.innerHTML=";assert needle in s;s=s.replace("root.dataset.entryState=route.outcome;","root.dataset.entryState=route.outcome;root.classList.toggle('world-entry-pathways',!!route.worldPresentation);")
s=s.replace("+(route.navigationActions||[]).map(original=>", "+(route.worldPresentation&&route.primaryAction?link(route.primaryAction,true):'')+(route.navigationActions||[]).map(original=>")
write(rel,s)
rel='assets/css/world-experience-r2.css';s=read(rel);s+='\n.world-ux-r3 [data-world-ux-panel][hidden]{display:none!important}.world-ux-connection-intro{padding:24px;max-width:76ch;margin:auto}.world-entry-pathways .ask-entry-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px}.world-entry-pathways a{display:block;padding:18px;border:1px solid currentColor;border-radius:12px;text-decoration:none;line-height:1.6}\n';write(rel,s)
print('Updated existing R3 sources and existing Home discovery owners; no data/Canon changes')
