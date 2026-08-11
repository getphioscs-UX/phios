import path from 'node:path';
import { importCandidate, parseArgs } from './lib/car-production/car-production-v1.mjs';
const { positional, options }=parseArgs(process.argv.slice(2)); const briefCode=positional[0];
if(!briefCode||!options.file) throw new Error('USAGE: npm run car:import-candidate -- <CAB-CODE> --file <figure.webp|avif|svg> [--model <code>]');
const candidate=await importCandidate({briefCode,file:path.resolve(options.file),modelCode:options.model||null});
console.log(JSON.stringify({status:'CANDIDATE_IMPORTED',candidateCode:candidate.candidateCode,candidateDigest:candidate.candidateDigest,providerLineage:candidate.providerLineage,publicationAuthority:false},null,2));
