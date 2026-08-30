import {arr,esc,tr} from '../../surfaces/runtime-ui.js';

export const AST_CX_R3_SURFACE_SCHEMA='PHI-OS-AST-CX-R3-SPECIALIST-SURFACE-v1.0.0';
export const AST_CX_R3_IA=Object.freeze([
  ['overview','Overview','总览'],
  ['my-reading','My Reading','我的读取'],
  ['natal-chart','Natal Chart','出生星盘'],
  ['core-configuration','Core Configuration','核心配置'],
  ['planets-houses','Planets & Houses','行星与宫位'],
  ['aspects-patterns','Aspects & Patterns','相位与格局'],
  ['rulership','Rulership','守护星与命盘链'],
  ['elements-modes','Elements & Modes','元素与模式'],
  ['timing-activation','Timing & Activation','时间与激活'],
  ['reality-comparison','Reality Comparison','现实对照'],
  ['sources-technical','Sources & Technical','来源与技术']
]);

const BODY_GLYPH=Object.freeze({SUN:'☉',MOON:'☽',MERCURY:'☿',VENUS:'♀',MARS:'♂',JUPITER:'♃',SATURN:'♄',URANUS:'♅',NEPTUNE:'♆',PLUTO:'♇'});
const SIGN_GLYPH=Object.freeze({ARIES:'♈',TAURUS:'♉',GEMINI:'♊',CANCER:'♋',LEO:'♌',VIRGO:'♍',LIBRA:'♎',SCORPIO:'♏',SAGITTARIUS:'♐',CAPRICORN:'♑',AQUARIUS:'♒',PISCES:'♓'});
const SIGN_ORDER=Object.freeze(['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES']);
const ELEMENT_LABELS=Object.freeze({FIRE:['Fire','火'],EARTH:['Earth','土'],AIR:['Air','风'],WATER:['Water','水']});
const MODALITY_LABELS=Object.freeze({CARDINAL:['Cardinal','基本'],FIXED:['Fixed','固定'],MUTABLE:['Mutable','变动']});
const SIGN_LABELS=Object.freeze({ARIES:['Aries','白羊座'],TAURUS:['Taurus','金牛座'],GEMINI:['Gemini','双子座'],CANCER:['Cancer','巨蟹座'],LEO:['Leo','狮子座'],VIRGO:['Virgo','处女座'],LIBRA:['Libra','天秤座'],SCORPIO:['Scorpio','天蝎座'],SAGITTARIUS:['Sagittarius','射手座'],CAPRICORN:['Capricorn','摩羯座'],AQUARIUS:['Aquarius','水瓶座'],PISCES:['Pisces','双鱼座']});
const ELEMENT_MODALITY_SIGN=Object.freeze({FIRE:{CARDINAL:'ARIES',FIXED:'LEO',MUTABLE:'SAGITTARIUS'},EARTH:{CARDINAL:'CAPRICORN',FIXED:'TAURUS',MUTABLE:'VIRGO'},AIR:{CARDINAL:'LIBRA',FIXED:'AQUARIUS',MUTABLE:'GEMINI'},WATER:{CARDINAL:'CANCER',FIXED:'SCORPIO',MUTABLE:'PISCES'}});
const ASPECT_LABELS=Object.freeze({CONJUNCTION:['Conjunction','合相'],SEXTILE:['Sextile','六合'],SQUARE:['Square','四分'],TRINE:['Trine','三分'],OPPOSITION:['Opposition','对分']});
const DYNAMIC_LABELS=Object.freeze({APPLYING:['Applying','正在趋近'],SEPARATING:['Separating','正在分离'],EXACT:['Exact','精确'],UNDETERMINED:['Undetermined','未确定']});
const HOUSE_SYSTEM_LABELS=Object.freeze({PLACIDUS_V1:['Placidus','普拉西德宫制'],WHOLE_SIGN_V1:['Whole Sign','整宫制']});
const DISTRIBUTION_SCOPE_LABELS=Object.freeze({CORE_10_PLANETS_UNWEIGHTED:['10 core planets · unweighted','10 颗核心行星 · 非加权']});
const RULERSHIP_SCHOOL_LABELS=Object.freeze({TRADITIONAL_SEVEN_PRIMARY_V1:['Traditional seven primary','传统七星主守护']});
const TIMING_ITEM_LABELS=Object.freeze({ASTT_RELATION:['Transit relationship','当前相位激活'],ASTT_HOUSE_ACTIVATION:['House activation','当前宫位激活']});
const REALITY_RESPONSE_LABELS=Object.freeze({CURRENTLY_RESONANT:['Matches my current reality','这很符合我现在的现实'],PARTIALLY_RESONANT:['Partly matches','部分符合'],CURRENTLY_NOT_RESONANT:['Does not match right now','目前不符合'],OPEN:["I'm not sure",'我不确定']});
const INTENT_FALLBACK_LABELS=Object.freeze({OPEN:['Open reading','开放探索'],EXPRESSION:['Expression & communication','表达与沟通'],WORK:['Work & role','工作与角色'],RELATIONSHIP:['Relationship','关系'],PRESSURE:['Pressure & friction','压力与摩擦'],DIRECTION:['Direction','方向']});
const fmt=n=>Number.isFinite(Number(n))?Number(n).toFixed(Number(n)%1?1:0):'—';
const norm=n=>((Number(n)||0)%360+360)%360;
const byCode=(xs,key,value)=>arr(xs).find(x=>x?.[key]===value)||null;
const unique=xs=>[...new Set(arr(xs).filter(Boolean))];
const localPair=pair=>pair?tr(pair[0],pair[1]):'';
const bodyName=(p,code)=>byCode(p?.chart?.positions,'bodyCode',code)?.bodyLabel||(code?tr('Planet','行星'):'—');
const houseLabel=n=>tr(`House ${Number(n)||'—'}`,`第 ${Number(n)||'—'} 宫`);
const signName=code=>localPair(SIGN_LABELS[code])||(code?tr('Sign','星座'):'—');
const rulerCode=r=>r?.primaryRuler||r?.rulerBodyCode||r?.bodyCode||null;
const aspectLabel=code=>localPair(ASPECT_LABELS[code])||tr('Aspect','相位');
const dynamicLabel=code=>localPair(DYNAMIC_LABELS[code])||tr('Undetermined','未确定');
const houseSystemLabel=code=>localPair(HOUSE_SYSTEM_LABELS[code])||tr('Selected house system','当前宫制');
const distributionScopeLabel=code=>localPair(DISTRIBUTION_SCOPE_LABELS[code])||tr('Core planets · unweighted','核心行星 · 非加权');
const rulershipSchoolLabel=code=>localPair(RULERSHIP_SCHOOL_LABELS[code])||tr('Governed rulership school','受治理守护体系');
const timingItemLabel=code=>localPair(TIMING_ITEM_LABELS[code])||tr('Current activation','当前激活');
const placement=p=>p?`${p.signLabel||''} ${fmt(p.degreeWithinSign)}°${p.houseNumber?` · ${houseLabel(p.houseNumber)}`:''}${p.retrograde?` · ${tr('Retrograde','逆行')}`:''}`:'—';
const anglePlacement=a=>a?`${a.signLabel||''} ${fmt(a.degreeWithinSign)}°`:'—';
const themeByRef=(p,ref)=>arr(p?.keyConfigurations).find(x=>x.themeRef===ref)||null;
const patternByRef=(p,ref)=>arr(p?.aspectNetwork?.patterns).find((x,i)=>patternRef(x,i)===ref)||null;
const patternRef=(x,i=0)=>`${x?.patternCode||'PATTERN'}:${arr(x?.bodyCodes).join('|')}:${i}`;
const patternMatchesRef=(x,ref)=>ref===x?.patternCode||String(ref||'').startsWith(`${x?.patternCode}:`);
const relatedThemesForBody=(p,code)=>arr(p?.keyConfigurations).filter(t=>arr(t.bodyCodes).includes(code));
const relatedThemesForHouse=(p,n)=>arr(p?.keyConfigurations).filter(t=>arr(t.houseNumbers).includes(Number(n)));
const relatedThemesForAspect=(p,ref)=>arr(p?.keyConfigurations).filter(t=>arr(t.evidenceRefs).includes(ref));
const experienceOk=x=>x?.schemaVersion==='PHI-OS-AST-CX-R3-CUSTOMER-EXPERIENCE-PROJECTION-v1.0.0'&&x?.methodId==='AST';
const readingUnit=(x,ref)=>arr(x?.wholeChartReading?.readingUnits).find(u=>u.themeRef===ref)||null;
const intentView=(x,id)=>arr(x?.intentLens?.views).find(v=>v.intentId===id)||null;
const realityResponseLabel=code=>localPair(REALITY_RESPONSE_LABELS[code])||code||'—';

