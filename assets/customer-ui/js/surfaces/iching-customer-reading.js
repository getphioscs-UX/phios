const q=selector=>document.querySelector(selector);
const qa=selector=>[...document.querySelectorAll(selector)];
const arr=value=>Array.isArray(value)?value:[];
const isZh=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh');
const locale=()=>isZh()?'zh-Hans':'en';
const t=(en,zh)=>isZh()?zh:en;
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const text=value=>String(value??'').normalize('NFKC').trim();

const ASSETS=Object.freeze({
  overview:Object.freeze({
    en:'/assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-en.webp',
    'zh-Hans':'/assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-zh-Hans.webp'
  }),
  threeCoin:Object.freeze({
    en:'/assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-en.webp',
    'zh-Hans':'/assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-zh-Hans.webp'
  })
});

let latestView=null;
let latestExecuteBody=null;
let resultObserver=null;
let bodyObserver=null;
let statusObserver=null;
let installed=false;

function installStyles(){
  if(q('link[data-iching-customer-reading-style]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='/assets/customer-ui/surfaces/iching-customer-reading.css';
  link.dataset.ichingCustomerReadingStyle='';
  document.head.append(link);
}

function setText(node,en,zh){if(!node)return;const next=t(en,zh);if(text(node.textContent)!==next)node.textContent=next;}

function sanitizeCustomerCopy(){
  prepareCustomerWorkspace();
  const intro=q('[data-iching-results] .cx-iching-result-intro');
  if(intro){
    setText(intro.querySelector('.cx-eyebrow'),'YOUR READING','这次阅读');
    setText(intro.querySelector('.cx-title'),
      'See the hexagram structure, the human-reviewed interpretation, the Reality comparison and what remains open.',
      '依次查看卦象结构、人工审核解释、现实对照，以及仍然保持开放的部分。');
    setText(intro.querySelector('.cx-muted'),
      'The sections below separate symbolic interpretation from real-world evidence so you can see what the reading does—and does not—establish.',
      '下面会把象征解释与现实证据分开呈现，让你清楚看到这次阅读说明了什么，也没有说明什么。');
  }
  const sources=q('[data-view-sources]');
  if(sources)setText(sources,'View original sources','查看原典来源');
  sanitizeProductionState();
  syncManualOptions();
}

function prepareCustomerWorkspace(){
  const question=q('[data-iching-question]');
  if(question){
    question.disabled=false;
    question.readOnly=false;
    question.removeAttribute('aria-disabled');
    question.style.pointerEvents='auto';
    question.style.position='relative';
    question.style.zIndex='1';
    if(question.tabIndex<0)question.tabIndex=0;
  }

  const boundary=q('.cx-iching-boundary');
  if(boundary){
    const hero=boundary.closest('.cx-iching-hero');
    boundary.remove();
    if(hero)hero.style.gridTemplateColumns='minmax(0,1fr)';
  }

  const casting=q('.cx-casting-surface');
  const gate=q('.cx-iching-gate');
  const execute=q('[data-iching-execute]');
  const executionStatus=q('[data-execution-status]');
  if(casting&&gate&&execute&&!q('[data-customer-reading-action]')){
    const bar=document.createElement('div');
    bar.className='cx-reading-action-bar';
    bar.dataset.customerReadingAction='';
    bar.innerHTML=`<div><strong>${escape(t('Continue when your casting input is ready','起卦资料准备好后继续'))}</strong><span>${escape(t('The reading will appear directly below.','完成后会直接带你进入下方阅读结果。'))}</span></div>`;
    if(executionStatus)bar.append(executionStatus);
    bar.append(execute);
    const guide=casting.querySelector('[data-self-casting-guide]');
    if(guide)casting.insertBefore(bar,guide);else casting.append(bar);
    const gateSection=gate.closest('section');
    if(gateSection)gateSection.hidden=true;else gate.hidden=true;
  }else if(gate){
    const gateSection=gate.closest('section');
    if(gateSection)gateSection.hidden=true;else gate.hidden=true;
  }

  const context=q('[data-reality-context-disclosure]');
  if(context&&/not being used|没有使用 Reality context/i.test(text(context.textContent)))context.hidden=true;

  for(const button of qa('[data-iching-cast-mode]')){
    if(button.dataset.customerGuideBinding==='true')continue;
    button.dataset.customerGuideBinding='true';
    button.addEventListener('click',()=>{
      const mode=button.dataset.ichingCastMode;
      const guide=q('[data-self-casting-guide]');
      if(guide&&(mode==='MANUAL_LINES'||mode==='COIN_CAST'))guide.open=true;
    });
  }
}

function sanitizeProductionState(){
  const node=q('[data-iching-production-state]');
  if(!node)return;
  const current=text(node.textContent);
  const raw=current.toUpperCase();
  const labels={ready:t('READY','可以使用'),checking:t('CHECKING','正在准备'),unavailable:t('TEMPORARILY UNAVAILABLE','暂时不可用')};
  if(['READY','可以使用','CHECKING','正在准备','TEMPORARILY UNAVAILABLE','暂时不可用'].includes(current)){
    const state=node.dataset.customerState||(['READY','可以使用'].includes(current)?'ready':['CHECKING','正在准备'].includes(current)?'checking':'unavailable');
    const next=labels[state]||labels.unavailable;if(current!==next)node.textContent=next;node.dataset.customerState=state;return;
  }
  if(['FULL PRODUCTION','FULL_PRODUCTION','AUTHORIZED'].some(value=>raw.includes(value))){
    if(current!==labels.ready)node.textContent=labels.ready;
    node.dataset.customerState='ready';
  }else if(raw.includes('CHECK')){
    if(current!==labels.checking)node.textContent=labels.checking;
    node.dataset.customerState='checking';
  }else if(raw){
    if(current!==labels.unavailable)node.textContent=labels.unavailable;
    node.dataset.customerState='unavailable';
  }
}

const CUSTOMER_STATUS_REPLACEMENTS=Object.freeze({
  '当前部署尚未取得 Full Production 权限。':'阅读服务暂时不可用，请稍后再试。',
  '执行权限目前不可用。':'阅读服务暂时不可用，请稍后再试。',
  '正在形成一次受治理的起卦……':'正在形成这次卦象……',
  '正在准备受治理的象征视角……':'正在准备这次阅读……',
  '起卦证据已经冻结，现在可以探索这次视角。':'卦象已经形成，现在可以继续查看这次阅读。',
  'Full Production authority is not active on this deployment.':'The reading service is temporarily unavailable. Please try again shortly.',
  'Execution authority is unavailable.':'The reading service is temporarily unavailable. Please try again shortly.',
  'Creating one governed cast…':'Creating this cast…',
  'Preparing the governed perspective…':'Preparing this reading…',
  'Cast evidence is frozen. You can now explore this perspective.':'The cast is ready. You can now continue into this reading.'
});
function sanitizeStatusNodes(){
  for(const node of [q('[data-iching-casting-status]'),q('[data-execution-status]')]){
    if(!node)continue;
    const current=text(node.textContent);
    if(CUSTOMER_STATUS_REPLACEMENTS[current])node.textContent=CUSTOMER_STATUS_REPLACEMENTS[current];
    if(current.startsWith('执行仍不可用：'))node.textContent=`阅读暂时无法完成：${current.slice('执行仍不可用：'.length)}`;
    if(current.startsWith('Execution remains unavailable:'))node.textContent=`Reading temporarily unavailable:${current.slice('Execution remains unavailable:'.length)}`;
  }
}

function syncManualOptions(){
  const labels={
    6:[ '6 · old yin · changing (yin → yang)','6 · 老阴 · 变爻（阴 → 阳）' ],
    7:[ '7 · young yang · stable','7 · 少阳 · 静爻' ],
    8:[ '8 · young yin · stable','8 · 少阴 · 静爻' ],
    9:[ '9 · old yang · changing (yang → yin)','9 · 老阳 · 变爻（阳 → 阴）' ]
  };
  for(const select of qa('[data-iching-line]')){
    for(const option of [...select.options]){
      const pair=labels[Number(option.value)];
      if(pair){const next=isZh()?pair[1]:pair[0];if(text(option.textContent)!==next)option.textContent=next;}
    }
  }
  const manual=q('[data-iching-mode-panel="MANUAL_LINES"]');
  if(manual){
    let note=manual.querySelector('[data-manual-line-reference]');
    if(!note){
      note=document.createElement('div');
      note.className='cx-manual-line-reference';
      note.dataset.manualLineReference='';
      manual.prepend(note);
    }
    if(note.dataset.locale!==locale()){
      note.innerHTML=`<strong>${escape(t('Quick reference','快速对照'))}</strong><span>6 · ${escape(t('old yin · changing','老阴 · 变爻'))}</span><span>7 · ${escape(t('young yang · stable','少阳 · 静爻'))}</span><span>8 · ${escape(t('young yin · stable','少阴 · 静爻'))}</span><span>9 · ${escape(t('old yang · changing','老阳 · 变爻'))}</span>`;
      note.dataset.locale=locale();
    }
  }
}

function guideFigure(kind){
  const figure=document.createElement('figure');
  figure.className='cx-iching-guide-figure';
  figure.dataset.ichingGuideFigure=kind;
  figure.innerHTML=`<img loading="lazy" decoding="async" alt=""><figcaption></figcaption>`;
  syncGuideFigure(figure);
  return figure;
}
function syncGuideFigure(figure){
  const kind=figure.dataset.ichingGuideFigure;
  const image=figure.querySelector('img');
  const caption=figure.querySelector('figcaption');
  if(!image||!ASSETS[kind])return;
  const currentLocale=locale();
  const src=ASSETS[kind][currentLocale];
  let alt='';let cap='';
  if(kind==='overview'){
    alt=t('Illustrated overview of PHI OS, three-coin, six-coin and yarrow-stalk I Ching casting methods.','易经起卦方式图解：PHI OS 随机起卦、三枚硬币法、六枚铜钱法与蓍草法。');
    cap=t('Choose a method that fits how much of the casting process you want to do yourself.','先看总览，再选择你想自己完成到什么程度的起卦方式。');
  }else{
    alt=t('Step-by-step illustrated guide to the three-coin I Ching casting method and the 6, 7, 8, 9 line values.','三枚硬币起卦步骤图解，以及 6、7、8、9 爻值对照。');
    cap=t('Three-coin method: toss three coins for each line, record six rounds from bottom to top.','三枚硬币法：每一爻投三枚硬币，共六次，由初爻向上记录。');
  }
  if(image.getAttribute('src')!==src)image.setAttribute('src',src);
  if(image.alt!==alt)image.alt=alt;
  if(caption&&text(caption.textContent)!==cap)caption.textContent=cap;
  figure.dataset.locale=currentLocale;
}
function decorateCastingGuide(){
  const body=q('[data-self-casting-guide-body]');
  if(!body)return;
  if(!body.querySelector('[data-iching-guide-figure="overview"]'))body.prepend(guideFigure('overview'));
  const sections=qa('[data-self-casting-guide-body] .cx-cast-guide__section');
  const threeCoin=sections[1];
  if(threeCoin&&!threeCoin.querySelector('[data-iching-guide-figure="threeCoin"]')){
    const heading=threeCoin.querySelector('h4');
    const figure=guideFigure('threeCoin');
    if(heading)heading.insertAdjacentElement('afterend',figure);else threeCoin.prepend(figure);
  }
  for(const figure of qa('[data-iching-guide-figure]'))syncGuideFigure(figure);
  syncManualOptions();
}

function humanInputMode(mode){
  return ({SYSTEM_RANDOM:t('PHI OS cast','PHI OS 为我起卦'),COIN_CAST:t('Recorded three-coin tosses','记录三枚硬币'),MANUAL_LINES:t('Entered six existing lines','输入已有六爻')})[mode]||t('Recorded casting evidence','已记录起卦资料');
}
function lineLabel(value){
  return ({6:t('old yin · changing','老阴 · 变爻'),7:t('young yang · stable','少阳 · 静爻'),8:t('young yin · stable','少阴 · 静爻'),9:t('old yang · changing','老阳 · 变爻')})[Number(value)]||String(value??'—');
}
function lineMark(value){return ({6:'⚋ ×',7:'⚊',8:'⚋',9:'⚊ ○'})[Number(value)]||'—';}
function hexName(hex={}){
  const number=hex.number?(isZh()?`第${hex.number}卦`:`Hexagram ${hex.number}`):'';
  const zh=hex.chineseNameZhHans||hex.chineseName||'';
  const canonical=hex.canonicalName||'';
  return isZh()?[number,zh,canonical&&`(${canonical})`].filter(Boolean).join(' · '):[number,canonical,zh&&`(${zh})`].filter(Boolean).join(' · ');
}
function values(items){return arr(items).map(item=>typeof item==='string'?item:item?.statement||item?.reason||item?.value||'').map(text).filter(Boolean);}
function list(items,empty=''){
  const clean=[...new Set(values(items))];
  if(!clean.length)return empty?`<p class="cx-reading-empty">${escape(empty)}</p>`:'';
  return `<ul class="cx-reading-list">${clean.map(item=>`<li>${escape(item)}</li>`).join('')}</ul>`;
}
function contentSection(label,content){return content?`<section class="cx-reading-explain-card"><h5>${escape(label)}</h5><p>${escape(content)}</p></section>`:'';}
function depthQuestions(depth){
  const units=[depth?.hexagram,...arr(depth?.lines)].filter(Boolean);
  const all=[];
  for(const unit of units){
    all.push(...arr(unit.content?.whatToObserve),...arr(unit.content?.reflectionQuestions));
  }
  return [...new Set(all.map(text).filter(Boolean))];
}

function enhanceMethodEvidence(view){
  const data=view?.hierarchy?.find(item=>item.id==='METHOD_EVIDENCE')?.data||{};
  const target=q('[data-result-layer="METHOD_EVIDENCE"] [data-result-content]');
  if(!target)return;
  const lines=arr(data.sixLines);
  const mode=latestExecuteBody?.inputMode||'MANUAL_LINES';
  target.innerHTML=`<div class="cx-reading-method-summary"><div><span>${escape(t('How this hexagram was formed','这次卦象如何形成'))}</span><strong>${escape(humanInputMode(mode))}</strong></div><div><span>${escape(t('Recording order','记录顺序'))}</span><strong>${escape(t('Bottom line → top line','初爻 → 上爻'))}</strong></div></div><ol class="cx-reading-six-lines">${lines.map((item,index)=>{const value=item?.lineValue??item;return `<li><span>${index+1}${index===0?` · ${escape(t('bottom','初爻'))}`:index===5?` · ${escape(t('top','上爻'))}`:''}</span><strong>${escape(lineMark(value))}</strong><b>${escape(value)} · ${escape(lineLabel(value))}</b></li>`;}).join('')}</ol>`;
}

function enhanceInterpretation(view){
  const layer=view?.hierarchy?.find(item=>item.id==='SYMBOLIC_INTERPRETATION');
  const projection=view?.hierarchy?.find(item=>item.id==='PROJECTION')?.data||{};
  const target=q('[data-result-layer="SYMBOLIC_INTERPRETATION"] [data-result-content]');
  if(!target||!layer)return;
  const depth=layer.data?.depthInterpretation;
  if(depth?.status!=='AVAILABLE'||!depth.hexagram?.content){
    target.innerHTML=`<p class="cx-reading-empty">${escape(t('The human-reviewed interpretation for this projection is temporarily unavailable. The structural result remains visible above.','这次投射的人工审核解释暂时无法显示；上方卦象结构仍然有效。'))}</p>`;
    return;
  }
  const primary=projection.primary||{};
  const relating=projection.relating||{};
  const content=depth.hexagram.content||{};
  const lineCards=arr(depth.lines).map(unit=>{
    const c=unit.content||{};
    return `<article class="cx-reading-line-interpretation"><header><span>${escape(t(`Changing line ${unit.linePosition}`,`第 ${unit.linePosition} 爻 · 变爻`))}</span><strong>${escape(c.plainMeaning||'')}</strong></header>${contentSection(t('Stage / situation','这一爻所处阶段'),c.situationOrStage)}${contentSection(t('Central tension','这一爻的核心张力'),c.centralTension)}${contentSection(t('Constructive use','可以怎样使用这个视角'),c.constructiveExpressionOrMovement)}${list(c.whatToObserve)}</article>`;
  }).join('');
  target.innerHTML=`<article class="cx-reading-depth"><header class="cx-reading-depth__header"><div><p class="cx-eyebrow">${escape(t('HUMAN-REVIEWED INTERPRETATION','人工审核解释'))}</p><h4>${escape(hexName(primary))}</h4>${relating?.number?`<p>${escape(t('Structural change','结构变化'))}: ${escape(hexName(primary))} → ${escape(hexName(relating))}</p>`:''}</div><span class="cx-reading-approved">${escape(t('Reviewed','已审核'))}</span></header><p class="cx-reading-plain-meaning">${escape(content.plainMeaning||'')}</p><div class="cx-reading-explain-grid">${contentSection(t('Situation / stage','当前处境 / 阶段'),content.situationOrStage)}${contentSection(t('Central tension','核心张力'),content.centralTension)}${contentSection(t('Constructive movement','较有建设性的方向'),content.constructiveExpressionOrMovement)}${contentSection(t('Risk of misreading','需要避免的误读'),content.distortionOrFailureRisk)}${contentSection(t('Timing / condition','条件与阶段'),content.timingOrCondition)}</div>${lineCards?`<section class="cx-reading-changing-lines"><h5>${escape(t('Changing-line interpretation','变爻解释'))}</h5>${lineCards}</section>`:''}<section class="cx-reading-observe"><h5>${escape(t('What to observe next','接下来可以观察什么'))}</h5>${list(content.whatToObserve,t('No additional observation prompt is bound to this projection.','这次投射没有额外的观察提示。'))}</section><p class="cx-reading-boundary">${escape(arr(content.misreadingWarnings)[0]||t('Use this as a symbolic perspective, not as proof of a future outcome.','把这次阅读作为象征视角，而不是未来结果的证明。'))}</p></article>`;
}

function enhanceReality(view){
  const layer=view?.hierarchy?.find(item=>item.id==='REALITY_COMPARISON');
  const interpretation=view?.hierarchy?.find(item=>item.id==='SYMBOLIC_INTERPRETATION')?.data?.depthInterpretation;
  const target=q('[data-result-layer="REALITY_COMPARISON"] [data-result-content]');
  if(!target||!layer)return;
  const data=layer.data||{};
  const prompts=depthQuestions(interpretation).slice(0,4);
  const supporting=values(data.supportingEvidence);
  const contradictory=values(data.contradictoryEvidence);
  const observations=values(data.observation);
  const supplied=supporting.length+contradictory.length+observations.length>0;
  target.innerHTML=`<div class="cx-reading-reality-intro"><strong>${escape(t('Keep the symbolic lens separate from what is actually happening.','把象征视角与现实中真正发生的事情分开。'))}</strong><p>${escape(supplied?t('Real-world material was supplied for comparison. Use it to test, qualify or contradict the symbolic lens.','这次已经有现实资料可用于对照；请用它来检验、限制或反驳象征视角。'):t('No additional real-world evidence was supplied with this reading, so PHI OS will not turn the hexagram into a conclusion about what will happen.','这次阅读没有附加现实证据，因此 PHI OS 不会把卦象直接变成“事情会怎样”的结论。'))}</p></div><div class="cx-reading-reality-grid"><section><h5>${escape(t('Evidence that supports the lens','支持这个视角的现实证据'))}</h5>${list(data.supportingEvidence,t('None supplied yet.','尚未提供。'))}</section><section><h5>${escape(t('Evidence that contradicts it','与这个视角相矛盾的现实证据'))}</h5>${list(data.contradictoryEvidence,t('None supplied yet.','尚未提供。'))}</section><section><h5>${escape(t('Observations already recorded','已经记录的观察'))}</h5>${list(data.observation,t('None supplied yet.','尚未提供。'))}</section></div>${prompts.length?`<section class="cx-reading-reality-prompts"><h5>${escape(t('Useful Reality checks','可以回到现实核对的问题'))}</h5>${list(prompts)}</section>`:''}<p class="cx-reading-boundary">${escape(t('The hexagram can suggest what to look at; real-world facts can support it, contradict it, or leave the question unresolved.','卦象可以提示你去看哪里；现实事实可以支持它、反驳它，也可以让问题继续保持未决。'))}</p>`;
}

function enhanceUncertainty(view){
  const interpretation=view?.hierarchy?.find(item=>item.id==='SYMBOLIC_INTERPRETATION')?.data?.depthInterpretation;
  const content=interpretation?.hexagram?.content||{};
  const target=q('[data-result-layer="WHAT_REMAINS_UNCERTAIN"] [data-result-content]');
  if(!target)return;
  target.innerHTML=`<div class="cx-reading-uncertainty"><p>${escape(t('This reading does not establish a guaranteed outcome, a date, another person’s hidden state, or a decision you must make.','这次阅读不会确认必然结果、具体日期、他人的隐藏内心状态，也不会替你决定必须怎么做。'))}</p>${content.timingOrCondition?contentSection(t('What “timing” means here','这里的“时间”指什么'),content.timingOrCondition):''}${content.distortionOrFailureRisk?contentSection(t('What remains outside the hexagram’s authority','哪些事情仍然不能由卦象决定'),content.distortionOrFailureRisk):''}</div>`;
}

function enhanceNext(view){
  const interpretation=view?.hierarchy?.find(item=>item.id==='SYMBOLIC_INTERPRETATION')?.data?.depthInterpretation;
  const target=q('[data-result-layer="POSSIBLE_NEXT_QUESTIONS_ACTIONS"] [data-result-content]');
  if(!target)return;
  const prompts=depthQuestions(interpretation).slice(0,6);
  target.innerHTML=prompts.length?`<div class="cx-reading-next"><p>${escape(t('You do not need to answer all of these. Choose the one that helps you return to observable reality.','不需要全部回答；选择一个最能帮助你回到可观察现实的问题即可。'))}</p>${list(prompts)}</div>`:`<p class="cx-reading-empty">${escape(t('No additional question is prescribed. Your decision remains yours.','没有被规定的下一步问题；决定权仍然属于你。'))}</p>`;
}

function simplifySources(){
  for(const card of qa('[data-source-list] .sp-source-card')){
    const title=card.querySelector('h4');
    if(title&&/^ICH-SRC-/i.test(text(title.textContent)))title.textContent=t('I Ching source witness','易经原典来源');
  }
}

function enhanceResults(view=latestView){
  if(!view)return;
  const resultRoot=q('[data-iching-results]');
  if(resultRoot)resultRoot.dataset.customerEnhanced='true';
  sanitizeCustomerCopy();
  enhanceMethodEvidence(view);
  enhanceInterpretation(view);
  enhanceReality(view);
  enhanceUncertainty(view);
  enhanceNext(view);
  simplifySources();
}

function collapsedSummary(){
  const node=document.createElement('div');
  node.className='cx-reading-complete-summary';
  node.dataset.readingCompleteSummary='';
  node.innerHTML=`<div><strong>${escape(t('The casting input is complete','起卦资料已完成'))}</strong><span>${escape(t('Your reading has been generated below.','这次阅读已经在下方生成。'))}</span></div><button type="button" class="cx-button cx-button--quiet" data-toggle-casting-details>${escape(t('Review casting details','查看起卦资料'))}</button>`;
  node.querySelector('[data-toggle-casting-details]')?.addEventListener('click',()=>toggleCastingDetails());
  return node;
}
function toggleCastingDetails(force){
  const fieldset=q('.cx-iching-fieldset');
  if(!fieldset)return;
  const collapsed=force===undefined?fieldset.dataset.readingComplete!=='true':Boolean(force);
  fieldset.dataset.readingComplete=String(collapsed);
  const button=fieldset.querySelector('[data-toggle-casting-details]');
  if(button)button.textContent=collapsed?t('Review casting details','查看起卦资料'):t('Collapse casting details','收起起卦资料');
}
function collapseCastingAndRevealResults(){
  const fieldset=q('.cx-iching-fieldset');
  const results=q('[data-iching-results]');
  if(fieldset){
    if(!fieldset.querySelector('[data-reading-complete-summary]'))fieldset.append(collapsedSummary());
    fieldset.dataset.readingComplete='true';
  }
  if(results&&!results.hidden){
    requestAnimationFrame(()=>{
      results.scrollIntoView({behavior:'smooth',block:'start'});
      const heading=results.querySelector('.cx-iching-result-intro .cx-title');
      if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
    });
  }
}

function observeResults(){
  const results=q('[data-iching-results]');
  if(!results||resultObserver)return;
  resultObserver=new MutationObserver(()=>{
    if(!results.hidden){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        enhanceResults();
        collapseCastingAndRevealResults();
      }));
    }
  });
  resultObserver.observe(results,{attributes:true,attributeFilter:['hidden']});
}

