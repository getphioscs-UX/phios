import {arr,esc,tr} from './runtime-ui.js';

const ELEMENT={WOOD:['Wood','木'],FIRE:['Fire','火'],EARTH:['Earth','土'],METAL:['Metal','金'],WATER:['Water','水']};
const POLARITY={YANG:['Yang','阳'],YIN:['Yin','阴']};
const POSITION={YEAR:['Year pillar','年柱'],MONTH:['Month pillar','月柱'],DAY:['Day pillar','日柱'],HOUR:['Hour pillar','时柱']};
const STATE={SUPPORTED:['Established','已建立'],QUALIFIED:['Qualified','有条件成立'],BOUNDED_BY_UNKNOWN:['Evidence established · conclusion open','证据明确 · 结论保留'],ALTERNATIVES_OPEN:['Multiple paths remain open','多条路径并存'],SCHOOL_VIEW_OPEN:['School view remains open','分学派保持开放'],COUNTERBALANCED:['Support and counter-evidence coexist','支持与反证并存'],PARTIAL:['Partially available','部分可读'],OPEN:['Open','仍待确认']};

const label=(map,key,fallback='')=>{const x=map[String(key||'').toUpperCase()];return x?tr(x[0],x[1]):fallback||String(key||'')};
const customerState=value=>label(STATE,value,tr('Open','仍待确认'));
const element=value=>label(ELEMENT,value,'—');
const polarity=value=>label(POLARITY,value,'—');
const position=value=>label(POSITION,value,'—');
const hiddenText=item=>{const stem=item?.stemZh||'—';const tg=tr(item?.tenGodEn||item?.tenGodZh||'',item?.tenGodZh||item?.tenGodEn||'');return tg?`${stem} · ${tg}`:stem};

export function isBaziNativeProduct(product){return product?.schemaVersion==='PHI-OS-METHOD-NATIVE-CUSTOMER-READING-v1.0.0'&&product?.methodId==='BZR'&&product?.publicationDecision?.customerPublishable===true}

function pillarCard(pillar){
 const stem=pillar?.stem||{},branch=pillar?.branch||{},role=pillar?.stemRole||{};
 const isDay=pillar?.position==='DAY',isMonth=pillar?.position==='MONTH';
 const roleText=tr(role.tenGodEn||role.tenGodZh||'',role.tenGodZh||role.tenGodEn||'');
 return `<article class="cx-bazi-pillar" data-pillar="${esc(pillar?.position||'')}"${isDay?' data-day-master="true"':''}${isMonth?' data-month-command="true"':''}><header><span>${esc(position(pillar?.position))}</span>${isDay?`<em>${esc(tr('Day Master','日主'))}</em>`:isMonth?`<em>${esc(tr('Month command','月令'))}</em>`:''}</header><div class="cx-bazi-pillar__stem"><small>${esc(roleText||tr('Heavenly stem','天干'))}</small><strong>${esc(stem.zh||'—')}</strong><span>${esc([element(stem.element),polarity(stem.polarity)].filter(Boolean).join(' · '))}</span></div><div class="cx-bazi-pillar__branch"><small>${esc(tr('Earthly branch','地支'))}</small><strong>${esc(branch.zh||'—')}</strong><span>${esc(element(branch.element))}</span></div><div class="cx-bazi-pillar__hidden"><small>${esc(tr('Hidden stems','藏干'))}</small>${arr(pillar?.hiddenStems).length?`<ul>${arr(pillar.hiddenStems).map(x=>`<li>${esc(hiddenText(x))}</li>`).join('')}</ul>`:`<span>—</span>`}</div></article>`;
}

function wholeChartFacts(product){
 const pillars=arr(product?.structuralModel?.pillars),day=pillars.find(x=>x.position==='DAY'),month=pillars.find(x=>x.position==='MONTH');
 const relationships=arr(product?.readingSections).find(x=>x.code==='RELATIONSHIPS');
 const pattern=arr(product?.readingSections).find(x=>x.code==='PATTERNS');
 return {day,month,relationshipText:arr(relationships?.paragraphs)[0]||tr('No additional natal relation was established in this run.','本次没有建立额外的原局关系。'),patternText:arr(pattern?.paragraphs)[0]||tr('Pattern verdict remains open.','格局判断保持开放。'),openCount:arr(product?.openVerdicts).length};
}

export function renderBaziProfessionalStructure(product,{embedded=false}={}){
 if(!isBaziNativeProduct(product))return '';
 const pillars=arr(product?.structuralModel?.pillars),facts=wholeChartFacts(product),day=facts.day?.stem||{},month=facts.month?.branch||{};
 return `<section class="cx-bazi-structure-surface${embedded?' cx-bazi-structure-surface--embedded':''}" data-ppr-bazi-professional-structure="true"><header class="cx-bazi-structure-head"><div><p class="cx-eyebrow">${esc(tr('BAZI · PROFESSIONAL STRUCTURE','八字 · 专业命盘结构'))}</p><h3>${esc(tr('Four pillars, read as one chart','四柱先作为一张完整命盘阅读'))}</h3><p>${esc(tr('The chart keeps pillar positions, Ten-God roles and hidden stems visible without turning any single pillar into a personality verdict.','命盘保留柱位、十神角色与藏干结构，但不会把任何单柱直接变成人格或命运结论。'))}</p></div><span class="cx-personal-status-chip" data-state="ready">${esc(tr('Full Production','Full Production'))}</span></header><div class="cx-bazi-chart-facts"><article><small>${esc(tr('Day Master','日主'))}</small><strong>${esc(day.zh||'—')}</strong><span>${esc([element(day.element),polarity(day.polarity)].filter(Boolean).join(' · '))}</span></article><article><small>${esc(tr('Month command','月令'))}</small><strong>${esc(month.zh||'—')}</strong><span>${esc(element(month.element))}</span></article><article><small>${esc(tr('Natal relation','原局关系'))}</small><strong>${esc(facts.relationshipText)}</strong></article><article><small>${esc(tr('Open verdicts','仍待确认'))}</small><strong>${esc(facts.openCount)}</strong><span>${esc(tr('kept visible','项保持可见'))}</span></article></div><div class="cx-bazi-pillar-grid">${pillars.map(pillarCard).join('')}</div><footer><span>${esc(tr('Reading rule','阅读规则'))}</span><p>${esc(tr('Day Master and month command anchor the chart; the four pillars remain evidence locations inside the whole structure, not four separate essays.','日主与月令作为整盘锚点；四柱是整体结构中的证据位置，不再分别拥有四篇重复文章。'))}</p></footer></section>`;
}

