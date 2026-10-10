import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { projectRealityForCustomer } from '../functions/customer-projection/reality-customer-projection.js';
import { projectReadoutForCustomer } from '../functions/customer-projection/readout-customer-projection.js';
import { projectNavigationForCustomer } from '../functions/customer-projection/navigation-customer-projection.js';
import { projectMethodsForCustomer } from '../functions/customer-projection/method-customer-projection.js';
import { projectFinancialForCustomer } from '../functions/customer-projection/financial-customer-projection.js';
import { projectKnowledgeAnswerForCustomer } from '../functions/customer-projection/knowledge-customer-projection.js';
import { projectReportForCustomer } from '../functions/customer-projection/report-customer-projection.js';
import { projectContinuityForCustomer } from '../functions/customer-projection/continuity-customer-projection.js';
import { projectProfessionalReviewForCustomer } from '../functions/customer-projection/professional-customer-projection.js';

const root=process.cwd();
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const json=relative=>JSON.parse(read(relative));
const sha=relative=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex');
const base='content/customer-experience-rebuild';
const baseline='3eed6a26db6767cdd270719f58636376fcb29e9a';
const contract=json(`${base}/contracts/customer-projection-adapter-contract-v2.json`);
const registry=json(`${base}/registries/runtime-projection-adapter-registry-v1.json`);
const map=json(`${base}/registries/backend-customer-projection-map-v4.json`);
const acceptance=json(`${base}/acceptance/cx-r20-acceptance-v2.json`);
const audit=json(`${base}/audits/cx-r20-current-main-reconciliation-v1.json`);
const predecessorMap=json(`${base}/registries/backend-customer-projection-map-v3.json`);
const surfaces=json(`${base}/registries/customer-surface-registry-v3.json`);
const shellAcceptance=json(`${base}/acceptance/cx-r5-acceptance-v2.json`);

// Historical CX-R20/R0 evidence remains immutable; R20 current-main reconciliation is a successor, not a rewrite.
assert.equal(sha(`${base}/contracts/customer-projection-adapter-contract-v1.json`),'07d0a1b2723279eb3553dcd8157b2590c153d0df6d9bff503b9727786380776c');
assert.equal(sha(`${base}/acceptance/cx-r20-acceptance-v1.json`),'8663acf108ca3bc4017e75e74b89d5fd6ddcd942bc7d9c237a0a6c7a1595d43c');
assert.equal(sha(`${base}/registries/backend-customer-projection-map-v2.json`),'2f8a4ce09fc37ed41d83dc4530856c667af967591a60de4e121f563a17a2955f');
assert.equal(sha(`${base}/registries/backend-customer-projection-map-v3.json`),'fc46b4bcced7bc0ddd0a6c2313adc5391c65b5ae44e17c0e24d6735cf0ead748');

assert.equal(contract.work,'CX-R20');
assert.equal(contract.executionBaselineCommit,baseline);
assert.equal(contract.status,'CURRENT_MAIN_RECONCILED');
assert.deepEqual(contract.flow,['UPSTREAM_RUNTIME_AUTHORITY_OUTPUT','CUSTOMER_PROJECTION_ADAPTER','IMMUTABLE_CUSTOMER_VIEW_MODEL','CX_CUSTOMER_SURFACE']);
for(const op of ['PRESERVE_UPSTREAM_STATE','PRESERVE_UNKNOWN','PRESERVE_PROVENANCE'])assert.ok(contract.allowedOperations.includes(op));
for(const op of ['CALCULATE','INFER_NEW_FINDING','CHANGE_MEANING','RECOMMEND','CREATE_TRUTH','UPGRADE_AVAILABILITY','CREATE_ENTITLEMENT','CREATE_AUTHENTICATION','CREATE_PROFESSIONAL_JUDGMENT','CREATE_PERSISTENCE'])assert.ok(contract.forbiddenOperations.includes(op));
for(const key of ['backendAuthorityCreated','rawRuntimeProjectedToCxUi','viewModelIsAuthority','routeCutoverPerformedByR20','physicalLegacyDeletePerformedByR20'])assert.equal(contract.rules[key],false,key);
for(const key of ['unknownMustRemainVisible','upstreamAvailabilityMayNotDefaultToAvailable','financialCurrencyMayNotBeInventedByAdapter','methodAvailabilityMustReadUpstreamAuthority','currentFactsRemainSeparateFromCanonicalKnowledge','journeyRemainsProgressAndContinuityProjection','professionalJudgmentMustComeFromProfessionalAuthority','authenticationAndEntitlementRemainUpstream','viewModelsMustBeDeepFrozen'])assert.equal(contract.rules[key],true,key);
assert.deepEqual(contract.priorityProductTranche,['CX-R10_MY_REALITY','CX-R12_PERSONAL_REALITY','CX-R13_FINANCIAL_REALITY','CX-R9-R2_CONTEXTUAL_ASK_PHI_OS']);

