import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRAMMAR_CODES, GRAMMAR_REGISTRY } from '../functions/runtime/formation/grammar-registry.js';
import { RUNTIME_CAPABILITIES, RUNTIME_DRIVERS } from '../functions/runtime/formation/book-1-runtime-model.js';
import { ECR_BOOK_CORE_THEORY_RUNTIME } from '../functions/embodied-configuration/ecr-book-core-theory-runtime.js';
import { getEcrCanonicalOntology, validateEcrCanonicalOntology } from '../functions/embodied-configuration/ecr-ontology-registry.js';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const theory=readJson('content/embodied-configuration/ecr-theory-authority-v1.json');
const layers=readJson('content/embodied-configuration/ecr-layer-registry-v1.json');
const motion=readJson('content/embodied-configuration/ecr-motion-registry-v1.json');
const activation=readJson('content/embodied-configuration/ecr-activation-registry-v1.json');
const config=readJson('content/embodied-configuration/ecr-environment-first-configuration-v1.json');
const source=readJson('content/embodied-configuration/ecr-founder-reference-authority-v1.json');
const acceptance=readJson('content/customer-experience-rebuild/r12r4b/cx-r12r4b-r3r1-acceptance-v1.json');
const hexagrams=readJson('content/professional/core-method-runtime/iching-hexagram-registry-v1.json');
const pkg=readJson('package.json');

const expectedGrammar=[
  ['G1','Difference','差异'],['G2','Constraint','约束'],['G3','Structure','结构'],['G4','Field','场域'],
  ['G5','Activation','激活'],['G6','Carrier','载体'],['G7','Runtime','运行'],['G8','Experience','体验'],
  ['G9','Expression','表达'],['G10','Agency','行动'],['G11','Identity','身份'],['G12','Feedback','反馈'],
  ['G13','Settlement','沉淀'],['G14','Reconfiguration','重组'],['G15','Emergence','涌现'],['G16','Continuity','持续']
];
assert.deepEqual(GRAMMAR_CODES,expectedGrammar.map(x=>x[0]));
assert.deepEqual(ECR_BOOK_CORE_THEORY_RUNTIME.grammarCodes,expectedGrammar.map(x=>x[0]));
for(const [code,en,zh] of expectedGrammar){
  assert.equal(GRAMMAR_REGISTRY[code].label,en);
  assert.equal(ECR_BOOK_CORE_THEORY_RUNTIME.grammars[code].label,en);
  assert.equal(ECR_BOOK_CORE_THEORY_RUNTIME.grammars[code].chineseLabel,zh);
}
// PDS-W0 keeps protected Runtime display labels immutable; ECR consumes a Book-aligned derived projection instead of rewriting functions/runtime.
assert.equal(GRAMMAR_REGISTRY.G10.chineseLabel,'行动主体');
assert.equal(GRAMMAR_REGISTRY.G13.chineseLabel,'沉降');

const expectedQuestions=[
  ['Q1','究竟发生了什么？'],['Q2','什么值得相信？'],['Q3','什么是真实？'],['Q4','是否进入新的阶段？'],
  ['Q5','现在是否应该开始？'],['Q6','资源是否足够？'],['Q7','如何持续运行？'],['Q8','秩序继续支持未来吗？'],
  ['Q9','如何回应其他现实？'],['Q10','如何组织差异？'],['Q11','什么值得共同承载？'],['Q12','如何维持共同稳定？'],
  ['Q13','旧组织还支持未来吗？'],['Q14','谁承载改变？'],['Q15','新的组织如何稳定？'],['Q16','如何继续存在？']
];
assert.deepEqual(ECR_BOOK_CORE_THEORY_RUNTIME.questionCodes,expectedQuestions.map(x=>x[0]));
for(const [id,zh] of expectedQuestions)assert.equal(ECR_BOOK_CORE_THEORY_RUNTIME.questions[id].questionZhHans,zh);

const expectedCapabilities=[
  ['R1','Direction','方向能力'],['R2','Understanding','理解能力'],['R3','Expression','表达能力'],['R4','Position','位置能力'],['R5','Resources','资源能力'],['R6','Execution','执行能力'],['R7','Relational','关系能力'],['R8','Survival','生存能力'],['R9','Drive','驱动能力']
];
assert.deepEqual(ECR_BOOK_CORE_THEORY_RUNTIME.capabilities.map(x=>[x.id,x.label,x.bookZh]),expectedCapabilities);
assert.deepEqual(RUNTIME_CAPABILITIES.map(x=>[x.id,x.label]),expectedCapabilities.map(x=>x.slice(0,2)));
const expectedDrivers=[
  ['D1','Solar','太阳驱动'],['D2','Lunar','月亮驱动'],['D3','Mercurial','水星驱动'],['D4','Venusian','金星驱动'],
  ['D5','Martial','火星驱动'],['D6','Jovian','木星驱动'],['D7','Saturnian','土星驱动'],['D8','Uranian','天王星驱动'],
  ['D9','Neptunian','海王星驱动'],['D10','Plutonian','冥王星驱动'],['D11','Chiron','凯龙星驱动'],['D12','Nodal','交点驱动']
];
assert.deepEqual(ECR_BOOK_CORE_THEORY_RUNTIME.drivers.map(x=>[x.id,x.label,x.zh]),expectedDrivers);
assert.deepEqual(RUNTIME_DRIVERS.map(x=>[x.id,x.label]),expectedDrivers.map(x=>x.slice(0,2)));

