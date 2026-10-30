import fs from 'node:fs';
import {buildSync} from 'esbuild';

const branches=new Set(['codex/world-market-integration-r1','codex/world-market-wmda-r2','codex/world-market-wmda-r2-integration']);
// Build identity is supplied by Pages, never by request headers or query input.
export function worldPreviewBuildPolicy(env={}){
 if(env.CF_PAGES!=='1'||!branches.has(env.CF_PAGES_BRANCH))return {active:false,mode:'INHERIT_EXISTING_CONFIGURATION'};
 const url=new URL(env.CF_PAGES_URL);
 if(url.protocol!=='https:'||!url.hostname.endsWith('.phios-github.pages.dev')||!/^[a-f0-9]{40}$/.test(env.CF_PAGES_COMMIT_SHA||''))throw Error('WORLD_PREVIEW_BUILD_IDENTITY_INVALID');
 return {active:true,mode:'READ_ONLY',branch:env.CF_PAGES_BRANCH,commit:env.CF_PAGES_COMMIT_SHA,project:'phios-github'};
}
export function isolateWorldPreviewWorker(workerFile,policy){
 if(!policy.active)return fs.readFileSync(workerFile,'utf8');
 if(policy.mode!=='READ_ONLY'||!branches.has(policy.branch))throw Error('WORLD_PREVIEW_POLICY_INVALID');
 // Wrap the existing compiled Worker; its original middleware and SQL guard
 // perform the denial. No unconditional replacement status or shared setting.
 const input=`import original from ${JSON.stringify(workerFile.replaceAll('\\','/'))};
 export default {...original,async fetch(request,env,ctx){
  const response=await original.fetch(request,{...env,PHIOS_D1_MAINTENANCE_MODE:'READ_ONLY'},ctx);
  const result=new Response(response.body,response);
  result.headers.set('X-PHIOS-Review-Scope','WORLD_BRANCH_BUILD');
  result.headers.set('X-PHIOS-Source-Commit',${JSON.stringify(policy.commit)});
  return result;
 }};`;
 return buildSync({stdin:{contents:input,resolveDir:process.cwd(),sourcefile:'world-preview-scope.mjs'},bundle:true,format:'esm',platform:'browser',target:'esnext',write:false,external:['cloudflare:*','node:*'],logLevel:'silent'}).outputFiles[0].text;
}
