import fs from 'node:fs';import crypto from 'node:crypto';
const results=[];
for(const url of ['https://getphios.com/perspectives/profile/','https://getphios.com/api/profile-progressive?mode=QUICK_PROFILE']){
 try{const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await r.arrayBuffer());let fields=null;try{const j=JSON.parse(bytes);fields={ok:j.ok,mode:j.mode,error:j.error,authority:j.authority,instrumentItemCount:j.instrument?.items?.length};}catch{}
 results.push({url,at:new Date().toISOString(),status:r.status,location:r.headers.get('location'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),fields});
 }catch(e){results.push({url,at:new Date().toISOString(),status:null,error:e.cause?.code||e.name});}
}
fs.writeFileSync('tools/review/personal-evidence-r1/evidence-system-r1/PRODUCTION-READ.json',JSON.stringify({results,deploymentIdentity:'RUNTIME_UNVERIFIED',effectiveReadOnly:'RUNTIME_UNVERIFIED',authenticatedSaveReopen:'NOT_TESTED_NO_PRODUCTION_WRITES',providerCalls:0,productionWrites:0},null,2));console.log(results.map(x=>({url:x.url,status:x.status,error:x.error})));
