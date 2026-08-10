import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const manifest=await read('content/professional/core-method-runtime/bzr-runtime-manifest-v1.json'); const w6=manifest.pipeline.find(x=>x.stageCode==='BZR-W6');
assert.equal(manifest.pluginCode,'BZR'); assert.ok(w6); assert.equal(w6.status,'not_eligible'); assert.equal(manifest.activation.productionEligible,false); assert.equal(manifest.activation.professionalReady,false); assert.equal(manifest.activation.pluginActivated,false);
console.log('✓ BZR-W6 Production boundary checker passed.'); console.log('✓ BZR remains not eligible; registration grants no production activation.');
