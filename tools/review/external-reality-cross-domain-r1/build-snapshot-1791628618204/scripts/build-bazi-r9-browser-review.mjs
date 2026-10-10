import fs from 'node:fs';

const out='artifacts/bazi-r9-browser';
fs.mkdirSync(out,{recursive:true});

for(const locale of ['en','zh-Hans']){
 const src=`docs/acceptance/bazi-paid-report/r11/snapshot-${locale}.json`;
 if(!fs.existsSync(src))throw Error(`R11_SNAPSHOT_MISSING:${locale}`);
 fs.copyFileSync(src,`${out}/snapshot-${locale}.json`);
}
const html=`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BaZi R11 Browser Review</title>
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/customer-ui/surfaces/visual-report.css">
<link rel="stylesheet" href="/assets/customer-ui/surfaces/report-publication.css">
<style>
body{margin:0;background:#ece9e1}
nav{max-width:1000px;margin:auto;padding:14px 18px;font:15px/1.5 system-ui}
nav a{margin-right:14px}
@media print{nav{display:none}body{background:white}}
</style></head>
<body><nav><strong>BaZi R11 · Canonical review snapshot</strong>
<a href="?locale=en">English</a><a href="?locale=zh-Hans">中文</a>
<span id="meta"></span></nav><main id="report"></main>
<script type="module">
import {renderVisualReportPages,fitPublicationForPrint,settlePublicationAssets} from '/assets/customer-ui/js/personal-products/bazi-r9-review-runtime.bundle.js';
const locale=new URLSearchParams(location.search).get('locale')||'en';
if(!['en','zh-Hans'].includes(locale))throw Error('LOCALE_INVALID');
const snapshot=await (await fetch('./snapshot-'+locale+'.json')).json();
document.documentElement.lang=locale;
document.querySelector('#meta').textContent=' · '+snapshot.totalPages+' pages';
document.querySelector('#report').innerHTML=renderVisualReportPages(snapshot);
await document.fonts.ready;
await settlePublicationAssets(document.querySelector('#report'));
await Promise.all([...document.querySelectorAll('#report img')].map(async i=>{try{await i.decode()}catch{}}));
window.fitPublication=()=>fitPublicationForPrint(document.querySelector('#report'));
window.publicationSnapshot=snapshot;
window.batchReady=true;
</script></body></html>`;
fs.writeFileSync(`${out}/review.html`,html);
console.log('Built BaZi R11 browser review from canonical R11 snapshots.');
