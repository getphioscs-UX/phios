import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import vm from 'node:vm';
const root='tools/review/personal-evidence-r1/';
const manifest=JSON.parse(fs.readFileSync(root+'portable-evidence-manifest.json'));
const html=fs.readFileSync(manifest.artifact,'utf8');
const script=html.match(/<script id="embedded-review-evidence">([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const payload=script.match(/^const embeddedDocuments=([\s\S]*?),embeddedAssets=([\s\S]*?);\r?\nconst displayAssets/);
const documents=JSON.parse(payload[1]),assets=JSON.parse(payload[2]);
assert.equal(Object.keys(documents).length,manifest.documentCount);
assert.equal(Object.keys(assets).length,16);
assert.equal(Buffer.byteLength(html),manifest.bytes);
assert.equal(crypto.createHash('sha256').update(html).digest('hex'),manifest.sha256);
assert.ok(manifest.bytes<25*1024*1024);
for(const name of manifest.documents){
 const source=documents[name];
 assert.ok(source.includes('<style>'));
 assert.ok(!/<link[^>]+rel="stylesheet"/.test(source));
 assert.ok(source.includes(fs.readFileSync('assets/customer-ui/surfaces/personal-evidence-dossier.css','utf8')));
 const images=[...source.matchAll(/<img[^>]+src="([^"]+)"/g)];
 if(name.endsWith('-dossier.html')){assert.equal((source.match(/data-pe-static=/g)||[]).length,15,name);assert.ok(images.length>15,name);assert.ok(source.includes('data-body-visual="true"'));}
 for(const [,url]of images)assert.ok(assets[url],name+': missing embedded image');
}
for(const asset of manifest.assets){
 const bytes=Buffer.from(assets[asset.url].split(',')[1],'base64');
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');
 assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);
}
assert.ok(/PVP[\s\S]*four-figure check[\s\S]*nine-figure implementation/.test(html));assert.equal(manifest.product,'ONE_BILINGUAL_REPORT');assert.equal(manifest.customerReportCount,manifest.caseCount);assert.ok(!html.includes('id="locale"'));assert.ok(manifest.documents.every(x=>x.includes('-bilingual-')));
assert.ok(/d\.srcdoc=m\.srcdoc=completeDocument/.test(html));
assert.ok(!html.includes("d.src=m.src='/tools/review/"));
const receipt=JSON.parse(fs.readFileSync('content/profile/successors/personal-evidence-r1/acceptance/prd-w11-human-review-receipt-v1.json'));
assert.equal(receipt.w12Allowed,false);
assert.ok(!receipt.decision);
console.log(`PORTABLE_REVIEW_CHECK = PASS (${manifest.documentCount} complete documents, 15 static originals + BODY, inline CSS, closed W12)`);
