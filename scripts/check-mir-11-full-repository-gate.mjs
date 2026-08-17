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
  assert.equal(result.status, 0, `MIR11_FULL_REPOSITORY_CHECK_FAILED: ${script} exited with ${String(result.status)}`);
}

runNpmScript('check');
console.log('✓ MIR-11 full repository gate passed: npm run check is green in a real Git worktree.');
