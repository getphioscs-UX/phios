import vm from 'node:vm';
import {resolveConsolidationRedirect} from '../../functions/public/page-consolidation.js';
import {auditPublicPredecessor,auditPublicReadFile} from './audit-r2-public-receiver-r2.mjs';
import {isConvergenceCurrent,assertConvergenceHome,convergenceRedirectTarget} from './public-customer-report-convergence-successor-r1.mjs';
import {assertLocaleBootstrapCurrent} from './locale-bootstrap-current-successor.mjs';
import {finalR6ConsolidationBytes} from './final-r6-visual-successor.mjs';
import {professionalConsolidationBytes,financialServiceScopeBytes} from './professional-consolidation-successor-r1.mjs';
import {currentConsolidationDigest} from './founder-human-presence-successor-r2.mjs';
import sourceFs from 'node:fs';const fs={...sourceFs,readFileSync:auditPublicReadFile};import crypto from 'node:crypto';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
const root='content/production-closure/live-customer-commercial-convergence/page-consolidation-r1',manifest='content/web/index-surfaces/page-consolidation-configuration-profile-successor-r1.json',sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function financialEverydayDigest(file,expected){
 const next=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-financial-everyday-successor-v5.json'));
 assert.equal(next.status,'ENGINEERING_RECONCILIATION');assert.equal(next.file,file);
 assert.equal(next.predecessor.path,'content/web/index-surfaces/pis-current-surface-followup-successor-v4.json');
 assert.equal(next.predecessor.sha256,sha(fs.readFileSync(next.predecessor.path)));
 for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(next[key],false);
 assert.equal(next.previousSha256,expected);assert.equal(sha(fs.readFileSync(next.previousPath)),expected);
 const {document}=parseHTML(fs.readFileSync(file,'utf8'));
 assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'),'/professional/financial/');
 for(const stage of ['household','income','expenses','assets','liabilities','protection','goals','documents','unknowns'])assert(document.querySelector(`[data-cx-financial-intake-stage="${stage}"]`),'Financial stage missing: '+stage);
 assert.equal(document.querySelectorAll('h1').length,1);
 assert(document.querySelector('a[href="/professional/financial/report-preview/"]'));
 assert(document.body.textContent.includes('Paid generation is not available yet.'));
 const successor=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-financial-local-receiver-successor-v6.json'));
 assert.equal(successor.status,'ENGINEERING_RECONCILIATION');assert.equal(successor.file,file);
 assert.equal(successor.predecessor.path,'content/web/index-surfaces/pis-financial-everyday-successor-v5.json');
 assert.equal(successor.predecessor.sha256,sha(fs.readFileSync(successor.predecessor.path)));
 for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(successor[key],false);
 assert.equal(successor.previousSha256,next.sha256);
 const previous=fs.readFileSync(successor.previousPath);assert.equal(sha(previous),next.sha256);
 const insertion='<script type="module" src="/assets/customer-ui/js/surfaces/personal-evidence-receiver.js"></script>';
 assert.equal(successor.exactInsertion,insertion);
 const currentFinancial=financialServiceScopeBytes(file,successor.sha256);
 const current=currentFinancial.before.toString('utf8');assert.equal(current.split(insertion).length,2);
 assert.equal(current.replace(insertion,''),previous.toString('utf8'),'Financial receiver must be the only markup change');
 assert.equal(successor.dependency.path,'assets/customer-ui/js/surfaces/personal-evidence-receiver.js');
 assert.equal(sha(fs.readFileSync(successor.dependency.path)),successor.dependency.sha256);
 return currentFinancial.sha256;
}
export function consolidationSuccessor(){if(!fs.existsSync(manifest))return null;const record=JSON.parse(fs.readFileSync(manifest));assert.equal(record.status,'ENGINEERING_RECONCILIATION');assert.equal(record.humanAcceptanceGranted,false);assert.equal(record.productionActivated,false);assert.equal(sha(fs.readFileSync(root+'/OWNER-WORK-STEP.md')),record.ownerInstructionSha256);return {...record,surfaces:record.surfaces.map(s=>s.redirect?{...s,redirect:convergenceRedirectTarget(s.file,s.redirect)}:s)};}
export function historicalPisBytes(file){const record=consolidationSuccessor(),item=record?.surfaces.find(s=>s.file===file);if(!item){if(file==='professional/financial/index.html'){const next=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-current-surface-followup-successor-v4.json'));assert.equal(next.status,'ENGINEERING_RECONCILIATION');assert.equal(next.predecessor.path,manifest);assert.equal(next.predecessor.sha256,sha(fs.readFileSync(manifest)));for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(next[key],false);const c=next.additionalFinancial;assert.equal(c.file,file);const before=fs.readFileSync(c.previousPath);assert.equal(sha(before),c.previousSha256);assert.equal(sha(fs.readFileSync(file)),financialEverydayDigest(file,c.sha256));return before;}return fs.readFileSync(file);}const before=fs.readFileSync(root+'/before/'+file);assert.equal(sha(before),item.previousSha256,file+': consolidation predecessor changed');let expected=currentConsolidationDigest(file,item.sha256);
 const visualLedger='artifacts/visual-r2/CHANGED-FILES.json';
 if(fs.existsSync(visualLedger)){
  const visual=JSON.parse(fs.readFileSync(visualLedger));
  assert.equal(visual.status,'ENGINEERING_RECOMPOSITION');assert.equal(visual.humanAccepted,false);
  const changes=visual.changes.filter(s=>s.file===file);assert(changes.length<=1,file+': duplicate visual successor');
  if(changes.length){const change=changes[0];assert.equal(change.beforeSha256,expected,file+': visual predecessor mismatch');assert.equal(change.backup,'artifacts/visual-r2/before/'+file);assert.equal(sha(fs.readFileSync(change.backup)),expected,file+': visual predecessor changed');expected=change.afterSha256;}
 }
 const staticPath='content/web/index-surfaces/home-static-visual-successor-v1.json';
 if(file==='index.html'&&fs.existsSync(staticPath)){const next=JSON.parse(fs.readFileSync(staticPath));assert.equal(next.status,'ENGINEERING_RECONCILIATION');assert.equal(next.file,file);assert.equal(next.predecessor.path,visualLedger);assert.equal(next.predecessor.sha256,sha(fs.readFileSync(visualLedger)));assert.equal(next.humanAcceptanceGranted,false);assert.equal(next.productionActivated,false);assert.equal(next.previousSha256,expected);assert.equal(sha(fs.readFileSync(next.previousPath)),expected);expected=next.sha256;}
 const localePath='content/web/index-surfaces/consolidation-locale-bootstrap-successor-v1.json';
 if(fs.existsSync(localePath)){const locale=JSON.parse(fs.readFileSync(localePath)),change=locale.changes.find(s=>s.file===file);if(change){assert.equal(locale.status,'ENGINEERING_RECONCILIATION');assert.equal(locale.predecessor.path,manifest);assert.equal(locale.predecessor.sha256,sha(fs.readFileSync(manifest)));for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(locale[key],false);assertLocaleBootstrapCurrent(locale.runtime);assert.equal(change.previousSha256,expected);assertCurrentConsolidationLocale(file);expected=change.sha256;}}
 const aboutPath='content/web/index-surfaces/home-about-entry-successor-v2.json';
 if(file==='index.html'&&fs.existsSync(aboutPath)){const about=JSON.parse(fs.readFileSync(aboutPath));assert.equal(about.status,'ENGINEERING_RECONCILIATION');assert.equal(about.file,file);assert.equal(about.predecessor.path,staticPath);assert.equal(about.predecessor.sha256,sha(fs.readFileSync(staticPath)));for(const key of ['humanAcceptanceGranted','productionActivated','historicalRecordsRewritten'])assert.equal(about[key],false);assert.equal(about.previousSha256,expected);assert.equal(sha(fs.readFileSync(about.previousPath)),expected);expected=about.sha256;}
 if(file==='perspectives/index.html'){
  const next=JSON.parse(fs.readFileSync('content/web/index-surfaces/perspectives-locale-bootstrap-successor-v3.json'));assert.equal(next.status,'ENGINEERING_RECONCILIATION');assert.equal(next.file,file);assert.equal(next.predecessor.path,visualLedger);assert.equal(next.predecessor.sha256,sha(fs.readFileSync(visualLedger)));for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(next[key],false);assert.equal(next.previousSha256,expected);assert.equal(sha(fs.readFileSync(next.previousPath)),expected);expected=next.sha256;
 }
 const followup=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-current-surface-followup-successor-v4.json'));assert.equal(followup.status,'ENGINEERING_RECONCILIATION');assert.equal(followup.predecessor.path,manifest);assert.equal(followup.predecessor.sha256,sha(fs.readFileSync(manifest)));for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(followup[key],false);
 const addition=followup.changes.find(c=>c.file===file);if(addition){assert.equal(addition.previousSha256,expected);assert.equal(sha(fs.readFileSync(addition.previousPath)),expected);for(const dependency of followup.dependencies)assert.equal(sha(fs.readFileSync(dependency.path)),dependency.sha256);expected=addition.sha256;}
 const entryPath='content/web/index-surfaces/customer-entry-home-successor-r1.json';if(file==='index.html'&&fs.existsSync(entryPath)){const entry=JSON.parse(fs.readFileSync(entryPath));assert.equal(entry.status,'ENGINEERING_RECONCILIATION');assert.equal(entry.file,file);assert.equal(entry.predecessor.path,'content/web/index-surfaces/pis-current-surface-followup-successor-v4.json');assert.equal(entry.predecessor.sha256,sha(fs.readFileSync(entry.predecessor.path)));assert.equal(entry.ownerInstructionSha256,sha(fs.readFileSync(entry.ownerInstruction)));for(const k of ['humanAcceptanceGranted','productionActivated','historicalRecordsRewritten'])assert.equal(entry[k],false);assert.equal(entry.previousSha256,expected);assert.equal(sha(fs.readFileSync(entry.previousPath)),expected);expected=entry.sha256;}
 assert.equal(sha(file==='professional/index.html'?professionalConsolidationBytes(file,expected):finalR6ConsolidationBytes(file,expected)),expected,file+': consolidation source drift');return before;}
export function assertCurrentConsolidatedSurface(document,file){if(file==='index.html'&&isConvergenceCurrent(file)){historicalPisBytes(file);assertConvergenceHome(document);return true;}const item=consolidationSuccessor()?.surfaces.find(s=>s.file===file);if(!item)return false;historicalPisBytes(file);const {document:before}=parseHTML(fs.readFileSync(root+'/before/'+file,'utf8'));assert(before.querySelector('main'),file+': historical source lost');for(const selector of item.requiredSelectors)assert(document.querySelector(selector),file+': missing consolidated consumer '+selector);if(item.redirect){assert.equal(document.querySelector('[data-consolidation-target]')?.dataset.consolidationTarget,item.redirect);assert(!document.querySelector('[data-pis-context-figures]'));}return true;}

// Owner Override 2026-11-26 retires only locale-before local snapshots.
// Current source digest, registered destination and locale implementation stay checked.
export function assertCurrentConsolidationLocale(file,read=p=>fs.readFileSync(p,'utf8')){
 if(file==='explore/index.html')return true; // Current About compatibility has its own original checker.
 const target=consolidationSuccessor()?.surfaces.find(s=>s.file===file)?.redirect;
 assert(target,'CURRENT_LOCALE_REGISTERED_REDIRECT_REQUIRED');
 const {document}=parseHTML(read(file));
 assert.equal(document.querySelectorAll('script[src="/assets/js/locale-bootstrap.js"]').length,1,'CURRENT_LOCALE_BOOTSTRAP_REQUIRED');
 assert.equal(document.querySelectorAll('script[src="/assets/customer-ui/js/surfaces/page-consolidation-redirect.js"]').length,1,'CURRENT_LOCALE_REDIRECT_RUNTIME_REQUIRED');
 const link=document.querySelector('[data-consolidation-target]');assert.equal(link?.getAttribute('href'),target,'CURRENT_LOCALE_ROUTE_MISMATCH');assert.equal(link?.dataset.consolidationTarget,target);
 assert(/Continue/.test(link.textContent)&&/继续/.test(link.textContent),'CURRENT_LOCALE_BILINGUAL_FALLBACK_REQUIRED');
 assert.equal(document.querySelectorAll('form,input,textarea').length,0,'CURRENT_LOCALE_REDIRECT_MUST_NOT_COLLECT_INPUT');
 const [route,anchor]=target.split('#');const destination=route==='/'?'index.html':route.slice(1)+'index.html';
 assert(read(destination).length>0,'CURRENT_LOCALE_REAL_DESTINATION_REQUIRED');
 const requestPath='/'+file.replace(/index\.html$/,'');
 for(const locale of ['en','zh-Hans'])for(const method of ['GET','HEAD']){
  const url='https://qa.invalid'+requestPath+'?locale='+locale+'&method=ecr&returnTo=%2Faccount%2F';
  const response=resolveConsolidationRedirect({request:new Request(url,{method})});assert.equal(response?.status,308);const to=new URL(response.headers.get('Location'));assert.equal(to.searchParams.get('locale'),locale);assert.equal(to.searchParams.get('returnTo'),'/account/');assert.equal(to.pathname+to.hash,target);
 }
 assert.equal(resolveConsolidationRedirect({request:new Request('https://qa.invalid'+requestPath,{method:'POST',body:'no-write'})}),null);
 const bootstrap=read('assets/js/locale-bootstrap.js');
 for(const locale of ['en','zh-Hans']){
  const {document:d}=parseHTML('<html><body><p data-cx-en="English current" data-cx-zh="当前中文">English current</p></body></html>');
  let writes=0;const store={getItem(){return null;},setItem(){writes++;throw Error('CURRENT_LOCALE_STORAGE_WRITE_FORBIDDEN');},removeItem(){writes++;throw Error('CURRENT_LOCALE_STORAGE_WRITE_FORBIDDEN');}};
  vm.runInNewContext(bootstrap,{window:{opener:null},document:d,location:{search:'?locale='+locale},URLSearchParams,navigator:{language:'en'},localStorage:store,MutationObserver:class{observe(){}}},{timeout:1000});
  assert.equal(d.documentElement.lang,locale);assert.equal(d.querySelector('p').textContent,locale==='en'?'English current':'当前中文');assert.equal(writes,0);
 }
 return true;
}
