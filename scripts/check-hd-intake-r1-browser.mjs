import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {localAsset} from './lib/ca-r1-preview-server.mjs';
import {onRequestPost as intake} from '../functions/api/customer-external-profile-intake.js';
import {onRequestPost as resolvePlace} from '../functions/api/location-resolve.js';
import {onRequestPost as confirm} from '../functions/api/customer-external-profile-confirm.js';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE||'C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const A='Type: Generator\nAuthority: Emotional\nProfile: 5/1\nDefinition: Triple Split Definition\nChannels: 43-23,46-29,40-37\nDefined Centers: Ajna, Ego, G Center, Sacral, Solar Plexus, Throat\nOpen Centers: Head, Root, Spleen\nDesign activated Gates: 29.1 46.2\nPersonality activated Gates: 43.5 23.5\nVariable: PRL DRL\nIncarnation Cross: Left Angle Cross of '+('Long title '.repeat(20));
const B='Type: Projector\nAuthority: Splenic\nProfile: 1/3\nDefinition: Single Definition\nChannels: 1-8';
let delayed=false;
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');let response;
 if(url.pathname==='/fixture/lookup')response=Response.json([{lat:'4.85',lon:'100.74',display_name:'Taiping, Malaysia',name:'Taiping',address:{city:'Taiping',country:'Malaysia',country_code:'my'}}]);
 else if(url.pathname==='/fixture/timezone')response=Response.json({timeZone:'Asia/Kuala_Lumpur'});
 else if(url.pathname==='/api/location-search')response=Response.json({ok:true,candidates:[{providerRef:'N1',primaryLabel:'Taiping',label:'Taiping, Malaysia'}]});
 else if(['/api/location-resolve','/api/customer-external-profile-intake','/api/customer-external-profile-confirm'].includes(url.pathname)){
  const chunks=[];for await(const c of req)chunks.push(c);
  const request=new Request(url,{method:'POST',headers:req.headers,body:Buffer.concat(chunks)});
  const env={PHIOS_GEOCODING_LOOKUP_ENDPOINT:origin+'/fixture/lookup',PHIOS_TIMEZONE_ENDPOINT:origin+'/fixture/timezone',AI:{async toMarkdown({name}){if(delayed)await new Promise(r=>setTimeout(r,500));return {data:name.startsWith('A')?A:name.startsWith('B')?B:'',format:'markdown'};}}};
  response=await(url.pathname.endsWith('intake')?intake:url.pathname.endsWith('location-resolve')?resolvePlace:confirm)({request,env});
 }else response=localAsset(url);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(500).end(JSON.stringify({error:error.message}));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];fs.mkdirSync('docs/hd-intake-r1/browser',{recursive:true});
