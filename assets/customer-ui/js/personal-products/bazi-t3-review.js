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
const parity=document.createElement('button');parity.textContent='Verify selected bilingual pair';runMatrix.after(parity);
parity.onclick=async()=>{
 parity.disabled=true;const status=document.querySelector('#generation-status');status.textContent='Checking the two frozen locale snapshots…';
 try{const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'parity',locale,sectionKey:document.querySelector('#section').value,profileId:profile.value})});status.textContent=JSON.stringify({httpStatus:response.status,...await response.json()},null,2);}
 catch{status.textContent='Bilingual parity request failed. No acceptance recorded.';}finally{parity.disabled=false;}
};
runMatrix.onclick=async()=>{
 runMatrix.disabled=true;document.querySelector('#generate').disabled=true;
 const results=[],status=document.querySelector('#generation-status');
 try{
 const gate=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'matrix-status',locale,sectionKey:'S02_PERSONALITY',profileId:'BASELINE_NOW'})});
 if(!gate.ok){status.textContent=JSON.stringify(await gate.json(),null,2);return;}
 for(const row of shadow.matrix){
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
 for(const row of comparison){const article=document.createElement('article'),title=document.createElement('h2');title.textContent=`${row.sectionKey} · ${row.status==='PASS'?'T3 CANDIDATE':'T3 UNAVAILABLE — T2 FALLBACK'}`;article.append(title);for(const [label,texts] of [['T2 CURRENT',row.current],['T3 CANDIDATE',row.status==='PASS'?row.candidate:['No admitted T3 candidate yet.']]]){const div=document.createElement('div'),h=document.createElement('h3');h.textContent=label;div.append(h);for(const text of texts){const p=document.createElement('p');p.textContent=text;div.append(p);}article.append(div);}if(row.status==='PASS'&&/^[a-f0-9]{64}$/.test(row.snapshotDigest||'')){
 const label=document.createElement('label');label.textContent='Human decision · '+row.sectionKey+' ';
 const select=document.createElement('select');select.dataset.humanSection=row.sectionKey;select.dataset.snapshotDigest=row.snapshotDigest;
 for(const value of ['', 'ACCEPT','REVISE','REJECT']){const option=document.createElement('option');option.value=value;option.textContent=value||'Not reviewed';select.append(option);}label.append(select);article.append(label);
 }container.append(article);}
 const reviewer=document.createElement('input');reviewer.setAttribute('aria-label','Human reviewer name');reviewer.placeholder='Human reviewer name';
 const exportReview=document.createElement('button');exportReview.textContent='Export human review evidence';
 const reviewStatus=document.createElement('p');reviewStatus.textContent='Decisions are bound to the displayed snapshot. Exported evidence still requires validation by the release owner; it does not activate production.';
 exportReview.onclick=()=>{const name=reviewer.value.trim(),choices=[...container.querySelectorAll('[data-human-section]')].filter(s=>s.value);if(!name||!choices.length){reviewStatus.textContent='Enter the reviewer name and an explicit section decision.';return;}
 const record={locale,authorityVersion:'BAZI_EXPLANATORY_AUTHORITY_V1',humanReviews:choices.map(s=>({sectionKey:s.dataset.humanSection,locale,snapshotDigest:s.dataset.snapshotDigest,decision:s.value,reviewer:name,reviewedAt:new Date().toISOString()})),productionActivated:false};
 const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='bazi-human-review-'+locale+'.json';link.click();URL.revokeObjectURL(url);reviewStatus.textContent='Review evidence exported. Release acceptance remains separate.';};container.append(reviewer,exportReview,reviewStatus);
 container.hidden=!container.hidden;report.hidden=!container.hidden;
};
document.querySelector('#generate').onclick=async()=>{
 const button=document.querySelector('#generate'),status=document.querySelector('#generation-status');button.disabled=true;status.textContent='Running one bounded Preview shadow attempt…';
 try{const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale,sectionKey:document.querySelector('#section').value,profileId:profile.value})});const data=await response.json();status.textContent=JSON.stringify({httpStatus:response.status,...data},null,2);}
 catch{status.textContent='Preview request failed. No production activation.';}
 finally{button.disabled=false;}
};
document.querySelector('#generate').disabled=false;
