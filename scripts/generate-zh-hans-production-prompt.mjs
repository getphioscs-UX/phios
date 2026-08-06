import fs from 'node:fs/promises';
import path from 'node:path';
import { buildZhHansProductionPrompt, validateZhHansProductionPrompt, serialize } from './lib/knowledge-production/production-prompt-v1.mjs';
const root=process.cwd(),args=process.argv.slice(2);const briefArg=args.find(x=>!x.startsWith('--'));
if(!briefArg){console.error('BRIEF_PATH_REQUIRED');process.exit(2);}
const force=args.includes('--force');const outputArg=args.find(x=>x.startsWith('--output='))?.slice(9);
const briefPath=path.resolve(root,briefArg);const brief=JSON.parse(await fs.readFile(briefPath,'utf8'));
const prompt=await buildZhHansProductionPrompt(root,brief);const validation=validateZhHansProductionPrompt(prompt,brief);
if(!validation.valid){console.error(JSON.stringify(validation,null,2));process.exit(2);}
const outDir=path.resolve(root,outputArg||'content/knowledge/production/prompts/zh-Hans');
const jsonOut=path.join(outDir,`${brief.nodeCode}-production-prompt.v1.json`);const mdOut=path.join(outDir,`${brief.nodeCode}-production-prompt.v1.md`);
for(const out of [jsonOut,mdOut])if(await fs.access(out).then(()=>true,()=>false)&&!force){console.error(`OUTPUT_ALREADY_EXISTS: ${path.relative(root,out)}`);process.exit(2);}
await fs.mkdir(outDir,{recursive:true});await fs.writeFile(jsonOut,serialize(prompt));await fs.writeFile(mdOut,prompt.renderedPrompt);
console.log(`PROMPT PACKAGE EXPORTED: ${path.relative(root,jsonOut)}`);console.log(`WRITER PROMPT EXPORTED: ${path.relative(root,mdOut)}`);console.log(`PROMPT PACKAGE DIGEST: ${prompt.promptPackageDigest}`);
