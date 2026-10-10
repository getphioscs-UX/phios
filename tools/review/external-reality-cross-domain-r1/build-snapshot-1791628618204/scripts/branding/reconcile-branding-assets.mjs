import assert from 'node:assert/strict';
import fs from 'node:fs';

const PUBLIC = 'content/registry/public-assets.json';
const VISUAL = 'content/web-production/registries/client-visual-asset-registry-v1.2.json';
const publicRegistry = JSON.parse(fs.readFileSync(PUBLIC,'utf8'));
const visualRegistry = JSON.parse(fs.readFileSync(VISUAL,'utf8'));
const baseRaw = String(process.env.PHIOS_PUBLIC_ASSET_BASE_URL ?? '').trim();
assert.ok(baseRaw, 'PHIOS_PUBLIC_ASSET_BASE_URL is required.');
const base = new URL(baseRaw); assert.equal(base.protocol,'https:');
const baseUrl = base.toString().replace(/\/$/,'');
const targets = visualRegistry.assets.filter(r => /^BRAND-00[1-5]$/.test(String(r.sequence)));
assert.equal(targets.length,5,'BRI requires exactly five Branding records.');
const evidence=[];
for (const record of targets) {
  const key=record.r2.objectKey;
  const url=`${baseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const response=await fetch(url,{method:'HEAD',redirect:'follow'});
  assert.ok(response.ok,`BRANDING_REMOTE_HEAD_FAILED ${record.sequence} ${response.status}`);
  const ct=response.headers.get('content-type')||'';
  assert.match(ct,/image\/webp/i,`BRANDING_CONTENT_TYPE_MISMATCH ${record.sequence}: ${ct}`);
  evidence.push({sequence:record.sequence,assetCode:record.assetCode,url,status:response.status,contentType:ct,contentLength:response.headers.get('content-length'),etag:response.headers.get('etag'),verifiedAt:new Date().toISOString()});
}
for (const ev of evidence) {
  const visual=targets.find(x=>x.sequence===ev.sequence); visual.r2.remoteVerified=true; visual.state='REMOTE_VERIFIED_AWAITING_CONSUMER_ACCEPTANCE';
  const pub=publicRegistry.assets.find(x=>x.asset_code===ev.assetCode); assert.ok(pub,`PUBLIC_ASSET_MISSING ${ev.assetCode}`);
  pub.status='remote-verified'; pub.verification='verified-remote-head-get'; pub.remote={requested_url:ev.url,http_status:ev.status,content_type:ev.contentType,content_length:ev.contentLength,etag:ev.etag,verified_at:ev.verifiedAt};
}
fs.writeFileSync(PUBLIC,JSON.stringify(publicRegistry,null,2)+'\n');
fs.writeFileSync(VISUAL,JSON.stringify(visualRegistry,null,2)+'\n');
console.log('✓ BRI Branding R2 verification passed: 5/5.');
