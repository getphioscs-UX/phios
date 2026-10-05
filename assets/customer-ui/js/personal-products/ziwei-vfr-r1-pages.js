import {getZwrVfrVisualBinding} from '../../../../functions/canonical-presentation-runtime/ziwei-vfr-r1-visual-bindings.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
const branch=v=>esc(v||'—');

function card(title,value,detail='',opts={}){
 const t=opts.titleHtml?String(title):esc(title);
 const v=opts.valueHtml?String(value):esc(value);
 const d=opts.detailHtml?String(detail):esc(detail);
 return '<div class="zv-card"><small>'+t+'</small><b>'+v+'</b>'+(detail?'<p>'+d+'</p>':'')+'</div>';
}
function palaceGrid(data){
 return '<div class="zv-palace-grid">'+(data.palaces||[]).map((p,i)=>'<div class="zv-palace '+(p.isLifePalace?'is-life ':'')+(p.isBodyPalace?'is-body':'')+'"><span class="idx">'+String(i+1).padStart(2,'0')+'</span><b>'+bi(PAL,p.palaceCode)+'</b><em>'+branch(p.branch)+'</em><p>'+((p.stars||[]).slice(0,4).map(s=>plain(STAR,s.starCode)).join(' · ')||'—')+'</p></div>').join('')+'</div>';
}
function axis(data){
 const ls=(data.lifeStars||[]).map(s=>plain(STAR,s.starCode)).join(' · ');
 const bs=(data.bodyStars||[]).map(s=>plain(STAR,s.starCode)).join(' · ');
 return '<div class="zv-axis">'+card('命宫 / Life',bi(PAL,data.lifePalace),ls,{valueHtml:true})+'<div class="zv-arrow">↔</div>'+card('身宫 / Body',bi(PAL,data.bodyPalace),bs,{valueHtml:true})+'</div>';
}
function network(data){
 const rel=data.relationships||[];
 const codes=[...new Set(rel.flatMap(r=>[r.from,...(r.to||[])]).filter(Boolean))].slice(0,12);
 const pts=codes.map((code,i)=>{const a=-Math.PI/2+i*Math.PI*2/Math.max(1,codes.length);return {code,x:380+250*Math.cos(a),y:205+145*Math.sin(a)};});
 const by=new Map(pts.map(x=>[x.code,x]));
 const edges=rel.flatMap(r=>(r.to||[]).map(to=>[r.from,to])).filter(([a,b])=>by.has(a)&&by.has(b)).slice(0,18);
 return '<svg class="zv-svg" viewBox="0 0 760 420" role="img">'+edges.map(([a,b])=>{const A=by.get(a),B=by.get(b);return '<line x1="'+A.x+'" y1="'+A.y+'" x2="'+B.x+'" y2="'+B.y+'" class="zv-line"/>';}).join('')+pts.map(p=>'<g><circle cx="'+p.x+'" cy="'+p.y+'" r="45" class="zv-node"/><text x="'+p.x+'" y="'+(p.y-2)+'" text-anchor="middle">'+esc(pair(PAL,p.code)[0])+'</text><text x="'+p.x+'" y="'+(p.y+14)+'" text-anchor="middle" class="en">'+esc(pair(PAL,p.code)[1])+'</text></g>').join('')+'</svg>';
}
function stars(data){
 return '<div class="zv-star-grid">'+(data.stars||[]).map(s=>card(bi(STAR,s.starCode),bi(PAL,s.palaceCode),s.stateKnown?(s.state||''):'状态未定 / state unknown',{titleHtml:true,valueHtml:true})).join('')+'</div>';
}
function transformations(data){
 const xs=data.transformations||data.layers?.flatMap(x=>x.transformations||[])||[];
 return '<div class="zv-flow">'+xs.slice(0,16).map((t,i)=>'<div class="zv-flow-row"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+bi(LAYER,t.layer)+'</b><strong>'+bi(STAR,t.targetStarCode)+'</strong><em>'+bi(TX,t.transformationCode)+'</em><small>'+bi(PAL,t.palaceCode)+'</small></div>').join('')+'</div>';
}
function focus(data){
 const ps=Array.isArray(data.palaces)?data.palaces:(data.palace?[data.palace]:[]);
 const stars=data.stars||[];
 return '<div class="zv-focus">'+ps.map(p=>card(bi(PAL,p.palaceCode),p.branch||'—',(p.isLifePalace?'命宫 / Life ':'')+(p.isBodyPalace?'身宫 / Body':''),{titleHtml:true})).join('')+'<div class="zv-star-cloud">'+stars.slice(0,14).map(s=>'<span>'+bi(STAR,s.starCode)+'<em>'+bi(PAL,s.palaceCode)+'</em></span>').join('')+'</div></div>';
}
function timing(data){
 const rows=[];
 for(const t of data.timing||[])rows.push(t);
 if(data.daXian&&!rows.some(x=>x.layer==='DA_XIAN'))rows.push(data.daXian);
 if(data.liuNian&&!rows.some(x=>x.layer==='LIU_NIAN'))rows.push(data.liuNian);
 return '<div class="zv-timing">'+rows.slice(0,6).map((t,i)=>'<div><span>'+String(i+1).padStart(2,'0')+'</span><b>'+bi(LAYER,t.layer)+'</b><strong>'+bi(ROLE,t.role)+'</strong></div>').join('')+(data.currentTransformations?.length?'<section><h4>当前四化 / Current transformations</h4>'+transformations({transformations:data.currentTransformations})+'</section>':'')+'</div>';
}
function domains(data){
 return '<div class="zv-domains">'+Object.entries(data.domains||{}).map(([k,v])=>card(k,(Array.isArray(v)?v:[v]).map(x=>pair(PAL,x)[0]).join(' · '),(Array.isArray(v)?v:[v]).map(x=>pair(PAL,x)[1]).join(' · '))).join('')+'</div>';
}
export function renderZwrVfrDiagram(d){
 const type=d?.type||'UNKNOWN',data=d?.data||{},title=pair(TITLES,type);
 let body='';
 if(type==='TWELVE_PALACE_NATAL_MAP')body=palaceGrid(data);
 else if(type==='LIFE_BODY_AXIS')body=axis(data);
 else if(type==='PALACE_NETWORK')body=network(data);
 else if(type==='KEY_STAR_STRUCTURE')body=stars(data);
 else if(type==='FOUR_TRANSFORMATION_ROUTE'||type==='TRANSFORMATION_LAYER_COMPARISON')body=transformations(data);
 else if(['CAREER_PALACE_NETWORK','WEALTH_PALACE_NETWORK','RELATIONSHIP_PALACE_NETWORK','FAMILY_SUPPORT_PALACES','PRESSURE_COUNTERWEIGHT_MAP','LIFE_CAREER_WEALTH_TRAVEL_CROSS'].includes(type))body=focus(data);
 else if(['NATAL_DAXIAN_LIUNIAN_STACK','CURRENT_PALACE_ACTIVATION'].includes(type))body=timing(data);
 else if(type==='WHOLE_CHART_NAVIGATION')body=domains(data);
 else body='<div class="zv-empty">Missing deterministic renderer</div>';
 return '<figure class="zv-diagram" data-diagram-id="'+esc(d.id)+'" data-diagram-type="'+esc(type)+'"><figcaption><b>'+esc(title[0])+'</b><span>'+esc(title[1])+'</span></figcaption>'+body+'</figure>';
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
function sectionMaster(section,binding,diagrams=''){
 const zh=section?.zhHans||{},en=section?.en||{},enSub=PURPOSE_EN[section?.sectionId]||en.subheadline;
 return '<div class="zv-master-art">'+(binding.hero?'<img class="zv-hero" src="'+esc(binding.hero)+'" alt="">':'')+(binding.motif?'<img class="zv-motif" src="'+esc(binding.motif)+'" alt="">':'')+'</div><div class="zv-master"><span class="zv-sec">'+esc(section?.sectionId||'')+'</span><h1>'+esc(zh.headline)+'</h1><h2>'+esc(en.headline)+'</h2><p>'+esc(zh.subheadline)+'</p><p lang="en">'+esc(enSub)+'</p><div class="zv-insights">'+(zh.keyInsights||[]).map((x,i)=>'<article><b>0'+(i+1)+'</b><h3>'+esc(x.label)+'</h3><p>'+esc(x.text)+'</p><small>'+esc(en.keyInsights?.[i]?.label||'')+' · '+esc(en.keyInsights?.[i]?.text||'')+'</small></article>').join('')+'</div>'+diagrams+'</div>';
}
function interpretation(section){
 const zh=section?.zhHans||{},en=section?.en||{};
 return '<div class="zv-copy-grid"><article lang="zh-Hans"><h3>中文解读</h3>'+(zh.interpretation||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'</article><article lang="en"><h3>English Reading</h3>'+(en.interpretation||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'</article></div>';
}
export function renderZwrVfrReview({reportIr,diagramData,pagePlan}){
 const sections=new Map((reportIr?.sections||[]).map(s=>[s.sectionId,s]));
 const diagrams=new Map((diagramData?.diagrams||[]).map(d=>[d.id,d]));
 return pagePlan.map(p=>{
  const s=sections.get(p.sectionId),ds=(p.diagramIds||[]).map(id=>diagrams.get(id)).filter(Boolean);
  const binding=getZwrVfrVisualBinding({pageNumber:p.pageNumber,sectionId:p.sectionId,pageFamily:p.pageFamily});
  if(binding.kind==='STATIC_FRONT_MATTER')return '<section class="zv-page zv-static-page" data-page-number="'+p.pageNumber+'" data-page-family="'+esc(p.pageFamily)+'"><img class="zv-static" src="'+esc(binding.url)+'" alt="'+esc(p.pageKey)+'"></section>';
  let body='';
  const diagramHtml=ds.map(renderZwrVfrDiagram).join('');
  if(p.pageFamily==='SECTION_MASTER'||p.pageFamily==='SECTION_MASTER_SUMMARY')body=sectionMaster(s,binding,diagramHtml);
  else if(p.pageFamily==='INTERPRETATION')body=interpretation(s);
  else if(ds.length)body=diagramHtml;
  else body='<div class="zv-front"><h1>'+esc(p.pageKey.replaceAll('_',' '))+'</h1><p>PHI OS · Zi Wei Dou Shu Visual First Report</p></div>';
  return '<section class="zv-page" data-page-number="'+p.pageNumber+'" data-page-family="'+esc(p.pageFamily)+'">'+(binding.body?'<img class="zv-body-bg" src="'+esc(binding.body)+'" alt="">':'')+(binding.motif?'<img class="zv-body-motif" src="'+esc(binding.motif)+'" alt="">':'')+'<header><strong>PHI OS</strong><span>ZI WEI DOU SHU · 紫微斗数</span></header><main>'+body+'</main><footer><span>紫微斗数 · Visual First Reading</span><b>'+String(p.pageNumber).padStart(2,'0')+' / '+pagePlan.length+'</b></footer></section>';
 }).join('');
}
