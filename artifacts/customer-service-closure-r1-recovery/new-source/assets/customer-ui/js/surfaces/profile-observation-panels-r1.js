import {PROFILE_OBSERVATION_PROMPTS} from '../personal-products/profile-observation-prompts-r1.js';
import {handoffToMyReality} from '../handoff.js';
export function mountProfileObservationPanels(){
 if(document.querySelector('[data-profile-observation-panel]'))return;
 const panel=document.createElement('section');panel.dataset.profileObservationPanel='';panel.className='cx-p1-callout';
 const anchor=document.querySelector('[data-prf-dimension-cards]');if(!anchor)return;anchor.after(panel);
 const drafts=new Map();let lens='identity';const zh=()=>document.documentElement.lang==='zh-Hans';
 const remember=()=>{const form=panel.querySelector('form');if(form)drafts.set(lens,Object.fromEntries(new FormData(form)));};
 function render(){const prompt=PROFILE_OBSERVATION_PROMPTS[lens],draft=drafts.get(lens)||{},t=(a,b)=>zh()?a:b;
  panel.replaceChildren();const title=document.createElement('h3');title.textContent=prompt[zh()?'zh':'en'];panel.append(title);
  const note=document.createElement('p');note.textContent=t('这是有日期的自述，不是新测评或评分。这里只临时处理；保存与共享另行选择。','This is a dated self-report, not another assessment or score. Processing is temporary; saving and sharing are separate choices.');panel.append(note);
  const form=document.createElement('form'),state=document.createElement('select');state.name='responseState';state.setAttribute('aria-label',t('回答状态','Response status'));
  for(const [value,a,b]of [['ANSWERED','我愿意描述','I choose to describe'],['UNSURE','不确定','Unsure'],['SKIPPED','暂不回答','Skip for now'],['NOT_APPLICABLE','不适用','Not applicable']]){const o=document.createElement('option');o.value=value;o.textContent=t(a,b);state.append(o);}state.value=draft.responseState||'UNSURE';
  const label=document.createElement('label');label.textContent=t('你愿意提供的观察','The observation you choose to provide');const answer=document.createElement('textarea');answer.name='answer';answer.maxLength=1500;answer.value=draft.answer||'';label.append(answer);
  const dateLabel=document.createElement('label');dateLabel.textContent=t('观察日期（可留空）','Observation date (optional)');const date=document.createElement('input');date.type='date';date.name='observedAt';date.value=draft.observedAt||'';dateLabel.append(date);
  const questionLabel=document.createElement('label');questionLabel.textContent=t('你希望带入的当前问题','The current question you want to explore');const question=document.createElement('textarea');question.name='currentQuestion';question.maxLength=800;question.value=draft.currentQuestion||'';questionLabel.append(question);
  const consent=document.createElement('input');consent.type='checkbox';consent.name='processingConsent';const consentLabel=document.createElement('label');consentLabel.append(consent,document.createTextNode(t('我同意仅为本次问题临时处理这项自述','I consent to process this observation temporarily for this question')));
  const sensitive=document.createElement('input');sensitive.type='checkbox';const sensitiveLabel=document.createElement('label');sensitiveLabel.append(sensitive,document.createTextNode(t('我明确同意本次身体与生活敏感自述的临时处理，不作诊断','I explicitly consent to temporary processing of this sensitive body/lifestyle observation, without diagnosis')));sensitiveLabel.hidden=!prompt.sensitive;
  const button=document.createElement('button');button.type='submit';button.className='cx-button';button.textContent=t('选择带入当前问题','Choose to bring this into a current question');const status=document.createElement('p');status.setAttribute('role','status');
  form.append(state,label,dateLabel,questionLabel,consentLabel,sensitiveLabel,button,status);panel.append(form);
  state.onchange=()=>{answer.disabled=state.value!=='ANSWERED';if(answer.disabled)answer.value='';};state.onchange();
  form.onsubmit=async event=>{event.preventDefault();remember();if(state.value!=='ANSWERED'){status.textContent=t('已保留这个选择，不按0分或否定回答处理；没有发送或保存。','Your choice is kept without treating it as zero or a negative answer. Nothing was sent or saved.');return;}
   if(!consent.checked||(prompt.sensitive&&!sensitive.checked)||!answer.value.trim()||!question.value.trim()){status.textContent=t('请填写观察，并选择相应用途同意；也可以跳过。','Provide an observation and the relevant consent, or choose to skip.');return;}
   try{await handoffToMyReality({sourceType:'PROFILE_OBSERVATION',viewModel:{lens,currentQuestion:question.value,responseState:state.value,answer:answer.value,observedAt:date.value||null,processingConsent:true,sensitiveConsent:prompt.sensitive?sensitive.checked:false},statusNode:status});}catch{status.textContent=t('未能交接；观察仍留在这里，请重试。','Handoff failed. Your observation remains here; please retry.');}
  };
 }
 const select=(id,updateHistory=true)=>{if(!Object.hasOwn(PROFILE_OBSERVATION_PROMPTS,id))return;remember();lens=id;render();if(updateHistory&&location.hash!=='#profile-lens='+id)history.pushState(null,'','#profile-lens='+id);};
 document.addEventListener('click',event=>{const target=event.target.closest('[data-prf-lens],[data-prf-dimension]');if(target)select(target.dataset.prfLens||target.dataset.prfDimension);});
 const body=document.createElement('button');body.type='button';body.className='cx-button';body.textContent=zh()?'可选：身体与生活观察':'Optional: body and lifestyle observation';body.onclick=()=>select('body_lifestyle');anchor.after(body);
 window.addEventListener('hashchange',()=>{const id=location.hash.match(/^#profile-lens=([a-z_]+)$/)?.[1];select(id||'identity',false);});
 window.addEventListener('phios:localechange',()=>{remember();body.textContent=zh()?'可选：身体与生活观察':'Optional: body and lifestyle observation';render();});window.addEventListener('pagehide',()=>{drafts.clear();panel.replaceChildren();});
 const initial=location.hash.match(/^#profile-lens=([a-z_]+)$/)?.[1];if(Object.hasOwn(PROFILE_OBSERVATION_PROMPTS,initial))lens=initial;render();
}

if(document.body?.dataset.cxSurface==='PROFILE_ASSESSMENT'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountProfileObservationPanels,{once:true});else mountProfileObservationPanels();}
