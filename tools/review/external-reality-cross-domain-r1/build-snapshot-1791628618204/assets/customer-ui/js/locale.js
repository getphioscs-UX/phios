const KEY='phios-cx-locale';

function readStorage(key){
  try{return localStorage.getItem(key)}catch{return null}
}

function writeStorage(key,value){
  try{localStorage.setItem(key,value)}catch{/* Locale still applies for this page. */}
}

const CROSS_DIMENSION_ZH=Object.freeze({
  'Operating posture':'运行姿态',
  Decision:'决策',
  Perception:'感知',
  Expression:'表达',
  Energy:'能量',
  Rhythm:'节律',
  Pressure:'压力',
  Relationship:'关系',
  Resources:'资源',
  Work:'工作',
  Environment:'环境',
  Change:'变化',
  Recovery:'恢复',
  Timing:'时间',
  Identity:'身份',
  Direction:'方向'
});
const CROSS_HEADLINE_PREFIX=Object.freeze({
  COMMON:'Shared emphasis:',
  COMPLEMENTARY:'Complementary perspectives:',
  TENSION:'Tension remains visible:',
  CONTEXT_DEPENDENT:'Context matters:',
  OPEN:'Open perspective:'
});

function crossDimensionLabel(headline,supportType){
  const text=String(headline||'').trim();
  const prefix=CROSS_HEADLINE_PREFIX[supportType];
  if(prefix&&text.startsWith(prefix))return text.slice(prefix.length).trim();
  return '';
}

function crossChineseCopy(supportType,labelEn,methodRefs=''){
  const label=CROSS_DIMENSION_ZH[labelEn]||labelEn||'这一主题';
  const methods=String(methodRefs||'').trim();
  if(supportType==='COMMON')return Object.freeze({
    headline:`共同强调：${label}`,
    narrative:`${methods||'这些读取'}在「${label}」上分别给出相似强调。这里保留的是相遇点，不把相似当成事实证明，也不会因为多个方法相似就提高“正确性”。`
  });
  if(supportType==='COMPLEMENTARY')return Object.freeze({
    headline:`互补视角：${label}`,
    narrative:`${methods||'这些读取'}从不同角度触及「${label}」。这些观点会并列保留，作为互补阅读，不会被强行揉成一个答案。`
  });
  if(supportType==='TENSION')return Object.freeze({
    headline:`保留张力：${label}`,
    narrative:`在「${label}」上，不同读取之间存在明确张力、取舍或反例。两边都会保留，不会选出某一种方法作为“赢家”。`
  });
  if(supportType==='CONTEXT_DEPENDENT')return Object.freeze({
    headline:`需要结合情境：${label}`,
    narrative:`「${label}」需要结合明确条件或时间情境来理解。跨视角读取会保留这些条件，不会把有条件的观察变成固定结论。`
  });
  if(supportType==='OPEN')return Object.freeze({
    headline:`开放观察：${label}`,
    narrative:`「${label}」仍有明确未决之处。跨视角读取会保留这个开放状态，不会用其他方法的内容把空缺自动补上。`
  });
  return null;
}

function applyLocalizedNodeText(node,locale){
  if(!node?.dataset?.cxEn||!node?.dataset?.cxZh)return;
  const next=locale==='zh-Hans'?node.dataset.cxZh:node.dataset.cxEn;
  if(node.textContent!==next)node.textContent=next;
}

export function localizeCrossPerspectiveClaims(scope=document,locale=document.documentElement.lang){
  const next=locale==='zh-Hans'?'zh-Hans':'en';
  scope.querySelectorAll?.('.cx-cross-reading__claims article[data-support]').forEach(article=>{
    const heading=article.querySelector('h3'),narrative=article.querySelector('p'),methodRefs=article.querySelector('small')?.textContent||'';
    if(!heading||!narrative)return;
    const supportType=String(article.dataset.support||'');
    const englishHeadline=heading.dataset.cxEn||heading.textContent||'';
    const englishNarrative=narrative.dataset.cxEn||narrative.textContent||'';
    const labelEn=crossDimensionLabel(englishHeadline,supportType);
    if(!labelEn)return;
    const zh=crossChineseCopy(supportType,labelEn,methodRefs);
    if(!zh)return;
    heading.dataset.cxEn=englishHeadline;
    heading.dataset.cxZh=zh.headline;
    narrative.dataset.cxEn=englishNarrative;
    narrative.dataset.cxZh=zh.narrative;
    applyLocalizedNodeText(heading,next);
    applyLocalizedNodeText(narrative,next);
  });
}

