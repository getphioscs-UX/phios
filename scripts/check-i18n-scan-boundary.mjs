import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const checker = await fs.readFile(new URL('./check-i18n.mjs', import.meta.url), 'utf8');
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'phios-i18n-boundary-'));
async function write(name, text) {
  const file = path.join(root, name);
  await fs.mkdir(path.dirname(file), {recursive: true});
  await fs.writeFile(file, text);
}
await write('package.json', '{"type":"module"}');
await write('scripts/check-i18n.mjs', checker);
for (const locale of ['en', 'zh-Hans']) await write(`assets/js/locales/${locale}.js`, "export default {known:'Known'};");
await write('index.html', '<p data-i18n="known"></p>');
await write('.worktrees/parallel/.tmp/edge/Default/Extensions/example/options.html', '<p data-i18n="extension_private_key"></p>');
await write('.tmp/edge/options.html', '<p data-i18n="temporary_extension_key"></p>');
const run = () => spawnSync(process.execPath, [path.join(root, 'scripts/check-i18n.mjs')], {encoding:'utf8'});
try {
  let r = run();
  assert.equal(r.status, 0, r.stderr);
  await write('public-page.html', '<p data-i18n="genuine_missing_key"></p>');
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /public-page\.html: missing translation key genuine_missing_key/);
  assert.doesNotMatch(r.stderr, /extension_private_key|temporary_extension_key/);
  // Keep the real HTML failure while proving actual JS references are checked too.
  await write('assets/js/customer.js', "import {t} from './i18n.js'; t('genuine_js_missing_key');");
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /customer\.js: missing translation key genuine_js_missing_key/);
  console.log('PASS i18n scan boundary: nested worktree/browser artifacts excluded; real HTML and JS missing keys still fail.');
} finally {
  // Only remove this process's newly allocated temporary fixture.
  const receipt = {path:root,reason:'Completed isolated i18n scanner fixture',createdByThisTest:true};
  await fs.writeFile(path.join(root, 'cleanup-receipt.json'), JSON.stringify(receipt));
  assert(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
  await fs.rm(root, {recursive:true});
}
