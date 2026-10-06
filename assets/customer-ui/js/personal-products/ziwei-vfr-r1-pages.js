import {getZwrVfrVisualBinding} from '../../../../functions/canonical-presentation-runtime/ziwei-vfr-r1-visual-bindings.js';

export const ZWR_VFR_RENDERER_VERSION='ZWR-VFR-R1-DEEP-RENDERER-v5';

const sanitizeDisplay=v=>String(v??'').replace(/[\uFDD0-\uFDEF\uFFFE\uFFFF]/gu,'-').replace(/\s+-\s+/g,' - ').trim();
const esc=v=>sanitizeDisplay(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STAR={
 TAI_YIN:['太阴','Tai Yin'],TIAN_KUI:['天魁','Tian Kui'],TIAN_FU:['天府','Tian Fu'],TIAN_MA:['天马','Tian Ma'],ZI_WEI:['紫微','Zi Wei'],
 DI_JIE:['地劫','Di Jie'],LING_XING:['铃星','Ling Xing'],TIAN_JI:['天机','Tian Ji'],PO_JUN:['破军','Po Jun'],QING_YANG:['擎羊','Qing Yang'],
 LU_CUN:['禄存','Lu Cun'],TAI_YANG:['太阳','Tai Yang'],TUO_LUO:['陀罗','Tuo Luo'],WU_QU:['武曲','Wu Qu'],TIAN_TONG:['天同','Tian Tong'],
 DI_KONG:['地空','Di Kong'],QI_SHA:['七杀','Qi Sha'],ZUO_FU:['左辅','Zuo Fu'],TIAN_LIANG:['天梁','Tian Liang'],WEN_CHANG:['文昌','Wen Chang'],
 WEN_QU:['文曲','Wen Qu'],LIAN_ZHEN:['廉贞','Lian Zhen'],TIAN_XIANG:['天相','Tian Xiang'],YOU_BI:['右弼','You Bi'],HUO_XING:['火星','Huo Xing'],
 JU_MEN:['巨门','Ju Men'],TIAN_YUE:['天钺','Tian Yue'],TAN_LANG:['贪狼','Tan Lang']
};
const PAL={
 LIFE:['命宫','Life'],SIBLINGS:['兄弟宫','Siblings'],SPOUSE:['夫妻宫','Spouse'],CHILDREN:['子女宫','Children'],WEALTH:['财帛宫','Wealth'],
 HEALTH:['疾厄宫','Health'],TRAVEL:['迁移宫','Travel'],FRIENDS:['仆役宫','Friends'],CAREER:['官禄宫','Career'],PROPERTY:['田宅宫','Property'],
 WELLBEING:['福德宫','Wellbeing'],PARENTS:['父母宫','Parents']
};
const TX={HUA_LU:['化禄','Hua Lu'],HUA_QUAN:['化权','Hua Quan'],HUA_KE:['化科','Hua Ke'],HUA_JI:['化忌','Hua Ji']};
const LAYER={NATAL:['本命','Natal'],DA_XIAN:['大限','Da Xian'],LIU_NIAN:['流年','Liu Nian']};
const ROLE={STRUCTURAL_BASELINE:['本命基线','Natal baseline'],LONG_CYCLE_MODIFICATION:['长期周期','Long-cycle emphasis'],YEAR_LEVEL_ACTIVATION:['年度激活','Annual activation']};
const BRANCH={ZI:['子','Zi'],CHOU:['丑','Chou'],YIN:['寅','Yin'],MAO:['卯','Mao'],CHEN:['辰','Chen'],SI:['巳','Si'],WU:['午','Wu'],WEI:['未','Wei'],SHEN:['申','Shen'],YOU:['酉','You'],XU:['戌','Xu'],HAI:['亥','Hai']};
const STATE={MIAO:['庙','Miao'],WANG:['旺','Wang'],DE:['得','De'],LI:['利','Li'],PING:['平','Ping'],BU:['不','Bu'],XIAN:['陷','Xian']};
const SECTION_TONE={
 S02:['#6d4bc3','#d6a84b'],S03:['#2f7fa7','#7b5bd6'],S04:['#2f6f8f','#d49b43'],S05:['#b07a2c','#6d9a65'],
 S06:['#a85778','#6a58c8'],S07:['#5a8f68','#c59a46'],S08:['#8e4e62','#4d7da6'],S09:['#6f4bb8','#c98d36'],
 S10:['#3b78a8','#a65d88'],S11:['#4e6b9e','#b98942']
};
const PAL_TONE={LIFE:'#7a58c7',SIBLINGS:'#4c7fb2',SPOUSE:'#b85d86',CHILDREN:'#d47a47',WEALTH:'#c89a37',HEALTH:'#a04f57',TRAVEL:'#3b93a3',FRIENDS:'#4f8c72',CAREER:'#4667a9',PROPERTY:'#8a6b55',WELLBEING:'#7658a8',PARENTS:'#8a7a4e'};
const TX_TONE={HUA_LU:'#8da53f',HUA_QUAN:'#7b4fc6',HUA_KE:'#3f91ba',HUA_JI:'#b74f4f'};
const LAYER_TONE={NATAL:'#485c8f',DA_XIAN:'#7350b6',LIU_NIAN:'#c18436'};
const cssVars=(a,b)=>'--zv-accent:'+a+';--zv-accent2:'+b+';';
const sectionVars=id=>{const [a,b]=SECTION_TONE[id]||['#6d4bc3','#c59647'];return cssVars(a,b);};
const TITLES={
 TWELVE_PALACE_NATAL_MAP:['十二宫本命结构','Twelve-palace Natal Structure'],
 LIFE_BODY_AXIS:['命身轴','Life-Body Axis'],PALACE_NETWORK:['宫位关系网络','Palace Relationship Network'],KEY_STAR_STRUCTURE:['主星结构','Key Star Structure'],
 FOUR_TRANSFORMATION_ROUTE:['四化路径','Four Transformations'],CAREER_PALACE_NETWORK:['官禄宫结构','Career Palace Structure'],WEALTH_PALACE_NETWORK:['财帛宫结构','Wealth Palace Structure'],
 RELATIONSHIP_PALACE_NETWORK:['关系宫位网络','Relationship Palace Network'],FAMILY_SUPPORT_PALACES:['家庭与支持宫位','Family & Support Palaces'],
 PRESSURE_COUNTERWEIGHT_MAP:['压力与制衡结构','Pressure & Counterweight'],NATAL_DAXIAN_LIUNIAN_STACK:['本命・大限・流年','Natal · Da Xian · Liu Nian'],
 CURRENT_PALACE_ACTIVATION:['当前宫位激活','Current Palace Activation'],LIFE_CAREER_WEALTH_TRAVEL_CROSS:['命・官・财・迁联动','Life · Career · Wealth · Travel'],
 TRANSFORMATION_LAYER_COMPARISON:['三层四化对照','Transformation Layer Comparison'],WHOLE_CHART_NAVIGATION:['整盘导航图','Whole-chart Navigation']
};
const pair=(m,k)=>m[k]||[String(k||'—'),String(k||'—')];
const bi=(m,k)=>{const x=pair(m,k);return esc(x[0])+'<small>'+esc(x[1])+'</small>';};
const plain=(m,k)=>pair(m,k).join(' · ');
const branch=v=>{const x=pair(BRANCH,v);return esc(x[0]+' · '+x[1]);};
const state=v=>{if(!v)return '状态未定 / state unknown';const x=pair(STATE,v);return x[0]+' · '+x[1];};

function card(title,value,detail='',opts={}){
 const t=opts.titleHtml?String(title):esc(title);
 const v=opts.valueHtml?String(value):esc(value);
 const d=opts.detailHtml?String(detail):esc(detail);
 return '<div class="zv-card"><small>'+t+'</small><b>'+v+'</b>'+(detail?'<p>'+d+'</p>':'')+'</div>';
}
function palaceGrid(data){
 const pos=[[1,1],[1,2],[1,3],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[3,1],[2,1]];
 const palaces=(data.palaces||[]).slice(0,12);
 const cells=palaces.map((p,i)=>{
  const [r,col]=pos[i]||[1,1];
  const stars=(p.stars||[]).slice(0,4).map(s=>plain(STAR,s.starCode)).join(' · ')||'—';
  return '<article class="zv-palace '+(p.isLifePalace?'is-life ':'')+(p.isBodyPalace?'is-body':'')+'" style="--pal:'+esc(PAL_TONE[p.palaceCode]||'#7a6b8d')+';grid-row:'+r+';grid-column:'+col+'"><span class="idx">'+String(i+1).padStart(2,'0')+'</span><b>'+bi(PAL,p.palaceCode)+'</b><em>'+branch(p.branch)+'</em><p>'+esc(stars)+'</p>'+(p.isLifePalace?'<i>命</i>':'')+(p.isBodyPalace?'<i>身</i>':'')+'</article>';
 }).join('');
 return '<div class="zv-ziwei-board">'+cells+'<div class="zv-chart-core"><span>紫微斗数</span><strong>十二宫本命盘</strong><small>12-Palace Natal Chart</small><div><b>命宫</b><i>×</i><b>身宫</b></div></div></div>';
}
function axis(data){
 const ls=(data.lifeStars||[]).map(s=>plain(STAR,s.starCode));
 const bs=(data.bodyStars||[]).map(s=>plain(STAR,s.starCode));
 const node=(kind,code,stars,side)=>'<article class="zv-axis-node '+side+'" style="--pal:'+esc(PAL_TONE[code]||'#6d668a')+'"><span>'+kind+'</span><strong>'+bi(PAL,code)+'</strong><div>'+stars.map(s=>'<b>'+esc(s)+'</b>').join('')+'</div></article>';
 return '<div class="zv-axis-map">'+node('命宫 / Life',data.lifePalace,ls,'life')+'<div class="zv-axis-core"><span>命</span><i>⇄</i><span>身</span><small>内在判断 → 现实落地</small><em>Inner appraisal → lived implementation</em></div>'+node('身宫 / Body',data.bodyPalace,bs,'body')+'</div>';
}
function network(data,ctx={}){
 const rel=data.relationships||[];
 const preferred=ctx.sectionId==='S02'?['LIFE','TRAVEL','CAREER','WEALTH']:null;
 const relCodes=[...new Set(rel.flatMap(r=>[r.from,...(r.to||[])]).filter(Boolean))];
 const codes=(preferred||relCodes).filter(x=>relCodes.includes(x)||preferred).slice(0,6);
 const coords=[[380,72],[620,210],[380,348],[140,210],[560,92],[200,328]];
 const pts=codes.map((code,i)=>({code,x:coords[i]?.[0]||380,y:coords[i]?.[1]||210}));
 const by=new Map(pts.map(x=>[x.code,x]));
 const edges=rel.flatMap(r=>(r.to||[]).map(to=>[r.from,to])).filter(([a,b])=>by.has(a)&&by.has(b));
 const focus=codes[0];
 return '<div class="zv-network-shell"><div class="zv-network-kicker">三方四正 / Palace Geometry</div><svg class="zv-svg zv-network-svg" viewBox="0 0 760 420" role="img">'+
 edges.map(([a,b])=>{const A=by.get(a),B=by.get(b);const strong=a===focus||b===focus;return '<line x1="'+A.x+'" y1="'+A.y+'" x2="'+B.x+'" y2="'+B.y+'" class="zv-line '+(strong?'is-primary':'is-secondary')+'"/>';}).join('')+
 pts.map(p=>'<g class="'+(p.code===focus?'is-focus':'')+'" style="--pal:'+esc(PAL_TONE[p.code]||'#6c668d')+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="'+(p.code===focus?58:48)+'" class="zv-node"/><text x="'+p.x+'" y="'+(p.y-3)+'" text-anchor="middle">'+esc(pair(PAL,p.code)[0])+'</text><text x="'+p.x+'" y="'+(p.y+16)+'" text-anchor="middle" class="en">'+esc(pair(PAL,p.code)[1])+'</text></g>').join('')+
 '</svg></div>';
}
function stars(data){
 const rows=(data.stars||[]).slice(0,16);
 return '<div class="zv-star-atlas"><div class="zv-star-atlas-core"><span>主星结构</span><strong>Major Stars</strong><small>宫位 × 星曜 × 庙旺</small></div>'+rows.map((s,i)=>{
  const a=(i/Math.max(1,rows.length))*Math.PI*2-Math.PI/2;
  const x=50+40*Math.cos(a),y=50+40*Math.sin(a);
  return '<article class="zv-star-orb" style="--pal:'+esc(PAL_TONE[s.palaceCode]||'#6c668d')+';left:'+x+'%;top:'+y+'%"><b>'+bi(STAR,s.starCode)+'</b><span>'+bi(PAL,s.palaceCode)+'</span><em>'+(s.stateKnown?esc(state(s.state)):'状态未定 · unknown')+'</em></article>';
 }).join('')+'</div>';
}
function transformations(data){
 const xs=(data.transformations||data.layers?.flatMap(x=>x.transformations||[])||[]).slice(0,16);
 const layers=['NATAL','DA_XIAN','LIU_NIAN'];
 return '<div class="zv-tx-orbits">'+layers.map((layer,li)=>{
  const rows=xs.filter(t=>t.layer===layer);
  return '<section class="zv-tx-track" style="--layer:'+esc(LAYER_TONE[layer]||'#6f6f86')+'"><header><b>'+bi(LAYER,layer)+'</b><span>'+String(li+1).padStart(2,'0')+'</span></header><div class="zv-tx-track-line">'+
  (rows.length?rows.map(t=>'<article style="--tx:'+esc(TX_TONE[t.transformationCode]||'#9d7b44')+'"><i></i><strong>'+bi(STAR,t.targetStarCode)+'</strong><em>'+bi(TX,t.transformationCode)+'</em><small>'+bi(PAL,t.palaceCode)+'</small></article>').join(''):'<p>—</p>')+
  '</div></section>';
 }).join('')+'</div>';
}
function focus(data){
 const ps=Array.isArray(data.palaces)?data.palaces:(data.palace?[data.palace]:[]);
 const stars=data.stars||[],rels=data.relationships||[],tx=data.transformations||[];
 const main=ps[0];
 const others=ps.slice(1,5);
 const related=[...new Set(rels.flatMap(r=>[r.from,...(r.to||[])])).values()].filter(x=>x&&x!==main?.palaceCode).slice(0,5);
 const satellites=[...new Set([...others.map(p=>p.palaceCode),...related])].slice(0,5);
 return '<div class="zv-palace-orbit">'+
  '<div class="zv-orbit-ring outer"></div><div class="zv-orbit-ring inner"></div>'+
  (main?'<article class="zv-orbit-core" style="--pal:'+esc(PAL_TONE[main.palaceCode]||'#6c668d')+'"><small>主宫 / Focus Palace</small><strong>'+bi(PAL,main.palaceCode)+'</strong><em>'+branch(main.branch)+'</em></article>':'')+
  satellites.map((code,i)=>{const a=-Math.PI/2+i*Math.PI*2/Math.max(1,satellites.length);const x=50+38*Math.cos(a),y=48+35*Math.sin(a);return '<article class="zv-orbit-palace" style="--pal:'+esc(PAL_TONE[code]||'#6c668d')+';left:'+x+'%;top:'+y+'%"><b>'+bi(PAL,code)+'</b></article>';}).join('')+
  '<div class="zv-orbit-stars">'+stars.slice(0,10).map(s=>'<span style="--pal:'+esc(PAL_TONE[s.palaceCode]||'#6c668d')+'">'+bi(STAR,s.starCode)+'<em>'+bi(PAL,s.palaceCode)+'</em></span>').join('')+'</div>'+
  (tx.length?'<div class="zv-orbit-tx">'+tx.slice(0,4).map(t=>'<span style="--tx:'+esc(TX_TONE[t.transformationCode]||'#9d7b44')+'">'+bi(TX,t.transformationCode)+' · '+bi(STAR,t.targetStarCode)+'</span>').join('')+'</div>':'')+
 '</div>';
}
function timing(data,ctx={}){
 const rows=[];
 for(const t of data.timing||[])rows.push(t);
 if(data.daXian&&!rows.some(x=>x.layer==='DA_XIAN'))rows.push(data.daXian);
 if(data.liuNian&&!rows.some(x=>x.layer==='LIU_NIAN'))rows.push(data.liuNian);
 const focus=ctx.sectionId==='S09'?'DA_XIAN':ctx.sectionId==='S10'?'LIU_NIAN':null;
 const layerTx=data.transformations||{};
 const cards=rows.slice(0,6).map((t,i)=>{
  const tx=Array.isArray(layerTx?.[t.layer])?layerTx[t.layer]:[];
  const cls=focus===t.layer?' is-focus':'';
  const txHtml=tx.length?'<ul>'+tx.slice(0,4).map(x=>'<li>'+bi(STAR,x.targetStarCode)+' → '+bi(TX,x.transformationCode)+' · '+bi(PAL,x.palaceCode)+'</li>').join('')+'</ul>':'';
  return '<article class="zv-time-layer'+cls+'" style="--layer:'+esc(LAYER_TONE[t.layer]||'#6f6f86')+'"><span>'+String(i+1).padStart(2,'0')+'</span><div><b>'+bi(LAYER,t.layer)+'</b><strong>'+bi(ROLE,t.role)+'</strong>'+txHtml+'</div></article>';
 }).join('');
 const current=data.currentTransformations?.length?'<section class="zv-current-tx"><h4>当前四化 / Current transformations</h4>'+transformations({transformations:data.currentTransformations})+'</section>':'';
 return '<div class="zv-timing" data-focus-layer="'+esc(focus||'ALL')+'">'+cards+current+'</div>';
}
function domains(data){
 const labels={core:['核心','Core'],work:['事业','Work'],resources:['资源','Resources'],relationships:['关系','Relationships'],support:['支持','Support'],pressure:['压力','Pressure']};
 const rows=Object.entries(data.domains||{});
 return '<div class="zv-nav-wheel"><div class="zv-nav-core"><span>现实导航</span><strong>Reality Navigation</strong></div>'+rows.map(([k,v],i)=>{
  const a=-Math.PI/2+i*Math.PI*2/Math.max(1,rows.length),x=50+39*Math.cos(a),y=50+38*Math.sin(a);
  const zh=(Array.isArray(v)?v:[v]).map(x=>pair(PAL,x)[0]).join(' · ');
  const en=(Array.isArray(v)?v:[v]).map(x=>pair(PAL,x)[1]).join(' · ');
  return '<article style="left:'+x+'%;top:'+y+'%"><small>'+esc(labels[k]?.[0]||k)+'<i>'+esc(labels[k]?.[1]||k)+'</i></small><b>'+esc(zh)+'</b><em>'+esc(en)+'</em></article>';
 }).join('')+'</div>';
}
function projectDiagramData(type,data,ctx={}){
 const pageKey=ctx.pageKey||'',sectionId=ctx.sectionId||'';
 if(type==='PALACE_NETWORK'){
  const scopes={S02:['LIFE','TRAVEL','CAREER','WEALTH'],S06:['SPOUSE','CHILDREN','FRIENDS'],S07:['PARENTS','SIBLINGS','FRIENDS','LIFE']};
  const allowed=scopes[sectionId];
  if(allowed){
   const set=new Set(allowed);
   return {...data,relationships:(data.relationships||[]).filter(r=>set.has(r.from)&&(r.to||[]).some(x=>set.has(x))).map(r=>({...r,to:(r.to||[]).filter(x=>set.has(x))}))};
  }
 }
 if(type==='TRANSFORMATION_LAYER_COMPARISON'||type==='FOUR_TRANSFORMATION_ROUTE'){
  let layers=null,palaces=null;
  if(pageKey.startsWith('S04_')){layers=new Set(['DA_XIAN','LIU_NIAN']);palaces=new Set(['CAREER','TRAVEL']);}
  else if(pageKey.startsWith('S05_')){layers=new Set(['NATAL','LIU_NIAN']);palaces=new Set(['WEALTH','PROPERTY']);}
  else if(pageKey.startsWith('S09_'))layers=new Set(['NATAL','DA_XIAN']);
  else if(pageKey.startsWith('S10_'))layers=new Set(['DA_XIAN','LIU_NIAN']);
  const keep=t=>(!layers||layers.has(t.layer))&&(!palaces||palaces.has(t.palaceCode));
  if(Array.isArray(data.transformations))return {...data,transformations:data.transformations.filter(keep)};
  if(Array.isArray(data.layers))return {...data,layers:data.layers.map(x=>({...x,transformations:(x.transformations||[]).filter(keep)})).filter(x=>!layers||layers.has(x.layer))};
 }
 if(type==='LIFE_CAREER_WEALTH_TRAVEL_CROSS'){
  const scopes={S04:['LIFE','CAREER','TRAVEL'],S05:['LIFE','WEALTH','CAREER']};
  const allowed=scopes[sectionId];
  if(allowed){
   const set=new Set(allowed);
   return {...data,palaces:(data.palaces||[]).filter(p=>set.has(p.palaceCode)),stars:(data.stars||[]).filter(s=>set.has(s.palaceCode)),relationships:(data.relationships||[]).filter(r=>set.has(r.from)||(r.to||[]).some(x=>set.has(x)))};
  }
 }
 return data;
}
export function renderZwrVfrDiagram(d,ctx={}){
 const type=d?.type||'UNKNOWN',data=projectDiagramData(type,d?.data||{},ctx),baseTitle=pair(TITLES,type);
 let title=baseTitle;
 if(type==='LIFE_BODY_AXIS'&&ctx.sectionId==='S08')title=['压力下的命身调节','Life-Body Regulation Under Pressure'];
 if(type==='PALACE_NETWORK'&&ctx.sectionId==='S06')title=['关系宫位联动','Relationship Palace Interactions'];
 if(type==='PALACE_NETWORK'&&ctx.sectionId==='S07')title=['支持网络联动','Support Network Interactions'];
 let body='';
 if(type==='TWELVE_PALACE_NATAL_MAP')body=palaceGrid(data);
 else if(type==='LIFE_BODY_AXIS')body=axis(data);
 else if(type==='PALACE_NETWORK')body=network(data,ctx);
 else if(type==='KEY_STAR_STRUCTURE')body=stars(data);
 else if(type==='FOUR_TRANSFORMATION_ROUTE'||type==='TRANSFORMATION_LAYER_COMPARISON')body=transformations(data);
 else if(['CAREER_PALACE_NETWORK','WEALTH_PALACE_NETWORK','RELATIONSHIP_PALACE_NETWORK','FAMILY_SUPPORT_PALACES','PRESSURE_COUNTERWEIGHT_MAP','LIFE_CAREER_WEALTH_TRAVEL_CROSS'].includes(type))body=focus(data);
 else if(['NATAL_DAXIAN_LIUNIAN_STACK','CURRENT_PALACE_ACTIVATION'].includes(type))body=timing(data,ctx);
 else if(type==='WHOLE_CHART_NAVIGATION')body=domains(data);
 else body='<div class="zv-empty">Missing deterministic renderer</div>';
 return '<figure class="zv-diagram'+(ctx.compact?' is-compact':'')+'" data-diagram-id="'+esc(d.id)+'" data-diagram-type="'+esc(type)+'" data-projection="'+esc(ctx.pageKey||'GLOBAL')+'"><figcaption><b>'+esc(title[0])+'</b><span>'+esc(title[1])+'</span></figcaption>'+body+'</figure>';
}

const PURPOSE_EN={
 S02:'The Life-Body axis links decision with implementation.',
 S03:'Inner recovery depends on standards, commitment and stopping conditions.',
 S04:'Career value is read through sustainable contribution and direction.',
 S05:'Resources are read through acquisition, allocation, retention and room for choice.',
 S06:'Relationships are read through reciprocity, position, boundaries and repair.',
 S07:'Stable support depends on distributed roles and usable capacity.',
 S08:'Pressure reading focuses on accumulated load and recovery capacity, not diagnosis.',
 S09:'Da Xian changes reading priority without rewriting the natal chart.',
 S10:'Liu Nian adds an annual layer without replacing the natal baseline.',
 S11:'Navigation protects usable resources, boundaries and recovery space first.'
};
function localeParagraphs(copy){
 if(Array.isArray(copy?.paragraphs))return copy.paragraphs;
 if(Array.isArray(copy?.interpretation))return copy.interpretation;
 return String(copy?.manuscript||'').split(/\n\s*\n/u).map(x=>x.trim()).filter(Boolean);
}
function openingParagraphCount(section,readingCount=1){
 return readingCount>=2?1:2;
}
function sectionMaster(section,binding,diagrams='',compact=false,meta={}){
 const zh=section?.zhHans||{},en=section?.en||{},enSub=PURPOSE_EN[section?.sectionId]||en.subheadline;
 const art='<div class="zv-master-art">'+(binding.hero?'<img class="zv-hero" src="'+esc(binding.hero)+'" alt="">':'')+(binding.motif?'<img class="zv-motif" src="'+esc(binding.motif)+'" alt="">':'')+'</div>';
 const deep=Boolean(zh.manuscript||en.manuscript||zh.paragraphs||en.paragraphs);
 if(deep){
  const opening=openingParagraphCount(section,meta.readingCount||1);
  const z=localeParagraphs(zh).slice(0,opening),e=localeParagraphs(en).slice(0,opening);
  return art+'<div class="zv-master zv-master-deep"><span class="zv-sec">'+esc(section?.sectionId||'')+'</span><h1>'+esc(zh.headline)+'</h1><h2>'+esc(en.headline)+'</h2><p class="zv-purpose">'+esc(zh.subheadline)+'</p><p class="zv-purpose" lang="en">'+esc(enSub)+'</p><div class="zv-master-reading"><article lang="zh-Hans">'+z.map(p=>'<p>'+esc(p)+'</p>').join('')+'</article><article lang="en">'+e.map(p=>'<p>'+esc(p)+'</p>').join('')+'</article></div>'+diagrams+'</div>';
 }
 if(compact){
  const rows=(zh.keyInsights||[]).map((x,i)=>'<div><b>'+esc(x.label)+'</b><p>'+esc(x.text)+'</p><small>'+esc(en.keyInsights?.[i]?.text||'')+'</small></div>').join('');
  return art+'<div class="zv-master zv-master-summary"><span class="zv-sec">'+esc(section?.sectionId||'')+'</span><h1>'+esc(zh.headline)+'</h1><h2>'+esc(en.headline)+'</h2><p>'+esc(zh.subheadline)+'</p><p lang="en">'+esc(enSub)+'</p><div class="zv-summary-insights">'+rows+'</div>'+diagrams+'</div>';
 }
 return art+'<div class="zv-master"><span class="zv-sec">'+esc(section?.sectionId||'')+'</span><h1>'+esc(zh.headline)+'</h1><h2>'+esc(en.headline)+'</h2><p>'+esc(zh.subheadline)+'</p><p lang="en">'+esc(enSub)+'</p><div class="zv-insights">'+(zh.keyInsights||[]).map((x,i)=>'<article><b>0'+(i+1)+'</b><h3>'+esc(x.label)+'</h3><p>'+esc(x.text)+'</p><small>'+esc(en.keyInsights?.[i]?.label||'')+' · '+esc(en.keyInsights?.[i]?.text||'')+'</small></article>').join('')+'</div>'+diagrams+'</div>';
}
function partitionParagraphs(items,count){
 const groups=Array.from({length:Math.max(1,count)},()=>[]);
 let cursor=0;
 let remainingWeight=items.reduce((n,x)=>n+String(x||'').length,0);
 for(let g=0;g<groups.length;g++){
  const remainingGroups=groups.length-g;
  if(cursor>=items.length)break;
  const target=remainingWeight/remainingGroups;
  let used=0;
  while(cursor<items.length){
   const item=items[cursor];
   const weight=String(item||'').length;
   const itemsAfter=items.length-(cursor+1);
   const groupsAfter=remainingGroups-1;
   if(groups[g].length&&used>=target&&itemsAfter>=groupsAfter)break;
   groups[g].push(item);
   used+=weight;
   cursor++;
   if(itemsAfter===groupsAfter)break;
  }
  remainingWeight-=used;
 }
 while(cursor<items.length)groups[groups.length-1].push(items[cursor++]);
 return groups;
}
function readingSlice(copy,page,section){
 const count=Math.max(1,Number(page?.readingCount||1));
 const opening=openingParagraphCount(section,count);
 const all=localeParagraphs(copy).slice(opening);
 const index=Math.max(0,Number(page?.readingIndex||0));
 return partitionParagraphs(all,count)[index]||[];
}
function interpretation(section,page={}){
 const zh=section?.zhHans||{},en=section?.en||{};
 const z=readingSlice(zh,page,section),e=readingSlice(en,page,section);
 const suffix=Number(page.readingCount||1)>1?' · '+String(Number(page.readingIndex||0)+1)+'/'+String(page.readingCount):'';
 const stacked=['S07','S08','S09','S10','S11'].includes(section?.sectionId);
 return '<div class="zv-reading-head"><span>'+esc(section?.sectionId||'')+'</span><h2>'+esc(zh.headline||'')+'</h2><small>'+esc(en.headline||'')+suffix+'</small></div><div class="zv-copy-grid zv-reading-grid'+(stacked?' is-stacked':'')+'"><article lang="zh-Hans"><h3>中文解读</h3>'+z.map(p=>'<p>'+esc(p)+'</p>').join('')+'</article><article lang="en"><h3>English Reading</h3>'+e.map(p=>'<p>'+esc(p)+'</p>').join('')+'</article></div>';
}
function firstSentence(text,locale){
 const t=String(text||'').trim();
 const re=locale==='zh'?/^.*?[。！？]/u:/^.*?[.!?](?:[”"'])?/u;
 return t.match(re)?.[0]||t;
}
function closingPage(reportIr,binding,pageNumber){
 const zh=(reportIr?.closingSummary?.zhHans||[]).map(x=>firstSentence(x,'zh'));
 const en=(reportIr?.closingSummary?.en||[]).map(x=>firstSentence(x,'en'));
 return '<div class="zv-closing-art">'+(binding.hero?'<img src="'+esc(binding.hero)+'" alt="">':'')+(binding.motif?'<img class="zv-closing-motif" src="'+esc(binding.motif)+'" alt="">':'')+'</div><div class="zv-closing"><span>'+esc(pageNumber||'')+'</span><h1>读取边界</h1><h2>Reading Boundary</h2><p>命盘提供结构化观察，不替代现实证据、专业判断或你的实际选择。</p><p lang="en">The chart provides structured observation; it does not replace real-world evidence, professional judgment, or your own decisions.</p><div class="zv-closing-points">'+zh.slice(0,3).map((x,i)=>'<article><b>0'+(i+1)+'</b><p>'+esc(x)+'</p><small>'+esc(en[i]||'')+'</small></article>').join('')+'</div></div>';
}
export function renderZwrVfrReview({reportIr,diagramData,pagePlan}){
 const sections=new Map((reportIr?.sections||[]).map(s=>[s.sectionId,s]));
 const readingCounts=new Map();
 for(const p of pagePlan||[])if(p.sectionId&&p.pageFamily==='READING')readingCounts.set(p.sectionId,Math.max(readingCounts.get(p.sectionId)||0,Number(p.readingCount||1)));
 const diagrams=new Map((diagramData?.diagrams||[]).map(d=>[d.id,d]));
 return pagePlan.map(p=>{
  const s=sections.get(p.sectionId),ds=(p.diagramIds||[]).map(id=>diagrams.get(id)).filter(Boolean);
  const binding=getZwrVfrVisualBinding({pageNumber:p.pageNumber,sectionId:p.sectionId,pageFamily:p.pageFamily});
  if(binding.kind==='STATIC_FRONT_MATTER')return '<section class="zv-page zv-static-page" data-page-number="'+p.pageNumber+'" data-page-family="'+esc(p.pageFamily)+'" data-page-key="'+esc(p.pageKey)+'"><img class="zv-static" src="'+esc(binding.url)+'" alt="'+esc(p.pageKey)+'"></section>';
  if(binding.kind==='CLOSING')return '<section class="zv-page zv-closing-page" data-page-number="'+p.pageNumber+'" data-page-family="'+esc(p.pageFamily)+'" data-page-key="'+esc(p.pageKey)+'">'+closingPage(reportIr,binding,p.pageNumber)+'<footer><span>紫微斗数 · Visual First Reading</span><b>'+String(p.pageNumber).padStart(2,'0')+' / '+pagePlan.length+'</b></footer></section>';
  let body='';
  const compact=p.pageFamily==='DIAGRAM_COMPOSITE';
  const diagramHtml=ds.map(d=>renderZwrVfrDiagram(d,{pageKey:p.pageKey,sectionId:p.sectionId,pageFamily:p.pageFamily,compact})).join('');
  if(p.pageFamily==='SECTION_MASTER'||p.pageFamily==='SECTION_MASTER_SUMMARY')body=sectionMaster(s,binding,diagramHtml,p.pageFamily==='SECTION_MASTER_SUMMARY',{readingCount:readingCounts.get(p.sectionId)||1});
  else if(p.pageFamily==='INTERPRETATION'||p.pageFamily==='READING')body=interpretation(s,p);
  else if(p.pageFamily==='DIAGRAM_COMPOSITE')body='<div class="zv-diagram-composite">'+diagramHtml+'</div>';
  else if(ds.length)body=diagramHtml;
  else body='<div class="zv-front"><h1>'+esc(p.pageKey.replaceAll('_',' '))+'</h1><p>PHI OS · Zi Wei Dou Shu Visual First Report</p></div>';
  return '<section class="zv-page" data-page-number="'+p.pageNumber+'" data-page-family="'+esc(p.pageFamily)+'" data-page-key="'+esc(p.pageKey)+'" data-section-id="'+esc(p.sectionId||'')+'" style="'+sectionVars(p.sectionId)+'">'+(binding.body?'<img class="zv-body-bg" src="'+esc(binding.body)+'" alt="">':'')+(binding.motif?'<img class="zv-body-motif" src="'+esc(binding.motif)+'" alt="">':'')+'<header><strong>PHI OS</strong><span>ZI WEI DOU SHU · 紫微斗数</span></header><main>'+body+'</main><footer><span>紫微斗数 · Visual First Reading</span><b>'+String(p.pageNumber).padStart(2,'0')+' / '+pagePlan.length+'</b></footer></section>';
 }).join('');
}
