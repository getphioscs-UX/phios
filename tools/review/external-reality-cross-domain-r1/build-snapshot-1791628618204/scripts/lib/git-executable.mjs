import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const isUsableGit = candidate => {
  if (!candidate) return false;
  const result = spawnSync(candidate, ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  return !result.error && result.status === 0 && /^git version\s+/i.test(String(result.stdout || '').trim());
};

const existingFile = candidate => {
  try { return Boolean(candidate) && fs.statSync(candidate).isFile(); }
  catch { return false; }
};

const githubDesktopCandidates = () => {
  if (process.platform !== 'win32') return [];
  const root = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'GitHubDesktop');
  if (!root || !fs.existsSync(root)) return [];
  let apps = [];
  try {
    apps = fs.readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && /^app-/i.test(entry.name))
      .map(entry => entry.name)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  } catch { return []; }
  return apps.flatMap(app => [
    path.join(root, app, 'resources', 'app', 'git', 'cmd', 'git.exe'),
    path.join(root, app, 'resources', 'app', 'git', 'bin', 'git.exe')
  ]);
};

const windowsCandidates = () => {
  if (process.platform !== 'win32') return [];
  const values = [];
  const push = value => { if (value) values.push(value); };
  for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.ProgramW6432]) {
    if (!base) continue;
    push(path.join(base, 'Git', 'cmd', 'git.exe'));
    push(path.join(base, 'Git', 'bin', 'git.exe'));
  }
  if (process.env.LOCALAPPDATA) {
    push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'cmd', 'git.exe'));
    push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'bin', 'git.exe'));
  }
  if (process.env.USERPROFILE) {
    push(path.join(process.env.USERPROFILE, 'scoop', 'apps', 'git', 'current', 'cmd', 'git.exe'));
    push(path.join(process.env.USERPROFILE, 'scoop', 'apps', 'git', 'current', 'bin', 'git.exe'));
  }
  return [...values, ...githubDesktopCandidates()];
};

export function resolveGitExecutable() {
  const explicit = String(process.env.PHIOS_GIT_BIN || '').trim();
  if (explicit) {
    if (!existingFile(explicit) || !isUsableGit(explicit)) {
      const error = new Error(`PHIOS_GIT_BIN is set but does not resolve to a usable Git executable: ${explicit}`);
      error.code = 'PHIOS_GIT_BIN_INVALID';
      throw error;
    }
    return explicit;
  }

  if (isUsableGit('git')) return 'git';

  for (const candidate of windowsCandidates()) {
    if (existingFile(candidate) && isUsableGit(candidate)) return candidate;
  }

  const error = new Error([
    'Git executable not found.',
    'PHI OS history-aware checks require a real Git executable; history verification has not been bypassed.',
    'Install/repair Git for Windows or add Git to PATH.',
    'You may also set PHIOS_GIT_BIN to the full path of git.exe for this shell.'
  ].join(' '));
  error.code = 'PHIOS_GIT_EXECUTABLE_NOT_FOUND';
  throw error;
}
