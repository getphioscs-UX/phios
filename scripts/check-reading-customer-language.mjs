import fs from 'node:fs/promises';

const render = await fs.readFile('assets/js/modules/reading-render.js', 'utf8');
const css = await fs.readFile('assets/css/reading-workspace.css', 'utf8');
const en = await fs.readFile('assets/js/locales/en/reading.js', 'utf8');
const zh = await fs.readFile('assets/js/locales/zh-Hans/reading.js', 'utf8');

const requiredRenderRules = [
  'uniqueStatements',
  'sentenceOwnership',
  'reading.customer.sourceReported',
  'reading.customer.sourceSystem',
  'reading.customer.sourceUnconfirmed',
  'reading.customer.sourceNextEvidence',
  'reading-full-answer',
  'CUSTOMER_SUMMARY_LIMIT'
];

for (const rule of requiredRenderRules) {
  if (!render.includes(rule)) throw new Error(`Missing customer reading rule: ${rule}`);
}

for (const key of ['sourceReported', 'sourceSystem', 'sourceUnconfirmed', 'sourcePossible', 'sourceNextEvidence', 'expandFull']) {
  if (!en.includes(key) || !zh.includes(key)) throw new Error(`Missing bilingual customer key: ${key}`);
}

if (!css.includes('.reading-source-label') || !css.includes('.reading-full-answer')) {
  throw new Error('Missing progressive disclosure styles.');
}

console.log('Reading customer language and progressive disclosure: passed');
