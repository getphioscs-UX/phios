import {numerologyPublicLabel} from '../../customer-projection/numerology-public-labels-v1.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Coordinates express layout only. No role values or numerology arithmetic is
// produced here. Every numeric display below is copied from the frozen view.
export function renderNumR28Diagram({diagram:d,publication:p,locale}){
 const zh=locale!=='en',bi=locale==='bilingual',tr=(z,e)=>bi?[z,e]:[zh?z:e];
 const labels=role=>bi?[numerologyPublicLabel(role,'zh-Hans'),numerologyPublicLabel(role,'en')]:[numerologyPublicLabel(role,zh?'zh-Hans':'en')];
 const view=p.sourceView,visual=d.languages[zh?'zh-Hans':'en'].visual,en=d.languages.en.visual;
 const rows=visual.rows.map((x,i)=>({...x,labelLines:bi&&en.rows[i]?.label!==x.label?[x.label,en.rows[i]?.label]:[x.label]}));
 const text=(x,y,value,cls='label',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
 const lines=(x,y,values,cls='label',anchor='start',gap=18)=>values.filter(Boolean).map((v,i)=>text(x,y+i*gap,v,cls,anchor)).join('');
 const wrap=(s,limit=30)=>{let out=[],line='',n=0;for(const c of String(s)){const size=c.charCodeAt(0)>255?2:1;if(n+size>limit){out.push(line);line='';n=0;}line+=c;n+=size;}if(line)out.push(line);return out;};
 const rule=(x,y,x2,y2,kind='')=>`<path class="link ${kind}" d="M${x},${y} L${x2},${y2}"/>`;
 const medallion=(x,y,value,label,detail=[])=>`<g><circle class="halo" cx="${x}" cy="${y}" r="32"/><circle class="ring" cx="${x}" cy="${y}" r="25"/>${text(x,y+8,value,'value','middle')}${lines(x,y+54,label,'label','middle')}${lines(x,y+54+label.length*18,detail,'note','middle')}</g>`;
 const empty=(reason)=>`<path class="link" d="M35 65 H685 M35 165 H685"/>${lines(360,100,tr('所需资料未提供或未通过准入','Required inputs are absent or not admitted'),'label','middle')}${lines(360,140,wrap(reason||'',75),'note','middle')}`;
 let drawing='',height=310;
 const id=d.logicalPageId;
 if(id==='P06'){
  const birth=view.birthRoles.filter(x=>['LIFE_PATH','BIRTHDAY_NUMBER'].includes(x.role)),names=view.name.roles;
  height=340;drawing=lines(135,20,tr('出生日期来源','Birth-date source'),'eyebrow','middle')+lines(515,20,tr('已确认姓名来源','Confirmed name source'),'eyebrow','middle');
  drawing+=rule(135,50,135,290)+rule(345,50,685,50);
  drawing+=birth.map((x,i)=>medallion(135,95+i*145,x.value,labels(x.role),[x.reductionSteps.join(' → ')])).join('');
  drawing+=names.length?names.map((x,i)=>{const xy=i===0?[515,100]:[400+(i-1)*230,245];return rule(515,52,xy[0],xy[1]-34)+medallion(...xy,x.value,labels(x.role),[x.reductionSteps.join(' → ')]);}).join(''):lines(515,160,tr('姓名层未开放','Name layer unavailable'),'label','middle');
 }else if(id==='P07'){
  height=360;drawing=view.birthRoles.map((x,i)=>{const col=i%3,row=Math.floor(i/3),cx=120+col*240,y=30+row*160;return lines(cx,y,labels(x.role),'label','middle')+text(cx,y+55,x.rawValue,'raw','middle')+rule(cx,y+65,cx,y+90)+text(cx,y+120,x.value,'value','middle')+text(cx,y+145,x.reductionSteps.join(' → '),'note','middle');}).join('');
 }else if(id==='P08'){
  height=360;const chart=p.chartModels[zh?'zh-Hans':'en'].coreNumberMap,positions=new Map(chart.nodes.map((x,i)=>[x.id,[120+(i%3)*240,75+Math.floor(i/3)*180]]));
  drawing=chart.relations.flatMap(r=>{const a=positions.get(r.roles[0]),b=positions.get(r.roles[1]);return a&&b?[`<path class="link relation" d="M${a[0]} ${a[1]-25} Q${(a[0]+b[0])/2} ${Math.min(a[1],b[1])-90} ${b[0]} ${b[1]-25}"/>`]:[];}).join('')+chart.nodes.map(x=>medallion(...positions.get(x.id),x.value,labels(x.id))).join('');
 }else if(id==='P09'){
  height=290;drawing=Object.entries(view.frequency).map(([digit,count],i)=>{const x=30+(i%3)*230,y=15+Math.floor(i/3)*87;return `<g data-digit="${digit}" data-value="${count}"><path class="matrix-cell ${count?'present':'absent'}" d="M${x} ${y} h200 v75 h-200z"/>${text(x+28,y+47,digit,'value')}${text(x+102,y+47,'× '+count,'raw')}</g>`;}).join('');
 }else if(id==='P10'){
  height=Math.max(380,view.name.parts.length*65+180);
  if(d.availability==='BLOCKED_PRINT_BUDGET'){height=240;drawing=lines(360,80,tr('姓名计算详表需要额外审阅空间','The complete name trace needs additional review space'),'strong','middle')+lines(360,125,tr('保留完整来源，不缩字、不删减；暂不出印刷版。','Keep the complete source; do not shrink or omit it. Printing is blocked.'),'label','middle');}
  else if(!view.name.roles.length)drawing=empty('');else{
   const kindLabels={ORIGINAL_BIRTH_NAME:tr('出生全名','Birth name'),LEGAL_CURRENT_NAME:tr('现用法定名','Current legal name'),ALIAS:tr('已确认别名','Confirmed alias'),ROMANIZED_FORM:tr('已确认罗马字姓名','Confirmed romanized name')};
   drawing=lines(12,18,wrap(view.name.sourceName,70),'eyebrow')+lines(700,18,kindLabels[view.name.sourceNameKind]||tr('姓名类别未确认','Name kind unconfirmed'),'note','end');
   drawing+=text(12,40,bi?'◦ 元音 / vowels · Y：须分类 / classification required · 11/22/33 按原生规则保留':zh?'◦ 标示元音；Y 须明确分类；11、22、33 按原生字段保留':'◦ marks vowels; Y requires classification; native fields preserve 11, 22, 33.','note');
   drawing+=view.name.parts.map((part,i)=>{const y=62+i*52;return text(12,y,part.token,'strong')+text(220,y,part.letters.map(x=>x.letter+':'+x.value+(x.vowel?' ◦':'')).join('  '),'label')+text(220,y+24,[part.expression,part.soulUrge,part.personality].map(x=>x.reductionSteps.join(' → ')).join('   |   '),'note');}).join('');
   const start=70+view.name.parts.length*52;
   drawing+=view.name.roles.map((r,i)=>lines(12,start+i*43,labels(r.role),'note')+text(245,start+i*43,(bi?'逐段 / Parts: ':zh?'逐段：':'Parts: ')+r.intermediates.map(x=>x.value).join(' + ')+' → '+r.reductionSteps.join(' → '),'label')+text(245,start+18+i*43,(bi?'全名 / Global: ':zh?'全名合计：':'Global: ')+r.comparison.reductionSteps.join(' → '),'note')).join('');
   drawing+=text(12,height-10,(zh?'姓名频次：':'Name frequency: ')+Object.entries(view.nameFrequency||{}).map(([digit,count])=>digit+' × '+count).join(' · '),'note');
  }
 }else if(id==='P11'){
  height=Math.max(290,rows.length*85);drawing=rows.map((r,i)=>{const x=28+i*28,y=30+i*85;return `<path class="terrace" d="M${x} ${y} h${650-i*40} v60 h-${650-i*40}z"/>${lines(x+16,y+22,r.labelLines,'label')}${text(630-i*12,y+35,r.value,'raw','end')}${i<rows.length-1?rule(x+25,y+60,x+53,y+85):''}`;}).join('');
 }else if(id==='P12'){
  height=Math.max(280,rows.length*82);drawing=rows.map((r,i)=>{const y=35+i*82;return text(25,y,r.value,'value')+rule(125,y-6,320,y-6)+lines(335,y-8,r.labelLines,'label')+text(335,y+33,r.detail||'','note');}).join('');
 }else if(id==='P13'){
  height=290;drawing=rows.map((r,i)=>medallion(160+i*380,85,r.value,r.labelLines)).join('')+rule(195,85,505,85)+lines(350,210,tr('资源如何配合？','How might these resources work together?'),'strong','middle')+lines(350,246,tr('结合任务条件，观察支持与代价。','Compare support and costs in one actual task.'),'label','middle');
 }else if(id==='P14'){
  height=310;const pos=[[140,75],[575,75],[360,225]];drawing=rule(140,75,575,75)+rule(575,75,360,225)+rule(360,225,140,75)+rows.map((r,i)=>medallion(...pos[i%3],r.value,r.labelLines)).join('')+lines(360,125,tr('条件变化','Changing conditions'),'eyebrow','middle');
 }else if(id==='P15'){
  height=280;drawing=rows.map((r,i)=>{const x=180+i*350;return `<path class="arch" d="M${x-90} 180 V85 A90 70 0 0 1 ${x+90} 85 V180"/>${text(x,100,r.value,'value','middle')}${lines(x,145,r.labelLines,'label','middle')}`;}).join('')+lines(360,230,tr('保留方向与应对角色的区别','Keep direction and coping roles distinct'),'label','middle');
 }else if(id==='P16'){
  height=290;drawing=rows.map((r,i)=>medallion(155+i*410,90,r.value,r.labelLines)).join('')+`<path class="link" d="M190 90 Q360 20 530 90 M190 110 Q360 190 530 110"/>`+lines(360,220,tr('内在需要 ↔ 向外表达','Inner needs ↔ outward expression'),'label','middle')+lines(360,258,tr('单人视角，不生成双方配对结论','Single-person lens; no compatibility conclusion'),'note','middle');
 }else if(id==='P17'){
  height=Math.max(270,rows.length*58+25);const max=Math.max(1,...rows.map(r=>Number(r.value)||0));drawing=rows.map((r,i)=>{const y=35+i*58;return lines(12,y,r.labelLines,'label')+`<path class="link" d="M220 ${y-5} H630"/><path class="measure" d="M220 ${y-5} H${220+380*(Number(r.value)||0)/max}"/>`+text(670,y+4,r.value,'raw','middle');}).join('');
 }else if(id==='P18'){
  height=290;drawing=rows.map((r,i)=>{const x=175+i*350;return `<path class="balance" d="M${x} 30 V200 M${x-100} 190 H${x+100} M${x-70} 85 H${x+70}"/>${text(x,70,r.value,'value','middle')}${lines(x,125,r.labelLines,'label','middle')}${text(x,170,r.detail||'','note','middle')}`;}).join('')+lines(350,250,tr('出现次数不是财富或能力评分','Occurrences are not wealth or ability scores'),'note','middle');
 }else if(id==='P19'){
  height=310;drawing=view.timing.pinnacles.map((x,i)=>{const cx=95+i*180;return text(cx,25,`${x.startAge}–${x.endAge??'+'}`,'strong','middle')+rule(cx-75,55,cx+75,55)+medallion(cx,95,x.value,[])+rule(cx,125,cx,170)+medallion(cx,200,view.timing.challenges[i]?.value??'—',[]);}).join('')+lines(350,275,tr('上轨：高峰 · 下轨：挑战；年龄仅属于这套原生西方周期','Upper: Pinnacle · Lower: Challenge; native Western age bands only'),'note','middle');
  if(!view.timing.pinnacles.length)drawing=empty('');
 }else if(id==='P20'){
  height=360;if(view.months.length!==12)drawing=empty('');else{
   drawing=`<circle class="cycle-orbit" cx="360" cy="165" r="120"/>`+view.months.map((r,i)=>{const a=i/12*Math.PI*2-Math.PI/2,x=360+230*Math.cos(a),y=165+115*Math.sin(a),current=r.month===view.targetDate?.slice(5,7);return rule(360,165,x,y)+`<g class="${current?'current-month':''}"><circle class="ring" cx="${x}" cy="${y}" r="25"/>${text(x,y+8,r.value,'raw','middle')}${text(x,y+48,r.month,'label','middle')}</g>`;}).join('')+`<circle class="center" cx="360" cy="165" r="62"/>`+text(360,163,view.timing.calendar.find(x=>x.code==='PERSONAL_YEAR')?.value??'—','value inverse','middle')+lines(360,188,tr('个人年','Personal year'),'note inverse','middle',14);
  }
 }else if(id==='P21'){
  height=290;const headings=tr('传统主题｜现实事实｜不符合或未知','Traditional theme | Observed facts | Counterexample / unknown').map(s=>s.split(/[｜|]/));
  drawing=[0,1,2].map(i=>lines(35+i*230,30,headings.map(a=>a[i]),'label')).join('');
  for(let i=0;i<3;i++)drawing+=rule(20,65+i*65,700,65+i*65);
  drawing+=rule(245,10,245,250)+rule(475,10,475,250)+lines(360,105,tr('待填写，不预设客户经历','To complete; no customer history assumed'),'note','middle');
  if(p.observations.length)drawing+=lines(265,155,wrap(p.observations[0].text,28),'note');
 }else if(id==='P22'){
  height=280;const steps=[tr('情境与日期','Situation / date'),tr('可见行动','Visible action'),tr('结果与反例','Outcome / counterexample'),tr('再次核对','Review again')];drawing=steps.map((s,i)=>{const x=30+i*175;return `<path class="signal" d="M${x} 70 l70 -35 70 35 -70 35z"/>${lines(x+70,140,s,'label','middle')}${i<3?rule(x+140,70,x+175,70):''}`;}).join('')+lines(350,235,tr('记录真实观察；无资料则保留空白','Record actual observations; leave unknowns open'),'note','middle');
 }else if(id==='P23'){
  height=330;drawing=lines(360,25,tr('是否有足够现实资料？','Is there enough real-world information?'),'strong','middle')+rule(360,45,170,125)+rule(360,45,550,125)+lines(170,152,tr('资料不足：收集或暂缓','Insufficient: collect or defer'),'label','middle')+lines(550,152,tr('条件足够：小步试行','Sufficient: try a small step'),'label','middle')+rule(550,175,550,240)+lines(550,270,tr('设置回看与撤回条件','Set review and reversal conditions'),'label','middle')+rule(170,180,170,240)+lines(170,270,tr('无需强迫作决定','No decision is required yet'),'label','middle');
 }else if(id==='P24'){
  height=310;const bands=[tr('原生计算','Native calculation'),tr('学派解释','School interpretation'),tr('现实证据','Reality evidence')];drawing=bands.map((s,i)=>{const x=25+i*235;return `<path class="boundary" d="M${x} 20 h210 v220 h-210z"/>${lines(x+105,60,s,'strong','middle')}${lines(x+105,125,i===0?tr('输入、合计、归约','Inputs, totals, reductions'):i===1?tr('来源准入后解释','Interpret after admission'):tr(p.observations.length?'已提供确认观察':'未提供',p.observations.length?'Confirmed observations supplied':'Not supplied'),'label','middle')}`;}).join('')+lines(360,280,tr('档案三角法独立研究，不生成客户数值','Archival triangle remains research-only; no customer values'),'note','middle');
 }
 if(!drawing)drawing=empty('');
 if(['P10','P15','P16','P17','P18'].includes(id)&&!view.name.roles.length)drawing=empty('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 ${height}" role="img" aria-labelledby="r28-${id}-${locale}-title r28-${id}-${locale}-desc" data-diagram="${d.diagramId}" data-family="${d.diagramFamily}" data-source-snapshot="${d.snapshotDigest}"><title id="r28-${id}-${locale}-title">${esc(d.languages[zh?'zh-Hans':'en'].title)}</title><desc id="r28-${id}-${locale}-desc">${esc(rows.map(x=>x.label+': '+x.value).join('; '))}</desc><style>text{font-family:ReportCJK,Arial,sans-serif;fill:#152f4c}.label,.strong{font-size:15px}.strong,.eyebrow{font-weight:600}.note{font-size:13px}.eyebrow{font-size:14px;letter-spacing:1px}.value{font-size:30px;font-family:Georgia,ReportCJK,serif}.raw{font-size:23px}.inverse{fill:#fffdf4}.link{fill:none;stroke:#cbb98e;stroke-width:1.5}.relation{stroke:#326c70;stroke-width:2.5}.ring,.halo{fill:#fffdf5;stroke:#b18a47;stroke-width:1.5}.halo{fill:none;stroke-width:.7}.center{fill:#152f4c;stroke:#b18a47}.matrix-cell,.terrace,.signal,.boundary{fill:#faf5e9;stroke:#c9b989;stroke-width:1}.absent{fill:#f4f0e8;stroke-dasharray:3 3}.present{fill:#edf3ed}.measure{stroke:#326c70;stroke-width:10}.arch,.balance,.cycle-orbit{fill:none;stroke:#b18a47;stroke-width:1.5}.current-month .ring{fill:#e9d7ac;stroke:#805a2b;stroke-width:3}</style>${drawing}</svg>`;
}
