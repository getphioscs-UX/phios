import { access, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = Object.freeze([
  // Platform entry and Runtime Journey pages.
  'index.html',
  'reality-entry.html',
  'reality-reconstruction.html',
  'reality-reading.html',
  'reality-navigation.html',

  // Shared and workspace styles.
  'assets/css/styles.css',
  'assets/css/tokens.css',
  'assets/css/i18n.css',
  'assets/css/entry-workspace.css',
  'assets/css/reconstruction-workspace.css',
  'assets/css/reading-workspace.css',
  'assets/css/navigation-workspace.css',

  // Frontend entry modules.
  'assets/js/pages/landing.js',
  'assets/js/reality-entry.js',
  'assets/js/reconstruction.js',
  'assets/js/reading.js',
  'assets/js/navigation.js',
  'assets/js/i18n.js',
  'assets/js/locales/en.js',
  'assets/js/locales/zh-Hans.js',

  // Formal Cloudflare Pages Functions routes.
  'functions/api/reconstruct-reality.js',
  'functions/api/reconstruct-runtime.js',
  'functions/api/read-runtime.js',
  'functions/api/navigate-runtime.js',

  // Deterministic Runtime engines.
  'functions/runtime/entry/rule-entry.js',
  'functions/runtime/reconstruction/rule-reconstruction.js',
  'functions/runtime/reading/rule-reading.js',
  'functions/runtime/navigation/rule-navigation.js',

  // Cloudflare configuration.
  'wrangler.jsonc'
]);

const missingFiles = [];
const emptyFiles = [];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(root, relativePath);

  try {
    await access(absolutePath);
    const file = await stat(absolutePath);

    if (!file.isFile()) {
      missingFiles.push(`${relativePath} (not a file)`);
    } else if (file.size === 0) {
      emptyFiles.push(relativePath);
    }
  } catch {
    missingFiles.push(relativePath);
  }
}

if (missingFiles.length || emptyFiles.length) {
  const lines = ['PHI OS project structure check failed.'];

  if (missingFiles.length) {
    lines.push('', 'Missing required files:');
    lines.push(...missingFiles.map(file => `- ${file}`));
  }

  if (emptyFiles.length) {
    lines.push('', 'Required files that are empty:');
    lines.push(...emptyFiles.map(file => `- ${file}`));
  }

  throw new Error(lines.join('\n'));
}

console.log(
  `PHI OS project structure OK (${requiredFiles.length} required files).`
);
