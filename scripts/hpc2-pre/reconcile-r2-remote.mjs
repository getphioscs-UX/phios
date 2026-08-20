import fs from 'node:fs';
import { readJson, writeJson, normalizeBase, encodedKey, criticalCodes, svgAudit, webpDimensions, now, hasArg } from './lib.mjs';

const dry=hasArg('--dry-run');
const criticalOnly=hasArg('--critical');
const all=hasArg('--all') || !criticalOnly;
const base=normalizeBase(process.env.PHIOS_PUBLIC_ASSET_BASE_URL);
const publicPath='content/registry/public-assets.json';
const visualPath='content/web-production/registries/client-visual-asset-registry-v1.2.json';
const inventoryPath='content/web/homepage/hpc2-pre/r2-actual-object-inventory-v1.json';
const criticalPath='content/web/homepage/hpc2-pre/hpc2-pre-critical-asset-registry-v1.json';
const evidencePath='content/web/homepage/hpc2-pre/evidence/r2-live-verification-v1.json';
const pub=readJson(publicPath), visual=readJson(visualPath), inventory=readJson(inventoryPath), critical=readJson(criticalPath);
const eligible=pub.assets.filter(a=>a?.object_key && !a.object_key.endsWith('/') && (criticalCodes.includes(a.asset_code) || /^(HERO|FIG|ICON)-\d{3}$/.test(a.asset_code)));
const selected=eligible.filter(a=>all || criticalCodes.includes(a.asset_code));
const evidence=[];
let failures=0;

async function verify(asset) {
  const url=`${base}/${encodedKey(asset.object_key)}`;
  let head;
  try { head=await fetch(url,{method:'HEAD',redirect:'follow'}); } catch(e){ return {assetCode:asset.asset_code,objectKey:asset.object_key,requestedURL:url,ok:false,error:String(e.message||e)}; }
  const contentType=(head.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  const expected=String(asset.content_type||'').toLowerCase();
  const rec={assetCode:asset.asset_code,objectKey:asset.object_key,requestedURL:url,httpStatus:head.status,contentType,contentLength:head.headers.get('content-length'),etag:head.headers.get('etag'),verifiedAt:now(),ok:head.ok && (!expected || contentType===expected)};
  if (!rec.ok) return rec;
  if (asset.format==='svg') {
    const get=await fetch(url,{headers:{Accept:'image/svg+xml'}});
    const text=await get.text();
    const audit=svgAudit(text);
    Object.assign(rec,{getStatus:get.status,svg:audit,ok:rec.ok && get.ok && audit.validSvg && !!audit.viewBox && !audit.scriptPresent && !audit.externalActiveContentPresent});
  } else if (asset.asset_code.startsWith('HERO-')) {
    const get=await fetch(url,{headers:{Range:'bytes=0-65535',Accept:'image/webp'}});
    const buf=Buffer.from(await get.arrayBuffer());
    const dims=webpDimensions(buf);
    Object.assign(rec,{getStatus:get.status,dimensions:dims,ok:rec.ok && get.ok && dims?.width===2560 && dims?.height===1440});
  }
  return rec;
}

for (const asset of selected) {
  const rec=await verify(asset);
  evidence.push(rec);
  if (!rec.ok) { failures++; console.error(`✗ ${asset.asset_code}: ${rec.httpStatus||rec.error||'verification failed'} ${rec.contentType||''}`); }
  else console.log(`✓ ${asset.asset_code} ${rec.contentType}`);
}
const report={schemaVersion:'1.0.0',work:'HPC2-PRE-1/HPC2-PRE-8',baseUrl:base,scope:criticalOnly?'CRITICAL_16':'HERO_FIGURE_ICON_PLUS_CRITICAL_COVERS',dryRun:dry,verifiedAt:now(),recordCount:evidence.length,passCount:evidence.filter(x=>x.ok).length,failCount:failures,records:evidence};
if (dry) { if(failures) process.exitCode=1; console.log(`HPC2-PRE remote dry-run: ${report.passCount}/${report.recordCount} PASS.`); process.exitCode ||= 0; }
else {
  writeJson(evidencePath,report);
  const byCode=new Map(evidence.map(x=>[x.assetCode,x]));
  for (const asset of pub.assets) {
    const ev=byCode.get(asset.asset_code); if(!ev?.ok) continue;
    asset.status='remote-verified'; asset.verification='verified-remote-head-get'; asset.remote={requested_url:ev.requestedURL,http_status:ev.httpStatus,content_type:ev.contentType,content_length:ev.contentLength,etag:ev.etag,verified_at:ev.verifiedAt,...(ev.dimensions?{dimensions:ev.dimensions}:{}),...(ev.svg?{svg:ev.svg}:{})};
  }
  // Keep runtime delivery environment-led. Remote verification records the tested public base
  // without hard-coding it into registry.public_base_url; the browser still resolves via /api/public-asset-config.
  pub.public_base_url=null; pub.public_domain_status=failures?'partial-remote-verification':'remote-verified-runtime-environment-still-required'; pub.hpc2_pre.remote_verification_last_run=report.verifiedAt; pub.hpc2_pre.last_verified_public_base_url=base;
  writeJson(publicPath,pub);
  for (const v of visual.assets) {
    const ev=byCode.get(v.assetCode); if(!ev?.ok) continue;
    v.r2.remoteVerified=true; v.r2.remoteVerificationState='REMOTE_VERIFIED'; v.r2.verifiedAt=ev.verifiedAt; v.r2.requestedURL=ev.requestedURL; v.r2.etag=ev.etag; v.r2.contentLength=ev.contentLength;
    v.canonicalState=String(v.canonicalState||'').replace('AWAITING_REMOTE_VERIFICATION_AND_','REMOTE_VERIFIED_AWAITING_').replace('UPLOADED_REPORTED_BY_OWNER_AWAITING_REMOTE_VERIFICATION_AND_HUMAN_ACCEPTANCE','REMOTE_VERIFIED_AWAITING_HUMAN_ACCEPTANCE');
  }
  writeJson(visualPath,visual);
  for (const item of inventory.records) {
    const ev=byCode.get(item.assetCode); if(!ev?.ok) continue;
    item.size=ev.contentLength?Number(ev.contentLength):null; item.etagOrChecksum=ev.etag||null; item.remoteObjectState='REMOTE_VERIFIED'; item.publicReachabilityState='PUBLIC_REACHABLE'; item.canonicalFormatMatch='REMOTE_MIME_VERIFIED'; item.officialFilenameMatch='VERIFIED_BY_OBJECT_KEY'; item.verifiedAt=ev.verifiedAt;
    if(ev.dimensions){item.width=ev.dimensions.width;item.height=ev.dimensions.height;} if(ev.svg?.viewBox)item.viewBox=ev.svg.viewBox;
  }
  inventory.remoteVerificationState=failures?'PARTIAL':'REMOTE_VERIFIED'; inventory.status=failures?'REMOTE_VERIFICATION_PARTIAL':'REMOTE_VERIFICATION_COMPLETED'; writeJson(inventoryPath,inventory);
  for (const item of critical.records) { const ev=byCode.get(item.assetCode); if(ev?.ok){item.remoteVerified=true;item.remoteVerifiedAt=ev.verifiedAt;item.requestedURL=ev.requestedURL;} }
  writeJson(criticalPath,critical);
  await import('./refresh-status.mjs');
  if(failures){console.error(`HPC2-PRE remote verification completed with ${failures} failure(s). No failed asset was promoted.`);process.exitCode=1;} else console.log(`✓ HPC2-PRE remote verification promoted ${report.passCount}/${report.recordCount} real objects.`);
}
