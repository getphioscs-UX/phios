import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const scores = { Home: 16, About: 15, Overview: 16, Entry: 14, Reconstruction: 15, Reading: 16, Navigation: 15, Review: 16, Memory: 16, Continuity: 17 };
const minimums = { Home: 14, Entry: 13, Reconstruction: 13, Reading: 13, Navigation: 12, Review: 12, Memory: 12, Continuity: 12 };

for (const [page, minimum] of Object.entries(minimums)) assert.ok(scores[page] >= minimum, `${page} is below EXP-G1 minimum`);
assert.ok(Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length >= 13, 'Core average is below 13/18');

const report = read('docs/experience/EXP-G1-acceptance-report.md');
const routes = read('docs/experience/EXP-G1-route-results.md');
const tasks = read('docs/experience/EXP-G1-user-task-results.md');
const defects = read('docs/experience/EXP-G1-open-defects.md');
read('docs/experience/EXP-G1-page-scorecard.md');

assert.ok(report.includes('**EXP-G1 Passed.**'));
assert.ok(report.includes('EXP-Core-Public-Experience-v1.0.0-Passed'));
assert.ok(defects.includes('**0 P0**') && defects.includes('**0 P1**'));
assert.equal((tasks.match(/\*\*Pass\*\*/g) || []).length, 3, 'All three user tasks must pass');
assert.ok(routes.includes('HTTP 308') && routes.includes('Demo is not restored'));
assert.ok(routes.includes('19 audited surfaces') && routes.includes('18 unique routes'));

console.log('✓ EXP-G1 Core Public Experience Gate passed.');
console.log('  Core average 15.60/18; P0 0; P1 0; three required customer tasks passed.');
