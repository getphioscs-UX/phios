import assert from 'node:assert/strict';import crypto from 'node:crypto';import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),read=r=>JSON.parse(fs.readFileSync(path.join(root,r),'utf8')),pkg=read('package.json'),policy=read('content/knowledge/governance/production-workflow-policy.json');
assert(policy.canonicalAuthority.length>=6);assert(policy.productionAuthority.length>=4);assert.equal(policy.editorialWorkingLayer.humanEditableFilesPerNode,1);assert.equal(policy.figureBoundary.bindingMeansAsset,false);assert.equal(policy.commitPolicy.neverCommit.includes('delta ZIP'),true);
for(const name of ['knowledge:prepare','knowledge:review','knowledge:export','knowledge:status','check:pja:node','check:pja'])assert(pkg.scripts[name]);
assert.equal(treeDigest('content/knowledge/production/editorial-packages/kn-preface-001'),'sha256:cb351496c2b0193dfe14a272c8bd7abe96e7c02ae401e31189aaaad3ba56426d');
console.log('✓ PJA-W3R Knowledge Production Workflow Review compatibility passed.');
console.log('  Authority layers, single human draft, derived artifacts, ZIP policy and unchanged W3A package verified.');
function treeDigest(relative){const base=path.join(root,relative),rows=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const a=path.join(d,e.name);if(e.isDirectory())walk(a);else rows.push(`${path.relative(base,a)}:${crypto.createHash('sha256').update(fs.readFileSync(a)).digest('hex')}`)}}walk(base);return`sha256:${crypto.createHash('sha256').update(rows.sort().join('\n')).digest('hex')}`;}
