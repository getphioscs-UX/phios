import {esc,tr,locale} from './runtime-ui.js';
// Answers remain in memory; only an explicitly confirmed summary is handed on.
export function mountGuidedReality(form,{onConfirm=()=>{}}={}){
 if(!form||document.querySelector('[data-guided-reality]'))return;
 const root=document.createElement('section');root.className='cx-card cx-stack';root.dataset.guidedReality='';form.before(root);
 let mode='GUIDED',answers={},summary=null;
 const requested=new URLSearchParams(location.search).get('method');
 const selectMethod=value=>{const input=[...form.querySelectorAll('[name=methods]')].find(i=>i.value===value);if(input){form.querySelectorAll('[name=methods]').forEach(i=>{i.checked=i===input;});input.dispatchEvent(new Event('change',{bubbles:true}));}form.scrollIntoView({block:'start'});};
 if(requested)setTimeout(()=>selectMethod(requested),0);
 const api=async payload=>{const r=await fetch('/api/customer-current-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({consent:true,locale:locale(),mode,...payload})});const b=await r.json();if(!r.ok)throw Error(b.error);return b;};
 root.innerHTML=`<h2>${tr('Where would you like to start?','你想从哪里开始？')}</h2><button type="button" data-start>${tr('I have a question · Start with my Reality','我有一件正在发生的事 · 从我的现实开始')}</button><button type="button" data-method>${tr('I know my method · Choose method','我已经知道想使用什么方法 · 选择方法')}</button><div data-intake hidden></div><p data-status role="status"></p>`;
 const panel=root.querySelector('[data-intake]'),status=root.querySelector('[data-status]');
 const error=()=>status.textContent=tr('Please try again. Your answers have not been saved.','请重试。你的回答没有被保存。');
 const collect=()=>Object.fromEntries([...panel.querySelectorAll('textarea')].map(e=>[e.name,e.value]));
 async function intake(){
  try{const {questions}=await api({action:'GUIDED_QUESTIONS'});panel.hidden=false;panel.innerHTML=`<label>${tr('How much would you like to share?','你想分享多少？')} <select data-mode>${[['QUICK','Quick · 3 questions','快速 · 3 问'],['GUIDED','Guided · 6 questions','引导 · 6 问'],['DEEP','Deep','深入'],['DISCOVERY',"I cannot explain it yet",'还说不清楚']].map(([v,en,zh])=>`<option value="${v}" ${mode===v?'selected':''}>${tr(en,zh)}</option>`).join('')}</select></label>${questions.map(q=>`<label style="display:block">${esc(q.label)}<textarea style="display:block;width:100%;box-sizing:border-box" name="${q.id}" maxlength="600">${esc(answers[q.id]||'')}</textarea></label>`).join('')}<button type="button" data-summary>${tr('Review my summary','查看我的摘要')}</button><button type="button" data-skip>${tr('Skip and choose a method','跳过并选择方法')}</button>`;
   panel.querySelector('[data-mode]').onchange=e=>{answers={...answers,...collect()};mode=e.target.value;intake();};
   panel.querySelector('[data-skip]').onclick=()=>{panel.hidden=true;form.scrollIntoView({block:'start'});};
   panel.querySelector('[data-summary]').onclick=async()=>{try{answers=collect();({summary}=await api({action:'GUIDED_SUMMARY',answers}));review();}catch{error();}};
  }catch{error();}
 }
 function review(){panel.innerHTML=`<h3>${tr('Your words · confirm before using','你的原话 · 使用前请确认')}</h3>${summary.items.map(i=>`<p><strong>${esc(i.label)}</strong><br>${esc(i.text)}</p>`).join('')}<button type="button" data-confirm ${!summary.items.length?'disabled':''}>${tr('Accurate — use for this reading','准确——用于本次读取')}</button><button type="button" data-edit>${tr('Edit','修改')}</button><button type="button" data-missing>${tr('Something is missing','还有遗漏')}</button>`;
  panel.querySelector('[data-edit]').onclick=intake;panel.querySelector('[data-missing]').onclick=()=>{mode='DEEP';intake();};
  panel.querySelector('[data-confirm]').onclick=async()=>{try{const result=await api({action:'GUIDED_CONFIRM',answers,confirmation:'ACCURATE',confirmedSummary:JSON.stringify(summary.items)});onConfirm(result);panel.hidden=true;status.textContent=tr('Confirmed for this reading. You can choose a method below.','已确认用于本次读取。你可以在下方选择方法。');
   const button=document.createElement('button');button.type='button';button.textContent=tr('Suggest a useful perspective','建议一个有用的视角');status.append(button);
   button.onclick=async()=>{try{const response=await fetch('/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:summary.items.map(i=>i.text).join(' ').slice(0,2000),locale:locale(),methodGuidanceRequested:true})});const data=await response.json();if(!response.ok)throw Error();status.textContent=data.view.answer.text;for(const choice of data.choices){const b=document.createElement('button');b.type='button';b.textContent=choice.title;b.onclick=()=>choice.formValue?selectMethod(choice.formValue):location.assign(choice.href);status.append(b);}}catch{error();}};
   form.scrollIntoView({block:'start'});
  }catch{error();}};
 }
 root.querySelector('[data-start]').onclick=intake;root.querySelector('[data-method]').onclick=()=>{panel.hidden=true;form.scrollIntoView({block:'start'});};
}
