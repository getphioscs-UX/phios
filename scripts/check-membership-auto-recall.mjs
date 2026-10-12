import fs from 'node:fs';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
const dir='tools/review/membership-ask-credit-r1',sha=x=>createHash('sha256').update(x).digest('hex');
const setup=fs.readFileSync('scripts/prepare-membership-delivery-source-extension.mjs','utf8').split('const questions=')[0].replaceAll('.tmp/member-delivery-source-extension.mjs','.tmp/member-auto-source-api.mjs');fs.writeFileSync('.tmp/member-auto-source-setup.mjs',setup+'\nexport {api,env,manifest};');
const api=await import(pathToFileURL(process.cwd()+'/.tmp/member-auto-source-setup.mjs'));
const questions=[{id:'REGRESSION-VII',q:'观察不到一个对象时，可以据此断定它不存在吗？',expected:'14.86',role:'REGRESSION'},{id:'REGRESSION-SECOND',q:'仅凭未观察到，就能断言某种事物不存在吗？',expected:'14.86',role:'DEVELOPMENT_FAILURE_REGRESSION'},
{id:'HOLDOUT-A',q:'是否能够从未观察到直接推断不存在？',expected:'14.86',role:'NEW_AFTER_RULE_FREEZE'},
{id:'HOLDOUT-B',q:'观测不到一种事物，能据此认定它不存在吗？',expected:'14.86',role:'NEW_AFTER_RULE_FREEZE'},
{id:'HOLDOUT-C',q:'没有观察到战争，可以保证明天不会爆发战争吗？',expected:null,role:'UNSUPPORTED_PREDICTION_CONTROL'}];
const frozenInputs=['functions/knowledge-runtime/manuscript-source-runtime.js','functions/knowledge-runtime/source-bound-explanation-units.js'].map(path=>({path,sha256:sha(fs.readFileSync(path))})),results=[];
for(const row of questions){const r=await api.api.prepare(api.env,api.manifest,{q:row.q,locale:'zh-Hans',bookCode:'BOOK-7'});results.push({...row,actualCandidates:r.candidates,pack:r.pack,errors:r.errors,state:row.expected?(r.pack.sources[0]?.chapterId===row.expected?'PASS_RETRIEVAL_ONLY':'FAIL'):r.pack.sources.length===0?'PASS_SOURCE_INSUFFICIENT':'NEEDS_RELEVANCE_REVIEW',providerCalls:0});}
for(const d of frozenInputs)if(sha(fs.readFileSync(d.path))!==d.sha256)throw Error('INPUT_CHANGED');fs.writeFileSync(dir+'/AUTO-DELIVERY-RECALL-CURRENT.json',JSON.stringify({frozenInputs,oldFailure:'BOOK7-NATURAL-GAP-TRACE.json',developmentFailure:'AUTO-DELIVERY-RECALL.json',results,providerCalls:0,answerQuality:'NOT_EVALUATED_NO_NEW_MODEL_CALL'},null,2)+'\n');console.log(JSON.stringify(results.map(r=>({id:r.id,state:r.state,chapters:r.pack.sources.map(s=>s.chapterId)}))));
