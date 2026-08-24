import crypto from 'node:crypto';
const stable = value => JSON.stringify(value, Object.keys(value || {}).sort());
const digest = value => crypto.createHash('sha256').update(stable(value)).digest('hex');
const normArray = value => Array.isArray(value) ? value : [];
const key = value => typeof value === 'string' ? value : JSON.stringify(value);

export function versionHealthReality(reality = {}, version = 1) {
  if (reality.schemaVersion !== 'PHI-OS-HEALTH-REALITY-v1.0.0') throw new Error('HRX_REALITY_REQUIRED');
  return { schemaVersion:'PHI-OS-HRX-REALITY-VERSION-v1.0.0', caseRef:reality.caseRef, version, digest:digest(reality), reality:structuredClone(reality) };
}

export function diffHealthReality(previousVersion, currentVersion) {
  if (!previousVersion?.reality || !currentVersion?.reality) throw new Error('HRX_VERSION_PAIR_REQUIRED');
  const dimensions = ['concerns','symptoms','evidence','unknowns','medications','investigations'];
  const changes = {};
  for (const dimension of dimensions) {
    const before = normArray(previousVersion.reality[dimension]);
    const after = normArray(currentVersion.reality[dimension]);
    const b = new Set(before.map(key)), a = new Set(after.map(key));
    changes[dimension] = { added: after.filter(v=>!b.has(key(v))), removed: before.filter(v=>!a.has(key(v))) };
  }
  const careChanged = previousVersion.reality.careState !== currentVersion.reality.careState;
  return {
    schemaVersion:'PHI-OS-HRX-REALITY-DIFF-v1.0.0', caseRef:currentVersion.caseRef,
    fromVersion:previousVersion.version,toVersion:currentVersion.version,changes,
    careState:{from:previousVersion.reality.careState,to:currentVersion.reality.careState,changed:careChanged},
    governance:{describesChangeNotCause:true, clinicalImprovementClaimed:false, diagnosisChangedByRuntime:false}
  };
}
