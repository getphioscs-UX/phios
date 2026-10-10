import { readFile } from 'node:fs/promises';
const readJson = async p => JSON.parse(await readFile(new URL(`../${p}`, import.meta.url), 'utf8'));
const books = await readJson('content/registry/books.json');
const parts = await readJson('content/registry/parts.json');
const assets = await readJson('content/registry/public-assets.json');
const expected = [
  ['book-1',[1,2,3,4]], ['book-2',[5,6,7,8,9]], ['book-3',[10,11,12]], ['book-4',[13,14,15]]
];
if (books.books.length !== 4) throw new Error('Expected exactly four books.');
for (const [id, nums] of expected) {
  const book = books.books.find(x => x.book_id === id);
  if (!book || JSON.stringify(book.parts) !== JSON.stringify(nums)) throw new Error(`Invalid mapping for ${id}.`);
  for (const n of nums) {
    const part = parts.parts.find(x => x.number === n);
    if (!part || part.book !== id) throw new Error(`Part ${n} is not mapped to ${id}.`);
  }
}
if (parts.parts.length !== 15) throw new Error('Expected 15 numbered parts.');
if (!assets.resolution_policy?.fail_closed) throw new Error('Public asset resolution must fail closed until domain verification.');
console.log('✓ BOOK-W0 four-volume publication migration contract passed.');
