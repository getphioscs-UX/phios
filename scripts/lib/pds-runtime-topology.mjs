import assert from 'node:assert/strict';

export function partitionRuntimeTopology(changedFiles, baselineFiles, localeFiles) {
  const locales = changedFiles.filter(file => file.startsWith('functions/runtime/locales/'));
  assert.deepEqual([...locales].sort(), [...localeFiles].sort(), 'PDS_W0_ECR_LOCALE_TOPOLOGY_DRIFT');
  assert.ok(changedFiles.every(file => !baselineFiles.includes(file)), 'PDS_W0_BASELINE_RUNTIME_FILE_CHANGED');
  return changedFiles.filter(file => !file.startsWith('functions/runtime/locales/'));
}
