import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fullReportFixture} from './lib/ecr-full-report-fixture.mjs';
import {projectEcrVisualReport} from '../functions/ecr-full-report/ecr-visual-report-projection.js';
import {compareVisualReportDepths,createVisualPage} from '../functions/canonical-presentation-runtime/visual-report-page-runtime.js';
import {VISUAL_REPORT_PRODUCTS,VISUAL_REPORT_BUNDLES,VISUAL_TEMPLATES,VISUAL_COMPONENTS} from '../functions/canonical-presentation-runtime/visual-report-registry.js';
import {composeVisualMicrocopy,verifyVisualMicrocopy} from '../functions/personal-reading/narrative/visual-report-microcopy.js';
import {renderEcrProduct} from '../assets/customer-ui/js/specialists/ecr/product-renderer.js';
assert.equal(VISUAL_REPORT_PRODUCTS.length,8);assert.equal(VISUAL_REPORT_BUNDLES.length,3);assert.equal(Object.keys(VISUAL_TEMPLATES).length,16);assert.equal(VISUAL_COMPONENTS.length,21);
assert(VISUAL_REPORT_PRODUCTS.every(x=>!x.customerPublishable));assert(VISUAL_REPORT_BUNDLES.every(x=>!x.checkoutEnabled&&!x.createsCrossReading&&x.eligibleProductIds.length===6));
const results=[];let first;
for(let i=0;i<64;i++)for(const locale of ['en','zh-Hans']){
 const f=await fullReportFixture(i,locale),before=JSON.stringify(f.mandalaProjection),freeReport=f.report(false),paidReport=f.report(true);
 const free=projectEcrVisualReport({report:freeReport,mandalaProjection:f.mandalaProjection,reviewMode:true}),paid=projectEcrVisualReport({report:paidReport,mandalaProjection:f.mandalaProjection,reviewMode:true});
 assert.equal(free.pages.length,2);assert.equal(paid.pages.length,11);assert.equal(free.pages[1].navigationPrompt.sourceRef,`${freeReport.phiCardIds[0]}#observationPrompt`);
 assert(paid.pages.every(x=>x.insights.length<=3&&x.quality.densityState==='WITHIN_MAXIMUM'));
 assert.equal(before,JSON.stringify(f.mandalaProjection));assert.equal(compareVisualReportDepths(free,paid).informationGain,true);
 assert.equal(compareVisualReportDepths(free,free).informationGain,false);
 assert.equal(compareVisualReportDepths(free,{...free,pages:free.pages.map(p=>({...p,informationUnitRefs:['invented-paid-value']}))}).informationGain,false);
 const padded={...free,pages:free.pages.map(x=>({...x,title:x.title+' Expanded',insights:[...x.insights,{text:'Longer filler'}]}))};assert.equal(compareVisualReportDepths(free,padded).informationGain,false);
 assert.throws(()=>compareVisualReportDepths(free,{...paid,identity:{wrong:true}}),/IDENTITY_MISMATCH/);
 assert.throws(()=>projectEcrVisualReport({report:paidReport,mandalaProjection:f.mandalaProjection}),/REVIEW_ONLY/);
 assert.throws(()=>projectEcrVisualReport({report:paidReport,mandalaProjection:{...f.mandalaProjection,sourceProjectionId:'wrong'},reviewMode:true}),/SOURCE_MISMATCH/);
 const html=renderEcrProduct({product:f.product(paidReport),visualReport:paid}).readingHtml;assert.equal((html.match(/data-page-id=/g)||[]).length,11);assert(html.includes('data-ecr-phi-mandala="true"'));
 assert.throws(()=>renderEcrProduct({product:f.product(freeReport),visualReport:paid}),/REVIEW_BINDING_REQUIRED/);
 results.push({case:i,locale,pages:paid.pages.length,status:'PASS'});first||=paid.pages[3];
}
assert.throws(()=>createVisualPage({...first,visual:{...first.visual,type:'BOGUS'}}),/TEMPLATE_VISUAL_MISMATCH/);
assert.throws(()=>createVisualPage({...first,evidenceRefs:[]}),/BINDING_REQUIRED/);
const allowed=first.insights.map(({text,sourceRef})=>({text,sourceRef}));
assert.equal(verifyVisualMicrocopy({slots:[{sourceRef:allowed[0].sourceRef,text:'You will become rich in 2027.'}]},allowed,'en'),false);
assert.equal(verifyVisualMicrocopy({slots:[{sourceRef:'invented',text:allowed[0].text}]},allowed,'en'),false);
let calls=0;const mock=async(_url,options)=>{calls++;assert.equal(JSON.parse(options.body).store,false);return new Response(JSON.stringify({output_text:JSON.stringify({slots:allowed}),usage:{input_tokens:10,output_tokens:10}}));};
const registry={models:[{status:'AVAILABLE',capabilityClass:'LIGHT',providerId:'openai',modelId:'mock-light',planningCostRank:1}]};
const cache=new Map(),args={page:first,allowedStatements:allowed,registry,env:{OPENAI_API_KEY:'synthetic-test-key'},fetcher:mock,cache};
assert.equal((await composeVisualMicrocopy(args)).providerCalls,0);assert.equal(calls,0);
const composed=await composeVisualMicrocopy({...args,aiExecutionClass:'T2_LIGHT_COMPOSITION'});assert.equal(composed.disposition,'VERIFIED_EXTRACTIVE_COMPOSITION');assert.equal(calls,1);
assert.equal((await composeVisualMicrocopy({...args,aiExecutionClass:'T2_LIGHT_COMPOSITION'})).cacheHit,true);assert.equal(calls,1);
const failed=await composeVisualMicrocopy({...args,cache:null,aiExecutionClass:'T2_LIGHT_COMPOSITION',fetcher:async()=>new Response(JSON.stringify({output_text:'{"slots":[{"sourceRef":"invented","text":"unsupported"}]}'}))});assert.equal(failed.disposition,'CANONICAL_FALLBACK');
await assert.rejects(()=>composeVisualMicrocopy({...args,aiExecutionClass:'T3_DEEP_COMPOSITION'}),/T3_CROSS_ONLY/);
const timed=await composeVisualMicrocopy({...args,cache:null,timeoutMs:5,aiExecutionClass:'T2_LIGHT_COMPOSITION',fetcher:(_url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('ABORTED')),{once:true}))});assert.equal(timed.disposition,'CANONICAL_FALLBACK');assert.equal(timed.providerCalls,1);
assert.equal(verifyVisualMicrocopy({slots:[{sourceRef:allowed[0].sourceRef,text:'新增人格百分比 99%'}]},allowed,'zh-Hans'),false);

