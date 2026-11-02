import {hydrateUnifiedPublicVisuals} from '../../js/public-v2/unified-public-visual-resolver.js';
// Presentation bridge only. Existing form controls continue to own method choice,
// input precision, availability and consent. No new reading request is issued here.
const form=document.querySelector('[data-cx-personal-form]');
document.querySelectorAll('[data-prr-choose]').forEach(button=>button.addEventListener('click',()=>{const method=button.dataset.prrChoose,input=form?.querySelector(`input[name="methods"][value="${method}"]`);if(!input||input.disabled)return;if(!input.checked)input.click();form.querySelector('#cx-r12-explore')?.scrollIntoView({behavior:'smooth',block:'start'});}));
function localeCopy(){const zh=document.documentElement.lang.startsWith('zh');document.querySelectorAll('[data-pis-copy]').forEach(n=>n.textContent=n.getAttribute(zh?'data-cx-zh':'data-cx-en')||'');}
localeCopy();new MutationObserver(localeCopy).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
hydrateUnifiedPublicVisuals(document).catch(()=>{});
