import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const baseDir = 'content/governance/current-system-baseline';
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const digest = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const assertFile = (p) => assert.equal(fs.existsSync(path.join(root,p)), true, `missing file: ${p}`);
const known = new Set(['CURRENT','LEGACY_REQUIRED','SUCCESSOR_REPLACED','DEFERRED','BLOCKED','SAFE_TO_REMOVE','UNKNOWN']);
const requiredRuntimes = ['MCD','MIR','KAP','KAU','CAR','CPR','RDG','ICR','RMO','RJX','WPR','CKA','HPC2','MPA','HDR','AST','BZR','NUM','ICH','TAR'];
const preFreeze = process.argv.includes('--pre-freeze');

const baseline = readJson(`${baseDir}/current-system-baseline-v1.json`);
const authorities = readJson(`${baseDir}/current-authority-inventory.json`);
const runtimes = readJson(`${baseDir}/current-runtime-inventory.json`);
const consumers = readJson(`${baseDir}/runtime-consumer-map-v1.json`);
const blocked = readJson(`${baseDir}/runtime-block-state-registry-v1.json`);
const orphan = readJson(`${baseDir}/runtime-orphan-audit-v1.json`);
const deletion = readJson(`${baseDir}/no-silent-deletion-contract-v1.json`);

assert.equal(baseline.commitSha,'1fcbb4216db77cbc6d0e2cabb85dafcce1488bdf');
assert.equal(baseline.rules.reproducibleFromOneCommit,true);
assert.equal(digest('package-lock.json'), baseline.digests.packageLock.sha256, 'package-lock changed after baseline');
const pkgText = fs.readFileSync(path.join(root,'package.json'),'utf8');
const pkgBeforeCBS = pkgText.replace('    "check:current-system-baseline": "node scripts/check-current-system-baseline.mjs",\n','');
assert.equal(crypto.createHash('sha256').update(pkgBeforeCBS).digest('hex'), baseline.digests.packageJson.sha256, 'package.json changed beyond additive CBS checker script');
const pkg = JSON.parse(pkgText);
assert.equal(pkg.scripts['check:current-system-baseline'],'node scripts/check-current-system-baseline.mjs');

const domains = new Set();
const authorityIds = new Set();
for (const a of authorities.authorities) {
  assert.ok(a.authorityId && a.domain && a.currentFile && a.productionStatus);
  assert.notEqual(String(a.productionStatus).toUpperCase(),'UNKNOWN');
  assert.equal(a.currentOwner,true);
  assert.equal(domains.has(a.domain),false,`duplicate current authority domain: ${a.domain}`);
  assert.equal(authorityIds.has(a.authorityId),false,`duplicate authority id: ${a.authorityId}`);
  domains.add(a.domain); authorityIds.add(a.authorityId);
  assertFile(a.currentFile);
  assert.equal(digest(a.currentFile),a.currentSha256,`authority digest drift: ${a.authorityId}`);
  assert.equal(a.consumerCount,a.consumers.length,`consumer count mismatch: ${a.authorityId}`);
  for (const pred of a.legacyPredecessors ?? []) { assertFile(pred.path); assert.equal(digest(pred.path),pred.sha256,`predecessor drift: ${pred.path}`); }
}
for (const s of authorities.knownSuccessorReconciliations ?? []) assert.notEqual(s.state,'UNRESOLVED',`unresolved successor collision: ${s.id}`);

const runtimeMap = new Map(runtimes.runtimes.map(r=>[r.runtimeId,r]));
assert.deepEqual([...runtimeMap.keys()].sort(), [...requiredRuntimes].sort(), 'runtime inventory does not exactly cover CBS required runtimes');
for (const r of runtimeMap.values()) {
  assert.ok(r.states.length > 0,`runtime has no state: ${r.runtimeId}`);
  assert.ok(r.productionStatus && String(r.productionStatus).toUpperCase() !== 'UNKNOWN',`unknown production status: ${r.runtimeId}`);
  if (r.runtimeId==='ICH' || r.runtimeId==='TAR') {
    assert.equal(r.registered,true); assert.equal(r.implemented,false); assert.equal(r.productionAccepted,false); assert.equal(r.deferred,true);
  }
}

