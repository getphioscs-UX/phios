import {
  createHash
} from 'node:crypto';
import {
  createReadStream,
  openSync,
  readSync,
  closeSync,
  statSync
} from 'node:fs';
import path from 'node:path';
import {
  spawnSync
} from 'node:child_process';

const [inputPath] = process.argv.slice(2);
if (!inputPath) {
  throw new Error(
    'Usage: npm run book:r2:upload -- <absolute-or-relative-path-to-book-one.pdf>'
  );
}
const pdfPath = path.resolve(process.cwd(), inputPath);
if (path.extname(pdfPath).toLowerCase() !== '.pdf') {
  throw new Error('The Book I source file must use the .pdf extension.');
}
const stat = statSync(pdfPath);
if (!stat.isFile() || stat.size < 1024) {
  throw new Error('The Book I source PDF is missing or unexpectedly small.');
}
const descriptor = openSync(pdfPath, 'r');
const header = Buffer.alloc(5);
try {
  readSync(descriptor, header, 0, header.length, 0);
} finally {
  closeSync(descriptor);
}
if (header.toString('ascii') !== '%PDF-') {
  throw new Error('The selected file does not have a PDF header.');
}

const hash = createHash('sha256');
for await (const chunk of createReadStream(pdfPath)) hash.update(chunk);
const sha256 = hash.digest('hex');
const objectPath =
  'phios-private-books/private/books/book-one/zh-Hans/book-one-v1.pdf';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npxCommand, [
  'wrangler',
  'r2',
  'object',
  'put',
  objectPath,
  `--file=${pdfPath}`,
  '--content-type=application/pdf',
  '--remote'
], {
  stdio: 'inherit',
  shell: false
});
if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`R2 upload failed with exit code ${result.status}.`);
}
console.log(`✓ Uploaded private Book I PDF (${stat.size} bytes).`);
console.log(`  SHA-256: ${sha256}`);
console.log('  Set BOOK_ONE_SOURCE_SHA256 to this value before enabling sales.');
