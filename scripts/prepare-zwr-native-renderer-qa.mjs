// Offline preparation only. Neither a renderer receipt nor generation admission.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildAcceptedZwrRendererCandidate,sourceAcceptanceDigest} from './lib/zwr-native-renderer-candidate.mjs';
const output=process.argv[2];if(!output)throw Error('PRIVATE_OUTPUT_DIRECTORY_REQUIRED');
const candidate=await buildAcceptedZwrRendererCandidate(),text=JSON.stringify(candidate);
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'candidate.json'),text);
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({schemaVersion:'ZWR_NATIVE_RENDERER_QA_MANIFEST_V1',authorized:true,scope:'DEPLOYED_PRIVATE_BROWSER',sourceAcceptanceDigest,candidateKey:'qa/method-delivery/ZWR/accepted-renderer-candidate.json',candidateDigest:createHash('sha256').update(text).digest('hex'),semanticSnapshotId:candidate.snapshot.semanticSnapshotId},null,2)+'\n');
console.log('PASS: accepted native fixture prepared; provider calls=0; no admission created.');
