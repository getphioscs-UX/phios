/**
 * PHI OS Figure Story Deck R1 — presentation only.
 * Keeps original <figure>, source asset identity, links and captions. No provider,
 * payment, client data, persistence or production authority changes.
 */
const ABOUT=[
  ['Rules and responsibility','规则与责任','Know who provides each claim, and who remains responsible for a decision.','先确认主张来自哪里，以及最终由谁承担决定。'],
  ['An interpretation to examine','可以核对的解释','A useful interpretation can be examined without treating it as a proven fact.','有用的解释仍需要核对，不会自动成为既定事实。'],
  ['Choosing a next step','选择下一步','Consider what is possible before treating any option as an instruction.','先理解现有条件，再决定是否采取下一步。'],
  ['A model is one perspective','模型只是一种视角','Different models illuminate different aspects of the same situation.','不同模型只能照亮同一处境的不同部分。'],
  ['Keep questions open','保留未明确的问题','Unknowns stay visible until evidence or experience changes the picture.','证据不足时保留未知，再依据新的观察调整理解。']
];
const EXPLANATIONS={
  'PHIOS-FIGURE-TAROT-CONNECTED-READING-v1.webp':['Read the cards together','把牌连起来看','The card positions add context to one another; no single card should decide for you.','牌位需要相互对照，不让任何一张牌替你做决定。'],
  'PHIOS-FIGURE-TAROT-REALITY-REFLECTION-v1.webp':['Compare with real life','回到实际处境','Consider what you know, what could contradict the reading, and what remains unknown.','比较现有证据、可能的反例，以及目前仍不知道的部分。'],
  'PHIOS-FIGURE-TAROT-READING-CONTINUITY-v1.webp':['Return when something changes','在情况变化时再回看','Keep the question and reading together so later observations can reshape your view.','保留问题和解读，日后用真实变化重新检视。'],
  'PHIOS-FIGURE-ICHING-SIX-LINES-ORDER-v1.webp':['Form the six lines','建立六爻顺序','The starting structure matters: keep the original bottom-to-top order.','从初爻到上爻的顺序必须保留。'],
  'PHIOS-FIGURE-ICHING-PRIMARY-CHANGING-RELATING-v1.webp':['Separate the layers','区分不同层次','Distinguish the original hexagram, changing lines and relating structure.','分别理解本卦、变爻及之卦，而不是混成同一结果。'],
  'PHIOS-FIGURE-ICHING-READING-LAYERS-v1.webp':['Read within each source','在各自来源内理解','Use the appropriate layer and source before forming a personal interpretation.','先核对对应层次及来源，再组织个人理解。'],
  'PHIOS-FIGURE-ICHING-REALITY-COMPARISON-v1.webp':['Return to the situation','回到当前处境','Compare what the reading suggests with your present observations and limits.','把象征视角与当前观察和限制放在一起比较。'],
  'PHIOS-FIGURE-DIRECTION-POSITION-NETWORK-v1.webp':['Where are you now?','你现在在哪里？','A direction only becomes useful when your present position is clear.','先看清现有位置，方向才可能变得有用。'],
  'PHIOS-FIGURE-REALITY-EVOLUTION-NETWORK-v1.webp':['What has changed?','哪些事情改变了？','Trace the changes without assuming that yesterday still describes today.','记录实际变化，不假设过去的情境仍然适用。'],
  'PHIOS-FIGURE-CHOICE-SPACE-CONSTRAINTS-v1.webp':['What is possible?','目前可以选择什么？','Available options depend on resources, commitments and constraints.','可用资源、已有承诺与限制会影响真正的选择空间。'],
  'PHIOS-FIGURE-CURRENT-UNKNOWN-FOCUS-v1.webp':['What remains unknown?','哪些事情还不知道？','Keep a clear distinction between observation, assumptions and open questions.','明确区分已观察事实、假设与尚待确认的问题。'],
  'PHIOS-FIGURE-STRUCTURAL-REINFORCEMENT-EVIDENCE-v1.webp':['What can be checked?','哪些判断有证据？','Revisit your understanding when new supporting or opposing evidence appears.','新的支持或反对证据出现时，应重新检视判断。'],
  'PHIOS-FIGURE-PROFILE-RESULT-READING-KEY-v1.webp':['Read the result with its source','把结果和来源一起读','A score or label needs its original instrument and interpretation limits.','分数和标签需要连同原始工具及其解释边界一起阅读。'],
  'PHIOS-FIGURE-PROFILE-EXTERNAL-CONFIRMATION-v1.webp':['Confirm outside results','确认外部结果','Preserve the origin of an uploaded assessment before using it.','使用外部测评结果前，先核对它的来源。'],
  'PHIOS-FIGURE-PROFILE-SOURCE-DIFFERENCES-v1.webp':['Keep differences visible','保留不同来源的差异','Different methods can disagree. Do not average their meanings into a false consensus.','来源可以得出不同结论，不应强行混成一致的分数。'],
  'PHIOS-FIGURE-PROFILE-BILINGUAL-DOSSIER-ACCESS-v1.webp':['Your bilingual dossier','你的双语报告','The report keeps its source boundaries and depends on existing access rights.','报告保留来源边界，下载和查看仍遵循现有权益。'],
  'PHIOS-FIGURE-PROFILE-SELECTIVE-REALITY-HANDOFF-v1.webp':['Choose what to carry forward','选择哪些资料带入现实','Only the information you choose should enter your Reality comparison.','只有你明确选择的资料才会进入 Reality 对照。'],
  'PHIOS-FIGURE-ACCOUNT-TIMELINE-VERSIONS-v1.webp':['See work over time','沿时间线查看记录','Compare saved versions without losing their original dates.','可以对照不同时间的已存版本，不必抹去历史。'],
  'PHIOS-FIGURE-ACCOUNT-SAVED-VS-SESSION-v1.webp':['Saved is not the same as temporary','已保存不等于本次会话','A temporary session should never be presented as a permanently saved record.','本次会话的临时内容，不应冒充永久保存的记录。']
};
const GROUPS={
  '/perspectives/tarot/':[{
    ids:['PHIOS-FIGURE-TAROT-CONNECTED-READING-v1.webp','PHIOS-FIGURE-TAROT-REALITY-REFLECTION-v1.webp','PHIOS-FIGURE-TAROT-READING-CONTINUITY-v1.webp'],
    after:'main [data-symbolic-results]',
    label:['Explore the three Tarot reading principles','探索三种塔罗阅读原则']
  }],
  '/perspectives/iching/consult/':[{
    ids:['PHIOS-FIGURE-ICHING-SIX-LINES-ORDER-v1.webp','PHIOS-FIGURE-ICHING-PRIMARY-CHANGING-RELATING-v1.webp','PHIOS-FIGURE-ICHING-READING-LAYERS-v1.webp','PHIOS-FIGURE-ICHING-REALITY-COMPARISON-v1.webp'],
    after:'main > section.icx-workflow',
    label:['Understand the I Ching reading steps','理解易经读取步骤']
  }],
  '/reality/':[{
    ids:['PHIOS-FIGURE-DIRECTION-POSITION-NETWORK-v1.webp','PHIOS-FIGURE-REALITY-EVOLUTION-NETWORK-v1.webp','PHIOS-FIGURE-CHOICE-SPACE-CONSTRAINTS-v1.webp','PHIOS-FIGURE-CURRENT-UNKNOWN-FOCUS-v1.webp','PHIOS-FIGURE-STRUCTURAL-REINFORCEMENT-EVIDENCE-v1.webp'],
    after:'main > section.cx-section--tight',
    label:['See how Reality navigation works','了解现实导航怎样使用']
  }],
  '/perspectives/profile/':[{
    ids:['PHIOS-FIGURE-PROFILE-RESULT-READING-KEY-v1.webp','PHIOS-FIGURE-PROFILE-EXTERNAL-CONFIRMATION-v1.webp','PHIOS-FIGURE-PROFILE-SOURCE-DIFFERENCES-v1.webp'],
    label:['Read and compare your evidence','阅读和比较你的个人证据']
  },{
    ids:['PHIOS-FIGURE-PROFILE-BILINGUAL-DOSSIER-ACCESS-v1.webp','PHIOS-FIGURE-PROFILE-SELECTIVE-REALITY-HANDOFF-v1.webp'],
    label:['Continue from Profile to Reality','从个人画像继续到现实']
  }],
  '/account/':[{
    ids:['PHIOS-FIGURE-ACCOUNT-TIMELINE-VERSIONS-v1.webp','PHIOS-FIGURE-ACCOUNT-SAVED-VS-SESSION-v1.webp'],
    after:'main > section.cx-section.vr2-hero-surface',
    label:['Understand your saved work','了解你的保存记录']
  }]
};
const LOCALIZED_SINGLES={
  '/':['PHIOS-FIGURE-PLATFORM-RELATIONSHIP-NETWORK-v1.webp','PHIOS-FIGURE-KNOWLEDGE-DISCOVERY-NETWORK-v1.webp','PHIOS-FIGURE-NAVIGATION-FORMATION-1B-v1.webp'],
  '/perspectives/profile/':['PHIOS-FIGURE-PROFILE-EVIDENCE-SOURCES-v1.webp','PHIOS-FIGURE-PROFILE-SEVEN-ENTRY-MODES-v1.webp'],
  '/account/':['PHIOS-FIGURE-MY-PHI-ACCOUNT-NETWORK-v2.webp']
};
const selectorsForAsset=id=>[...document.querySelectorAll('img[data-approved-visual]')].filter(img=>img.getAttribute('data-approved-visual')===id);
const isHero=node=>!!node.closest('[data-vr2-role="HERO"],[data-vr2-role="BRAND_IDENTITY"],.founder-r2-origin-media,.cx-home-hero');
const lang=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh')?1:0;
const getTitle=node=>node.querySelector(':scope > h2, :scope > h3, figcaption')?.textContent?.trim()||'Figure';
const descriptions=(id,node)=>EXPLANATIONS[id]||[getTitle(node),getTitle(node),'Open the full illustration to examine its details.','可打开完整原图查看细节。'];
const make=(tag,cls)=>{const node=document.createElement(tag);node.className=cls;return node;};
const setText=(node,en,zh)=>{node.dataset.figEn=en;node.dataset.figZh=zh;node.textContent=lang()?zh:en;};
function locateGroup(ids){
  const nodes=[];
  for(const id of ids){
    const matches=selectorsForAsset(id);
    if(matches.length!==1||isHero(matches[0]))return null;
    const figure=matches[0].closest('figure'),section=figure?.closest('section.vr2-story');
    if(!figure||!section||section.querySelectorAll('figure').length!==1||nodes.includes(section))return null;
    nodes.push(section);
  }
  if(new Set(nodes.map(n=>n.parentElement)).size!==1)return null;
  return nodes;
}
function storyDeck(sources,ids,label,{after,kind='sections'}={}){
  if(!sources?.length)return false;
  const placeholder=document.createComment('Original Figure Story Deck location');
  sources[0].before(placeholder);
  const deck=make('section','phios-figure-deck');
  deck.dataset.figureDeck='r1';
  deck.setAttribute('role','region');
  deck.setAttribute('aria-roledescription','carousel');
  deck.tabIndex=0;
  const title=make('h2','phios-figure-deck__title');
  setText(title,label[0],label[1]);
  deck.setAttribute('aria-label',lang()?label[1]:label[0]);
  const track=make('div','phios-figure-deck__track');
  const slides=sources.map((source,i)=>{
    const slide=make('div','phios-figure-deck__slide');
    slide.dataset.figureIndex=String(i);
    const expl=kind==='figures'&&ids?.[i]?.startsWith('ABOUT-')?ABOUT[i]:descriptions(ids?.[i],source);
    if(kind==='figures'){
      const section=make('section','phios-figure-deck__source phios-figure-deck__source--figure');
      const heading=make('h3','phios-figure-deck__heading');setText(heading,expl[0],expl[1]);
      const copy=make('p','phios-figure-deck__description');setText(copy,expl[2],expl[3]);
      section.append(source,heading,copy);slide.append(section);
    } else {
      source.classList.add('phios-figure-deck__source');
      const heading=source.querySelector(':scope > h2');
      if(heading){const copy=make('p','phios-figure-deck__description');setText(copy,expl[2],expl[3]);heading.after(copy);}
      slide.append(source);
    }
    slide.hidden=i!==0;slide.inert=i!==0;
    track.append(slide);
    return slide;
  });
  const controls=make('nav','phios-figure-deck__controls');
  const prev=make('button','phios-figure-deck__arrow');
  const next=make('button','phios-figure-deck__arrow');
  prev.type=next.type='button';prev.textContent='‹';next.textContent='›';
  const counter=make('span','phios-figure-deck__counter');
  const dots=make('div','phios-figure-deck__dots');
  const buttons=slides.map((slide,i)=>{
    const b=make('button','phios-figure-deck__dot');
    b.type='button';b.dataset.figureGo=String(i);
    b.addEventListener('click',()=>activate(i));
    dots.append(b);return b;
  });
  controls.append(prev,counter,dots,next);
  deck.append(title,track,controls);
  let active=0;
  function localize(){
    deck.setAttribute('aria-label',lang()?label[1]:label[0]);
    deck.querySelectorAll('[data-fig-en]').forEach(n=>{const s=n.getAttribute(lang()?'data-fig-zh':'data-fig-en');if(n.textContent!==s)n.textContent=s;});
    prev.setAttribute('aria-label',lang()?'上一张图':'Previous figure');
    next.setAttribute('aria-label',lang()?'下一张图':'Next figure');
    for(let i=0;i<buttons.length;i++)buttons[i].setAttribute('aria-label',(lang()?'查看第 ':'View figure ')+(i+1));
  }
  function activate(i){
    active=(i+slides.length)%slides.length;
    slides.forEach((slide,j)=>{slide.hidden=j!==active;slide.inert=j!==active;});
    buttons.forEach((b,j)=>{b.setAttribute('aria-current',j===active?'true':'false');});
    counter.textContent=(active+1)+' / '+slides.length;
    const visible=slides[active].querySelector('img');
    if(visible){visible.loading='lazy';visible.decoding='async';}
  }
  prev.addEventListener('click',()=>activate(active-1));
  next.addEventListener('click',()=>activate(active+1));
  deck.addEventListener('keydown',event=>{
    if(event.target.closest('input,textarea,select'))return;
    if(event.key==='ArrowRight'){event.preventDefault();activate(active+1);}
    else if(event.key==='ArrowLeft'){event.preventDefault();activate(active-1);}
  });
  const anchor=after&&document.querySelector(after);
  if(anchor&&!sources.some(s=>s===anchor||s.contains(anchor)))anchor.insertAdjacentElement('afterend',deck);
  else placeholder.parentNode.insertBefore(deck,placeholder);
  placeholder.remove();
  localize();activate(0);
  new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  return true;
}
function upgradeAbout(){
  const figures=[...document.querySelectorAll('.pis-visual-story .pis-editorial__grid > figure')];
  if(figures.length!==5||figures.some(f=>isHero(f)))return;
  const gallery=figures[0].parentElement;
  if(storyDeck(figures,ABOUT.map((_,i)=>'ABOUT-'+i),['Explore five navigation principles','探索五项现实导航原则'],{kind:'figures'})){
    const deck=gallery.querySelector(':scope > .phios-figure-deck');
    if(deck)gallery.replaceWith(deck);
  }
}
function compactSingletons(path){
  for(const id of LOCALIZED_SINGLES[path]||[]){
    const images=selectorsForAsset(id);
    if(images.length!==1||isHero(images[0]))continue;
    const figure=images[0].closest('figure');
    const section=figure?.closest('section.vr2-story');
    if(section&&section.querySelectorAll('figure').length===1)section.classList.add('phios-figure-editorial-split');
  }
  if(path==='/perspectives/personal/'){
    document.querySelector('.cx-r5-governance-figures')?.classList.add('phios-figure-paired');
  }
  if(path==='/perspectives/'){
    document.querySelectorAll('.pv-module figure.figure-editorial').forEach(f=>f.classList.add('phios-figure-compact'));
  }
  if(path==='/about/founder/'){
    document.querySelectorAll('.founder-r1-figure').forEach(f=>{
      if(!/PORTRAIT|HERO/i.test(f.querySelector('img')?.src||''))f.classList.add('phios-figure-compact');
    });
  }
}
function setupFinancial(){
  const guides=[...document.querySelectorAll('.cx-r13-intake-stage details.r5-context-guide')];
  if(guides.length<6)return;
  for(const guide of guides){
    guide.classList.add('phios-figure-context-guide');
    const img=guide.querySelector('img');
    if(img){img.loading='lazy';img.decoding='async';}
  }
}
function boot(){
  const path=location.pathname.replace(/\/index\.html$/,'/').replace(/\/?$/,'/')||'/';
  if(!GROUPS[path]&&path!='/about/reality-navigation/'&&!LOCALIZED_SINGLES[path]&&!['/professional/financial/','/about/founder/','/perspectives/personal/','/perspectives/'].includes(path))return;
  if(!document.querySelector('link[data-figure-deck-css]')){
    const style=document.createElement('link');
    style.rel='stylesheet';style.href='/assets/css/figure-story-deck.css';style.dataset.figureDeckCss='r1';
    document.head.append(style);
  }
  if(path==='/about/reality-navigation/')upgradeAbout();
  for(const group of GROUPS[path]||[]){
    const source=locateGroup(group.ids);
    if(source)storyDeck(source,group.ids,group.label,group);
  }
  compactSingletons(path);
  if(path==='/professional/financial/')setupFinancial();
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
}
