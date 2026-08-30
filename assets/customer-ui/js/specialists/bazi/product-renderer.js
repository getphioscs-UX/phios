import {arr,esc,tr} from '../../surfaces/runtime-ui.js';
import {
 isBaziNativeProduct,
 renderBaziProfessionalStructure,
 renderBaziFiveElementSurface,
 renderBaziPatternSurface,
 renderBaziSchoolSurface,
 renderBaziTimingSurface,
 renderBaziCustomerSafeStructureGraph,
 renderBaziRealityComparisonSurface
} from '../../surfaces/bazi-professional-reading.js';

const NAV=Object.freeze([
 ['overview','Overview','总览'],
 ['chart','Chart','命盘'],
 ['elements','Five Elements & Ten Gods','五行与十神'],
 ['core','Core structure','核心结构'],
 ['pattern','Pattern & balance','格局与平衡'],
 ['relationships','Relationships','关系结构'],
 ['timing','Da Yun & Liu Nian','大运流年'],
 ['themes','Life themes','人生主题'],
 ['reality','Reality comparison','现实对照'],
 ['technical','Sources & technical','来源技术']
]);
const sectionByCode=(native,code)=>arr(native?.readingSections).find(x=>x.code===code)||null;
const INTERNAL_CODE_ZH=Object.freeze({JIA:'甲',YI:'乙',BING:'丙',DING:'丁',WU:'戊',JI:'己',GENG:'庚',XIN:'辛',REN:'壬',GUI:'癸',ZI:'子',CHOU:'丑',YIN:'寅',MAO:'卯',CHEN:'辰',SI:'巳',WEI:'未',SHEN:'申',YOU:'酉',XU:'戌',HAI:'亥'});
const customerText=value=>String(value??'').replace(/\b(JIA|YI|BING|DING|WU|JI|GENG|XIN|REN|GUI|ZI|CHOU|YIN|MAO|CHEN|SI|WEI|SHEN|YOU|XU|HAI)\b/g,code=>INTERNAL_CODE_ZH[code]||code).replace(/Full Production/gi,'').replace(/Reading IR/gi,tr('current chart reading','当前命盘解读')).replace(/semantic owners?/gi,tr('whole-chart themes','整盘主题')).replace(/\badmitted\b/gi,tr('established','已建立')).replace(/\bauthority\b/gi,tr('source basis','来源依据')).replace(/\bgoverned\b/gi,tr('current','当前')).replace(/已准入/g,'已建立').replace(/准入/g,'确认').replace(/受治理/g,'当前').replace(/权威/g,'来源依据').replace(/语义\s*owner/gi,'整盘主题').replace(/\bW\d+[A-Z0-9.-]*\b/gi,'').replace(/\s{2,}/g,' ').trim();
const paragraphList=section=>arr(section?.paragraphs).map(p=>`<p>${esc(customerText(p))}</p>`).join('');
const simpleState=value=>{
 const x=String(value||'');
 if(x==='SUPPORTED'||x==='QUALIFIED')return tr('Confirmed','已确认');
 if(x==='SCHOOL_VIEW_OPEN'||x==='MULTI_SCHOOL')return tr('Different school readings','存在不同学派解释');
 return tr('No strong conclusion yet','暂不作强判断');
};
const functionCopy=Object.freeze({
 PEER:[['Peers & self-support','同类与自我支持'],['How you share strength, compete, cooperate and keep your own position.','观察同类支持、协作竞争与自我立场怎样进入整盘。']],
 RESOURCE:[['Learning & support','学习与支持'],['How the chart receives, absorbs, protects and turns support into capacity.','观察吸收、学习、支持与承接怎样进入整盘。']],
 OUTPUT:[['Expression & output','表达与输出'],['How ideas, skills, creation and outward expression leave the Day Master.','观察想法、技能、创造与表达怎样从日主向外展开。']],
 WEALTH:[['Resources & exchange','资源与交换'],['How the chart handles what the Day Master can manage, exchange or allocate.','观察日主能够管理、交换与配置的资源结构。']],
 OFFICER:[['Responsibility & rules','责任与规则'],['How standards, pressure, responsibility and external structure act on the Day Master.','观察标准、压力、责任与外部规则怎样作用于日主。']],
 UNAVAILABLE:[['Theme to be clarified','主题待继续核对'],['This function needs more chart context before it becomes useful.','这一功能还要结合更多命盘信息才适合展开。']]
});

