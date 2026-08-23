import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {calculateFinancialProjection, stableFinancialResult} from '../functions/financial/calculation-runtime/financial-calculation-runtime.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rel=p=>path.join(ROOT,p);
const json=p=>JSON.parse(fs.readFileSync(rel(p),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(rel(p))).digest('hex');
const assertRef=(r,label)=>{assert.ok(fs.existsSync(rel(r.path)),`${label}: missing ${r.path}`);assert.equal(sha(r.path),r.sha256,`${label}: drift ${r.path}`);};

const baseline='b536eb5a6f69a50d7549426a09b7f123bde35c74';
const auth=json('content/runtime-maturity/authority/master-runtime-authority-baseline-v1.1.json');
const inv=json('content/runtime-maturity/registries/master-runtime-capability-inventory-v1.2.json');
const arch=json('content/runtime-maturity/evidence/architecture/architectural-evidence-registry-v1.2.json');
const det=json('content/runtime-maturity/evidence/determinism/determinism-evidence-registry-v2.json');
const rm=json('content/runtime-maturity/matrices/master-runtime-maturity-matrix-v1.2.json');
const em=json('content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.3.json');
const claims=json('content/runtime-maturity/matrices/runtime-claim-eligibility-matrix-v1.2.json');
const acceptance=json('content/runtime-maturity/acceptance/mrm-s8-determinism-acceptance-v1.json');
const successor=json('content/runtime-maturity/successors/mrm-s8-em1-determinism-successor-v1.json');

for(const x of [auth,inv,arch,det,rm,em,claims,acceptance,successor]) assert.equal(x.baselineCommit,baseline,'S8 baseline commit drift');
assert.equal(auth.runtimes.length,40);
assert.deepEqual(auth.reservedFutureRuntimeCodes.sort(),['AIR','CIV','HFP','LRM','PFR','RCL','RME','VAL'].sort());
assert.equal(new Set(auth.runtimes.map(x=>x.runtimeCode)).size,40);
for(const r of auth.runtimes){assert.equal(r.duplicateAuthorityDetected,false);assert.equal(r.historicalFreezePreserved,true);assertRef(r.currentAuthority,`${r.runtimeCode} current authority`);assertRef(r.checkerAuthority,`${r.runtimeCode} checker authority`);if(r.freezeAuthority)assertRef(r.freezeAuthority,`${r.runtimeCode} freeze authority`);}

assert.equal(inv.capabilityCount,177);assert.equal(inv.capabilities.length,177);assert.equal(new Set(inv.capabilities.map(x=>x.capabilityCode)).size,177);
assert.equal(new Set(inv.capabilities.map(x=>x.runtimeCode)).size,40);
for(const c of inv.capabilities){assert.ok(c.canonicalOwner);assert.ok(c.currentVersion);assertRef(c.authorityReference,`${c.capabilityCode} authority`);}

assert.equal(arch.counts.runtimeCount,40);assert.equal(arch.counts.capabilityCount,177);assert.equal(arch.evidenceObjects.length,177);
assert.equal(new Set(arch.evidenceObjects.map(x=>x.capabilityCode)).size,177);
const archBy=new Map(arch.evidenceObjects.map(x=>[x.capabilityCode,x]));
for(const c of inv.capabilities){const e=archBy.get(c.capabilityCode);assert.ok(e,`Missing architecture evidence ${c.capabilityCode}`);assert.equal(e.evidenceClass,'ARCHITECTURE');for(const r of e.artifactReferences||[])assertRef(r,`${c.capabilityCode} architecture evidence`);}

assert.equal(det.status,'GLOBAL_MRM_S8_EM1_DETERMINISM_CAMPAIGN_ACTIVE_AND_ACCEPTED');
assert.equal(det.evidenceObjectCount,37);assert.equal(det.evidenceObjects.length,37);assert.equal(new Set(det.evidenceObjects.map(x=>x.capabilityCode)).size,37);
const capBy=new Map(inv.capabilities.map(x=>[x.capabilityCode,x]));
const detBy=new Map(det.evidenceObjects.map(x=>[x.capabilityCode,x]));
for(const e of det.evidenceObjects){
  assert.equal(e.evidenceClass,'DETERMINISM'); assert.equal(e.result,'PASS'); assert.equal(e.evidenceState,'CURRENT');
  const c=capBy.get(e.capabilityCode); assert.ok(c,`Orphan determinism evidence ${e.capabilityCode}`); assert.ok(archBy.has(e.capabilityCode));
  assert.equal(e.version,c.currentVersion,`Version mismatch ${e.capabilityCode}`);
  for(const r of e.artifactReferences||[])assertRef(r,`${e.capabilityCode} determinism evidence`);
}

const expectedMethodDet=['AST-CALC-PLANET','AST-CALC-HOUSE','AST-CALC-ASPECT','BZR-SOLAR-CALENDAR','BZR-FOUR-PILLARS','BZR-LUCK-CYCLE','NUM-BIRTH-NUMBER','NUM-CYCLE','HDR-DESIGN-MOMENT','HDR-BODYGRAPH','NUM-PROJECTION'];
for(const code of expectedMethodDet) assert.ok(detBy.has(code),`Missing method determinism admission ${code}`);
for(const c of inv.capabilities.filter(x=>x.runtimeCode==='FCR')) assert.ok(detBy.has(c.capabilityCode),`Missing FCR EM-1 admission ${c.capabilityCode}`);
for(const code of ['DAR-CLAUSE-RESOLUTION','DAR-DOCUMENT-ASSEMBLY','DAR-DOCUMENT-VALIDATION','DAR-RENDERING','DAR-VERSIONING','CMP-MEANING-RESOLUTION','CMP-BUNDLE','CMP-LOCALE-PROJECTION','RRP-REPORT-COMPOSITION','RRP-RR-HANDOFF']) assert.ok(detBy.has(code),`Missing deterministic scope ${code}`);
for(const code of ['FDR-FINANCIAL-REALITY','FAR-LIQUIDITY','DAR-HUMAN-REVIEW','DAR-LEGAL-ESCALATION','DAR-DOWNLOAD','CMP-METHOD-ADMISSION','CMP-RRP-CONSUMPTION']) assert.ok(!detBy.has(code),`Premature determinism admission ${code}`);

assert.equal(rm.capabilityCount,177);assert.equal(em.capabilityCount,177);assert.equal(claims.capabilityCount,177);
assert.deepEqual(em.currentDistribution,{'EM-0':140,'EM-1':36,'EM-2':1});
const emBy=new Map(em.records.map(x=>[x.capabilityCode,x]));
for(const c of inv.capabilities){const r=emBy.get(c.capabilityCode);assert.ok(r);assert.equal(r.version,c.currentVersion);assert.ok(['EM-0','EM-1','EM-2'].includes(r.currentEM));assert.equal(r.realCaseCount,0);assert.equal(r.longitudinalCaseCount,0);}
assert.equal(emBy.get('RRP-REPORT-COMPOSITION').currentEM,'EM-2','Pre-existing RRP W27 formal EM-2 must be preserved');
assert.equal(emBy.get('RRP-RR-HANDOFF').currentEM,'EM-1');
for(const e of det.evidenceObjects){if(e.capabilityCode!=='RRP-REPORT-COMPOSITION')assert.equal(emBy.get(e.capabilityCode).currentEM,'EM-1',`S8 determinism must promote contiguously to EM-1: ${e.capabilityCode}`);}
assert.equal(acceptance.counts.em3OrHigherCount,0);assert.equal(acceptance.proofs.noPilotEvidenceCreated,true);assert.equal(acceptance.proofs.noProductionAuthorityCreated,true);assert.equal(successor.rules.globalMRMS9Complete,false);

const claimBy=new Map(claims.records.map(x=>[x.capabilityCode,x]));
for(const c of inv.capabilities){const x=claimBy.get(c.capabilityCode);assert.ok(x);assert.equal(x.evidenceMaturity,emBy.get(c.capabilityCode).currentEM);assert.ok(x.prohibitedClaims.includes('PILOT_VERIFIED'));assert.ok(x.prohibitedClaims.includes('SCIENTIFICALLY_PROVEN'));}
for(const code of expectedMethodDet){assert.ok(claimBy.get(code).allowedClaims.includes('DETERMINISTIC_VERIFIED_FOR_BOUND_VERSION'));}

// Current domain production status is independent of EM and must reflect b536eb5 current capability authority.
const pcm=json('content/governance/production-capability-matrix/registries/production-capability-registry-v2.json');
const pcmBy=new Map(pcm.capabilities.map(x=>[x.methodRuntime.pluginCode,x]));
assert.equal(pcmBy.get('NUM').capabilityAvailability,'AVAILABLE');
assert.equal(pcmBy.get('AST').capabilityAvailability,'LIMITED');
assert.equal(pcmBy.get('BZR').capabilityAvailability,'LIMITED');
assert.equal(pcmBy.get('HDR').capabilityAvailability,'BLOCKED');
assert.equal(capBy.get('AST-CALC-PLANET').evaluatedCurrentRM,'RM-6');
assert.equal(capBy.get('AST-CALC-HOUSE').evaluatedCurrentRM,'RM-5');
assert.equal(capBy.get('AST-CALC-ASPECT').evaluatedCurrentRM,'RM-5');
for(const code of ['BZR-SOLAR-CALENDAR','BZR-FOUR-PILLARS','BZR-LUCK-CYCLE','NUM-BIRTH-NUMBER','NUM-CYCLE','NUM-PROJECTION'])assert.equal(capBy.get(code).evaluatedCurrentRM,'RM-6');

// Re-run the executable repeatability authorities that S8 formally admits.
const checkers=[
 'scripts/check-ast-w2-planet-runtime.mjs','scripts/check-ast-w3-house-runtime.mjs','scripts/check-ast-w4b-aspect-runtime.mjs',
 'scripts/check-bzr-w1-solar-calendar-runtime.mjs','scripts/check-bzr-w2-four-pillars-runtime.mjs','scripts/check-bzr-w3-luck-cycle-runtime.mjs',
 'scripts/check-num-w1-birth-number-runtime.mjs','scripts/check-num-w3-cycle-runtime.mjs','scripts/check-hdr-w2-design-moment-solver.mjs','scripts/check-hdr-w4-bodygraph-runtime.mjs',
 'scripts/check-num-production.mjs','scripts/check-fcr-determinism.mjs','scripts/check-dar-w15-w24-document-assembly-runtime.mjs','scripts/check-cmp-w0-w6.mjs','scripts/check-cmp-w7-w12.mjs','scripts/check-rrp-w27-mrm-evidence-binding.mjs'
];
for(const checker of checkers) execFileSync(process.execPath,[rel(checker)],{cwd:ROOT,stdio:'pipe'});

// Stronger S8 FCR campaign: every governed fixture must be byte-stable under repeat execution.
const fixtureRegistry=json('content/financial/calculation-runtime/fixtures/fcr-fixture-registry-v1.json');
for(const filename of fixtureRegistry.fixtures){
  const f=json(`content/financial/calculation-runtime/fixtures/${filename}`);
  const a=await calculateFinancialProjection(structuredClone(f.calculationInput));
  const b=await calculateFinancialProjection(structuredClone(f.calculationInput));
  assert.equal(a.resultDigest,b.resultDigest,`FCR result digest drift ${filename}`);
  assert.equal(a.determinismKey,b.determinismKey,`FCR determinism key drift ${filename}`);
  assert.equal(stableFinancialResult(a),stableFinancialResult(b),`FCR stable result drift ${filename}`);
}

const pkg=json('package.json'); assert.equal(Object.hasOwn(pkg.scripts,'check:mrm-s'),false,'check:mrm-s must remain absent until MRM-S18');

console.log('✓ MRM-S8 EM-1 Determinism Campaign passed.');
console.log(`  ${auth.runtimes.length} current runtimes / ${inv.capabilityCount} capabilities reconciled at b536eb5.`);
console.log(`  ${det.evidenceObjectCount} formal DETERMINISM evidence objects admitted; EM distribution: EM-0 ${em.currentDistribution['EM-0']}, EM-1 ${em.currentDistribution['EM-1']}, EM-2 ${em.currentDistribution['EM-2']}.`);
console.log('  AST/BZR/NUM/HDR calculation repeatability, NUM projection, FCR, selected DAR, CMP and prior RRP deterministic scopes are version-bound and executable-checker verified.');
console.log('  FDR/FAR and human/legal/download/governance boundaries remain EM-0 where explicit repeatability evidence was not admitted.');
console.log('  Global MRM-S9/EM-2 fixture promotion and all Pilot/EM-3 claims remain open; domain Production authority is unchanged.');
