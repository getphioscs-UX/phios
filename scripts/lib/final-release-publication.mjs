import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {buildSync} from 'esbuild';
export {finalReleaseBuildPolicy} from '../../functions/_lib/final-release-scope.js';
export function isolateFinalReleaseWorker(workerFile,policy){
 if(!policy.active)return fs.readFileSync(workerFile,'utf8');
 const scope=fileURLToPath(new URL('../../functions/_lib/final-release-scope.js',import.meta.url));
 const originalImport=JSON.stringify(workerFile.replaceAll('\\','/')),scopeImport=JSON.stringify(scope.replaceAll('\\','/'));
 // Production gets no Preview wrapper or environment override at all.
 const contents=policy.preview?`import original from ${originalImport};import {wrapFinalReleaseWorker} from ${scopeImport};export default wrapFinalReleaseWorker(original,${JSON.stringify(policy)});`:
 `import original from ${originalImport};import {finalInternalPath} from ${scopeImport};export default {...original,async fetch(request,env,ctx){const response=finalInternalPath(new URL(request.url).pathname)?new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}}):await original.fetch(request,env,ctx);const result=new Response(response.body,response);result.headers.set('X-PHIOS-Source-Commit',${JSON.stringify(policy.commit)});return result;}};`;
 return buildSync({stdin:{contents,resolveDir:process.cwd(),sourcefile:'final-release-scope.mjs'},bundle:true,format:'esm',platform:'browser',target:'esnext',write:false,external:['cloudflare:*','node:*'],logLevel:'silent'}).outputFiles[0].text;
}
