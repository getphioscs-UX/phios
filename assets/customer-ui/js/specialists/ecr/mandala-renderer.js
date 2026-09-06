import {esc} from '../../surfaces/runtime-ui.js';
import {PHI_MANDALA_VIEWBOX_SIZE,PHI_MANDALA_CENTER,PHI_MANDALA_LAYER_GEOMETRY,ringSegmentGeometry,circularNodeGeometry,connectorGeometry,radialBarGeometry,textRotation,polarPoint} from './mandala-geometry.js';
import {customerLayerLabel,customerLayerExplanation,selectedCatalog,authorityLabel} from './customer-language.js';

const SCHEMA='PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0';
const EXPERIENCE_STATES=new Set(['FREE_SNAPSHOT','PAID_DEPTH']);
const zodiacGlyph=Object.freeze({ARIES:'♈',TAURUS:'♉',GEMINI:'♊',CANCER:'♋',LEO:'♌',VIRGO:'♍',LIBRA:'♎',SCORPIO:'♏',SAGITTARIUS:'♐',CAPRICORN:'♑',AQUARIUS:'♒',PISCES:'♓'});
const trigramGlyph=Object.freeze({KUN:'☷',ZHEN:'☳',KAN:'☵',XUN:'☴',LI:'☲',GEN:'☶',QIAN:'☰',DUI:'☱'});
const arr=value=>Array.isArray(value)?value:[];
const isZh=projection=>projection?.locale==='zh-Hans';
const local=(projection,en,zh)=>isZh(projection)?zh:en;
const by=(items,key,id)=>arr(items).find(item=>item?.[key]===id)||null;
const n=value=>Number.isFinite(Number(value))?Number(value):null;
const deg=value=>{const x=n(value);return x===null?'—':`${x.toFixed(3)}°`;};
const data=value=>esc(String(value??'').replace(/\s+/g,' ').trim());
const safeToken=value=>String(value||'ecr-mandala').replace(/[^A-Za-z0-9_-]/g,'-');
const compact=(value,max=18)=>{const s=String(value||'').replace(/\s+/g,' ').trim();return s.length>max?`${s.slice(0,Math.max(1,max-1))}…`:s;};
const experience=value=>EXPERIENCE_STATES.has(value)?value:'PAID_DEPTH';
const isFree=value=>experience(value)==='FREE_SNAPSHOT';