assert.equal(predecessorMap.status,'SUCCESSOR_PROJECTION_BOUNDARY_RECONCILED');
assert.equal(predecessorMap.rules.availabilityMustReadUpstreamAuthority,true);
assert.equal(predecessorMap.rules.hardCodeAvailableForbidden,true);
assert.equal(surfaces.surfaceCount,15);
assert.equal(shellAcceptance.requiredExitStates.includes('ONE_GLOBAL_CUSTOMER_SHELL'),true);

assert.equal(registry.executionBaselineCommit,baseline);
assert.equal(registry.status,'CURRENT_MAIN_ADAPTER_REGISTRY_FROZEN');
assert.equal(registry.adapters.length,9);
const ids=new Set();
for(const adapter of registry.adapters){
  assert.equal(ids.has(adapter.adapterId),false,`duplicate adapter ${adapter.adapterId}`);ids.add(adapter.adapterId);
  assert.equal(adapter.state,'ACTIVE_RECONCILED');
  assert.ok(adapter.sourceAuthorities.length>0,adapter.adapterId);
  assert.ok(adapter.customerSurfaces.length>0,adapter.adapterId);
  const relative=`functions/customer-projection/${adapter.file}`;
  assert.ok(fs.existsSync(path.join(root,relative)),`missing ${relative}`);
  const source=read(relative);
  for(const forbidden of ['fetch(', 'localStorage', 'sessionStorage', 'indexedDB', 'WebSocket'])assert.equal(source.includes(forbidden),false,`${adapter.file} may not perform ${forbidden}`);
  assert.ok(source.includes('boundary()'),`${adapter.file} must project common authority boundary`);
  assert.ok(source.includes('sourceLineage('),`${adapter.file} must preserve upstream authority lineage`);
}
for(const required of ['REALITY','READOUT','NAVIGATION','METHODS','FINANCIAL','KNOWLEDGE_ANSWER','REPORT','CONTINUITY','PROFESSIONAL_REVIEW'])assert.ok(ids.has(required),required);

