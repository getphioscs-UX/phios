const REGISTRY_URL='/content/personal-runtime/product-activation/registries/personal-runtime-capability-matrix-v1.json';
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const zh=()=>document.documentElement.lang==='zh-Hans';
const text=(en,cn)=>zh()?cn:en;
let registry=null;

async function loadRegistry(){const r=await fetch(REGISTRY_URL,{headers:{Accept:'application/json'},cache:'no-store'});if(!r.ok)throw new Error('PRX_STAGE13_REGISTRY_UNAVAILABLE');return r.json();}
function capability(code){return registry?.capabilities?.find(x=>x.code===code)||null;}
function label(item){return item?.publicLabel?.[zh()?'zh-Hans':'en']||item?.publicLabel?.en||item?.code||'';}

function installProductFlow(){
  const old=$('.pr-flow-section'); if(!old||$('[data-prx-stage13-flow]'))return;
  old.classList.add('prx-stage13-old-flow-hidden');
  const section=document.createElement('section'); section.className='public-section pr-flow-section'; section.dataset.prxStage13Flow='';
  section.innerHTML=`<div class="public-container"><ol class="prx-stage13-flow" aria-label="Personal Runtime product flow">
    <li data-prx-step="input" data-state="active"><small>01</small><strong>${text('Input','输入')}</strong></li>
    <li data-prx-step="processing" data-state="pending"><small>02</small><strong>${text('Processing','处理')}</strong></li>
    <li data-prx-step="results" data-state="pending"><small>03</small><strong>${text('Results','结果')}</strong></li>
    <li data-prx-step="perspective" data-state="pending"><small>04</small><strong>${text('Perspective','视角')}</strong></li>
    <li data-prx-step="reality" data-state="pending"><small>05</small><strong>${text('Reality','现实')}</strong></li>
  </ol><p class="prx-stage13-internal-gate">${text('Eligibility remains an internal governed gate; it is not a product stage.','Eligibility 仍然是内部受治理 gate，不再作为客户产品阶段。')}</p></div>`;
  old.after(section);
}
function setProductStep(active){const order=['input','processing','results','perspective','reality'];const idx=order.indexOf(active);$$('[data-prx-step]').forEach(el=>{const i=order.indexOf(el.dataset.prxStep);el.dataset.state=i<idx?'complete':i===idx?'active':'pending';});}

