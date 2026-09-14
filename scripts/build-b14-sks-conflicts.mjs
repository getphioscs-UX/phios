import fs from 'node:fs';
import assert from 'node:assert/strict';
import {currentDedupReport,output as dedupPath} from './build-b14-sks-dedup.mjs';
import {buildConflictRegistry} from './lib/structured-conflicts.mjs';
export const output='content/knowledge/structured/structured-knowledge-conflicts-v1.json';
export function currentConflictRegistry(){
 const dedup=JSON.parse(fs.readFileSync(dedupPath));assert.deepEqual(dedup,currentDedupReport(),'CONFLICT_DEDUP_DRIFT');
 return buildConflictRegistry(dedup);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-b14-sks-conflicts.mjs')){
 const report=currentConflictRegistry();
 // A future human-edited registry must never be overwritten by this preparation builder.
 if(fs.existsSync(output))assert.deepEqual(JSON.parse(fs.readFileSync(output)),report,'EXISTING_CONFLICT_REGISTRY_PRESERVED_RECONCILE_EXPLICITLY');
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(`W61: ${report.conflicts.length} confirmed conflicts; ${report.reviewCandidates.length} unresolved review candidates. No source overwrite.`);
}
