import fs from 'node:fs';
const required = [
  'assets/js/modules/runtime-workspace-state.js',
  'assets/js/pages/my-reality.js',
  'my-reality.html'
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}
for (const file of ['reality-entry.html','reality-reconstruction.html','reality-reading.html','reality-navigation.html','reality-review.html','my-reality.html']) {
  const html=fs.readFileSync(file,'utf8');
  if (!html.includes('data-runtime-workspace')) throw new Error(`${file} missing Runtime Workspace`);
}
const state=fs.readFileSync('assets/js/modules/runtime-workspace-state.js','utf8');
for (const token of ['phi-os.runtime-workspace-state.v1','availableStages','completedStages','CONTINUITY_KEY']) {
  if (!state.includes(token)) throw new Error(`Workspace state missing ${token}`);
}
const memory=fs.readFileSync('assets/js/pages/my-reality.js','utf8');
for (const token of ['phi-os.continuity.v1','automaticSelection:false','createsNextRuntime:false','continuityMismatch']) {
  if (!memory.includes(token)) throw new Error(`Memory/Continuity view missing ${token}`);
}
console.log('Runtime Workspace Completion OK.');