function stateFor({layer,selected=false,relation='',driverRank=null,experienceState='PAID_DEPTH'}){
  if(!selected)return 'BACKGROUND';
  if(relation==='SUPPORTING')return isFree(experienceState)?'LOCKED_DEPTH':'SUPPORTING_ACTIVE';
  if(layer==='R9'&&relation==='PRIMARY')return 'PRIMARY_ACTIVE';
  if(layer==='D12')return Number(driverRank)===1?'PRIMARY_ACTIVE':isFree(experienceState)?'LOCKED_DEPTH':'SUPPORTING_ACTIVE';
  if(isFree(experienceState)&&['M8','H64','A8'].includes(layer))return 'LOCKED_DEPTH';
  return ['CC12','G16','Q16','R9'].includes(layer)?'PRIMARY_ACTIVE':'SUPPORTING_ACTIVE';
}
function accessibleCopy(projection,state,copy){return state==='LOCKED_DEPTH'?local(projection,'A deeper governed layer is available after access is granted.','这是尚未展开的受治理深层结构；获得相应访问权限后才会呈现其个人化细节。'):copy;}
function nodeAttrs({projection,layer,id,title,copy,meta='',selected=false,relation='',visualState='BACKGROUND'}){
  const safeCopy=accessibleCopy(projection,visualState,copy),safeTitle=visualState==='LOCKED_DEPTH'?local(projection,'Deeper layer','更深层结构'):title,safeMeta=visualState==='LOCKED_DEPTH'?'':meta;
  return `tabindex="0" role="button" aria-pressed="false"${selected?' aria-current="true"':''} data-ecr-mandala-node="true" data-layer="${data(layer)}" data-node-id="${data(id)}" data-detail-title="${data(safeTitle)}" data-detail-copy="${data(safeCopy)}" data-detail-meta="${data(safeMeta)}" data-selected="${selected?'true':'false'}" data-visual-state="${data(visualState)}"${relation?` data-relation="${data(relation)}"`:''} aria-label="${data(`${safeTitle}. ${safeCopy}${safeMeta?` ${safeMeta}`:''}`)}"`;
}
function textAt(point,text,{className='cx-ecr-mandala__code',rotate=null,anchor='middle'}={}){
  return `<text class="${className}" x="${point.x.toFixed(2)}" y="${point.y.toFixed(2)}" text-anchor="${anchor}" dominant-baseline="middle"${rotate===null?'':` transform="rotate(${rotate.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)})"`}>${esc(text)}</text>`;
}
function selectedLabel(projection,g,label,code,visualState){
  if(visualState==='LOCKED_DEPTH')return '';
  const p=polarPoint(Math.max(82,(g.label?Math.hypot(g.label.x-PHI_MANDALA_CENTER.x,g.label.y-PHI_MANDALA_CENTER.y):200)-17),g.mid);
  return `<text class="cx-ecr-mandala__selected-label" x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle"><tspan>${esc(compact(label,isZh(projection)?11:17))}</tspan><tspan class="cx-ecr-mandala__selected-code" x="${p.x.toFixed(2)}" dy="11">${esc(code)}</tspan></text>`;
}
function ring(projection,{catalog,idKey,layerId,selectedId,labelFor,detailFor,metaFor,glyphFor=null,experienceState='PAID_DEPTH'}){
  const xs=arr(catalog),layer=PHI_MANDALA_LAYER_GEOMETRY[layerId];
  return xs.map(item=>{const id=item[idKey],selected=id===selectedId,g=ringSegmentGeometry(item.ordinal,xs.length,layer),title=labelFor(item),copy=detailFor(item),meta=metaFor?.(item)||'',baseGlyph=glyphFor?.(item)||id,visualState=stateFor({layer:layerId,selected,experienceState}),glyph=selected&&visualState!=='LOCKED_DEPTH'?`● ${baseGlyph}`:baseGlyph,titleText=`${selected?`${local(projection,'Selected','当前')} · `:''}${id} · ${title}`;
    return `<g class="cx-ecr-mandala__node cx-ecr-mandala__node--${layerId.toLowerCase()}${selected?' is-selected':''}${visualState==='LOCKED_DEPTH'?' is-locked-depth':''}${visualState!=='BACKGROUND'?' is-unlocked':''}" ${nodeAttrs({projection,layer:layerId,id,title,copy,meta,selected,visualState})}><path d="${g.path}"/><title>${esc(titleText)}</title>${textAt(g.label,glyph,{rotate:textRotation(g.mid),className:'cx-ecr-mandala__code'})}${selected?selectedLabel(projection,g,title,id,visualState):''}</g>`;}).join('');
}
function capabilityNetwork(projection,experienceState){
  const xs=arr(projection.catalogs?.capabilities),selected=projection.selected||{},question=by(projection.catalogs?.questions,'questionId',selected.questionId),qGeometry=question?ringSegmentGeometry(question.ordinal,arr(projection.catalogs?.questions).length,PHI_MANDALA_LAYER_GEOMETRY.Q16):null,qPoint=qGeometry?polarPoint(PHI_MANDALA_LAYER_GEOMETRY.Q16.innerRadius-5,qGeometry.mid):null;
  const nodes=xs.map(item=>{const primary=item.capabilityId===selected.primaryCapabilityId,supporting=arr(selected.supportingCapabilityIds).includes(item.capabilityId),g=circularNodeGeometry(item.ordinal,xs.length),title=isZh(projection)?item.labelZhHans:item.label,copy=primary?local(projection,'Primary response capability for the selected question.','当前基础问题的主要回应能力。'):supporting?local(projection,'Supporting response capability for the selected question.','当前基础问题的辅助回应能力。'):local(projection,'One of the nine governed response capabilities.','九项受治理回应能力之一。'),meta=primary?local(projection,'Primary','主要'):supporting?local(projection,'Supporting','辅助'):item.capabilityId,relation=primary?'PRIMARY':supporting?'SUPPORTING':'',visualState=stateFor({layer:'R9',selected:primary||supporting,relation,experienceState}),marker=primary?'★':supporting&&visualState!=='LOCKED_DEPTH'?'＋':'';
    return {item,g,primary,supporting,visualState,html:`<g class="cx-ecr-mandala__capability${primary?' is-primary':''}${supporting?' is-supporting':''}${visualState==='LOCKED_DEPTH'?' is-locked-depth':''}${visualState!=='BACKGROUND'?' is-unlocked':''}" ${nodeAttrs({projection,layer:'R9',id:item.capabilityId,title,copy,meta,selected:primary||supporting,relation,visualState})}><circle cx="${g.x.toFixed(2)}" cy="${g.y.toFixed(2)}" r="${PHI_MANDALA_LAYER_GEOMETRY.R9.nodeSize}"/><text x="${g.x.toFixed(2)}" y="${g.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle">${esc(`${marker}${item.capabilityId}`)}</text>${primary?`<text class="cx-ecr-mandala__capability-label" x="${g.x.toFixed(2)}" y="${(g.y+24).toFixed(2)}" text-anchor="middle">${esc(compact(title,isZh(projection)?10:15))}</text>`:''}</g>`};});
  const connectors=qPoint?nodes.filter(x=>x.primary||x.supporting).map(x=>{const c=connectorGeometry(qPoint,x.g),locked=x.visualState==='LOCKED_DEPTH';return `<line class="cx-ecr-mandala__relation${x.primary?' is-primary':' is-supporting'}${locked?' is-locked-depth':''}" x1="${c.x1.toFixed(2)}" y1="${c.y1.toFixed(2)}" x2="${c.x2.toFixed(2)}" y2="${c.y2.toFixed(2)}" aria-hidden="true"/>`;}).join(''):'';
  return connectors+nodes.map(x=>x.html).join('');
}
function driverProfile(projection,experienceState){
  const catalog=arr(projection.catalogs?.drivers),stack=arr(projection.selected?.driverPriority),index=new Map(stack.map(item=>[item.driverId,item])),max=Math.max(...stack.map(item=>n(item.baselineAffinity)||0),0.000001);
  return catalog.map(item=>{const d=index.get(item.driverId)||{},g=radialBarGeometry(item.ordinal,catalog.length,d.baselineAffinity,max),selected=d.rank===1,title=isZh(projection)?item.labelZhHans:item.label,copy=local(projection,'Birth-baseline affinity. This is not a claim about current Reality priority.','出生基线亲和度；这不是对当前现实优先级的判断。'),classLabel=d.rank===1?local(projection,'Primary baseline driver','首位基线驱动'):Number(d.rank)<=3?local(projection,'Supporting baseline driver','辅助基线驱动'):local(projection,'Background baseline driver','背景基线驱动'),technicalMeta=local(projection,`Rank ${d.rank??'—'} · distance ${deg(d.angularDistanceDegrees)}`,`第 ${d.rank??'—'} 位 · 距离 ${deg(d.angularDistanceDegrees)}`),visualState=stateFor({layer:'D12',selected,driverRank:d.rank,experienceState});
    return `<g class="cx-ecr-mandala__driver${selected?' is-selected':''}${visualState==='LOCKED_DEPTH'?' is-locked-depth':''}${visualState!=='BACKGROUND'?' is-unlocked':''}" ${nodeAttrs({projection,layer:'D12',id:item.driverId,title,copy,meta:classLabel,selected,visualState})} data-technical-meta="${data(technicalMeta)}"><line x1="${g.start.x.toFixed(2)}" y1="${g.start.y.toFixed(2)}" x2="${g.end.x.toFixed(2)}" y2="${g.end.y.toFixed(2)}"/><circle cx="${g.end.x.toFixed(2)}" cy="${g.end.y.toFixed(2)}" r="${selected?4:2.5}"/><title>${esc(`${selected?local(projection,'Top baseline driver','首位基线驱动'):'Driver'} · ${item.driverId} · ${title} · ${classLabel}`)}</title></g>`;}).join('');
}
function configurationRing(projection,experienceState){
  const xs=arr(projection.catalogs?.configurations),selectedId=projection.selected?.configurationId,layer=PHI_MANDALA_LAYER_GEOMETRY.H64;
  return xs.map(item=>{const selected=item.configurationId===selectedId,g=ringSegmentGeometry(item.ordinal,xs.length,layer),title=selected?(isZh(projection)?`${item.chineseNameZhHans} · ${item.configurationId}`:`${item.canonicalName} · ${item.configurationId}`):item.configurationId,copy=selected?local(projection,`Environment priority ${item.environmentPriorityMotionId}; embodied response ${item.embodiedResponseMotionId}.`,`环境优先运动 ${item.environmentPriorityMotionId}；载体回应运动 ${item.embodiedResponseMotionId}。`):local(projection,'One governed environment-response configuration position.','一个受治理的环境—回应构型位置。'),meta=selected?local(projection,`Upper ${item.upperTrigramRef} · Lower ${item.lowerTrigramRef}`,`上卦 ${item.upperTrigramRef} · 下卦 ${item.lowerTrigramRef}`):'',visualState=stateFor({layer:'H64',selected,experienceState});
    return `<g class="cx-ecr-mandala__node cx-ecr-mandala__node--h64${selected?' is-selected':''}${visualState==='LOCKED_DEPTH'?' is-locked-depth':''}${visualState!=='BACKGROUND'?' is-unlocked':''}" ${nodeAttrs({projection,layer:'H64',id:item.configurationId,title,copy,meta,selected,visualState})}><path d="${g.path}"/><title>${esc(`${selected?'● ':''}${title}`)}</title>${selected?selectedLabel(projection,g,isZh(projection)?item.chineseNameZhHans:item.canonicalName,item.configurationId,visualState):''}</g>`;}).join('');
}
function selectedPointForLayer(projection,layerId,id){
  if(!id)return null;
  if(layerId==='R9'){const item=by(projection.catalogs?.capabilities,'capabilityId',id);return item?circularNodeGeometry(item.ordinal,arr(projection.catalogs?.capabilities).length):null;}
  if(layerId==='D12'){const item=by(projection.catalogs?.drivers,'driverId',id);if(!item)return null;const stack=arr(projection.selected?.driverPriority),d=stack.find(x=>x.driverId===id),max=Math.max(...stack.map(x=>n(x.baselineAffinity)||0),0.000001);return radialBarGeometry(item.ordinal,arr(projection.catalogs?.drivers).length,d?.baselineAffinity,max).end;}
  const cfg={CC12:['contexts','contextId'],G16:['grammars','grammarId'],Q16:['questions','questionId'],M8:['motions','motionId'],H64:['configurations','configurationId'],A8:['activations','activationId']}[layerId];if(!cfg)return null;
  const item=by(projection.catalogs?.[cfg[0]],cfg[1],id),layer=PHI_MANDALA_LAYER_GEOMETRY[layerId];if(!item||!layer)return null;const g=ringSegmentGeometry(item.ordinal,arr(projection.catalogs?.[cfg[0]]).length,layer);return polarPoint((layer.innerRadius+layer.outerRadius)/2,g.mid);
}
function selectedCoordinatePath(projection,experienceState){
  const s=projection.selected||{},top=arr(s.driverPriority)[0];
  const ordered=[['CC12',s.contextId],['G16',s.grammarId],['Q16',s.questionId],['R9',s.primaryCapabilityId],['D12',top?.driverId],['M8',s.motionId],['H64',s.configurationId],['A8',s.activationId]];
  const visible=ordered.filter(([layer])=>!isFree(experienceState)||!['M8','H64','A8'].includes(layer));
  const pts=visible.map(([layer,id])=>selectedPointForLayer(projection,layer,id)).filter(Boolean);if(pts.length<2)return '';
  const d=pts.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const circles=pts.map((p,i)=>`<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${i===0?4:3}"/>`).join('');
  return `<g class="cx-ecr-mandala__selected-path" aria-hidden="true"><path d="${d}"/>${circles}</g>`;
}
function summaryRow(title,x,explanation){return `<div><dt>${esc(title)}</dt><dd><strong>${esc(x.primary)}</strong><p>${esc(explanation)}</p><small>${esc(x.secondary)}</small></dd></div>`;}
function selectedSummary(projection,experienceState){
  const selected=selectedCatalog(projection),s=projection.selected||{},d=arr(s.driverPriority)[0];
  const c=customerLayerLabel(projection,'CC12',selected.context),g=customerLayerLabel(projection,'G16',selected.grammar),q=customerLayerLabel(projection,'Q16',selected.question),r=customerLayerLabel(projection,'R9',selected.primaryCapability,{role:'PRIMARY'}),m=customerLayerLabel(projection,'M8',selected.motion),h=customerLayerLabel(projection,'H64',selected.configuration),a=customerLayerLabel(projection,'A8',selected.activation),driver=customerLayerLabel(projection,'D12',d);
  const primary=[summaryRow(local(projection,'Context','背景'),c,customerLayerExplanation(projection,'CC12',selected.context)),summaryRow(local(projection,'Grammar','语法'),g,customerLayerExplanation(projection,'G16',selected.grammar)),summaryRow(local(projection,'Baseline question','基础问题'),q,customerLayerExplanation(projection,'Q16',selected.question)),summaryRow(local(projection,'Primary capability','主要能力'),r,customerLayerExplanation(projection,'R9',selected.primaryCapability,{role:'PRIMARY'}))].join('');
  const deeper=[summaryRow(local(projection,'Top baseline driver','首位基线驱动'),driver,customerLayerExplanation(projection,'D12',d)),summaryRow(local(projection,'Change motion','变化运动'),m,customerLayerExplanation(projection,'M8',selected.motion)),summaryRow(local(projection,'Configuration','环境—回应构型'),h,customerLayerExplanation(projection,'H64',selected.configuration)),summaryRow(local(projection,'Activation stage','激活阶段'),a,customerLayerExplanation(projection,'A8',selected.activation))].join('');
  const supporting=arr(selected.supportingCapabilities).map(item=>{const x=customerLayerLabel(projection,'R9',item,{role:'SUPPORTING'});return `<span class="cx-ecr-mandala__support-chip"><strong>${esc(x.primary)}</strong><small>${esc(x.secondary)}</small></span>`;}).join('');
  const locked=isFree(experienceState)?`<div class="cx-ecr-mandala__depth-preview" data-ecr-mandala-depth-preview><strong>${esc(local(projection,'Three deeper layers are visible but not expanded in this snapshot.','这份快照已经让你看到主轴；另外三层深层结构仍保留在同一张 Mandala 中，但此处不展开个人化细节。'))}</strong><span>${esc(local(projection,'Change motion · environment-response configuration · activation stage','变化运动 · 环境—回应构型 · 激活阶段'))}</span></div>`:'';
  return `<div class="cx-ecr-mandala__summary" data-ecr-mandala-summary><p class="cx-eyebrow">${esc(local(projection,'YOUR COORDINATE AT A GLANCE','先看懂你的构型坐标'))}</p><p class="cx-ecr-mandala__summary-lead">${esc(local(projection,'Human-readable meaning comes first. Technical codes remain secondary so you can trace every highlighted Mandala position without having to learn the internal notation first.','先用自然语言理解每一层，再把技术编号作为追溯索引。你不需要先学会内部代码，才看得懂自己的 PHI 构型。'))}</p><dl>${primary}</dl>${supporting?`<div class="cx-ecr-mandala__supporting"><span>${esc(local(projection,'Supporting response resources','辅助回应资源'))}</span>${supporting}</div>`:''}${locked}<details class="cx-ecr-mandala__summary-deeper"${isFree(experienceState)?' data-locked-depth="true"':''}><summary>${esc(isFree(experienceState)?local(projection,'See what the deeper reading adds','看看深层读取还会增加什么'):local(projection,'Explore deeper structure','展开更深层结构'))}</summary>${isFree(experienceState)?`<p>${esc(local(projection,'This snapshot keeps the deeper personal selections closed. Paid access must be granted by server-side commerce authority before those details are delivered.','这份快照不会展开深层个人选择；正式付费产品必须先由服务端 Commerce authority 授权，再交付这些个人化细节。'))}</p>`:`<dl>${deeper}</dl>`}</details></div>`;
}
function topicLens(projection,topicProjection){
  const topics=arr(topicProjection?.topics).filter(x=>x?.topicId&&arr(x.nodeIds).length);if(!topics.length)return `<div class="cx-ecr-mandala__topic-lens" data-ecr-topic-lens-state="OVERVIEW_ONLY"><strong>${esc(local(projection,'Overview lens','总览视角'))}</strong><span>${esc(local(projection,'Topic lenses stay closed until a governed topic projection is supplied. The renderer will not guess Career, Relationship or other topic mappings.','在受治理的主题投影出现以前，只开放总览视角；renderer 不会自行猜测事业、关系或其他主题该高亮哪些节点。'))}</span></div>`;
  return `<div class="cx-ecr-mandala__topic-lens" data-ecr-topic-lens-state="READY"><button type="button" data-ecr-topic-lens="OVERVIEW" aria-pressed="true">${esc(local(projection,'Overview','总览'))}</button>${topics.map(x=>`<button type="button" data-ecr-topic-lens="${data(x.topicId)}" data-node-ids="${data(arr(x.nodeIds).join(' '))}" aria-pressed="false">${esc(isZh(projection)?x.labelZhHans||x.label:x.label||x.labelZhHans||x.topicId)}</button>`).join('')}</div>`;
}
function valueLadder(projection,experienceState){return `<div class="cx-ecr-mandala__value-ladder" data-ecr-mandala-value-ladder><span class="is-current">${esc(local(projection,'Snapshot','快照'))}</span><span${isFree(experienceState)?' class="is-locked"':''}>${esc(local(projection,'Deep structure','深层结构'))}</span><span class="is-reality">${esc(local(projection,'Reality','现实对照'))}</span></div>`;}
function fullscreenControls(projection){return `<div class="cx-ecr-mandala__fullscreen-controls"><button type="button" data-ecr-mandala-fullscreen-open aria-expanded="false">${esc(local(projection,'Explore full screen','全屏探索 Mandala'))}</button><button type="button" data-ecr-mandala-fullscreen-close hidden>${esc(local(projection,'Close full screen','退出全屏'))}</button></div>`;}