assert.equal(map.executionBaselineCommit,baseline);
assert.equal(map.status,'R20_CURRENT_MAIN_PROJECTION_BOUNDARY_FROZEN');
assert.equal(map.mappings.length,16);
assert.equal(map.rules.cxConsumesOnly,true);
assert.equal(map.rules.createsSecondAuthority,false);
assert.equal(map.rules.availabilityMustReadUpstreamAuthority,true);
assert.equal(map.rules.hardCodeAvailableForbidden,true);
assert.equal(map.rules.unknownMustRemainVisible,true);
assert.equal(map.rules.futureRuntimeMayNotBeSimulated,true);
const financialMapping=map.mappings.find(x=>x.projectionId==='FINANCIAL_REALITY');
assert.deepEqual(financialMapping.backendAuthorities,['FDR','FCR','FAR','HFP','PFR']);
assert.deepEqual(financialMapping.adapterIds,['FINANCIAL']);
const future=map.mappings.filter(x=>x.state==='FUTURE_GATED');
assert.deepEqual(future.map(x=>x.projectionId),['HISTORY','CASE_LEARNING_RESEARCH','VALIDATION_DISCLOSURE','METRICS']);
assert.ok(future.every(x=>x.adapterIds.length===0));
assert.equal(map.priorityCoverage.length,4);
const expectedCoverage={
  'CX-R10':['ICR','RDG','RMO','RRE','JR','RNE','RR'],
  'CX-R12':['MPA','METHOD_RUNTIME','CMR','RRE'],
  'CX-R13':['FDR','FCR','FAR','HFP','PFR'],
  'CX-R9-R2':['CKA','KAP','CURRENT_FACTS_GATEWAY']
};
for(const coverage of map.priorityCoverage){
  assert.deepEqual(coverage.requiredAuthorities,expectedCoverage[coverage.phase],coverage.phase);
  assert.equal(coverage.status,'BOUNDARY_READY_NOT_PRODUCT_ACCEPTED');
  for(const adapterId of coverage.adapterIds)assert.ok(ids.has(adapterId),`${coverage.phase}:${adapterId}`);
}

const expectedBoundary={createsAuthority:false,calculates:false,infersNewFinding:false,changesMeaning:false,recommends:false,createsTruth:false,createsAvailability:false,createsEntitlement:false,createsAuthentication:false,createsProfessionalJudgment:false};
const assertProjection=(projection,schemaSuffix,authorities=[])=>{
  assert.ok(Object.isFrozen(projection),schemaSuffix);
  assert.match(projection.schemaVersion,new RegExp(`:${schemaSuffix}$`));
  for(const [key,value] of Object.entries(expectedBoundary))assert.equal(projection.governance[key],value,`${schemaSuffix}.${key}`);
  assert.equal(projection.governance.authorityPreserved,true,`${schemaSuffix}.authorityPreserved`);
  for(const authority of authorities)assert.ok(projection.governance.sourceAuthorities.includes(authority),`${schemaSuffix}.${authority}`);
};

const reality=projectRealityForCustomer({locale:'zh-Hans',bundle:{schemaVersion:'fixture',bundleId:'bundle-1',sourceType:'ASK',lanes:{userQuestion:'现在发生什么？',reportedContext:['已申报处境'],unknown:['仍未知'],perspectiveReferences:[{projectionId:'projection-1',methodLabel:'视角',realityFact:false}],calculations:[{code:'fixture_value',value:12,professionalJudgment:false}],findings:[{findingCode:'fixture_finding',summary:'结构发现',recommendation:false}]},classification:{perspectivesRemainPerspectives:true,calculationsRemainCalculations:true,findingsRemainFindings:true},governance:{persisted:false,canonicalRealityCreated:false}},reading:{summary:'Reading without upstream state'}});
assertProjection(reality,'MY_REALITY',['ICR','RDG','RMO','RRE','JR','RNE','RR']);
assert.equal(reality.locale,'zh-Hans');
assert.deepEqual(reality.currentReality.unknown,['仍未知']);
assert.equal(reality.reading.state,'UNKNOWN');
assert.equal(reality.perspectives.items[0].realityFact,false);
assert.equal(reality.currentReality.calculations[0].value,12);

const readout=projectReadoutForCustomer({summary:'Bounded summary',unknown:['Open point']});
assertProjection(readout,'READOUT',['RRE']);
assert.equal(readout.state,'UNKNOWN','missing upstream readout state must not become AVAILABLE');
assert.deepEqual(readout.unknown,['Open point']);

const navigation=projectNavigationForCustomer({status:'AVAILABLE',options:[{id:'observe',label:'Observe'}]});
assertProjection(navigation,'NAVIGATION',['RNE']);
assert.equal(navigation.governance.selectionMadeBySystem,false);

