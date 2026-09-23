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
const shadow=await(await fetch(`${root}/shadow-matrix.json`)).json();
const profile=document.createElement('select');profile.id='profile';profile.setAttribute('aria-label','Synthetic shadow profile');
for(const id of new Set(shadow.matrix.map(r=>r.profileId))){const option=document.createElement('option');option.value=id;option.textContent=id;profile.append(option);}
document.querySelector('#section').before(profile);
const runMatrix=document.createElement('button');runMatrix.textContent='Run fixed shadow matrix';runMatrix.id='run-matrix';document.querySelector('#generate').after(runMatrix);
runMatrix.onclick=async()=>{
 runMatrix.disabled=true;document.querySelector('#generate').disabled=true;
 const results=[],status=document.querySelector('#generation-status');
 try{for(const row of shadow.matrix){
  if(row.control||row.state==='SOURCE_REJECTED'){results.push(row);continue;}
  status.textContent=`Shadow progress ${results.length} / ${shadow.matrix.length}`;
  const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:row.profileId,locale:row.locale,sectionKey:row.sectionKey})});
  const data=await response.json();results.push({profileId:row.profileId,locale:row.locale,sectionKey:row.sectionKey,httpStatus:response.status,...data});
  // Stop the matrix on infrastructure/provider failure; do not repeat a bad
  // configuration across every case. Semantic rejections remain useful cases.
  if(!response.ok||data.result?.providerFailure||['PROVIDER_TIMEOUT','PROVIDER_CREDENTIAL_NOT_CONFIGURED','NO_ADMITTED_PROVIDER_ROUTE'].includes(data.result?.internalOnly?.fallbackReason))break;
 }status.textContent=JSON.stringify({completed:results.length,total:shadow.matrix.length,productionActivated:false,results},null,2);}
 catch{status.textContent=JSON.stringify({completed:results.length,total:shadow.matrix.length,error:'SHADOW_REQUEST_FAILED',results},null,2);}
 finally{runMatrix.disabled=false;document.querySelector('#generate').disabled=false;}
};
document.querySelector('#compare').onclick=async()=>{
 const container=document.querySelector('#comparison');container.replaceChildren();
 const comparison=await(await fetch(`${root}/comparison-${locale}.json`)).json();
 for(const row of comparison){const article=document.createElement('article'),title=document.createElement('h2');title.textContent=`${row.sectionKey} · ${row.status==='PASS'?'T3 CANDIDATE':'T3 UNAVAILABLE — T2 FALLBACK'}`;article.append(title);for(const [label,texts] of [['T2 CURRENT',row.current],['T3 CANDIDATE',row.status==='PASS'?row.candidate:['No admitted T3 candidate yet.']]]){const div=document.createElement('div'),h=document.createElement('h3');h.textContent=label;div.append(h);for(const text of texts){const p=document.createElement('p');p.textContent=text;div.append(p);}article.append(div);}container.append(article);}
 container.hidden=!container.hidden;report.hidden=!container.hidden;
};
document.querySelector('#generate').onclick=async()=>{
 const button=document.querySelector('#generate'),status=document.querySelector('#generation-status');button.disabled=true;status.textContent='Running one bounded Preview shadow attempt…';
 try{const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale,sectionKey:document.querySelector('#section').value,profileId:profile.value})});const data=await response.json();status.textContent=JSON.stringify({httpStatus:response.status,...data},null,2);}
 catch{status.textContent='Preview request failed. No production activation.';}
 finally{button.disabled=false;}
};
document.querySelector('#generate').disabled=false;
