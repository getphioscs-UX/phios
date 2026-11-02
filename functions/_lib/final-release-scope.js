export const FINAL_RELEASE_BRANCH='codex/final-unified-production-r1';
export const FINAL_PREVIEW_FLAGS=Object.freeze({PHIOS_D1_MAINTENANCE_MODE:'READ_ONLY',PHIOS_ENVIRONMENT:'qa',STRIPE_ENVIRONMENT:'QA',PHIOS_SHARED_PAID_REPORT_ENABLED:'false',PHIOS_P9_CANARY_ENABLED:'false',PHIOS_P9_CHECKOUT_ENABLED:'false',PHIOS_P9_REFUND_ENABLED:'false',REPORT_PROVIDER_LIVE_ALLOWED:'false',PHIOS_COMMERCE_QA_ENABLED:'false',PHIOS_BOOK_ONE_SALES_ENABLED:'false',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'false',BAZI_T3_PREVIEW_SHADOW:'disabled',RNT2_S04_REVIEW:'disabled',FW_PREVIEW_ACCEPTANCE_FIXTURES:'disabled'});
export function finalReleasePath(pathname){let p=pathname;try{for(let i=0;i<2;i++)p=decodeURIComponent(p);}catch{return null;}p=p.replaceAll('\\','/').replace(/\/{2,}/g,'/');if(/%[a-f0-9]{2}/i.test(p)||p.split('/').some(s=>s==='.'||s==='..'))return null;return p;}
export function finalInternalPath(pathname){const p=finalReleasePath(pathname);return p===null||/^\/(?:tools|docs|review|output|tmp|artifacts|dist|\.git|\.worktrees|\.phios-repair-backups|\.phios-repair-receipts)(?:\/|$)/i.test(p)||/^\/content\/production-closure(?:\/|$)/i.test(p)||/^\/config\/qa(?:\/|$)/i.test(p)||/^\/content\/.*\.html?$/i.test(p);}
export function finalReleaseBuildPolicy(env={}){
 if(env.CF_PAGES!=='1'||![FINAL_RELEASE_BRANCH,'main'].includes(env.CF_PAGES_BRANCH))return {active:false};
 const preview=env.CF_PAGES_BRANCH===FINAL_RELEASE_BRANCH;
 if(!/^[a-f0-9]{40}$/.test(env.CF_PAGES_COMMIT_SHA||''))throw Error('FINAL_RELEASE_COMMIT_REQUIRED');
 if(preview){const u=new URL(env.CF_PAGES_URL);if(env.CF_PAGES_ENVIRONMENT==='production'||u.protocol!=='https:'||!u.hostname.endsWith('.phios-github.pages.dev'))throw Error('FINAL_PREVIEW_IDENTITY_INVALID');}
 else if(env.CF_PAGES_ENVIRONMENT!=='production')throw Error('FINAL_PRODUCTION_ENVIRONMENT_REQUIRED');
 return {active:true,preview,branch:env.CF_PAGES_BRANCH,commit:env.CF_PAGES_COMMIT_SHA,mode:preview?'FINAL_RELEASE_READ_ONLY_PREVIEW':'FINAL_RELEASE_PRODUCTION'};
}
export function wrapFinalReleaseWorker(original,policy){
 if(!policy.active)throw Error('FINAL_RELEASE_POLICY_REQUIRED');
 return {...original,async fetch(request,env,ctx){
  const p=new URL(request.url).pathname;let response;
  if(finalInternalPath(p))response=new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  else response=await original.fetch(request,policy.preview?{...env,...FINAL_PREVIEW_FLAGS,OPENAI_API_KEY:'',DEEPSEEK_API_KEY:'',ANTHROPIC_API_KEY:'',GEMINI_API_KEY:''}:env,ctx);
  const result=new Response(response.body,response);result.headers.set('X-PHIOS-Source-Commit',policy.commit);
  if(policy.preview)result.headers.set('X-PHIOS-Review-Scope',policy.mode);
  return result;
 }};
}
