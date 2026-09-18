import { loadSevenVolumeBooks } from '../web-production/public-surface-data-seven.js';
const cls=['puxr-book--gold','puxr-book--purple','puxr-book--green','puxr-book--blue','puxr-book--gold2','puxr-book--purple','puxr-book--blue'];
const locale=()=>localStorage.getItem('phiOSLocale')||'zh-Hans';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function render(root){const d=await loadSevenVolumeBooks();const l=locale();root.innerHTML=d.books.map((b,i)=>`<article class="puxr-card puxr-book ${cls[i]||''}"><div><div class="puxr-card__kicker">Book ${['I','II','III','IV','V','VI','VII','VIII'][i]}</div><h3>${esc(b.title?.en||'')}</h3><p>${esc(b.title?.['zh-Hans']||'')}</p></div><p class="puxr-micro">${esc(b.subtitle?.[l]||b.subtitle?.en||'')}</p><div class="puxr-actions"><a class="puxr-btn" href="/books/">${l==='zh-Hans'?'查看本册':'Explore volume'}</a></div></article>`).join('')}
const roots=[...document.querySelectorAll('[data-px2-five-volumes],[data-px2-eight-volumes]')];
const refresh=()=>roots.forEach(root=>render(root).catch(()=>{root.innerHTML='<div class="puxr-empty">Book information is temporarily unavailable. / 书目信息暂时无法显示。</div>'}));
refresh();window.addEventListener('puxr:localechange',refresh);
