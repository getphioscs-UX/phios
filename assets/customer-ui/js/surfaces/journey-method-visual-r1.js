import {resolveUnifiedPublicVisual} from '../../../js/public-v2/unified-public-visual-resolver.js';
import {PREENTRY_METHODS} from './preentry-five-method-r5-model.js';
import {methodVisualIds,relationshipPreparationState,journeyPanel} from './journey-method-visual-model-r1.js';

const zh=()=>document.documentElement.lang.startsWith('zh');
const t=(en,cn)=>zh()?cn:en;
const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text)n.textContent=text;return n;};
const copy=(node,en,cn)=>{node.dataset.jmEn=en;node.dataset.jmZh=cn;node.textContent=t(en,cn);return node;};
const localLink=(path)=>{const u=new URL(path,location.href);u.searchParams.set('locale',zh()?'zh-Hans':'en');return u.pathname+u.search+u.hash;};
const link=(en,cn,path,className='jm-button')=>{const a=copy(el('a',className),en,cn);a.dataset.jmRoute=path;a.href=localLink(path);return a;};
const imagePromises=new Map();
function art(code,en,cn,{eager=false}={}){
 const img=el('img');img.dataset.jmAsset=code;img.dataset.jmAltEn=en;img.dataset.jmAltZh=cn;img.alt=t(en,cn);img.loading=eager?'eager':'lazy';img.decoding='async';if(eager)img.fetchPriority='high';
 img.addEventListener('load',()=>{if(img.naturalWidth>0)img.dataset.jmAssetState='loaded';});
 const unavailable=()=>{img.hidden=true;img.classList.add('jm-asset-unavailable');img.closest('.jm-editorial-hero,.jm-method-card,.jm-state')?.classList.add('jm-text-only');img.dataset.jmAssetState='unavailable';const fig=img.closest('.jm-method-figure');if(fig)fig.hidden=true;};
 img.addEventListener('error',unavailable);
 if(!imagePromises.has(code))imagePromises.set(code,resolveUnifiedPublicVisual(code));
 imagePromises.get(code).then(result=>{if(!result.renderable)throw Error('VISUAL_NOT_RENDERABLE');img.width=result.width||1600;img.height=result.height||1000;img.src=result.src;img.dataset.jmAssetState='bound';}).catch(unavailable);
 return img;
}
function translate(){
 for(const n of document.querySelectorAll('[data-jm-en]'))n.textContent=zh()?n.dataset.jmZh:n.dataset.jmEn;
 for(const n of document.querySelectorAll('[data-jm-route]'))n.href=localLink(n.dataset.jmRoute);
 for(const n of document.querySelectorAll('[data-jm-alt-en]'))n.alt=zh()?n.dataset.jmAltZh:n.dataset.jmAltEn;
}
document.body.classList.add('jm-surface');
new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

