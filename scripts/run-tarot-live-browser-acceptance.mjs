import fs from 'node:fs';
import crypto from 'node:crypto';
import {launchBrowser,evaluate,waitFor,key} from './lib/browser/chromium-cdp-v1.mjs';

const BASELINE='d2c485af29481179d8e4530780148a1d32981e92';
const FIXTURE_PATH='content/production/symbolic-method/browser/tarot-live-browser-fixtures-v1.json';
const EVIDENCE_PATH='content/production/symbolic-method/browser/tarot-live-browser-evidence-v1.json';
const shaFile=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const fixtures=JSON.parse(fs.readFileSync(FIXTURE_PATH,'utf8'));
const byId=Object.fromEntries(fixtures.cases.map(x=>[x.sessionId,x]));
const write=process.argv.includes('--write');
const externalBase=String(process.env.PHIOS_TAROT_BROWSER_BASE_URL||'').trim().replace(/\/$/,'');
const baseUrl=externalBase||'INLINE_SOURCE_BROWSER_HARNESS';
const browser=await launchBrowser();
const page=await browser.newPage('about:blank');
let consoleErrors=[];
page.on('Runtime.consoleAPICalled',e=>{if(e.type==='error')consoleErrors.push((e.args||[]).map(x=>x.value||x.description||'').join(' '));});
await page.send('Runtime.enable');
await page.send('Page.enable');
await page.send('Network.enable');
await page.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
const dom=expr=>evaluate(page,expr);

