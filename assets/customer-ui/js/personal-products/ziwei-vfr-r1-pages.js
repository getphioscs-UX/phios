const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=v=>esc(v??'—');
const short=(v,n=34)=>{const s=String(v??'');return esc(s.length>n?s.slice(0,n-1)+'…':s);};

function card(title,value,detail=''){
 return '<div class="zv-card"><small>'+esc(title)+'</small><b>'+esc(value??'—')+'</b>'+(detail?'<p>'+esc(detail)+'</p>':'')+'</div>';
}
function palaceGrid(data){
 const rows=data.palaces||[];
 return '<div class="zv-palace-grid">'+rows.map((p,i)=>'<div class="zv-palace '+(p.isLifePalace?'is-life ':'')+(p.isBodyPalace?'is-body':'')+'"><small>'+String(i+1).padStart(2,'0')+'</small><b>'+label(p.palaceCode)+'</b><span>'+label(p.branch)+'</span><p>'+((p.stars||[]).slice(0,4).map(s=>esc(s.starCode)).join(' · ')||'—')+'</p></div>').join('')+'</div>';
}
function axis(data){
 return '<div class="zv-axis">'+card('命宫 / Life',data.lifePalace,(data.lifeStars||[]).map(s=>s.starCode).join(' · '))+'<div class="zv-arrow">↔</div>'+card('身宫 / Body',data.bodyPalace,(data.bodyStars||[]).map(s=>s.starCode).join(' · '))+'</div>';
}
function relationships(data){
 const rel=data.relationships||[];
 return '<svg class="zv-svg" viewBox="0 0 760 420" role="img"><circle cx="380" cy="210" r="64" class="zv-center"/>'+rel.slice(0,10).map((r,i)=>{const a=-Math.PI/2+i*Math.PI*2/Math.max(1,Math.min(rel.length,10)),x=380+250*Math.cos(a),y=210+145*Math.sin(a);return '<line x1="380" y1="210" x2="'+x+'" y2="'+y+'" class="zv-line"/><circle cx="'+x+'" cy="'+y+'" r="48" class="zv-node"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle">'+short(r.from,10)+'</text>';}).join('')+'<text x="380" y="216" text-anchor="middle">结构网络</text></svg>';
}
function stars(data){
 const xs=data.stars||[];
 return '<div class="zv-star-list">'+xs.map(s=>card(s.starCode,s.palaceCode,(s.stateKnown?s.state:'state unknown')+(s.starClass?' · '+s.starClass:''))).join('')+'</div>';
}
function transformations(data){
 const xs=data.transformations||data.layers?.flatMap(x=>x.transformations||[])||[];
 return '<div class="zv-flow">'+xs.slice(0,16).map((t,i)=>'<div class="zv-flow-row"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+label(t.layer)+'</b><strong>'+label(t.targetStarCode)+'</strong><em>'+label(t.transformationCode)+'</em><small>'+label(t.palaceCode)+'</small></div>').join('')+'</div>';
}
function focus(data){
 const ps=Array.isArray(data.palaces)?data.palaces:(data.palace?[data.palace]:[]);
 const stars=data.stars||[];
 return '<div class="zv-focus">'+ps.map(p=>card(p.palaceCode,p.branch,(p.isLifePalace?'命宫 ':'')+(p.isBodyPalace?'身宫':''))).join('')+'<div class="zv-star-cloud">'+stars.slice(0,12).map(s=>'<span>'+esc(s.starCode)+'<small>'+esc(s.palaceCode)+'</small></span>').join('')+'</div></div>';
}
function timing(data){
 const rows=[];
 if(data.daXian)rows.push(['大运 / Da Xian',JSON.stringify(data.daXian)]);
 if(data.liuNian)rows.push(['流年 / Liu Nian',JSON.stringify(data.liuNian)]);
 for(const t of data.timing||[])rows.push([t.layer,JSON.stringify(t)]);
 return '<div class="zv-timing">'+rows.slice(0,8).map((r,i)=>'<div><span>'+String(i+1).padStart(2,'0')+'</span><b>'+esc(r[0])+'</b><p>'+short(r[1],120)+'</p></div>').join('')+'</div>';
}
function domains(data){
 const d=data.domains||{};
 return '<div class="zv-domains">'+Object.entries(d).map(([k,v])=>card(k,Array.isArray(v)?v.join(' · '):v)).join('')+'</div>';
}
export function renderZwrVfrDiagram(d){
 const type=d?.type||'UNKNOWN',data=d?.data||{};
 let body='';
 if(type==='TWELVE_PALACE_NATAL_MAP')body=palaceGrid(data);
 else if(type==='LIFE_BODY_AXIS')body=axis(data);
 else if(type==='PALACE_NETWORK')body=relationships(data);
 else if(type==='KEY_STAR_STRUCTURE')body=stars(data);
 else if(type==='FOUR_TRANSFORMATION_ROUTE'||type==='TRANSFORMATION_LAYER_COMPARISON')body=transformations(data);
 else if(['CAREER_PALACE_NETWORK','WEALTH_PALACE_NETWORK','RELATIONSHIP_PALACE_NETWORK','FAMILY_SUPPORT_PALACES','PRESSURE_COUNTERWEIGHT_MAP','LIFE_CAREER_WEALTH_TRAVEL_CROSS'].includes(type))body=focus(data);
 else if(['NATAL_DAXIAN_LIUNIAN_STACK','CURRENT_PALACE_ACTIVATION'].includes(type))body=timing(data);
 else if(type==='WHOLE_CHART_NAVIGATION')body=domains(data);
 else body='<div class="zv-empty">No deterministic visual renderer for '+esc(type)+'</div>';
 return '<figure class="zv-diagram" data-diagram-id="'+esc(d.id)+'" data-diagram-type="'+esc(type)+'"><figcaption><b>'+esc(d.id)+'</b><span>'+esc(type)+'</span></figcaption>'+body+'</figure>';
}

function sectionMaster(section,page){
 const zh=section?.zhHans||{},en=section?.en||{};
 return '<div class="zv-master"><span class="zv-sec">'+esc(section?.sectionId||'')+'</span><h1>'+esc(zh.headline)+'</h1><h2>'+esc(en.headline)+'</h2><p>'+esc(zh.subheadline)+'</p><p>'+esc(en.subheadline)+'</p><div class="zv-insights">'+(zh.keyInsights||[]).map((x,i)=>'<article><b>0'+(i+1)+'</b><h3>'+esc(x.label)+'</h3><p>'+esc(x.text)+'</p><small>'+esc(en.keyInsights?.[i]?.label||'')+' · '+esc(en.keyInsights?.[i]?.text||'')+'</small></article>').join('')+'</div></div>';
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
  let body='';
  if(p.pageFamily==='SECTION_MASTER'||p.pageFamily==='SECTION_MASTER_SUMMARY')body=sectionMaster(s,p);
  else if(p.pageFamily==='INTERPRETATION')body=interpretation(s);
  else if(ds.length)body=ds.map(renderZwrVfrDiagram).join('');
  else body='<div class="zv-front"><h1>'+esc(p.pageKey.replaceAll('_',' '))+'</h1><p>PHI OS · Zi Wei Dou Shu Visual First Report</p></div>';
  return '<section class="zv-page" data-page-number="'+p.pageNumber+'" data-page-family="'+esc(p.pageFamily)+'"><header><strong>PHI OS</strong><span>ZI WEI DOU SHU · 紫微斗数</span></header><main>'+body+'</main><footer><span>Visual First Report · Human Review</span><b>'+String(p.pageNumber).padStart(2,'0')+' / '+pagePlan.length+'</b></footer></section>';
 }).join('');
}
