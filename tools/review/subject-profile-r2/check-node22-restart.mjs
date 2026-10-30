import fs from 'node:fs';import assert from 'node:assert/strict';
assert.equal(process.version,'v22.16.0');
const base=JSON.parse(fs.readFileSync('.tmp/subject-profile-r2/PREVIEW.json')).url;
assert.equal(new URL(base).hostname,'127.0.0.1');
const prior=JSON.parse(fs.readFileSync('.tmp/subject-profile-r2/RESTART-BEFORE.json'));
async function read(id,cookie=''){const r=await fetch(base+'/api/customer-subject-workspace?subjectId='+id,{headers:cookie?{cookie}:{}});return{r,body:await r.json()};}
const pub=await read('qa-world-MY-ref');assert.equal(pub.r.status,200);assert.deepEqual({subjectId:pub.body.workspace.subjectId,sourceVersion:pub.body.workspace.sourceVersion,profileVersion:pub.body.workspace.profileVersion},prior);
async function login(account){const r=await fetch(base+'/__qa/login',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({account})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
const a=await login('A'),b=await login('B');
assert.equal((await read('qa-personal-A',a)).r.status,200);
assert.equal((await read('qa-personal-A',b)).r.status,404);
assert.equal((await read('qa-business',a)).r.status,404,'Revocation must survive process restart');
const business=await read('qa-business',b);assert.equal(business.r.status,200);assert.equal(business.body.integration.financial.status,'BLOCKED');assert(business.body.integration.methods.every(x=>x.state==='NOT_APPLICABLE'&&x.rightsGranted===false));
assert.equal((await fetch(base+'/__qa/logout',{method:'POST',headers:{origin:base,cookie:a}})).status,200);
assert.equal((await read('qa-personal-A',a)).r.status,401);
const result={status:'PASS',nodeRuntime:process.version,scope:'NATIVE_ACCOUNT_PWS_RESTART_READ_AND_REVOCATION_ONLY',publicSubjectVersionPreserved:prior,localPwsRestartRead:'PASS',revocationSurvivesRestart:'PASS',nativeSessionLogout:'PASS',crossAccountDenied:'PASS',formalContinuityReopen:'BLOCKED',financialSource:'BLOCKED',production:'NOT_RUN'};
fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/subject-profile-r2/NODE22-RESTART.json',JSON.stringify(result,null,2));console.log('PASS Node22 native Account/PWS restart and revocation; formal Continuity remains blocked.');
