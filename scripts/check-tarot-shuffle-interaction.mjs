import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {initTarotSurface} from '../assets/customer-ui/js/surfaces/tarot-surface-core.js';
const {document,window}=parseHTML('<html lang="en"><body><textarea data-symbolic-question></textarea><button data-start-draw></button><button data-reshuffle></button><button data-symbolic-execute></button><div data-card-picker></div><div data-execution-status></div></body></html>');
globalThis.document=document;
globalThis.window=window;
let frame;globalThis.requestAnimationFrame=fn=>(frame=fn,1);globalThis.cancelAnimationFrame=()=>{};
window.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.matchMedia=()=>({matches:true});
globalThis.fetch=async url=>String(url).startsWith('/content/')?Response.json(JSON.parse(fs.readFileSync('.'+url,'utf8'))):Response.json({production:{runAllowed:true}});
await initTarotSurface();
const q=s=>document.querySelector(s);
assert.equal(q('[data-shuffle-sound]'),null,'sound is enabled by the start gesture without an opt-in');
q('textarea').value='What should I understand about this situation?';
q('[data-start-draw]').click();
await new Promise(r=>setTimeout(r,20));
assert.equal(q('[data-card-picker]').getAttribute('aria-busy'),'true');
assert.equal(q('[data-start-draw]').disabled,true);
assert.ok(q('.cx-ritual'));
frame(performance.now()+120001);
await new Promise(r=>setTimeout(r,20));
assert.equal(q('[data-card-picker]').hasAttribute('aria-busy'),false);
assert.equal(document.querySelectorAll('[data-card-id]').length,78);
assert.equal(new Set([...document.querySelectorAll('[data-card-id]')].map(b=>b.dataset.cardId)).size,78);
// Every card can independently be selected and removed, including formerly covered ones.
for(const id of [...document.querySelectorAll('[data-card-id]')].map(b=>b.dataset.cardId)){
 q(`[data-card-id="${id}"]`).click();
 assert.equal(q(`[data-card-id="${id}"]`).getAttribute('aria-pressed'),'true');
 q(`[data-card-id="${id}"]`).click();
 assert.equal(q(`[data-card-id="${id}"]`).getAttribute('aria-pressed'),'false');
}
assert.equal(q('[data-card-picker]').classList.contains('cx-tarot-deck--accessible'),true);
console.log('✓ Shuffle lock, two-minute sequence completion, 78 unique cards and all 78 select/remove interactions passed.');
