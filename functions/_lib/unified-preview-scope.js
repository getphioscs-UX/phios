// Release A's bounded, read-only Preview. Applied only by the immutable build
// policy for the explicitly named review branch; never selected by a request.
export const UNIFIED_PREVIEW_BRANCH='codex/unified-release-preview-r12';
export const PREENTRY_METHODS=Object.freeze(['astrology','bazi','ziwei','numerology','human-design']);
export const UNIFIED_PREVIEW_CLOSED_FLAGS=Object.freeze({
 PHIOS_D1_MAINTENANCE_MODE:'READ_ONLY',PHIOS_ENVIRONMENT:'qa',STRIPE_ENVIRONMENT:'QA',
 PHIOS_SHARED_PAID_REPORT_ENABLED:'false',PHIOS_P9_CANARY_ENABLED:'false',
 PHIOS_P9_CHECKOUT_ENABLED:'false',PHIOS_P9_REFUND_ENABLED:'false',
 REPORT_PROVIDER_LIVE_ALLOWED:'false',PHIOS_COMMERCE_QA_ENABLED:'false',
 PHIOS_BOOK_ONE_SALES_ENABLED:'false',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'false',
 BAZI_T3_PREVIEW_SHADOW:'disabled',RNT2_S04_REVIEW:'disabled',FW_PREVIEW_ACCEPTANCE_FIXTURES:'disabled'
});
const publicApis=new Set(['/api/public-asset-config','/api/commerce-catalog','/api/book6-runtime-readout']);
export function unifiedPreviewBuildPolicy(env={}){
 if(env.CF_PAGES!=='1'||env.CF_PAGES_BRANCH!==UNIFIED_PREVIEW_BRANCH)return {active:false};
 const url=new URL(env.CF_PAGES_URL);
 if(env.CF_PAGES_ENVIRONMENT==='production'||url.protocol!=='https:'||!url.hostname.endsWith('.phios-github.pages.dev')||!/^[a-f0-9]{40}$/.test(env.CF_PAGES_COMMIT_SHA||''))throw Error('UNIFIED_PREVIEW_BUILD_IDENTITY_INVALID');
 return {active:true,branch:UNIFIED_PREVIEW_BRANCH,commit:env.CF_PAGES_COMMIT_SHA,mode:'RELEASE_A_READ_ONLY'};
}
export function canonicalPreviewPath(pathname){
 let p=pathname;try{for(let i=0;i<2;i++)p=decodeURIComponent(p);}catch{return null;}
 p=p.replaceAll('\\','/').replace(/\/{2,}/g,'/');
 if(/%[0-9a-f]{2}/i.test(p)||p.split('/').some(x=>x==='.'||x==='..'))return null;
 return p.replace(/\/$/,'')||'/';
}
export function excludedUnifiedPreviewPath(pathname){
 const p=canonicalPreviewPath(pathname);if(typeof p!=='string')return true;
 return /^\/(?:tools|docs|review|output|tmp|\.worktrees|\.git)(?:\/|$)/i.test(p)||
 /^\/content\/production-closure(?:\/|$)/i.test(p)||
 /^\/(?:account(?:-[a-z-]+)?|checkout|payment-success|payment-failure)(?:\.html|\/|$)/i.test(p)||
 PREENTRY_METHODS.some(m=>p===`/perspectives/personal/${m}`||p.startsWith(`/perspectives/personal/${m}/`)||p===`/perspectives/personal/${m}.html`||p.startsWith(`/assets/customer-ui/media/preentry-r5/${m}/`));
}
export function wrapUnifiedPreviewWorker(original,policy){
 if(!policy.active)throw Error('UNIFIED_PREVIEW_POLICY_REQUIRED');
 return {...original,async fetch(request,env,ctx){
  const path=canonicalPreviewPath(new URL(request.url).pathname);
  let response;
  if(excludedUnifiedPreviewPath(path))response=new Response('Not available in this review scope',{status:404,headers:{'Cache-Control':'no-store'}});
  else if(/^\/api(?:\/|$)/i.test(path)&&(!publicApis.has(path)||!['GET','HEAD'].includes(request.method)))response=Response.json({ok:false,code:'PREVIEW_RELEASE_SCOPE_CLOSED'},{status:403,headers:{'Cache-Control':'no-store'}});
  else response=await original.fetch(request,{...env,...UNIFIED_PREVIEW_CLOSED_FLAGS},ctx);
  const result=new Response(response.body,response);
  result.headers.set('X-PHIOS-Review-Scope',policy.mode);
  result.headers.set('X-PHIOS-Source-Commit',policy.commit);
  return result;
 }};
}
