import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

export const ROOT = process.cwd();
export const BASELINE_COMMIT = 'ef4d0b5a2e3a75e5557045c7e4bc59a2f3672cd5';
export const MRM_ROOT = 'content/runtime-maturity';
export const RM_CODES = Array.from({ length: 10 }, (_, i) => `RM-${i}`);
export const EM_CODES = Array.from({ length: 10 }, (_, i) => `EM-${i}`);

export const PATHS = Object.freeze({
  s0: `${MRM_ROOT}/authority/master-runtime-authority-baseline-v1.json`,
  s1: `${MRM_ROOT}/registries/runtime-maturity-state-registry-v1.json`,
  s2: `${MRM_ROOT}/registries/evidence-maturity-level-registry-v1.json`,
  s3classes: `${MRM_ROOT}/registries/evidence-class-registry-v1.json`,
  s3contract: `${MRM_ROOT}/contracts/evidence-object-contract-v1.json`,
  s4binding: `${MRM_ROOT}/contracts/evidence-version-binding-contract-v1.json`,
  s4staleness: `${MRM_ROOT}/contracts/evidence-staleness-policy-v1.json`,
  promotion: `${MRM_ROOT}/contracts/maturity-promotion-contract-v1.json`,
  claim: `${MRM_ROOT}/contracts/claim-eligibility-contract-v1.json`,
  s5: `${MRM_ROOT}/registries/master-runtime-capability-inventory-v1.json`,
  rmMatrix: `${MRM_ROOT}/matrices/master-runtime-maturity-matrix-v1.json`,
  emMatrix: `${MRM_ROOT}/matrices/master-evidence-maturity-matrix-v1.json`,
  claimMatrix: `${MRM_ROOT}/matrices/runtime-claim-eligibility-matrix-v1.json`,
  runtimeSummary: `${MRM_ROOT}/matrices/master-runtime-capability-summary-v1.json`,
  acceptance: `${MRM_ROOT}/acceptance/mrm-s-phase-a-acceptance-v1.json`,
});

export function abs(rel) { return path.join(ROOT, rel); }
export function exists(rel) { return fs.existsSync(abs(rel)); }
export function readJson(rel) { return JSON.parse(fs.readFileSync(abs(rel), 'utf8')); }
export function sha256(rel) { return crypto.createHash('sha256').update(fs.readFileSync(abs(rel))).digest('hex'); }
export function assertBaseline(doc, work) {
  assert.equal(doc.phase, 'MRM-S', `${work}_PHASE_DRIFT`);
  assert.equal(doc.baselineCommit, BASELINE_COMMIT, `${work}_BASELINE_COMMIT_DRIFT`);
}
export function assertRef(ref, label) {
  assert.ok(ref && typeof ref.path === 'string', `${label}_REFERENCE_MISSING`);
  assert.ok(exists(ref.path), `${label}_PATH_MISSING: ${ref.path}`);
  assert.equal(sha256(ref.path), ref.sha256, `${label}_DIGEST_DRIFT: ${ref.path}`);
}
export function capabilityKey(x) { return `${x.runtimeCode}::${x.capabilityCode}`; }
export function byCapability(records) { return new Map(records.map(x => [capabilityKey(x), x])); }

export function evaluateRm(cap) {
  let highest = 'NOT_ASSESSED';
  for (const level of RM_CODES) {
    if ((cap.notApplicableRmLevels || []).includes(level)) continue;
    const refs = cap.rmEvidence?.[level];
    if (Array.isArray(refs) && refs.length > 0 && refs.every(exists)) {
      highest = level;
      continue;
    }
    break;
  }
  return highest;
}

export function assertBaselineCommitResolvableWhenGitPresent() {
  if (!exists('.git')) return 'ARCHIVE_NO_GIT_CHECK_SKIPPED';
  execFileSync('git', ['cat-file', '-e', `${BASELINE_COMMIT}^{commit}`], { cwd: ROOT, stdio: 'pipe' });
  return 'GIT_BASELINE_COMMIT_RESOLVED';
}

export function findNamedFiles(rootRel, targetName) {
  const out = [];
  const stack = [abs(rootRel)];
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git'].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.name === targetName) out.push(path.relative(ROOT, p).replaceAll('\\', '/'));
    }
  }
  return out.sort();
}

export function readPackage() { return readJson('package.json'); }
