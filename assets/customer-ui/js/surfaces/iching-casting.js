import {renderIChingView} from './iching-full.js';

const q=selector=>document.querySelector(selector);
const qa=selector=>[...document.querySelectorAll(selector)];
const normalize=value=>String(value??'').normalize('NFKC').trim();
const isZh=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh');
const t=(en,zh)=>isZh()?zh:en;
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

let mode='SYSTEM_RANDOM';
let currentCast=null;
let boundQuestion='';
let productionReady=false;
let installed=false;

function installStyles(){
  if(document.querySelector('link[data-iching-casting-style]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='/assets/customer-ui/surfaces/iching-casting.css';
  link.dataset.ichingCastingStyle='';
  document.head.append(link);
}

function lineName(value){
  return ({
    6:t('old yin · changing','老阴 · 变爻'),
    7:t('young yang · stable','少阳 · 静爻'),
    8:t('young yin · stable','少阴 · 静爻'),
    9:t('old yang · changing','老阳 · 变爻')
  })[Number(value)]||String(value);
}
function lineMark(value){
  return ({6:'⚋ ×',7:'⚊',8:'⚋',9:'⚊ ○'})[Number(value)]||'—';
}
function status(message=''){const node=q('[data-iching-casting-status]');if(node)node.textContent=message;}
function question(){return normalize(q('[data-iching-question]')?.value);}
function executeButton(){return q('[data-iching-execute]');}

function modeLabel(next){
  return ({
    SYSTEM_RANDOM:t('PHI OS casts for me','PHI OS 为我起卦'),
    MANUAL_LINES:t('I already have six lines','我已经起好卦'),
    COIN_CAST:t('Record my three-coin tosses','记录我的投币结果')
  })[next];
}

function setExecuteCopy(){
  const button=executeButton();
  if(!button)return;
  if(mode==='SYSTEM_RANDOM'){
    button.textContent=currentCast?t('Explore this cast','探索这次卦象'):t('Cast first','请先起卦');
    button.disabled=!productionReady||!currentCast;
  }else if(mode==='COIN_CAST'){
    button.textContent=t('Explore recorded coins','探索已记录的投币结果');
    button.disabled=!productionReady;
  }else{
    button.textContent=t('Explore perspective','探索视角');
    button.disabled=!productionReady;
  }
}

function renderCast(){
  const node=q('[data-iching-cast-result]');
  const repeat=q('[data-iching-recast]');
  if(!node)return;
  if(!currentCast){
    node.innerHTML=`<p class="cx-muted">${escape(t(
      'No cast has been created yet. The question is used only to bind this evidence; it does not steer the random selection.',
      '尚未形成卦象。问题只用于绑定这份证据，不会参与或引导随机取样。'
    ))}</p>`;
    if(repeat)repeat.hidden=true;
    return;
  }
  const lines=currentCast.selection?.selectedSymbols||[];
  const coins=currentCast.selection?.coinGroups||[];
  node.innerHTML=`
    <div class="cx-cast-evidence-head">
      <div>
        <span>${escape(t('Cast ID','起卦 ID'))}</span>
        <strong>${escape(currentCast.castId)}</strong>
      </div>
      <div>
        <span>${escape(t('Evidence digest','证据摘要'))}</span>
        <strong>${escape(String(currentCast.randomSelectionEvidence?.entropyEvidence?.digest||'').slice(0,16))}…</strong>
      </div>
    </div>
    <ol class="cx-cast-lines">
      ${lines.map((value,index)=>`<li>
        <span>${index+1}${index===0?` · ${escape(t('bottom','初爻'))}`:index===5?` · ${escape(t('top','上爻'))}`:''}</span>
        <strong class="cx-cast-line-mark">${escape(lineMark(value))}</strong>
        <b>${escape(value)} · ${escape(lineName(value))}</b>
        <small>${escape((coins[index]||[]).join(' + '))}</small>
      </li>`).join('')}
    </ol>
    <p class="cx-meta">${escape(t(
      'This is one frozen sampling event. PHI OS did not choose a favorable hexagram and will not reroll it during calculation.',
      '这是一次已经冻结的取样事件。PHI OS 不会挑选“更好”的卦，也不会在计算过程中重新起卦。'
    ))}</p>`;
  if(repeat)repeat.hidden=false;
}


function guideMarkup(){
  const lineRows=[
    [6,t('old yin','老阴'),'⚋ ×',t('changing yin → yang','变爻：阴 → 阳')],
    [7,t('young yang','少阳'),'⚊',t('stable yang','静爻：阳')],
    [8,t('young yin','少阴'),'⚋',t('stable yin','静爻：阴')],
    [9,t('old yang','老阳'),'⚊ ○',t('changing yang → yin','变爻：阳 → 阴')]
  ];
  return `
    <div class="cx-cast-guide__intro">
      <p>${escape(t(
        'You do not need to know the line numbers in advance. Every method ends with six values recorded from the bottom line to the top line.',
        '你不需要预先懂得 6、7、8、9。无论采用哪种方法，最后都把六个爻值按“初爻在下、上爻在上”记录。'
      ))}</p>
      <div class="cx-cast-guide__rule"><strong>${escape(t('Always record bottom → top','永远从下往上记录'))}</strong><span>${escape(t('1st result = bottom line · 6th result = top line','第 1 次 = 初爻 · 第 6 次 = 上爻'))}</span></div>
    </div>
    <section class="cx-cast-guide__section">
      <h4>${escape(t('What do 6, 7, 8 and 9 mean?','6、7、8、9 分别是什么？'))}</h4>
      <div class="cx-cast-guide__table" role="table" aria-label="${escape(t('I Ching line values','易经爻值'))}">
        ${lineRows.map(([value,name,mark,meaning])=>`<div class="cx-cast-guide__row" role="row"><b>${value}</b><span>${escape(name)}</span><strong>${escape(mark)}</strong><small>${escape(meaning)}</small></div>`).join('')}
      </div>
      <p class="cx-meta">${escape(t(
        'Even values are yin and odd values are yang. 6 and 9 are changing lines; 7 and 8 are stable lines.',
        '偶数为阴，奇数为阳；6 与 9 是变爻，7 与 8 是静爻。'
      ))}</p>
    </section>
    <section class="cx-cast-guide__section">
      <h4>${escape(t('Method A · Three coins, one line at a time','方法 A · 三枚硬币逐爻起卦'))}</h4>
      <p>${escape(t(
        'This is the simplest common self-casting method when you want changing lines. Before you start, choose one face of the coin as 3 / yang and the other face as 2 / yin. Different traditions may name the physical faces differently, so consistency within one cast matters more than the printed face.',
        '这是最容易自行操作、又能得到变爻的常见方法。开始前，先约定钱币的一面代表 3 / 阳，另一面代表 2 / 阴。不同流派对实体正反面的称呼可能不同，因此最重要的是：一次起卦中不要中途交换定义。'
      ))}</p>
      <ol>
        <li>${escape(t('Hold three coins together and toss them once.','同时投掷三枚硬币一次。'))}</li>
        <li>${escape(t('Add the three values. The total will be 6, 7, 8 or 9.','把三枚钱币的数值相加，结果一定是 6、7、8 或 9。'))}</li>
        <li>${escape(t('Write that as line 1 (the bottom line). Repeat until line 6 (the top line).','第一次记为初爻；重复六次，最后一次记为上爻。'))}</li>
      </ol>
      <div class="cx-cast-guide__mapping">
        <span>2 + 2 + 2 = <b>6 · ${escape(t('old yin','老阴'))}</b></span>
        <span>2 + 2 + 3 = <b>7 · ${escape(t('young yang','少阳'))}</b></span>
        <span>2 + 3 + 3 = <b>8 · ${escape(t('young yin','少阴'))}</b></span>
        <span>3 + 3 + 3 = <b>9 · ${escape(t('old yang','老阳'))}</b></span>
      </div>
      <p class="cx-meta">${escape(t('Three-coin probabilities: 6 = 1/8 · 7 = 3/8 · 8 = 3/8 · 9 = 1/8.','三钱法概率：6 = 1/8 · 7 = 3/8 · 8 = 3/8 · 9 = 1/8。'))}</p>
    </section>
    <section class="cx-cast-guide__section">
      <h4>${escape(t('Method B · Six coins in one toss (static hexagram)','方法 B · 六枚铜钱一次排卦（静卦）'))}</h4>
      <p>${escape(t(
        'Based on the six-coin method in the reference you provided: decide which face is yang and which is yin, toss six coins together, keep their left-to-right order, then record the first result as the bottom line and continue upward.',
        '根据你提供的六枚铜钱摇卦资料：先定钱币阴阳面，再把六枚铜钱一起摇落并保持由左到右的顺序；第一枚结果记作初爻，依次向上记录至上爻。'
      ))}</p>
      <div class="cx-cast-guide__mapping"><span>${escape(t('Yang face','阳面'))} → <b>7 · ${escape(t('young yang','少阳'))}</b></span><span>${escape(t('Yin face','阴面'))} → <b>8 · ${escape(t('young yin','少阴'))}</b></span></div>
      <p class="cx-meta">${escape(t(
        'By itself this six-coin arrangement produces a primary/static hexagram and no 6/9 changing lines. Use the three-coin or yarrow method when you want a standard moving-line mechanism.',
        '这种六枚钱币一次排卦法本身只形成一个本卦 / 静卦，不会自然产生 6、9 变爻。如需要标准的变爻机制，可使用三钱法或蓍草法。'
      ))}</p>
    </section>
    <section class="cx-cast-guide__section">
      <h4>${escape(t('Method C · Traditional yarrow stalks','方法 C · 传统蓍草法'))}</h4>
      <p>${escape(t('The traditional yarrow method uses 50 stalks, sets one aside, and works with 49. Each line is formed through three changes.','传统蓍草法用 50 根蓍草，先取 1 根不用，以 49 根操作；每一爻需要完成“三变”。'))}</p>
      <ol>
        <li>${escape(t('Divide the 49 working stalks into two heaps. Take one stalk aside from one heap.','把 49 根随意分成两堆，并从其中一堆取 1 根夹置一旁。'))}</li>
        <li>${escape(t('Count each heap in groups of four and set aside the remainders.','两堆分别以四根一组数过，将余数取出。'))}</li>
        <li>${escape(t('Repeat the operation three times for one line.','同一爻连续完成三次这样的操作。'))}</li>
        <li>${escape(t('The remaining working total is 24, 28, 32 or 36; divide by four to obtain 6, 7, 8 or 9.','最后工作蓍草会剩 24、28、32 或 36 根；除以 4，即得到 6、7、8 或 9。'))}</li>
        <li>${escape(t('Restore the 49 working stalks and repeat for the next line, from bottom to top, until six lines are complete.','重新合回 49 根，再做下一爻；由初爻到上爻共完成六爻。'))}</li>
      </ol>
      <p class="cx-meta">${escape(t('Yarrow probabilities differ from the three-coin method: 6 = 1/16 · 7 = 5/16 · 8 = 7/16 · 9 = 3/16.','蓍草法与三钱法的概率不同：6 = 1/16 · 7 = 5/16 · 8 = 7/16 · 9 = 3/16。'))}</p>
    </section>
    <section class="cx-cast-guide__section cx-cast-guide__boundary">
      <h4>${escape(t('If you already have a hexagram','如果你已经起好卦'))}</h4>
      <p>${escape(t('Choose “I already have six lines” and enter the six canonical values directly. Do not reverse the order: line 1 is always the bottom line.','选择“我已经起好卦”，直接输入六个标准爻值即可。不要把顺序倒转：第 1 爻永远是最下面的初爻。'))}</p>
      <p class="cx-meta">${escape(t('Different casting methods have different probability distributions. PHI OS records the method you chose; it does not claim that every method is mathematically equivalent.','不同起卦方法具有不同概率分布。PHI OS 会尊重你选择的方法，不会声称所有方法在数学上完全等价。'))}</p>
    </section>`;
}

function coinPanelMarkup(){
  return `<div class="cx-cast-coin-grid">
    ${Array.from({length:6},(_,line)=>`<fieldset>
      <legend>${line+1}${line===0?` · ${t('bottom','初爻')}`:line===5?` · ${t('top','上爻')}`:''}</legend>
      <div>
        ${Array.from({length:3},(_,coin)=>`<label><span>${t('Coin','钱币')} ${coin+1}</span><select data-iching-coin-line="${line+1}" data-iching-coin="${coin+1}"><option value="2">2 · ${t('yin','阴')}</option><option value="3">3 · ${t('yang','阳')}</option></select></label>`).join('')}
      </div>
    </fieldset>`).join('')}
  </div>`;
}

function installSurface(){
  if(installed||document.body.dataset.cxSurface!=='ICHING_FULL_PRODUCTION')return;
  const fieldset=q('.cx-iching-fieldset');
  const lineGrid=q('.cx-iching-lines');
  if(!fieldset||!lineGrid)return;
  installed=true;
  installStyles();
  document.body.dataset.ichingCastingSurface='ready';

  const legacyHint=[...fieldset.children].find(node=>node.tagName==='P'&&node.classList.contains('cx-muted'));
  const manual=document.createElement('div');
  manual.dataset.ichingModePanel='MANUAL_LINES';
  manual.className='cx-cast-mode-panel';
  if(legacyHint)manual.append(legacyHint);
  manual.append(lineGrid);

  const controls=document.createElement('div');
  controls.className='cx-casting-surface';
  controls.innerHTML=`
    <section class="cx-cast-mode-picker" aria-label="${escape(t('Casting input mode','起卦输入方式'))}">
      <p class="cx-eyebrow" data-cast-mode-eyebrow>${escape(t('HOW TO FORM THIS READING','如何取得这次卦象'))}</p>
      <div class="cx-cast-mode-buttons" role="group">
        ${['SYSTEM_RANDOM','MANUAL_LINES','COIN_CAST'].map(value=>`<button type="button" data-iching-cast-mode="${value}" aria-pressed="${value==='SYSTEM_RANDOM'}">${escape(modeLabel(value))}</button>`).join('')}
      </div>
    </section>
    <section class="cx-cast-mode-panel" data-iching-mode-panel="SYSTEM_RANDOM">
      <div class="cx-cast-intro">
        <div>
          <h3 data-cast-heading>${escape(t('Create one governed cast','形成一次受治理的起卦'))}</h3>
          <p data-cast-intro-copy>${escape(t(
            'PHI OS uses server cryptographic randomness to form six three-coin lines once, bottom to top. Your question does not influence which lines are selected.',
            'PHI OS 使用服务器加密级随机源，一次形成六组三钱取样，从初爻到上爻。你的问题不会影响系统选择哪些爻。'
          ))}</p>
        </div>
        <button class="cx-button cx-button--primary" type="button" data-iching-cast>${escape(t('Start this cast','开始这次起卦'))}</button>
      </div>
      <div class="cx-cast-result" data-iching-cast-result aria-live="polite"></div>
      <button class="cx-button cx-button--quiet" type="button" data-iching-recast hidden>${escape(t('Create another independent cast','重新建立一次独立起卦'))}</button>
    </section>
    <section class="cx-cast-mode-panel" data-iching-mode-panel="COIN_CAST" hidden>
      <p class="cx-muted" data-cast-coin-copy>${escape(t(
        'Record the three 2/3 coin values you obtained for each line. PHI OS records them bottom to top and does not toss again for you.',
        '逐爻记录你实际取得的三个 2/3 钱币值。PHI OS 只按初爻到上爻记录，不会替你重新投掷。'
      ))}</p>
      ${coinPanelMarkup()}
    </section>
    <details class="cx-cast-guide" data-self-casting-guide>
      <summary>${escape(t('How do I cast for myself?','我想自己起卦：完整方法说明'))}</summary>
      <div class="cx-cast-guide__body" data-self-casting-guide-body>${guideMarkup()}</div>
    </details>
    <p class="cx-meta cx-cast-boundary" data-cast-boundary-copy>${escape(t(
      'Casting creates symbolic sampling evidence, not Reality evidence, diagnosis, professional advice or a guaranteed future.',
      '起卦只形成象征取样证据，不会形成现实事实、诊断、专业建议或被保证的未来。'
    ))}</p>
    <p class="cx-meta" data-iching-casting-status role="status" aria-live="polite"></p>`;

  fieldset.append(controls);
  fieldset.append(manual);

  q('[data-iching-cast]')?.addEventListener('click',()=>createCast(false));
  q('[data-iching-recast]')?.addEventListener('click',()=>{
    if(globalThis.confirm(t(
      'Create a new independent cast? The previous cast will not be rewritten.',
      '要建立一次新的独立起卦吗？之前的卦不会被改写。'
    )))createCast(true);
  });
  qa('[data-iching-cast-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.ichingCastMode)));
  q('[data-iching-question]')?.addEventListener('input',()=>{
    if(currentCast&&question()!==boundQuestion){
      currentCast=null;
      boundQuestion='';
      renderCast();
      status(t('The question changed. Create a new cast before execution.','问题已经改变，请重新起卦后再执行。'));
      setExecuteCopy();
    }
  });

  executeButton()?.addEventListener('click',event=>{
    if(mode==='MANUAL_LINES')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(mode==='SYSTEM_RANDOM')executeSystemCast();
    else executeCoinCast();
  },true);

  renderCast();
  setMode('SYSTEM_RANDOM');
  refreshAuthority();
  setTimeout(refreshAuthority,250);
  setTimeout(refreshAuthority,900);
}

function setMode(next){
  if(!['SYSTEM_RANDOM','MANUAL_LINES','COIN_CAST'].includes(next))return;
  mode=next;
  qa('[data-iching-cast-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ichingCastMode===mode)));
  qa('[data-iching-mode-panel]').forEach(panel=>panel.hidden=panel.dataset.ichingModePanel!==mode);
  status('');
  setExecuteCopy();
}

async function refreshAuthority(){
  try{
    const response=await fetch('/api/iching-full-production-status',{cache:'no-store',headers:{accept:'application/json'}});
    const payload=await response.json();
    productionReady=response.ok&&payload?.production?.runAllowed===true&&payload?.production?.globalPublicExecution===true;
  }catch{productionReady=false;}
  setExecuteCopy();
}

async function createCast(isRepeat){
  if(!productionReady){status(t('Full Production authority is not active on this deployment.','当前部署尚未取得 Full Production 权限。'));return;}
  const currentQuestion=question();
  if(!currentQuestion){status(t('Add the situation you want to understand before casting.','请先填写你想理解的处境，再开始起卦。'));q('[data-iching-question]')?.focus();return;}
  const button=q('[data-iching-cast]');
  if(button)button.disabled=true;
  status(isRepeat?t('Creating a new independent cast…','正在形成一次新的独立起卦……'):t('Creating one governed cast…','正在形成一次受治理的起卦……'));
  try{
    const response=await fetch('/api/iching-full-cast',{
      method:'POST',
      headers:{'content-type':'application/json',accept:'application/json'},
      cache:'no-store',
      body:JSON.stringify({method:'I_CHING',intent:'CREATE_NEW_CAST',question:currentQuestion})
    });
    const payload=await response.json().catch(()=>null);
    if(!response.ok||!payload?.ok||!payload.cast)throw new Error(payload?.error?.code||'CAST_UNAVAILABLE');
    currentCast=payload.cast;
    boundQuestion=currentQuestion;
    renderCast();
    status(t('Cast evidence is frozen. You can now explore this perspective.','起卦证据已经冻结，现在可以探索这次视角。'));
  }catch(error){
    currentCast=null;
    boundQuestion='';
    renderCast();
    status(t(`Cast unavailable: ${error.message}`,`起卦暂时不可用：${error.message}`));
  }finally{
    if(button)button.disabled=false;
    setExecuteCopy();
  }
}

async function executeSystemCast(){
  if(!productionReady){status(t('Execution authority is unavailable.','执行权限目前不可用。'));return;}
  if(!currentCast){status(t('Create one cast before exploring the perspective.','请先完成一次起卦，再探索这个视角。'));return;}
  if(question()!==boundQuestion){status(t('The question changed. Create a new cast first.','问题已经改变，请先重新起卦。'));return;}
  await executeRequest({
    method:'I_CHING',
    question:boundQuestion,
    inputMode:'SYSTEM_RANDOM',
    randomSelectionEvidence:currentCast.randomSelectionEvidence,
    sessionId:currentCast.castId,
    timestamp:currentCast.createdAt,
    projectionVersion:'1.0.0',
    useCurrentRealityContext:q('[data-use-reality-context]')?.checked===true
  });
}

function coinLines(){
  return Array.from({length:6},(_,line)=>
    qa(`[data-iching-coin-line="${line+1}"]`)
      .sort((a,b)=>Number(a.dataset.ichingCoin)-Number(b.dataset.ichingCoin))
      .map(item=>Number(item.value))
  );
}
async function executeCoinCast(){
  if(!productionReady){status(t('Execution authority is unavailable.','执行权限目前不可用。'));return;}
  const currentQuestion=question();
  if(!currentQuestion){status(t('Add a question before continuing.','请先填写你想理解的问题。'));q('[data-iching-question]')?.focus();return;}
  await executeRequest({
    method:'I_CHING',
    question:currentQuestion,
    inputMode:'COIN_CAST',
    coinLines:coinLines(),
    sessionId:globalThis.crypto?.randomUUID?.()||`ICH-COIN-${Date.now()}`,
    timestamp:new Date().toISOString(),
    projectionVersion:'1.0.0',
    useCurrentRealityContext:q('[data-use-reality-context]')?.checked===true
  });
}

async function executeRequest(body){
  const button=executeButton();
  if(button)button.disabled=true;
  status(t('Preparing the governed perspective…','正在准备受治理的象征视角……'));
  try{
    const response=await fetch('/api/iching-full-execute',{
      method:'POST',
      headers:{'content-type':'application/json',accept:'application/json'},
      cache:'no-store',
      body:JSON.stringify(body)
    });
    const payload=await response.json().catch(()=>null);
    if(!response.ok||!payload?.ok)throw new Error(payload?.error?.code||'EXECUTION_UNAVAILABLE');
    renderIChingView(payload.publicView);
    status('');
  }catch(error){
    status(t(`Execution remains unavailable: ${error.message}`,`执行仍不可用：${error.message}`));
  }finally{
    setExecuteCopy();
  }
}

function rerenderLocale(){
  if(!installed)return;
  // Rebuild only labels owned by this extension; preserved cast evidence and
  // form values remain unchanged.
  qa('[data-iching-cast-mode]').forEach(button=>{button.textContent=modeLabel(button.dataset.ichingCastMode);});
  const eyebrow=q('[data-cast-mode-eyebrow]');
  if(eyebrow)eyebrow.textContent=t('HOW TO FORM THIS READING','如何取得这次卦象');
  const heading=q('[data-cast-heading]');
  if(heading)heading.textContent=t('Create one governed cast','形成一次受治理的起卦');
  const intro=q('[data-cast-intro-copy]');
  if(intro)intro.textContent=t(
    'PHI OS uses server cryptographic randomness to form six three-coin lines once, bottom to top. Your question does not influence which lines are selected.',
    'PHI OS 使用服务器加密级随机源，一次形成六组三钱取样，从初爻到上爻。你的问题不会影响系统选择哪些爻。'
  );
  const coinCopy=q('[data-cast-coin-copy]');
  if(coinCopy)coinCopy.textContent=t(
    'Record the three 2/3 coin values you obtained for each line. PHI OS records them bottom to top and does not toss again for you.',
    '逐爻记录你实际取得的三个 2/3 钱币值。PHI OS 只按初爻到上爻记录，不会替你重新投掷。'
  );
  const guideBody=q('[data-self-casting-guide-body]');
  if(guideBody)guideBody.innerHTML=guideMarkup();
  const guideSummary=q('[data-self-casting-guide] summary');
  if(guideSummary)guideSummary.textContent=t('How do I cast for myself?','我想自己起卦：完整方法说明');
  const boundary=q('[data-cast-boundary-copy]');
  if(boundary)boundary.textContent=t(
    'Casting creates symbolic sampling evidence, not Reality evidence, diagnosis, professional advice or a guaranteed future.',
    '起卦只形成象征取样证据，不会形成现实事实、诊断、专业建议或被保证的未来。'
  );
  qa('.cx-cast-coin-grid fieldset').forEach((fieldset,index)=>{
    const legend=fieldset.querySelector('legend');
    if(legend)legend.textContent=`${index+1}${index===0?` · ${t('bottom','初爻')}`:index===5?` · ${t('top','上爻')}`:''}`;
    [...fieldset.querySelectorAll('label span')].forEach((span,coin)=>{span.textContent=`${t('Coin','钱币')} ${coin+1}`;});
  });
  const castButton=q('[data-iching-cast]');
  if(castButton)castButton.textContent=t('Start this cast','开始这次起卦');
  const recast=q('[data-iching-recast]');
  if(recast)recast.textContent=t('Create another independent cast','重新建立一次独立起卦');
  renderCast();
  setExecuteCopy();
}

window.addEventListener('phios:localechange',rerenderLocale);
installSurface();