const consumerMap = new Map(consumers.entries.map(e=>[e.runtimeId,e]));
assert.deepEqual([...consumerMap.keys()].sort(), [...requiredRuntimes].sort(), 'consumer map does not cover all required runtimes');
for (const r of runtimeMap.values()) {
  const c=consumerMap.get(r.runtimeId);
  assert.ok(c.projection && c.consumerMode && c.userAction,`incomplete consumer trace: ${r.runtimeId}`);
  if (r.productionAccepted) {
    const direct = c.routes.length > 0 || ['INTERNAL_CHAIN','BOUNDARY_CONSUMER','NO_DIRECT_SURFACE_BY_DESIGN'].includes(c.consumerMode);
    assert.equal(direct,true,`production accepted runtime lacks production consumer: ${r.runtimeId}`);
  }
}

const blockMap = new Map(blocked.entries.map(e=>[e.runtimeId,e]));
for (const r of runtimeMap.values()) if (r.blocked || r.deferred) assert.ok(blockMap.has(r.runtimeId),`missing block/deferred registry entry: ${r.runtimeId}`);
for (const e of blocked.entries) {
  assert.ok(['BLOCKED','DEFERRED'].includes(e.state));
  if (e.state==='BLOCKED') assert.equal(e.unfinished,false,`BLOCKED incorrectly means unfinished: ${e.runtimeId}`);
}

for (const rec of orphan.runtimeRecords) {
  assert.ok(known.has(rec.classification),`invalid orphan classification: ${rec.classification}`);
  assert.notEqual(rec.classification,'UNKNOWN',`current runtime cannot remain UNKNOWN: ${rec.runtimeId}`);
  if (rec.classification==='CURRENT') assert.equal(rec.orphan,false,`orphan current runtime: ${rec.runtimeId}`);
}
for (const u of orphan.unknownArtifacts) { assert.equal(u.classification,'UNKNOWN'); assert.equal(u.deletionAllowed,false,'UNKNOWN artifact cannot be deleted'); }
assert.equal(orphan.safeToRemoveCount,0,'CBS cannot silently create removal candidates');
assert.equal(orphan.duplicateAuthorityAudit.duplicateCurrentAuthorityCount,0,'duplicate current authority reported');

assert.deepEqual(deletion.sequence,['OLD','SUCCESSOR_MAPPED','CONSUMER_MIGRATED','COMPATIBILITY_VERIFIED','DEPRECATED','REMOVABLE']);
assert.equal(deletion.currentBatch.silentDeletionPerformed,false);
assert.deepEqual(deletion.currentBatch.removedFiles,[]);
assert.equal(deletion.rules.directDeletionAllowed,false);
assert.equal(deletion.rules.unknownDeletionAllowed,false);

if (!preFreeze) {
  const freeze = readJson(`${baseDir}/current-system-baseline-freeze-v1.json`);
  assert.equal(freeze.work,'CBS-W8');
  assert.equal(freeze.status,'FROZEN_CBS_W0_W8');
  assert.equal(freeze.baselineCommit,baseline.commitSha);
  for (const rec of freeze.frozenArtifacts) { assertFile(rec.path); assert.equal(digest(rec.path),rec.sha256,`freeze digest drift: ${rec.path}`); }
  assert.equal(freeze.exitGate.currentSystemBaselineCheckerGreen,true);
  assert.equal(freeze.exitGate.phase1EntryAllowed,true);
}

console.log(`✓ CBS-W1 Authority Inventory passed: ${authorities.authorities.length} explicit current authority domains; no duplicate current owner.`);
console.log(`✓ CBS-W2–W4 runtime/consumer/block state passed: ${requiredRuntimes.length} required runtimes are explicit; blocked/deferred is not treated as unfinished.`);
console.log(`✓ CBS-W5–W6 orphan/deletion boundary passed: 0 UNKNOWN current runtimes; UNKNOWN artifacts are fail-closed and no silent deletion occurred.`);
console.log(preFreeze ? '✓ CBS-W7 pre-freeze checker passed; W8 freeze may now be written.' : '✓ CBS-W7–W8 Current System Baseline passed and frozen; Phase 1 entry is allowed by the CBS gate.');
