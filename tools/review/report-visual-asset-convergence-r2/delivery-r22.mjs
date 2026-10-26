import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {setup,fixture} from '../personal-evidence-r1/commerce-r1-2/fixture.mjs';
import {prepareLocalPrivatePdf,deliverLocalPrivatePdf,LOCAL_PDF_TYPE} from '../../../functions/account/local-private-pdf-artifact.js';
import {authorizePrivateDownload} from '../../../functions/document-assembly/download-runtime.js';
import {digest} from '../../../functions/account/oidc-auth.js';
const d='tools/review/report-visual-asset-convergence-r2/recovery-r22/',checks=[],hash=b=>createHash('sha256').update(b).digest('hex');
const f=await setup();const check=(name,fn)=>{fn();checks.push({name,status:'PASS'});};
try{await f.member();await f.request({action:'save',record:fixture,consent:true,retentionConsent:true,requestToken:crypto.randomUUID(),expiresAt:new Date(Date.now()+86400000).toISOString()});
const runtimeId=f.sql.prepare("SELECT runtime_id FROM runtimes WHERE user_id='qa-A' AND status='active' ORDER BY created_at DESC LIMIT 1").get().runtime_id;
let allowed=true,renders=0;const checkSource=async()=>{if(!allowed)throw Object.assign(Error('SYNTHETIC_SOURCE_REVOKED'),{status:403});};
const context={env:f.env,request:new Request('https://localhost/api/account-profile-evidence')};const opts={ownerId:'qa-A',runtimeId,documentId:'R22-SYNTHETIC-SMALL',language:'en',html:'<p>Synthetic existing real PDF transport only</p>',sourceSnapshotVersion:'R22-SYNTHETIC-1',checkSource};
const smallPath='tools/review/report-visual-asset-convergence-r2/owner-inventory-followup/r12-replay/dossier-en.pdf',small=fs.readFileSync(smallPath);
f.env.PERSONAL_EVIDENCE_PDF_RENDERER={fetch:async()=>{renders++;return new Response(small,{headers:{'content-type':'application/pdf'}});}};
const grant=await prepareLocalPrivatePdf(context,opts);check('actual small PDF stored encrypted; token not recorded',()=>assert(grant.downloadGrant&&renders===1));
const encrypted=f.sql.prepare('SELECT payload FROM runtime_artifacts WHERE artifact_id=?').get(grant.artifactId).payload;check('PDF bytes not plaintext in SQLite',()=>assert(!encrypted.includes(small.toString('base64'))));
const again=await prepareLocalPrivatePdf(context,opts);check('repeat preparation reuses immutable bytes',()=>assert(again.reused&&renders===1));
context.request=new Request('https://localhost/api/account-profile-evidence',{headers:{authorization:'Bearer '+grant.downloadGrant}});
for(let i=0;i<2;i++){const response=await deliverLocalPrivatePdf(context,opts),bytes=Buffer.from(await response.arrayBuffer());check('authenticated actual-byte download '+i,()=>{assert.equal(hash(bytes),hash(small));assert.equal(response.headers.get('cache-control'),'private, no-store');});}
await assert.rejects(()=>deliverLocalPrivatePdf(context,{...opts,ownerId:'qa-B'}));checks.push({name:'wrong authenticated subject denied',status:'PASS'});
const secret=await digest(`PHIOS_PRIVATE_REPORT_GRANT_v1\0${f.env.AUTH_SESSION_SECRET}`);
check('grant expires after fifteen minutes',()=>assert.equal(authorizePrivateDownload({token:grant.downloadGrant,subjectId:'qa-A',now:new Date(Date.now()+16*60000).toISOString(),secret}).authorized,false));
allowed=false;await assert.rejects(()=>deliverLocalPrivatePdf(context,opts),/SOURCE_REVOKED/);checks.push({name:'source revocation denies a still-signed grant',status:'PASS'});allowed=true;
const before=f.sql.prepare('SELECT count(*) n FROM runtime_artifacts WHERE artifact_type=?').get(LOCAL_PDF_TYPE).n;
const largePaths=['output/pdf/report-visual-asset-convergence-r2/r21/ast-native-fixed-and-body.pdf','output/pdf/report-visual-asset-convergence-r2/r22/ziwei-native-fixed-and-body.pdf','output/pdf/report-visual-asset-convergence-r2/r22/bazi-body-diagnostic-en.pdf'];const sizes=[];
for(const path of largePaths){const bytes=fs.readFileSync(path);f.env.PERSONAL_EVIDENCE_PDF_RENDERER={fetch:async()=>new Response(bytes,{headers:{'content-type':'application/pdf'}})};await assert.rejects(()=>prepareLocalPrivatePdf(context,{...opts,documentId:'R22-OVERSIZE-'+hash(bytes),html:'<p>'+path+'</p>'}),/LOCAL_PDF_INVALID/);sizes.push({path,bytes:bytes.length,sha256:hash(bytes),limit:1048576,result:'REJECTED_BY_EXISTING_GUARD'});}
check('oversize failures leave no incomplete private artifact',()=>assert.equal(f.sql.prepare('SELECT count(*) n FROM runtime_artifacts WHERE artifact_type=?').get(LOCAL_PDF_TYPE).n,before));
f.env.PERSONAL_EVIDENCE_PDF_RENDERER={fetch:async()=>new Response(null,{status:503})};await assert.rejects(()=>prepareLocalPrivatePdf(context,{...opts,documentId:'R22-RECOVERY'}),/LOCAL_PDF_RENDER_FAILED/);
f.env.PERSONAL_EVIDENCE_PDF_RENDERER={fetch:async()=>new Response(small,{headers:{'content-type':'application/pdf'}})};const recovered=await prepareLocalPrivatePdf(context,{...opts,documentId:'R22-RECOVERY'});check('failed render permits successful explicit retry without corrupt saved state',()=>assert(recovered.artifactId));
check('zero external calls',()=>assert.equal(f.network(),0));
fs.writeFileSync(d+'PRIVATE-DELIVERY.json',JSON.stringify({at:new Date().toISOString(),status:'BLOCKED_FOR_LARGE_R22_PDFS',checks,total:checks.length,smallFile:{path:smallPath,bytes:small.length,sha256:hash(small)},largeFiles:sizes,grantTransport:'AUTHORIZATION_HEADER_NOT_URL',ttlMinutes:15,secretValuesRecorded:false,productionEquivalent:false,blockers:['R1.2 encrypted D1/base64 owner explicitly limits bytes to 1MiB; do not relax','R2 template identity must be separated from LOCAL-PDF-R1.2 before successful R2 cache issuance','PRIVATE_REPORTS R2 exists for trusted released reports, but its release/assertion pipeline is not an admitted PE visual PDF byte-ingest adapter','Production-equivalent streaming, memory/response budget, release admission and recovery at actual visual-PDF sizes not proven'],providerCalls:0,productionWrites:0},null,2));console.log('PASS',checks.length,'private safety checks; large visual delivery BLOCKED');
}finally{f.close();}
