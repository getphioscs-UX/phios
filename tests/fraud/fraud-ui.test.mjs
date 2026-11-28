import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import fs from 'node:fs';
import {installScamAskControls,renderScamAskReview} from '../../assets/customer-ui/js/surfaces/scam-ask-controls.js';
import {investigateScam} from '../../functions/external-reality-impact/consumer-scam-navigation.js';
test('native Ask controls retain explicit choices, build bounded payloads and change language',()=>{
 const {window,document}=parseHTML('<html lang="en"><body><form><select name="askTask"><option value="ENTRY">Entry</option></select><label><textarea name="question"></textarea></label><label><select name="guidedRoutingMode"></select></label></form></body></html>');
 globalThis.document=document;globalThis.window=window;
 // linkedom supplies DOM but lacks the browser select-value setter and form.elements.
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(value){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===value);}});
 Object.defineProperty(window.HTMLInputElement.prototype,'checked',{configurable:true,get(){return this.hasAttribute('checked');},set(value){this.toggleAttribute('checked',Boolean(value));}});
 const form=document.querySelector('form');Object.defineProperty(form,'elements',{get:()=>new Proxy({},{get:(_,name)=>form.querySelector(`[name="${String(name)}"]`)})});
 const controls=installScamAskControls(form);assert.equal(controls.request(),null);form.elements.askTask.value='SCAM_CHECK';controls.sync();assert.equal(document.querySelector('[data-scam-ask-controls]').hidden,false);
 form.elements.jurisdiction.value='SG';form.elements.bankJurisdiction.value='US';form.querySelector('[value="PAID_OR_LOST"]').checked=true;
 const payload=controls.request();assert.equal(payload.jurisdiction,'SG');assert.equal(payload.bankJurisdiction,'US');assert.deepEqual(payload.exposure,['PAID_OR_LOST']);assert.deepEqual(payload.contexts,[]);assert.equal(payload.questionOnly,true);assert.equal(payload.followUpContext,null);
 document.documentElement.lang='zh-Hans';window.dispatchEvent(new window.Event('phios:localechange'));assert(document.querySelector('[data-scam-ask-controls]').textContent.includes('行动前，先核对'));assert.equal(form.elements.jurisdiction.value,'SG');assert.equal(controls.request().exposure.length,1);
 form.elements.askTask.value='ENTRY';controls.sync();assert.equal(controls.request(),null);assert.equal(document.querySelector('[data-scam-ask-controls]').hidden,true);
 delete globalThis.document;delete globalThis.window;
});
test('result uses text nodes, prioritized steps and safe structural URL text',()=>{
 const {window,document}=parseHTML('<html lang="en"><body><section id="result"></section></body></html>');globalThis.document=document;globalThis.window=window;
 const result=investigateScam({question:'Someone asks me for my OTP. I shared my OTP. https://example.com/private?token=SECRET',exposure:['SCREEN_SHARED'],jurisdiction:'SG',explicitCheck:true});
 renderScamAskReview(document.getElementById('result'),result);const root=document.getElementById('result');assert(root.querySelector('ol li').textContent.startsWith('Stop screen sharing'));assert.equal(root.querySelectorAll('a').length,0);assert(!root.textContent.includes('SECRET'));assert(root.textContent.includes('1799'));assert(root.querySelector('button'));assert(!root.textContent.includes('997'));
 const source=fs.readFileSync('assets/customer-ui/js/surfaces/contextual-ask.js','utf8');assert(source.includes('...(scamControls.request()||{})'));assert(source.includes("view=payload.scam?"));assert(source.includes("taskParams.get('task')==='SCAM_CHECK'"));
 delete globalThis.document;delete globalThis.window;
});
