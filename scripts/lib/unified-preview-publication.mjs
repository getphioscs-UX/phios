import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {buildSync} from 'esbuild';
import {PREENTRY_METHODS,unifiedPreviewBuildPolicy} from '../../functions/_lib/unified-preview-scope.js';
export {unifiedPreviewBuildPolicy};
export function applyUnifiedPreviewPublication(output,policy){
 if(!policy.active)return {active:false};
 const root=path.resolve(output),removed=[];
 for(const m of PREENTRY_METHODS)for(const rel of [`perspectives/personal/${m}/index.html`,...['en','zh-Hans'].map(l=>`assets/customer-ui/media/preentry-r5/${m}/${l}.html`)]){
  const target=path.resolve(root,rel);if(!target.startsWith(root+path.sep))throw Error('PREVIEW_PUBLICATION_PATH_INVALID');
  if(fs.existsSync(target)){fs.unlinkSync(target);removed.push(rel);}
 }
 const hub=path.join(root,'perspectives/personal/index.html');let removedLinks=0;
 if(fs.existsSync(hub)){
  let html=fs.readFileSync(hub,'utf8');
  html=html.replace(/<a\b[^>]*href="\/perspectives\/personal\/(?:astrology|bazi|ziwei|numerology|human-design)\/"[^>]*>[\s\S]*?<\/a>/g,()=>{removedLinks++;return '';});
  if(removedLinks!==5)throw Error('PREVIEW_PENDING_HUB_LINK_CONTRACT_DRIFT');
  html=html.replace(/<script\b[^>]*src="\/assets\/customer-ui\/js\/surfaces\/preentry-hub-links-r5.js"[^>]*><\/script>/g,'');
  fs.writeFileSync(hub,html);
 }
 return {active:true,removed,removedLinks};
}
export function isolateUnifiedPreviewWorker(workerFile,policy){
 if(!policy.active)return fs.readFileSync(workerFile,'utf8');
 const scope=fileURLToPath(new URL('../../functions/_lib/unified-preview-scope.js',import.meta.url));
 const contents=`import original from ${JSON.stringify(workerFile.replaceAll('\\','/'))};import {wrapUnifiedPreviewWorker} from ${JSON.stringify(scope.replaceAll('\\','/'))};export default wrapUnifiedPreviewWorker(original,${JSON.stringify(policy)});`;
 return buildSync({stdin:{contents,resolveDir:process.cwd(),sourcefile:'unified-preview-scope.mjs'},bundle:true,format:'esm',platform:'browser',target:'esnext',write:false,external:['cloudflare:*','node:*'],logLevel:'silent'}).outputFiles[0].text;
}
