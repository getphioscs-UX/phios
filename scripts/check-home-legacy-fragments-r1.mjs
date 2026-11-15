import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {resolveConsolidationRedirect} from '../functions/public/page-consolidation.js';
const script=fs.readFileSync('assets/customer-ui/js/six-subjects-r2.js','utf8');
const {document:home}=parseHTML(fs.readFileSync('index.html','utf8'));
const aliases={'#start':'#six-perspectives','#flagship-experiences':'#six-perspectives','#world-knowledge':'#r3-continue','#human-services':'#r3-support','#continue':'#r3-continue'};
let checks=0;
function browser(url,{surface='HOME',missingTarget=false}={}){
 const location=new URL(url),state={fixture:'SYNTHETIC_HISTORY_STATE'},events=new Map(),replacements=[],scrolls=[];
 const history={state,replaceState(next,unused,target){assert.equal(next,state);location.href=new URL(target,location).href;replacements.push(location.href);}};
 const document={body:{dataset:{cxSurface:surface}},querySelector(){return null;},querySelectorAll(){return [];},getElementById(id){if(missingTarget)return null;assert(home.getElementById(id),'Alias must target a real current Home element');return{scrollIntoView(){scrolls.push(id);}};}};
 const window={addEventListener(type,listener){events.set(type,listener);}};
 vm.runInNewContext(script,{location,history,document,window,URL,Object});
 return{location,history,state,events,replacements,scrolls};
}
for(const [old,next]of Object.entries(aliases))for(const locale of ['en','zh-Hans']){
 const b=browser('https://local.invalid/?locale='+locale+'&returnTo=%2Faccount%2F'+old);
 assert.equal(b.location.hash,next);assert.equal(b.location.search,'?locale='+locale+'&returnTo=%2Faccount%2F');
 assert.equal(b.history.state,b.state);assert.deepEqual(b.scrolls,[next.slice(1)]);checks++;
 for(const event of ['hashchange','popstate']){b.location.hash=old;b.events.get(event)();assert.equal(b.location.hash,next);checks++;}
}
for(const hash of ['#constructor','#__proto__','#unknown','#v=2&lang=en','#six-perspectives']){
 const b=browser('https://local.invalid/'+hash);assert.equal(b.location.hash,hash);assert.equal(b.replacements.length,0);checks++;
}
for(const route of ['/world/','/subjects/institution/']){
 const b=browser('https://local.invalid'+route+'#start');assert.equal(b.location.hash,'#start');assert.equal(b.replacements.length,0);checks++;
}
for(const options of [{surface:'WORLD'},{missingTarget:true}]){
 const b=browser('https://local.invalid/#start',options);assert.equal(b.location.hash,'#start');assert.equal(b.replacements.length,0);checks++;
}
for(const method of ['GET','HEAD'])for(const slash of ['', '/']){
 const response=resolveConsolidationRedirect({request:new Request('https://local.invalid/explore/start'+slash+'?locale=zh-Hans&returnTo=%2Faccount%2F',{method})});
 assert.equal(response.status,308);const destination=new URL(response.headers.get('location'));
 assert.equal(destination.pathname,'/');assert.equal(destination.hash,'#six-perspectives');assert.equal(destination.search,'?locale=zh-Hans&returnTo=%2Faccount%2F');checks++;
}
assert.equal(resolveConsolidationRedirect({request:new Request('https://local.invalid/explore/start',{method:'POST',body:'synthetic'})}),null);checks++;
const {document:fallback}=parseHTML(fs.readFileSync('explore/start/index.html','utf8'));
assert.equal(fallback.querySelector('[data-consolidation-target]').dataset.consolidationTarget,'/#six-perspectives');
assert.equal(fallback.querySelector('[data-consolidation-target]').getAttribute('href'),'/#six-perspectives');checks++;
// The existing generic client redirect intentionally preserves incoming hashes.
const client=fs.readFileSync('assets/customer-ui/js/surfaces/page-consolidation-redirect.js','utf8');
for(const hash of ['', '#start', '#unknown']){
 const location=new URL('https://local.invalid/explore/start/index.html?locale=en'+hash);let result;
 location.replace=next=>{result=new URL(next,location);};
 vm.runInNewContext(client,{document:{querySelector(){return{dataset:{consolidationTarget:'/#six-perspectives'}};}},location,URL});
 assert.equal(result.hash,hash||'#six-perspectives');assert.equal(result.search,'?locale=en');checks++;
}
console.log(JSON.stringify({status:'HOME_LEGACY_ROUTE_CONTRACT_PASS',checks,scope:'Actual source with synthetic DOM/history and pure redirect requests; actual Pages/browser landing still separately required',providerCalls:0,writes:0}));
