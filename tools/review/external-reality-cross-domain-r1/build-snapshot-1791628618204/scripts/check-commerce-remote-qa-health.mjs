import fs from 'node:fs';
const dir='docs/qa/commerce-stripe-r1';
const metadata=JSON.parse(fs.readFileSync(`${dir}/remote-preview-discovery.json`,'utf8'));
const expected='eea35d26626ebdb29548fe62b8fce5c3eab26eb7';
const d=metadata.deployments.find(x=>x.environment==='preview'&&x.stage.status==='success'&&x.trigger.metadata.commit_hash===expected);
if(!d)throw Error('VERIFIED_PREVIEW_DEPLOYMENT_REQUIRED');
const origin=new URL(d.url).origin;
if(!/^https:\/\/[a-z0-9]+\.phios-github\.pages\.dev$/.test(origin))throw Error('QA_HOST_REQUIRED');
const probes=[['GET','/'],['GET','/api/commerce-catalog'],['POST','/api/commerce-checkout'],['GET','/api/stripe-webhook'],['POST','/api/stripe-webhook']];
const health=[];
for(const [method,path] of probes){
 const r=await fetch(origin+path,{method,redirect:'manual',signal:AbortSignal.timeout(20000),headers:{origin,'content-type':'application/json'},...(method==='POST'?{body:'{}'}:{})});
 const type=r.headers.get('content-type')||'';
 const body=type.includes('json')?await r.json():null;
 await r.body?.cancel().catch(()=>{});
 health.push({method,path,status:r.status,contentType:type,redirect:r.headers.get('location'),code:body?.code||(typeof body?.error==='string'?body.error:undefined),products:body?.products?.length,checkoutAvailable:body?.checkoutAvailable});
}
const pass=health[0].status===200&&health[1].status===200&&health[1].products===24&&health[2].status===401&&health[4].status===503&&health[4].code==='stripe_webhook_not_configured'&&health.every(x=>!x.redirect);
const result={environment:'QA',stripeAccount:'acct_1UFr0TBEKXJyHMkK',livemode:false,previewUrl:origin,previewAlias:d.aliases?.[0],deploymentId:d.id,commit:expected,checkoutEndpoint:'/api/commerce-checkout',webhookEndpoint:'/api/stripe-webhook',remoteHealth:{status:pass?'PASS_WITH_EXPECTED_CONFIG_GATES':'FAIL',tlsVerified:true,health},realStripeE2E:'NOT_RUN',live:'NOT_ACTIVATED',checkpoint:'ACTION_REQUIRED_BY_USER_CHECKPOINT_A',requiredEnvironmentVariables:['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_ENVIRONMENT','PHIOS_COMMERCE_QA_ENABLED'],missing:['Preview STRIPE_SECRET_KEY','Preview STRIPE_WEBHOOK_SECRET','STRIPE_ENVIRONMENT=QA','Approved Commerce identity integration','QA gate activation after prerequisite validation','QA D1 migration verification'],results:Object.fromEntries(['report','bundle','book','subscription','portal','service','idempotency','refund','failure','validSignature','invalidSignature'].map(k=>[k,'NOT_RUN — QA credential / authenticated identity dependency']))};
fs.writeFileSync(`${dir}/real-e2e-acceptance.json`,JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(`${dir}/real-e2e-acceptance.md`, `# COM-STRIPE-R1 Remote QA\n\nState: ACTION_REQUIRED_BY_USER — Checkpoint A. REAL_STRIPE_E2E = NOT_RUN. LIVE = NOT_ACTIVATED.\n\nPreview: ${origin}\n\nCommit: ${expected}; deployment: ${d.id}; project phios-github; branch qa. Deployment used existing Wrangler authentication after GitHub branch update returned 403. Production was not deployed. Local main remains unchanged.\n\nCheckout: /api/commerce-checkout\nWebhook: /api/stripe-webhook\n\nPreconditions: registry, checkout, signed webhook, order, entitlement, bundles, subscription, service fulfillment and idempotency implemented. Existing full npm precheck/check/postcheck PASS, 15 machine groups PASS; these are not real Stripe E2E.\n\nHealth: ${result.remoteHealth.status}. ${health.map(x=>x.method+' '+x.path+' → '+x.status+(x.code?' '+x.code:'')).join('; ')}. A configured-handler 503 confirms the webhook Function exists; signature verification has not yet been tested remotely.\n\nConfigure encrypted STRIPE_SECRET_KEY in Cloudflare Pages → phios-github → Settings → Variables and Secrets → Preview, using the PHI OS QA test key. Set plain STRIPE_ENVIRONMENT=QA. Never send secret values in chat. Await user confirmation before real Stripe network E2E.\n\nSubsequent dependencies: signing secret for this Preview destination, approved canonical account authentication, QA D1 migrations, explicit QA enable gate, private book fulfillment and Test Mode Portal configuration. Commerce currently requires trusted server identity; no general login provider is connected. No hard-coded identity or parallel auth runtime was introduced.\n\nAll report/bundle/book/subscription/portal/service/replay/refund/failure and signature E2E results remain NOT_RUN. No Stripe account API was called in this phase.\n`);
console.log(JSON.stringify(result.remoteHealth,null,2));
if(!pass)process.exitCode=1;
