import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {onRequestGet as getSymbolicContext} from '../functions/api/symbolic-method-context.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const BASE='40cb9e71450ebb817998cde8222225cd941c0aa0';
const successor=read('content/interpretation/tarot/reconciliation/tarot-persistence-current-successor-v2.json');
const acceptance=read('content/interpretation/tarot/acceptance/tarot-persistence-reconciliation-acceptance-v1.json');
const historical=read('content/interpretation/tarot/acceptance/tarot-persistence-acceptance-v1.json');
const machine=read('content/production/symbolic-method/acceptance/tarot-machine-acceptance-v2.json');
const prehuman=read('content/production/symbolic-method/reconciliation/tarot-prehuman-current-successor-v1.json');
const pkg=read('package.json');
const pcm=read('content/governance/production-capability-matrix/registries/production-capability-registry-v6.json');
const catalog=read('content/web-production/px2/successors/public-method-catalog-v2.json');

assert.equal(successor.baselineCommit,BASE);
assert.equal(successor.status,'CURRENT_PERSISTENCE_RECONCILED_WITH_SHARED_ICHING_TAROT_CONTEXT_MACHINE_ACCEPTANCE_COMPATIBLE_PRODUCT_STILL_CLOSED');
assert.equal(acceptance.baselineCommit,BASE);
for(const item of Object.values(successor.historicalEvidence)){assert.ok(fs.existsSync(item.path));assert.equal(sha(item.path),item.sha256,`historical evidence drift ${item.path}`);assert.equal(item.preserved,true);}
for(const item of Object.values(successor.currentBinding)){assert.ok(fs.existsSync(item.path));assert.equal(sha(item.path),item.sha256,`current persistence binding drift ${item.path}`);}
assert.equal(historical.accepted.existingRuntimeD1SchemaReused,true);
assert.equal(historical.accepted.crossAccountReadBlocked,true);
assert.equal(historical.accepted.guestPersistenceBlocked,true);
assert.equal(historical.accepted.globalAccountIdentityProviderConnected,false);
assert.equal(machine.machineAcceptanceComplete,true);
assert.equal(machine.productionBoundary.phaseHPersistenceAcceptancePresentInCurrentBaseline,false,'machine acceptance v2 must remain historical evidence');
assert.equal(successor.continuity.phaseHPresentOnCurrentTree,true);
assert.equal(successor.continuity.phaseIMachineAcceptanceComplete,true);
assert.equal(successor.continuity.machineAcceptanceV2HistoricalObservationMayNotReclosePersistence,true);
for(const v of Object.values(successor.persistenceRuntime))assert.equal(v,true);
for(const v of Object.values(successor.productionBoundary))assert.equal(v,false);
assert.equal(prehuman.accepted.persistenceCurrent,true);assert.equal(prehuman.accepted.machineAcceptanceComplete,true);assert.equal(prehuman.productionBoundary.runAllowed,false);

const shared=text(successor.currentBinding.sharedContextApi.path);
assert.match(shared,/METHODS=new Set\(\['I_CHING','TAROT'\]\)/);
assert.match(shared,/sourceReady:true,structuralRuntimeFrozen:true,interpretationSourceBound:true,automaticPersistence:false/);
assert.match(shared,/inspectIChingExecutionAuthority/);
assert.match(shared,/symbolicPersistenceProviderState/);
assert.equal(shared.includes('runAllowed:true'),false);

async function contextFor(method){return (await getSymbolicContext({request:new Request(`https://example.test/api/symbolic-method-context?method=${method}`),data:{ckaAccess:{accountState:'GUEST',retentionPolicyAccepted:false}},env:{}})).json();}
for(const method of ['TAROT','I_CHING']){
 const payload=await contextFor(method);assert.equal(payload.ok,true);assert.equal(payload.method,method);assert.deepEqual(payload.productRuntime,{sourceReady:true,structuralRuntimeFrozen:true,interpretationSourceBound:true,automaticPersistence:false});assert.equal(payload.production.runAllowed,false);assert.equal(payload.guest.hiddenPersistentReadingHistory,false);assert.equal(payload.guest.localBrowserReadingHistory,false);
}

assert.equal(pkg.scripts['check:tarot-persistence'],'npm run check:tarot-persistence-current');
assert.equal(pkg.scripts['check:tarot-persistence-historical'],'node scripts/check-tarot-persistence.mjs');
assert.equal(pkg.scripts['check:tarot-persistence-current'],'node scripts/check-tarot-persistence-current.mjs');
assert.equal(pkg.scripts['check:tarot-persistence-reconciliation'],'npm run check:tarot-persistence-current');
assert.equal(successor.checkerLifecycle.currentChecker.aliases.includes('check:tarot-persistence'),true);
const tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT');assert.ok(tarPcm);assert.equal(tarPcm.userExecutable,false);assert.equal(tarPcm.productionAccepted,false);
const tarPublic=catalog.methods.find(x=>x.methodCode==='TAROT');assert.ok(tarPublic);assert.equal(tarPublic.runAllowed,false);

console.log('✓ TPA-HR current Tarot persistence reconciliation passed.');
console.log('  Phase-H D1 persistence artifacts are present and governed on the current tree; Phase-I machine acceptance remains complete.');
console.log('  Shared I Ching/Tarot context reports source readiness for both methods while execution remains separately fail-closed.');
console.log('  Global verified account provider, human acceptance, live browser and live production SHA remain pending.');
