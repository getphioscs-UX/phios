/**
 * PHI OS Profile Visitor R1 — progressive presentation over the canonical
 * Profile producer. No method scoring, storage, ownership or authorization.
 * Keeps every existing section/figure, selector and account consent input.
 */
const onPage=document.body?.dataset?.cxSurface==='PROFILE_ASSESSMENT';
const iconBase='/assets/icons/profile-r1/PHIOS-PROFILE-ICON-';
const lang=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh')?'zh':'en';
const pair=(en,zh)=>lang()==='zh'?zh:en;
const modes=[
 {id:'QUICK_PROFILE',icon:'QUICK',en:'A quick introduction to yourself',zh:'快速了解自己',de:'Answer six brief questions to get a starting perspective.',dz:'回答六道简短问题，先从一个容易理解的角度开始。'},
 {id:'FULL_SELF_ASSESSMENT',icon:'FULL',en:'A deeper self-assessment',zh:'深入自我评估',de:'Reflect on more aspects of your habits, preferences and experience.',dz:'从更多生活习惯、偏好与经历出发，深入了解自己。'},
 {id:'BIG_FIVE',icon:'BIGFIVE',en:'Big Five personality',zh:'大五人格',de:'Explore a recognised personality framework. View its source and limits.',dz:'通过有明确来源的人格量表，了解不同特质的表现。'},
 {id:'CAREER_INTERESTS',icon:'CAREER',en:'Career interests',zh:'职业兴趣',de:'See which types of activities interest you, without assuming job fit.',dz:'看看你喜欢哪些工作活动，不把兴趣直接等同于工作能力。'},
 {id:'FINANCIAL_CAPABILITY',icon:'FINANCIAL',en:'Money habits and knowledge',zh:'财务知识与习惯',de:'Explore decisions, awareness and practical money knowledge.',dz:'观察理财知识、日常习惯与决策方式。'},
 {id:'REASONING_TASKS',icon:'REASONING',en:'Reasoning activities',zh:'推理练习',de:'Try original questions. This is not an IQ test.',dz:'完成几道推理题，观察本次表现；这不是 IQ 测试。'},
 {id:'IMPORT_EXTERNAL_RESULT',icon:'EXTERNAL',en:'Bring an existing assessment',zh:'导入已有测评',de:'Use an assessment you already completed, with its source kept visible.',dz:'将你已经完成的测评结果带进来，并保留原始来源。'}
];
const lenses=[
 {id:'identity',icon:'IDENTITY',en:'Identity',zh:'身份',de:'How you describe yourself and what matters to you.',dz:'你如何认识自己，以及什么对你重要。'},
 {id:'expression',icon:'EXPRESSION',en:'Expression',zh:'表达',de:'How you communicate and express your views.',dz:'你如何沟通、表达想法与观点。'},
 {id:'relationships',icon:'RELATIONSHIPS',en:'Relationships',zh:'关系',de:'How you describe your connections and interactions.',dz:'你如何理解与他人的连接和互动。'},
 {id:'environment',icon:'ENVIRONMENT',en:'Environment',zh:'环境',de:'The home, work and everyday conditions around you.',dz:'你所处的家庭、工作和生活条件。'},
 {id:'growth',icon:'GROWTH',en:'Growth',zh:'成长',de:'What you learn and how things change over time.',dz:'你如何学习，以及经历怎样随时间改变。'},
 {id:'potential',icon:'POTENTIAL',en:'Possibilities',zh:'可能性',de:'Options worth exploring—not guarantees about the future.',dz:'值得探索的选择，而不是对未来的保证。'}
];
const steps=[
 ['Choose a starting point','选择一种开始方式','You can begin with six short questions.','可以先从六道简短问题开始。'],
 ['Answer at your own pace','按照自己的节奏回答','Your answers are used for this result only.','答案用于本次测评结果。'],
 ['See your result','查看本次个人画像','Understand what the result says and does not say.','了解结果能说明什么，也知道它的限制。'],
 ['Choose whether to save','决定是否保存','Saving requires sign-in and your explicit consent.','只有登录并明确同意才会保存。']
];
function localized(node,en,zh){
 node.dataset.pvEn=en;node.dataset.pvZh=zh;node.textContent=pair(en,zh);
}
function create(tag,cls){const el=document.createElement(tag);if(cls)el.className=cls;return el;}
const image=(id)=>{const im=document.createElement('img');im.src=iconBase+id+'-v1.svg';im.alt='';im.setAttribute('aria-hidden','true');im.loading='lazy';im.decoding='async';return im;};
function createWheel(){
 const host=create('div','prf-visitor-wheel-wrap');
 const wheel=create('div','prf-visitor-wheel');
 wheel.setAttribute('role','group');wheel.setAttribute('aria-label',pair('Six ways to think about yourself','六个理解自己的角度'));
 let selected='identity';
 const note=create('p','prf-visitor-wheel__hint');
 note.setAttribute('role','status');note.setAttribute('aria-live','polite');
 const controls=lenses.map(x=>{
  const button=create('button','prf-visitor-wheel__lens');
  button.type='button';button.dataset.prfLens=x.id;button.setAttribute('aria-pressed',String(x.id===selected));
  const title=create('b');
  localized(title,x.en,x.zh);
  button.title=pair(x.de,x.dz);
  button.setAttribute('aria-label',pair(x.en+': '+x.de,x.zh+'：'+x.dz));
  button.append(image(x.icon),title);
  button.addEventListener('click',()=>{selected=x.id;refreshSelection();});
  wheel.append(button);return button;
 });
 const center=create('div','prf-visitor-wheel__center');
 const mark=document.createElement('img');mark.src='/assets/images/branding/PHIOS-LOGO-MARK-v1.png';
 mark.alt='PHI OS';mark.decoding='async';center.append(mark);wheel.append(center);
 function refreshSelection(){
  controls.forEach(b=>{
    b.setAttribute('aria-pressed',String(b.dataset.prfLens===selected));
    const x=lenses.find(l=>l.id===b.dataset.prfLens);
    if(x){b.title=pair(x.de,x.dz);b.setAttribute('aria-label',pair(x.en+': '+x.de,x.zh+'：'+x.dz));}
  });
  const current=lenses.find(l=>l.id===selected)||lenses[0];
  note.textContent=pair(current.en+' — '+current.de,current.zh+' — '+current.dz);
 }
 host.append(wheel,note);refreshSelection();
 host.addEventListener('keydown',e=>{
  if(!['ArrowRight','ArrowLeft'].includes(e.key)||!e.target.closest('button[data-prf-lens]'))return;
  e.preventDefault();
  const i=lenses.findIndex(l=>l.id===selected);const next=(i+(e.key==='ArrowRight'?1:-1)+lenses.length)%lenses.length;
  controls[next].focus();controls[next].click();
 });
 host.dataset.prfVisitorWheel='true';return {host,refresh:refreshSelection};
}
function createSteps(){
 const aside=create('aside','prf-visitor-steps');
 const h=create('h2');localized(h,'Four simple steps','简单四步，开始了解自己');
 const list=create('ol');
 for(const [en,zh,de,dz] of steps){
  const li=document.createElement('li');const strong=document.createElement('strong');const body=document.createElement('span');
  localized(strong,en,zh);localized(body,de,dz);li.append(strong,body);list.append(li);
 }
 aside.append(h,list);return aside;
}
function refreshText(){
 document.querySelectorAll('[data-pv-en]').forEach(el=>{const value=el.getAttribute(lang()==='zh'?'data-pv-zh':'data-pv-en');if(value!=null&&el.textContent!==value)el.textContent=value;});
 document.querySelectorAll('[data-prf-visitor-mode]').forEach(button=>{
  const m=modes.find(x=>x.id===button.dataset.prfVisitorMode);if(!m)return;
  const title=button.querySelector('b'),desc=button.querySelector('small');
  if(title)title.textContent=pair(m.en,m.zh);
  if(desc)desc.textContent=pair(m.de,m.dz);
 });
}
function decorateChoices(){
 const buttons=[...document.querySelectorAll('#profile-modes [data-prf-mode]')];
 if(buttons.length!==7)return false;
 for(const m of modes){
  const button=buttons.find(x=>x.dataset.prfMode===m.id);
  if(!button||button.querySelector('.prf-visitor-method-icon'))continue;
  const icon=image(m.icon);icon.className='prf-visitor-method-icon';
  button.insertBefore(icon,button.firstChild);
  button.dataset.prfVisitorMode=m.id;
 }
 const grid=document.querySelector('#profile-modes .prf-mode-grid');
 if(grid&&!grid.querySelector('[data-prf-group]')){
   const categories=[
     {
       id:'start',
       ids:['QUICK_PROFILE','FULL_SELF_ASSESSMENT'],
       heading:['Begin with an easy introduction','先从简单方式开始'],
       description:['New here? Choose one of these two options. The six-question version is the easiest place to begin.','第一次使用？可以先试六道简短问题，再决定是否深入。']
     },
     {
       id:'explore',
       ids:['BIG_FIVE','CAREER_INTERESTS','FINANCIAL_CAPABILITY','REASONING_TASKS'],
       heading:['Explore a particular area','进一步探索感兴趣的方面'],
       description:['Choose a topic that matters to you. Each assessment keeps its own source and interpretation limits.','选择你目前关心的主题；不同测评保留各自的来源与解释限制。']
     },
     {
       id:'existing',
       ids:['IMPORT_EXTERNAL_RESULT'],
       heading:['Already have an assessment?','已经有测评结果？'],
       description:['Bring a result you already have instead of answering the same questions again.','已有其他工具的测评结果，可以直接选择导入，不必为了这一步重复作答。']
     }
   ];
   let index=0;
   for(const group of categories){
     const section=create('section','prf-visitor-method-group');
     section.dataset.prfGroup=group.id;
     const head=create('div','prf-visitor-method-group__heading');
     const title=create('h3');const intro=create('p');
     localized(title,group.heading[0],group.heading[1]);
     localized(intro,group.description[0],group.description[1]);
     head.append(title,intro);
     const cards=create('div','prf-visitor-method-group__cards');
     for(const id of group.ids){
       const button=buttons.find(x=>x.dataset.prfMode===id);
       if(!button)continue;
       index++;
       const number=button.querySelector(':scope > span');
       if(number)number.textContent=String(index).padStart(2,'0');
       cards.append(button);
     }
     section.append(head,cards);grid.append(section);
   }
 }
 const section=document.querySelector('#profile-modes .prf-section-head');
 if(section){
  const kicker=section.querySelector('.cx-eyebrow');
  if(kicker)localized(kicker,'CHOOSE YOUR START','选择一个适合你的开始方式');
  const title=section.querySelector('h2');
  if(title)localized(title,'Choose a way to learn about yourself','选择你想了解自己的方式');
  const desc=section.querySelector('p.cx-body');
  if(desc)localized(desc,'Not sure which to try? Start with six brief questions. You can explore other methods later.','不知道选哪一种？先试六道简短问题，以后再探索其他方式。');
 }
 refreshText();return true;
}
function reorganize(){
 const main=document.querySelector('main.prf-main');
 const hero=main?.querySelector(':scope > .vr2-hero-surface');
 const mode=document.getElementById('profile-modes');
 const workbench=main?.querySelector('[data-prf-workbench]');
 const results=main?.querySelector('[data-prf-results]');
 const bridge=document.getElementById('profile-account-bridge');
 const saved=document.getElementById('profile-saved-evidence');
 if(!hero||!mode||!workbench||!results||!bridge||!saved)return false;
 hero.after(mode);mode.after(workbench);workbench.after(results);
 results.after(bridge);bridge.after(saved);
 const net=document.querySelector('[data-profile-context-network]');
 const intro=net?.nextElementSibling?.matches('section.vr2-story')?net.nextElementSibling:null;
 const example=document.getElementById('profile-example');
 const oldExtra=document.getElementById('prf-visitor-deeper');
 if(!oldExtra&&net&&intro&&example){
   const disclosure=document.createElement('details');disclosure.className='prf-visitor-extras';
   disclosure.id='prf-visitor-deeper';
   const summary=document.createElement('summary');
   localized(summary,'Explore the six dimensions and a sample profile','了解六个阅读角度，并查看示例');
   const modesFigure=mode.querySelector('img[data-approved-visual="PHIOS-FIGURE-PROFILE-SEVEN-ENTRY-MODES-v1.webp"]')?.closest('figure');
   disclosure.append(summary,net,intro,example);
   if(modesFigure)disclosure.append(modesFigure);
   saved.after(disclosure);
 }
 // The actual score/legend is governed by Profile's existing producer.
 // Keep sources and customer evidence selectable, but reveal detail on demand.
 const legend=results.querySelector('[data-prf-source-legend]');
 if(legend&&!legend.closest('.prf-visitor-result-detail')){
   const detail=create('details','prf-visitor-result-detail');
   const summary=document.createElement('summary');
   localized(summary,'View assessment sources and limitations','查看测评来源与解释限制');
   legend.before(detail);detail.append(summary,legend);
 }
 return true;
}
function heroCopy(){
 const hero=document.querySelector('.prf-main > .vr2-hero-surface');
 const grid=hero?.querySelector('.pm-hero');
 if(!grid||grid.querySelector('[data-prf-visitor-wheel]'))return null;
 const kicker=grid.querySelector('.pm-kicker'),title=grid.querySelector('h1'),lead=grid.querySelector('h1 + p');
 if(kicker)localized(kicker,'PERSONAL PROFILE','个人画像 · 从这里开始');
 if(title)localized(title,'See yourself from more than one angle.','从多角度，看见更完整的自己。');
 if(lead)localized(lead,
 'Begin with a short assessment or information you choose to share. Understand your results, then revisit them as your life changes.',
 '用简短测评、你选择提供的资料与生活观察，整理一份能随着经历持续更新的个人画像。');
 const links=grid.querySelectorAll('.pm-actions > a');
 if(links[0]){localized(links[0],'Try a short assessment','开始一个简单测评');links[0].href='#profile-modes';}
 if(links[1]){localized(links[1],'View saved records','查看已保存记录');links[1].href='#profile-saved-evidence';}
 if(links[2]){localized(links[2],'Continue without an assessment','不做测评，继续个人阅读');}
 const boundary=grid.querySelector('.pm-actions + p');
 if(boundary)localized(boundary,
 'Your answers are not saved automatically. These results are for reflection, not a diagnosis or a guarantee about your future.',
 '你的回答不会自动保存。测评结果帮助了解自己，不是诊断，也不保证未来。');
 const wheel=createWheel();
 const figure=grid.querySelector(':scope > figure[data-vr2-role="HERO"]');
 if(figure)grid.insertBefore(wheel.host,figure);else grid.append(wheel.host);
 grid.append(createSteps());
 const trust=create('div','prf-visitor-trust');
 for(const [en,zh] of [
  ['You choose what to save','由你决定是否保存'],
  ['No prediction or diagnosis','不做诊断或命运判断']
 ]){const line=document.createElement('span');localized(line,en,zh);trust.append(line);}
 const copy=grid.querySelector(':scope > div:first-child');
 const disclosure=copy?.querySelector('.pm-actions + p');
 const guide=grid.querySelector('.prf-visitor-steps');
 if(guide){
   if(disclosure)guide.append(disclosure);
   guide.append(trust);
 }else copy?.append(trust);
 return wheel;
}
function initialize(){
 if(document.body?.dataset?.cxSurface!=='PROFILE_ASSESSMENT')return;
 if(document.body.dataset.prfVisitorR1==='ready')return;
 if(!decorateChoices()||!reorganize())return;
 const wheel=heroCopy();
 document.body.dataset.prfVisitorR1='ready';
 const onLang=()=>{refreshText();wheel?.refresh();};
 window.addEventListener('phios:localechange',onLang);
 new MutationObserver(onLang).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 const methodTitles=new Map(modes.map(m=>[m.id,m]));
 document.querySelector('#profile-modes')?.addEventListener('click',e=>{
  const clicked=e.target.closest('[data-prf-mode]');
  if(!clicked)return;
  const m=methodTitles.get(clicked.dataset.prfMode);if(!m)return;
  // Profile producer owns method selection. Only replace customer-facing labels.
  queueMicrotask(()=>{
    const field=document.querySelector('[data-prf-form-title]');
    const mode=document.querySelector('[data-prf-mode-label]');
    if(field)localized(field,m.en,m.zh);
    if(mode)localized(mode,'YOUR ASSESSMENT','你的测评');
  });
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
else initialize();
