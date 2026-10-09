import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const normal=s=>s.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
export function stripCommandMaintenance(source){return normal(source).replace(/^import \{effectivePackageScripts(?:,registeredCheckerCommandMatches)?\} from '\.\/lib\/effective-package-scripts\.mjs';\n/,'').replace(/effectivePackageScripts\(((?:readJson|read|json|j)\('package.json'\))\)/g,'$1').replace('if(registeredCheckerCommandMatches(npmAlias,actual,expected))return;','if(actual===expected)return;');}
export function verifyCheckerMaintenanceReference(ref,label){
 if(!label.startsWith('RT_CHECK_'))return false;
 const registry=JSON.parse(fs.readFileSync('content/runtime-maturity/maintenance/mrm-checker-command-maintenance-successor-v1.json','utf8'));
 const entry=registry.entries.find(e=>e.path===ref.path&&e.runtimeCode===label.slice(9));if(!entry)return false;
 assert.equal(registry.status,'LOCAL_SOURCE_MAINTENANCE_NOT_PRODUCTION_ADMISSION');assert.equal(registry.humanAccepted,false);assert.equal(registry.frozenHashesChanged,false);assert.equal(registry.productionAdmission,false);
 assert.equal(entry.changeClass,'ZERO_COST_COMMAND_RESOLUTION_ONLY');assert.equal(entry.businessAssertionsChanged,false);
 assert.equal(entry.predecessorSHA256,ref.sha256);assert.equal(sha(entry.predecessorPath),ref.sha256,'MAINTENANCE_PREDECESSOR_DRIFT');assert.equal(sha(ref.path),entry.currentSHA256,'MAINTENANCE_CURRENT_DRIFT');
 assert.equal(stripCommandMaintenance(fs.readFileSync(ref.path,'utf8')),normal(fs.readFileSync(entry.predecessorPath,'utf8')),'MAINTENANCE_EXCEEDS_COMMAND_ONLY_SCOPE');return true;
}
