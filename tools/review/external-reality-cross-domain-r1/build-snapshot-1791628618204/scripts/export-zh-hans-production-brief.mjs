import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCanonicalBriefV2, serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';
const root=process.cwd(), args=process.argv.slice(2), nodeCode=args.find(x=>!x.startsWith('--'));
if(!nodeCode){console.error('NODE_CODE_REQUIRED');process.exit(2);}
const force=args.includes('--force');
const commitArg=args.find(x=>x.startsWith('--commit='))?.split('=')[1];
const outputArg=args.find(x=>x.startsWith('--output='))?.slice(9);
const outDir=path.resolve(root,outputArg||'content/knowledge/production/briefs/zh-Hans');
const out=path.join(outDir,`${nodeCode}-production-brief.v2.json`);
if(await fs.access(out).then(()=>true,()=>false) && !force){console.error(`OUTPUT_ALREADY_EXISTS: ${path.relative(root,out)}`);process.exit(2);}
const brief=await buildCanonicalBriefV2(root,nodeCode,{commit:commitArg});
await fs.mkdir(outDir,{recursive:true}); await fs.writeFile(out,serialize(brief));
console.log(`BRIEF EXPORTED: ${path.relative(root,out)}`); console.log(`BRIEF DIGEST: ${brief.briefDigest}`);
