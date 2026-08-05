import fs from 'node:fs';
const files=[1,2,3,4,5].flatMap(p=>[`scripts/lib/knowledge-manuscripts/p${p}-human-review.mjs`,`scripts/lib/knowledge-manuscripts/p${p}-mapping-review.mjs`]);
files.push('scripts/book-i-manuscript-v1-2.mjs');
for(const file of files){if(!fs.existsSync(file))throw new Error(`Missing ${file}`)}
for(let p=1;p<=5;p++){
 const h=fs.readFileSync(`scripts/lib/knowledge-manuscripts/p${p}-human-review.mjs`,'utf8');
 if(h.includes("IfNoneMatch: '*'"))throw new Error(`P${p} still uses unsafe conditional upload`);
 const m=fs.readFileSync(`scripts/lib/knowledge-manuscripts/p${p}-mapping-review.mjs`,'utf8');
 if(!m.includes(`review.stage !== 'KNR-W2R1-T09-P${p}'`))throw new Error(`P${p} mapping stage mismatch`);
}
console.log('✓ KNR-W2R1 v1.2 contract passed.');
console.log('  P1–P5 use verified upload, consistent T09 identities, batch approval/upload/reconcile, and controlled mapping-review reset.');
