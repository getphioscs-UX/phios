import fs from 'node:fs';
import path from 'node:path';
import {buildZwrVfrCompactAuthoringPack} from '../functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {composeZwrVfrOneCall,ZWR_VFR_ONE_CALL_COMPOSER_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-one-call-composer.js';
import {buildZwrVfrDiagramData} from '../functions/personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {ZWR_VFR_PAGE_PLAN,validateZwrVfrPagePlan} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';

const root='docs/reports/ziwei/vfr-r1';
fs.mkdirSync(root,{recursive:true});
if(String(process.env.REPORT_PROVIDER_LIVE_ALLOWED||'').toLowerCase()!=='true')throw Error('VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED');
if(!String(process.env.OPENAI_API_KEY||'').trim())throw Error('OPENAI_API_KEY_REQUIRED');
const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8'));
const pack=await buildZwrVfrCompactAuthoringPack({evidence:fixture.evidence});
const cachePath=path.join(root,'IMMUTABLE-CACHE.json');
let store=fs.existsSync(cachePath)?JSON.parse(fs.readFileSync(cachePath,'utf8')):{};
const cache={
 async get(k){return store[k]||null;},
 async put(k,v){
  if(store[k]&&JSON.stringify(store[k])!==JSON.stringify(v))throw Error('ZWR_VFR_IMMUTABLE_CACHE_CONFLICT');
  if(!store[k]){store[k]=v;fs.writeFileSync(cachePath,JSON.stringify(store,null,2)+'\n');}
 }
};
const result=await composeZwrVfrOneCall({pack,env:process.env,cache});
if(result.status!=='PASS')throw Error('ZWR_VFR_LIVE_GENERATION_NOT_PASS:'+result.status);
const diagrams=await buildZwrVfrDiagramData({evidence:fixture.evidence});
const pagePlan=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id)});
if(!pagePlan.accepted||pagePlan.pageCount!==47)throw Error('ZWR_VFR_PAGE_PLAN_INVALID:'+pagePlan.reasons.join(','));
fs.writeFileSync(path.join(root,'LIVE-RESULT.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(root,'COMPACT-AUTHORING-PACK.json'),JSON.stringify(pack,null,2)+'\n');
fs.writeFileSync(path.join(root,'DIAGRAM-DATA.json'),JSON.stringify(diagrams,null,2)+'\n');
fs.writeFileSync(path.join(root,'PAGE-PLAN.json'),JSON.stringify(ZWR_VFR_PAGE_PLAN,null,2)+'\n');
fs.writeFileSync(path.join(root,'LIVE-EVIDENCE.json'),JSON.stringify({
 schemaVersion:'ZWR-VFR-R1-LIVE-EVIDENCE-v1',
 recordedAt:new Date().toISOString(),
 composerVersion:ZWR_VFR_ONE_CALL_COMPOSER_VERSION,
 status:result.status,
 providerCalls:result.providerCalls,
 semanticReviewCalls:result.semanticReviewCalls,
 cacheHit:result.cacheHit,
 estimatedProviderCost:result.reportIr?.providerUsage?.estimatedProviderCost??null,
 inputTokens:result.reportIr?.providerUsage?.inputTokens??null,
 outputTokens:result.reportIr?.providerUsage?.outputTokens??null,
 authorityDigest:pack.authorityDigest,
 pageCount:pagePlan.pageCount,
 diagramCount:diagrams.diagramCount
},null,2)+'\n');
console.log('PASS ZWR-VFR representative live campaign: providerCalls='+result.providerCalls+'; cacheHit='+result.cacheHit+'; pages=47; diagrams=15.');