assert.deepEqual(motion.entries.map(x=>[x.motionId,x.trigramCode,x.labelZhHans]),[
  ['M1','KUN','承载运动'],['M2','ZHEN','启动运动'],['M3','KAN','流动运动'],['M4','XUN','渗透运动'],
  ['M5','LI','分化运动'],['M6','GEN','界定运动'],['M7','QIAN','扩张运动'],['M8','DUI','交换运动']
]);
assert.deepEqual(activation.entries.map(x=>[x.activationId,x.labelZhHans]),[
  ['A1','激活窗口'],['A2','运行激活'],['A3','运动权重'],['A4','场放大'],['A5','对齐窗口'],['A6','激活过度强化'],['A7','激活衰退'],['A8','时间闭合']
]);
assert.equal(activation.rules.calculationBlocked,false);
assert.equal(activation.status,'FOUNDER_REFERENCE_ALIGNED_CALCULATION_SPEC_ELIGIBLE');

assert.equal(config.entries.length,64);
assert.equal(new Set(config.entries.map(x=>x.hexagramRef)).size,64);
assert.equal(new Set(config.entries.map(x=>x.kingWenNumber)).size,64);
const hexById=new Map(hexagrams.entries.map(x=>[x.hexagramId,x]));
const motionById=new Map(motion.entries.map(x=>[x.motionId,x]));
for(const item of config.entries){
  const hex=hexById.get(item.hexagramRef);assert.ok(hex);
  assert.equal(item.upperTrigramRef,hex.upperTrigramId);
  assert.equal(item.lowerTrigramRef,hex.lowerTrigramId);
  assert.equal(motionById.get(item.environmentPriorityMotionId).trigramRef,item.upperTrigramRef);
  assert.equal(motionById.get(item.embodiedResponseMotionId).trigramRef,item.lowerTrigramRef);
  assert.equal(item.rule,'UPPER_TRIGRAM_ENVIRONMENT_PRIORITY_V1');
}
assert.equal(config.convention.upperTrigramRole,'ENVIRONMENT_PRIORITY');
assert.equal(config.convention.lowerTrigramRole,'EMBODIED_RESPONSE_POSITION');
assert.equal(config.convention.interpretiveConvention,true);
assert.equal(config.convention.scientificFactClaimed,false);