function reportSection(section){
 const head=`<header><span>${esc(customerState(section?.state))}</span><h3>${esc(section?.title||section?.code||'')}</h3>${section?.dek?`<p>${esc(section.dek)}</p>`:''}</header>`;
 if(section?.code==='SCHOOLS')return `<section class="cx-native-section" data-section="SCHOOLS">${head}<div class="cx-native-school-grid">${arr(section.blocks).map(b=>`<article><strong>${esc(b.title||'')}</strong><span>${esc(tr('School-qualified view','分学派读取'))}</span><p>${esc(b.text||'')}</p></article>`).join('')}</div></section>`;
 if(section?.code==='OPEN')return `<section class="cx-native-section cx-bazi-open" data-section="OPEN">${head}<ul>${arr(section.items).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`;
 return `<section class="cx-native-section" data-section="${esc(section?.code||'')}">${head}${arr(section?.paragraphs).map(p=>`<p>${esc(p)}</p>`).join('')}</section>`;
}

export function renderBaziWholeChartFirst(product){
 if(!isBaziNativeProduct(product))return '';
 const s=product.summary||{},facts=wholeChartFacts(product),day=facts.day?.stem||{},month=facts.month?.branch||{};
 const sections=arr(product.readingSections),technical=product.evidence||{};
 return `<article class="cx-smr-report cx-native-reading cx-bazi-professional-reading" data-method-native="BZR" data-ppr-whole-chart-first="true"><header class="cx-smr-executive cx-bazi-executive"><p class="cx-eyebrow">${esc(tr('WHOLE CHART FIRST','先看整盘'))}</p><h2>${esc(s.title||tr('Your BaZi reading','你的八字读取'))}</h2>${s.subtitle?`<p class="cx-bazi-subtitle">${esc(s.subtitle)}</p>`:''}${s.boundary?`<p class="cx-native-boundary">${esc(s.boundary)}</p>`:''}<div class="cx-bazi-key-structures">${arr(s.keyPoints).slice(0,5).map((text,i)=>`<article><small>${String(i+1).padStart(2,'0')}</small><p>${esc(text)}</p></article>`).join('')}</div></header><section class="cx-bazi-whole-chart-snapshot"><header><p class="cx-eyebrow">${esc(tr('CHART SNAPSHOT','命局先读'))}</p><h3>${esc(tr('Start with the anchors, then read the relationships around them.','先看命盘锚点，再看它们周围的结构关系。'))}</h3></header><div><article><small>${esc(tr('Day Master','日主'))}</small><strong>${esc(day.zh||'—')} · ${esc(element(day.element))}</strong></article><article><small>${esc(tr('Month command','月令'))}</small><strong>${esc(month.zh||'—')} · ${esc(element(month.element))}</strong></article><article><small>${esc(tr('Established natal relation','已建立原局关系'))}</small><strong>${esc(facts.relationshipText)}</strong></article><article><small>${esc(tr('Open conclusions','仍未定论'))}</small><strong>${esc(facts.openCount)}</strong></article></div></section>${renderBaziProfessionalStructure(product,{embedded:true})}<div class="cx-smr-body cx-bazi-reading-body"><header class="cx-bazi-depth-head"><p class="cx-eyebrow">${esc(tr('DEEPER READING','继续深入'))}</p><h3>${esc(tr('Structure first. Interpretation follows the governed evidence.','先有结构，再沿着受治理证据进入解释。'))}</h3></header>${sections.map(reportSection).join('')}<details class="cx-smr-technical"><summary>${esc(tr('View sources and structure details','查看来源与结构详情'))}</summary><dl><dt>${esc(tr('Product','产品'))}</dt><dd><code>${esc(product.productVersion||'')}</code></dd><dt>${esc(tr('Timing context','时间情境'))}</dt><dd>${esc(product.temporalContext?.state||'UNAVAILABLE')}</dd><dt>${esc(tr('Evidence records','证据记录'))}</dt><dd>${esc(technical.evidenceCount??'—')}</dd><dt>${esc(tr('Authority records','权威记录'))}</dt><dd>${esc(technical.authorityCount??'—')}</dd><dt>${esc(tr('Report digest','报告指纹'))}</dt><dd><code>${esc(s.reportDigest||'')}</code></dd></dl></details></div></article>`;
}

export default Object.freeze({isBaziNativeProduct,renderBaziProfessionalStructure,renderBaziWholeChartFirst});
