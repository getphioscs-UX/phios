import fs from 'node:fs/promises';

const path = 'package.json';
const packageJson = JSON.parse(await fs.readFile(path, 'utf8'));

packageJson.scripts['check:kh-w4b.5-book-3-r3'] =
  'node scripts/check-kh-w4b5-book-3-r3-book-i-scope-repair.mjs';

const gate =
  'node scripts/check-kh-w4b5-book-3-r3-book-i-scope-repair.mjs';
const r2Gate =
  'node scripts/check-kh-w4b5-book-3-r2-compatibility-repair.mjs';

if (!packageJson.scripts.precheck.includes(gate)) {
  packageJson.scripts.precheck = packageJson.scripts.precheck.includes(r2Gate)
    ? packageJson.scripts.precheck.replace(r2Gate, `${r2Gate} && ${gate}`)
    : `${packageJson.scripts.precheck} && ${gate}`;
}

await fs.writeFile(path, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
console.log('✓ package.json updated for KH-W4B.5 Book 3 R3.');
