import fs from 'node:fs';
import crypto from 'node:crypto';
import {resolvePersonalEvidenceStaticPage,resolvePersonalEvidenceSectionMaster,resolvePersonalEvidenceSharedVisual} from '../functions/profile/personal-evidence-visual-assets.js';
const required=[...['P01','P02','P03','P04','P05'].map(resolvePersonalEvidenceStaticPage),...Array.from({length:10},(_,i)=>resolvePersonalEvidenceSectionMaster('SEC-'+String(i+1).padStart(2,'0'))),...['BODY','SECTION_STYLE'].map(resolvePersonalEvidenceSharedVisual)],checks=[];
for(const asset of required){const response=await fetch(asset.publicUrl),bytes=Buffer.from(await response.arrayBuffer()),available=response.status===200&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';checks.push({id:asset.id,objectKey:asset.objectKey,url:asset.publicUrl,status:response.status,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),required:true,available});}
fs.writeFileSync('content/profile/successors/personal-evidence-r1/w11r3/r2-resolution-evidence.json',JSON.stringify({work:'PRD-W11R3',checkedAt:new Date().toISOString(),method:'GET',checks,requiredAssetsAvailable:checks.every(x=>x.available),remoteMutationPerformed:false},null,2)+'\n');
if(checks.some(x=>!x.available))throw new Error('PUBLICATION_VISUAL_UNAVAILABLE');
console.log('W11R3_VISUAL_GET = PASS (17 canonical originals; historical audits preserved)');
