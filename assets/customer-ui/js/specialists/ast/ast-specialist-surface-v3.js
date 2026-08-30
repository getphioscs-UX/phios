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
const ASPECT_LABELS=Object.freeze({CONJUNCTION:['Conjunction','合相'],SEXTILE:['Sextile','六合'],SQUARE:['Square','四分'],TRINE:['Trine','三分'],OPPOSITION:['Opposition','对分']});
const DYNAMIC_LABELS=Object.freeze({APPLYING:['Applying','正在趋近'],SEPARATING:['Separating','正在分离'],EXACT:['Exact','精确'],UNDETERMINED:['Undetermined','未确定']});
const HOUSE_SYSTEM_LABELS=Object.freeze({PLACIDUS_V1:['Placidus','普拉西德宫制'],WHOLE_SIGN_V1:['Whole Sign','整宫制']});
const fmt=n=>Number.isFinite(Number(n))?Number(n).toFixed(Number(n)%1?1:0):'—';
const norm=n=>((Number(n)||0)%360+360)%360;
const byCode=(xs,key,value)=>arr(xs).find(x=>x?.[key]===value)||null;
const unique=xs=>[...new Set(arr(xs).filter(Boolean))];
const localPair=pair=>pair?tr(pair[0],pair[1]):'';
const bodyName=(p,code)=>byCode(p?.chart?.positions,'bodyCode',code)?.bodyLabel||code||'—';
const houseLabel=n=>tr(`House ${Number(n)||'—'}`,`第 ${Number(n)||'—'} 宫`);
const aspectLabel=code=>localPair(ASPECT_LABELS[code])||tr('Aspect','相位');
const dynamicLabel=code=>localPair(DYNAMIC_LABELS[code])||tr('Undetermined','未确定');
const houseSystemLabel=code=>localPair(HOUSE_SYSTEM_LABELS[code])||tr('Selected house system','当前宫制');
const placement=p=>p?`${p.signLabel||''} ${fmt(p.degreeWithinSign)}°${p.houseNumber?` · ${houseLabel(p.houseNumber)}`:''}${p.retrograde?` · ${tr('Retrograde','逆行')}`:''}`:'—';
const anglePlacement=a=>a?`${a.signLabel||''} ${fmt(a.degreeWithinSign)}°`:'—';
const themeByRef=(p,ref)=>arr(p?.keyConfigurations).find(x=>x.themeRef===ref)||null;
const patternByRef=(p,ref)=>arr(p?.aspectNetwork?.patterns).find((x,i)=>patternRef(x,i)===ref)||null;
const patternRef=(x,i=0)=>`${x?.patternCode||'PATTERN'}:${arr(x?.bodyCodes).join('|')}:${i}`;
const patternMatchesRef=(x,ref)=>ref===x?.patternCode||String(ref||'').startsWith(`${x?.patternCode}:`);
const relatedThemesForBody=(p,code)=>arr(p?.keyConfigurations).filter(t=>arr(t.bodyCodes).includes(code));
const relatedThemesForHouse=(p,n)=>arr(p?.keyConfigurations).filter(t=>arr(t.houseNumbers).includes(Number(n)));
const relatedThemesForAspect=(p,ref)=>arr(p?.keyConfigurations).filter(t=>arr(t.evidenceRefs).includes(ref));

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
    return `${inspectorHeader(tr('HOUSE','宫位'),houseLabel(n),`${h.signLabel||''} ${fmt(norm(h.longitude)%30)}°`)}<dl class="ast-cx-r3-facts"><dt>${esc(tr('Cusp','宫头'))}</dt><dd>${esc(`${h.signLabel||''} ${fmt(norm(h.longitude)%30)}°`)}</dd><dt>${esc(tr('Occupants','宫内行星'))}</dt><dd>${esc(occupants.map(x=>x.bodyLabel).join(' · ')||tr('No core planets','无核心行星'))}</dd><dt>${esc(tr('Ruler','宫主星'))}</dt><dd>${esc(bodyName(p,ruler?.rulerBodyCode||ruler?.bodyCode)||'—')}</dd></dl>${relatedThemeLinks(themes)}`;
  }
  if(kind==='pattern'){
    const x=patternByRef(p,ref)||arr(p?.aspectNetwork?.patterns).find(a=>patternMatchesRef(a,ref));if(!x)return '';
    const themes=arr(x.themeRefs).map(r=>themeByRef(p,r)).filter(Boolean);
    return `${inspectorHeader(tr('PATTERN','格局'),x.label||tr('Governed pattern','受治理格局'),x.apexBodyCode?tr(`Apex: ${bodyName(p,x.apexBodyCode)}`,`焦点：${bodyName(p,x.apexBodyCode)}`):'')}<dl class="ast-cx-r3-facts"><dt>${esc(tr('Bodies','行星'))}</dt><dd>${esc(arr(x.bodyCodes).map(c=>bodyName(p,c)).join(' · '))}</dd><dt>${esc(tr('Evidence aspects','证据相位'))}</dt><dd>${esc(String(arr(x.evidenceAspectRefs).length))}</dd><dt>${esc(tr('Reading link','读取关联'))}</dt><dd>${esc(themes.length?tr('Linked to whole-chart reading','已关联整盘读取'):tr('Structure established; no primary reading owner','结构已建立；未指定主读取'))}</dd></dl>${relatedThemeLinks(themes)}`;
  }
  if(kind==='theme'){
    const t=themeByRef(p,ref);if(!t)return '';
    return `${inspectorHeader(tr('WHOLE-CHART THEME','整盘主题'),t.readerTitle,t.readerText)}<dl class="ast-cx-r3-facts"><dt>${esc(tr('Bodies','行星'))}</dt><dd>${esc(arr(t.bodyCodes).map(c=>bodyName(p,c)).join(' · ')||'—')}</dd><dt>${esc(tr('Houses','宫位'))}</dt><dd>${esc(arr(t.houseNumbers).map(n=>houseLabel(n)).join(' · ')||'—')}</dd><dt>${esc(tr('Pattern','格局'))}</dt><dd>${esc(t.technicalLabel||tr('Not pattern-owned','非格局主导'))}</dd></dl>`;
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
function myReadingHtml(p){const themes=arr(p?.keyConfigurations);return `<section class="ast-cx-r3-panel" data-astcx-section="my-reading" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('MY READING','我的读取'))}</p><h2>${esc(tr('Start with the chart-wide themes','先看整张盘反复出现的主线'))}</h2><p>${esc(tr('Each theme already has one admitted narrative owner. Selecting it links the reading back to the chart without creating a second interpretation.','每个主题已经拥有唯一获准正文所有者。点击主题只把读取重新连回星盘，不会产生第二份解释。'))}</p></header><div class="ast-cx-r3-theme-grid">${themes.map((t,i)=>`<article class="ast-cx-r3-theme-card" data-astcx-theme-card="${esc(t.themeRef)}"><button type="button" data-astcx-select-kind="theme" data-astcx-ref="${esc(t.themeRef)}"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(t.readerTitle)}</strong><small>${esc(t.technicalLabel||tr('Whole-chart structure','整盘结构'))}</small></button><p>${esc(t.readerText)}</p></article>`).join('')}</div></section>`}
function planetHousePreview(p){return `<section class="ast-cx-r3-panel" data-astcx-section="planets-houses" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('PLANETS & HOUSES','行星与宫位'))}</p><h2>${esc(tr('Calculated placements, connected back to the whole chart','计算落点，并连回整盘结构'))}</h2></header><div class="ast-cx-r3-directory">${arr(p?.planetHouseDirectory).map(x=>`<button type="button" data-astcx-select-kind="planet" data-astcx-ref="${esc(x.bodyCode)}"><span class="ast-cx-r3-glyph">${esc(BODY_GLYPH[x.bodyCode]||'•')}</span><strong>${esc(x.bodyLabel)}</strong><span>${esc(placement(x))}</span></button>`).join('')}</div></section>`}
function aspectsPreview(p){const aspects=arr(p?.aspectNetwork?.aspects).slice().sort((a,b)=>Number(a.orbDegrees)-Number(b.orbDegrees)),patterns=arr(p?.aspectNetwork?.patterns);return `<section class="ast-cx-r3-panel" data-astcx-section="aspects-patterns" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('ASPECTS & PATTERNS','相位与格局'))}</p><h2>${esc(tr('Relationship geometry already established upstream','上游已经建立的关系几何'))}</h2></header><div class="ast-cx-r3-pattern-row">${patterns.map((x,i)=>`<button type="button" data-astcx-select-kind="pattern" data-astcx-ref="${esc(patternRef(x,i))}" data-astcx-pattern="${esc(x.patternCode)}"><strong>${esc(x.label)}</strong><span>${esc(arr(x.bodyCodes).map(c=>bodyName(p,c)).join(' · '))}</span></button>`).join('')}</div><div class="ast-cx-r3-aspect-list">${aspects.map(a=>`<button type="button" data-astcx-select-kind="aspect" data-astcx-ref="${esc(a.aspectRef)}"><strong>${esc(`${bodyName(p,a.fromCode)} · ${aspectLabel(a.type)} · ${bodyName(p,a.toCode)}`)}</strong><span>${esc(`${fmt(a.orbDegrees)}° · ${dynamicLabel(a.dynamicState)}`)}</span></button>`).join('')}</div></section>`}
function rulershipPreview(p){const r=p?.rulership||{},chartRuler=bodyName(p,r.chartRuler?.bodyCode),finals=arr(r.finalDispositors).map(c=>bodyName(p,c));return `<section class="ast-cx-r3-panel" data-astcx-section="rulership" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('RULERSHIP','守护星与命盘链'))}</p><h2>${esc(tr('Chart ruler and dispositor structure','命盘守护星与守护链结构'))}</h2></header><div class="ast-cx-r3-summary-strip"><span><small>${esc(tr('Chart ruler','命盘守护星'))}</small><strong>${esc(chartRuler||'—')}</strong></span><span><small>${esc(tr('House rulers','宫主星'))}</small><strong>${esc(String(arr(r.houseRulers).length))}</strong></span><span><small>${esc(tr('Final dispositors','最终守护落点'))}</small><strong>${esc(finals.join(' · ')||'—')}</strong></span><span><small>${esc(tr('Cycles','循环'))}</small><strong>${esc(String(arr(r.cycles).length))}</strong></span></div></section>`}
function distributionPreview(p){const e=p?.distribution?.elementCounts||{},m=p?.distribution?.modalityCounts||{};const blocks=(data,labels)=>Object.entries(data).map(([code,count])=>`<div class="ast-cx-r3-meter"><span>${esc(localPair(labels[code])||code)}</span><strong>${esc(String(count))}</strong><i style="--astcx-value:${Math.max(0,Number(count)||0)}"></i></div>`).join('');return `<section class="ast-cx-r3-panel" data-astcx-section="elements-modes" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('ELEMENTS & MODES','元素与模式'))}</p><h2>${esc(tr('Unweighted distribution, without forcing a single winner','非加权分布，不强行选出单一主导'))}</h2></header><div class="ast-cx-r3-distribution"><div><h3>${esc(tr('Elements','元素'))}</h3>${blocks(e,ELEMENT_LABELS)}<p>${esc(leaderText(p?.distribution?.elementLeader,ELEMENT_LABELS))}</p></div><div><h3>${esc(tr('Modes','模式'))}</h3>${blocks(m,MODALITY_LABELS)}<p>${esc(leaderText(p?.distribution?.modalityLeader,MODALITY_LABELS))}</p></div></div></section>`}
function timingPreview(p){const available=p?.timing?.state==='AVAILABLE';return `<section class="ast-cx-r3-panel" data-astcx-section="timing-activation" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('TIMING & ACTIVATION','时间与激活'))}</p><h2>${esc(available?tr('Governed timing is available for this reading','这次读取已有受治理时间层'):tr('No governed timing layer is attached yet','目前尚未附加受治理时间层'))}</h2><p>${esc(available?tr('Timing remains separate from natal structure and uses only admitted temporal output.','时间层与本命结构保持分离，只使用已获准的时间输出。'):tr('Natal interpretation remains complete on its own. This surface will not calculate transits in the browser.','本命读取本身仍可完整阅读；这个前端不会自行计算行运。'))}</p></header></section>`}
function realityPreview(p){return `<section class="ast-cx-r3-panel" data-astcx-section="reality-comparison" tabindex="-1"><header class="ast-cx-r3-section-head"><p class="ast-cx-r3-kicker">${esc(tr('REALITY COMPARISON','现实对照'))}</p><h2>${esc(p?.realityComparison?.state==='NOT_BOUND'?tr('Not yet compared with your current reality','尚未与你当前现实进行对照'):tr('Reality comparison is available','现实对照已可用'))}</h2><p>${esc(tr('Current Reality remains owned by the governed Personal Reading runtime; Astrology does not infer your present situation from the chart.','当前现实继续由受治理的 Personal Reading runtime 负责；占星不会从命盘自行推断你现在的现实状态。'))}</p></header></section>`}
function technicalHtml(p){const t=p?.technical||{};return `<section data-astcx-section="sources-technical" tabindex="-1"><details class="ast-cx-r3-technical"><summary>${esc(tr('Sources & Technical','来源与技术'))}</summary><p>${esc(tr('Technical lineage is preserved here and stays collapsed by default.','技术 lineage 在这里保留，并默认折叠。'))}</p><dl><dt>${esc(tr('House system','宫制'))}</dt><dd>${esc(t.houseSystemId||p?.houseSystemId||'—')}</dd><dt>${esc(tr('Projection','投射'))}</dt><dd><code>${esc(t.projectionId||p?.projectionId||'—')}</code></dd><dt>${esc(tr('Semantic projection','语义投射'))}</dt><dd><code>${esc(t.professionalSemanticSchema||'—')}</code></dd><dt>${esc(tr('Whole-chart synthesis','整盘综合'))}</dt><dd><code>${esc(t.synthesisSchema||'—')}</code></dd><dt>${esc(tr('Reading schema','读取 schema'))}</dt><dd><code>${esc(t.readingSchema||'—')}</code></dd><dt>${esc(tr('Meaning authority','意义权威'))}</dt><dd><code>${esc(t.meaningOntologyVersion||'—')}</code></dd><dt>${esc(tr('Composition rule','组合规则'))}</dt><dd><code>${esc(t.compositionRuleVersion||'—')}</code></dd></dl></details></section>`}