assert.deepEqual(layers.layers.map(x=>[x.code,x.cardinality]),[['CC',12],['G',16],['Q',16],['R',9],['D',12],['M',8],['H',64],['A',8]]);
assert.equal(layers.rules.ecrOwnsSeparateG16,false);
assert.equal(layers.rules.ecrOwnsSeparateQ16,false);
assert.equal(layers.rules.ecrOwnsSeparateR9,false);
assert.equal(layers.rules.ecrOwnsSeparateD12,false);
assert.match(layers.layers.find(x=>x.code==='G').authorityRef,/ecr-book-core-theory-projection-v1\.json#grammar$/);
assert.match(layers.layers.find(x=>x.code==='Q').authorityRef,/ecr-book-core-theory-projection-v1\.json#questions$/);
assert.match(layers.layers.find(x=>x.code==='R').authorityRef,/ecr-book-core-theory-projection-v1\.json#capabilities$/);
assert.match(layers.layers.find(x=>x.code==='D').authorityRef,/ecr-book-core-theory-projection-v1\.json#drivers$/);
assert.equal(layers.rules.pdsProtectedRuntimeRemainsImmutable,true);

const ontology=getEcrCanonicalOntology();
assert.equal(validateEcrCanonicalOntology().valid,true);
assert.equal(ontology.coreTheory.grammarCodes.length,16);
assert.equal(ontology.coreTheory.questionCodes.length,16);
assert.equal(ontology.coreTheory.capabilities.length,9);
assert.equal(ontology.coreTheory.drivers.length,12);
assert.equal(ontology.ecrSpecific.motions.length,8);
assert.equal(ontology.ecrSpecific.configurations.length,64);
assert.equal(ontology.ecrSpecific.activations.length,8);
const r4ArtifactsPresent=[
  'content/customer-experience-rebuild/r12r4b/cx-r12r4b-r4-acceptance-v1.json',
  'scripts/check-cx-r12r4b-r4-ecr-calculation-meaning.mjs',
  'scripts/generate-ecr-r4-authorities.mjs',
  'scripts/generate-cx-r12r4b-r4-ecr-campaign.mjs'
].every(file=>fs.existsSync(file));
const r4ScriptRegistered=Boolean(pkg.scripts['check:cx-r12r4b:r4']);
if(r4ArtifactsPresent)assert.equal(r4ScriptRegistered,true,'CX_R12R4B_R4_SUCCESSOR_SCRIPT_MISSING_FROM_PACKAGE_JSON');
const r4SuccessorPresent=r4ArtifactsPresent&&r4ScriptRegistered;
assert.equal(ontology.boundary.calculationImplemented,r4SuccessorPresent);
assert.equal(ontology.boundary.customerMeaningCreated,r4SuccessorPresent);
assert.equal(ontology.boundary.customerPublicationAdmitted,false);

assert.equal(source.status,'FIRST_PARTY_REFERENCE_ACCEPTED_FOR_ONTOLOGY_RECONCILIATION');
assert.equal(source.references.length,4);
for(const ref of source.references)assert.match(ref.sha256,/^[a-f0-9]{64}$/);
assert.equal(theory.boundaries.activationA8MayProceedToCalculationSpecification,true);
if(r4SuccessorPresent){
  assert.equal(theory.status,'R4_CALCULATION_MEANING_IMPLEMENTED_HUMAN_REVIEW_PENDING');
  assert.equal(theory.boundaries.calculationImplemented,true);
  assert.equal(theory.boundaries.customerMeaningImplemented,true);
  assert.equal(theory.boundaries.customerInterpretationImplemented,true);
  assert.equal(theory.boundaries.customerPublicationAdmitted,false);
}else{
  assert.equal(theory.status,'CORE_THEORY_RECONCILED_READY_FOR_W31R');
  assert.equal(theory.boundaries.calculationImplemented,false);
}
assert.equal(acceptance.status,'R4B_R3R1_ACCEPTED_BY_EXECUTABLE_CHECKS');
assert.equal(acceptance.claims.ecrReconciledToBook,true);
assert.equal(acceptance.claims.bookRewrittenToMatchEcr,false);
assert.equal(acceptance.claims.activationCalculationBlocked,false);
assert.equal(acceptance.claims.pdsProtectedRuntimeMutated,false);
assert.equal(acceptance.claims.bookAlignedDerivedProjectionCreated,true);
assert.equal(fs.existsSync('functions/runtime/formation/fundamental-question-registry.js'),false);
assert.equal(acceptance.nextSequentialWork,'CX-R12R4B-R4-W31R_ECR_CALCULATION_SPECIFICATION_AND_CANONICAL_PROJECTION');

const r2Checker=fs.readFileSync('scripts/check-cx-r12r4b-r2-external-profile-confirmation-shadow.mjs','utf8');
assert.match(r2Checker,/check:cx-r12r4b:r2[\s\S]*check:cx-r12r4b:r3r1/);
assert.equal(pkg.scripts['check:cx-r12r4b:r3r1'],'node scripts/generate-ecr-book-aligned-ontology-projection.mjs --check && node scripts/check-cx-r12r4b-r3r1-core-theory-ecr-ontology.mjs');
if(r4SuccessorPresent){
  assert.match(pkg.scripts['check:cx-r12r4b'],/check:cx-r12r4b:r3r1[\s\S]*check:cx-r12r4b:r4/);
  assert(pkg.scripts['check:cx-r12r4b'].endsWith('&& npm run check:cx-r12r4b:r4'));
}else{
  assert(pkg.scripts['check:cx-r12r4b'].endsWith('&& npm run check:cx-r12r4b:r3r1'));
}

for(const file of ['functions/embodied-configuration/ecr-ontology-registry.js','functions/embodied-configuration/ecr-specific-ontology-runtime.js']){
  const text=fs.readFileSync(file,'utf8');
  for(const forbidden of ['HUMAN_DESIGN_PROJECTION','bodygraph','88°','88 degree'])assert.equal(text.includes(forbidden),false,`${file} leaked restricted external-method authority term ${forbidden}`);
}

console.log('✓ CX-R12R4B R3R1 Book I core theory / ECR ontology reconciliation passed.');
console.log('  G16/Q16/R9/D12 reuse core Book I authority; M8/A8 use founder first-party PHI Mandala authority; H64 is derived environment-first from canonical I Ching structure; W31R calculation may proceed without A8 blocking.');
