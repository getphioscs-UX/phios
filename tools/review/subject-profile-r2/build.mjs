import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {build} from 'esbuild';
const out='.tmp/subject-profile-r2';fs.mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map();
const plugin={name:'freeze-r2-inputs',setup(b){b.onLoad({filter:/\.(js|mjs|json)$/},async a=>{const bytes=fs.readFileSync(a.path),digest=hash(bytes);if(inputs.has(a.path)&&inputs.get(a.path)!==digest)throw Error('CONCURRENT_R2_INPUT_CHANGED:'+a.path);inputs.set(a.path,digest);return{contents:bytes,loader:a.path.endsWith('.json')?'json':'js',resolveDir:path.dirname(a.path)};});}};
await build({entryPoints:['tools/review/subject-profile-r2/server.mjs'],outfile:out+'/server.mjs',bundle:true,packages:'external',platform:'node',format:'esm',target:'node22',plugins:[plugin],logLevel:'warning'});
await build({entryPoints:['assets/customer-ui/js/surfaces/subject-workspace-r1.js'],outfile:out+'/subject-browser.js',bundle:true,platform:'browser',format:'esm',target:'es2022',plugins:[plugin],logLevel:'warning'});
const files=[...inputs].map(([p,sha256])=>({path:path.relative(process.cwd(),p).replaceAll('\\','/'),sha256,stable:hash(fs.readFileSync(p))===sha256}));if(files.some(x=>!x.stable))throw Error('CONCURRENT_R2_INPUT_CHANGED');
fs.writeFileSync(out+'/BUILD.json',JSON.stringify({status:'PASS',scope:'ISOLATED_NODE22_TARGET_AND_BROWSER_BUNDLES_ONLY',nodeRuntime:process.version,node22Execution:'NOT_RUN',pagesOutputTouched:false,inputs:files},null,2));console.log('PASS isolated R2 bundles; no .pages-output writes.');
const functionsDir=out+'/pages-project/functions/api';fs.mkdirSync(functionsDir,{recursive:true});
const relative=path.relative(functionsDir,'functions/profile/subject-owner-integration-r2.js').split(path.sep).join('/');
fs.writeFileSync(functionsDir+'/customer-subject-workspace.js',`import {subjectR2Catalogue,readSubjectOwnerIntegration} from ${JSON.stringify(relative)};
export async function onRequestGet(c){const u=new URL(c.request.url),id=u.searchParams.get('subjectId'),options={locale:u.searchParams.get('locale')==='zh-Hans'?'zh-Hans':'en',worldSubjectId:u.searchParams.get('worldSubjectId')};return Response.json(id?await readSubjectOwnerIntegration(c,id,options):await subjectR2Catalogue(c,options));}
`);
