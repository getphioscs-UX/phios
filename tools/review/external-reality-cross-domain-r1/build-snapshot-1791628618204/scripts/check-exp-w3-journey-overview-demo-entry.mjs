import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = path => fs.readFile(path, 'utf8');
const contract = JSON.parse(await read('docs/experience/EXP-W3-journey-overview-demo-entry-contract.json'));
const [overview, redirects, entry, entryJs, entryCss, enJourney, zhJourney, enEntry, zhEntry] = await Promise.all([
  read('reality-journey.html'), read('_redirects'), read('reality-entry.html'),
  read('assets/js/reality-entry.js'), read('assets/css/entry-experience.css'), read('assets/js/locales/en/journey.js'), read('assets/js/locales/zh-Hans/journey.js'),
  read('assets/js/locales/en/entry.js'), read('assets/js/locales/zh-Hans/entry.js')
]);

assert.equal(contract.freezeId, 'EXP-W3-v1.0.0-Frozen');
assert.equal(contract.baselineCommit.length, 40);
assert.deepEqual(contract.customerJourney.stages, ['enter', 'describe', 'discover', 'understand', 'choose', 'continue']);
for (const stage of contract.customerJourney.stages) {
  assert.match(overview, new RegExp(`customerStages\\.${stage}\\.name`));
  assert.match(entry, new RegExp(`journeyShell\\.stages\\.${stage}`));
  assert.match(enJourney, new RegExp(`${stage}:`));
  assert.match(zhJourney, new RegExp(`${stage}:`));
}
assert.equal((overview.match(/public-button--primary/g) || []).length, 1);
assert.match(overview, /href="\/reality-dashboard"/);
assert.doesNotMatch(overview, /href="\/reality-demo"/);
assert.match(redirects, /^\/reality-demo \/reality-journey 308$/m);
assert.doesNotMatch(overview, /seven-stage|seven stages|7 bounded stages/i);

assert.match(entry, /data-current-stage="describe"/);
assert.equal((entry.match(/<data value="(?:enter|describe|discover|understand|choose|continue)"/g) || []).length, 6);
assert.match(entry, /id="entryRecoveryGate"[\s\S]*entry\.recoveryGate\.resume/);
assert.match(entryCss, /\[data-runtime-workspace\][\s\S]*display:\s*none/);
assert.match(entryJs, /catch \(error\)[\s\S]{0,500}els\.input\.value\s*=\s*message/);
assert.match(entryJs, /catch \(error\)[\s\S]{0,500}els\.input\.focus\(\)/);
for (const source of [enJourney, zhJourney, enEntry, zhEntry]) assert.doesNotMatch(source, /TODO|TBD/);
assert.ok(contract.score.entry >= 13);
assert.equal(Object.values(contract.boundaries).every(value => value === false), true);
console.log('✓ EXP-W3 customer Journey and Entry recovery remain intact; historical Demo is retired by EXP-W4A.');