function guidedJourney(){
 if(!['/perspectives/profile/','/reality/'].includes(location.pathname))return;
 const isReality=location.pathname==='/reality/',section=el('section','jm-block');section.dataset.jmJourney='';section.id='your-next-step';
 section.append(copy(el('p','jm-eyebrow'),'From insight to a considered choice','从认识自己，到审慎选择'),copy(el('h2'),'Bring only what matters into your current reality','只把相关的资料带进当前现实'),copy(el('p','jm-lead'),'Choose a source, describe the situation, compare your options and return to review what changed. You decide what to carry forward.','选一项资料、描述处境、比较选择，再回来看变化。由你决定带入哪些内容。'));
 const steps=[
  ['Choose Profile evidence','选择个人资料','Choose particular saved evidence, or complete the six-question self-report. Nothing is imported automatically.','选择具体已存资料，或完成六题自陈；不会自动导入。','Choose a source','选择一项资料','/perspectives/profile/#profile-saved-evidence'],
  ['Describe My Reality','描述当前现实','Name your question, direction and constraints. A profile interpretation is not a fact about the situation.','写下问题、方向与限制；个人视角不自动成为处境事实。','Describe now','描述现在','/reality/#cx-reality-intake'],
  ['Compare and navigate','比较与选择','Look at available directions and their conditions. You choose; the system does not decide for you.','查看可用方向及其条件，由你选择，不由系统代选。','Compare directions','比较方向','/reality/?view=navigation#reality-workspace'],
  ['Review and follow up','复核与行动','Reopen your authorized work and review observations. No review is shown as completed before you record one.','重开获授权的工作并复核观察；没有记录时，不虚构已完成的复核。','Open review','打开复核','/reality/?view=review#reality-workspace']
 ];
 const list=el('ol','jm-steps');for(const [i,s] of steps.entries()){const li=el('li');if(i===(isReality?1:0))li.setAttribute('aria-current','step');li.append(el('span','jm-step-number',String(i+1)),copy(el('h3'),s[0],s[1]),copy(el('p'),s[2],s[3]),link(s[4],s[5],s[6]));list.append(li);}section.append(list,copy(el('p','jm-meta'),'Saving and reopening require your account and the relevant consent. You can explore without saving.','保存及重开需要账户与相应用途同意；你也可以不保存地探索。'));
 const main=document.querySelector('main');const anchor=main.querySelector('.cx-hero,.vr2-hero-surface,.prf-visitor-hero');if(anchor)anchor.after(section);else main.prepend(section);
 const workspace=document.querySelector('[data-cx-workspace]');if(workspace&&!workspace.id)workspace.id='reality-workspace';
 if(isReality){
  const activate=panel=>{const button=document.querySelector(`[data-cx-tab="${panel}"]`);if(!button)return false;if(button.getAttribute('aria-selected')!=='true')button.click();button.focus({preventScroll:true});button.scrollIntoView({block:'center',behavior:'instant'});return true;};
  // Stay in the current workspace: a normal cross-route navigation would discard an unsaved handoff.
  for(const a of section.querySelectorAll('a[data-jm-route]'))a.addEventListener('click',event=>{const target=new URL(a.href,location.origin);if(target.pathname!=='/reality/')return;const panel=journeyPanel(target.searchParams.get('view'));if(panel&&document.querySelector('[data-cx-tab="'+panel+'"]')){event.preventDefault();const next=new URL(location.href);next.searchParams.delete('view');next.hash='reality-tab='+panel;history.pushState(null,'',next);activate(panel);}else if(target.hash==='#cx-reality-intake'){const dialog=document.getElementById('cx-reality-intake');if(dialog?.showModal){event.preventDefault();dialog.showModal();}}});
  // Native tab/hash restoration is the single history owner. Guide URLs are input aliases only.
  if(location.hash==='#cx-reality-intake'){const dialog=document.getElementById('cx-reality-intake');if(dialog?.showModal&&!dialog.open)dialog.showModal();}
  document.addEventListener('click',event=>{const panel=event.target.closest('[data-cx-tab]')?.dataset.cxTab;if(!panel)return;const step=panel==='review'?3:panel==='navigation'?2:1;[...list.children].forEach((li,index)=>{if(index===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});});
  const panel=journeyPanel(new URL(location.href).searchParams.get('view'));let attempts=0;
  if(panel&&!/^#reality-tab=/.test(location.hash)){const apply=()=>{const button=document.querySelector(`[data-cx-tab="${panel}"]`);if(button){if(button.getAttribute('aria-selected')!=='true')button.click();button.focus({preventScroll:true});button.scrollIntoView({block:'center',behavior:'instant'});}else if(++attempts<15)setTimeout(apply,100);};setTimeout(apply,0);}
 }
}
function methodHub(){
 if(location.pathname!=='/perspectives/personal/')return;
 const section=el('section','jm-block');section.dataset.jmMethods='';section.id='explore-five-methods';section.append(copy(el('p','jm-eyebrow'),'Five distinct perspectives','五种独立视角'),copy(el('h2'),'Understand the method before starting your reading','先了解方法，再开始个人读取'));
 const descriptions={astrology:['Planets, signs and houses as a symbolic reading framework.','以行星、星座与宫位组织象征阅读。'],bazi:['Four pillars and five phases, kept distinct from lived facts.','从四柱与五行理解结构，并与生活事实分开。'],ziwei:['Explore the palace structure before interpreting relationships.','先认识宫位结构，再理解其中关联。'],numerology:['See how number positions organize the current reading.','了解数字位置如何组织当前读取。'],'human-design':['Understand BodyGraph concepts and the chart-confirmation route.','了解 BodyGraph 概念与图表确认流程。']};
 const grid=el('div','jm-method-grid');for(const m of PREENTRY_METHODS){const card=el('article','jm-method-card');card.append(art(methodVisualIds(m.slug).hero,m.en+' — illustrative scene',m.zh+'：方法意象图'));const body=el('div');body.append(copy(el('h3'),m.en,m.zh),copy(el('p'),...descriptions[m.slug]),link('Explore '+m.en,'探索'+m.zh,'/perspectives/personal/'+m.slug+'/'));card.append(body);grid.append(card);}section.append(grid,copy(el('p','jm-meta'),'PHI Configuration, I Ching and Tarot remain available in the existing perspective selector below.','PHI Configuration、易经与塔罗继续保留在下方原有视角选择中。'));document.querySelector('main').prepend(section);
}
function methodPage(){
 const root=document.querySelector('[data-preentry-method]');if(!root)return;
 const m=PREENTRY_METHODS.find(x=>x.slug===root.dataset.preentryMethod);if(!m)return;const ids=methodVisualIds(m.slug);
 function mount(){
  const hero=root.querySelector('#top');if(!hero||hero.dataset.jmMounted)return;hero.dataset.jmMounted='true';hero.classList.add('jm-method-hero');hero.prepend(art(ids.hero,m.en+' — illustrative method scene',m.zh+'：方法意象图',{eager:true}));root.querySelector('.pe5-local-note')?.remove();
  root.querySelector('#read .wrap')?.prepend(copy(el('p','jm-meta'),'This is a method introduction, not your calculated result. Continue with your own information through the existing intake below.','这里是方法导览，不是你的个人计算结果。请通过下方现有资料入口继续。'));
  const slots=[['method','p02','Method structure illustration, not a personal calculated chart','方法结构意象，不是个人精确排盘'],['origin','p03','Illustration of the method’s background','方法背景意象'],['lens','p04','Model, themes, lived experience and choice','模型、主题、生活经验与选择']];
  for(const [id,key,en,cn] of slots){const chapter=root.querySelector('#'+id),wrap=chapter?.querySelector('.wrap');if(!wrap)continue;const figure=el('figure','jm-method-figure jm-method-figure--'+key);figure.append(art(ids[key],en,cn),copy(el('figcaption'),en,cn));
   // Existing Zi Wei SVGs keep their original bytes and conceptual role, separately visible on request.
   const semantic=[...wrap.querySelectorAll('img')].filter(n=>(n.getAttribute('src')||'').endsWith('.svg'));
   if(semantic.length){const detail=el('details','jm-semantic-reference');detail.append(copy(el('summary'),'View the labeled conceptual diagram','查看带标签的概念图'));for(const img of semantic){const owner=img.closest('figure')||img;detail.append(owner);}wrap.append(detail);}
   if(key==='p03')wrap.append(figure);else wrap.prepend(figure);
  }
 }
 new MutationObserver(mount).observe(root,{childList:true,subtree:true});mount();
}
function relationship(){
 if(location.pathname!=='/perspectives/relationship/')return;
 const main=document.querySelector('main'),old=main.querySelector('[data-r5-hero-media]'),oldHeader=old?.parentElement;
 if(oldHeader){oldHeader.classList.add('jm-superseded-hero');oldHeader.hidden=true;oldHeader.querySelector('h1')?.setAttribute('aria-hidden','true');}
 const hero=el('section','jm-block jm-editorial-hero');hero.dataset.jmRelationshipHero='';const intro=el('div');intro.append(copy(el('p','jm-eyebrow'),'Relationship','关系'),copy(el('h1'),'Understand the relationship without speaking for someone else','理解关系，不替对方下结论'),copy(el('p','jm-lead'),'Start with your own experience, questions and boundaries. A shared reading needs separately authorized participation.','从自己的体验、问题与边界开始；共同读取需要分别获授权的参与。'),link('Prepare my reflection','准备自己的观察','#relationship-input'));
 hero.append(intro,art('RELATIONSHIP-HERO','Two people beside a lake, an illustrative relationship scene','两人在湖畔：关系意象图',{eager:true}));main.prepend(hero);
 const form=document.querySelector('[data-relationship-intake]');if(!form)return;form.id='relationship-input';
 const block=el('section','jm-block');block.append(copy(el('h2'),'Which relationship do you want to explore?','你想理解哪一段关系？'));const categories=el('div','jm-categories');categories.setAttribute('role','group');categories.setAttribute('aria-label',t('Relationship type','关系类型'));
 const labels=[['PARTNER','Partner','伴侣'],['PARENT_CHILD','Parent and child','亲子'],['FRIEND','Friend / peer','朋友／同伴'],['BUSINESS_PARTNER','Business partner','商业伙伴'],['COLLEAGUE','Colleague','同事'],['OTHER','Other connection','其他关系']];
 for(const [value,en,cn] of labels){const b=copy(el('button'),en,cn);b.type='button';b.dataset.jmRelationshipType=value;b.addEventListener('click',()=>{form.elements.relationshipType.value=value;form.elements.relationshipType.dispatchEvent(new Event('change',{bubbles:true}));update();});categories.append(b);}block.append(categories);
 const modes=el('div','jm-mode-grid');for(const [value,en,cn,descEn,descCn] of [['SELF_RELATIONSHIP_PATTERN','My own reflection','单方观察','Organize what you have noticed and what you can choose. This does not describe another person’s hidden state.','整理你观察到的情况及自己可作的选择，不推断对方的隐藏状态。'],['SPECIFIC_PERSON_RELATIONSHIP','Prepare shared participation','准备双方参与','Choose the relationship and question first. Sending invitations and private joint reports are not available from this preparation form.','先选择关系与问题；此准备表目前不能发送邀请或取得私人双人报告。']]){const card=el('article','jm-mode-card');card.append(copy(el('h3'),en,cn),copy(el('p'),descEn,descCn));const b=copy(el('button','jm-button jm-button--quiet'),'Choose this path','选择此路径');b.type='button';b.addEventListener('click',()=>{form.elements.mode.value=value;form.elements.mode.dispatchEvent(new Event('change',{bubbles:true}));update();(value==='SPECIFIC_PERSON_RELATIONSHIP'?state:form).scrollIntoView({block:'start',behavior:'instant'});});card.append(b);modes.append(card);}block.append(modes);
 const state=el('div','jm-state');state.setAttribute('role','status');block.append(state);hero.after(block);
 function update(){for(const b of categories.children)b.setAttribute('aria-pressed',String(b.dataset.jmRelationshipType===form.elements.relationshipType.value));const value=relationshipPreparationState({mode:form.elements.mode.value,personBName:form.elements.personBName?.value});if(state.dataset.jmRelationshipState===value)return;state.dataset.jmRelationshipState=value;state.replaceChildren();state.hidden=value==='SOLO';if(state.hidden)return;const missing=value==='MISSING_SECOND_PARTICIPANT';state.append(art(missing?'RELATIONSHIP-INVITE-PARTNER-EMPTYSTATE':'RELATIONSHIP-NO-CONSENT-EMPTYSTATE',missing?'An unoccupied place, illustrating participation not yet established':'A closed boundary, illustrating permission not yet established',missing?'空着的位置：尚未建立对方参与':'关闭的边界：尚未建立对方授权'));const text=el('div');text.append(copy(el('h3'),missing?'The other participant is not connected':'The other person’s permission is not established',missing?'尚未连接另一位参与者':'尚未建立对方授权'),copy(el('p'),'This form can prepare your question. A name, uploaded material or your own checkbox cannot authorize access to someone else’s private reading.','此表可准备你的问题；姓名、上传材料或你的勾选，都不能授权读取别人的私人资料。'));text.append(link('Continue preparing my question','继续准备我的问题','#relationship-input','jm-button jm-button--quiet'));state.append(text);}
 form.addEventListener('input',update);form.addEventListener('change',update);update();
 for(const select of form.querySelectorAll('select'))for(const option of select.options){const parts=option.textContent.split(' / ');if(parts.length===2){option.dataset.jmEn=parts[0];option.dataset.jmZh=parts[1];}}
 translate();
}
function health(){
 if(location.pathname!=='/health-reality.html')return;document.body.classList.add('jm-health-page');
 const main=document.querySelector('main'),header=main.querySelector('header'),hero=el('section','jm-block jm-editorial-hero');hero.dataset.jmHealthHero='';const intro=el('div');intro.append(copy(el('p','jm-eyebrow'),'Health and everyday life','身体与生活'),copy(el('h1'),'Start with what you have noticed','从你注意到的变化开始'),copy(el('p','jm-lead'),'Keep your experience, measurements and unanswered questions distinct. Organize one observation without turning it into a diagnosis.','区分自己的体验、测量与未知问题，整理一项观察，不把它变成诊断。'),link('Organize an observation','整理一项观察','#health-observation'));
 hero.append(intro,art('HEALTH-REALITY-HERO','A quiet outdoor scene for reflection on health and everyday life','安静的户外场景：身体与日常生活意象',{eager:true}));if(header)header.replaceWith(hero);else main.prepend(hero);
 const form=document.querySelector('[data-health-reality-form]');form.id='health-observation';
 const themes=el('section','jm-block');themes.append(copy(el('h2'),'What would you like to pay attention to?','你想关注哪些方面？'));const grid=el('div','jm-categories'),description=el('p','jm-theme-description');description.setAttribute('role','status');
 const items=[['Sleep and rest','睡眠与休息','Notice your sleep schedule and how rested you feel; do not infer a diagnosis from a score.','留意睡眠时间与休息感，不用分数推断疾病。'],['Movement','运动与活动','Describe your activity and what you noticed before and after it.','描述活动，以及活动前后实际注意到的情况。'],['Food and nutrition','饮食与营养','Record what and when you ate if relevant; dietary treatment needs professional guidance.','相关时记录吃了什么及时间；饮食治疗需要专业指导。'],['Body sensations','身体感受','Describe the sensation, its timing and changes. Urgent symptoms need appropriate care.','描述感受、出现时间与变化；紧急症状需要适当照护。'],['Environment','环境与感官','Separate observed surroundings from assumptions about what caused a symptom.','区分实际观察到的环境与对症状成因的猜测。'],['Recovery and energy','恢复与能量','Describe changes in your energy and activity. This is not an assessment of recovery or fitness.','描述精神与活动的变化，不据此判定恢复能力或身体适能。']];
 for(const [en,cn,dEn,dCn] of items){const b=copy(el('button'),en,cn);b.type='button';b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{for(const other of grid.children)other.setAttribute('aria-pressed',String(other===b));copy(description,dEn,dCn);});grid.append(b);}themes.append(grid,description);hero.after(themes);
 const timeline=el('section','jm-block');timeline.append(copy(el('h2'),'Your observations','你的观察'));const empty=el('div','jm-timeline-empty');empty.append(copy(el('p'),'This page does not save a health history','本页不保存长期健康记录'),copy(el('p','jm-meta'),'You can organize an observation for this page session. It is not saved to your account, and refreshing clears it.','可以在本页会话整理一项观察；不会保存到账户，刷新后即清除。'));timeline.append(empty);themes.after(timeline);
}

guidedJourney();methodHub();methodPage();relationship();health();translate();
