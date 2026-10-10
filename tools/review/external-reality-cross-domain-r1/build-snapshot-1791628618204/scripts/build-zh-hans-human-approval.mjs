import fs from 'node:fs/promises';
import path from 'node:path';
import { buildHumanApproval, validateHumanApproval, buildApprovalRegistryRecord, registerApprovalProjection, writeApprovalPackage } from './lib/knowledge-production/human-approval-v1.mjs';
const root=process.cwd(),args=process.argv.slice(2),pos=args.filter(x=>!x.startsWith('--'));
if(pos.length<3){console.error('USAGE: npm run knowledge:build-approval:zh-Hans -- <candidate.json> <review.json> <approval-input.json> [--apply] [--apply-registry] [--output=path]');process.exit(2);}
const [candidatePath,reviewPath,inputPath]=pos.map(x=>path.resolve(root,x));
const [candidate,review,input]=await Promise.all([candidatePath,reviewPath,inputPath].map(x=>fs.readFile(x,'utf8').then(JSON.parse)));
const approval=await buildHumanApproval(root,{candidate,review,...input});const validation=validateHumanApproval(approval,candidate,review);if(!validation.valid){console.error(JSON.stringify(validation.errors,null,2));process.exit(1);}
const output=args.find(x=>x.startsWith('--output='))?.slice(9);const written=await writeApprovalPackage(root,approval,{apply:args.includes('--apply'),output});
const registry=await registerApprovalProjection(root,buildApprovalRegistryRecord(approval),{apply:args.includes('--apply-registry')});
console.log(`APPROVAL BUILT: ${written.targetPath}`);console.log(`APPROVAL DIGEST: ${approval.approvalDigest}`);console.log(`APPROVAL PACKAGE: ${written.mode}`);console.log(`APPROVAL REGISTRY: ${registry.mode}`);
