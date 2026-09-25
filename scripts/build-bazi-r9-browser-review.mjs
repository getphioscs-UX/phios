import fs from 'node:fs';
import {buildBaziCustomerPublication} from '../functions/personal-reading/bazi-customer-publication.js';

const out='artifacts/bazi-r9-browser';
fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
for(const locale of ['en','zh-Hans']){
 const snapshot=await buildBaziCustomerPublication({
  reading:source.reading,
  locale,
  temporalSnapshot:source.temporalSnapshot,
  full:true
 });
 fs.writeFileSync(`${out}/snapshot-${locale}.json`,JSON.stringify(snapshot,null,2)+'\n');
}
const html=`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BaZi R9 Browser Review</title>
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/customer-ui/surfaces/visual-report.css">
<link rel="stylesheet" href="/assets/customer-ui/surfaces/report-publication.css">
<style>
body{margin:0;background:#ece9e1}
nav{max-width:1000px;margin:auto;padding:14px 18px;font:15px/1.5 system-ui}
nav a{margin-right:14px}
@media print{nav{display:none}body{background:white}}
</style></head>
<body><nav><strong>BaZi R9 · Static + Deterministic</strong>
<a href="?locale=en">English</a><a href="?locale=zh-Hans">中文</a>
<span id="meta"></span></nav><main id="report"></main>
<script type="module">
import {renderVisualReportPages} from '/assets/customer-ui/js/personal-products/visual-report-pages.js';
import {fitPublicationForPrint} from '/assets/customer-ui/js/personal-products/publication-report-pages.js';
const locale=new URLSearchParams(location.search).get('locale')||'en';
if(!['en','zh-Hans'].includes(locale))throw Error('LOCALE_INVALID');
const snapshot=await (await fetch('./snapshot-'+locale+'.json')).json();
document.documentElement.lang=locale;
document.querySelector('#meta').textContent=' · '+snapshot.totalPages+' pages';
document.querySelector('#report').innerHTML=renderVisualReportPages(snapshot);
await Promise.all([...document.querySelectorAll('#report img')].map(async i=>{try{await i.decode()}catch{}}));
await document.fonts.ready;
window.fitPublication=()=>fitPublicationForPrint(document.querySelector('#report'));
window.publicationSnapshot=snapshot;
window.batchReady=true;
</script></body></html>`;
fs.writeFileSync(`${out}/review.html`,html);
console.log('Built BaZi R9 browser review snapshots.');
