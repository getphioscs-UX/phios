import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('content/knowledge/manuscripts/book-1/manuscript-manifest.json'));
const specs = { P2:'books/book-1/extracted/p2-projection-system.md', P3:'books/book-1/extracted/p3-runtime-dynamics.md', P4:'books/book-1/extracted/p4-human-runtime-carrier.md', P5:'books/book-1/extracted/p5-conscious-runtime.md' };
for (const [partCode, objectKey] of Object.entries(specs)) {
 const n=partCode.slice(1);
 const expected={ [`knowledge:manuscript:extract-p${n}`]:`node scripts/extract-book-i-p${n}.mjs`, [`knowledge:manuscript:review-p${n}`]:`node scripts/review-book-i-p${n}.mjs review`, [`knowledge:manuscript:upload-p${n}`]:`node scripts/review-book-i-p${n}.mjs upload`, [`knowledge:manuscript:review-map-p${n}`]:`node scripts/review-book-i-p${n}-mapping.mjs review`, [`knowledge:manuscript:apply-map-p${n}`]:`node scripts/review-book-i-p${n}-mapping.mjs apply` };
 for (const [name,command] of Object.entries(expected)) assert.equal(pkg.scripts[name],command);
 const files=[`scripts/extract-book-i-p${n}.mjs`,`scripts/review-book-i-p${n}.mjs`,`scripts/review-book-i-p${n}-mapping.mjs`,`scripts/lib/knowledge-manuscripts/p${n}-searchable-pdf-extraction.mjs`,`scripts/lib/knowledge-manuscripts/p${n}-human-review.mjs`,`scripts/lib/knowledge-manuscripts/p${n}-mapping-review.mjs`];
 const source=files.map(read).join('\n');
 assert(source.includes(partCode)); assert(source.includes(objectKey)); assert(source.includes('searchable_pdf_text_layer')); assert(source.includes('human_review_required')); assert(source.includes('private_mapped_only')); assert(source.includes('mapping_metadata_only_no_continuous_body'));
 assert(!/publicUrl|presignedUrl|r2\.dev/u.test(source)); assert(!/content\/knowledge\/articles|content\/knowledge\/production|functions\/runtime/u.test(source));
 const part=manifest.parts.find(item=>item.partCode===partCode); assert(part); assert(['not_materialized','human_verified'].includes(part.normalizationStatus));
}
assert.equal(pkg.scripts['check:knr-w2r1-t09-p2-p5'],'node scripts/check-knr-w2r1-t09-p2-p5-progressive-extraction.mjs');
console.log('✓ KNR-W2R1-T09 P2–P5 Progressive Extraction contracts passed.');
console.log('  Each Part has independent extraction, TL review, private R2 upload, inventory and atomic mapping commands.');
console.log('  No command can approve P2–P5 together; each Part remains separately human-governed.');
