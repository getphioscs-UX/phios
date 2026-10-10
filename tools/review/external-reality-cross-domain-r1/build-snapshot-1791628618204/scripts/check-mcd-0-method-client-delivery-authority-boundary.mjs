import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const exists = path => fs.existsSync(path);

const contractPath='content/professional/method-client-delivery/contracts/mcd-0-method-client-delivery-authority-boundary-v1.json';
const acceptancePath='content/professional/method-client-delivery/acceptance/mcd-0-authority-boundary-acceptance-v1.json';
assert.ok(exists(contractPath)); assert.ok(exists(acceptancePath));
const c=readJson(contractPath), a=readJson(acceptancePath);
assert.equal(c.schemaVersion,'PHI-OS-MCD-0-AUTHORITY-BOUNDARY-v1.0.0');
assert.equal(c.status,'ACTIVE_BOUNDARY_MCD_DELIVERS_MPA_AUTHORIZED_METHODS_ONLY');
assert.deepEqual(c.authorityChain,['METHOD_REGISTRY','CORE_RUNTIME','MPA','MCD','CLIENT']);
assert.equal(c.authorityOwners.productionEligibility,'MPA');
assert.equal(c.authorityOwners.productionDispatch,'MPA');
for (const k of ['implementedDoesNotEqualProduction','registeredDoesNotEqualDispatchAllowed','frontendVisibilityDoesNotEqualExecutionAuthority','rendererExistsDoesNotEqualProductionAvailability','apiCannotGrantAuthority','adapterCannotGrantAuthority','frontendCannotGrantAuthority','rendererCannotGrantAuthority','accountPlanCannotGrantAuthority']) assert.equal(c.invariants[k],true,k);
assert.equal(c.phaseBoundary.mcd0AndMcd1MayWireProductionAdapters,false);
assert.equal(c.phaseBoundary.adapterRegistrationBeginsAt,'MCD-2');
assert.equal(c.frozenMpaPreservation.inPlaceMutationAllowed,false);
for (const {path,sha256:expected} of Object.values(c.frozenMpaPreservation.baselineDigests)) {
  assert.ok(exists(path),path); assert.equal(sha256(path),expected,`Frozen predecessor drift: ${path}`);
}
assert.equal(a.status,'ACCEPTED');
assert.equal(a.acceptedFacts.mcdCannotGrantProduction,true);
assert.equal(a.acceptedFacts.mpaOwnsDispatchAuthority,true);
console.log('✓ MCD-0 Method Client Delivery Authority Boundary passed.');
console.log('  MCD delivers only MPA-authorized deterministic Method capability and cannot grant Production, Professional, Knowledge, Reality or Interpretation authority.');
console.log('  Frozen MPA-W30 and core Method histories remain byte-preserved; MCD-2 is the first Adapter binding phase.');
