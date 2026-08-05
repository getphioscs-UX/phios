import fs from 'node:fs/promises';

const path = 'package.json';
const packageJson = JSON.parse(await fs.readFile(path, 'utf8'));

packageJson.scripts['check:kh-w4b.5-book-3-final-r1'] =
  'node scripts/check-kh-w4b5-book-3-final-r1-checker-repair.mjs';

const gate =
  'node scripts/check-kh-w4b5-book-3-final-r1-checker-repair.mjs';
const book3Gate =
  'node scripts/check-kh-w4b5-book-3-canonical-node-registry.mjs';

if (!packageJson.scripts.precheck.includes(gate)) {
  packageJson.scripts.precheck = packageJson.scripts.precheck.includes(book3Gate)
    ? packageJson.scripts.precheck.replace(
        book3Gate,
        `${book3Gate} && ${gate}`
      )
    : `${packageJson.scripts.precheck} && ${gate}`;
}

await fs.writeFile(path, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
console.log('✓ package.json updated for Book 3 Final R1.');
