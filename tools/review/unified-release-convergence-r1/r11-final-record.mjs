import fs from 'node:fs';import {createHash} from 'node:crypto';
const D='C:/phios/tools/review/unified-release-convergence-r1/r11',p='C:/phios/content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
const before=fs.readFileSync(p,'utf8'),old='5个定向模块编译与34项关闭准入检查通过；完整 Pages 发布图和候选 Cloudflare exact-SHA Preview 未完成。';
if(!before.includes(old))throw Error('MASTER_TARGET_MISSING');
const after=before.replace(old,'5个定向模块编译与34项关闭准入、11项shared-core、12项security/watchdog检查通过；整套Pages Functions以Wrangler 4.120.0及nodejs_compat最终编译通过，Worker 18,573,225 bytes，见 FUNCTIONS-BUILD.json。完整 Pages 静态发布图和候选 Cloudflare exact-SHA Preview 未完成。');
if(fs.readFileSync(p,'utf8')!==before)throw Error('MASTER_CONCURRENT_CHANGE');fs.writeFileSync(p,after);
const proof=JSON.parse(fs.readFileSync(D+'/MASTER-PRESERVATION.json'));proof.finalAfterSha256=createHash('sha256').update(fs.readFileSync(p)).digest('hex');proof.finalUpdate='Only R1.1 compilation sentence updated; original R1 and all other sections retained.';fs.writeFileSync(D+'/MASTER-PRESERVATION.json',JSON.stringify(proof,null,2));
const manifest=JSON.parse(fs.readFileSync(D+'/RELEASE-CANDIDATE.json'));console.log(JSON.stringify({candidate:manifest.candidateSha,reportExact:manifest.reportOwnerBytesConfirmed,functions:manifest.targetedChecks.functionsBuild.status,originalPreserved:proof.oldBytesRecoverExactly,anchorCount:after.split('id="unified-release-convergence-r11"').length-1}));
