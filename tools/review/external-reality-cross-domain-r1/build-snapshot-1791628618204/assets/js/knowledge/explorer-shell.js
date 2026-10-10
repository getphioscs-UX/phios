import {renderStructuredFigure} from './structured-figure.js';
// Shared presentation and keyboard behavior; book adapters retain source authority.
export function enhanceExplorerShell(host,{layout,nav,inspector,locale='en'}){
 const tr=(en,zh)=>locale==='zh-Hans'?zh:en;
 host.classList.add('structured-explorer');
 const grid=host.querySelector(layout),navigation=host.querySelector(nav),detail=inspector?host.querySelector(inspector):null;
 const prefix=host.className.split(' ')[0];
 grid?.classList.add('structured-explorer-layout');
 if(navigation)navigation.classList.add('structured-explorer-navigation');
 navigation?.setAttribute('aria-label',tr('Explore topics','探索主题'));
 if(detail){detail.setAttribute('aria-label',tr('Selected topic details','所选主题详情'));detail.setAttribute('aria-live','polite');detail.setAttribute('aria-atomic','true');}
 const action=host.ownerDocument.createElement('a');action.className='knowledge-action';action.dataset.explorerAsk='';action.textContent=tr('Ask about the selected topic','就选定主题提问');host.append(action);
 const reading=host.ownerDocument.createElement('a');reading.className='knowledge-action';reading.href='#structured-sources';reading.textContent=tr('Browse source readings','浏览来源阅读');host.append(reading);
 const contextEntry=host.ownerDocument.createElement('a');contextEntry.className='knowledge-action';contextEntry.hidden=true;host.append(contextEntry);
 let map;
 if(grid&&detail&&grid.children.length===2){
  map=host.ownerDocument.createElement('section');map.className='structured-reading-map';
  const heading=host.ownerDocument.createElement('h3');heading.textContent=tr('Reading map','阅读路径');map.append(heading);
  const label=host.ownerDocument.createElement('p');label.dataset.selectedTopic='';map.append(label);
  const explanation=host.ownerDocument.createElement('p');explanation.textContent=tr('Follow the selected topic to its source context, then ask a source-bound question. This is a reading path, not a causal chain.','从选定主题查看来源背景，再提出有来源边界的问题。这是阅读路径，不是因果链。');map.append(explanation);
  detail.id=prefix+'-selected-details';const link=host.ownerDocument.createElement('a');link.href='#'+detail.id;link.textContent=tr('Read source context →','阅读来源背景 →');map.append(link);grid.insertBefore(map,detail);
 }
 const filter=host.ownerDocument.createElement('label');filter.className='structured-explorer-filter';filter.append(tr('Topic list view ','主题列表视图 '));
 const choice=host.ownerDocument.createElement('select');for(const [value,en,zh] of [['all','All matching topics','全部匹配主题'],['selected','Selected topic only','仅选定主题']]){const option=host.ownerDocument.createElement('option');option.value=value;option.textContent=tr(en,zh);choice.append(option);}filter.append(choice);grid?.before(filter);
 const filterChange=()=>navigation?.classList.toggle('structured-selected-only',choice.value==='selected');choice.addEventListener('change',filterChange);
 const figureHost=host.ownerDocument.createElement('div');(map||grid?.children[1]||host).append(figureHost);let figureObject;
 const update=()=>{
  const selected=navigation?.querySelector('[aria-pressed=true],details[open]');
  const id=selected?.dataset.object||selected?.dataset.runtimeObject||selected?.dataset.expansionObject||selected?.dataset.topic;
  const destination={'1':['/reality/','Review your situation','回看当前处境'],'2':['/perspectives/relationship/','Explore relationships','探索关系视角'],'3':['/reality/','Review your situation','回看当前处境'],'4':['/professional/','Explore professional support','了解专业支持']}[id?.match(/^SK-B([1-4])-/)?.[1]];
  contextEntry.hidden=!destination;if(destination){contextEntry.href=destination[0];contextEntry.textContent=tr(destination[1],destination[2]);}
  if(id!==figureObject){figureObject=id;void renderStructuredFigure(figureHost,id,locale);}
  if(map)map.querySelector('[data-selected-topic]').textContent=selected?.querySelector('summary')?.textContent||selected?.textContent||tr('Choose a topic from the list.','请从列表选择主题。');
  action.hidden=!/^SK-B[1-4]-[A-Z0-9-]+$/.test(id||'');
  if(!action.hidden)action.setAttribute('href','/knowledge/ask/?'+new URLSearchParams({contextType:'KNOWLEDGE',contextRef:'CONCEPT:'+id.toLowerCase(),contextLabel:selected.querySelector('summary')?.textContent||selected.textContent}));else action.removeAttribute('href');
 };
 const Observer=host.ownerDocument.defaultView?.MutationObserver;
 const observer=Observer?new Observer(update):null;
 if(navigation)observer?.observe(navigation,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed','open']});
 update();
 const keydown=e=>{
  if(!navigation?.contains(e.target)||!e.target.matches('button,summary'))return;
  const items=[...navigation.querySelectorAll('button:not(:disabled),summary')].filter(item=>!navigation.classList.contains('structured-selected-only')||(item.matches('summary')?item.parentElement.open:item.getAttribute('aria-pressed')==='true'));const index=items.indexOf(e.target);
  const next=e.key==='ArrowDown'?(index+1)%items.length:e.key==='ArrowUp'?(index+items.length-1)%items.length:e.key==='Home'?0:e.key==='End'?items.length-1:null;
  if(next!==null){e.preventDefault();items[next]?.focus();}
 };
 host.addEventListener('keydown',keydown);
 return ()=>{observer?.disconnect();action.remove();reading.remove();contextEntry.remove();choice.removeEventListener('change',filterChange);filter.remove();host.removeEventListener('keydown',keydown);};
}
