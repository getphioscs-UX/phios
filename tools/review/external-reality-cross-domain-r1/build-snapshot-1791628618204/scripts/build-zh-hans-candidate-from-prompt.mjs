import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCandidateFromPrompt, registerCandidateProjection } from './lib/knowledge-production/candidate-builder-v1.mjs';
import { serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';
const root=process.cwd(),args=process.argv.slice(2),pos=args.filter(x=>!x.startsWith('--'));
if(pos.length<4){console.error('USAGE: npm run knowledge:build-candidate:zh-Hans -- <prompt.json> <brief.json> <article.md> <summary.txt> [--apply-registry] [--output=path]');process.exit(2);}
const [promptPath,briefPath,articlePath,summaryPath]=pos.map(x=>path.resolve(root,x));
const [prompt,brief,markdown,summary]=await Promise.all([fs.readFile(promptPath,'utf8').then(JSON.parse),fs.readFile(briefPath,'utf8').then(JSON.parse),fs.readFile(articlePath,'utf8'),fs.readFile(summaryPath,'utf8')]);
const result=await buildCandidateFromPrompt(root,{prompt,brief,markdown,summary:summary.trim()});
const outArg=args.find(x=>x.startsWith('--output='))?.slice(9);const out=path.resolve(root,outArg||`content/knowledge/production/candidates/zh-Hans/${brief.nodeCode}/candidate.v1.json`);
await fs.mkdir(path.dirname(out),{recursive:true});if(await fs.access(out).then(()=>true,()=>false)){console.error(`OUTPUT_ALREADY_EXISTS: ${path.relative(root,out)}`);process.exit(2);}await fs.writeFile(out,serialize(result.candidate),{flag:'wx'});
const reg=await registerCandidateProjection(root,result.registryRecord,{apply:args.includes('--apply-registry')});
console.log(`CANDIDATE BUILT: ${path.relative(root,out)}`);console.log(`CANDIDATE DIGEST: ${result.candidate.candidateDigest}`);console.log(`CANDIDATE REGISTRY: ${reg.mode}`);
