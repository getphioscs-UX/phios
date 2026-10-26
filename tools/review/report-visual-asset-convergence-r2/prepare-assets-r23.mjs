import fs from 'node:fs';import assert from 'node:assert/strict';
const d='tools/review/report-visual-asset-convergence-r2/recovery-r23/',p='content/reports/shared/report-visual-assets-r2.json',m=JSON.parse(fs.readFileSync(p)),rows=JSON.parse(fs.readFileSync(d+'PUBLIC-READS.json')).rows;
const r=rows.find(r=>r.methodId==='PROFILE');assert.equal(r.status,200);assert(r.decoded);
const a=m.assets.find(a=>a.methodId==='PROFILE'&&a.pageId==='BODY');assert(['images/reports/profile/editorial/VIS-REPORT-PROFILE-BODY.webp',r.key].includes(a.objectKey));
Object.assign(a,{objectKey:r.key,url:r.url+'?v='+r.sha256,active:true,verification:'PUBLIC_BYTES_DECODED_AND_VISUALLY_REVIEWED',approval:'OWNER_APPROVED_R2_20261026',version:'OWNER_R23_20261026_'+r.sha256.slice(0,16),sha256:r.sha256,bytes:r.bytes,width:r.width,height:r.height,publicHttpStatus:200,inventoryAuthority:'OWNER_R23_EXPLICIT_BODY_PATH_APPROVAL',managementApiVerified:false});
m.reports.PROFILE.blockers=m.reports.PROFILE.blockers.filter(s=>!s.includes('BODY'));fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
console.log('PROFILE exact approved new BODY bound; ECR unresolved mappings unchanged');
