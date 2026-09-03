const root=document.querySelector('[data-px2-methods]');
const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
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
    const action=canOpen?`<div class="puxr-actions"><a class="puxr-btn" href="${escapeHtml(m.route)}">${m.methodCode==='TAROT'&&!live?'Open & check availability':'Open reading'}</a></div>`:'';
    return `<article id="${escapeHtml(m.methodCode.toLowerCase())}" class="puxr-card px2-method"><div class="puxr-card__kicker">${escapeHtml(m.category.replaceAll('_',' '))}</div><h3>${escapeHtml(m.label)}<br><small>${escapeHtml(m.labelZh)}</small></h3><p>${escapeHtml(state.copy)}</p><span class="px2-status px2-status--${state.kind}">${escapeHtml(state.label)}</span>${action}</article>`;
  }).join('');
}
render().catch(()=>{if(root)root.innerHTML='<p>Reading availability is temporarily unavailable. Please use Perspectives to continue.</p>';});