export function renderPhiMandalaVisual(visual,{experienceState='PAID_DEPTH',topicProjection=null}={}){
  const projection=visual?.payload;if(projection?.schemaVersion!==SCHEMA)return '';
  const access=experience(experienceState),selected=projection.selected||{},contexts=arr(projection.catalogs?.contexts),grammars=arr(projection.catalogs?.grammars),questions=arr(projection.catalogs?.questions),motions=arr(projection.catalogs?.motions),activations=arr(projection.catalogs?.activations),context=by(contexts,'contextId',selected.contextId),question=by(questions,'questionId',selected.questionId),title=visual?.title||local(projection,'Your PHI Configuration','你的 PHI 构型'),defaultDetailTitle=context?(isZh(projection)?`${context.labelZhHans} · ${context.contextId}`:`${context.label} · ${context.contextId}`):title,defaultDetailCopy=question?(isZh(projection)?question.questionZhHans:question.question):local(projection,'Explore a layer to see how the selected coordinate is organized.','聚焦任一层，查看这次构型如何被组织。');
  const contextRing=ring(projection,{catalog:contexts,idKey:'contextId',layerId:'CC12',selectedId:selected.contextId,labelFor:item=>isZh(projection)?item.labelZhHans:item.label,detailFor:item=>local(projection,`Longitude interval ${item.startLongitudeInclusive}° to <${item.endLongitudeExclusive}°. Position label only; no zodiac personality meaning is imported.`,`黄经区间 ${item.startLongitudeInclusive}° 至 <${item.endLongitudeExclusive}°。这里只是位置名称，不导入星座人格意义。`),metaFor:item=>item.contextId,glyphFor:item=>`${zodiacGlyph[item.zodiacCode]||''} ${item.contextId}`.trim(),experienceState:access});
  const grammarRing=ring(projection,{catalog:grammars,idKey:'grammarId',layerId:'G16',selectedId:selected.grammarId,labelFor:item=>isZh(projection)?item.labelZhHans:item.label,detailFor:item=>local(projection,'One of sixteen governed Reality Grammar positions.','十六个受治理现实语法位置之一。'),metaFor:item=>item.grammarId,glyphFor:item=>item.grammarId,experienceState:access});
  const questionRing=ring(projection,{catalog:questions,idKey:'questionId',layerId:'Q16',selectedId:selected.questionId,labelFor:item=>isZh(projection)?item.questionZhHans:item.question,detailFor:item=>local(projection,'The baseline question paired to the same Grammar ordinal.','与同序号现实语法配对的基础问题。'),metaFor:item=>item.questionId,glyphFor:item=>item.questionId,experienceState:access});
  const motionRing=ring(projection,{catalog:motions,idKey:'motionId',layerId:'M8',selectedId:selected.motionId,labelFor:item=>isZh(projection)?item.labelZhHans:item.label,detailFor:item=>local(projection,'A PHI OS organization-change motion. Trigram identity is reused without importing I Ching fortune meaning.','PHI OS 的组织变化运动；只复用卦象身份，不导入易经吉凶意义。'),metaFor:item=>`${item.motionId} · ${item.trigramRef}`,glyphFor:item=>`${trigramGlyph[item.trigramCode]||''}${item.motionId}`,experienceState:access});
  const activationRing=ring(projection,{catalog:activations,idKey:'activationId',layerId:'A8',selectedId:selected.activationId,labelFor:item=>isZh(projection)?item.labelZhHans:item.label,detailFor:item=>local(projection,'Runtime activation stage. This is not a good/bad score or guaranteed event.','运行激活阶段；不是吉凶分数，也不是必然事件。'),metaFor:item=>item.activationId,glyphFor:item=>item.activationId,experienceState:access});
  const center=PHI_MANDALA_CENTER,token=safeToken(projection.projectionId),titleId=`${token}-title`,descId=`${token}-desc`,detailId=`${token}-detail`;
  const guides=[338,300,262,218,184,148,118,84].map(r=>`<circle class="cx-ecr-mandala__guide" cx="${center.x}" cy="${center.y}" r="${r}"/>`).join('');
  const svg=`<svg class="cx-ecr-mandala__svg" data-ecr-phi-mandala="true" data-experience-state="${esc(access)}" viewBox="0 0 ${PHI_MANDALA_VIEWBOX_SIZE} ${PHI_MANDALA_VIEWBOX_SIZE}" role="img" aria-labelledby="${esc(titleId)} ${esc(descId)}" preserveAspectRatio="xMidYMid meet"><title id="${esc(titleId)}">${esc(title)}</title><desc id="${esc(descId)}">${esc(local(projection,'Interactive PHI Configuration map. Keyboard users can focus each governed segment; selected segments are also marked with symbols, not color alone.','互动 PHI 构型图。键盘用户可以逐一聚焦受治理分区；当前选中位置除了颜色，也使用符号标记。'))}</desc><circle class="cx-ecr-mandala__bg" cx="${center.x}" cy="${center.y}" r="382"/>${guides}${selectedCoordinatePath(projection,access)}${contextRing}${grammarRing}${questionRing}${capabilityNetwork(projection,access)}${driverProfile(projection,access)}${motionRing}${configurationRing(projection,access)}${activationRing}<circle class="cx-ecr-mandala__core" cx="${center.x}" cy="${center.y}" r="${PHI_MANDALA_LAYER_GEOMETRY.CORE.radius}"/><text class="cx-ecr-mandala__core-title" x="${center.x}" y="${center.y-16}" text-anchor="middle">${esc(local(projection,'YOUR PHI CONFIGURATION','你的 PHI 构型'))}</text><text class="cx-ecr-mandala__core-meta" x="${center.x}" y="${center.y+6}" text-anchor="middle">${esc(`${local(projection,'Solar anchor','太阳锚点')} ${deg(projection.anchor?.longitude)}`)}</text><text class="cx-ecr-mandala__core-meta" x="${center.x}" y="${center.y+24}" text-anchor="middle">${esc(local(projection,'Meaning first · codes second','先读意义 · 编号追溯'))}</text></svg>`;
  return `<section id="ecr-section-01" class="cx-ecr-mandala" data-ecr-mandala-root="true" data-experience-state="${esc(access)}" tabindex="-1"><header><p class="cx-eyebrow">${esc(local(projection,'PHI OS ORIGINAL · INTERACTIVE CONFIGURATION MAP','PHI OS 原生体系 · 互动构型图'))}</p><h3>${esc(title)}</h3><p>${esc(local(projection,'Start with the highlighted path. The complete Mandala remains available for exploration, while technical codes stay secondary to human-readable meaning.','先从高亮构型路径开始。完整 Mandala 仍可继续探索，但技术编号退居第二层，让自然语言先帮助你看懂重点。'))}</p>${valueLadder(projection,access)}</header>${selectedSummary(projection,access)}${topicLens(projection,topicProjection)}<details class="cx-ecr-mandala__explore" data-ecr-mandala-explore open><summary>${esc(local(projection,'Explore the complete PHI Mandala','查看完整 PHI Mandala'))}</summary>${fullscreenControls(projection)}<div class="cx-ecr-mandala__viewport" data-ecr-mandala-scroll-region tabindex="0" aria-label="${esc(local(projection,'Scrollable full PHI Mandala','可滚动的完整 PHI Mandala'))}">${svg}</div></details><aside id="${esc(detailId)}" class="cx-ecr-mandala__detail" data-ecr-mandala-detail aria-live="polite" aria-atomic="true"><strong data-ecr-mandala-detail-title>${esc(defaultDetailTitle)}</strong><p data-ecr-mandala-detail-copy>${esc(defaultDetailCopy)}</p><small data-ecr-mandala-detail-meta>${esc(`${local(projection,'Solar anchor','太阳锚点')} ${deg(projection.anchor?.longitude)} · ${local(projection,'Technical indices remain visible for traceability.','保留技术编号以便追溯。')}`)}</small></aside><div class="cx-ecr-mandala__cross-evidence-slot" data-ecr-mandala-cross-evidence-slot hidden></div><div class="cx-ecr-mandala__reality-slot" data-ecr-mandala-reality-slot hidden></div><p class="cx-meta">${esc(local(projection,'The diagram calculates visual geometry only; it does not recalculate your ECR result. Calculated astronomical position and PHI OS first-party interpretive layer mappings are not scientific personality facts or guaranteed outcomes.','本图只计算视觉几何，不会重新计算你的 ECR 结果。天文位置属于计算结果；各层映射属于 PHI OS 原生解释约定，不是科学人格事实或必然结果。'))}</p></section>`;
}