const methods=projectMethodsForCustomer({locale:'en',intent:'understand a pattern',projections:[{projectionId:'method-1',method:{publicMethodCode:'NUMEROLOGY',publicLabels:{en:'Numerology'},status:'AVAILABLE'},calculation:{status:'COMPLETE',values:[{code:'LIFE_PATH_NUMBER',value:8}],structures:[]},unknown:['unresolved_context']}]});
assertProjection(methods,'PERSONAL_REALITY',['MPA','METHOD_RUNTIME','CMR']);
assert.equal(methods.governance.methodsRemainPerspectives,true);
assert.equal(methods.structure.methods[0].values[0].value,8);
assert.equal(methods.details.openItems.length,1);

const financial=projectFinancialForCustomer({schemaVersion:'fixture',snapshot:{snapshotId:'snapshot-1',asOfDate:'2026-08-25',persisted:false,evidenceState:'REPORTED'},calculation:{metrics:{netWorth:320000,grossAssets:500000,totalLiabilities:180000}},findings:[{findingCode:'CONCENTRATION',summary:'Concentrated position',evidenceState:'REPORTED'}],boundaries:{adviceCreated:false,recommendationCreated:false,professionalJudgmentCreated:false}},{intake:{unknowns:'One value is missing'}});
assertProjection(financial,'FINANCIAL_REALITY',['FDR','FCR','FAR','HFP','PFR']);
assert.equal(financial.snapshot.baseCurrency,null,'adapter may not invent MYR or another currency');
assert.equal(financial.currentPosition[0].value,320000);
assert.equal(financial.unknowns[0].value,'One value is missing');
assert.deepEqual(financial.priorities,{state:'NOT_CREATED_BY_ADAPTER',items:[]});
assert.deepEqual(financial.options,{state:'NOT_CREATED_BY_ADAPTER',items:[]});

const knowledge=projectKnowledgeAnswerForCustomer({clientAnswer:{directAnswer:'Bounded answer',question:'What changed?',unknown:{details:['Current outcome is unknown']},relatedKnowledgeCards:[{title:'Related',href:'/articles/related'}]}},{currentFacts:{state:'AVAILABLE',evidence:[{claimText:'Current fact',publisher:'Authority',sourceUrl:'https://example.com/fact',authorityClass:'PRIMARY'}]}});
assertProjection(knowledge,'ASK',['CKA','KAP','CURRENT_FACTS_GATEWAY']);
assert.equal(knowledge.governance.currentFactsAreCanonicalKnowledge,false);
assert.equal(knowledge.currentFacts.evidence[0].claim,'Current fact');
assert.deepEqual(knowledge.limits.items,['Current outcome is unknown']);

const report=projectReportForCustomer({reportId:'report-1',title:'Report',sections:[{code:'overview',content:'Summary'}],href:'/reports/report-1'});
assertProjection(report,'REPORT',['RR']);
assert.equal(report.sections[0].summary,'Summary');

const continuity=projectContinuityForCustomer({status:'ACTIVE',currentStage:'OBSERVE',nextAvailableStages:['REVIEW'],history:[{type:'READ',createdAt:'2026-09-03T00:00:00Z'}],persistentContinuationRequiresExplicitConsent:true});
assertProjection(continuity,'CONTINUITY',['JR']);
assert.equal(continuity.stage,'OBSERVE');
assert.deepEqual(continuity.nextStages,['REVIEW']);
assert.equal(continuity.governance.journeyIsFirstLevelProduct,false);

const professional=projectProfessionalReviewForCustomer({status:'COMPLETE',reviewId:'review-1',scope:'Financial review',observations:[{findingCode:'OBS-1',summary:'Observed structure',professionalJudgment:true}],recommendations:[{code:'REC-1',summary:'Professional recommendation',professionalJudgment:true}],limitations:['One open point']});
assertProjection(professional,'PROFESSIONAL_REVIEW',['PR','PFR']);
assert.equal(professional.recommendations.length,1);
assert.equal(professional.governance.professionalRecommendationPassedThrough,true);
assert.equal(professional.governance.adapterCreatedRecommendation,false);
assert.equal(professional.governance.recommends,false);

