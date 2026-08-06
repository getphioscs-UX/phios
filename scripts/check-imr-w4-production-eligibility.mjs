import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const readJson = async p => JSON.parse(await fs.readFile(p,'utf8'));
const reg=await readJson('content/professional/method-governance/imr-production-eligibility-registry-v1.json');
const methods=await readJson('content/professional/method-governance/imr-method-registry-v1.json');
const licenses=await readJson('content/professional/method-governance/imr-commercial-license-registry-v1.json');
const algorithms=await readJson('content/professional/method-governance/imr-algorithm-governance-registry-v1.json');
assert.equal(reg.stageCode,'IMR-W4'); assert.equal(reg.runtimeAuthority,false); assert.equal(reg.eligibilityPolicy.failClosed,true);
assert.deepEqual(reg.methods.map(x=>x.methodCode),methods.methods.map(x=>x.methodCode));
for(const x of reg.methods){
 const l=licenses.methods.find(y=>y.methodCode===x.methodCode); const a=algorithms.methods.find(y=>y.methodCode===x.methodCode);
 assert.ok(l&&a); const expectedLicense=l.licenseStatus==='approved';
 const expectedValidation=a.validation.fixturesPassed===true && ['passed','validated'].includes(a.validation.status);
 const expectedRegression=a.validation.regressionPassed===true;
 assert.equal(x.commercialLicensePassed,expectedLicense); assert.equal(x.validationPassed,expectedValidation); assert.equal(x.regressionPassed,expectedRegression);
 const expected=expectedLicense&&expectedValidation&&expectedRegression&&a.calculation.implementedInSharedRuntime===true&&x.professionalBoundaryPassed===true&&x.professionalWorkflowPassed===true;
 assert.equal(x.productionReady,expected); assert.equal(x.professionalReady,expected); assert.equal(x.productionAuthorityCreated,false);
 if(!expected) assert.equal(x.eligibilityStatus,'blocked');
}
assert.equal(reg.methods.some(x=>x.productionReady),false);
console.log('✓ IMR-W4 Production Eligibility passed.');
console.log(`  Governed methods: ${reg.methods.length}; Production Ready: 0; Professional Ready: 0.`);
