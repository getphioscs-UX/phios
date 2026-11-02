// Ephemeral discovery input only. No report authority, persistence or execution.
export function openEntryTarget(href, question) {
 const target = new URL(href, location.origin);
 if (target.origin !== location.origin || typeof question !== 'string' || question.length > 2000) return false;
 target.searchParams.set('entryHandoff', '1');
 target.searchParams.set('locale', document.documentElement.lang === 'zh-Hans' ? 'zh-Hans' : 'en');
 const child = window.open(target.href, '_blank');
 if (!child) return false;
 const stop = () => { window.removeEventListener('message', receive); clearTimeout(timer); };
 const receive = event => {
  if (event.origin !== location.origin || event.source !== child || event.data?.type !== 'PHIOS_ENTRY_READY') return;
  child.postMessage({type:'PHIOS_ENTRY_INPUT', question, execution:'INPUT_ONLY'}, location.origin); stop();
 };
 window.addEventListener('message', receive);
 const timer = setTimeout(stop, 15000);
 return true;
}
export function installEntryInputReceiver() {
 if (!window.opener || new URL(location.href).searchParams.get('entryHandoff') !== '1') return;
 if (window.__phiosEntryReceiverInstalled) return;
 window.__phiosEntryReceiverInstalled = true;
 const receive = event => {
  if (event.origin !== location.origin || event.source !== window.opener || event.data?.type !== 'PHIOS_ENTRY_INPUT') return;
  const question = event.data.question;
  if (typeof question !== 'string' || !question.trim() || question.length > 2000 || event.data.execution !== 'INPUT_ONLY') return;
  window.removeEventListener('message', receive);
  const nativeQuestion = document.querySelector('main textarea[name="question"], main input[name="question"]');
  if (nativeQuestion && !nativeQuestion.disabled && !nativeQuestion.readOnly && !nativeQuestion.value.trim()) {
   nativeQuestion.value = question; // Input only: no event, submit, consent or authority changes.
  }
  const panel = document.createElement('aside'); panel.dataset.entryReceived = '';
  panel.style.cssText = 'box-sizing:border-box;width:100%;max-width:760px;margin:24px auto;padding:20px;background:#102b2d;color:#f5f1e8;border-radius:16px;overflow-wrap:anywhere';
  panel.setAttribute('aria-label', document.documentElement.lang === 'zh-Hans' ? '从入口带来的问题' : 'Question from the entrance');
  const label = document.createElement('p'); label.textContent = document.documentElement.lang === 'zh-Hans' ? '带入的问题：请在本功能确认资料与同意后继续。尚未生成或保存。' : 'Your question: confirm this function’s inputs and consent before continuing. Nothing has been generated or saved.';
  const input = document.createElement('textarea'); input.value = question; input.readOnly = true;
  input.style.cssText = 'box-sizing:border-box;width:100%;min-height:72px;font:inherit;line-height:1.5;background:#f5f1e8;color:#102b2d;padding:12px;border-radius:8px';
  panel.append(label, input); (document.querySelector('main') || document.body).prepend(panel);
  history.replaceState(history.state, '', (() => {const u=new URL(location.href);u.searchParams.delete('entryHandoff');return u.pathname+u.search+u.hash;})());
 };
 window.addEventListener('message', receive);
 window.opener.postMessage({type:'PHIOS_ENTRY_READY'}, location.origin);
 setTimeout(()=>window.removeEventListener('message',receive),15000);
}
