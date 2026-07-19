import fs from 'node:fs';

const required = [
  'assets/js/modules/runtime-workspace.js',
  'assets/js/modules/runtime-workspace-state.js',
  'assets/js/modules/runtime-transition-engine.js',
  'assets/css/runtime-workspace.css',
  'reality-review.html',
  'assets/js/review.js',
  'my-reality.html',
  'assets/js/pages/my-reality.js',
  'thesis.html',
  'assets/js/locales/en/thesis.js',
  'assets/js/locales/zh-Hans/thesis.js'
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);

for (const file of ['reality-entry.html','reality-reconstruction.html','reality-reading.html','reality-navigation.html','reality-review.html','my-reality.html']) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('data-runtime-workspace')) throw new Error(`${file} missing Runtime Workspace`);
}

const state = fs.readFileSync('assets/js/modules/runtime-workspace-state.js', 'utf8');
for (const token of ['phi-os.runtime-workspace-state.v1','availableStages','completedStages','CONTINUITY_KEY']) {
  if (!state.includes(token)) throw new Error(`Workspace state missing ${token}`);
}

const review = fs.readFileSync('assets/js/review.js', 'utf8');
for (const token of ['reported_experience','readingOverwriteAllowed:false','automaticSelection:false']) {
  if (!review.includes(token)) throw new Error(`Review boundary missing: ${token}`);
}

const memory = fs.readFileSync('assets/js/pages/my-reality.js', 'utf8');
for (const token of ['phi-os.continuity.v1','automaticSelection:false','createsNextRuntime:false','executeRuntimeTransition']) {
  if (!memory.includes(token)) throw new Error(`Memory/Continuity view missing ${token}`);
}

const engine = fs.readFileSync('assets/js/modules/runtime-transition-engine.js', 'utf8');
for (const token of [
  'phi-os.runtime-transition-execution.v1',
  'automaticExecution: false',
  'createsNextRuntime: false',
  'historicalOverwrite: false',
  'READING_REVISION_REQUEST_KEY',
  'ENTRY_CONTINUITY_HANDOFF_KEY',
  'preserveNavigationHistoryAndClearSelection',
  'appendRuntimeHistory'
]) if (!engine.includes(token)) throw new Error(`Runtime Transition Engine missing ${token}`);

console.log('Runtime Workspace and Transition Engine: passed.');
