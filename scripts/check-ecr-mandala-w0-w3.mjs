import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {resolveEcrCoordinateFromSolarLongitude} from '../functions/embodied-configuration/ecr-calculation-runtime.js';
import {buildEcrCustomerMandalaProjection,ECR_CUSTOMER_MANDALA_PROJECTION_SCHEMA} from '../functions/embodied-configuration/ecr-customer-mandala-projection.js';
import {adaptEcrPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ecr-production-adapter.js';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline='1189c0519f1c5e9376965324b6010c00c212a3a1';
const audit=json('content/embodied-configuration/ecr-customer-mandala-authority-audit-v1.json');
const contract=json('content/embodied-configuration/ecr-customer-mandala-contract-v1.json');
const spec=json('content/embodied-configuration/ecr-calculation-spec-v1.json');
const book=json('content/embodied-configuration/ecr-book-core-theory-projection-v1.json');

assert.equal(audit.baselineCommit,baseline);
assert.equal(audit.status,'RECONCILED_ONE_AUTHORITY_PER_LAYER');
assert.equal(audit.baselineVerification.criticalAuthorityFilesComparedToGitHub,11);
assert.equal(audit.baselineVerification.allCriticalAuthorityGitBlobsMatchBaseline,true);
for(const record of audit.authorities){assert.equal(fs.existsSync(record.path),true,record.path);assert.equal(sha(record.path),record.sha256,`W0 authority drift: ${record.path}`);assert.equal(record.matchesBaselineGitBlob,true,`W0 baseline mismatch: ${record.path}`);}
assert.deepEqual(audit.gate,{oneCalculationAuthority:true,oneOntologyAuthority:true,oneCustomerVisualProjectionPath:'functions/embodied-configuration/ecr-customer-mandala-projection.js',duplicatedEcrSemanticsAllowed:false});
assert.deepEqual(audit.currentBookCapabilityOrder,[['R1','Direction','方向能力'],['R2','Understanding','理解能力'],['R3','Expression','表达能力'],['R4','Position','位置能力'],['R5','Resources','资源能力'],['R6','Execution','执行能力'],['R7','Relational','关系能力'],['R8','Survival','生存能力'],['R9','Drive','驱动能力']]);
assert.deepEqual(book.capabilities.map(x=>x.slice(0,3)),audit.currentBookCapabilityOrder,'W0 Book-aligned R1-R9 order drift');
assert.equal(spec.layerRules.CC12.count,12);assert.equal(spec.layerRules.CC12.sectorDegrees,30);
assert.equal(spec.layerRules.G16.count,16);assert.equal(spec.layerRules.G16.sectorDegrees,22.5);
assert.equal(spec.layerRules.Q16.rule,'GRAMMAR_ORDINAL_PAIR');
assert.equal(Object.keys(spec.questionCapabilityMatrix).length,16);
assert.equal(spec.layerRules.D12.count,12);assert.equal(spec.layerRules.D12.sectorDegrees,30);
assert.equal(spec.layerRules.M8.count,8);assert.equal(spec.layerRules.M8.sectorDegrees,45);
assert.equal(spec.layerRules.H64.count,64);assert.equal(spec.layerRules.H64.sectorDegrees,5.625);
assert.equal(spec.layerRules.A8.count,8);assert.equal(spec.layerRules.A8.subsegmentDegrees,0.703125);
assert.equal(spec.anchor.interpretiveConvention,true);assert.equal(spec.anchor.scientificFactClaimedForInterpretation,false);

assert.equal(contract.baselineCommit,baseline);assert.equal(contract.status,'ACTIVE_VISUAL_PROJECTION_CONTRACT');
assert.deepEqual(contract.layerOrder,['CC12','G16','Q16','R9','D12','M8','H64','A8']);
assert.equal(contract.boundaries.createsCalculationAuthority,false);assert.equal(contract.boundaries.createsMeaningAuthority,false);assert.equal(contract.boundaries.rendererMayCreateSemanticSelection,false);assert.equal(contract.boundaries.rendererMayCalculateGeometryFromOrdinalAndCount,true);
assert.equal(contract.layers.find(x=>x.layerId==='CC12').sourceAuthority,'content/embodied-configuration/ecr-cosmological-context-registry-v1.json');
assert.equal(contract.layers.find(x=>x.layerId==='H64').sourceAuthority,'content/embodied-configuration/ecr-environment-first-configuration-v1.json');
assert.equal(contract.layers.find(x=>x.layerId==='R9').relationAuthority,'content/embodied-configuration/ecr-calculation-spec-v1.json#questionCapabilityMatrix');

const personal=read('perspectives/personal/index.html');
assert.match(personal,/data-method="ecr"[^\n]+data-cx-asset="LOGO-001"/);
assert.doesNotMatch(personal,/cx-method-monogram/);
assert.doesNotMatch(personal,/>Φ</);
const successor=audit.protectedSuccessors['perspectives/personal/index.html'];
assert.equal(successor.predecessorSha256,'81a46efab60d5337fc4802ac5ffff26dab3fdf7ec388de5298de2c38e60c3d3c');
assert.equal(successor.successorSha256,sha('perspectives/personal/index.html'));
assert.equal(successor.requiredReplacement,'LOGO-001');

const runtimeSource=read('functions/embodied-configuration/ecr-customer-mandala-projection.js');
for(const forbidden of ['resolveEcrCoordinateFromSolarLongitude','calculateEcrSolarAnchor','sectorIndex(','canonicalBirthUtcIso('])assert.equal(runtimeSource.includes(forbidden),false,`W3 visual projection must not recalculate ECR: ${forbidden}`);
assert.match(runtimeSource,/getEcrCanonicalOntology/);assert.match(runtimeSource,/ECR_CALCULATION_SPEC_RUNTIME/);

const resolved=resolveEcrCoordinateFromSolarLongitude(225.3515625);
assert.equal(resolved.cosmologicalContext.contextId,'CC08');assert.equal(resolved.grammar.code,'G11');assert.equal(resolved.question.questionId,'Q11');assert.equal(resolved.capability.primary.id,'R7');assert.deepEqual(resolved.capability.supporting.map(x=>x.id),['R5']);assert.equal(resolved.driverPriority.drivers[0].driverId,'D8');assert.equal(resolved.motion.motionId,'M6');assert.equal(resolved.configuration.configurationId,'ECR-H41');assert.equal(resolved.activation.activationId,'A1');
const item=(code,value,meta={})=>({code,value,rawValue:null,meta});
const readingIR={schemaVersion:'PHI-OS-ECR-RUNTIME-READING-IR-v1.0.0',sourceProjectionId:'CMP-ECR-W0W3FIXTURE000000000001',sourceMeaningBundleCode:'ECR-MEANING-W0W3',locale:'zh-Hans',sections:{coordinate:{anchorLongitude:225.3515625,context:[item('CC08','SCORPIO',{label:'Scorpio',labelZhHans:'天蝎'})],grammar:[item('G11','G11',{label:'Identity',labelZhHans:'身份'})],question:[item('Q11','Q11',{question:'What is worth carrying together?',questionZhHans:'什么值得共同承载？'})]},response:{capabilities:[item('R7','PRIMARY',{priority:'PRIMARY'}),item('R5','SUPPORTING',{priority:'SUPPORTING'})],driverPriority:resolved.driverPriority.drivers.map(x=>item(x.driverId,x.baselineAffinity,{rank:x.rank,angularDistanceDegrees:x.angularDistanceDegrees,classification:resolved.driverPriority.classification}))},change:{motion:[item('M6','M6')],configuration:[item('ECR-H41','ECR-H41')],activation:[item('A1','A1')]}}};
const projection=buildEcrCustomerMandalaProjection(readingIR);
assert.equal(projection.schemaVersion,ECR_CUSTOMER_MANDALA_PROJECTION_SCHEMA);
assert.deepEqual({...projection.selected,driverPriority:projection.selected.driverPriority.slice(0,1)}, {...projection.selected,driverPriority:projection.selected.driverPriority.slice(0,1)});
assert.equal(projection.selected.contextId,'CC08');assert.equal(projection.selected.grammarId,'G11');assert.equal(projection.selected.questionId,'Q11');assert.equal(projection.selected.primaryCapabilityId,'R7');assert.deepEqual(projection.selected.supportingCapabilityIds,['R5']);assert.equal(projection.selected.driverPriority[0].driverId,'D8');assert.equal(projection.selected.motionId,'M6');assert.equal(projection.selected.configurationId,'ECR-H41');assert.equal(projection.selected.activationId,'A1');
assert.deepEqual(Object.fromEntries(Object.entries(projection.catalogs).map(([k,v])=>[k,v.length])),{contexts:12,grammars:16,questions:16,capabilities:9,drivers:12,motions:8,configurations:64,activations:8});
const q11=projection.relations.questionCapability.find(x=>x.questionId==='Q11');assert.equal(q11.primaryCapabilityId,'R7');assert.deepEqual(q11.supportingCapabilityIds,['R5']);
assert.equal(projection.boundaries.personalityClaimed,false);assert.equal(projection.boundaries.currentRealityKnown,false);assert.equal(projection.boundaries.currentDriverPriorityClaimed,false);assert.equal(projection.boundaries.fortunePredictionCreated,false);assert.equal(projection.boundaries.rendererRecalculated,false);assert.equal(projection.boundaries.visualProjectionCreatesMeaning,false);
assert.deepEqual(buildEcrCustomerMandalaProjection(readingIR),projection,'W3 customer mandala projection must be deterministic for the same Reading IR');

const product=adaptEcrPersonalRealityProduct({readingIR,mandalaProjection:projection,locale:'zh-Hans'});
assert.equal(product.methodId,'ECR');assert.equal(product.visuals[0].visualId,'ECR_PHI_MANDALA');assert.equal(product.visuals[0].type,'ECR_PHI_MANDALA_V1');assert.equal(product.visuals[0].payload.projectionId,projection.projectionId);assert.equal(product.lineage.mandalaProjectionId,projection.projectionId);assert.equal(product.boundaries.mandalaProjectionCreatesMeaning,false);assert.equal(product.boundaries.mandalaRendererRecalculates,false);assert(product.specialistRenderer.capabilities.includes('PHI_MANDALA_PROJECTION'));
const assembly=read('functions/personal-reality-product/product-assembly.js');assert.match(assembly,/buildEcrCustomerMandalaProjection/);assert.match(assembly,/mandalaProjection=buildEcrCustomerMandalaProjection\(readingIR\)/);assert.match(assembly,/mandalaProjection,phiCardSpread/);

console.log('✓ ECR PHI Mandala W0–W3 passed.');
console.log('  Baseline 1189c05 critical ECR authorities reconcile 11/11; legacy Mandala remains topology-only.');
console.log('  LOGO-001 replaces the literal Φ method-card placeholder through a hash-pinned PPR-R3 successor.');
console.log('  Customer Mandala projection consumes Reading IR + existing ontology/spec only; CC/G/Q/R/D/M/H/A are not recalculated by the renderer path.');
