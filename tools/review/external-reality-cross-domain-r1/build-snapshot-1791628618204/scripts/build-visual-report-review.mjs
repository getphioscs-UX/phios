import {commercialRuntime} from '../functions/pws/commercial/commercial-runtime.js';
import fs from 'node:fs';
import {fullReportFixture} from './lib/ecr-full-report-fixture.mjs';
import {projectEcrVisualReport} from '../functions/ecr-full-report/ecr-visual-report-projection.js';
import {compareVisualReportDepths} from '../functions/canonical-presentation-runtime/visual-report-page-runtime.js';
import {VISUAL_REPORT_PRODUCTS,VISUAL_TEMPLATES,VISUAL_COMPONENTS,VISUAL_REPORT_BUNDLES} from '../functions/canonical-presentation-runtime/visual-report-registry.js';
import {composeGovernedPersonalReading,buildPersonalReadingReportIRv2} from '../functions/personal-reading/personal-reading-composer-v2.js';
import {adaptEcrProductionInput} from '../functions/single-method-reading/ecr-production-adapter.js';
import {bindVisualPagesToReportIRv2} from '../functions/personal-reading/visual-report-page-binding.js';
import {buildBenchmark} from './smr-benchmark-support.mjs';
import {buildMethodMeaningPayloadV2,buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {buildNumIntegratedReadingIR} from '../functions/num-full-production/num-integrated-reading-runtime.js';
import {adaptAcceptedMethodReadingEnvelope} from '../functions/single-method-reading/method-production-adapter-core.js';
import {projectNumVisualReport} from '../functions/personal-reading/num-visual-report-projection.js';
import {buildAstCustomerWorkspaceCandidate} from '../functions/ast-full-production/ast-customer-reading-production.js';
import {projectAstVisualReport} from '../functions/personal-reading/ast-visual-report-projection.js';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {projectBaziVisualReport} from '../functions/personal-reading/bazi-visual-report-projection.js';
const root='docs/visual-report-r1';fs.mkdirSync(`${root}/cases`,{recursive:true});
const write=(path,x)=>fs.writeFileSync(`${root}/${path}`,JSON.stringify(x,null,2)+'\n');
const cases=[];
const sectionRegistry=JSON.parse(fs.readFileSync('content/personal-reading/governed/registries/personal-reading-section-registry-v2.json'));
const compositionRules=JSON.parse(fs.readFileSync('content/personal-reading/governed/registries/personal-reading-composition-rule-registry-v2.json'));
for(const index of [0,7,16,31,48,63])for(const locale of ['en','zh-Hans']) {
 const fixture=await fullReportFixture(index,locale),freeReport=fixture.report(false),paidReport=fixture.report(true);
 const governedReading=await composeGovernedPersonalReading({methodReadings:[adaptEcrProductionInput(fixture.acceptedReading)],sectionRegistry,compositionRules,locale,generatedAt:'2026-09-17T00:00:00.000Z'});
 const personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
 const project=report=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:report.lineage.semanticDigest,visualReport:projectEcrVisualReport({report,mandalaProjection:fixture.mandalaProjection,reviewMode:true})});
 const free=project(freeReport),paid=project(paidReport);
 const caseId=`ECR-${String(index+1).padStart(2,'0')}-${locale}`;
 write(`cases/${caseId}.json`,{caseId,synthetic:true,personalReadingReport,free,paid,freeProduct:fixture.product(freeReport),paidProduct:fixture.product(paidReport),comparison:compareVisualReportDepths(free,paid)});
 cases.push({caseId,methodId:'ECR',locale,path:`cases/${caseId}.json`,humanReview:'PENDING'});
}
const inherited=JSON.parse(fs.readFileSync('docs/ecr-full-r1/context-review/cases.json')).cases;
const chosen=new Set();
for(const entry of inherited){
 const key=`${entry.focus}:${entry.locale}`;if(chosen.has(key))continue;chosen.add(key);
 const source=JSON.parse(fs.readFileSync(`docs/ecr-full-r1/context-review/${entry.fixture}`)),paidReport=source.paid.sourceProduct.fullReport,freeReport=source.free.sourceProduct.fullReport;
 const mandalaProjection=source.paid.visuals.find(x=>x.type==='ECR_PHI_MANDALA_V1').payload;
 const index=(Number(entry.caseId.match(/(\d+)$/)[1])-1)%64,fixture=await fullReportFixture(index,entry.locale);
 const governedReading=await composeGovernedPersonalReading({methodReadings:[adaptEcrProductionInput(fixture.acceptedReading)],currentRealityObservation:source.evidence,realityComparison:source.comparison,sectionRegistry,compositionRules,locale:entry.locale,generatedAt:'2026-09-17T00:00:00.000Z'});
 const personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
 const project=report=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:report.lineage.semanticDigest,visualReport:projectEcrVisualReport({report,mandalaProjection,observationIr:source.evidence,reviewMode:true})});
 const free=project(freeReport),paid=project(paidReport),caseId=`${entry.caseId}-${entry.locale}`;
 write(`cases/${caseId}.json`,{caseId,synthetic:true,focus:entry.focus,personalReadingReport,free,paid,freeProduct:source.free,paidProduct:source.paid,comparison:compareVisualReportDepths(free,paid)});
 cases.push({caseId,methodId:'ECR',locale:entry.locale,path:`cases/${caseId}.json`,humanReview:'PENDING',focus:entry.focus});
}
const num=await buildBenchmark('NUM');
for(const locale of ['en','zh-Hans']){
 const payload=await buildMethodMeaningPayloadV2({canonicalProjection:num.projection,locale});
 const reading=buildNumIntegratedReadingIR({projection:num.projection,bundle:payload.meaningBundle,localeProjection:payload.localeProjection});
 const methodReading=adaptAcceptedMethodReadingEnvelope(await buildAcceptedMethodCustomerResult({canonicalProjection:num.projection,locale}),{expectedMethodId:'NUM'});
 const governedReading=await composeGovernedPersonalReading({methodReadings:[methodReading],sectionRegistry,compositionRules,locale,generatedAt:'2026-09-17T00:00:00.000Z'}),personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
 const project=depth=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:methodReading.semanticDigest,visualReport:projectNumVisualReport({reading,depth,reviewMode:true})});
 const free=project('FREE'),paid=project('PAID'),caseId=`NUM-01-${locale}`;
 write(`cases/${caseId}.json`,{caseId,synthetic:true,personalReadingReport,sourceReading:reading,free,paid,comparison:compareVisualReportDepths(free,paid)});cases.push({caseId,methodId:'NUM',locale,path:`cases/${caseId}.json`,humanReview:'PENDING'});
}
const astFixture={inputProjection:(await buildBenchmark('AST')).projection};
for(const locale of ['en','zh-Hans']){
 const source=await buildAstCustomerWorkspaceCandidate({canonicalProjection:astFixture.inputProjection,locale,rawIntent:'work role direction'});
 const methodReading=adaptAcceptedMethodReadingEnvelope(await buildAcceptedMethodCustomerResult({canonicalProjection:astFixture.inputProjection,locale}),{expectedMethodId:'AST'});
 const governedReading=await composeGovernedPersonalReading({methodReadings:[methodReading],sectionRegistry,compositionRules,locale,generatedAt:'2026-09-17T00:00:00.000Z'}),personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
 const project=depth=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:methodReading.semanticDigest,visualReport:projectAstVisualReport({projection:source.customerProductProjection,depth,reviewMode:true})});
 const free=project('FREE'),paid=project('PAID'),caseId=`AST-01-${locale}`;
 write(`cases/${caseId}.json`,{caseId,synthetic:true,personalReadingReport,sourceProjection:source.customerProductProjection,free,paid,comparison:compareVisualReportDepths(free,paid)});cases.push({caseId,methodId:'AST',locale,path:`cases/${caseId}.json`,humanReview:'PENDING'});
}
const bzr=await buildBenchmark('BZR');
for(const locale of ['en','zh-Hans']){
 const reading=await buildBaziMethodNativeReading({canonicalProjection:bzr.projection,locale});
 const methodReading=adaptAcceptedMethodReadingEnvelope(await buildAcceptedMethodCustomerResult({canonicalProjection:bzr.projection,locale}),{expectedMethodId:'BZR'});
 const governedReading=await composeGovernedPersonalReading({methodReadings:[methodReading],sectionRegistry,compositionRules,locale,generatedAt:'2026-09-17T00:00:00.000Z'}),personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
 const project=depth=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:methodReading.semanticDigest,visualReport:projectBaziVisualReport({reading,locale,depth,reviewMode:true})});
 const free=project('FREE'),paid=project('PAID'),caseId=`BZR-01-${locale}`;
 write(`cases/${caseId}.json`,{caseId,synthetic:true,personalReadingReport,sourceReading:reading,free,paid,comparison:compareVisualReportDepths(free,paid)});cases.push({caseId,methodId:'BZR',locale,path:`cases/${caseId}.json`,humanReview:'PENDING'});
}
const {loadPhase9ZiweiCases,buildPhase9ZiweiCase}=await import('./lib/pvp-phase9-ziwei-fixture.mjs');
const {projectZiweiVisualReport}=await import('../functions/personal-reading/ziwei-visual-report-projection.js');
for(const locale of ['en','zh-Hans']){
 const seed=structuredClone(loadPhase9ZiweiCases()[0]);seed.input.locale=locale;const source=await buildPhase9ZiweiCase(seed);
 const methodReading=adaptAcceptedMethodReadingEnvelope(await buildAcceptedMethodCustomerResult({canonicalProjection:source.full.canonicalProjection,locale}),{expectedMethodId:'ZWR'});
 const governedReading=await composeGovernedPersonalReading({methodReadings:[methodReading],sectionRegistry,compositionRules,locale,generatedAt:'2026-09-17T00:00:00.000Z'}),personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
 const project=depth=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:methodReading.semanticDigest,visualReport:projectZiweiVisualReport({projection:source.projection,depth,reviewMode:true})});
 const free=project('FREE'),paid=project('PAID'),caseId=`ZWR-01-${locale}`;
 write(`cases/${caseId}.json`,{caseId,synthetic:true,personalReadingReport,sourceProjection:source.projection,free,paid,comparison:compareVisualReportDepths(free,paid)});cases.push({caseId,methodId:'ZWR',locale,path:`cases/${caseId}.json`,humanReview:'PENDING'});
}
const {visualHdFixture}=await import('./lib/visual-hd-fixture.mjs');
const {projectHdVisualReport,adaptHdVisualParent}=await import('../functions/personal-reading/hd-visual-report-projection.js');
const {visualProfileFixtures}=await import('./lib/visual-profile-fixtures.mjs');
const {projectProfileVisualReport}=await import('../functions/personal-reading/profile-visual-report-projection.js');
const {buildCrossPerspectiveInputIR}=await import('../functions/runtime-reading/cross-perspective-input-ir.js');
const {buildSemanticEvidenceMatrix}=await import('../functions/runtime-reading/semantic-evidence-matrix.js');
const {buildCrossMethodRuntimeReadingIRv2}=await import('../functions/runtime-reading/cross-method-reading-ir-v2.js');
const {projectCrossVisualReport}=await import('../functions/personal-reading/cross-visual-report-projection.js');
for(const locale of ['en','zh-Hans']){
 const product=await visualHdFixture(locale),methodReading=adaptHdVisualParent(product);
 const governedReading=await composeGovernedPersonalReading({methodReadings:[methodReading],sectionRegistry,compositionRules,locale,generatedAt:'2026-09-17T00:00:00.000Z'}),personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
 const project=depth=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:methodReading.semanticDigest,visualReport:projectHdVisualReport({product,depth,reviewMode:true})});
 const free=project('FREE'),paid=project('PAID'),caseId=`HD-01-${locale}`;
 write(`cases/${caseId}.json`,{caseId,synthetic:true,personalReadingReport,sourceProduct:product,free,paid,comparison:compareVisualReportDepths(free,paid)});cases.push({caseId,methodId:'HD',locale,path:`cases/${caseId}.json`,humanReview:'PENDING'});
 let index=0;
 for(const source of await visualProfileFixtures(locale)){
  const governedReading=await composeGovernedPersonalReading({profileSignals:source.signals,profileProductionAdmission:JSON.parse(fs.readFileSync('content/profile/acceptance/profile-prf-w12-production-admission-v1.json')),sectionRegistry,compositionRules,locale,generatedAt:'2026-09-17T00:00:00.000Z'}),personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
  const project=depth=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:source.view.semanticDigest,visualReport:projectProfileVisualReport({view:source.view,locale,depth,reviewMode:true})});
  const free=project('FREE'),paid=project('PAID'),caseId=`PROFILE-${String(++index).padStart(2,'0')}-${locale}`;
  write(`cases/${caseId}.json`,{caseId,synthetic:true,entryMode:source.mode,personalReadingReport,sourceReading:source.view,free,paid,comparison:compareVisualReportDepths(free,paid)});cases.push({caseId,methodId:'PROFILE',entryMode:source.mode,locale,path:`cases/${caseId}.json`,humanReview:'PENDING'});
 }
}
const crossSeeds=[];for(const id of ['AST','BZR','ZWR','NUM','ECR'])crossSeeds.push(await buildBenchmark(id));
const {maybeBuildProductionCombinedReading}=await import('../functions/runtime-reading/cross-reading-production.js');
const {buildCustomerClaimIR}=await import('../functions/single-method-reading/customer-claim-ir.js');
for(const locale of ['en','zh-Hans']){
 const methodResults=[];for(const seed of crossSeeds)methodResults.push(await buildAcceptedMethodCustomerResult({canonicalProjection:seed.projection,locale}));
 const methodReadings=methodResults.map(r=>adaptAcceptedMethodReadingEnvelope(r,{expectedMethodId:r.methodId}));
 const claimCollections=methodReadings.map(e=>buildCustomerClaimIR({acceptedMethodReadingEnvelope:e,customerIntent:null}));
 const crossInput=await buildCrossPerspectiveInputIR({acceptedMethodReadingEnvelopes:methodReadings,claimCollections});
 const semanticMatrix=await buildSemanticEvidenceMatrix(crossInput),crossReading=await maybeBuildProductionCombinedReading({acceptedMethodReadings:methodResults});
 if(crossReading.semanticMatrixDigest!==semanticMatrix.matrixDigest)throw Error('CROSS_REVIEW_MATRIX_MISMATCH');
 const governedReading=await composeGovernedPersonalReading({methodReadings,crossPerspective:crossReading,sectionRegistry,compositionRules,locale,generatedAt:'2026-09-17T00:00:00.000Z'}),personalReadingReport=await buildPersonalReadingReportIRv2({governedReading});
 const project=depth=>bindVisualPagesToReportIRv2({personalReadingReport,sourceSemanticDigest:crossReading.readingDigest,visualReport:projectCrossVisualReport({reading:crossReading,crossInput,locale,depth,reviewMode:true})});
 const free=project('FREE'),paid=project('PAID'),caseId=`CROSS-01-${locale}`;
 write(`cases/${caseId}.json`,{caseId,synthetic:true,personalReadingReport,sourceReading:crossReading,sourceInput:crossInput,semanticMatrix,free,paid,comparison:compareVisualReportDepths(free,paid)});cases.push({caseId,methodId:'CROSS',locale,path:`cases/${caseId}.json`,humanReview:'PENDING'});
}
write('cases.json',{baseline:'013d3aa6e9d09ab079d0696a5d0b15905fac0783',predecessorHumanReview:'REJECTED',humanReview:'PENDING',productionAdmission:false,cases});
write('presentation-registry.json',{owner:'CANONICAL_PRESENTATION_RUNTIME',templates:VISUAL_TEMPLATES,components:VISUAL_COMPONENTS,products:VISUAL_REPORT_PRODUCTS,bundles:VISUAL_REPORT_BUNDLES});
console.log(`Built ${cases.length} visual review cases, paired Free/Paid. Human review PENDING; production CLOSED.`);

write('commerce-catalog.json',commercialRuntime.projectReportCatalog());
