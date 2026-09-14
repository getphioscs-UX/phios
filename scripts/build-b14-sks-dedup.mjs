import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildDedupReport} from './lib/structured-dedup.mjs';
import {assembleExtractionCandidates} from './lib/structured-extraction.mjs';
export const output='docs/knowledge/structured-successor/dedup/b14-sks-w60-dedup-report-v1.json';
export function currentDedupReport(){
 const input='docs/knowledge/structured-successor/extraction/b14-sks-extraction-candidates-v1.json';
 const bytes=fs.readFileSync(input),extraction=JSON.parse(bytes);
 for(const [p,hash] of Object.entries(extraction.sourceDigests))assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),hash,`DEDUP_SOURCE_DRIFT:${p}`);
 const backlinks=JSON.parse(fs.readFileSync('content/knowledge/structured/structured-knowledge-backlinks-v1.json'));
 const discovery=JSON.parse(fs.readFileSync('content/knowledge/structured/structured-knowledge-registry-v1.json'));
 assert.deepEqual(extraction.candidates,assembleExtractionCandidates({discovery,backlinks,readBytes:p=>fs.readFileSync(p)}).candidates,'DEDUP_CANDIDATE_DRIFT');
 return {...buildDedupReport({candidates:extraction.candidates,backlinks:backlinks.backlinks}),input:{path:input,sha256:createHash('sha256').update(bytes).digest('hex'),sourceDigests:extraction.sourceDigests}};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-b14-sks-dedup.mjs')){
 const report=currentDedupReport();fs.mkdirSync(output.slice(0,output.lastIndexOf('/')),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(`W60: ${report.coverage.objects} objects; ${report.findings.length} review findings; ${report.coverage.meaningUnavailable.length} meanings unavailable. No merges or approval.`);
}
