import assert from 'node:assert/strict';
import {BASELINE,ROOT,readJson,list,assertCoreRefSet} from './mfp-r-support.mjs';
const c=readJson(`${ROOT}/mfp-r-w2-selective-fp-closure-v1.json`), f=readJson(`${ROOT}/method-r2-pre-current-reality-freeze-v1.json`);
assert.equal(f.baselineCommit,BASELINE);assert.equal(f.workCode,'MFP-R-W4');assert.deepEqual(Object.keys(f.methods).sort(),['AST','BZR','ECR','NUM','ZWR']);
for(const [id,x] of Object.entries(f.methods)){for(const k of ['methodProductionAdmissionRef','readingProductRef','acceptedEnvelopeRef','machineEvidenceRef','humanEvidenceRef','semanticDigest','state'])assert.ok(x[k],`${id}.${k} required`);assert.equal(x.state,'CUSTOMER_PUBLISHABLE')}
const e=f.methods.ECR;assert.ok(e.fullReadingProductRef);assert.ok(e.phiCardVisualCompanionRef);assert.equal(f.cross.state,'CUSTOMER_PUBLISHABLE');

const astAdmission=readJson(f.methods.AST.methodProductionAdmissionRef),bzrAdmission=readJson(f.methods.BZR.methodProductionAdmissionRef),zwrAdmission=readJson(f.methods.ZWR.methodProductionAdmissionRef),numAdmission=readJson(f.methods.NUM.methodProductionAdmissionRef),ecrAdmission=readJson(f.methods.ECR.methodProductionAdmissionRef),phiAdmission=readJson(f.methods.ECR.phiCardVisualCompanionRef),crossAdmission=readJson(f.cross.productionAdmissionRef);
assert.equal(astAdmission.astFullProductionFrozen,true);assert.equal(astAdmission.customerCutoverAllowed,true);
assert.equal(bzrAdmission.publication?.customerPublishable,true);assert.equal(bzrAdmission.publication?.defaultCustomerSurfaceAllowed,true);
assert.equal(zwrAdmission.publicationState,'CUSTOMER_PUBLISHABLE');assert.equal(zwrAdmission.defaultCustomerCutover,true);
assert.equal(numAdmission.gates?.defaultCustomerCutover,true);assert.equal(numAdmission.blockingReasons?.length,0);
assert.equal(ecrAdmission.publication?.customerPublishable,true);assert.equal(phiAdmission.customerAdmission,true);
assert.equal(crossAdmission.productionAllowed,true);assert.equal(crossAdmission.customerCrossCutoverAllowed,true);
const openMaterial=c.closures.filter(x=>x.status!=='CLOSED'&&['BLOCKING','MATERIAL'].includes(x.customerImpact)).map(x=>x.gapId).sort();assert.deepEqual([...f.unresolvedBlockingOrMaterialGaps].sort(),openMaterial);
const shouldAllow=openMaterial.length===0&&Object.values(f.methods).every(x=>x.state==='CUSTOMER_PUBLISHABLE'&&x.recoveryState==='READY')&&f.cross.state==='CUSTOMER_PUBLISHABLE';assert.equal(f.currentRealityEntryAllowed,shouldAllow,'currentRealityEntryAllowed must be derived fail-closed');if(openMaterial.length)assert.equal(f.currentRealityEntryAllowed,false);
assertCoreRefSet(f);
console.log(openMaterial.length?`✓ MFP-R-W4 pre-current-reality freeze is coherent and FAIL-CLOSED AS DESIGNED: ${openMaterial.length} material gap remains; W42 entry is not allowed.`:'✓ MFP-R-W4 pre-current-reality freeze passed: all five methods + Cross are ready and W42 entry is allowed.');
