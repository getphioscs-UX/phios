import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'phios-cx-scan-'));
const moduleUrl = new URL('./lib/customer-experience-rebuild/cx-r1-guards.mjs', import.meta.url).href;
let passed = false;
async function write(name, content) {
  const file = path.join(fixture, name);
  await fs.mkdir(path.dirname(file), {recursive:true});
  await fs.writeFile(file, content);
}
try {
  const html = '<main data-cx-surface="TEST"><link rel="stylesheet" href="/assets/css/phios-public-v2.css"></main>';
  for (const file of [
    'perspectives/new-customer/index.html',
    '.worktrees/parallel/.phios-repair-backups/snapshot/tools/review/old.html',
    '.phios-repair-backups/snapshot/old.html',
    '.tmp/browser/extension.html',
    '.pages-output-current/old.html',
    'tools/review/history.html'
  ]) await write(file, html);
  await write('assets/customer-ui/new-feature.js', '// current customer implementation');
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const guards = await import(process.argv[1]);
    assert.deepEqual(guards.cxHtmlSurfaces(), ['perspectives/new-customer/index.html']);
    assert.deepEqual(guards.cxImplementationFiles(), ['assets/customer-ui/new-feature.js', 'perspectives/new-customer/index.html']);
    // A real customer page containing legacy CSS is still admitted to the
    // detector's input; source exclusion cannot hide its violation.
    const fs = await import('node:fs');
    assert(guards.stylesheetRefs(fs.readFileSync('perspectives/new-customer/index.html','utf8')).includes('/assets/css/phios-public-v2.css'));
    console.log('PASS CX source scan boundary: current HTML/JS retained; nested worktrees, repair backups, build output and review evidence excluded.');
  `, moduleUrl], {cwd:fixture, encoding:'utf8'});
  assert.equal(run.status, 0, run.stderr);
  process.stdout.write(run.stdout);
  passed = true;
} finally {
  assert(path.resolve(fixture).startsWith(path.resolve(os.tmpdir()) + path.sep));
  if (passed) {
    await fs.writeFile(path.join(fixture, 'cleanup-receipt.json'), JSON.stringify({path:fixture,reason:'Completed isolated scanner fixture',createdByThisTest:true}));
    await fs.rm(fixture, {recursive:true});
  } else console.error(`Failed scanner fixture retained: ${fixture}`);
}
