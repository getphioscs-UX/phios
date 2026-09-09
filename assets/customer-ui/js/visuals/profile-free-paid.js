import { renderProfileVisualMvp } from './profile-visual-mvp.js';
import { renderReadingDepthMap, renderLockedInsightPreview, renderWhatPaidAdds } from './pvp-components.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zh=l=>l==='zh-Hans';
export function renderProfileFreePaid(depth,{locale='en'}={}){
  if(!depth)return '';
  const current=depth.level||'FREE_SNAPSHOT';
  const levels=[
    {id:'FREE_SNAPSHOT',label:zh(locale)?'免费概览':'Free Snapshot',locked:false},
    {id:'DEEP_PROFILE',label:zh(locale)?'深度 Profile':'Deep Profile',locked:current==='FREE_SNAPSHOT'},
    {id:'REALITY_PROFILE',label:zh(locale)?'现实 Profile':'Reality Profile',locked:current!=='REALITY_PROFILE'}
  ];
  const intro=`<section class="prf-depth-intro"><p class="cx-eyebrow">PROFILE DEPTH</p><h2>${zh(locale)?'先看见价值，再决定是否深入':'See the value first, then decide whether to go deeper'}</h2><p>${zh(locale)?'免费层保留可理解的 Profile 概览；更深层会加入跨来源、情境与现实连接，但不会制造新的 Profile 真相。':'The free layer keeps a readable Profile snapshot. Deeper layers add cross-source, context and Reality integration without inventing new Profile truth.'}</p></section>`;
  const free=renderProfileVisualMvp(depth.freeSnapshot,{locale});
  const paid=depth.locked.map(x=>renderLockedInsightPreview({title:x.level==='DEEP_PROFILE'?(zh(locale)?'深度 Profile':'Deep Profile'):(zh(locale)?'现实 Profile':'Reality Profile'),preview:x.level==='DEEP_PROFILE'?(zh(locale)?'加入模式雷达、情境变化、工作、关系与决策证据，让多个 Profile 来源成为一张可阅读的深层地图。':x.preview):(zh(locale)?'把 Profile 证据与 Current Reality 放在同一张地图中，观察哪些地方趋同、分歧或只在特定情境成立。':x.preview),cta:null})).join('');
  const adds=renderWhatPaidAdds({title:zh(locale)?'更深层会增加什么':'What deeper Profile adds',items:zh(locale)?['更多跨来源结构，而不是更多重复文字','明确区分情境变化、工作、关系与决策证据','把 Profile 与 Current Reality 连接，但不互相验证','没有证据的地方继续保持未知']:['More cross-source structure, not more repeated text','Explicit context, work, relationship and decision evidence','A Profile × Current Reality bridge without mutual validation','Unknown stays unknown when evidence is missing']});
  const commerce=!depth.commerce?.offerResolved?`<p class="prf-depth-commerce-note">${zh(locale)?'深度 Profile 的付费入口尚未由 Commerce authority 正式启用，因此这里不会显示虚构价格或结账按钮。':'Paid Profile commerce is not yet admitted by the commerce authority, so no invented price or checkout button is shown here.'}</p>`:'';
  return `<div class="prf-free-paid" data-pvp-profile-depth="W9">${intro}${renderReadingDepthMap({levels,currentLevel:current})}<div class="prf-free-paid__free">${free}</div>${paid?`<div class="prf-free-paid__locked">${paid}</div>${adds}${commerce}`:''}</div>`;
}
export function mountProfileFreePaid(root,depth,options={}){if(!root)return false;root.innerHTML=renderProfileFreePaid(depth,options);root.hidden=!root.innerHTML;return !root.hidden;}
