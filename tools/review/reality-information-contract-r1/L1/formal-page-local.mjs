// Local preview adapter only. Never imported by a production entrypoint.
// The harness serves the existing /reality/ bytes and adds this module explicitly.
import {mountRicWorldSession} from '/assets/customer-ui/js/surfaces/ric-world-session-panel.js';
if (location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') throw Error('LOCAL_PREVIEW_ONLY');
const main = document.querySelector('main');
const host = document.createElement('section');
host.className = 'cx-container ric-formal-local';
host.dataset.ricFormalLocal = '';
main.prepend(host);
const style = document.createElement('style');
style.textContent = `.ric-formal-local{max-width:1100px;padding:24px;margin:24px auto;overflow-wrap:anywhere}.ric-formal-local section,.ric-formal-local form,.ric-formal-local article{padding:18px;border:1px solid #b9c8c5;border-radius:8px;margin:16px 0}.ric-formal-local label{display:block;margin:10px 0}.ric-formal-local textarea,.ric-formal-local input[type=text]{width:100%;min-width:0;font:inherit;padding:10px;box-sizing:border-box}.ric-formal-local textarea{min-height:100px}.ric-formal-local button,.ric-formal-local select{font:inherit;padding:10px;min-height:44px;margin:8px 8px 8px 0}.ric-formal-local .directions{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ric-formal-local fieldset{min-width:0}.ric-formal-local summary{cursor:pointer;min-height:44px}@media(max-width:600px){.ric-formal-local{padding:16px}.ric-formal-local .directions{grid-template-columns:1fr}}`;
document.head.append(style);
mountRicWorldSession(host);
for (const button of host.querySelectorAll('button')) button.classList.add('cx-button','cx-button--secondary');
// Reuse the existing page's Start controls; do not open a second intake dialog.
document.addEventListener('click',event=>{
  if (!event.target.closest('[data-cx-start-reality],[data-reality-structure-start]')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  host.scrollIntoView({block:'start'});
  host.querySelector('#reality-question').focus({preventScroll:true});
},true);
const zh = new URL(location.href).searchParams.get('locale') !== 'en';
const notice = document.createElement('p');
notice.setAttribute('role','note');
notice.textContent = zh ? '本地会话候选：不会保存到账户；下方既有账户工作区与本次会话分开。' : 'Local session candidate: nothing is saved to your account. The existing account workspace below remains separate.';
host.prepend(notice);