function installMethodGroups(){
  const fieldset=$('.pr-method-select'); const selection=$('[data-mcd7-method-selection]'); if(!fieldset||!selection||$('[data-prx-stage13-method-groups]'))return;
  const groups=document.createElement('div'); groups.className='prx-stage13-method-groups'; groups.dataset.prxStage13MethodGroups='';
  const internal=capability('HDR_INTERNAL'), iching=capability('I_CHING'), tarot=capability('TAROT');
  groups.innerHTML=`<section class="prx-stage13-group"><h3>${text('Structural Methods','结构性方法')}</h3><p>${text('Astrology, BaZi, Numerology and Zi Wei use the existing governed calculation/projection runtimes. The internal operating lens remains restricted.','占星、八字、数字与紫微继续使用现有受治理 calculation / projection runtime；内部运行视角保持受限。')}</p><div class="prx-stage13-availability"><article class="prx-stage13-card"><strong>${label(internal)}</strong><small>${text('Internal / restricted. Visibility does not create public execution availability.','内部 / 受限。可见不代表获得 public execution 权限。')}</small><span class="prx-stage13-badge">INTERNAL · RESTRICTED</span></article></div></section>
  <section class="prx-stage13-group"><h3>${text('Symbolic Reflection','象征性反思')}</h3><p>${text('These are a separate reflection layer. Stage 13 does not activate them as structural calculations or production methods.','这是独立的反思层。Stage 13 不会把它们激活成结构计算或 production method。')}</p><div class="prx-stage13-availability">
    <article class="prx-stage13-card"><strong>${label(iching)}</strong><small>${text('Validation exists; limited product activation remains a later governed stage.','已有验证基础；limited product activation 留在后续受治理阶段。')}</small><span class="prx-stage13-badge">ACTIVATION PENDING</span></article>
    <article class="prx-stage13-card"><strong>${label(tarot)}</strong><small>${text('Validation exists; limited product activation remains a later governed stage.','已有验证基础；limited product activation 留在后续受治理阶段。')}</small><span class="prx-stage13-badge">ACTIVATION PENDING</span></article>
  </div></section>`;
  fieldset.after(groups);
}
function selectedProjectionLabels(){return $$('[data-mcd7-method-checkbox]:checked').map(input=>input.closest('label')?.querySelector('strong')?.textContent?.trim()).filter(Boolean);}
function installPostResults(){
  const results=$('[data-mcd7-results]'); if(!results||$('[data-prx-stage13-post-results]'))return;
  const wrap=document.createElement('section');wrap.className='public-section';wrap.dataset.prxStage13PostResults='';wrap.hidden=true;
  wrap.innerHTML=`<div class="public-container prx-stage13-post-results">
    <section class="prx-stage13-panel" data-prx-perspective><p class="public-eyebrow">${text('Perspective','视角')}</p><h3>${text('Keep the accepted projections separate before interpreting them.','先保持每个已接受投射的独立性，再进入视角层。')}</h3><p>${text('Personal Runtime does not vote across methods or merge them into one synthetic truth. This layer only carries forward accepted projection references and visible unknowns.','Personal Runtime 不会让不同方法投票，也不会把它们合成一个“统一真相”。这里只继续承接已接受 projection reference 与可见 unknown。')}</p><div data-prx-perspective-list></div></section>
    <section class="prx-stage13-panel" data-prx-reality><p class="public-eyebrow">${text('Reality','现实')}</p><h3>${text('Bring a perspective back to lived reality.','把视角带回真实生活。')}</h3><p>${text('Continue only when you choose. Stage 13 does not create a Reality case, activate a Journey or save a hidden personal history.','只有在你主动选择时才继续。Stage 13 不会自动创建 Reality case、启动 Journey 或保存隐藏个人历史。')}</p><a class="public-button prx-stage13-reality-link" href="/my-reality?from=personal-runtime">${text('Continue in My Reality','继续到「我的现实」')}</a><p class="prx-stage13-no-auto">${text('User-initiated handoff only · governed Reality orchestration is a later stage.','仅用户主动 handoff · governed Reality orchestration 留在后续阶段。')}</p></section>
  </div>`;
  results.after(wrap);
}
function renderPerspective(){const wrap=$('[data-prx-stage13-post-results]');if(!wrap)return;const results=$('[data-mcd7-results]');const visible=results&&!results.hidden;if(!visible){wrap.hidden=true;return;}wrap.hidden=false;const labels=selectedProjectionLabels();const target=$('[data-prx-perspective-list]');if(target)target.innerHTML=labels.length?`<ul class="prx-stage13-projection-list">${labels.map(x=>`<li>${x}</li>`).join('')}</ul>`:`<p>${text('No accepted structural projection is currently selected.','当前没有已选择的结构性投射。')}</p>`;setProductStep('perspective');}
function reconcileCopy(){const title=$('.pr-hero .public-display');const lead=$('.pr-hero .public-lead');if(title)title.textContent=text('One Personal Runtime. Multiple governed perspectives.','一个 Personal Runtime，多种受治理视角。');if(lead)lead.textContent=text('Enter what you know once. Structural methods stay separate, symbolic reflection stays distinct, and every result returns through Perspective to Reality.','只输入一次你已知的信息。结构方法彼此独立，象征性反思保持分层，每个结果最终经 Perspective 回到 Reality。');const reading=$('[data-mcd7-tabs] [data-tab="reading"]');if(reading)reading.textContent=text('Perspective','视角');}
function observeRuntime(){const processing=$('[data-mcd7-processing]');const results=$('[data-mcd7-results]');const update=()=>{if(processing&&!processing.hidden)setProductStep('processing');else if(results&&!results.hidden){setProductStep('results');queueMicrotask(renderPerspective);}else setProductStep('input');};if(processing)new MutationObserver(update).observe(processing,{attributes:true,attributeFilter:['hidden']});if(results)new MutationObserver(update).observe(results,{attributes:true,attributeFilter:['hidden']});update();}
function bindRealityStage(){document.addEventListener('click',event=>{if(event.target.closest('.prx-stage13-reality-link'))setProductStep('reality');});}
async function boot(){try{registry=await loadRegistry();installProductFlow();installMethodGroups();installPostResults();reconcileCopy();observeRuntime();bindRealityStage();document.documentElement.dataset.prxStage13='active';}catch(error){console.warn('[PRX Stage13]',error?.message||error);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
