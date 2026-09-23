import {renderVisualReportPages} from './visual-report-pages.js';
import {fitPublicationForPrint,settlePublicationAssets} from './publication-report-pages.js';
const root='/docs/guided-report-successor-r2/bazi-t3';
const locale=document.querySelector('script[data-locale]').dataset.locale||new URLSearchParams(location.search).get('locale')||'en';
if(!['en','zh-Hans'].includes(locale))throw Error('LOCALE_INVALID');
document.documentElement.lang=locale;
const snapshot=await(await fetch(`${root}/bazi-${locale}.json`)).json();
const report=document.querySelector('#report');report.innerHTML=renderVisualReportPages(snapshot);
document.querySelector('#pdf').href=`${root}/bazi-t3-${locale}.pdf`;
window.fitPublication=()=>fitPublicationForPrint(report);window.addEventListener('beforeprint',window.fitPublication);
await settlePublicationAssets(report);await document.fonts.ready;
window.publicationSnapshot=snapshot;window.batchReady=true;
document.querySelector('#compare').onclick=async()=>{
 const container=document.querySelector('#comparison');container.replaceChildren();
 const comparison=await(await fetch(`${root}/comparison-${locale}.json`)).json();
 for(const row of comparison){const article=document.createElement('article'),title=document.createElement('h2');title.textContent=`${row.sectionKey} · ${row.status==='PASS'?'T3 CANDIDATE':'T3 UNAVAILABLE — T2 FALLBACK'}`;article.append(title);for(const [label,texts] of [['T2 CURRENT',row.current],['T3 CANDIDATE',row.status==='PASS'?row.candidate:['No admitted T3 candidate yet.']]]){const div=document.createElement('div'),h=document.createElement('h3');h.textContent=label;div.append(h);for(const text of texts){const p=document.createElement('p');p.textContent=text;div.append(p);}article.append(div);}container.append(article);}
 container.hidden=!container.hidden;report.hidden=!container.hidden;
};
document.querySelector('#generate').onclick=async()=>{
 const button=document.querySelector('#generate'),status=document.querySelector('#generation-status');button.disabled=true;status.textContent='Running one bounded Preview shadow attempt…';
 try{const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale,sectionKey:document.querySelector('#section').value})});const data=await response.json();status.textContent=JSON.stringify({httpStatus:response.status,...data},null,2);}
 catch{status.textContent='Preview request failed. No production activation.';}
 finally{button.disabled=false;}
};
