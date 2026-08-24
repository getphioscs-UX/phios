import fs from 'node:fs';

const targets = [
  'functions/canonical-meaning-production/zi-wei-meaning-runtime.js',
  'functions/zi-wei-runtime/policy-gate.js',
  'functions/zi-wei-runtime/runtime-activation-gate.js',
  'functions/method-production-activation/zwr-production-authority-runtime.js'
];

for (const file of targets) {
  const text = fs.readFileSync(file, 'utf8');
  if (/fileURLToPath\s*\(\s*import\.meta\.url\s*\)/.test(text)) {
    throw new Error(`${file}: Worker-unsafe fileURLToPath(import.meta.url) remains`);
  }
  if (/from ['"]node:(fs|path|url)['"]/.test(text)) {
    throw new Error(`${file}: Worker filesystem/path/url import remains`);
  }
}

console.log('✓ ZWR Worker-safe resource import gate passed.');
console.log('  Zi Wei runtime JSON authorities are statically bundled.');
console.log('  No fileURLToPath(import.meta.url), node:fs, node:path or node:url remains in the four deploy-path modules.');
