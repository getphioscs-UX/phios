import {arr,esc,tr,valueText} from './surfaces/runtime-ui.js';

function point(index,total,radius=36){const angle=(-90+(360/Math.max(total,1))*index)*Math.PI/180;return {x:50+Math.cos(angle)*radius,y:50+Math.sin(angle)*radius}}
function layout(graph){
  const nodes=arr(graph?.nodes);const type=graph?.graphType;
  if(type==='NUMBER_DERIVATION')return new Map(nodes.map((node,index)=>[node.nodeId,{x:12+(index%4)*25,y:22+Math.floor(index/4)*28}]));
  if(type==='FOUR_PILLARS')return new Map(nodes.map((node,index)=>[node.nodeId,{x:14+Math.floor(index/2)*24,y:index%2?68:30}]));
  const main=type==='TWELVE_PALACES'?nodes.filter(node=>String(node.role).includes('PALACE')):nodes;
  return new Map(main.map((node,index)=>[node.nodeId,point(index,main.length,type==='TWELVE_PALACES'?40:36)]));
}
function visibleNodes(graph){const nodes=arr(graph?.nodes);return graph?.graphType==='TWELVE_PALACES'?nodes.filter(node=>String(node.role).includes('PALACE')):nodes.slice(0,24)}
function textFallback(graph){return `<details class="cx-method-technical-detail"><summary>${esc(tr('Read this graph as a table','用表格读取这张图'))}</summary><div class="cx-method-graph-table-wrap"><table class="cx-method-graph-table"><thead><tr><th>${esc(tr('Item','项目'))}</th><th>${esc(tr('Role','角色'))}</th><th>${esc(tr('Value','数值'))}</th><th>${esc(tr('State','状态'))}</th></tr></thead><tbody>${arr(graph?.tableFallback?.rows).map(row=>`<tr><th>${esc(row.label)}</th><td>${esc(row.role)}</td><td>${esc(valueText(row.value))}</td><td>${esc(row.state)}</td></tr>`).join('')}</tbody></table></div></details>`}

export function renderMethodGraph(result){
  const graph=result?.graph;if(!graph?.nodes?.length)return '';
  const nodes=visibleNodes(graph),positions=layout(graph),visible=new Set(nodes.map(x=>x.nodeId));
  const edges=arr(graph.edges).filter(x=>visible.has(x.sourceNodeId)&&visible.has(x.targetNodeId)).map(edge=>{const a=positions.get(edge.sourceNodeId),b=positions.get(edge.targetNodeId);return a&&b?`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" data-relation="${esc(edge.relationType)}"/>`:''}).join('');
  const nodeMarkup=nodes.map(node=>{const p=positions.get(node.nodeId);if(!p)return '';return `<g class="cx-method-graph-node" data-priority="${esc(node.priority)}" transform="translate(${p.x} ${p.y})" role="listitem" tabindex="0" aria-label="${esc(`${node.localizedLabel}: ${valueText(node.value)}`)}"><circle r="5.2"/><text y="-7">${esc(node.localizedLabel)}</text><text y="1">${esc(valueText(node.value))}</text></g>`}).join('');
  return `<article class="cx-method-graph-panel" data-method="${esc(result.methodId)}"><header><div><p class="cx-eyebrow">${esc(tr('GRAPH','结构图'))}</p><h3>${esc(tr('How this structure connects','这组结构怎样连接'))}</h3></div><span>${esc(result.houseSystemId||graph.graphType)}</span></header><figure><svg viewBox="0 0 100 100" role="img" aria-labelledby="cx-graph-title-${esc(result.methodId)} cx-graph-desc-${esc(result.methodId)}"><title id="cx-graph-title-${esc(result.methodId)}">${esc(tr(`${result.methodId} structure graph`,`${result.methodId} 结构图`))}</title><desc id="cx-graph-desc-${esc(result.methodId)}">${esc(graph.accessibilitySummary)}</desc><g class="cx-method-graph-edges">${edges}</g><g role="list">${nodeMarkup}</g></svg><figcaption>${esc(graph.accessibilitySummary)}</figcaption></figure>${textFallback(graph)}${result.structureOnly?`<p class="cx-method-uncertainty">${esc(tr('The calculated structure is available. Composed explanations remain withheld until both method-fidelity and ordinary-reader reviews are accepted.','计算结构已经可见；组合解释必须同时通过方法忠实度与普通读者清晰度审核后才会显示。'))}</p>`:''}</article>`;
}

export function renderAcceptedInsight(item){return `<article class="cx-method-insight"><p class="cx-eyebrow">${esc(item.priority)}</p><h3>${esc(item.title)}</h3><p>${esc(item.plainLanguageExplanation)}</p><div class="cx-method-evidence"><strong>${esc(tr('Why this is here','为什么出现这项内容'))}</strong><p>${esc(item.structuralReason)}</p></div><div class="cx-method-alternative"><strong>${esc(tr('Another possible expression','另一种可能表现'))}</strong><p>${esc(item.frictionExpression)}</p></div><div class="cx-method-observation"><strong>${esc(tr('Reality-comparison question','现实对照问题'))}</strong><p>${esc(arr(item.realityComparisonQuestions)[0]||'')}</p></div></article>`}
