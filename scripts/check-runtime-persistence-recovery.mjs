import fs from 'node:fs';

const required = [
  'assets/js/modules/runtime-persistence.js',
  'functions/runtime/continuity/reality-continuity-contract.js',
  'functions/runtime/continuity/memory-continuity-builder.js'
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);

const persistence = fs.readFileSync('assets/js/modules/runtime-persistence.js', 'utf8');
for (const token of [
  'phi-os.runtime-snapshot.v1',
  'phi-os.runtime-recovery-state.v1',
  'RUNTIME_PERSISTENCE_KEYS',
  'saveRuntimeSnapshot',
  'restoreRuntimeSnapshot',
  'validateRuntimeSnapshot',
  'checksum_mismatch',
  'historicalOverwriteAllowed: false',
  'automaticRuntimeCreation: false',
  "driver: DRIVER"
]) if (!persistence.includes(token)) throw new Error(`Runtime Persistence missing ${token}`);

const shared = fs.readFileSync('assets/js/shared.js', 'utf8');
for (const token of ['initializeRuntimePersistence()', 'scheduleRuntimeSnapshot', 'removePersistedContract']) {
  if (!shared.includes(token)) throw new Error(`Shared runtime integration missing ${token}`);
}

console.log('Runtime Persistence & Recovery checks passed.');
