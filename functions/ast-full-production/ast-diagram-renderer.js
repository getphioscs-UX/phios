export const AST_DIAGRAM_RENDERER_VERSION='AST-SVG-v1';
export const escapeAst=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={SUN:'太阳',MOON:'月亮',MERCURY:'水星',VENUS:'金星',MARS:'火星',JUPITER:'木星',SATURN:'土星',URANUS:'天王星',NEPTUNE:'海王星',PLUTO:'冥王星',ARIES:'白羊',TAURUS:'金牛',GEMINI:'双子',CANCER:'巨蟹',LEO:'狮子',VIRGO:'处女',LIBRA:'天秤',SCORPIO:'天蝎',SAGITTARIUS:'射手',CAPRICORN:'摩羯',AQUARIUS:'水瓶',PISCES:'双鱼',FIRE:'火象',EARTH:'土象',AIR:'风象',WATER:'水象',CARDINAL:'基本',FIXED:'固定',MUTABLE:'变动'};
const name=s=>names[s]||s;
const label=(x,y,s,size=18)=>`<text x="${x}" y="${y}" font-size="${size}">${escapeAst(s)}</text>`;
const point=(a,r)=>({x:360+r*Math.cos(a*Math.PI/180),y:350-r*Math.sin(a*Math.PI/180)});
const line=(a,b,color='#89a8b2',width=1.8)=>`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${width}"/>`;
const color=t=>['OPPOSITION','SQUARE'].includes(t)?'#dcb18b':t==='CONJUNCTION'?'#e6ce96':'#82bcb6';
const aspectName=t=>({CONJUNCTION:'合相',OPPOSITION:'对分',SQUARE:'四分',TRINE:'三分',SEXTILE:'六合'}[t]||t);
const edgeText=e=>`${name(e.meta.fromCode)} · ${name(e.meta.toCode)}　${aspectName(e.meta.type)}　${e.meta.orb.toFixed(2)}°`;
export function renderAstDiagram(id,d){
 let body='';
 const list=(rows,start=110,gap=42)=>rows.map((s,i)=>label(45,start+i*gap,s)).join('');
 if(id==='AST-D01'){
  const asc=d.angles.find(a=>a.code==='ASC').value,angle=x=>180+x-asc;
  for(const r of [145,205,265])body+=`<circle cx="360" cy="350" r="${r}" fill="none" stroke="#a8c4cc" stroke-width="2"/>`;
  for(let i=0;i<12;i++){body+=line(point(angle(i*30),205),point(angle(i*30),265));const p=point(angle(i*30+15),237);body+=label(p.x-18,p.y,name(Object.keys(names).slice(10,22)[i]),15);}
  d.cusps.forEach((c,i)=>{body+=line(point(angle(c.value),145),point(angle(c.value),205));const n=d.cusps[(i+1)%12].value;const delta=(n-c.value+360)%360,p=point(angle(c.value+delta/2),178);body+=label(p.x-8,p.y,i+1,16);});
  const bp=Object.fromEntries(Object.entries(d.bodies).map(([k,b])=>[k,point(angle(b.longitude),140)]));
  d.aspects.forEach(e=>{if(bp[e.meta.fromCode]&&bp[e.meta.toCode])body+=line(bp[e.meta.fromCode],bp[e.meta.toCode],color(e.meta.type),1.1);});
  Object.entries(d.bodies).forEach(([k,b],i)=>{const p=bp[k];body+=`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#ebd49e"/>`;body+=label(35+(i>=5?365:0),665+(i%5)*27,`${name(k)}　${name(b.signCode)} ${(b.longitude%30).toFixed(2)}° · 第${b.houseNumber}宫`,16);});
  d.angles.forEach(a=>{const p=point(angle(a.value),285);body+=label(p.x-12,p.y,a.code,17);});
  body+=label(35,45,'本命盘 · Placidus',24)+label(35,82,'方位与宫界按计算位置；相位线连接实际星体位置。',16);
 }else if(id==='AST-D06'){
  const codes=Object.keys(d.bodies),pts=Object.fromEntries(codes.map((k,i)=>[k,point(90+i*360/codes.length,245)]));
  d.aspects.forEach(e=>body+=line(pts[e.meta.fromCode],pts[e.meta.toCode],color(e.meta.type),e.meta.orb<1?3:1.5));
  codes.forEach(k=>{const p=pts[k];body+=`<circle cx="${p.x}" cy="${p.y}" r="32" fill="#153348" stroke="#dac28e"/>`+label(p.x-18,p.y+6,name(k),18);});
  body+=label(35,35,'主要相位网络',24)+label(35,70,'金色：合相　杏色：对分 / 四分　青色：三分 / 六合',16);
  body+=list(d.aspects.filter(e=>e.meta.orb<1).map(edgeText),650,26);
 }else if(id==='AST-D03'){
  body+=label(30,60,'星体与实际宫位',24);
  for(let h=1;h<=12;h++)body+=label(140+h*40,110,h,16);
  Object.entries(d.bodies).forEach(([k,b],i)=>{const y=160+i*46;body+=label(30,y,name(k));for(let h=1;h<=12;h++)body+=`<circle cx="${147+h*40}" cy="${y-6}" r="${h===b.houseNumber?11:3}" fill="${h===b.houseNumber?'#e6ce96':'#54717c'}"/>`;});
 }else if(id==='AST-D05'){
  body+=label(35,60,'元素与模式 · 十颗核心行星的分布',24);
  Object.entries({...d.distribution.elementCounts,...d.distribution.modalityCounts}).forEach(([k,v],i)=>{const y=150+i*70;body+=label(35,y,name(k))+`<rect x="160" y="${y-23}" width="${v*80}" height="28" rx="5" fill="#a7c6c6"/>`+label(590,y,v);});
  body+=label(35,720,'分布数量是结构背景，不能单独定义人格或行动能力。',17);
 }else if(['AST-D04','AST-D08'].includes(id)){
  body+=label(35,60,id==='AST-D04'?'传统守护链与最终守护':'整盘入口与组织路径',24);
  body+=list(d.rulership.dispositorChains.map(c=>c.path.map(name).join('  →  ')),130,48);
  body+=label(35,690,'整盘入口：'+name(d.rulership.chartRuler.bodyCode),21)+label(35,740,'最终守护：'+d.rulership.finalDispositors.map(name).join(' · '),21);
 }else if(['AST-D09','AST-D10','AST-D11'].includes(id)){
  const houses=id==='AST-D09'?[7]:id==='AST-D10'?[10]:[2,8];
  body+=label(35,60,id==='AST-D09'?'关系与互惠路径':id==='AST-D10'?'公共方向与行动路径':'个人资源与共享资源',24);
  const routes=d.routes.flatMap(r=>r.routes).filter(r=>houses.includes(r.houseNumber));
  let y=140;for(const r of routes){body+=label(35,y,`第${r.houseNumber}宫 · ${name(r.cuspSign)}`,24)+label(35,y+45,`→ ${name(r.rulerBodyCode)} · ${name(r.rulerActualSign)} · 实际位于第${r.rulerActualHouse}宫`,20);const edges=d.aspects.filter(e=>r.aspectRefs.includes(e.code));body+=list(edges.map(edgeText),y+95,32);y+=330;}
 }else if(['AST-D07','AST-D12','AST-D14'].includes(id)){
  body+=label(35,60,id==='AST-D07'?'支持与张力':id==='AST-D12'?'压力、边界与适应':'支持路径与机会导航',24);
  const tension=d.aspects.filter(e=>d.tension.some(s=>s.aspectCode===e.code)),support=d.aspects.filter(e=>d.support.some(s=>s.aspectCode===e.code));
  if(id!=='AST-D14'){body+=label(35,115,'张力连接',21)+list(tension.map(edgeText),160,35);}
  body+=label(35,id==='AST-D14'?115:440,'支持连接',21)+list(support.map(edgeText),id==='AST-D14'?165:485,35);
  body+=label(35,750,'连线描述结构关系，不保证现实结果。',18);
 }else if(id==='AST-D02'){
  body+=label(35,60,'四轴与宫位架构',24)+list(d.angles.map(a=>`${a.code}　黄经 ${a.value.toFixed(2)}°`),120,40);
  body+=list(d.cusps.map(c=>`第${c.meta.houseNumber}宫　${c.value.toFixed(2)}°　${d.placements.filter(p=>p.value===c.meta.houseNumber&&d.bodies[p.code]).map(p=>name(p.code)).join('、')}`),320,32);
 }else if(id==='AST-D15')body+=label(35,70,'阅读范围',28)+list(['本命结构：星体、宫位、四轴与实际相位。','象征解读：守护路径与整盘关系。','本报告没有加入行运或事件时间推演。','没有提供当前生活资料，不能据此确认现实经历。','命盘不能保证关系、事业或财务结果。','本报告不能用作医学判断。'],170,80);
 else throw Error('AST_DIAGRAM_UNSUPPORTED:'+id);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 820" role="img" aria-label="占星结构图" style="font-family:Microsoft YaHei,Arial,sans-serif;fill:#e9efed"><title>占星结构图</title>${body}</svg>`;
}
