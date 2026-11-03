const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/phios',w=root+'/.worktrees/five-method-paid-report-production-r1',out=__dirname;
const esbuild=require(root+'/node_modules/esbuild');
const baseline=JSON.parse(fs.readFileSync(out+'/BASELINE.json'));
// Preserve original newline convention: edits must not reformat entire composers.
for(const f of baseline.files){const p=w+'/'+f.path,b=fs.readFileSync(out+'/baseline/'+f.path,'utf8');let s=fs.readFileSync(p,'utf8');if(b.includes('\r\n'))s=s.replace(/\r?\n/g,'\r\n');fs.writeFileSync(p,s);}
const local=w+'/tools/review/six-method-automatic-paid-report-closure-r1';fs.mkdirSync(local,{recursive:true});
function bundle(source,name,resolveDir=w){esbuild.buildSync({stdin:{contents:source,resolveDir,sourcefile:name+'.js'},bundle:true,platform:'node',format:'cjs',outfile:local+'/'+name+'.cjs',logLevel:'silent'});return require(local+'/'+name+'.cjs');}
const capability='functions/report-delivery/paid-report-production-capabilities.js';
const before=bundle(fs.readFileSync(out+'/baseline/'+capability,'utf8'),'before',path.dirname(w+'/'+capability));
const after=bundle(`export * from './${capability}';`,'after');
const pricing=bundle(`export * from './functions/personal-reading/narrative/ziwei-r5-provider-registry.js';export {estimatePaiProviderCost} from './functions/_lib/pai-r1-economics.js';export {planZwrFiveCallExperiment} from './functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js';export {assertReportProviderAccess} from './functions/personal-reading/report-provider-access.js';`,'pricing');
const rows=[];function check(name,fn){try{const details=fn();rows.push({name,status:'PASS',details});}catch(e){rows.push({name,status:'FAIL',error:e.message});}}
function eq(a,b){if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Mismatch: '+JSON.stringify([a,b]));}
let networkCalls=0;globalThis.fetch=()=>{networkCalls++;throw Error('NETWORK_FORBIDDEN');};
check('ECR prepayment gap reproduced and closed',()=>{eq(before.fiveMethodReportCapability('COM-REPORT-ECR-FULL'),null);const c=after.fiveMethodReportCapability('COM-REPORT-ECR-FULL',{PHIOS_SHARED_PAID_REPORT_ENABLED:'true'});eq(c.blockedReason,'SHARED_ADAPTER_ABSENT');eq(c.admitted,false);return c;});
for(const enabled of ['true','false'])check('ECR setup denies before charge: '+enabled,()=>{try{after.requireFiveMethodReportSetup('COM-REPORT-ECR-FULL',{PHIOS_SHARED_PAID_REPORT_ENABLED:enabled});}catch(e){eq(e.code,'SHARED_ADAPTER_ABSENT');eq(e.status,409);return e.code;}throw Error('Unexpected admission');});
for(const method of ['BAZI','ZIWEI','ASTROLOGY','NUMEROLOGY','HD'])check(method+' existing capability unchanged',()=>{const id='COM-REPORT-'+method+'-FULL';eq(after.fiveMethodReportCapability(id),before.fiveMethodReportCapability(id));return true;});
const model=pricing.ZIWEI_R5_PAI_REGISTRY.models[0],tier=pricing.ziweiR5PricingForInput;
check('short context inclusive boundary and cached rate',()=>{eq(tier(model,272000),model);eq(Number(pricing.estimatePaiProviderCost(model,{inputTokens:100000,cachedInputTokens:50000,outputTokens:10000})),.42);return {input:4,cached:.4,output:20};});
check('long context full request pricing',()=>{const m=tier(model,272001);eq([m.inputPricePerMillion,m.cachedInputPricePerMillion,m.outputPricePerMillion],[8,.8,30]);eq(Number(pricing.estimatePaiProviderCost(m,{inputTokens:300000,cachedInputTokens:100000,outputTokens:10000})),1.98);return true;});
check('invalid token counts rejected',()=>{for(const n of [-1,1.5,NaN,Infinity]){let denied=false;try{tier(model,n);}catch{denied=true;}eq(denied,true);}return true;});
check('durable paid context remains mandatory',()=>{for(const env of [{},{OPENAI_API_KEY:'NOT_A_KEY',REPORT_PROVIDER_LIVE_ALLOWED:'true'}]){try{pricing.assertReportProviderAccess({env});}catch(e){eq(e.code,'PAID_REPORT_DURABLE_BUDGET_CONTEXT_REQUIRED');continue;}throw Error('Bypass');}return true;});
check('free access remains denied',()=>{try{pricing.assertReportProviderAccess({accessTier:'FREE'});}catch(e){eq(e.code,'FREE_REPORT_PROVIDER_FORBIDDEN');return true;}throw Error('Bypass');});
check('existing five-call plan repriced without budget increase',()=>{const pack=JSON.parse(fs.readFileSync(w+'/docs/reports/ziwei/vfr-r1/COMPACT-AUTHORING-PACK.json'));const plan=pricing.planZwrFiveCallExperiment({pack});eq(plan.budgetLimitUsd,1);eq(plan.providerCallsPlanned,5);eq(plan.model,'gpt-5.6-sol');const oldEstimate=plan.batches.reduce((a,b)=>a+Number(pricing.estimatePaiProviderCost({...model,inputPricePerMillion:2.5,cachedInputPricePerMillion:.25,outputPricePerMillion:15},{inputTokens:b.inputTokens,outputTokens:b.maxOutputTokens})),0);return {plan,previousPlanningEstimateUsd:oldEstimate};});
for(const file of ['functions/personal-reading/visual-first/ziwei-vfr-one-call-composer.js','functions/personal-reading/visual-first/ziwei-vfr-targeted-repair.js','functions/commerce/commerce-stripe-api.js'])check('targeted bundle: '+file,()=>{bundle(`export * from './${file}';`,'compile-'+path.basename(file));return true;});
check('zero network calls',()=>{eq(networkCalls,0);return 0;});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const result={scope:'Isolated Report workspace targeted zero-cost QA; not Cloud, Stripe E2E or customer acceptance',rows,passed:rows.filter(r=>r.status==='PASS').length,failed:rows.filter(r=>r.status==='FAIL').length,networkCalls,paidProviderCalls:0,newPdfRenders:0,files:baseline.files.map(f=>({path:f.path,beforeSHA256:f.sha256,afterSHA256:hash(w+'/'+f.path)}))};fs.writeFileSync(out+'/TARGETED-ZERO-COST-QA.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