export function buildAstrologySpecialistSurfaceV3(p){
  if(p?.schemaVersion!=='PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0'||p?.methodId!=='AST')return Object.freeze({status:'NOT_HANDLED',reason:'AST_CUSTOMER_PRODUCT_V3_REQUIRED'});
  const visualHtml=`<article class="ast-cx-r3" data-ast-cx-r3-surface="${AST_CX_R3_SURFACE_SCHEMA}">${overviewHtml(p)}${myReadingHtml(p)}${buildNatalChartV2(p)}`;
  const readingHtml=`${buildCoreConfigurationHtml(p)}${planetHousePreview(p)}${aspectsPreview(p)}${rulershipPreview(p)}${distributionPreview(p)}${timingPreview(p)}${realityPreview(p)}</article>`;
  return Object.freeze({status:'RENDERED',navigationHtml:navHtml(),visualHtml,readingHtml,technicalHtml:technicalHtml(p)});
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
export function installAstrologySpecialistInteractions(root,p){
  if(!root||!p||root.dataset.astCxR3Interactions==='true')return;
  root.addEventListener?.('click',event=>{const trigger=event.target?.closest?.('[data-astcx-select-kind]');if(!trigger)return;activateSelection(root,p,trigger.dataset.astcxSelectKind,trigger.dataset.astcxRef)});
  root.addEventListener?.('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const trigger=event.target?.closest?.('[data-astcx-select-kind]');if(!trigger)return;event.preventDefault?.();activateSelection(root,p,trigger.dataset.astcxSelectKind,trigger.dataset.astcxRef)});
  root.dataset.astCxR3Interactions='true';
}

export default Object.freeze({AST_CX_R3_SURFACE_SCHEMA,AST_CX_R3_IA,buildNatalChartV2,buildAstExplorerInspectorHtml,buildCoreConfigurationHtml,buildAstrologySpecialistSurfaceV3,installAstrologySpecialistInteractions});
