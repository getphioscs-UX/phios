import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from '../../../../scripts/lib/world-browser-runtime.mjs';
const dir=process.env.WORLD_PREVIEW_EVIDENCE_DIR,meta=JSON.parse(fs.readFileSync(path.join(dir,'WMDA-PRODUCTION-IDENTITY.json'))),before=JSON.parse(fs.readFileSync(path.join(dir,'../R1-PREDEPLOY-PUBLIC-BASELINE.json')));
assert.equal(meta.commitHash,process.env.WORLD_PREVIEW_HEAD);
const browser=await loadWorldPlaywright().chromium.launch({...worldBrowserLaunchOptions(),args:['--no-proxy-server']});
const rows=[],assets=[],unauthenticated=[];let status='FAIL';const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
try{const ctx=await browser.newContext();
 for(const row of before.rows){const r=await ctx.request.get(meta.url+row.path);rows.push({path:row.path,beforeStatus:row.status,status:r.status(),sameStatus:r.status()===row.status});}
 for(const rel of ['assets/js/pages/civilization-atlas/world-company-analysis.js','assets/js/pages/civilization-atlas/reconfiguration-renderer.js','assets/js/i18n.js']){const expected=hash(fs.readFileSync(path.join('C:/phios/.worktrees/world-release-main/.pages-output',rel)));for(const origin of [meta.url,meta.deploymentUrl]){const r=await ctx.request.get(origin+'/'+rel);assets.push({path:rel,origin,status:r.status(),sourceHashMatches:r.status()===200&&hash(await r.body())===expected,expectedSha256:expected});}}
 for(const route of ['/api/account-persons','/api/account-reports','/api/account-report-download']){const r=await ctx.request.get(meta.url+route);assert.equal(r.status(),401);const body=await r.json();assert.equal(body.code,'ACCOUNT_REQUIRED');unauthenticated.push({path:route,status:401,code:body.code,customerIdentityUsed:false});}
 assert(rows.every(r=>r.sameStatus));assert(assets.every(r=>r.sourceHashMatches));status='PASS';await ctx.close();
}finally{await browser.close();fs.writeFileSync(path.join(dir,'WMDA-PRODUCTION-BROWSER-PUBLIC-BOUNDARIES.json'),JSON.stringify({status,identity:meta,rows,assets,unauthenticated,pythonProbe:'Separate Python client returned 1010 also on old deployment; retained as client limitation, not counted as browser PASS',providerCalls:0,productionWrites:0},null,2));}
console.log(JSON.stringify({status,publicPaths:rows.length,artifactChecks:assets.length}));