function installStatusObservers(){
  if(statusObserver)return;
  statusObserver=new MutationObserver(()=>{sanitizeProductionState();sanitizeStatusNodes();});
  statusObserver.observe(document.body,{subtree:true,childList:true,characterData:true});
}

function installBodyObserver(){
  if(bodyObserver)return;
  bodyObserver=new MutationObserver(()=>{
    prepareCustomerWorkspace();
    decorateCastingGuide();
    sanitizeCustomerCopy();
    observeResults();
  });
  bodyObserver.observe(document.body,{subtree:true,childList:true});
}

function urlOf(input){return typeof input==='string'?input:String(input?.url||'');}
function installExecuteCapture(){
  if(globalThis.__PHIOS_ICHING_CUSTOMER_FETCH_CAPTURED__)return;
  globalThis.__PHIOS_ICHING_CUSTOMER_FETCH_CAPTURED__=true;
  const originalFetch=globalThis.fetch.bind(globalThis);
  globalThis.fetch=async (input,init={})=>{
    const url=urlOf(input);
    let nextInit=init;
    if(url.includes('/api/iching-full-execute')&&typeof init?.body==='string'){
      const resultRoot=q('[data-iching-results]');
      if(resultRoot)delete resultRoot.dataset.customerEnhanced;
      try{
        const body=JSON.parse(init.body);
        body.locale=locale();
        latestExecuteBody=structuredClone(body);
        nextInit={...init,body:JSON.stringify(body)};
      }catch{}
    }
    const response=await originalFetch(input,nextInit);
    if(url.includes('/api/iching-full-execute')&&response.ok){
      response.clone().json().then(payload=>{
        if(payload?.publicView){
          latestView=payload.publicView;
          requestAnimationFrame(()=>requestAnimationFrame(()=>enhanceResults(latestView)));
        }
      }).catch(()=>{});
    }
    return response;
  };
}

function onLocaleChange(){
  prepareCustomerWorkspace();
  sanitizeCustomerCopy();
  decorateCastingGuide();
  syncManualOptions();
  if(latestView)enhanceResults(latestView);
}

function install(){
  if(installed||document.body.dataset.cxSurface!=='ICHING_FULL_PRODUCTION')return;
  installed=true;
  installStyles();
  installExecuteCapture();
  sanitizeCustomerCopy();
  decorateCastingGuide();
  observeResults();
  installStatusObservers();
  installBodyObserver();
  window.addEventListener('phios:localechange',onLocaleChange);
  document.body.dataset.ichingCustomerReading='ready';
}

install();
