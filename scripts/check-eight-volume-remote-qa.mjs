import fs from 'node:fs';
import {STRIPE_PRODUCT_REGISTRY} from '../functions/pws/commercial/stripe-product-registry.js';
const dir='docs/qa/commerce-stripe-r1';
const discovery=JSON.parse(fs.readFileSync(dir+'/remote-preview-discovery.json'));
const expected=process.env.PHIOS_QA_EXPECTED_COMMIT;
if(!/^[a-f0-9]{40}$/.test(expected||''))throw Error('PHIOS_QA_EXPECTED_COMMIT_REQUIRED');
const d=discovery.deployments.find(x=>x.environment==='preview'&&x.stage.status==='success'&&x.trigger.metadata.commit_hash===expected);
if(!d||!/^https:\/\/[a-z0-9]+\.phios-github\.pages\.dev$/.test(d.url))throw Error('VERIFIED_QA_DEPLOYMENT_REQUIRED');
const health=[];let parity=false;
for(const [method,path] of [['GET','/'],['GET','/api/commerce-catalog'],['POST','/api/commerce-checkout'],['GET','/api/stripe-webhook'],['POST','/api/stripe-webhook'],['GET','/books/reality-configuration/'],['GET','/content/registry/current-book-architecture.json']]){
 const r=await fetch(d.url+path,{method,redirect:'manual',signal:AbortSignal.timeout(20000),headers:{origin:d.url,'content-type':'application/json'},...(method==='POST'?{body:'{}'}:{})});
 const body=r.headers.get('content-type')?.includes('json')?await r.json():null;await r.body?.cancel().catch(()=>{});
 if(path==='/api/commerce-catalog')parity=body?.products?.length===25&&STRIPE_PRODUCT_REGISTRY.every(p=>body.products.some(r=>r.productId===p.productId&&r.amountMinor===p.amountMinor&&r.entitlementPolicy===p.entitlementPolicy&&r.publicationBookCode===p.publicationBookCode));
 health.push({method,path,status:r.status,redirect:r.headers.get('location'),code:body?.code||(typeof body?.error==='string'?body.error:undefined),products:body?.products?.length,checkoutAvailable:body?.checkoutAvailable,architecture:body?.architecture});
}
const pass=parity&&health[0].status===200&&health[1].status===200&&health[2].status===401&&health[3].status===405&&((health[4].status===503&&health[4].code==='stripe_webhook_not_configured')||health[4].status===400)&&health[5].status===200&&health[6].architecture==='eight-volume'&&health.every(h=>!h.redirect);
const vars=new Map(discovery.preview.variables.map(v=>[v.name,v]));
const missing=['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'].filter(k=>!vars.get(k)?.configured).map(k=>'Preview '+k);
if(vars.get('STRIPE_ENVIRONMENT')?.value!=='QA')missing.push('STRIPE_ENVIRONMENT=QA');
missing.push('Approved Commerce identity integration','QA enable gate after prerequisites','Private manuscript mappings and watermark delivery','Test Mode Customer Portal configuration');
const data={campaign:'COM-8V-STRIPE-R1A',previewUrl:d.url,deploymentId:d.id,commit:expected,dirty:Boolean(d.trigger.metadata.commit_dirty),remoteHealth:{status:pass?'PASS_WITH_EXPECTED_CONFIG_GATES':'FAIL',catalogParity:parity,health},missing,realStripeE2E:'NOT_RUN',live:'NOT_ACTIVATED',humanReview:'PENDING',stripeAccount:'acct_1UFr0TBEKXJyHMkK',livemode:false,databaseEvidence:'eight-volume-qa-d1.json'};
fs.writeFileSync(dir+'/eight-volume-remote-qa.json',JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data,null,2));if(!pass)process.exitCode=1;
