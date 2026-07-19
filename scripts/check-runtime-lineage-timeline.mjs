import fs from 'node:fs';

const required = [
  'assets/js/modules/runtime-lineage.js',
  'assets/js/pages/my-reality.js',
  'my-reality.html',
  'assets/css/runtime-workspace.css'
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);

const lineage = fs.readFileSync(required[0], 'utf8');
const page = fs.readFileSync(required[1], 'utf8');
const html = fs.readFileSync(required[2], 'utf8');
const css = fs.readFileSync(required[3], 'utf8');
const checks = [
  ['lineage schema', lineage.includes("phi-os.runtime-lineage.v1")],
  ['archived runtime history', lineage.includes('RUNTIME_HISTORY_KEY') && lineage.includes("status: 'archived'")],
  ['active runtime', lineage.includes("status: 'active'")],
  ['reading revisions', lineage.includes('READING_REVISION_HISTORY_KEY') && lineage.includes("type: 'reading_revision'")],
  ['navigation selection history', lineage.includes('selectionHistory') && lineage.includes("type: 'path_changed'")],
  ['append only guardrail', lineage.includes('appendOnlyHistory: true') && lineage.includes('historicalOverwriteAllowed: false')],
  ['reported experience boundary', lineage.includes('reportedExperienceRemainsUnverified: true')],
  ['timeline rendering', page.includes('buildRuntimeLineage') && page.includes('renderRuntimeTimeline')],
  ['timeline markup', html.includes('id="runtimeTimeline"') && html.includes('data-i18n="lineage.title"')],
  ['timeline styles', css.includes('.runtime-timeline') && css.includes('.runtime-lineage-card')]
];
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) throw new Error(`Runtime lineage checks failed: ${failed.map(([name]) => name).join(', ')}`);
console.log('✓ Runtime Lineage & Timeline');
