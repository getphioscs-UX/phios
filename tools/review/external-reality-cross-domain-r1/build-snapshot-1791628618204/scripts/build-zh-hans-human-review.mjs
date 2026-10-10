import fs from 'node:fs/promises';
import path from 'node:path';
import { buildHumanReview, validateHumanReview, buildReviewRegistryRecord, registerReviewProjection, writeReviewPackage } from './lib/knowledge-production/human-review-v1.mjs';
const root=process.cwd(),args=process.argv.slice(2),pos=args.filter(x=>!x.startsWith('--'));
if(pos.length<2){console.error('USAGE: npm run knowledge:build-review:zh-Hans -- <candidate.json> <review-input.json> [--apply] [--apply-registry] [--output=path]');process.exit(2);}
const [candidatePath,inputPath]=pos.map(x=>path.resolve(root,x));
const [candidate,input]=await Promise.all([fs.readFile(candidatePath,'utf8').then(JSON.parse),fs.readFile(inputPath,'utf8').then(JSON.parse)]);
const review=await buildHumanReview(root,{candidate,...input});const validation=validateHumanReview(review,candidate);if(!validation.valid){console.error(JSON.stringify(validation.errors,null,2));process.exit(1);}
const output=args.find(x=>x.startsWith('--output='))?.slice(9);const written=await writeReviewPackage(root,review,{apply:args.includes('--apply'),output});
const registry=await registerReviewProjection(root,buildReviewRegistryRecord(review),{apply:args.includes('--apply-registry')});
console.log(`REVIEW BUILT: ${written.targetPath}`);console.log(`REVIEW DIGEST: ${review.reviewDigest}`);console.log(`REVIEW PACKAGE: ${written.mode}`);console.log(`REVIEW REGISTRY: ${registry.mode}`);
