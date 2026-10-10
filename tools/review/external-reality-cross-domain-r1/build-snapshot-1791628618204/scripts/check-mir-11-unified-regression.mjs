import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function runNpmScript(script) {
  const npmExecPath = process.env.npm_execpath;
  let result;

  if (npmExecPath && fs.existsSync(npmExecPath)) {
    result = spawnSync(process.execPath, [npmExecPath, 'run', script], {
      stdio: 'inherit',
      env: process.env
    });
  } else {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    result = spawnSync(command, ['run', script], {
      stdio: 'inherit',
      env: process.env,
      shell: process.platform === 'win32'
    });
  }

  if (result.error) {
    throw new Error(`${script} could not start: ${result.error.message}`, { cause: result.error });
  }
  if (result.signal) {
    throw new Error(`${script} terminated by signal ${result.signal}`);
  }
  assert.equal(result.status, 0, `${script} failed with exit status ${String(result.status)}`);
}

const scripts = [
  'check:mir-baseline',
  'check:mir-10:mir-11-successor',
  'check:mir-11:fixtures',
  'check:mir-11:structure',
  'check:mir-11:bindings',
  'check:personal-structure:mir11',
  'check:mir-11:personal-e2e',
  'check:mir-11:book-runtime',
  'check:mir-11:authority',
  'check:mir-11:route',
  'check:interpretation-runtime',
  'check:mir-11:acceptance'
];

for (const script of scripts) runNpmScript(script);

console.log('✓ MIR-11 unified machine regression passed. Final full-repository gate remains a separate fail-closed command because aligned ZIP validation has no .git history.');
