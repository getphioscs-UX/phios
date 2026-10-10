import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=p=>createHash('sha256').update(fs.readFileSync(p,'utf8').replace(/\r\n?/g,'\n')).digest('hex');
const registry=JSON.parse(fs.readFileSync('content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v4.json'));
const rows=registry.entries.filter(e=>e.workCode.startsWith('ECR-V4.1-'));
assert.equal(rows.length,17);assert.equal(new Set(rows.map(r=>r.workCode)).size,17);
const successor=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/admission/ecr-current-checker-successor-v1.json'));
assert.equal(successor.predecessorRegistry,'content/governance/runtime-checker-governance/registries/runtime-checker-alias-registry-v4.json');
assert.equal(hash(successor.predecessorRegistry),successor.predecessorRegistrySha256);
assert.equal(successor.productionAdmissionChanged,false);
assert.equal(hash(successor.currentWorkspace),successor.currentWorkspaceSha256);
for(const row of rows){
 const change=successor.changes.find(c=>c.path===row.implementationFile);
 if(change){assert.equal(change.previousSha256,row.implementationDigest);assert.equal(change.workCode,row.workCode);}
 assert.equal(hash(row.implementationFile),change?.currentSha256||row.implementationDigest,row.workCode);
}
const audit=JSON.parse(fs.readFileSync('content/embodied-configuration/v4/acceptance/ecr-v4-w0-baseline-audit-v1.json'));
for(const row of audit.relevantAuthorityFiles)assert.equal(createHash('sha256').update(fs.readFileSync(row.path)).digest('hex'),row.sha256,'Predecessor changed: '+row.path);
const pkg=JSON.parse(fs.readFileSync('package.json'));assert(pkg.scripts.postcheck.includes('check:ecr-human-runtime-v4-1'));
assert.equal(pkg.scripts['check:ecr-v41:admission-workspace'],`node ${successor.currentWorkspace}`);
for(const script of ['check:ecr-mandala','check:ecr-r3','check:ecr-full-r1','check:ecr-full-r1a'])assert(pkg.scripts[script]);
console.log('PASS V4.1 W16: 17 governed checker aliases; predecessor mechanics and meanings remain byte-identical.');