function activate(root,node){
  if(!root||!node)return;
  root.querySelectorAll('[data-ecr-mandala-node].is-active').forEach(item=>item.classList.remove('is-active'));
  root.querySelectorAll('[data-ecr-mandala-node][aria-pressed="true"]').forEach(item=>item.setAttribute('aria-pressed','false'));
  node.classList.add('is-active');node.setAttribute('aria-pressed','true');
  const detail=root.querySelector('[data-ecr-mandala-detail]');if(!detail)return;
  const title=detail.querySelector('[data-ecr-mandala-detail-title]'),copy=detail.querySelector('[data-ecr-mandala-detail-copy]'),meta=detail.querySelector('[data-ecr-mandala-detail-meta]');
  if(title)title.textContent=node.dataset.detailTitle||node.dataset.nodeId||'';
  if(copy)copy.textContent=node.dataset.detailCopy||'';
  if(meta)meta.textContent=node.dataset.detailMeta||'';
}
function configureResponsiveExplore(root){
  const explore=root?.querySelector?.('[data-ecr-mandala-explore]');if(!explore)return;
  const compact=globalThis.matchMedia?.('(max-width:620px)')?.matches===true;
  if(compact)explore.removeAttribute('open');else explore.setAttribute('open','');
}
function configureTopicLens(root){
  const lens=root?.querySelector?.('[data-ecr-topic-lens-state="READY"]');if(!lens)return;
  const nodes=[...root.querySelectorAll('[data-ecr-mandala-node]')];
  lens.querySelectorAll('[data-ecr-topic-lens]').forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.ecrTopicLens||'OVERVIEW',ids=new Set(String(button.dataset.nodeIds||'').split(/\s+/).filter(Boolean));
    lens.querySelectorAll('[data-ecr-topic-lens]').forEach(x=>x.setAttribute('aria-pressed',x===button?'true':'false'));
    nodes.forEach(node=>node.classList.toggle('is-topic-muted',id!=='OVERVIEW'&&!ids.has(node.dataset.nodeId)));root.dataset.topicLens=id;
  }));
}
function setFullscreen(root,on,trigger=null){
  root.classList.toggle('is-mandala-fullscreen',on);const open=root.querySelector('[data-ecr-mandala-fullscreen-open]'),close=root.querySelector('[data-ecr-mandala-fullscreen-close]');if(open)open.setAttribute('aria-expanded',on?'true':'false');if(close)close.hidden=!on;
  if(on){root._ecrMandalaFullscreenTrigger=trigger||open;close?.focus?.();}else{root._ecrMandalaFullscreenTrigger?.focus?.();root._ecrMandalaFullscreenTrigger=null;}
}
function configureFullscreen(root){
  const open=root?.querySelector?.('[data-ecr-mandala-fullscreen-open]'),close=root?.querySelector?.('[data-ecr-mandala-fullscreen-close]');if(!open||!close)return;
  open.addEventListener('click',()=>setFullscreen(root,true,open));close.addEventListener('click',()=>setFullscreen(root,false));
}
export function installPhiMandalaInteractions(scope){
  const roots=[...scope?.querySelectorAll?.('[data-ecr-mandala-root]')||[]];
  for(const root of roots){
    if(root.dataset.ecrMandalaInteractionInstalled==='true')continue;
    const onTarget=event=>{const node=event.target.closest?.('[data-ecr-mandala-node]');if(node&&root.contains(node))activate(root,node)};
    const onKey=event=>{if(event.key==='Escape'&&root.classList.contains('is-mandala-fullscreen')){event.preventDefault();setFullscreen(root,false);return}const node=event.target.closest?.('[data-ecr-mandala-node]');if(!node||!root.contains(node))return;if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(root,node)}else if(event.key==='Escape'){const initial=root.querySelector('[data-ecr-mandala-node][data-selected="true"]');if(initial){event.preventDefault();activate(root,initial);initial.focus?.()}}};
    root.addEventListener('pointerover',onTarget);root.addEventListener('focusin',onTarget);root.addEventListener('click',onTarget);root.addEventListener('keydown',onKey);
    root.dataset.ecrMandalaInteractionInstalled='true';configureResponsiveExplore(root);configureTopicLens(root);configureFullscreen(root);
    const initial=root.querySelector('[data-ecr-mandala-node][data-visual-state="PRIMARY_ACTIVE"]');if(initial)activate(root,initial);
  }
  return roots.length;
}
function relationText(comparison,relation){const zh=comparison?.locale==='zh-Hans';return ({SHARED_OBSERVATION_DOMAIN:zh?'共同观察领域':'Shared observation domain',COMPLEMENTARY_LENSES:zh?'互补视角':'Complementary lenses',NO_DIRECT_EQUIVALENCE:zh?'没有直接对应':'No direct equivalent'})[relation]||relation;}
export function mountPhiMandalaCrossEvidenceRail(comparison,scope){
  const root=scope?.querySelector?.('[data-ecr-mandala-root]')||scope?.closest?.('[data-ecr-mandala-root]');if(!root||comparison?.publicationState!=='COMPARISON_IR_READY')return 0;const slot=root.querySelector('[data-ecr-mandala-cross-evidence-slot]');if(!slot)return 0;
  const dims=arr(comparison.dimensions).filter(x=>x?.status&&x.status!=='NO_SOURCE_MATERIAL').slice(0,4);if(!dims.length)return 0;
  slot.hidden=false;slot.innerHTML=`<div class="cx-ecr-mandala__rail"><p class="cx-eyebrow">${esc(local(comparison,'CROSS-EVIDENCE','跨证据对照'))}</p><strong>${esc(local(comparison,'Another confirmed lens is available','另一个已确认视角可以一起查看'))}</strong><div>${dims.map(x=>`<a href="#ecr-hd-dimension-${safeToken(x.dimensionId)}"><span>${esc(x.label||x.dimensionId||'')}</span><small>${esc(relationText(comparison,x.relationClass))}</small></a>`).join('')}</div><p>${esc(local(comparison,'This rail summarizes the governed comparison only. It does not create field equivalence or agreement.','这里仅摘要受治理的比较结果，不会建立字段等价或宣称两个体系一致。'))}</p></div>`;return dims.length;
}
export function mountPhiMandalaRealityBridgeVisual(bridge,scope){
  const root=scope?.querySelector?.('[data-ecr-mandala-root]')||scope?.closest?.('[data-ecr-mandala-root]');if(!root||bridge?.state!=='OBSERVATION_BRIDGE_READY')return 0;const slot=root.querySelector('[data-ecr-mandala-reality-slot]');if(!slot)return 0;
  const prompts=arr(bridge.prompts).filter(x=>x?.observationQuestion).slice(0,3);if(!prompts.length)return 0;
  slot.hidden=false;slot.innerHTML=`<div class="cx-ecr-mandala__reality-visual"><p class="cx-eyebrow">${esc(local(bridge,'REALITY BRIDGE','现实对照'))}</p><strong>${esc(local(bridge,'Take the reading back to lived experience','把读取带回真实经验'))}</strong><ol>${prompts.map(x=>`<li><span>${esc(x.label||x.dimensionId||'')}</span><p>${esc(x.observationQuestion)}</p></li>`).join('')}</ol><a href="#ecr-section-10">${esc(local(bridge,'Continue to Reality Bridge','继续进入现实对照'))}</a></div>`;return prompts.length;
}
export default Object.freeze({renderPhiMandalaVisual,installPhiMandalaInteractions,mountPhiMandalaCrossEvidenceRail,mountPhiMandalaRealityBridgeVisual});
