import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import vm from 'node:vm';
const root='tools/review/personal-evidence-r1/';
const manifest=JSON.parse(fs.readFileSync(root+'portable-evidence-manifest.json'));
const html=fs.readFileSync(manifest.artifact,'utf8');
const script=html.match(/<script id="embedded-review-evidence">([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const payload=script.match(/^const embeddedDocuments=([\s\S]*?),embeddedAssets=([\s\S]*?);\r?\nfunction completeDocument/);
const documents=JSON.parse(payload[1]),assets=JSON.parse(payload[2]);
assert.equal(Object.keys(documents).length,44);
assert.equal(Object.keys(assets).length,15);
assert.equal(Buffer.byteLength(html),manifest.bytes);
assert.equal(crypto.createHash('sha256').update(html).digest('hex'),manifest.sha256);
assert.ok(manifest.bytes<25*1024*1024);
for(const name of manifest.documents){
 const source=documents[name];
 assert.ok(source.includes('<style>'));
 assert.ok(!/<link[^>]+rel="stylesheet"/.test(source));
 assert.ok(source.includes(fs.readFileSync('assets/customer-ui/surfaces/personal-evidence-dossier.css','utf8')));
 const images=[...source.matchAll(/<img[^>]+src="([^"]+)"/g)];
 if(name.endsWith('-dossier.html'))assert.equal(images.length,15,name);
 for(const [,url]of images)assert.ok(assets[url],name+': missing embedded image');
}
for(const asset of manifest.assets){
 const bytes=Buffer.from(assets[asset.url].split(',')[1],'base64');
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');
 assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);
}
assert.ok(html.includes('Existing PVP check:profile-visual-current expects four figures'));
assert.ok(html.includes('d.srcdoc=m.srcdoc=completeDocument(name)'));
assert.ok(!html.includes("d.src=m.src='/tools/review/"));
const receipt=JSON.parse(fs.readFileSync('content/profile/successors/personal-evidence-r1/acceptance/prd-w11-human-review-receipt-v1.json'));
assert.equal(receipt.w12Allowed,false);
assert.ok(!receipt.decision);
console.log('PORTABLE_REVIEW_CHECK = PASS (44 complete documents, 15 verified originals, inline CSS, closed W12)');
