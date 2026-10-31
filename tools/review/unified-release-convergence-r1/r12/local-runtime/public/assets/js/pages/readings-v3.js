const root=document.querySelector('[data-px2-methods]');
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const zh=()=>document.documentElement.lang.startsWith('zh');
const copy={
 'Available now':'现在可用','Check availability':'查看可用状态','External chart required':'需要外部命图','Currently gated':'当前尚未开放',
 'Open the governed Tarot surface. Live execution is confirmed by the server authority.':'打开塔罗页面。实际解读是否开放，以服务器确认的状态为准。',
 'The Tarot surface is visible; live execution is granted only when the server authority confirms availability.':'可以浏览塔罗页面；实际解读需要服务器确认已开放。',
 'Upload and confirm an external Human Design chart, then read it alongside the other governed personal perspectives.':'上传并确认外部人类图，再结合其他个人视角一起读取。',
 'Open the live question-based reading surface.':'打开以问题为起点的读取页面。',
 'Open the shared Personal Reading and select this perspective.':'打开个人读取页面并选择这个视角。',
 'This capability stays visible without bypassing its current execution boundary.':'你可以了解这个方法；实际执行仍遵循当前开放范围。',
 'Open & check availability':'打开并查看可用状态','Open reading':'打开读取',
 'Reading availability is temporarily unavailable. Please use Perspectives to continue.':'暂时无法取得读取状态，请从视角页面继续。'
};
const t=s=>zh()?(copy[s]||s):s;
async function json(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(path);return r.json();}
const statePresentation=(method,liveTarot)=>{
  if(method.methodCode==='TAROT')return liveTarot?{label:'Available now',kind:'ready',copy:'Open the governed Tarot surface. Live execution is confirmed by the server authority.'}:{label:'Check availability',kind:'gated',copy:'The Tarot surface is visible; live execution is granted only when the server authority confirms availability.'};
  if(method.methodCode==='HUMAN_DESIGN')return {label:'External chart required',kind:'ready',copy:'Upload and confirm an external Human Design chart, then read it alongside the other governed personal perspectives.'};
  if(method.runAllowed===true)return {label:'Available now',kind:'ready',copy:method.category==='QUESTION_READING'?'Open the live question-based reading surface.':'Open the shared Personal Reading and select this perspective.'};
  return {label:'Currently gated',kind:'gated',copy:'This capability stays visible without bypassing its current execution boundary.'};
};
async function render(){
  if(!root)return;
  const d=await json('/content/web-production/px2/successors/public-method-catalog-v6.json');
  let tarotStatus=null;try{tarotStatus=await json('/api/tarot-production-status');}catch{}
  root.innerHTML=d.methods.map(m=>{
    const live=m.methodCode==='TAROT'&&tarotStatus?.production?.runAllowed===true;
    const state=statePresentation(m,live);
    const canOpen=m.methodCode==='TAROT'?true:m.runAllowed===true;
    const action=canOpen?`<div class="puxr-actions"><a class="puxr-btn" href="${escapeHtml(m.route)}">${t(m.methodCode==='TAROT'&&!live?'Open & check availability':'Open reading')}</a></div>`:'';
    return `<article id="${escapeHtml(m.methodCode.toLowerCase())}" class="puxr-card px2-method"><div class="puxr-card__kicker">${zh()?(m.category==='QUESTION_READING'?'问题读取':'个人结构'):escapeHtml(m.category.replaceAll('_',' '))}</div><h3>${escapeHtml(zh()?m.labelZh:m.label)}</h3><p>${escapeHtml(t(state.copy))}</p><span class="px2-status px2-status--${state.kind}">${escapeHtml(t(state.label))}</span>${action}</article>`;
  }).join('');
}
const update=()=>render().catch(()=>{if(root)root.innerHTML=`<p>${t('Reading availability is temporarily unavailable. Please use Perspectives to continue.')}</p>`;});
update();new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