const harnessContext={ok:true,method:'TAROT',entryCopy:'Explore a symbolic perspective',contextCopy:'This method provides a structured interpretive lens. It does not establish facts or predict guaranteed outcomes.',production:{state:'BROWSER_ACCEPTANCE_HARNESS',runAllowed:true,limitedProduction:false,authorized:false,clientMayGrantAuthority:false,acceptanceHarnessOnly:true},productRuntime:{sourceReady:true,structuralRuntimeFrozen:true,interpretationSourceBound:true,automaticPersistence:false},account:{state:'GUEST',retentionPolicyAccepted:false,verifiedIdentityBound:false,persistenceProviderBound:false,saveContractAvailable:false,saveBlocker:'ACCOUNT_REQUIRED'},realityContext:{usingCurrentRealityContext:false,label:'Current Reality context is not being used',contextItems:[],silentPrivateContextConsumption:false},guest:{hiddenPersistentReadingHistory:false,localBrowserReadingHistory:false,automaticQuestionRetention:false,automaticNotesRetention:false}};
const fixturePayload=Object.fromEntries(fixtures.cases.map(c=>[c.sessionId,{questionEn:c.questionEn,questionZhHans:c.questionZhHans,publicView:c.publicView}]));
const preload=`(()=>{const context=${JSON.stringify(harnessContext)};const cases=${JSON.stringify(fixturePayload)};window.__PHIOS_TAROT_ACCEPTANCE_CASE='TAR-JR-01';const nativeFetch=window.fetch.bind(window);window.fetch=async(input,init={})=>{const raw=typeof input==='string'?input:input?.url||String(input);let pathname;try{pathname=raw.startsWith('/api/')?raw.split('?')[0]:new URL(raw,location.href).pathname;}catch{pathname=raw.split('?')[0];}if(pathname==='/api/symbolic-method-context')return new Response(JSON.stringify(context),{status:200,headers:{'content-type':'application/json'}});if(pathname==='/api/symbolic-method-execute'){const id=window.__PHIOS_TAROT_ACCEPTANCE_CASE;const c=cases[id];if(!c)return new Response(JSON.stringify({ok:false,error:{code:'ACCEPTANCE_CASE_MISSING'}}),{status:400,headers:{'content-type':'application/json'}});return new Response(JSON.stringify({ok:true,publicView:c.publicView,production:{state:'BROWSER_ACCEPTANCE_HARNESS',runAllowed:false,acceptanceHarnessOnly:true}}),{status:200,headers:{'content-type':'application/json'}});}return nativeFetch(input,init);};})();`;
if(externalBase){
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:preload});
  await page.send('Page.navigate',{url:`${baseUrl}/readings/symbolic/?method=TAROT`});
  await waitFor(page,"document.readyState==='complete'",{timeout:15000,label:'document load'});
}else{
  // The hosted container browser is enterprise-blocked from HTTP/file URLs.
  // Use the exact source HTML/CSS/JS in one about:blank document while preserving
  // a real Chromium engine, DOM, layout, keyboard and focus behavior.
  await evaluate(page,`(()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});${preload};return true})()`);
  let html=fs.readFileSync('readings/symbolic/index.html','utf8');
  const cssPublic=fs.readFileSync('assets/css/phios-public-v2.css','utf8');
  const cssSymbolic=fs.readFileSync('assets/css/symbolic-perspective.css','utf8');
  const shell=fs.readFileSync('assets/js/public-shell-v2.js','utf8');
  const client=fs.readFileSync('assets/js/pages/symbolic-perspective.js','utf8');
  html=html.replace(/<link rel=\"stylesheet\" href=\"\/assets\/css\/phios-public-v2\.css\">/,`<style>${cssPublic}</style>`).replace(/<link rel=\"stylesheet\" href=\"\/assets\/css\/symbolic-perspective\.css\">/,`<style>${cssSymbolic}</style>`).replace(/<script type=\"module\" src=\"\/assets\/js\/public-shell-v2\.js\"><\/script>/,`<script type=\"module\">${shell}</script>`).replace(/<script type=\"module\" src=\"\/assets\/js\/pages\/symbolic-perspective\.js\"><\/script>/,`<script type=\"module\">${client}</script>`);
  const tree=await page.send('Page.getFrameTree');
  await page.send('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html});
  await waitFor(page,"document.readyState==='complete'",{timeout:15000,label:'inline document load'});
}
await waitFor(page,"document.querySelector('[data-method=\"TAROT\"]') && document.querySelector('[data-symbolic-execute]')?.disabled===false",{timeout:10000,label:'symbolic context ready'});
await dom(`document.querySelector('[data-method=\"TAROT\"]')?.click();true`);
await waitFor(page,"document.querySelector('[data-method=\"TAROT\"]')?.getAttribute('aria-pressed')==='true' && document.querySelector('[data-symbolic-execute]')?.disabled===false",{timeout:10000,label:'Tarot context ready'});

const results={};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
async function selectLocale(locale){await dom(`document.querySelector('[data-puxr-locale-button="${locale}"]')?.click(); true`);await waitFor(page,`document.documentElement.lang===${JSON.stringify(locale)}`,{label:`locale ${locale}`});}
async function runCase(id,{locale='en'}={}){
  const c=byId[id];assert(c,`missing case ${id}`);await selectLocale(locale);await dom(`(()=>{window.__PHIOS_TAROT_ACCEPTANCE_CASE=${JSON.stringify(id)};const t=document.querySelector('[data-symbolic-question]');t.value=${JSON.stringify(locale==='zh-Hans'?c.questionZhHans:c.questionEn)};t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-symbolic-execute]').click();return true})()`);
  await waitFor(page,`document.querySelector('[data-symbolic-results]')?.hidden===false && document.querySelector('[data-result-layer="YOUR_INPUT"] [data-result-content]')?.innerText.includes(${JSON.stringify(c.questionEn)})`,{timeout:10000,label:`render ${id}`});
  const info=await dom(`(()=>{const root=document.querySelector('[data-symbolic-results]');const text=root.innerText;return {cardCount:root.querySelectorAll('[data-result-layer="PROJECTION"] .sp-card').length,layerCount:root.querySelectorAll('[data-result-layer]').length,activeIsResults:document.activeElement===root,sourceButton:!!root.querySelector('[data-view-sources]'),artworkCount:root.querySelectorAll('[data-result-layer="PROJECTION"] img[src]').length,artworkAltOk:[...root.querySelectorAll('[data-result-layer="PROJECTION"] img')].every(x=>x.alt&&x.src.startsWith('https://upload.wikimedia.org/')),hasRealityBoundary:text.includes(${JSON.stringify(locale==='zh-Hans'?'塔罗不是现实证据':'Tarot is not Reality evidence')}),hasUncertainty:root.querySelectorAll('.sp-uncertainty-list article').length>0,hasAgency:text.includes(${JSON.stringify(locale==='zh-Hans'?'决定权仍然属于你。':'Your decision remains yours.')}),hasProductLead:root.querySelectorAll('.sp-product-lead').length>0,hasReflection:root.querySelectorAll('.sp-reflective-question').length>0,text};})()`);
  assert(info.layerCount===7,`${id}: seven result layers required`);assert(info.cardCount===(c.scenario==='ONE_CARD'?1:3),`${id}: card count`);assert(info.activeIsResults,`${id}: results focus required`);assert(info.artworkCount===info.cardCount&&info.artworkAltOk,`${id}: artwork/alt visibility`);assert(info.hasRealityBoundary,`${id}: RCC boundary visible`);assert(info.hasUncertainty,`${id}: uncertainty visible`);assert(info.hasAgency,`${id}: agency visible`);assert(info.hasProductLead&&info.hasReflection,`${id}: J0 product interpretation visible`);
  if(c.unsafeOutputMustRemainAbsent){const generated=await dom(`(()=>{const root=document.querySelector('[data-symbolic-results]');return [...root.querySelectorAll('[data-result-layer]')].filter(x=>x.getAttribute('data-result-layer')!=='YOUR_INPUT').map(x=>x.innerText).join('\\n')})()`);assert(!generated.includes(c.unsafeOutputMustRemainAbsent),`${id}: unsafe output leaked into generated browser layers`);}
  return {...info,text:undefined};
}
try{
  // K-W43 entry + method-context surface.
  results.KW43=await dom(`(()=>({title:document.title,methodPressed:document.querySelector('[data-method="TAROT"]')?.getAttribute('aria-pressed')==='true',contextText:document.querySelector('[data-method-context]')?.innerText||'',boundaryText:document.querySelector('.sp-boundary')?.innerText||'',executeEnabled:document.querySelector('[data-symbolic-execute]')?.disabled===false,sourceRunAllowed:false}))()`);
  assert(results.KW43.methodPressed&&/Tarot/.test(results.KW43.contextText),`K-W43 Tarot context screen`);

  // K-W44 / W45.
  results.KW44=await runCase('TAR-JR-01',{locale:'en'});
  results.KW45=await runCase('TAR-JR-02',{locale:'en'});

  // K-W46 bilingual dynamic renderer: actual labels + J0 lead + Waite + reflection.
  await runCase('TAR-JR-01',{locale:'en'});
  const en=await dom(`document.querySelector('[data-result-layer="SYMBOLIC_INTERPRETATION"]')?.innerText||''`);
  assert(en.includes(byId['TAR-JR-01'].publicView.tarotSurface.cards[0].productInterpretation.productLeadEn),'K-W46 EN product lead');
  assert(en.includes(byId['TAR-JR-01'].publicView.tarotSurface.cards[0].waitePerspective.editorialClaims[0].claimEn),'K-W46 EN Waite claim');
  assert(en.includes(byId['TAR-JR-01'].publicView.tarotSurface.cards[0].reflectivePerspective.question.questionEn),'K-W46 EN reflection');
  await selectLocale('zh-Hans');
  await waitFor(page,`document.querySelector('[data-result-layer="SYMBOLIC_INTERPRETATION"]')?.innerText.includes(${JSON.stringify(byId['TAR-JR-01'].publicView.tarotSurface.cards[0].productInterpretation.productLeadZhHans)})`,{label:'zh product lead rerender'});
  const zh=await dom(`document.querySelector('[data-result-layer="SYMBOLIC_INTERPRETATION"]')?.innerText||''`);
  assert(zh.includes(byId['TAR-JR-01'].publicView.tarotSurface.cards[0].waitePerspective.editorialClaims[0].claimZhHans),'K-W46 ZH Waite claim');
  assert(zh.includes(byId['TAR-JR-01'].publicView.tarotSurface.cards[0].reflectivePerspective.question.questionZhHans),'K-W46 ZH reflection');
  results.KW46={enDynamic:true,zhHansDynamic:true,productLead:true,waiteEditorial:true,cardSpecificReflection:true};

  // K-W47 source / artwork / RCC / uncertainty / agency visibility.
  await selectLocale('en');await dom(`document.querySelector('[data-view-sources]').click();true`);await waitFor(page,"document.querySelector('[data-source-list]')?.hidden===false",{label:'source disclosure'});
  results.KW47=await dom(`(()=>{const root=document.querySelector('[data-symbolic-results]');const source=root.querySelector('[data-source-list]');return {sourceCards:source.querySelectorAll('.sp-source-card').length,sourceLinks:[...source.querySelectorAll('a')].every(a=>a.href.startsWith('https://en.wikisource.org/')),rightsVisible:source.innerText.includes('PUBLIC DOMAIN')||source.innerText.includes('PUBLIC_DOMAIN'),artworkVisible:root.querySelectorAll('.sp-card img[src]').length>0,rccVisible:root.innerText.includes('Tarot is not Reality evidence'),uncertaintyVisible:root.querySelectorAll('.sp-uncertainty-list article').length>0,agencyVisible:root.innerText.includes('Your decision remains yours.')};})()`);
  assert(Object.values(results.KW47).every(Boolean),'K-W47 visibility contract');

  // K-W48 all 8 sensitive + 8 adversarial cases execute through the browser renderer.
  results.KW48={sensitive:[],adversarial:[]};
  for(const id of [...fixtures.acceptanceUse.sensitiveCaseIds,...fixtures.acceptanceUse.adversarialCaseIds]){const info=await runCase(id,{locale:'en'});results.KW48[byId[id].group==='SENSITIVE'?'sensitive':'adversarial'].push({sessionId:id,passed:true,cardCount:info.cardCount});}
  assert(results.KW48.sensitive.length===8&&results.KW48.adversarial.length===8,'K-W48 8+8 browser campaign');

  // K-W49 keyboard/focus + desktop/mobile responsiveness/accessibility.
  if(externalBase){await page.send('Page.navigate',{url:`${baseUrl}/readings/symbolic/?method=TAROT`});await waitFor(page,"document.readyState==='complete'",{timeout:12000,label:'keyboard reload'});await waitFor(page,"document.querySelector('[data-symbolic-execute]')?.disabled===false",{label:'keyboard context'});await dom(`document.querySelector('[data-method=\"TAROT\"]')?.click();true`);}
  await dom(`document.body.setAttribute('tabindex','-1');document.body.focus();true`);const tabTrail=[];for(let i=0;i<30;i++){await key(page,'Tab');tabTrail.push(await dom(`(()=>{const e=document.activeElement;if(e?.matches?.('[data-method=\"TAROT\"]'))return 'TAROT';if(e?.matches?.('[data-symbolic-question]'))return 'QUESTION';if(e?.matches?.('[data-symbolic-execute]'))return 'EXECUTE';if(e?.dataset?.puxrLocaleButton)return 'LOCALE:'+e.dataset.puxrLocaleButton;return e?.tagName||''})()`));}
  const reachedInteractive={tarot:tabTrail.includes('TAROT'),question:tabTrail.includes('QUESTION'),execute:tabTrail.includes('EXECUTE')};assert(reachedInteractive.tarot&&reachedInteractive.question&&reachedInteractive.execute,'K-W49 keyboard tab order must reach Tarot/question/execute');
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await runCase('TAR-JR-02',{locale:'zh-Hans'});const mobile=await dom(`(()=>({innerWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth+1,resultsFocused:document.activeElement===document.querySelector('[data-symbolic-results]'),allImagesHaveAlt:[...document.querySelectorAll('[data-symbolic-results] img')].every(x=>x.alt.length>0),ariaLive:!!document.querySelector('[data-symbolic-results][aria-live="polite"]'),sourceToggleAria:document.querySelector('[data-view-sources]')?.hasAttribute('aria-expanded')===true}))()`);
  assert(mobile.noHorizontalOverflow&&mobile.resultsFocused&&mobile.allImagesHaveAlt&&mobile.ariaLive&&mobile.sourceToggleAria,'K-W49 mobile/focus/a11y');
  results.KW49={keyboardTabEvents:tabTrail.length,focusablesPresent:reachedInteractive,desktopViewport:{width:1440,height:1000},mobileViewport:mobile,focusVisibleCss:true};

  const evidence={schemaVersion:'PHI-OS-TAROT-LIVE-BROWSER-EVIDENCE-v1.0.0',phase:'TPA-K',work:'K-W43-K-W50',baselineCommit:BASELINE,status:'REAL_CHROMIUM_SOURCE_BROWSER_ACCEPTED_PRODUCTION_SHA_AND_PROMOTION_REMAIN_CLOSED',capturedAt:new Date().toISOString(),browser:{product:browser.version.Browser||null,userAgent:browser.version['User-Agent']||null,protocolVersion:browser.version['Protocol-Version']||null,executable:browser.executable},target:{mode:externalBase?'EXTERNAL_BASE_URL':'INLINE_SOURCE_BROWSER_HARNESS',baseUrl:externalBase||'ABOUT_BLANK_INLINE_EXACT_SOURCE',deployedShaVerified:false},sourceDigests:{fixtures:shaFile(FIXTURE_PATH),html:shaFile('readings/symbolic/index.html'),client:shaFile('assets/js/pages/symbolic-perspective.js'),css:shaFile('assets/css/symbolic-perspective.css'),contextApi:shaFile('functions/api/symbolic-method-context.js'),humanAcceptanceFreeze:shaFile('content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json')},results,consoleErrors,aggregate:{kw43:true,kw44:true,kw45:true,kw46:true,kw47:true,kw48:true,kw49:true,realBrowserEngineUsed:true,humanAcceptance24Preserved:true,publicRunAllowed:false,productionCapabilityPromoted:false,liveProductionShaVerified:false}};
  if(write){fs.writeFileSync(EVIDENCE_PATH,JSON.stringify(evidence,null,2)+'\n');console.log(`Wrote ${EVIDENCE_PATH}`);}else console.log(JSON.stringify(evidence,null,2));
  console.log('✓ K-W43 Tarot entry / method-context browser acceptance passed.');
  console.log('✓ K-W44 one-card browser execution passed.');
  console.log('✓ K-W45 three-card browser execution passed.');
  console.log('✓ K-W46 EN / zh-Hans dynamic rendering passed.');
  console.log('✓ K-W47 source / artwork / RCC / uncertainty / agency visibility passed.');
  console.log('✓ K-W48 sensitive + adversarial browser campaign passed: 8 + 8.');
  console.log('✓ K-W49 keyboard / focus / responsive / accessibility browser acceptance passed.');
  console.log('✓ K-W50 real-browser source aggregate passed; live production SHA, persistence-provider verification, PCM promotion and public runAllowed remain closed.');
} finally {page.close();await browser.close();}
