import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {startRitual,RITUAL_DURATION_MS} from '../assets/customer-ui/js/surfaces/ritual-sequence.js';
assert.equal(RITUAL_DURATION_MS,120000);
const {document,window}=parseHTML('<html><body><div id="host"></div></body></html>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
let callback,translations=[],sounds=0,closed=0;
globalThis.requestAnimationFrame=fn=>(callback=fn,1);globalThis.cancelAnimationFrame=()=>{};
window.HTMLCanvasElement.prototype.getContext=()=>new Proxy({translate:(...p)=>translations.push(p)},{get:(t,k)=>t[k]||(()=>{}),set:()=>true});
const node=()=>({connect(){return this;},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},start(){sounds++;},stop(){}});
globalThis.AudioContext=class {state='running';sampleRate=1000;currentTime=0;destination={};resume(){return Promise.resolve();}close(){closed++;this.state='closed';return Promise.resolve();}createGain(){return node();}createOscillator(){return node();}createBufferSource(){return node();}createBiquadFilter(){return node();}createBuffer(){return {getChannelData:()=>new Float32Array(170)};}};
for(const kind of ['tarot','iching']){
 const before=sounds,beforeClose=closed,start=performance.now(),r=startRitual(document.querySelector('#host'),{kind});
 callback(start+50);const first=JSON.stringify(translations);translations=[];
 callback(start+(kind==='tarot'?3000:9000));assert.notEqual(JSON.stringify(translations),first,'positions must change');
 callback(start+(kind==='tarot'?4000:15000));assert.ok(sounds>before,'sound starts without a sound opt-in');
 callback(start+119000);assert.ok(document.querySelector('.cx-ritual'),'sequence must not finish early');
 callback(start+120100);assert.equal(await r.done,true);assert.equal(closed,beforeClose+1);assert.equal(document.querySelector('.cx-ritual'),null);
 const c=startRitual(document.querySelector('#host'),{kind});document.querySelector('.cx-ritual button').click();assert.equal(await c.done,false);assert.equal(document.querySelector('.cx-ritual'),null);
 const h=startRitual(document.querySelector('#host'),{kind});window.dispatchEvent(new window.Event('pagehide'));assert.equal(await h.done,false);
}
console.log('PASS: 120-second motion, default audio cues, completion/cancel/pagehide cleanup for both rituals. Human listening remains pending.');
