import { getLocale, onLocaleChange } from '../i18n.js';

const zh = () => getLocale() === 'zh-Hans';
const text = (en, cn) => zh() ? cn : en;

const STATE_COPY = Object.freeze({
  ANSWERED: ['Answered from available sources', '已根据现有来源回答'],
  PARTIALLY_ANSWERED: ['A partial answer is available', '现有资料只能回答一部分'],
  UNKNOWN: ['There is not enough support yet', '目前依据不足'],
  OUTSIDE_SCOPE: ['This question needs a different source', '这个问题需要其他来源'],
  NEEDS_CONTEXT: ['A little more context would help', '还需要一点背景'],
  NEEDS_CURRENT_AUTHORITY: ['Current reliable sources are needed', '需要当前可靠来源'],
  PROFESSIONAL_HANDOFF: ['Professional review may be appropriate', '这个问题可能需要专业人员审阅']
});

function translateInlineCopy(){
  document.querySelectorAll('[data-cps-en][data-cps-zh]').forEach(node => {
    node.textContent = text(node.dataset.cpsEn, node.dataset.cpsZh);
  });
}

function simplifyLibraryFilters(){
  const controls=document.querySelector('.knowledge-controls');
  if(!controls || controls.dataset.cpsReady) return;
  const fields=[...controls.querySelectorAll('.knowledge-field')];
  if(fields.length<2) return;
  controls.dataset.cpsReady='true';
  const advanced=document.createElement('div');
  advanced.className='cps-advanced-filters';
  fields.slice(1).forEach(field=>advanced.append(field));
  const button=document.createElement('button');
  button.type='button'; button.className='cps-filter-toggle'; button.setAttribute('aria-expanded','false');
  const update=()=>button.textContent=text('More filters','更多筛选'); update();
  button.addEventListener('click',()=>{const open=advanced.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));button.textContent=open?text('Hide filters','收起筛选'):text('More filters','更多筛选');});
  controls.append(button,advanced);
  onLocaleChange(update);
}

function mapClientStates(){
  const stateNode=document.querySelector('[data-cka-answer-state]');
  const status=document.querySelector('[data-cka-status]');
  if(!stateNode) return;
  const observer=new MutationObserver(()=>{
    const raw=String(stateNode.textContent||'').trim().toUpperCase();
    const copy=STATE_COPY[raw];
    if(copy && status && status.dataset.state==='complete') status.textContent=zh()?copy[1]:copy[0];
  });
  observer.observe(stateNode,{childList:true,subtree:true,characterData:true});
}

function canonicalRealityLinks(){
  document.querySelectorAll('a[href="/reality-journey"]').forEach(a=>{ if(a.closest('[data-public-header-placeholder], [data-public-footer-placeholder], .public-header, .public-footer')) a.href='/reality/'; });
}

function reduceInitialWork(){
  document.querySelectorAll('img[loading="lazy"]').forEach(img=>{img.decoding='async';});
}

translateInlineCopy();
simplifyLibraryFilters();
mapClientStates();
canonicalRealityLinks();
reduceInitialWork();
onLocaleChange(translateInlineCopy);