let dynamicLocaleObserver=null;
function installDynamicLocaleProjection(scope=document){
  if(dynamicLocaleObserver||typeof MutationObserver==='undefined')return dynamicLocaleObserver;
  const root=scope.documentElement||scope;
  if(!root)return null;
  dynamicLocaleObserver=new MutationObserver(mutations=>{
    const relevant=mutations.some(mutation=>[...mutation.addedNodes].some(node=>node?.nodeType===1&&(node.matches?.('.cx-cross-reading,.cx-cross-reading__claims article')||node.querySelector?.('.cx-cross-reading__claims article'))));
    if(relevant)localizeCrossPerspectiveClaims(scope,document.documentElement.lang);
  });
  dynamicLocaleObserver.observe(root,{subtree:true,childList:true});
  return dynamicLocaleObserver;
}

export function preferredCustomerLocale(){
  const explicit=new URLSearchParams(location.search).get('locale');
  if(explicit==='en'||explicit==='zh-Hans')return explicit;
  const stored=readStorage('phiOSLocale')||readStorage(KEY);
  if(stored==='en'||stored==='zh-Hans')return stored;
  return navigator.language?.toLowerCase().startsWith('zh')?'zh-Hans':'en';
}

export function applyCustomerLocale(locale,scope=document){
  const next=locale==='zh-Hans'?'zh-Hans':'en';
  document.documentElement.lang=next;
  document.documentElement.dataset.cxLocale=next;
  writeStorage(KEY,next);
  writeStorage('phiOSLocale',next);
  localizeCrossPerspectiveClaims(scope,next);
  scope.querySelectorAll('[data-cx-en][data-cx-zh]').forEach(node=>applyLocalizedNodeText(node,next));
  scope.querySelectorAll('[data-cx-en-placeholder][data-cx-zh-placeholder]').forEach(node=>{node.setAttribute('placeholder',next==='zh-Hans'?node.dataset.cxZhPlaceholder:node.dataset.cxEnPlaceholder)});
  scope.querySelectorAll('[data-cx-en-aria-label][data-cx-zh-aria-label]').forEach(node=>{node.setAttribute('aria-label',next==='zh-Hans'?node.dataset.cxZhAriaLabel:node.dataset.cxEnAriaLabel)});
  scope.querySelectorAll('[data-cx-locale]').forEach(button=>{const active=button.dataset.cxLocale===next;button.setAttribute('aria-pressed',String(active))});
  window.dispatchEvent(new CustomEvent('phios:localechange',{detail:{locale:next}}));
  return next;
}

export function installLocaleControls(scope=document){
  scope.querySelectorAll('[data-cx-locale]').forEach(button=>button.addEventListener('click',()=>applyCustomerLocale(button.dataset.cxLocale,document)));
  installDynamicLocaleProjection(scope);
  return applyCustomerLocale(preferredCustomerLocale(),document);
}

// HD intake successor copy stays in the existing customer localization owner.
export const HD_INTAKE_COPY=Object.freeze({
  en:{review:'Review your Human Design details',intro:'PHI OS uses your uploaded Human Design chart and birth details to prefill the structure below. Only items marked “Needs confirmation” require your attention.',CONFIRMED:'Confirmed',CONFLICT:'Needs confirmation',UNKNOWN:'Unable to confirm',CALCULATED:'Calculated · needs confirmation',EXTRACTED:'Chart reading · needs confirmation',DERIVED:'Automatic',edit:'Edit',view:'View',variable:'Variable · four arrows',help:'How to read it',guide:'Find the four arrows around the BodyGraph head. Match each arrow’s actual direction. PHI OS converts your choices automatically; no technical codes are needed.',positions:['Top left','Bottom left','Top right','Bottom right'],left:'Left',right:'Right',check:'Do these four arrows match your chart?',yes:'Correct',change:'Change arrows',gates:'Activated gates'},
  'zh-Hans':{review:'请核对以下资料',intro:'系统会结合你上传的 Human Design 图表与出生资料预填。只有标记为「需要确认」的项目需要你检查或补充。',CONFIRMED:'已确认',CONFLICT:'需要确认',UNKNOWN:'未能确认',CALCULATED:'内部计算 · 需要确认',EXTRACTED:'图表读取 · 需要确认',DERIVED:'自动',edit:'修改',view:'查看',variable:'Variable｜四箭头',help:'怎么看？',guide:'找到 BodyGraph 头部周围的四个箭头，按照每个箭头实际朝向选择。PHI OS 会自动转换，你不需要理解专业代码。',positions:['左上箭头','左下箭头','右上箭头','右下箭头'],left:'向左',right:'向右',check:'这四个箭头方向与你的图表一致吗？',yes:'正确',change:'修改箭头',gates:'激活闸门'}
});
