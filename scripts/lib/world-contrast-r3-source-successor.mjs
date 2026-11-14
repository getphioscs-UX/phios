import {founderLegacyRoutePredecessor} from './founder-legacy-route-compatibility-r1.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const WORLD_R3_RECORD="content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/WORLD-CONTRAST-R3-SOURCE-SUCCESSOR.json";
export const WORLD_R3_CSS="assets/css/world-experience-r2.css";
export const WORLD_R3_CHECK="scripts/check-world-readability-compatibility-r1.mjs";
export const WORLD_R3_HOOK="scripts/lib/founder-r3-historical-view-r1.mjs";
const RECORD_SHA="8b1199b2a68e26915498dfa1a208bc2db6f1a008779cd37fd701c4cd41d95769";
const exactParents=[{"path":"content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/WORLD-READABILITY-COMPATIBILITY-R1.json","sha256":"701b6b5f5b87c2bbf2278c8f35d9059921e8fc1ca3500c6a21dce30f146470a9"},{"path":"content/civilization-atlas/maintenance/world-contrast-r1-source-successor.json","sha256":"4d293ce3374ac92128ca9c8972722b7ef70dd9992658afca7c811b2c36ca9187"},{"path":"content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/AUDIT-R2-PUBLIC34-RECEIVER-R2.json","sha256":"f0c9c4175b2dd850e9e71ab09b200ffc9de0a98e3f49398e1a5a2463e44c7871"},{"path":"content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/FOUNDER-R3-HISTORICAL-VIEW-R1.json","sha256":"ead01b4279b48f226c4e23201446b6d9bb1a44824326318f0ed4bab15cf812d4"}],exactProtected=[{"path":"scripts/lib/ppr-five-method-preentry-successor.mjs","sha256":"0f89c9c2ddf81a2eaaa12ef188b2c44350610ba672606adb10581598261da8cb"},{"path":"scripts/lib/symbolic-frozen20-receiver-successor-r1.mjs","sha256":"7f025b301fccac578f651c9c08fdd61f513fa768140e401511f16c802dc5468b"},{"path":"assets/css/civilization-atlas.css","sha256":"7c1bdd56e6df35378d59b69d77bf3c37dde73e367c93ead6d2e618e4dc78608d"}];
export function validateWorldContrastR3({readFile=p=>fs.readFileSync(p),recordBytes=readFile(WORLD_R3_RECORD)}={}){
 assert.equal(sha(recordBytes),RECORD_SHA,'WORLD_R3_RECORD_DRIFT');
 const r=JSON.parse(recordBytes);assert.equal(r.schema,'WORLD_CONTRAST_R3_SOURCE_SUCCESSOR');assert.equal(r.baseHEAD,'a989a3a26eeadc51cc2342702ca4c057c27e513a');assert.equal(r.humanDecision,'ACCEPT_VISUAL_ONLY');assert.equal(r.releaseDecision,'CLOSED');
 assert.deepEqual(r.changes.map(x=>x.path),[WORLD_R3_CSS,WORLD_R3_HOOK,WORLD_R3_CHECK],'WORLD_R3_EXACT_PATHS');assert.deepEqual(r.parents,exactParents);assert.deepEqual(r.protected,exactProtected);for(const v of Object.values(r.boundaries))assert.equal(v,false,'WORLD_R3_AUTHORITY_BOUNDARY');
 for(const p of [...r.parents,...r.protected])assert.equal(sha(readFile(p.path)),p.sha256,'WORLD_R3_PARENT_OR_PROTECTED_DRIFT:'+p.path);
 const [css,hook]=r.changes,actual=Buffer.from(readFile(css.path)),source=Buffer.from(readFile(hook.path));assert.equal(sha(actual),css.sha256,'WORLD_R3_PHYSICAL_CSS_DRIFT');assert.equal(sha(source),hook.sha256,'WORLD_R3_PHYSICAL_READER_DRIFT');
 const previous=actual.subarray(0,css.previousLength);assert.equal(sha(previous),css.previousSHA256,'WORLD_R3_PREFIX_DRIFT');assert.equal(sha(actual.subarray(css.previousLength)),css.approvedAppendSHA256,'WORLD_R3_APPEND_DRIFT');assert.equal(css.approvedRules,9);
 const prior=Buffer.from(hook.previousBytesBase64,'base64');assert.equal(sha(prior),hook.previousSHA256,'WORLD_R3_READER_PREDECESSOR');const st=source.toString('utf8');assert(st.startsWith(hook.exactImport));const body=st.slice(hook.exactImport.length),entry=hook.exactEntry+hook.exactHook;assert.equal(body.split(entry).length,2,'WORLD_R3_EXACT_ENTRY');const restored=Buffer.from(body.replace(entry,hook.exactEntry));assert(restored.equals(prior),'WORLD_R3_READER_EXACT_INVERSE');
 const check=r.changes[2],checkBytes=Buffer.from(readFile(check.path));assert.equal(sha(checkBytes),check.sha256,'WORLD_R3_CHECKER_PHYSICAL_DRIFT');assert.equal(sha(checkBytes.subarray(0,check.previousLength)),check.previousSHA256,'WORLD_R3_CHECKER_ASSERTIONS_DRIFT');assert.equal(checkBytes.subarray(check.previousLength).toString('utf8'),check.exactAppend,'WORLD_R3_CHECKER_EXACT_APPEND');
 return {record:r,previousCSS:previous,previousReader:prior};
}
export function worldContrastR3Predecessor(path,bytes,options={}){
 bytes=founderLegacyRoutePredecessor(path,bytes,options);
 if(path!==WORLD_R3_CSS&&path!==WORLD_R3_HOOK)return bytes;
 const v=validateWorldContrastR3(options),row=v.record.changes.find(x=>x.path===path),input=Buffer.from(bytes),digest=sha(input);assert([row.sha256,row.previousSHA256].includes(digest),'WORLD_R3_INPUT_DRIFT:'+path);
 return digest===row.previousSHA256?bytes:path===WORLD_R3_CSS?v.previousCSS:v.previousReader;
}