function navigationHtml(){
 return `<div class="cx-bazi-w12-nav" aria-label="${esc(tr('BaZi reading sections','八字解读章节'))}">${NAV.map(([key,en,zh],index)=>`<button type="button" data-ppr-r3-nav-target="#bazi-section-${key}" aria-current="${index===0?'true':'false'}"><span>${String(index+1).padStart(2,'0')}</span><strong>${esc(tr(en,zh))}</strong></button>`).join('')}</div>`;
}

function renderOverview(native){
 const s=native.summary||{},pillars=arr(native?.structuralModel?.pillars),day=pillars.find(x=>x.position==='DAY'),month=pillars.find(x=>x.position==='MONTH'),elements=arr(native?.professionalModules?.fiveElements?.items).slice().sort((a,b)=>b.rawRatio-a.rawRatio),top=elements[0];
 return `<section id="bazi-section-overview" class="cx-bazi-w12-section cx-bazi-w12-overview" tabindex="-1"><header class="cx-bazi-w12-hero"><p class="cx-eyebrow">${esc(tr('BAZI · YOUR CHART','八字 · 你的命盘'))}</p><h1>${esc(tr('Start with what this chart is actually made of.','先看清这张命盘由什么组成。'))}</h1><p class="cx-bazi-w12-subtitle">${esc(tr('Day Master, month command, Five Elements, Ten Gods, relationships, pattern and timing are read as one connected chart.','日主、月令、五行、十神、干支关系、格局与时间层，会放在同一张盘里一起解释。'))}</p></header><div class="cx-bazi-overview-facts"><article><small>${esc(tr('Day Master','日主'))}</small><strong>${esc(day?.stem?.zh||'—')}</strong><p>${esc(tr('The central reference point used to read the rest of the chart.','后续五行、十神与关系结构都以日主作为参照。'))}</p></article><article><small>${esc(tr('Month command','月令'))}</small><strong>${esc(month?.branch?.zh||'—')}</strong><p>${esc(tr('The seasonal background that changes how raw element counts should be understood.','月令提供季节背景，会改变原始五行数量应该怎样理解。'))}</p></article><article><small>${esc(tr('Most visible raw element','原始结构中较多的五行'))}</small><strong>${esc(top?`${tr(top.element==='WOOD'?'Wood':top.element==='FIRE'?'Fire':top.element==='EARTH'?'Earth':top.element==='METAL'?'Metal':'Water',top.element==='WOOD'?'木':top.element==='FIRE'?'火':top.element==='EARTH'?'土':top.element==='METAL'?'金':'水')} ${top.rawRatio}%`:'—')}</strong><p>${esc(tr('This is composition, not a final strength verdict; the next section applies the seasonal correction.','这是组成占比，不是最终旺衰判断；下一章会加入月令校正。'))}</p></article></div>${arr(s.keyPoints).length?`<section class="cx-bazi-overview-points"><header><h2>${esc(tr('Three things worth noticing first','先抓住三个重点'))}</h2></header><div>${arr(s.keyPoints).slice(0,3).map((point,index)=>`<article><span>${String(index+1).padStart(2,'0')}</span><p>${esc(customerText(point))}</p></article>`).join('')}</div></section>`:''}</section>`;
}
function renderChart(native){return `<section id="bazi-section-chart" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('FOUR PILLARS','命盘'))}</p><h2>${esc(tr('See the stems, branches, Ten-God roles and hidden stems before reading conclusions.','先把天干、地支、十神角色与藏干看清，再进入解释。'))}</h2></header>${renderBaziProfessionalStructure(native,{embedded:true})}</section>`;}
function renderElements(native){return `<section id="bazi-section-elements" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('FIVE ELEMENTS & TEN GODS','五行与十神'))}</p><h2>${esc(tr('Turn the chart into a visual composition you can actually read.','把命盘转成一眼能读懂的五行与十神结构。'))}</h2></header>${renderBaziFiveElementSurface(native,{embedded:true})}</section>`;}
function renderCore(native){return `<section id="bazi-section-core" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('CORE STRUCTURE','核心结构'))}</p><h2>${esc(tr('See how the major layers of the chart connect before isolating any one symbol.','先看命局各层怎样彼此关联，再判断单一符号的重要性。'))}</h2></header>${renderBaziCustomerSafeStructureGraph(native,{embedded:true})}</section>`;}
function renderPattern(native){return `<section id="bazi-section-pattern" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('PATTERN & BALANCE','格局与平衡'))}</p><h2>${esc(tr('Compare formation, weakening and rescue conditions, then keep the three school views distinct.','把成格、败格、救应条件放在同一章核对，同时保留不同学派的读法。'))}</h2></header>${renderBaziPatternSurface(native,{embedded:true})}${renderBaziSchoolSurface(native,{embedded:true})}</section>`;}
function renderRelationships(native){
 const section=sectionByCode(native,'RELATIONSHIPS');
 return `<section id="bazi-section-relationships" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('RELATIONSHIPS','关系结构'))}</p><h2>${esc(tr('Read combinations, clashes, punishments, harms and breaks as chart relationships—not isolated labels.','合、冲、刑、害、破要放回整盘关系里读，不只列出名称。'))}</h2></header><article class="cx-bazi-relationship-reading"><span>${esc(simpleState(section?.state))}</span><h3>${esc(customerText(section?.title||tr('Natal relationship structure','原局关系结构')))}</h3>${paragraphList(section)}<p class="cx-bazi-relationship-note">${esc(tr('A relationship tells you which parts of the chart pull together, oppose, constrain or disturb one another. Its lived expression still depends on the Ten-God roles and the wider chart.','干支关系告诉你命盘哪些部分会相合、相冲、牵制或扰动；落到现实怎样表现，还要继续结合十神角色与整盘结构。'))}</p></article></section>`;
}
function renderTiming(native){return `<section id="bazi-section-timing" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('DA YUN & LIU NIAN','大运与流年'))}</p><h2>${esc(tr('See which natal themes become more active in different periods.','看原局哪些主题会在不同阶段被带动。'))}</h2></header>${renderBaziTimingSurface(native,{embedded:true})}</section>`;}
function renderThemes(native){
 const items=arr(native?.professionalModules?.fiveElements?.items).slice().sort((a,b)=>b.rawRatio-a.rawRatio);
 return `<section id="bazi-section-themes" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('LIFE THEMES','人生主题'))}</p><h2>${esc(tr('Use the chart’s five functional groups as entry points—not as one-symbol life verdicts.','用五组功能进入人生主题，而不是拿一个符号直接下结论。'))}</h2><p>${esc(tr('These cards show which functional families are more visible in the raw chart. Career, wealth and relationship conclusions still need Ten-God detail, pattern and relationships together.','这些卡片先告诉你哪些功能组在原始结构里更显眼；事业、财富与关系等个案结论，仍要结合具体十神、格局与干支关系。'))}</p></header><div class="cx-bazi-theme-grid">${items.map(item=>{const copy=functionCopy[item.dayMasterFunction]||functionCopy.UNAVAILABLE;return `<article data-function="${esc(item.dayMasterFunction||'UNAVAILABLE')}" data-element="${esc(item.element)}"><header><span>${esc(`${item.rawRatio}%`)}</span><h3>${esc(tr(copy[0][0],copy[0][1]))}</h3></header><p>${esc(tr(copy[1][0],copy[1][1]))}</p><small>${esc(tr('Raw Five-Element family before Ten-God detail and seasonal weighting','十神细分与季节权重前的五行功能组'))}</small></article>`}).join('')}</div></section>`;
}
function renderReality(native){return `<section id="bazi-section-reality" class="cx-bazi-w12-section" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('REALITY COMPARISON','现实对照'))}</p><h2>${esc(tr('After the BaZi reading, compare the important themes with lived experience.','先完成八字解释，再把真正重要的主题带回现实对照。'))}</h2></header>${renderBaziRealityComparisonSurface(native,{embedded:true})}</section>`;}
function renderTechnical(native,product){
 const e=native.evidence||{},d=native.publicationDecision||{},g=native.governance||{},graph=native.professionalModules?.customerSafeGraph||{};
 return `<section id="bazi-section-technical" class="cx-bazi-w12-technical" tabindex="-1"><header class="cx-bazi-w12-section-head"><p class="cx-eyebrow">${esc(tr('SOURCES & TECHNICAL','来源技术'))}</p><h2>${esc(tr('Technical lineage stays here for readers who want to inspect it.','需要核对版本、来源与技术边界时，再到这里查看。'))}</h2></header><div class="cx-bazi-technical-summary"><article><small>${esc(tr('Product version','产品版本'))}</small><strong>${esc(native.productVersion||'')}</strong></article><article><small>${esc(tr('Evidence records','证据记录'))}</small><strong>${esc(e.evidenceCount??'—')}</strong></article><article><small>${esc(tr('Authority records','权威记录'))}</small><strong>${esc(e.authorityCount??'—')}</strong></article><article><small>${esc(tr('Publication state','发布状态'))}</small><strong>${esc(d.status||product.state||'')}</strong></article></div><details><summary>${esc(tr('Reading lineage','读取溯源'))}</summary><dl><dt>${esc(tr('Report digest','报告指纹'))}</dt><dd><code>${esc(native.summary?.reportDigest||'')}</code></dd><dt>${esc(tr('Natal projection','出生投射'))}</dt><dd><code>${esc(e.sourceNatalProjectionId||'')}</code></dd><dt>${esc(tr('Structure graph digest','结构图指纹'))}</dt><dd><code>${esc(graph.sourceGraphDigest||'')}</code></dd><dt>${esc(tr('Temporal state','时间状态'))}</dt><dd>${esc(native.temporalContext?.state||'UNAVAILABLE')}</dd></dl></details><details><summary>${esc(tr('Interpretation boundaries','解释边界'))}</summary><ul><li>${esc(tr('Raw Five-Element ratios are composition counts, not strength scores.','五行原始占比是结构计数，不等同旺衰分数。'))}</li><li>${esc(tr('School-qualified views remain distinct rather than silently merged.','不同学派的结论保持区分，不静默合并。'))}</li><li>${esc(tr('Reality-comparison responses do not rewrite the Four-Pillar calculation.','现实对照回答不会改写四柱计算。'))}</li><li>${esc(g.sharedPersonalRealitySurfaceModified===false?tr('The shared My Reality surface remains unchanged.','共用 My Reality 页面保持不变。'):tr('Shared-surface state is not asserted here.','这里不宣称共用页面状态。'))}</li></ul></details></section>`;
}

function readingHtml(native){return `<article class="cx-bazi-w12-workspace" data-ppr-c1-w12-bazi-workspace="true" data-bazi-cx-pro-w0-w2="true" data-ppr-whole-chart-first="true">${renderOverview(native)}${renderChart(native)}${renderElements(native)}${renderCore(native)}${renderPattern(native)}${renderRelationships(native)}${renderTiming(native)}${renderThemes(native)}${renderReality(native)}</article>`;}

export function renderBaziProduct({product}={}){
 const native=product?.sourceProduct;
 if(!isBaziNativeProduct(native))return Object.freeze({status:'NOT_HANDLED',reason:'BAZI_METHOD_NATIVE_PRODUCT_REQUIRED'});
 const html=readingHtml(native);if(!html)return Object.freeze({status:'NOT_HANDLED',reason:'BAZI_SPECIALIST_HTML_EMPTY'});
 return Object.freeze({status:'RENDERED',navigationHtml:navigationHtml(),visualHtml:'',readingHtml:html,technicalHtml:renderTechnical(native,product)});
}
export default Object.freeze({renderBaziProduct});
