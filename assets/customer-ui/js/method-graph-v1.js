import {arr,esc,tr,valueText} from './surfaces/runtime-ui.js';

const METHOD_LABELS=Object.freeze({AST:['Astrology','占星'],BZR:['BaZi','八字'],NUM:['Numerology','数字学'],ZWR:['Zi Wei','紫微斗数']});
const ROLE_LABELS=Object.freeze({BODY:['Body or point','星体或点'],NODE:['Lunar node','月交点'],CALCULATION_ROLE:['Core number','核心数字'],DERIVATION_STEP:['Calculation step','计算步骤'],STEM:['Heavenly stem','天干'],BRANCH:['Earthly branch','地支'],LIFE_PALACE:['Life palace','命宫'],BODY_PALACE:['Body palace','身宫'],PALACE:['Palace','宫位'],MAIN_STAR:['Main star','主星'],SUPPORT_STAR:['Supporting star','辅星']});
function pair(value,fallback){const values=value||fallback;return tr(values?.[0]||'',values?.[1]||values?.[0]||'')}
function methodLabel(result){return result?.label||pair(METHOD_LABELS[result?.methodId],['Perspective','视角'])}
function roleLabel(role){return pair(ROLE_LABELS[role],[String(role||'').toLowerCase().replaceAll('_',' '),String(role||'').toLowerCase().replaceAll('_',' ')])}
function graphTypeLabel(type){const labels={NATAL_CHART:['Birth-chart structure','出生图结构'],NUMBER_DERIVATION:['Number pathway','数字推导路径'],FOUR_PILLARS:['Four-pillar structure','四柱结构'],TWELVE_PALACES:['Twelve-palace structure','十二宫位结构']};return pair(labels[type],['Calculated structure','计算结构'])}
function stateLabel(state){return state==='CALCULATED'?tr('Calculated','已计算'):tr('Included in this structure','已纳入本次结构')}
function houseSystemLabel(value){if(value==='PLACIDUS_V1')return tr('Placidus house system','普拉西德宫制');if(value==='WHOLE_SIGN_V1')return tr('Whole Sign house system','整宫制');return null}

function point(index,total,radius=36){const angle=(-90+(360/Math.max(total,1))*index)*Math.PI/180;return {x:50+Math.cos(angle)*radius,y:50+Math.sin(angle)*radius}}
function layout(graph){
  const nodes=arr(graph?.nodes);const type=graph?.graphType;
  if(type==='NUMBER_DERIVATION')return new Map(nodes.map((node,index)=>[node.nodeId,{x:12+(index%4)*25,y:22+Math.floor(index/4)*28}]));
  if(type==='FOUR_PILLARS')return new Map(nodes.map((node,index)=>[node.nodeId,{x:14+Math.floor(index/2)*24,y:index%2?68:30}]));
  const main=type==='TWELVE_PALACES'?nodes.filter(node=>String(node.role).includes('PALACE')):nodes;
  return new Map(main.map((node,index)=>[node.nodeId,point(index,main.length,type==='TWELVE_PALACES'?40:36)]));
}
function visibleNodes(graph){const nodes=arr(graph?.nodes);return graph?.graphType==='TWELVE_PALACES'?nodes.filter(node=>String(node.role).includes('PALACE')):nodes.slice(0,24)}
function textFallback(graph){return `<details class="cx-method-technical-detail"><summary>${esc(tr('Read this graph as a table','用表格读取这张图'))}</summary><div class="cx-method-graph-table-wrap"><table class="cx-method-graph-table"><thead><tr><th>${esc(tr('Item','项目'))}</th><th>${esc(tr('Role in the structure','在结构中的作用'))}</th><th>${esc(tr('Calculated value','计算结果'))}</th><th>${esc(tr('What is established','已确认到哪一步'))}</th></tr></thead><tbody>${arr(graph?.tableFallback?.rows).map(row=>`<tr><th>${esc(row.label)}</th><td>${esc(roleLabel(row.role))}</td><td>${esc(valueText(row.value))}</td><td>${esc(stateLabel(row.state))}</td></tr>`).join('')}</tbody></table></div></details>`}

export function renderMethodGraph(result){
  const graph=result?.graph;if(!graph?.nodes?.length)return '';
  const label=methodLabel(result),structureLabel=houseSystemLabel(result.houseSystemId)||graphTypeLabel(graph.graphType);
  const nodes=visibleNodes(graph),positions=layout(graph),visible=new Set(nodes.map(x=>x.nodeId));
  const edges=arr(graph.edges).filter(x=>visible.has(x.sourceNodeId)&&visible.has(x.targetNodeId)).map(edge=>{const a=positions.get(edge.sourceNodeId),b=positions.get(edge.targetNodeId);return a&&b?`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" data-relation="${esc(edge.relationType)}"/>`:''}).join('');
  const nodeMarkup=nodes.map(node=>{const p=positions.get(node.nodeId);if(!p)return '';return `<g class="cx-method-graph-node" data-priority="${esc(node.priority)}" transform="translate(${p.x} ${p.y})" role="listitem" tabindex="0" aria-label="${esc(`${node.localizedLabel}: ${valueText(node.value)}`)}"><circle r="5.2"/><text y="-7">${esc(node.localizedLabel)}</text><text y="1">${esc(valueText(node.value))}</text></g>`}).join('');
  return `<article class="cx-method-graph-panel" data-method="${esc(result.methodId)}"><header><div><p class="cx-eyebrow">${esc(label)}</p><h3>${esc(tr('How this structure connects','这组结构怎样连接'))}</h3></div><span>${esc(structureLabel)}</span></header><figure><svg viewBox="0 0 100 100" role="img" aria-labelledby="cx-graph-title-${esc(result.methodId)} cx-graph-desc-${esc(result.methodId)}"><title id="cx-graph-title-${esc(result.methodId)}">${esc(tr(`${label} structure graph`,`${label}结构图`))}</title><desc id="cx-graph-desc-${esc(result.methodId)}">${esc(graph.accessibilitySummary)}</desc><g class="cx-method-graph-edges">${edges}</g><g role="list">${nodeMarkup}</g></svg><figcaption>${esc(graph.accessibilitySummary)}</figcaption></figure>${textFallback(graph)}${result.structureOnly?`<p class="cx-method-uncertainty">${esc(tr('A calculated structure is available, but this run did not return enough governed information for a complete customer explanation.','这次已有计算结构，但现有受治理资料仍不足以形成完整的客户解释。'))}</p>`:''}</article>`;
}

export function renderAcceptedInsight(item){return `<article class="cx-method-insight"><p class="cx-eyebrow">${esc(item.priority)}</p><h3>${esc(item.title)}</h3><p>${esc(item.plainLanguageExplanation)}</p><div class="cx-method-evidence"><strong>${esc(tr('Why this is here','为什么出现这项内容'))}</strong><p>${esc(item.structuralReason)}</p></div><div class="cx-method-alternative"><strong>${esc(tr('Another possible expression','另一种可能表现'))}</strong><p>${esc(item.frictionExpression)}</p></div><div class="cx-method-observation"><strong>${esc(tr('Reality-comparison question','现实对照问题'))}</strong><p>${esc(arr(item.realityComparisonQuestions)[0]||'')}</p></div></article>`}
