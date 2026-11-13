import fs from 'node:fs';
import {buildSync} from 'esbuild';
export function freeCountryPreviewBuildPolicy(env={}) {
  if(env.CF_PAGES!=='1'||env.CF_PAGES_BRANCH!=='codex/codex4-free-country-preview-r1')return {active:false};
  const url=new URL(env.CF_PAGES_URL);
  if(env.CF_PAGES_ENVIRONMENT!=='preview'||env.CF_PAGES_PROJECT!=='phios-free-country-review'||
      url.protocol!=='https:'||!url.hostname.endsWith('.phios-free-country-review.pages.dev')||
      !/^[a-f0-9]{40}$/.test(env.CF_PAGES_COMMIT_SHA||''))throw Error('FREE_COUNTRY_PREVIEW_IDENTITY_INVALID');
  return {active:true,project:env.CF_PAGES_PROJECT,branch:env.CF_PAGES_BRANCH,commit:env.CF_PAGES_COMMIT_SHA};
}
export function isolateFreeCountryPreviewWorker(workerFile,policy) {
  if(!policy.active)return fs.readFileSync(workerFile,'utf8');
  const input=`import original from ${JSON.stringify(workerFile.replaceAll('\\','/'))};
  export default {...original,async fetch(request,env,ctx){
    // Only explicit non-production read capability and platform static assets survive.
    // No inherited Secrets, AI, private R2, Renderer, queues or payment configuration.
    const isolated={ASSETS:env.ASSETS,RUNTIME_DB:env.RUNTIME_DB,
      PHIOS_D1_MAINTENANCE_MODE:'READ_ONLY',PHIOS_ENVIRONMENT:'qa',STRIPE_ENVIRONMENT:'QA',
      REPORT_PROVIDER_LIVE_ALLOWED:'false',PHIOS_SHARED_PAID_REPORT_ENABLED:'false',
      PHIOS_COMMERCE_QA_ENABLED:'false',PHIOS_P9_CANARY_ENABLED:'false',
      PHIOS_P9_CHECKOUT_ENABLED:'false',PHIOS_P9_REFUND_ENABLED:'false',
      PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'false',CF_PAGES_COMMIT_SHA:${JSON.stringify(policy.commit)}};
    const response=await original.fetch(request,isolated,ctx);
    const result=new Response(response.body,response);
    result.headers.set('X-PHIOS-Source-Commit',${JSON.stringify(policy.commit)});
    result.headers.set('X-PHIOS-Review-Scope','FREE_COUNTRY_ISOLATED_REVIEW_R1');
    return result;
  }};`;
  return buildSync({stdin:{contents:input,resolveDir:process.cwd(),sourcefile:'free-country-preview-isolation.mjs'},bundle:true,format:'esm',platform:'browser',target:'esnext',write:false,external:['cloudflare:*','node:*'],logLevel:'silent'}).outputFiles[0].text;
}