function polar(longitude,r,ascLongitude){
  const deg=norm(longitude-(Number(ascLongitude)||0)+180);
  const rad=deg*Math.PI/180;
  return {x:360+Math.cos(rad)*r,y:360+Math.sin(rad)*r,deg};
}
function arcPath(startLon,endLon,r,asc){
  const s=polar(startLon,r,asc),e=polar(endLon,r,asc);let delta=norm(endLon-startLon);if(delta===0)delta=360;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${delta>180?1:0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}
function houseMidpoints(houses){
  const xs=[...arr(houses)].sort((a,b)=>a.houseNumber-b.houseNumber);
  return xs.map((h,i)=>{const next=xs[(i+1)%xs.length];let span=norm((next?.longitude??h.longitude)-h.longitude);if(!span)span=30;return {...h,midLongitude:norm(h.longitude+span/2)}});
}
function bodyLayout(positions,asc){
  const sorted=arr(positions).map(p=>({...p,screenDeg:polar(p.longitude,1,asc).deg})).sort((a,b)=>a.screenDeg-b.screenDeg);
  const placed=[];
  for(let i=0;i<sorted.length;i++){
    const current=sorted[i],prior=placed[placed.length-1];
    const close=prior&&Math.abs(current.screenDeg-prior.screenDeg)<9;
    const lane=close?((prior.lane+1)%3):0;
    placed.push({...current,lane});
  }
  if(placed.length>1){
    const first=placed[0],last=placed[placed.length-1],wrap=(first.screenDeg+360)-last.screenDeg;
    if(wrap<9&&first.lane===last.lane)first.lane=(last.lane+1)%3;
  }
  return placed;
}
function visibleTextList(items,empty){return items.length?items.map(x=>`<li>${x}</li>`).join(''):`<li>${esc(empty)}</li>`}
function navHtml(){return AST_CX_R3_IA.map(([id,en,zh],i)=>`<button type="button" data-ppr-r3-nav-target="[data-astcx-section='${id}']" aria-current="${i===0?'true':'false'}">${esc(tr(en,zh))}</button>`).join('')}

export function buildNatalChartV2(p){
  const chart=p?.chart||{},positions=arr(chart.positions),angles=arr(chart.angles),houses=arr(chart.houses),aspects=arr(chart.aspects);
  if(!positions.length||!houses.length)return '';
  const asc=byCode(angles,'angleCode','ASC')?.longitude??houses[0]?.longitude??0;
  const mids=houseMidpoints(houses),layout=bodyLayout(positions,asc),bodyPoints=new Map(layout.map(x=>[x.bodyCode,polar(x.longitude,174,asc)]));
  const zodiac=SIGN_ORDER.map((code,i)=>{
    const start=i*30,end=(i+1)*30,mid=start+15,label=polar(mid,316,asc);
    return `<g class="ast-cx-r3-zodiac" data-sign="${esc(code)}"><path d="${arcPath(start,end,326,asc)}"/><text x="${label.x.toFixed(2)}" y="${label.y.toFixed(2)}">${esc(SIGN_GLYPH[code]||'')}</text></g>`;
  }).join('');
  const signLines=SIGN_ORDER.map((_,i)=>{const a=polar(i*30,326,asc),b=polar(i*30,282,asc);return `<line class="ast-cx-r3-zodiac-line" x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}"/>`}).join('');
  const houseLines=houses.map(h=>{const a=polar(h.longitude,280,asc),b=polar(h.longitude,72,asc);return `<line class="ast-cx-r3-house-cusp" data-astcx-house="${h.houseNumber}" data-house-cusp-longitude="${esc(h.longitude)}" x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}"/>`}).join('');
  const houseNumbers=mids.map(h=>{const q=polar(h.midLongitude,256,asc);return `<g class="ast-cx-r3-house-label" tabindex="0" role="button" data-astcx-select-kind="house" data-astcx-ref="${h.houseNumber}" data-astcx-house="${h.houseNumber}" aria-label="${esc(houseLabel(h.houseNumber))}"><circle cx="${q.x.toFixed(2)}" cy="${q.y.toFixed(2)}" r="13"/><text x="${q.x.toFixed(2)}" y="${q.y.toFixed(2)}">${h.houseNumber}</text></g>`}).join('');
  const aspectLines=aspects.map(a=>{const x=bodyPoints.get(a.fromCode),y=bodyPoints.get(a.toCode);if(!x||!y)return '';return `<line class="ast-cx-r3-aspect ast-cx-r3-aspect--${esc(String(a.type||'').toLowerCase())}" data-astcx-select-kind="aspect" data-astcx-ref="${esc(a.aspectRef)}" data-astcx-aspect="${esc(a.aspectRef)}" data-from="${esc(a.fromCode)}" data-to="${esc(a.toCode)}" tabindex="0" role="button" x1="${x.x.toFixed(2)}" y1="${x.y.toFixed(2)}" x2="${y.x.toFixed(2)}" y2="${y.y.toFixed(2)}"><title>${esc(`${bodyName(p,a.fromCode)} ${aspectLabel(a.type)} ${bodyName(p,a.toCode)} · ${fmt(a.orbDegrees)}° · ${dynamicLabel(a.dynamicState)}`)}</title></line>`}).join('');
  const bodies=layout.map(b=>{const planet=polar(b.longitude,214,asc),label=polar(b.longitude,242+b.lane*24,asc),anchor=label.x<342?'end':label.x>378?'start':'middle';return `<g class="ast-cx-r3-body" tabindex="0" role="button" data-astcx-select-kind="planet" data-astcx-ref="${esc(b.bodyCode)}" data-astcx-body="${esc(b.bodyCode)}" aria-label="${esc(`${b.bodyLabel} · ${placement(b)}`)}"><line x1="${planet.x.toFixed(2)}" y1="${planet.y.toFixed(2)}" x2="${label.x.toFixed(2)}" y2="${label.y.toFixed(2)}"/><circle cx="${planet.x.toFixed(2)}" cy="${planet.y.toFixed(2)}" r="12"/><text class="ast-cx-r3-body-glyph" x="${planet.x.toFixed(2)}" y="${planet.y.toFixed(2)}">${esc(BODY_GLYPH[b.bodyCode]||'•')}</text><text class="ast-cx-r3-body-label" x="${label.x.toFixed(2)}" y="${label.y.toFixed(2)}" text-anchor="${anchor}">${esc(`${b.bodyLabel} ${fmt(b.degreeWithinSign)}°${b.retrograde?' ℞':''}`)}</text></g>`}).join('');
  const angleMarks=angles.map(a=>{const q=polar(a.longitude,300,asc);return `<g class="ast-cx-r3-angle" data-astcx-angle="${esc(a.angleCode)}"><circle cx="${q.x.toFixed(2)}" cy="${q.y.toFixed(2)}" r="18"/><text x="${q.x.toFixed(2)}" y="${q.y.toFixed(2)}">${esc(a.angleCode)}</text></g>`}).join('');
  return `<section class="ast-cx-r3-panel ast-cx-r3-chart-panel" data-astcx-section="natal-chart" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('NATAL CHART','出生星盘'))}</p><h2>${esc(tr('Your calculated chart, with the real house geometry preserved','你的出生星盘：保留实际宫位几何'))}</h2><p>${esc(tr('Select a planet, house or aspect to inspect the governed structure. The wheel only lays out calculated data; it does not create interpretation.','点击行星、宫位或相位查看受治理结构。星盘图只负责呈现计算结果，不创造新的解释。'))}</p><div class="ast-cx-r3-meta"><span>${esc(houseSystemLabel(p.houseSystemId))}</span><span>${esc(tr(`${positions.length} planets · ${aspects.length} major aspects`,`${positions.length} 颗行星 · ${aspects.length} 个主要相位`))}</span></div></header><div class="ast-cx-r3-chart-grid"><figure class="ast-cx-r3-wheel"><svg viewBox="0 0 720 720" role="img" aria-label="${esc(tr('Interactive natal chart','可互动出生星盘'))}"><circle class="ast-cx-r3-ring ast-cx-r3-ring--outer" cx="360" cy="360" r="326"/><circle class="ast-cx-r3-ring" cx="360" cy="360" r="282"/><circle class="ast-cx-r3-ring ast-cx-r3-ring--inner" cx="360" cy="360" r="176"/>${zodiac}${signLines}${houseLines}<g class="ast-cx-r3-aspect-layer">${aspectLines}</g>${houseNumbers}${bodies}${angleMarks}</svg><figcaption>${esc(tr('Chart rotation is anchored to the calculated Ascendant when available; house cusps come directly from the customer product projection.','星盘方向在可用时以计算所得上升点为锚；宫头直接来自客户产品投射。'))}</figcaption></figure><aside class="ast-cx-r3-inspector" data-astcx-inspector aria-live="polite">${buildAstExplorerInspectorHtml(p,'overview','overview')}</aside></div></section>`;
}

function relatedThemeLinks(themes){return arr(themes).length?`<div class="ast-cx-r3-related"><span>${esc(tr('Related whole-chart themes','关联整盘主题'))}</span>${arr(themes).map(t=>`<button type="button" data-astcx-select-kind="theme" data-astcx-ref="${esc(t.themeRef)}">${esc(t.readerTitle)}</button>`).join('')}</div>`:''}
function fullReadingOwnerLink(themeRef){return `<button type="button" class="ast-cx-r3-owner-link" data-astcx-jump-theme-owner="${esc(themeRef)}">${esc(tr('Read the full explanation in My Reading','前往「我的读取」查看完整解释'))}</button>`}
function inspectorHeader(kicker,title,summary=''){return `<p class="ast-cx-r3-kicker">${esc(kicker)}</p><h3>${esc(title)}</h3>${summary?`<p>${esc(summary)}</p>`:''}`}
export function buildAstExplorerInspectorHtml(p,kind,ref){
  if(kind==='planet'){
    const item=byCode(p?.planetHouseDirectory,'bodyCode',ref)||byCode(p?.chart?.positions,'bodyCode',ref);if(!item)return '';
    const aspects=arr(p?.aspectNetwork?.aspects).filter(a=>a.fromCode===ref||a.toCode===ref),themes=relatedThemesForBody(p,ref);
    return `${inspectorHeader(tr('PLANET','行星'),item.bodyLabel||bodyName(p,ref),placement(item))}<dl class="ast-cx-r3-facts"><dt>${esc(tr('Placement','落点'))}</dt><dd>${esc(placement(item))}</dd><dt>${esc(tr('Major aspects','主要相位'))}</dt><dd>${esc(String(aspects.length))}</dd><dt>${esc(tr('Meaning lineage','意义依据'))}</dt><dd>${esc(tr(`${arr(item.meaningRefs).length} governed references`,`${arr(item.meaningRefs).length} 条受治理引用`))}</dd></dl>${relatedThemeLinks(themes)}`;
  }
  if(kind==='aspect'){
    const a=byCode(p?.aspectNetwork?.aspects,'aspectRef',ref);if(!a)return '';
    const themes=relatedThemesForAspect(p,ref),patterns=arr(p?.aspectNetwork?.patterns).filter(x=>arr(x.evidenceAspectRefs).includes(ref));
    return `${inspectorHeader(tr('ASPECT','相位'),`${bodyName(p,a.fromCode)} · ${aspectLabel(a.type)} · ${bodyName(p,a.toCode)}`,`${fmt(a.orbDegrees)}° · ${dynamicLabel(a.dynamicState)}`)}<dl class="ast-cx-r3-facts"><dt>${esc(tr('Orb','容许度差'))}</dt><dd>${esc(`${fmt(a.orbDegrees)}°`)}</dd><dt>${esc(tr('Dynamic','动态'))}</dt><dd>${esc(dynamicLabel(a.dynamicState))}</dd><dt>${esc(tr('Pattern membership','格局归属'))}</dt><dd>${esc(patterns.map(x=>x.label).join(' · ')||tr('None established','未建立'))}</dd></dl>${relatedThemeLinks(themes)}`;
  }
  if(kind==='house'){
    const n=Number(ref),h=arr(p?.chart?.houses).find(x=>Number(x.houseNumber)===n);if(!h)return '';
    const occupants=arr(p?.chart?.positions).filter(x=>Number(x.houseNumber)===n),ruler=arr(p?.rulership?.houseRulers).find(x=>Number(x.houseNumber)===n),themes=relatedThemesForHouse(p,n);
    return `${inspectorHeader(tr('HOUSE','宫位'),houseLabel(n),`${h.signLabel||''} ${fmt(norm(h.longitude)%30)}°`)}<dl class="ast-cx-r3-facts"><dt>${esc(tr('Cusp','宫头'))}</dt><dd>${esc(`${h.signLabel||''} ${fmt(norm(h.longitude)%30)}°`)}</dd><dt>${esc(tr('Occupants','宫内行星'))}</dt><dd>${esc(occupants.map(x=>x.bodyLabel).join(' · ')||tr('No core planets','无核心行星'))}</dd><dt>${esc(tr('Ruler','宫主星'))}</dt><dd>${esc(bodyName(p,rulerCode(ruler))||'—')}</dd></dl>${relatedThemeLinks(themes)}`;
  }
  if(kind==='pattern'){
    const x=patternByRef(p,ref)||arr(p?.aspectNetwork?.patterns).find(a=>patternMatchesRef(a,ref));if(!x)return '';
    const themes=arr(x.themeRefs).map(r=>themeByRef(p,r)).filter(Boolean);
    return `${inspectorHeader(tr('PATTERN','格局'),x.label||tr('Governed pattern','受治理格局'),x.apexBodyCode?tr(`Apex: ${bodyName(p,x.apexBodyCode)}`,`焦点：${bodyName(p,x.apexBodyCode)}`):'')}<dl class="ast-cx-r3-facts"><dt>${esc(tr('Bodies','行星'))}</dt><dd>${esc(arr(x.bodyCodes).map(c=>bodyName(p,c)).join(' · '))}</dd><dt>${esc(tr('Evidence aspects','证据相位'))}</dt><dd>${esc(String(arr(x.evidenceAspectRefs).length))}</dd><dt>${esc(tr('Reading link','读取关联'))}</dt><dd>${esc(themes.length?tr('Linked to whole-chart reading','已关联整盘读取'):tr('Structure established; no primary reading owner','结构已建立；未指定主读取'))}</dd></dl>${relatedThemeLinks(themes)}`;
  }
  if(kind==='theme'){
    const t=themeByRef(p,ref);if(!t)return '';
    return `${inspectorHeader(tr('WHOLE-CHART THEME','整盘主题'),t.readerTitle,tr('The full admitted explanation has one owner in My Reading. This inspector shows structure only.','完整获准解释在「我的读取」只有一个正文所有者；这里仅显示结构关联。'))}<dl class="ast-cx-r3-facts"><dt>${esc(tr('Bodies','行星'))}</dt><dd>${esc(arr(t.bodyCodes).map(c=>bodyName(p,c)).join(' · ')||'—')}</dd><dt>${esc(tr('Houses','宫位'))}</dt><dd>${esc(arr(t.houseNumbers).map(n=>houseLabel(n)).join(' · ')||'—')}</dd><dt>${esc(tr('Pattern','格局'))}</dt><dd>${esc(t.technicalLabel||tr('Not pattern-owned','非格局主导'))}</dd></dl>${fullReadingOwnerLink(t.themeRef)}`;
  }
  return `${inspectorHeader(tr('CHART EXPLORER','星盘探索器'),tr('Select a chart structure','选择一个命盘结构'),tr('Planet, house, aspect and pattern selections reveal only already-projected structure and admitted reading links.','行星、宫位、相位与格局的选择，只显示已经投射的结构与已获准读取关联。'))}<p class="ast-cx-r3-boundary">${esc(tr('The browser renderer does not calculate astrology or create new meaning.','浏览器 renderer 不计算占星，也不创造新的意义。'))}</p>`;
}

function leaderText(leader,labels){
  if(!leader)return tr('Not established','尚未建立');const names=arr(leader.codes).map(c=>localPair(labels[c])||c).join(' · ');
  if(leader.state==='TIED_NO_SINGLE_LEADER')return tr(`Distribution tie: ${names}`,`分布并列：${names}`);
  return tr(`Distribution leader: ${names}`,`分布领先：${names}`);
}
function coreCard(label,value,detail=''){return `<article class="ast-cx-r3-core-card"><span>${esc(label)}</span><strong>${esc(value||'—')}</strong>${detail?`<small>${esc(detail)}</small>`:''}</article>`}
export function buildCoreConfigurationHtml(p){
  const sun=byCode(p?.chart?.positions,'bodyCode','SUN'),moon=byCode(p?.chart?.positions,'bodyCode','MOON'),asc=byCode(p?.chart?.angles,'angleCode','ASC'),mc=byCode(p?.chart?.angles,'angleCode','MC');
  const ruler=p?.rulership?.chartRuler||{},rulerPlanet=byCode(p?.chart?.positions,'bodyCode',ruler.bodyCode),linkedPatterns=arr(p?.aspectNetwork?.patterns).filter(x=>arr(x.themeRefs).length);
  const finalNames=arr(p?.rulership?.finalDispositors).map(code=>bodyName(p,code));
  const cycleCount=arr(p?.rulership?.cycles).length;
  return `<section class="ast-cx-r3-panel" data-astcx-section="core-configuration" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('CORE CONFIGURATION','核心配置'))}</p><h2>${esc(tr('The structural frame for reading the chart','建立整盘读取框架'))}</h2><p>${esc(tr('This summary uses only governed chart structure and already-established rulership, pattern and distribution states.','这里仅使用受治理的命盘结构，以及已经建立的守护、格局与分布状态。'))}</p></header><div class="ast-cx-r3-core-grid">${coreCard(tr('Sun','太阳'),sun?.bodyLabel,placement(sun))}${coreCard(tr('Moon','月亮'),moon?.bodyLabel,placement(moon))}${coreCard(tr('Ascendant','上升点'),tr('Ascendant','上升点'),anglePlacement(asc))}${coreCard(tr('Midheaven','天顶'),tr('Midheaven','天顶'),anglePlacement(mc))}${coreCard(tr('Chart ruler','命盘守护星'),rulerPlanet?.bodyLabel||bodyName(p,ruler.bodyCode),rulerPlanet?placement(rulerPlanet):'')}${coreCard(tr('Reading-linked patterns','关联核心读取的格局'),linkedPatterns.map(x=>x.label).join(' · ')||tr('None established','尚未建立'))}${coreCard(tr('Final dispositors','最终守护落点'),finalNames.join(' · ')||tr('None established','尚未建立'),cycleCount?tr(`${cycleCount} dispositor cycle(s) also preserved`,`${cycleCount} 个守护循环同时保留`):'')}${coreCard(tr('Element distribution','元素分布'),leaderText(p?.distribution?.elementLeader,ELEMENT_LABELS))}${coreCard(tr('Modality distribution','模式分布'),leaderText(p?.distribution?.modalityLeader,MODALITY_LABELS))}</div></section>`;
}

function overviewHtml(p){return `<section class="ast-cx-r3-panel ast-cx-r3-overview" data-astcx-section="overview" tabindex="-1"><p class="ast-cx-r3-kicker">${esc(tr('ASTROLOGY · PROFESSIONAL READING','占星 · 专业读取'))}</p><h1>${esc(p?.overview?.readerTitle||tr('Your astrology reading','你的占星读取'))}</h1><p class="ast-cx-r3-lead">${esc(p?.overview?.readerSummary||'')}</p><div class="ast-cx-r3-meta"><span>${esc(houseSystemLabel(p?.houseSystemId))}</span><span>${esc(tr('Whole-chart synthesis first','整盘综合优先'))}</span><span>${esc(tr('Method-native specialist surface','方法原生专业界面'))}</span></div></section>`}
function intentLensHtml(x){
  if(!experienceOk(x))return '';
  const views=arr(x.intentLens?.views),active=x.intentLens?.activeIntentId||'OPEN',activeView=intentView(x,active);
  return `<section class="ast-cx-r3-intent-lens" aria-label="${esc(tr('Reading focus','阅读重点'))}"><div class="ast-cx-r3-intent-head"><span>${esc(tr('Reading focus','阅读重点'))}</span><small>${esc(tr('This changes order and focus only; the admitted meanings do not change.','这里只调整顺序与焦点；已获准的占星意义不会改变。'))}</small></div><div class="ast-cx-r3-intent-buttons" role="group">${views.map(v=>`<button type="button" data-astcx-intent="${esc(v.intentId)}" aria-pressed="${v.intentId===active?'true':'false'}">${esc(v.label||localPair(INTENT_FALLBACK_LABELS[v.intentId])||v.intentId)}</button>`).join('')}</div><p class="ast-cx-r3-intent-copy" data-astcx-intent-copy>${esc(activeView?.readerText||tr('Open reading keeps the whole-chart order without changing meaning.','开放探索保持整盘顺序，不改变任何占星意义。'))}</p></section>`;
}
function themeEvidenceFacts(p,t,u){
  const bodies=arr(t.bodyCodes).map(c=>bodyName(p,c)),houses=arr(t.houseNumbers).map(n=>houseLabel(n)),angles=arr(t.angleCodes),bits=[];
  if(t.technicalLabel)bits.push(`<span>${esc(/^[A-Z0-9_:-]+$/.test(String(t.technicalLabel))?tr('Governed chart structure','受治理命盘结构'):t.technicalLabel)}</span>`);
  if(bodies.length)bits.push(`<span>${esc(bodies.join(' · '))}</span>`);
  if(houses.length)bits.push(`<span>${esc(houses.join(' · '))}</span>`);
  if(angles.length)bits.push(`<span>${esc(angles.join(' · '))}</span>`);
  if(u?.evidenceCount)bits.push(`<span>${esc(tr(`${u.evidenceCount} governed evidence reference(s)`,`${u.evidenceCount} 条受治理证据引用`))}</span>`);
  return bits.join('');
}
function signalItems(signals,refs){const set=new Set(arr(refs));return arr(signals).filter(x=>set.has(x.signalRef))}
function myReadingHtml(p,x=null){
  const themes=arr(p?.keyConfigurations),exp=experienceOk(x)?x:null,units=new Map(arr(exp?.wholeChartReading?.readingUnits).map(u=>[u.themeRef,u])),support=arr(exp?.wholeChartReading?.support||p?.wholeChartReading?.support),tension=arr(exp?.wholeChartReading?.tension||p?.wholeChartReading?.tension),unknowns=arr(exp?.wholeChartReading?.unknowns||p?.wholeChartReading?.unknowns);
  const cards=themes.map((t,i)=>{const u=units.get(t.themeRef)||{},supports=signalItems(support,u.supportSignalRefs),tensions=signalItems(tension,u.tensionSignalRefs);return `<article class="ast-cx-r3-theme-card ast-cx-r3-reading-owner" data-astcx-theme-card="${esc(t.themeRef)}" data-astcx-theme-owner="${esc(t.themeRef)}" data-astcx-theme-tier="${esc(t.tier||'')}" data-astcx-theme-rank="${esc(t.rank||i+1)}"><header><button type="button" data-astcx-select-kind="theme" data-astcx-ref="${esc(t.themeRef)}"><span data-astcx-theme-order>${String(i+1).padStart(2,'0')}</span><strong>${esc(t.readerTitle)}</strong><small>${esc(t.tier==='CORE_THEME'?tr('Core theme','核心主题'):tr('Supporting theme','支持主题'))}</small></button></header><div class="ast-cx-r3-owner-narrative"><p>${esc(t.readerText)}</p></div><details class="ast-cx-r3-why"><summary>${esc(tr('Why this appears','为什么出现这项内容'))}</summary><div class="ast-cx-r3-evidence-chips">${themeEvidenceFacts(p,t,u)}</div>${supports.length||tensions.length?`<div class="ast-cx-r3-signal-columns">${supports.length?`<div><strong>${esc(tr('Supporting connections','支持连接'))}</strong><ul>${supports.map(s=>`<li>${esc(s.readerText)}</li>`).join('')}</ul></div>`:''}${tensions.length?`<div><strong>${esc(tr('Tension connections','张力连接'))}</strong><ul>${tensions.map(s=>`<li>${esc(s.readerText)}</li>`).join('')}</ul></div>`:''}</div>`:''}</details></article>`}).join('');
  const globalSignals=`<div class="ast-cx-r3-reading-context"><article><span>${esc(tr('Supporting connections','支持连接'))}</span><strong>${support.length}</strong><p>${esc(tr('These are already-admitted lower-friction or supporting relationship signals; they do not guarantee outcomes.','这些是已经获准的较低摩擦或支持性关系信号，不保证任何结果。'))}</p></article><article><span>${esc(tr('Tension connections','张力连接'))}</span><strong>${tension.length}</strong><p>${esc(tr('These preserve friction and counter-pressure instead of smoothing the chart into one positive story.','这里保留摩擦与反向压力，不把整张盘抹平成单一正向故事。'))}</p></article><article><span>${esc(tr('Still open','仍然开放'))}</span><strong>${unknowns.length}</strong><p>${esc(unknowns.length?tr('Unknown or unresolved items remain visible rather than being filled with generic personality prose.','未知或未解决项目继续保持可见，不用通用人格文字填补。'):tr('No additional open item is attached to this projection.','这次投射没有附加新的开放项。'))}</p></article></div>`;
  return `<section class="ast-cx-r3-panel ast-cx-r3-reading" data-astcx-section="my-reading" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('MY READING','我的读取'))}</p><h2>${esc(tr('Read the chart as a whole before opening individual objects','先读整张盘，再进入单颗行星与单一结构'))}</h2><p>${esc(tr('Each admitted theme has one full narrative owner here. Other chart areas only link back to it, so the report does not repeat the same essay in multiple places.','每个获准主题只在这里拥有一个完整正文所有者；其他星盘区域只链接回来，因此不会在多个位置重复同一篇解释。'))}</p></header>${intentLensHtml(exp)}<div class="ast-cx-r3-theme-grid ast-cx-r3-theme-grid--reading" data-astcx-theme-owner-list>${cards}</div>${globalSignals}</section>`;
}

function houseDirectoryRow(p,h){
  const ruler=arr(p?.rulership?.houseRulers).find(x=>Number(x.houseNumber)===Number(h.houseNumber)),occupants=arr(p?.chart?.positions).filter(x=>Number(x.houseNumber)===Number(h.houseNumber)),themes=relatedThemesForHouse(p,h.houseNumber);
  const rulerName=bodyName(p,rulerCode(ruler));
  return `<button type="button" class="ast-cx-r3-directory-card ast-cx-r3-house-card" data-astcx-select-kind="house" data-astcx-ref="${esc(h.houseNumber)}" data-astcx-house="${esc(h.houseNumber)}"><span class="ast-cx-r3-house-number">${esc(String(h.houseNumber))}</span><span class="ast-cx-r3-directory-copy"><strong>${esc(houseLabel(h.houseNumber))}</strong><small>${esc(`${h.signLabel||signName(h.signCode)} ${fmt(norm(h.longitude)%30)}°`)}</small><em>${esc(tr(`Ruler ${rulerName||'—'} · ${occupants.length} core planet(s) · ${themes.length} reading link(s)`,`宫主星 ${rulerName||'—'} · ${occupants.length} 颗核心行星 · ${themes.length} 个读取关联`))}</em></span></button>`;
}
export function buildPlanetsHousesExplorerHtml(p){
  const planets=arr(p?.planetHouseDirectory),houses=arr(p?.chart?.houses).slice().sort((a,b)=>Number(a.houseNumber)-Number(b.houseNumber));
  const planetCards=planets.map(x=>{const aspects=arr(p?.aspectNetwork?.aspects).filter(a=>a.fromCode===x.bodyCode||a.toCode===x.bodyCode),themes=relatedThemesForBody(p,x.bodyCode);return `<button type="button" class="ast-cx-r3-directory-card" data-astcx-select-kind="planet" data-astcx-ref="${esc(x.bodyCode)}"><span class="ast-cx-r3-glyph">${esc(BODY_GLYPH[x.bodyCode]||'•')}</span><span class="ast-cx-r3-directory-copy"><strong>${esc(x.bodyLabel)}</strong><small>${esc(placement(x))}</small><em>${esc([x.functionLabel,x.directionLabel,x.domainLabel].filter(Boolean).join(' · '))}</em><span>${esc(tr(`${aspects.length} major aspect(s) · ${themes.length} whole-chart link(s)`,`${aspects.length} 个主要相位 · ${themes.length} 个整盘关联`))}</span></span></button>`}).join('');
  return `<section class="ast-cx-r3-panel" data-astcx-section="planets-houses" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('PLANETS & HOUSES','行星与宫位'))}</p><h2>${esc(tr('Move between planetary functions and the houses they occupy','在行星功能与其所在宫位之间切换阅读'))}</h2><p>${esc(tr('Placements, function labels, house rulers, occupants and whole-chart links all come from the governed customer product projection. Selecting an item returns to the same chart explorer instead of creating a second essay.','落点、功能标签、宫主星、宫内行星与整盘关联都来自受治理客户产品投射。选择项目会回到同一个星盘探索器，而不是生成第二篇解释。'))}</p></header><div class="ast-cx-r3-switch" role="group" aria-label="${esc(tr('Planets and houses view','行星与宫位视图'))}"><button type="button" data-astcx-directory-mode="planets" aria-pressed="true">${esc(tr('Planets','行星'))}<span>${planets.length}</span></button><button type="button" data-astcx-directory-mode="houses" aria-pressed="false">${esc(tr('Houses','宫位'))}<span>${houses.length}</span></button></div><div class="ast-cx-r3-directory ast-cx-r3-directory--rich" data-astcx-directory-pane="planets">${planetCards}</div><div class="ast-cx-r3-directory ast-cx-r3-directory--houses" data-astcx-directory-pane="houses" hidden>${houses.map(h=>houseDirectoryRow(p,h)).join('')}</div></section>`;
}

function aspectFilterButton(code,en,zh,count,active=false){return `<button type="button" data-astcx-aspect-filter="${esc(code)}" aria-pressed="${active?'true':'false'}"><span>${esc(tr(en,zh))}</span><strong>${esc(String(count))}</strong></button>`}
export function buildAspectsPatternsHtml(p){
  const aspects=arr(p?.aspectNetwork?.aspects).slice().sort((a,b)=>Number(a.orbDegrees)-Number(b.orbDegrees)||String(a.aspectRef).localeCompare(String(b.aspectRef))),patterns=arr(p?.aspectNetwork?.patterns);
  const counts={APPLYING:aspects.filter(a=>a.dynamicState==='APPLYING').length,SEPARATING:aspects.filter(a=>a.dynamicState==='SEPARATING').length,EXACT:aspects.filter(a=>a.dynamicState==='EXACT').length,UNDETERMINED:aspects.filter(a=>a.dynamicState==='UNDETERMINED').length};
  const patternCards=patterns.map((x,i)=>`<button type="button" class="ast-cx-r3-pattern-card" data-astcx-select-kind="pattern" data-astcx-ref="${esc(patternRef(x,i))}" data-astcx-pattern="${esc(x.patternCode)}"><span class="ast-cx-r3-pattern-kind">${esc(x.label)}</span><strong>${esc(arr(x.bodyCodes).map(c=>bodyName(p,c)).join(' · '))}</strong><small>${esc(tr(`${arr(x.evidenceAspectRefs).length} evidence aspects`,`${arr(x.evidenceAspectRefs).length} 个证据相位`))}${x.apexBodyCode?` · ${esc(tr(`Apex ${bodyName(p,x.apexBodyCode)}`,`焦点 ${bodyName(p,x.apexBodyCode)}`))}`:''}</small><em>${esc(arr(x.themeRefs).length?tr('Linked to whole-chart reading','已关联整盘读取'):tr('Structure established; no primary reading owner','结构已建立；未指定主读取'))}</em></button>`).join('');
  const rows=aspects.map(a=>`<button type="button" class="ast-cx-r3-aspect-row" data-astcx-select-kind="aspect" data-astcx-ref="${esc(a.aspectRef)}" data-astcx-aspect-row="${esc(a.aspectRef)}" data-astcx-aspect-dynamic="${esc(a.dynamicState||'UNDETERMINED')}" data-astcx-aspect-type="${esc(a.type||'')}"><span class="ast-cx-r3-aspect-pair"><strong>${esc(bodyName(p,a.fromCode))}</strong><b>${esc(aspectLabel(a.type))}</b><strong>${esc(bodyName(p,a.toCode))}</strong></span><span class="ast-cx-r3-aspect-meta"><small>${esc(`${fmt(a.orbDegrees)}°`)}</small><small>${esc(dynamicLabel(a.dynamicState))}</small><small>${esc(arr(a.patternCodes).length?tr(`${arr(a.patternCodes).length} pattern link(s)`,`${arr(a.patternCodes).length} 个格局关联`):tr('No pattern membership','无格局归属'))}</small></span></button>`).join('');
  return `<section class="ast-cx-r3-panel" data-astcx-section="aspects-patterns" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('ASPECTS & PATTERNS','相位与格局'))}</p><h2>${esc(tr('Inspect the relationship geometry without flattening it into isolated labels','检查关系几何，而不是把它压成孤立标签'))}</h2><p>${esc(tr('Pattern membership, orb and applying/separating state are projected from the governed AST semantic layer. Filters only change what is visible; they never recalculate an aspect.','格局归属、容许度与趋近/分离状态都来自受治理 AST 语义层。筛选只改变显示内容，不会重新计算相位。'))}</p></header><div class="ast-cx-r3-aspect-stats"><span><small>${esc(tr('Major aspects','主要相位'))}</small><strong>${aspects.length}</strong></span><span><small>${esc(tr('Governed patterns','受治理格局'))}</small><strong>${patterns.length}</strong></span><span><small>${esc(tr('Applying','正在趋近'))}</small><strong>${counts.APPLYING}</strong></span><span><small>${esc(tr('Separating','正在分离'))}</small><strong>${counts.SEPARATING}</strong></span></div><div class="ast-cx-r3-pattern-grid">${patternCards||`<p>${esc(tr('No governed higher-order pattern is established for this chart.','这张盘目前没有建立受治理的高阶格局。'))}</p>`}</div><div class="ast-cx-r3-aspect-toolbar" role="group" aria-label="${esc(tr('Aspect dynamics filter','相位动态筛选'))}">${aspectFilterButton('ALL','All','全部',aspects.length,true)}${aspectFilterButton('APPLYING','Applying','趋近',counts.APPLYING)}${aspectFilterButton('SEPARATING','Separating','分离',counts.SEPARATING)}${aspectFilterButton('EXACT','Exact','精确',counts.EXACT)}${aspectFilterButton('UNDETERMINED','Open','未确定',counts.UNDETERMINED)}</div><div class="ast-cx-r3-aspect-list ast-cx-r3-aspect-list--professional">${rows}</div></section>`;
}

function networkNodePositions(codes){const uniqueCodes=unique(codes),out=new Map(),cx=380,cy=205,rx=276,ry=145;uniqueCodes.forEach((code,i)=>{const a=(-90+(360*i/Math.max(1,uniqueCodes.length)))*Math.PI/180;out.set(code,{x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry})});return out}
export function buildRulershipNetworkSvg(p){
  const r=p?.rulership||{},planetCodes=arr(p?.chart?.positions).map(x=>x.bodyCode),nodes=networkNodePositions(planetCodes),finals=new Set(arr(r.finalDispositors)),cycleMembers=new Set(arr(r.cycles).flatMap(x=>arr(x.members))),chartRuler=r.chartRuler?.bodyCode||null;
  const edges=arr(r.planetaryDispositors).filter(x=>nodes.has(x.bodyCode)&&nodes.has(rulerCode(x))).map(x=>{const from=nodes.get(x.bodyCode),to=nodes.get(rulerCode(x)),self=x.bodyCode===rulerCode(x);if(self)return `<path class="ast-cx-r3-ruler-edge ast-cx-r3-ruler-edge--self" data-astcx-ruler-edge="${esc(`${x.bodyCode}>${rulerCode(x)}`)}" d="M ${from.x-10} ${from.y-14} C ${from.x-42} ${from.y-55}, ${from.x+42} ${from.y-55}, ${from.x+10} ${from.y-14}" marker-end="url(#astcx-arrow)"/>`;return `<line class="ast-cx-r3-ruler-edge" data-astcx-ruler-edge="${esc(`${x.bodyCode}>${rulerCode(x)}`)}" x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" marker-end="url(#astcx-arrow)"/>`}).join('');
  const nodeHtml=[...nodes.entries()].map(([code,q])=>{const states=[finals.has(code)?'final':'',cycleMembers.has(code)?'cycle':'',code===chartRuler?'chart-ruler':''].filter(Boolean).join(' ');return `<g class="ast-cx-r3-ruler-node" data-astcx-rulership-node="${esc(code)}" data-astcx-body="${esc(code)}" data-astcx-rulership-state="${esc(states)}" data-astcx-select-kind="planet" data-astcx-ref="${esc(code)}" role="button" tabindex="0" aria-label="${esc(bodyName(p,code))}"><circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="27"/><text class="ast-cx-r3-ruler-glyph" x="${q.x.toFixed(1)}" y="${(q.y-3).toFixed(1)}">${esc(BODY_GLYPH[code]||'•')}</text><text class="ast-cx-r3-ruler-label" x="${q.x.toFixed(1)}" y="${(q.y+17).toFixed(1)}">${esc(bodyName(p,code))}</text></g>`}).join('');
  return `<svg class="ast-cx-r3-rulership-svg" viewBox="0 0 760 410" role="img" aria-label="${esc(tr('Dispositor routing network','守护链路由网络'))}"><defs><marker id="astcx-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>${edges}${nodeHtml}</svg>`;
}
export function buildRulershipNetworkHtml(p){
  const r=p?.rulership||{},chartRuler=bodyName(p,r.chartRuler?.bodyCode),finals=arr(r.finalDispositors).map(c=>bodyName(p,c)),school=r.schoolPolicy||{};
  const houseRows=arr(r.houseRulers).map(x=>`<button type="button" class="ast-cx-r3-house-ruler" data-astcx-select-kind="house" data-astcx-ref="${esc(x.houseNumber)}" data-astcx-house="${esc(x.houseNumber)}"><span>${esc(houseLabel(x.houseNumber))}</span><strong>${esc(signName(x.signCode))} → ${esc(bodyName(p,rulerCode(x)))}</strong>${x.modernCoRulerAnnotation?`<small>${esc(tr(`Modern annotation: ${bodyName(p,x.modernCoRulerAnnotation)}`,`现代注记：${bodyName(p,x.modernCoRulerAnnotation)}`))}</small>`:''}</button>`).join('');
  const chains=arr(r.dispositorChains).map(x=>{const path=arr(x.path).map(c=>bodyName(p,c)).join(' → '),terminal=x.terminalType==='FINAL_DISPOSITOR'?tr(`Final: ${bodyName(p,x.terminalBody)}`,`最终守护：${bodyName(p,x.terminalBody)}`):x.terminalType==='CYCLE'?tr(`Cycle: ${arr(x.cycle).map(c=>bodyName(p,c)).join(' ↔ ')}`,`循环：${arr(x.cycle).map(c=>bodyName(p,c)).join(' ↔ ')}`):tr('Open / unresolved','开放 / 未解析');return `<button type="button" class="ast-cx-r3-chain-row" data-astcx-select-kind="planet" data-astcx-ref="${esc(x.bodyCode)}"><strong>${esc(bodyName(p,x.bodyCode))}</strong><span>${esc(path)}</span><small>${esc(terminal)}</small></button>`}).join('');
  return `<section class="ast-cx-r3-panel" data-astcx-section="rulership" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('RULERSHIP NETWORK','守护星与命盘链'))}</p><h2>${esc(tr('Follow how planetary functions route through the selected rulership school','沿着选定守护体系追踪行星功能的路由'))}</h2><p>${esc(tr('The network renders upstream chart-ruler, house-ruler and dispositor topology. Node position is visual only; it does not rank strength or importance.','网络只呈现上游已经建立的命盘守护星、宫主星与守护链拓扑。节点位置仅用于视觉排布，不代表强弱或重要性排名。'))}</p></header><div class="ast-cx-r3-summary-strip"><span><small>${esc(tr('Chart ruler','命盘守护星'))}</small><strong>${esc(chartRuler||'—')}</strong></span><span><small>${esc(tr('Final dispositors','最终守护落点'))}</small><strong>${esc(finals.join(' · ')||'—')}</strong></span><span><small>${esc(tr('Cycles','循环'))}</small><strong>${esc(String(arr(r.cycles).length))}</strong></span><span><small>${esc(tr('School','学派'))}</small><strong>${esc(school.chainAuthority?rulershipSchoolLabel(school.chainAuthority):'—')}</strong></span></div><div class="ast-cx-r3-rulership-layout"><figure class="ast-cx-r3-rulership-network">${buildRulershipNetworkSvg(p)}<figcaption>${esc(tr('Arrows follow the already-calculated primary dispositor relation. Outer-planet modern rulers remain annotation-only under this school policy.','箭头沿用已经计算出的主守护关系；在当前学派政策下，外行星现代守护只作为注记。'))}</figcaption></figure><div class="ast-cx-r3-rulership-key"><span data-key="chart-ruler">${esc(tr('Chart ruler','命盘守护星'))}</span><span data-key="final">${esc(tr('Final dispositor','最终守护'))}</span><span data-key="cycle">${esc(tr('Cycle member','循环成员'))}</span></div></div><details class="ast-cx-r3-detail-block"><summary>${esc(tr('House ruler routing','十二宫守护路由'))}</summary><div class="ast-cx-r3-house-ruler-grid">${houseRows}</div></details><details class="ast-cx-r3-detail-block"><summary>${esc(tr('Planetary dispositor chains','行星守护链'))}</summary><div class="ast-cx-r3-chain-list">${chains}</div></details></section>`;
}

function distributionMeters(data,labels){return Object.entries(data).map(([code,count])=>`<div class="ast-cx-r3-meter"><span>${esc(localPair(labels[code])||code)}</span><strong>${esc(String(count))}</strong><i style="--astcx-value:${Math.max(0,Number(count)||0)}"></i></div>`).join('')}
export function buildElementModalityMatrixHtml(p){
  const d=p?.distribution||{},ec=d.elementCounts||{},mc=d.modalityCounts||{},sc=d.signCounts||{},elements=['FIRE','EARTH','AIR','WATER'],modes=['CARDINAL','FIXED','MUTABLE'];
  const head=modes.map(code=>`<th scope="col">${esc(localPair(MODALITY_LABELS[code])||code)}<strong>${esc(String(mc[code]??0))}</strong></th>`).join('');
  const rows=elements.map(element=>`<tr><th scope="row">${esc(localPair(ELEMENT_LABELS[element])||element)}<strong>${esc(String(ec[element]??0))}</strong></th>${modes.map(mode=>{const sign=ELEMENT_MODALITY_SIGN[element][mode],count=Number(sc[sign]??0);return `<td data-astcx-matrix-element="${esc(element)}" data-astcx-matrix-mode="${esc(mode)}" data-astcx-matrix-sign="${esc(sign)}"><span class="ast-cx-r3-matrix-sign">${esc(SIGN_GLYPH[sign]||'')} <strong>${esc(signName(sign))}</strong></span><b>${esc(String(count))}</b><small>${esc(tr(count===1?'1 core planet':`${count} core planets`,`${count} 颗核心行星`))}</small></td>`}).join('')}</tr>`).join('');
  return `<section class="ast-cx-r3-panel" data-astcx-section="elements-modes" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('ELEMENT × MODALITY MATRIX','元素 × 模式矩阵'))}</p><h2>${esc(tr('See the full distribution without turning a count into a personality verdict','查看完整分布，而不把计数变成人格判定'))}</h2><p>${esc(tr('The matrix rearranges the upstream sign counts into the fixed zodiac element × modality layout. Row and column totals come from the governed unweighted 10-core-planet distribution; tie states remain intact.','矩阵只是把上游星座计数重新排入固定的黄道元素 × 模式布局。行列总数来自受治理的 10 颗核心行星非加权分布；并列状态保持不变。'))}</p></header><div class="ast-cx-r3-matrix-wrap"><table class="ast-cx-r3-matrix"><thead><tr><th>${esc(tr('Element / mode','元素 / 模式'))}</th>${head}</tr></thead><tbody>${rows}</tbody></table></div><div class="ast-cx-r3-distribution"><div><h3>${esc(tr('Element totals','元素总数'))}</h3>${distributionMeters(ec,ELEMENT_LABELS)}<p>${esc(leaderText(d.elementLeader,ELEMENT_LABELS))}</p></div><div><h3>${esc(tr('Mode totals','模式总数'))}</h3>${distributionMeters(mc,MODALITY_LABELS)}<p>${esc(leaderText(d.modalityLeader,MODALITY_LABELS))}</p></div></div><p class="ast-cx-r3-boundary">${esc(tr(`Scope: ${distributionScopeLabel(d.scope)}. Angles and nodes are not mixed into these totals. A distribution leader is not treated as a psychological fact.`,`范围：${distributionScopeLabel(d.scope)}。角点与交点不会混入这些总数；分布领先也不会被当作心理事实。`))}</p></section>`;
}
export function buildTimingActivationHtml(p){
  const t=p?.timing||{},items=arr(t.items),available=t.state==='AVAILABLE',target=t.targetContext||{};
  if(!available){
    return `<section class="ast-cx-r3-panel ast-cx-r3-timing" data-astcx-section="timing-activation" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('TIMING & ACTIVATION','时间与激活'))}</p><h2>${esc(tr('Natal reading is ready; current activation is not attached','本命读取已经准备好；当前激活尚未附加'))}</h2><p>${esc(tr('The specialist surface does not infer a target moment from the browser or server clock and never calculates transits in the renderer. A governed target context must arrive through the canonical customer route before this layer can open.','专业界面不会从浏览器或服务器时钟自行推断目标时刻，也不会在 renderer 内计算行运。只有受治理的目标时间通过 canonical customer route 进入后，这一层才会开启。'))}</p></header><div class="ast-cx-r3-timing-lane" data-state="unavailable"><article><small>${esc(tr('Natal','本命'))}</small><strong>${esc(tr('Available','可读取'))}</strong><span>${esc(tr('Your birth structure remains complete on its own.','你的出生结构本身仍可完整阅读。'))}</span></article><i aria-hidden="true">→</i><article><small>${esc(tr('Target moment','目标时刻'))}</small><strong>${esc(tr('Not attached','尚未附加'))}</strong><span>${esc(tr('No clock inference','不会自行取当前时间'))}</span></article><i aria-hidden="true">→</i><article><small>${esc(tr('Current activation','当前激活'))}</small><strong>${esc(tr('Closed','未开启'))}</strong><span>${esc(tr('No fallback prediction is generated.','不会生成替代性的预测文字。'))}</span></article></div></section>`;
  }
  const date=target.targetDate||'',time=target.targetTime||'',tz=target.targetTimezone?.iana||'',relations=items.filter(x=>x.itemType==='ASTT_RELATION'),houses=items.filter(x=>x.itemType==='ASTT_HOUSE_ACTIVATION');
  const cards=items.map(item=>`<article class="ast-cx-r3-timing-card"><span>${esc(timingItemLabel(item.itemType))}</span><p>${esc(item.readerText||tr('Governed activation item','受治理激活项目'))}</p>${item.orbDegrees!=null?`<small>${esc(tr(`Orb ${fmt(item.orbDegrees)}°`,`容许度 ${fmt(item.orbDegrees)}°`))}</small>`:''}</article>`).join('');
  return `<section class="ast-cx-r3-panel ast-cx-r3-timing" data-astcx-section="timing-activation" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('TIMING & ACTIVATION','时间与激活'))}</p><h2>${esc(tr('Natal → target moment → current activation','本命 → 目标时刻 → 当前激活'))}</h2><p>${esc(tr('This lane only renders admitted temporal output already produced upstream. It stays separate from natal meaning and does not predict guaranteed events.','这条时间线只呈现上游已经生成并获准发布的时间输出；它与本命意义保持分离，也不会预测必然事件。'))}</p></header><div class="ast-cx-r3-timing-lane" data-state="available"><article><small>${esc(tr('Natal','本命'))}</small><strong>${esc(tr('Birth structure','出生结构'))}</strong><span>${esc(houseSystemLabel(p?.houseSystemId))}</span></article><i aria-hidden="true">→</i><article><small>${esc(tr('Target moment','目标时刻'))}</small><strong>${esc(`${date}${time?` · ${time}`:''}`||tr('Explicit target','明确目标时刻'))}</strong><span>${esc(tz||tr('Recorded timezone','已记录时区'))}</span></article><i aria-hidden="true">→</i><article><small>${esc(tr('Current activation','当前激活'))}</small><strong>${esc(tr(`${items.length} governed item(s)`,`${items.length} 个受治理项目`))}</strong><span>${esc(tr(`${relations.length} relationship · ${houses.length} house activation`,`${relations.length} 个关系激活 · ${houses.length} 个宫位激活`))}</span></article></div><div class="ast-cx-r3-timing-grid">${cards}</div><p class="ast-cx-r3-boundary">${esc(tr('Current activation describes symbolic structural context only. It does not establish an event, diagnosis, outcome or good/bad score.','当前激活只描述象征性的结构情境，不建立具体事件、诊断、结果或吉凶评分。'))}</p></section>`;
}
function realityPreview(p,x=null){
  const r=experienceOk(x)?x.realityComparison:p?.realityComparison,items=arr(r?.items),bound=r?.state==='BOUND'&&items.length>0;
  const cards=bound?`<div class="ast-cx-r3-reality-grid">${items.map(item=>{const theme=themeByRef(p,item.themeRef);return `<article class="ast-cx-r3-reality-card"><span>${esc(tr('CUSTOMER SELF-REPORT','客户自述'))}</span><h3>${esc(theme?.readerTitle||tr('Whole-chart theme','整盘主题'))}</h3><strong>${esc(realityResponseLabel(item.customerResponse))}</strong><button type="button" data-astcx-jump-theme-owner="${esc(item.themeRef)}">${esc(tr('Return to the astrology reading','回到占星读取'))}</button></article>`}).join('')}</div>`:'';
  return `<section class="ast-cx-r3-panel" data-astcx-section="reality-comparison" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('REALITY COMPARISON','现实对照'))}</p><h2>${esc(bound?tr('Your own reality comparison is attached','已经附加你的现实对照'):tr('Not yet compared with your current reality','尚未与你当前现实进行对照'))}</h2><p>${esc(tr('Current Reality remains owned by the governed Personal Reading runtime. Astrology only displays explicit customer comparison records linked by theme reference; it never treats agreement as proof that the chart is objectively true.','当前现实继续由受治理的 Personal Reading runtime 负责。占星只显示通过主题引用明确绑定的客户现实对照记录；即使客户觉得符合，也不会把它升级成命盘客观为真的证明。'))}</p></header>${cards}${!bound?`<p class="ast-cx-r3-boundary">${esc(tr('No governed Reality Comparison handoff is present on this route yet. The chart will not guess one.','当前路径尚未提供受治理的 Reality Comparison handoff；命盘不会自行猜测现实状态。'))}</p>`:''}</section>`;
}
export function buildTechnicalDisclosureHtml(p){
  const t=p?.technical||{},refs=arr(t.sourceRefs),house=houseSystemLabel(t.houseSystemId||p?.houseSystemId);
  const customer=`<section class="ast-cx-r3-panel ast-cx-r3-why-reading" data-astcx-section="sources-technical" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('WHY THIS READING','为什么这样读'))}</p><h2>${esc(tr('The reading stays connected to calculation, admitted meaning and whole-chart synthesis','这份读取持续连接到计算、获准意义与整盘综合'))}</h2><p>${esc(tr('Technical identifiers are preserved for audit, but they remain collapsed so the customer reading is not interrupted by internal codes.','技术识别码会为审计而保留，但默认折叠，不让内部代码打断客户读取。'))}</p></header><div class="ast-cx-r3-technical-summary"><article><small>${esc(tr('House system','宫制'))}</small><strong>${esc(house)}</strong></article><article><small>${esc(tr('Calculation','计算'))}</small><strong>${esc(tr('Governed source retained','受治理来源已保留'))}</strong></article><article><small>${esc(tr('Interpretation','解释'))}</small><strong>${esc(t.r4aAdmissionStatus?tr('Human-admitted meaning retained','人工获准意义已保留'):tr('Governed meaning lineage retained','受治理意义 lineage 已保留'))}</strong></article><article><small>${esc(tr('Lineage','来源链'))}</small><strong>${esc(tr(`${refs.length} technical reference(s) preserved`,`${refs.length} 条技术引用已保留`))}</strong></article></div>`;
  const details=`<details class="ast-cx-r3-technical" data-astcx-technical-details><summary>${esc(tr('Open technical details','展开技术细节'))}</summary><p>${esc(tr('The fields below are audit metadata. They are not additional interpretation.','以下字段属于审计 metadata，不是额外解释。'))}</p><dl><dt>${esc(tr('House system ID','宫制 ID'))}</dt><dd><code>${esc(t.houseSystemId||p?.houseSystemId||'—')}</code></dd><dt>${esc(tr('Projection ID','投射 ID'))}</dt><dd><code>${esc(t.projectionId||p?.projectionId||'—')}</code></dd><dt>${esc(tr('Canonical projection schema','Canonical 投射 schema'))}</dt><dd><code>${esc(t.canonicalProjectionSchema||'—')}</code></dd><dt>${esc(tr('Semantic projection schema','语义投射 schema'))}</dt><dd><code>${esc(t.professionalSemanticSchema||'—')}</code></dd><dt>${esc(tr('Whole-chart synthesis schema','整盘综合 schema'))}</dt><dd><code>${esc(t.synthesisSchema||'—')}</code></dd><dt>${esc(tr('Reading schema','读取 schema'))}</dt><dd><code>${esc(t.readingSchema||'—')}</code></dd><dt>${esc(tr('Meaning authority','意义权威'))}</dt><dd><code>${esc(t.meaningOntologyVersion||'—')}</code></dd><dt>${esc(tr('Composition rule','组合规则'))}</dt><dd><code>${esc(t.compositionRuleVersion||'—')}</code></dd><dt>${esc(tr('Human admission','人工审核'))}</dt><dd><code>${esc(t.r4aAdmissionStatus||'—')}</code></dd><dt>${esc(tr('Source references','来源引用'))}</dt><dd>${refs.length?refs.map(x=>`<code>${esc(x)}</code>`).join(' '):'—'}</dd></dl></details></section>`;
  return customer+details;
}

export function buildAstrologySpecialistSurfaceV3(p,x=null){
  if(p?.schemaVersion!=='PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0'||p?.methodId!=='AST')return Object.freeze({status:'NOT_HANDLED',reason:'AST_CUSTOMER_PRODUCT_V3_REQUIRED'});
  const exp=experienceOk(x)?x:null;
  const visualHtml=`<article class="ast-cx-r3" data-ast-cx-r3-surface="${AST_CX_R3_SURFACE_SCHEMA}">${overviewHtml(p)}${myReadingHtml(p,exp)}${buildNatalChartV2(p)}`;
  const readingHtml=`${buildCoreConfigurationHtml(p)}${buildPlanetsHousesExplorerHtml(p)}${buildAspectsPatternsHtml(p)}${buildRulershipNetworkHtml(p)}${buildElementModalityMatrixHtml(p)}${buildTimingActivationHtml(p)}${realityPreview(p,exp)}</article>`;
  return Object.freeze({status:'RENDERED',navigationHtml:navHtml(),visualHtml,readingHtml,technicalHtml:buildTechnicalDisclosureHtml(p)});
}

function setSelectionState(root,p,kind,ref){
  root.querySelectorAll?.('[data-astcx-state]').forEach(el=>delete el.dataset.astcxState);
  root.querySelectorAll?.('[data-astcx-select-kind]').forEach(el=>el.setAttribute?.('aria-pressed','false'));
  const mark=(selector,state='related',predicate=()=>true)=>root.querySelectorAll?.(selector).forEach(el=>{if(predicate(el))el.dataset.astcxState=state});
  const selected=arr(root.querySelectorAll?.('[data-astcx-select-kind]')).filter(el=>el.dataset.astcxSelectKind===kind&&String(el.dataset.astcxRef)===String(ref));selected.forEach(el=>{el.dataset.astcxState='selected';el.setAttribute?.('aria-pressed','true')});
  if(kind==='planet'){
    mark('[data-astcx-body]','selected',el=>el.dataset.astcxBody===ref);mark('[data-astcx-aspect]','related',el=>el.dataset.from===ref||el.dataset.to===ref);mark('[data-astcx-theme-card]','related',el=>relatedThemesForBody(p,ref).some(t=>t.themeRef===el.dataset.astcxThemeCard));
  }else if(kind==='aspect'){
    const a=byCode(p?.aspectNetwork?.aspects,'aspectRef',ref);mark('[data-astcx-aspect]','selected',el=>el.dataset.astcxAspect===ref);if(a)mark('[data-astcx-body]','related',el=>[a.fromCode,a.toCode].includes(el.dataset.astcxBody));mark('[data-astcx-theme-card]','related',el=>relatedThemesForAspect(p,ref).some(t=>t.themeRef===el.dataset.astcxThemeCard));
  }else if(kind==='house'){
    mark('[data-astcx-house]','selected',el=>String(el.dataset.astcxHouse)===String(ref));const bodies=arr(p?.chart?.positions).filter(x=>Number(x.houseNumber)===Number(ref)).map(x=>x.bodyCode);mark('[data-astcx-body]','related',el=>bodies.includes(el.dataset.astcxBody));mark('[data-astcx-theme-card]','related',el=>relatedThemesForHouse(p,ref).some(t=>t.themeRef===el.dataset.astcxThemeCard));
  }else if(kind==='pattern'){
    const x=patternByRef(p,ref)||arr(p?.aspectNetwork?.patterns).find(a=>patternMatchesRef(a,ref));if(x){mark('[data-astcx-body]','related',el=>arr(x.bodyCodes).includes(el.dataset.astcxBody));mark('[data-astcx-aspect]','related',el=>arr(x.evidenceAspectRefs).includes(el.dataset.astcxAspect));mark('[data-astcx-pattern]','selected',el=>el.dataset.astcxPattern===x.patternCode);mark('[data-astcx-theme-card]','related',el=>arr(x.themeRefs).includes(el.dataset.astcxThemeCard));}
  }else if(kind==='theme'){
    const t=themeByRef(p,ref);if(t){mark('[data-astcx-theme-card]','selected',el=>el.dataset.astcxThemeCard===ref);mark('[data-astcx-body]','related',el=>arr(t.bodyCodes).includes(el.dataset.astcxBody));mark('[data-astcx-house]','related',el=>arr(t.houseNumbers).map(String).includes(String(el.dataset.astcxHouse)));mark('[data-astcx-aspect]','related',el=>arr(t.evidenceRefs).includes(el.dataset.astcxAspect));if(t.patternCode)mark('[data-astcx-pattern]','related',el=>el.dataset.astcxPattern===t.patternCode);}
  }
}
function activateSelection(root,p,kind,ref){const inspector=root.querySelector?.('[data-astcx-inspector]');if(inspector)inspector.innerHTML=buildAstExplorerInspectorHtml(p,kind,ref);setSelectionState(root,p,kind,ref)}
function setDirectoryMode(root,mode){
  root.querySelectorAll?.('[data-astcx-directory-mode]').forEach(el=>el.setAttribute?.('aria-pressed',String(el.dataset.astcxDirectoryMode===mode)));
  root.querySelectorAll?.('[data-astcx-directory-pane]').forEach(el=>{el.hidden=el.dataset.astcxDirectoryPane!==mode});
}
function setAspectFilter(root,filter){
  root.querySelectorAll?.('[data-astcx-aspect-filter]').forEach(el=>el.setAttribute?.('aria-pressed',String(el.dataset.astcxAspectFilter===filter)));
  root.querySelectorAll?.('[data-astcx-aspect-row]').forEach(el=>{el.hidden=filter!=='ALL'&&el.dataset.astcxAspectDynamic!==filter});
}
export function orderedThemeRefsForIntent(x,intentId){
  if(!experienceOk(x))return [];
  const view=intentView(x,intentId)||intentView(x,'OPEN');return arr(view?.priorityThemeRefs);
}
function jumpToThemeOwner(root,ref){
  const owner=arr(root.querySelectorAll?.('[data-astcx-theme-owner]')).find(el=>String(el.dataset.astcxThemeOwner)===String(ref));
  owner?.scrollIntoView?.({behavior:'smooth',block:'start'});owner?.focus?.();return owner||null;
}
function setIntentLens(root,x,intentId){
  if(!experienceOk(x))return;
  const view=intentView(x,intentId)||intentView(x,'OPEN');if(!view)return;
  root.querySelectorAll?.('[data-astcx-intent]').forEach(el=>el.setAttribute?.('aria-pressed',String(el.dataset.astcxIntent===view.intentId)));
  const copy=root.querySelector?.('[data-astcx-intent-copy]');if(copy)copy.textContent=view.readerText||tr('Open reading keeps the whole-chart order without changing meaning.','开放探索保持整盘顺序，不改变任何占星意义。');
  const listNode=root.querySelector?.('[data-astcx-theme-owner-list]');if(!listNode)return;
  const cards=arr(listNode.querySelectorAll?.('[data-astcx-theme-owner]')),byRef=new Map(cards.map(el=>[el.dataset.astcxThemeOwner,el]));
  orderedThemeRefsForIntent(x,view.intentId).forEach(ref=>{const el=byRef.get(ref);if(el)listNode.appendChild?.(el)});
  arr(listNode.querySelectorAll?.('[data-astcx-theme-owner]')).forEach((el,i)=>{const order=el.querySelector?.('[data-astcx-theme-order]');if(order)order.textContent=String(i+1).padStart(2,'0')});
  listNode.dataset.astcxActiveIntent=view.intentId;
}
export function installAstrologySpecialistInteractions(root,p,x=null){
  if(!root||!p||root.dataset.astCxR3Interactions==='true')return;
  root.addEventListener?.('click',event=>{
    const jump=event.target?.closest?.('[data-astcx-jump-theme-owner]');if(jump){jumpToThemeOwner(root,jump.dataset.astcxJumpThemeOwner);return}
    const intent=event.target?.closest?.('[data-astcx-intent]');if(intent){setIntentLens(root,x,intent.dataset.astcxIntent);return}
    const mode=event.target?.closest?.('[data-astcx-directory-mode]');if(mode){setDirectoryMode(root,mode.dataset.astcxDirectoryMode);return}
    const filter=event.target?.closest?.('[data-astcx-aspect-filter]');if(filter){setAspectFilter(root,filter.dataset.astcxAspectFilter);return}
    const trigger=event.target?.closest?.('[data-astcx-select-kind]');if(!trigger)return;activateSelection(root,p,trigger.dataset.astcxSelectKind,trigger.dataset.astcxRef)
  });
  root.addEventListener?.('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const trigger=event.target?.closest?.('[data-astcx-select-kind]');if(!trigger)return;event.preventDefault?.();activateSelection(root,p,trigger.dataset.astcxSelectKind,trigger.dataset.astcxRef)});
  if(experienceOk(x))setIntentLens(root,x,x.intentLens?.activeIntentId||'OPEN');
  root.dataset.astCxR3Interactions='true';
}

export default Object.freeze({AST_CX_R3_SURFACE_SCHEMA,AST_CX_R3_IA,buildNatalChartV2,buildAstExplorerInspectorHtml,buildCoreConfigurationHtml,buildPlanetsHousesExplorerHtml,buildAspectsPatternsHtml,buildRulershipNetworkSvg,buildRulershipNetworkHtml,buildElementModalityMatrixHtml,orderedThemeRefsForIntent,buildAstrologySpecialistSurfaceV3,installAstrologySpecialistInteractions});
