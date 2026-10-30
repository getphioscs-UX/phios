import fs from 'node:fs';import path from 'node:path';import {build} from 'esbuild';import {createHash} from 'node:crypto';
fs.mkdirSync('.tmp/subject-bft-r5',{recursive:true});
const target=process.argv[2]||'check';if(!['check','restart'].includes(target))throw Error('R5_TARGET_INVALID');
const inputs=[];
await build({entryPoints:['tools/review/subject-bft-r5/'+target+'.mjs'],outfile:'.tmp/subject-bft-r5/'+target+'.bundle.mjs',bundle:true,platform:'node',format:'esm',packages:'external',target:'node22',logLevel:'warning',plugins:[{name:'isolate-existing-fixtures',setup(b){b.onLoad({filter:/\.(mjs|js|json)$/},a=>{const bytes=fs.readFileSync(a.path);inputs.push({path:path.relative('.',a.path).replaceAll('\\','/'),sha256:createHash('sha256').update(bytes).digest('hex')});let text=bytes.toString();if(a.path.endsWith('bft-r1'+path.sep+'owner.mjs'))text=text.replaceAll('.tmp/bft-r1','.tmp/subject-bft-r5/native-account');if(a.path.endsWith('subject-bft-r3'+path.sep+'owner.mjs'))text=text.replaceAll('.tmp/subject-bft-r3','.tmp/subject-bft-r5/native-context');return{contents:text,loader:a.path.endsWith('.json')?'json':'js',resolveDir:path.dirname(a.path)};});}}]});
fs.writeFileSync('.tmp/subject-bft-r5/dependencies.json',JSON.stringify(inputs,null,2));
await import('../../../.tmp/subject-bft-r5/'+target+'.bundle.mjs');