// Current priority APIs must cross the customer projection boundary before customer JSON is returned.
const priorityApis={
  'functions/api/customer-my-reality.js':['projectRealityForCustomer','rawRuntimeExposed:false'],
  'functions/api/customer-personal-reality.js':['projectMethodsForCustomer','const view=freeze'],
  'functions/api/customer-financial-reality.js':['projectFinancialForCustomer','rawFinancialRuntimeExposed:false'],
  'functions/api/customer-ask.js':['projectKnowledgeAnswerForCustomer','rawAskRuntimeExposed:false']
};
for(const [file,tokens] of Object.entries(priorityApis)){const source=read(file);for(const token of tokens)assert.ok(source.includes(token),`${file} missing ${token}`);}

// Reconciliation-specific truth guards.
assert.doesNotMatch(read('functions/customer-projection/readout-customer-projection.js'),/state:[^\n]*\|\|'AVAILABLE'/,'readout adapter still upgrades missing state to AVAILABLE');
assert.doesNotMatch(read('functions/customer-projection/reality-customer-projection.js'),/reading[^\n]*state:[^\n]*\|\|'AVAILABLE'/,'Reality nested reading still upgrades missing state to AVAILABLE');
assert.doesNotMatch(read('functions/customer-projection/financial-customer-projection.js'),/baseCurrency\|\|intake\.baseCurrency\)\|\|'MYR'/,'Financial adapter still invents MYR');

assert.equal(audit.executionBaselineCommit,baseline);
assert.equal(audit.status,'RECONCILED');
assert.equal(audit.findings.length,7);
assert.equal(json('content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json').files['assets/customer-ui/surfaces/personal-reality.css'].currentSha256,'92306da5e4fc5b5c60bd8f861b0100173b90003005aa5c99efe0ebf6bff679a6');
assert.equal(audit.next,'PRIORITY_PRODUCT_TRANCHE');
assert.equal(acceptance.executionBaselineCommit,baseline);
assert.equal(acceptance.status,'CURRENT_MAIN_RECONCILED_READY_FOR_PRIORITY_PRODUCT_TRANCHE');
assert.equal(acceptance.exit,'CUSTOMER_RUNTIME_PROJECTION_BOUNDARY_FROZEN');
assert.equal(acceptance.adapterCount,9);
assert.deepEqual(acceptance.priorityProductSequence,['CX-R10_MY_REALITY','CX-R12_PERSONAL_REALITY','CX-R13_FINANCIAL_REALITY','CX-R9-R2_CONTEXTUAL_ASK_PHI_OS']);
assert.equal(acceptance.rules.backendAuthorityRebuilt,false);
assert.equal(acceptance.rules.secondAuthorityCreated,false);
assert.equal(acceptance.rules.productAcceptanceCreatedByR20,false);
assert.equal(acceptance.rules.routeCutoverPerformed,false);
assert.equal(acceptance.rules.physicalLegacyDeletePerformed,false);
assert.equal(acceptance.rules.unknownPreserved,true);
assert.equal(acceptance.rules.upstreamAvailabilityPreserved,true);
assert.equal(acceptance.rules.priorityProductTrancheReady,true);
assert.equal(acceptance.rules.pprCurrentSharedOwnerReconciled,true);

console.log('✓ CX-R20 Current-Main Reconciliation passed at 3eed6a2: 9 consume-only adapters preserve upstream authority, Unknown, provenance and conservative state across the priority customer tranche.');
console.log('✓ Historical R20 v1 and R0/R2 projection maps remain byte-identical; current v4 restores explicit Financial Reality coverage and future gates without creating a second authority.');
console.log('✓ Truth guards passed: missing readout state remains UNKNOWN, missing financial currency remains null, JR remains continuity/progress, and professional recommendations can only pass through PR/PFR authority.');
console.log('✓ CX-R20 ACCEPTED: CUSTOMER_RUNTIME_PROJECTION_BOUNDARY_FROZEN · PRIORITY_PRODUCT_TRANCHE_READY · NO_ROUTE_CUTOVER');
