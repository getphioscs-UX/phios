import fs from 'node:fs';

const required = [
  'assets/js/modules/runtime-revision-initializer.js',
  'assets/js/modules/runtime-transition-engine.js',
  'assets/js/reality-entry.js',
  'assets/js/reading.js'
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}

const initializer = fs.readFileSync(required[0], 'utf8');
const engine = fs.readFileSync(required[1], 'utf8');
const entry = fs.readFileSync(required[2], 'utf8');
const reading = fs.readFileSync(required[3], 'utf8');

const checks = [
  ['entry initializer export', initializer.includes('initializeNewRuntimeEntry')],
  ['reading revision initializer export', initializer.includes('initializeReadingRevision')],
  ['entry handoff remains reference only', initializer.includes("referenceOnly: true") && initializer.includes("inheritedAsFact: false")],
  ['reading history append only', initializer.includes('READING_REVISION_HISTORY_KEY') && initializer.includes('appendOnly: true')],
  ['reading downstream reset', initializer.includes('downstreamContractsReset: true')],
  ['no automatic entry submission', initializer.includes('automaticEntrySubmission: false')],
  ['no automatic reading conclusion', initializer.includes('automaticReadingConclusion: false')],
  ['runtime entity passed in handoff', engine.includes('previousRuntimeEntityId: continuity.runtimeEntityId')],
  ['entry page initializes handoff', entry.includes('initializeNewRuntimeEntry()') && entry.includes('continuityContext: state.continuityHandoff')],
  ['reading page initializes revision', reading.includes('initializeReadingRevision()')]
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) throw new Error(`Runtime revision checks failed: ${failed.map(([name]) => name).join(', ')}`);

console.log('✓ Runtime Revision & New Entry Initialization');
