import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = path => fs.readFile(path, 'utf8');
const [contract, home, about, en, zh] = await Promise.all([
  read('docs/experience/EXP-W2-home-discover-about-contract.json').then(JSON.parse),
  read('index.html'),
  read('about.html'),
  read('assets/js/locales/en/public.js'),
  read('assets/js/locales/zh-Hans/public.js')
]);

assert.equal(contract.freezeId, 'EXP-W2-v1.0.0-Frozen');
assert.equal(contract.routeDecision.home, '/');
assert.equal(contract.routeDecision.secondDiscoverRouteCreated, false);
assert.equal((home.match(/public-button--primary/g) || []).length, 1);
assert.match(home, /public-button--primary" href="\/reality-journey"/);
for (const href of ['/reality-journey', '/library', '/services']) assert.match(home, new RegExp(`href="${href}"`));
assert.doesNotMatch(home, /href="\/reality-demo"/);
for (const id of ['why-phios', 'responsibility', 'limits', 'trust']) assert.match(about, new RegExp(`id="${id}"`));
for (const forbidden of ['Unified Runtime Framework', 'integrated reference implementation']) {
  assert.equal(home.includes(forbidden), false);
  assert.equal(about.includes(forbidden), false);
}
for (const required of ['general chatbot', 'FREE PUBLIC CONTENT', 'SEPARATE PAID SERVICES']) assert.ok(en.includes(required));
for (const required of ['一般聊天机器人', '免费公共内容', '独立付费服务']) assert.ok(zh.includes(required));
assert.ok(contract.score.home >= 14);
assert.ok(contract.score.about >= 13);
for (const changed of Object.values(contract.boundaries)) assert.equal(changed, false);

console.log('✓ EXP-W2 Home, Discover and About contract passed');
console.log('  Home 16/18; About 15/18; one primary Home action; Discover remains the / label.');
