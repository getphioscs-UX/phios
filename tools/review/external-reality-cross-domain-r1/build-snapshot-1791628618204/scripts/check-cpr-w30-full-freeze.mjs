import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path'; import crypto from 'node:crypto';
const root=process.cwd(); const f=JSON.parse(await fs.readFile(path.join(root,'content/professional/canonical-presentation-runtime/freeze/cpr-w7-w30-full-freeze-v1.json'),'utf8'));
assert.equal(f.status,'frozen'); assert.equal(f.completedWorks.length,24); assert.equal(f.completedWorks[0],'CPR-W7'); assert.equal(f.completedWorks.at(-1),'CPR-W30');
for (const rel of f.outputs){const b=await fs.readFile(path.join(root,rel)); assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.digests[rel],`digest ${rel}`)}
const reg=JSON.parse(await fs.readFile(path.join(root,'content/professional/canonical-presentation-runtime/registries/canonical-presentation-registry-v1.json'),'utf8')); assert.equal(reg.productionRecords.length,0);
console.log('✓ CPR-W30 full presentation freeze passed.');