try{for(const language of ['en','zh-Hans'])for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.goto(origin+'/perspectives/personal/?locale='+language);
 await page.evaluate(language=>{localStorage.setItem('phios-cx-locale',language);document.documentElement.lang=language;const input=document.querySelector('[name=externalProfileEnabled]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));},language);
 const upload=async name=>{await page.locator('[name=externalProfileFile]').setInputFiles({name,mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 fixture')});await page.locator('[name=externalProfileProcessingConsent]').check();await page.locator('[data-cx-external-profile-process]').click();await page.locator('[data-cx-external-profile-confirmation]').waitFor({state:'visible'});};
 await upload('A.pdf');
 assert.equal(await page.locator('[data-cx-external-profile-edit=strategy]').inputValue(),'To Respond');
 assert.equal(await page.locator('[data-cx-external-profile-edit=notSelfTheme]').inputValue(),'Frustration');
 assert.equal(await page.locator('[data-hd-arrow]:checked').count(),4);
 assert.equal(await page.locator('[data-cx-external-profile-confirmation] textarea:visible').count(),0);
 await page.locator('[data-cx-external-profile-edit=authority]').fill('Current manual correction');
 await page.evaluate(()=>window.dispatchEvent(new Event('phios:localechange')));
 assert.equal(await page.locator('[data-cx-external-profile-edit=authority]').inputValue(),'Current manual correction');
 await page.locator('[data-hd-arrows-confirmed]').check();await page.locator('[name=externalAdvancedAvailability][value=NO_ADVANCED]').check();await page.locator('[name=externalProfileChartVerified]').check();
 const confirmedResponse=page.waitForResponse(response=>response.url().endsWith('/api/customer-external-profile-confirm'));await page.locator('[data-cx-external-profile-confirm]').click();const confirmed=await(await confirmedResponse).json();assert.equal(confirmed.ok,true);assert.equal(confirmed.confirmedExternalProfile.records.find(x=>x.field==='authority').value,'Current manual correction');assert.equal(confirmed.confirmedExternalProfile.records.find(x=>x.field==='channels').manuallyOverridden,false);
 await page.locator('[data-cx-external-profile-confirmation]').screenshot({path:`docs/hd-intake-r1/browser/${language}-${width}.png`,style:'.cx-shell-header,.cx-r5-jumpbar,.cx-skip{visibility:hidden!important}'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await upload('B.pdf');
 assert.equal(await page.locator('[data-cx-external-profile-edit=authority]').inputValue(),'Splenic');
 assert.equal(await page.locator('[data-cx-external-profile-edit=incarnationCross]').inputValue(),'');
 assert.equal(await page.locator('[data-hd-arrow]:checked').count(),0);
 assert.equal(await page.locator('[data-cx-external-profile-structure-edit=channels]').inputValue(),'1-8');
 assert.equal(await page.locator('[data-cx-external-profile-structure-edit=definedCenters]').inputValue(),'');
 await upload('unknown.pdf');
 for(const input of await page.locator('[data-cx-external-profile-edit],[data-cx-external-profile-structure-edit]').all())assert.equal(await input.inputValue(),'');
 // Birth changes invalidate ready drafts; delayed A cannot resurrect after a new subject.
 await upload('A.pdf');await page.locator('[name=birthDate]').fill('1992-05-06');
 assert(await page.locator('[data-cx-external-profile-confirmation]').isHidden());
 delayed=true;await page.locator('[data-cx-external-profile-process]').click();await page.locator('[name=birthDate]').fill('1993-06-07');await page.waitForTimeout(700);delayed=false;
 assert(await page.locator('[data-cx-external-profile-confirmation]').isHidden());
 await page.evaluate(()=>document.querySelector('[data-cx-personal-form]').reset());await page.waitForTimeout(50);assert(await page.locator('[data-cx-external-profile-confirmation]').isHidden());
 await page.reload();assert(await page.locator('[data-cx-external-profile-confirmation]').isHidden());
 await page.evaluate(()=>{const input=document.querySelector('[name=externalProfileEnabled]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.locator('[name=birthDate]').fill('1992-05-06');await page.locator('[name=birthTime]').fill('12:30');await page.locator('[data-cx-place-input]').fill('Taiping');await page.locator('[data-cx-place-results] button').first().click();await page.locator('[data-cx-place-confirmed]').waitFor({state:'visible'});
 const calculatedResponse=page.waitForResponse(response=>response.url().endsWith('/api/customer-external-profile-intake'));await upload('unknown.pdf');const calculated=await(await calculatedResponse).json();assert.equal(calculated.externalProfileIntake.calculationReferenceState,'AVAILABLE');assert.equal(calculated.externalProfileIntake.confirmationDraft.fields.type.source,'CURRENT_BIRTH_CALCULATION');assert(await page.locator('[data-cx-external-profile-edit=strategy]').inputValue());
 await page.locator('[data-hd-arrow="0"][value=L]').focus();await page.keyboard.press('Space');await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[name=hdArrow0]:checked').inputValue(),'R');
 assert(!(await page.locator('[data-cx-external-profile-confirmation]').innerText()).includes('这一项由你填写'));

 results.push({language,width,status:'PASS',cases:['A-to-B','failed-B','manual-locale-preservation','birth-invalidation','late-response-rejection','ephemeral-reload','arrows','no-default-textareas','no-overflow','new-reading-reset','current-birth-calculation','keyboard-arrows','real-confirmation-api']});await page.close();
}
fs.writeFileSync('docs/hd-intake-r1/browser-results.json',JSON.stringify({results,provider:'LOCAL_CONTROLLED_CONVERSION_AND_LOCATION_FIXTURES; real intake/confirmation/location APIs and real local astronomy calculation',liveProvider:'NOT_RUN'},null,2)+'\n');console.log('HD intake browser PASS',results.length);
}finally{await browser.close();await new Promise(r=>server.close(r));}
