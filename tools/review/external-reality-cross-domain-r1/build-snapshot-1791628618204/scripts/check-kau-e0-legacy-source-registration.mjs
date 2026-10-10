import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const base='content/knowledge/authoring/extensions/legacy-supporting-source';
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const exists=async p=>{try{await fs.access(path.join(root,p));return true}catch{return false}};
const v1=await read(`${base}/registries/legacy-supporting-source-registry-v1.json`);
assert.equal(v1.entries.length,0,'KAU-E0 frozen v1 foundation registry must remain unchanged.');
assert.equal(v1.rules.emptyUntilExplicitLegacyUpload,true);
const reg=await read(`${base}/registries/legacy-supporting-source-registry-v2.json`);
assert.equal(reg.predecessorMutated,false);
assert.equal(reg.entries.length,2);
const expected=new Map([
 ['LEGACY-PHIOS-UNIFIED-LANGUAGE-PART-1',{digest:'sha256:ac0529302d63ba14078c9ad058f0847a8d2ed6a2f4540f0a1fdf16927249f153',size:61847211,pages:494,key:'legacy/unified-language/part-1/original/unified-language-part-1.pdf'}],
 ['LEGACY-PHIOS-UNIFIED-LANGUAGE-PART-2',{digest:'sha256:63f5f6709b70b1ea32435a108334e507cbc1d91ac7ef21ce85e71db6037277cb',size:62207293,pages:429,key:'legacy/unified-language/part-2/original/unified-language-part-2.pdf'}]
]);
for(const entry of reg.entries){
 const exp=expected.get(entry.sourceCode); assert.ok(exp,`Unexpected source ${entry.sourceCode}`);
 for(const k of ['supportingOnly']) assert.equal(entry[k],true,`${entry.sourceCode}:${k}`);
 for(const k of ['canonicalAuthority','meaningAuthority','publicationAuthority','nodeAuthority']) assert.equal(entry[k],false,`${entry.sourceCode}:${k}`);
 assert.equal(entry.contentDigest,exp.digest); assert.equal(entry.fileSizeBytes,exp.size); assert.equal(entry.pageCount,exp.pages); assert.equal(entry.objectKey,exp.key);
 assert.deepEqual(entry.candidateNodeReferences,[]); assert.deepEqual(entry.matchedNodeReferences,[]);
 assert.equal(entry.reviewStatus,'REGISTERED'); assert.equal(entry.reconciliationStatus,'NOT_STARTED');
 assert.equal(await exists(entry.manifestReference),true,entry.manifestReference);
 const m=await read(entry.manifestReference); assert.equal(m.sourceCode,entry.sourceCode); assert.equal(m.contentDigest,exp.digest); assert.equal(m.objectKey,exp.key);
}
const dig=await read(`${base}/bindings/legacy-unified-language-digest-binding-v1.json`); assert.equal(dig.entries.length,2); assert.equal(dig.rules.silentDigestReplacementForbidden,true);
const r2=await read(`${base}/bindings/legacy-unified-language-r2-object-binding-v1.json`); assert.equal(r2.bucket,'phios-private-manuscripts'); assert.equal(r2.visibility,'PRIVATE'); assert.equal(r2.verificationBoundary.userConfirmedUploaded,true); assert.equal(r2.verificationBoundary.runtimeRemoteHeadRequestPerformed,false); assert.equal(r2.rules.publicUrlForbidden,true);
for(const e of r2.entries){const exp=expected.get(e.sourceCode);assert.equal(e.objectKey,exp.key);assert.equal(e.expectedDigest,exp.digest)}
const a=await read(`${base}/acceptance/kau-e0-legacy-source-registration-acceptance-v1.json`); assert.equal(a.sourceCount,2); assert.equal(a.checks.remoteObjectExistenceRuntimeVerified,false); assert.equal(a.nextState,'READY_FOR_KAU_E1_INVENTORY_AND_RECONCILIATION');
const f=await read(`${base}/freeze/kau-e0-legacy-source-registration-freeze-v1.json`); assert.equal(f.governanceFreezeMutated,false); assert.equal(f.baseKAUFreezeMutated,false); assert.equal(f.registeredSourceCount,2); for(const o of f.outputs) assert.equal(await exists(o),true,o);
console.log('✓ KAU-E0 legacy Unified Language source registration passed.');
