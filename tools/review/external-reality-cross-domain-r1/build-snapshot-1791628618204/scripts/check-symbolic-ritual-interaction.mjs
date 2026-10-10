import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startRitual,RITUAL_DURATION_MS} from '../assets/customer-ui/js/surfaces/ritual-sequence.js';
const results=[];let frame=null;
function environment(){
 const listeners=new Map(),ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
 const element=tag=>({tag,style:{},children:[],append(...items){this.children.push(...items)},setAttribute(){},getContext(){return ctx},remove(){this.removed=true}});
 globalThis.document={hidden:false,createElement:element,addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:(k,f)=>{if(listeners.get(k)===f)listeners.delete(k)}};
 globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.matchMedia=()=>({matches:true});
 globalThis.requestAnimationFrame=fn=>{frame=fn;return 1};globalThis.cancelAnimationFrame=()=>{frame=null};
 const host={before(panel){this.panel=panel}};return {host,listeners};
}
assert.ok(RITUAL_DURATION_MS<=2000);
for(const mode of ['complete','skip','cancel','background']){
 const {host,listeners}=environment();const ritual=startRitual(host,{kind:'tarot'});
 if(mode==='complete')frame(performance.now()+RITUAL_DURATION_MS+10);
 if(mode==='skip')host.panel.children[3].onclick();
 if(mode==='cancel')host.panel.children[4].onclick();
 if(mode==='background'){document.hidden=true;listeners.get('visibilitychange')();}
 assert.equal(await ritual.done,mode!=='cancel');assert.equal(host.panel.removed,true);
 assert.equal(listeners.has('visibilitychange'),false);
 results.push({mode,result:'PASS',scope:'SOURCE_DOM_HARNESS_NOT_BROWSER_E2E'});
}
fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/TAROT-INTERACTION-QA.json',JSON.stringify({durationMs:RITUAL_DURATION_MS,results,remaining:['real touch and double-click E2E','mobile widths','shuffle failure and restart','card orientation and spread customer E2E'],liveCustomerPass:false},null,2)+'\n');
console.log('PASS short animation / skip / cancel / background preservation; browser/mobile E2E still pending.');