const contexts=JSON.parse(fs.readFileSync('docs/ecr-full-r1/context-review/cases.json')).cases;
for(const c of contexts){const data=JSON.parse(fs.readFileSync(`docs/ecr-full-r1/context-review/${c.fixture}`)),report=data.paid.sourceProduct.fullReport,p=data.paid.visuals.find(x=>x.type==='ECR_PHI_MANDALA_V1').payload;
 const missing=projectEcrVisualReport({report,mandalaProjection:p,reviewMode:true});assert.equal(missing.pages.length,11);
 const present=projectEcrVisualReport({report,mandalaProjection:p,observationIr:data.evidence,reviewMode:true});assert(present.pages.length>11);assert(present.conditionalSections.every(x=>x.state==='REVIEW_CANDIDATE'));
}
const {bindVisualPagesToReportIRv2}=await import('../functions/personal-reading/visual-report-page-binding.js');
const {projectNumVisualReport}=await import('../functions/personal-reading/num-visual-report-projection.js');
const {projectAstVisualReport}=await import('../functions/personal-reading/ast-visual-report-projection.js');
const {projectBaziVisualReport}=await import('../functions/personal-reading/bazi-visual-report-projection.js');
const {projectZiweiVisualReport}=await import('../functions/personal-reading/ziwei-visual-report-projection.js');
const {projectHdVisualReport}=await import('../functions/personal-reading/hd-visual-report-projection.js');
const {projectProfileVisualReport}=await import('../functions/personal-reading/profile-visual-report-projection.js');
const {projectCrossVisualReport}=await import('../functions/personal-reading/cross-visual-report-projection.js');
const {renderQuantitativeVisual}=await import('../assets/customer-ui/js/personal-products/visual-report-quantitative.js');
const manifest=JSON.parse(fs.readFileSync('docs/visual-report-r1/cases.json')),methodResults=[];
for(const c of manifest.cases.filter(c=>c.methodId!=='ECR')){
 const d=JSON.parse(fs.readFileSync(`docs/visual-report-r1/${c.path}`)),before=JSON.stringify(d),reports=[];
 for(const depth of ['FREE','PAID']){
  const args={depth,locale:c.locale,reviewMode:true};
  const report=c.methodId==='NUM'?projectNumVisualReport({...args,reading:d.sourceReading}):c.methodId==='BZR'?projectBaziVisualReport({...args,reading:d.sourceReading}):c.methodId==='AST'?projectAstVisualReport({...args,projection:d.sourceProjection}):c.methodId==='ZWR'?projectZiweiVisualReport({...args,projection:d.sourceProjection}):c.methodId==='HD'?projectHdVisualReport({...args,product:d.sourceProduct}):c.methodId==='PROFILE'?projectProfileVisualReport({...args,view:d.sourceReading}):projectCrossVisualReport({...args,reading:d.sourceReading,crossInput:d.sourceInput});
  assert(report.pages.length>0);assert(report.pages.every(p=>p.quality.densityState==='WITHIN_MAXIMUM'&&p.insights.length<=3&&p.evidenceRefs.length));
  const expected=d[depth.toLowerCase()],bound=bindVisualPagesToReportIRv2({personalReadingReport:d.personalReadingReport,visualReport:report,sourceSemanticDigest:expected.parent.methodSemanticDigest});assert.deepEqual(bound,expected);
  assert.throws(()=>bindVisualPagesToReportIRv2({personalReadingReport:{...d.personalReadingReport,locale:'invalid'},visualReport:report,sourceSemanticDigest:expected.parent.methodSemanticDigest}),/LOCALE_MISMATCH/);
  assert.throws(()=>bindVisualPagesToReportIRv2({personalReadingReport:d.personalReadingReport,visualReport:report,sourceSemanticDigest:'unbound'}),/DIGEST_MISMATCH/);
  reports.push(report);
 }
 assert.equal(JSON.stringify(d),before);assert(compareVisualReportDepths(...reports).freeClaimsSubset);assert(compareVisualReportDepths(...reports).informationGain);methodResults.push({caseId:c.caseId,methodId:c.methodId,locale:c.locale,entryMode:c.entryMode,freePages:reports[0].pages.length,paidPages:reports[1].pages.length,status:'PASS'});
}
for(const type of ['DONUT','DISTRIBUTION_RING','STACKED_BAR']){assert.throws(()=>renderQuantitativeVisual({type,nodes:[{value:2}]}),/SOURCE_UNIT/);assert.match(renderQuantitativeVisual({type,unit:'source count',comparableWithinSource:true,nodes:[{label:'A',value:2},{label:'B',value:3}]}),/<svg/);}
for(const type of ['SCATTER','SPARKLINE']){assert.throws(()=>renderQuantitativeVisual({type,nodes:[{value:2}]}),/COORDINATES/);assert.match(renderQuantitativeVisual({type,xUnit:'year',yUnit:'source value',nodes:[{label:'A',x:1,y:2},{label:'B',x:2,y:3}]}),/<svg/);}
for(const type of ['MATRIX','HEATMAP'])assert.match(renderQuantitativeVisual({type,unit:'count',comparableWithinSource:true,nodes:[{rowLabel:'A',columnLabel:'B',value:2}]}),/<table/);
const result={work:'VRPT-R1',scope:'Source-bound candidate checks; not paid-product human acceptance or full blueprint completion',ecrExecutions:results.length,contextExecutions:contexts.length,otherMethodCases:methodResults.length,microcopy:'MOCK_PROVIDER_ONLY',humanReview:'PENDING',productionAdmission:false,results,methodResults};fs.writeFileSync('docs/visual-report-r1/machine-results.json',JSON.stringify(result,null,2)+'\n');console.log(`PASS VRPT focused checks: ${results.length} bilingual ECR executions, ${contexts.length} inherited context fixtures, ${methodResults.length} other-method source-bound pairs; no production promotion.`);
