import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n')).digest('hex');
export function resolveRegisteredZeroCostCheck(script){
 const registry=JSON.parse(fs.readFileSync('config/reports/zero-cost-check-successors.json','utf8'));
 const r=registry.files.find(r=>r.historicalPath===script);if(!r)return script;
 assert.equal(registry.historicalFreezesRewritten,false);assert.equal(registry.productionAdmissionGranted,false);
 assert.equal(hash(r.historicalPath),r.historicalTextSha256,'FROZEN_CHECKER_DRIFT');assert.equal(hash(r.currentPath),r.currentTextSha256,'CURRENT_CHECK_SUCCESSOR_DRIFT');
 const commands=JSON.parse(fs.readFileSync('config/reports/zero-cost-check-commands.json','utf8'));assert.ok(r.commands.some(alias=>commands[alias]?.includes(`node ${r.currentPath}`)),'CURRENT_CHECK_ROUTE_NOT_REGISTERED');
 return r.currentPath;
}
