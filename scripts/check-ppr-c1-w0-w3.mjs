import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildBaziMethodNativeReading,normalizeBaziTargetContext} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const BASE='content/customer-experience-rebuild/ppr-c1';
const baseline='3f6825a9b57dc9e62e34fb69bc55d2aac2c39768';

// W0 canonical route authority
const authority=json(`${BASE}/authority/canonical-personal-surface-authority-v1.json`);
assert.equal(authority.baselineCommit,baseline);assert.equal(authority.status,'FROZEN_CANONICAL_CUSTOMER_AUTHORITY');assert.equal(authority.canonicalCustomerSurface.route,'/perspectives/personal/');assert.equal(authority.canonicalCustomerSurface.api,'/api/customer-personal-reality');
const redirects=read('_redirects');
for(const route of ['/personal-runtime','/personal-runtime.html','/professional/personal-runtime','/professional/personal-runtime/'])assert.match(redirects,new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s+/perspectives/personal/\\s+308`),`missing canonical redirect ${route}`);
for(const x of authority.redirectedLegacyRoutes){assert.equal(x.target,'/perspectives/personal/');assert.equal(x.status,308)}
assert.equal(authority.canonicalCustomerSurface.route,'/perspectives/personal/');assert.doesNotMatch(JSON.stringify(authority.canonicalCustomerSurface),/personal-runtime|professional\/personal-runtime/);
const orphan=json(`${BASE}/audit/orphaned-production-runtime-registry-v1.json`);assert.deepEqual(orphan.summary.productionPublishableButCanonicalUnconsumedBeforePprC1,['BZR','NUM']);assert.deepEqual(orphan.summary.releaseGatedNotYetEligible,['ZWR','AST']);assert.equal(orphan.entries.find(x=>x.methodId==='BZR').pprC1State,'CLOSED_BY_W3_METHOD_NATIVE_ADAPTER');assert.equal(orphan.entries.find(x=>x.methodId==='NUM').pprC1State,'OPEN_FOR_FUTURE_NUM_METHOD_NATIVE_ADAPTER');

// W1 only one live JS renderer authority and it knows SMR V2 + method-native products.
const canonicalRenderer='assets/customer-ui/js/surfaces/single-method-reading.js';
const duplicateRenderer='assets/customer-ui/surfaces/single-method-reading.js';
assert.equal(fs.existsSync(canonicalRenderer),true);assert.equal(fs.existsSync(duplicateRenderer),false,'duplicate single-method-reading JS authority must remain absent');
const renderer=read(canonicalRenderer),personalClient=read('assets/customer-ui/js/surfaces/personal-reality.js');assert.match(personalClient,/from '\.\/single-method-reading\.js'/);assert.match(renderer,/PHI-OS-SINGLE-METHOD-READING-PRODUCTION-v2\.0\.0/);assert.match(renderer,/readingIA\?\.sections|readingIA\.sections/);assert.match(renderer,/PHI-OS-METHOD-NATIVE-CUSTOMER-READING-v1\.0\.0/);assert.match(renderer,/nativeReportHtml/);
const liveRendererMatches=[];for(const base of ['assets/customer-ui/js','assets/customer-ui']){if(!fs.existsSync(base))continue;for(const entry of fs.readdirSync(base,{recursive:true})){const p=path.join(base,String(entry));if(p.endsWith('single-method-reading.js')&&fs.existsSync(p)&&fs.statSync(p).isFile())liveRendererMatches.push(p.replaceAll('\\','/'));}}
assert.deepEqual([...new Set(liveRendererMatches)].filter(x=>!x.includes('/history/')), [canonicalRenderer]);

// W2 method-native envelope is a wrapper, not a second interpretation runtime.
const contract=json(`${BASE}/contracts/method-native-customer-reading-contract-v1.json`);assert.equal(contract.baselineCommit,baseline);assert.equal(contract.status,'FROZEN_PRODUCT_ENVELOPE_CONTRACT');for(const field of ['methodId','productVersion','summary','structuralModel','readingSections','temporalContext','openVerdicts','evidence','publicationDecision'])assert(contract.requiredFields.includes(field));assert.equal(contract.boundaries.createsSecondInterpretationRuntime,false);assert.equal(contract.boundaries.recalculatesMethod,false);assert.equal(contract.methodEligibility.BZR.allowed,true);assert.equal(contract.methodEligibility.NUM.allowed,true);assert.equal(contract.methodEligibility.ZWR.allowed,false);assert.equal(contract.methodEligibility.AST.allowed,false);
const productRuntime=read('functions/personal-professional-reading/method-native-reading-product.js');assert.doesNotMatch(productRuntime,/tenGodFor|composeBazi|selectMeanings|createMethodInterpretationCandidate|build.*MeaningCandidate/i);

// W3 BaZi product consumes the frozen BAZI-FP report; no-target timing is visible and no natal recalculation occurs.
const natal=json('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const temporal=json('content/professional/bzr-full-production/fixtures/bazi-liu-nian-interaction-fixture-v1.json').temporalProjection;
assert.equal(normalizeBaziTargetContext(null).state,'UNAVAILABLE');assert.equal(normalizeBaziTargetContext({targetDate:'2054-02-05',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'}}).state,'EXPLICIT');
const noTarget=await buildBaziMethodNativeReading({canonicalProjection:natal,canonicalInput:{birthDate:'1989-11-15'},baseExecution:null,locale:'zh-Hans',targetContext:null});
assert.equal(noTarget.schemaVersion,'PHI-OS-METHOD-NATIVE-CUSTOMER-READING-v1.0.0');assert.equal(noTarget.methodId,'BZR');assert.equal(noTarget.publicationDecision.customerPublishable,true);assert.equal(noTarget.temporalContext.state,'UNAVAILABLE');assert(noTarget.temporalContext.unknownCodes.includes('PPR_C1_BAZI_TARGET_CONTEXT_NOT_SUPPLIED'));assert.equal(noTarget.structuralModel.pillars.length,4);assert.equal(noTarget.readingSections.length,6);assert(noTarget.readingSections.some(x=>x.code==='TIMING'&&x.state==='PARTIAL'));assert.equal(noTarget.governance.natalRecalculatedForTemporal,false);assert.equal(noTarget.governance.noTargetDoesNotInferCurrentDate,true);assert.equal(noTarget.governance.noTargetDoesNotInferBrowserTimezone,true);
const explicit=await buildBaziMethodNativeReading({canonicalProjection:natal,canonicalInput:{birthDate:'1989-11-15'},locale:'zh-Hans',temporalProjectionOverride:temporal});assert.equal(explicit.temporalContext.state,'EXPLICIT');assert.equal(explicit.publicationDecision.customerPublishable,true);assert(explicit.summary.keyPoints.some(x=>x.includes('当前大运')));
const api=read('functions/api/customer-personal-reality.js');assert.match(api,/executeAndProjectMcd5CurrentRequest/);assert.match(api,/spec\.methodCode==='BAZI'/);assert.match(api,/baseExecution=direct\.execution/);assert.match(api,/buildBaziMethodNativeReading/);assert.match(api,/methodNativeReading\.BZR/);assert.match(api,/targetContext:body\?\.baziTemporalContext\|\|null/);assert.match(api,/hasSingleNativeReport/);assert.match(api,/item\.stageId==='FULL_REPORT'/);assert.doesNotMatch(api,/executeBzrTemporalRequest/);
const baziAdapter=read('functions/personal-professional-reading/bazi-method-native-reading-adapter.js');assert.match(baziAdapter,/buildBzrTemporalProjection/);assert.match(baziAdapter,/natalProjection:canonicalProjection,baseExecution/);assert.match(baziAdapter,/noTargetTemporalBoundary/);assert.match(baziAdapter,/natalRecalculatedForTemporal:false/);assert.doesNotMatch(baziAdapter,/executeAndProjectMcd5CurrentRequest|runMethodExecute/);

const acceptance=json(`${BASE}/acceptance/ppr-c1-w0-w3-engineering-acceptance-v1.json`);assert.equal(acceptance.status,'ENGINEERING_COMPLETE');assert.equal(acceptance.gates.baziNatalRecalculatedForTemporal,false);assert.equal(acceptance.nextWork,'PPR-C1-W4｜Retire Legacy BZR Customer Composer');
console.log('✓ PPR-C1 W0–W3 canonical route + renderer authority + method-native contract + BaZi canonical adapter passed.');
console.log('  Canonical customer route: /perspectives/personal/');
console.log('  Live single-method renderer authority: 1');
console.log(`  BaZi no-target: ${noTarget.readingSections.length} W15 sections; timing ${noTarget.temporalContext.state}; ${noTarget.structuralModel.pillars.length} pillars.`);
console.log('  BaZi explicit target path consumes BZR Temporal using the same retained natal execution; no second natal calculation is owned by PPR-C1.');
