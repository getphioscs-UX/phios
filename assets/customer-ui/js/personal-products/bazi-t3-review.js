import editorialAcceptance from '../../../../config/reports/bazi-editorial-quality-acceptance.json';
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
// F-W0: no browser action can launch a matrix or parity before human prose review.
runMatrix.disabled=true;runMatrix.textContent='Full matrix paused — Addendum F';
parity.disabled=true;parity.textContent='Parity follows baseline editorial acceptance';
profile.value='BASELINE_NOW';profile.disabled=true;
const sectionOptions=[...document.querySelector('#section').options];
const activeSection=sectionOptions.find(option=>!['en','zh-Hans'].every(language=>editorialAcceptance.humanReviews.some(r=>r.profileId==='BASELINE_NOW'&&r.sectionKey===option.value&&r.locale===language&&r.decision==='ACCEPT'&&r.snapshotDigest&&r.briefDigest&&r.reviewer&&r.reviewedAt)))?.value;
for(const option of sectionOptions)option.disabled=option.value!==activeSection;
if(activeSection)document.querySelector('#section').value=activeSection;else document.querySelector('#generate').disabled=true;
document.querySelector('#compare').textContent='Historical Addendum E comparison — not Addendum F acceptance';
const editorialReview=document.createElement('section');editorialReview.id='editorial-f-result';
editorialReview.style.cssText='max-width:900px;margin:24px auto;padding:24px;background:#fffcf4;line-height:1.8';
document.querySelector('nav').after(editorialReview);
editorialReview.textContent=`Addendum F: BASELINE_NOW ${activeSection||'baseline review complete'} only. Both languages require human acceptance before the next section. Historical snapshots do not count as F acceptance.`;
function showEditorialCandidate(result){
 const accepted=result?.status==='PASS'&&result.snapshot&&result.editorialReassessment?.status!=='REJECT';
 const candidate=result?.snapshot?.finalNarrative||result?.internalOnly?.candidate||result?.internalOnly?.lastRepair?.candidate;
 editorialReview.replaceChildren();
 const heading=document.createElement('h2');heading.textContent=`Addendum F · ${activeSection} · ${locale} · ${accepted?'Awaiting human editorial review':'Machine rejected / unavailable — not accepted'}`;editorialReview.append(heading);
 if(!candidate){const p=document.createElement('p');p.textContent=result?.internalOnly?.fallbackReason||result?.reason||'No prose returned.';editorialReview.append(p);return;}
 for(const field of ['headline','lead','interpretation','supportingConditions','tensionConditions','howThisMayShowUp','closingInsight','observationPrompt','counterSignals','realityCheck','boundaryNote','technicalNote']){
  const blocks=Array.isArray(candidate[field])?candidate[field]:[candidate[field]];
  if(!blocks.some(b=>b?.text?.trim()))continue;
  const title=document.createElement('h3');title.textContent=field;editorialReview.append(title);
  for(const b of blocks){if(!b?.text?.trim())continue;const p=document.createElement('p');p.textContent=b.text;editorialReview.append(p);}
 }
 if(!accepted){if(result?.editorialReassessment){const p=document.createElement('p');p.textContent='Current editorial check: '+result.editorialReassessment.issues.join(', ');editorialReview.append(p);}return;}
 const metadata=document.createElement('pre');metadata.style.overflowWrap='anywhere';metadata.style.whiteSpace='pre-wrap';metadata.textContent=JSON.stringify({snapshotDigest:result.snapshot.snapshotDigest,briefDigest:result.snapshot.sectionNarrativeBriefDigest,quality:result.snapshot.editorialQuality},null,2);editorialReview.append(metadata);
 const reviewer=document.createElement('input');reviewer.placeholder='Human reviewer name';reviewer.setAttribute('aria-label','Addendum F reviewer');
 const decision=document.createElement('select');decision.setAttribute('aria-label','Addendum F decision');
 for(const [value,label] of [['','Not reviewed'],['ACCEPT','Accept editorial quality'],['REVISE','Needs revision'],['REJECT','Reject']]){const option=document.createElement('option');option.value=value;option.textContent=label;decision.append(option);}
 const button=document.createElement('button');button.textContent='Export digest-bound Addendum F review';
 button.onclick=()=>{if(!reviewer.value.trim()||!decision.value)return;const record={version:'BAZI_EDITORIAL_QUALITY_F_V1',humanReviews:[{profileId:'BASELINE_NOW',sectionKey:result.snapshot.sectionKey,locale,snapshotDigest:result.snapshot.snapshotDigest,briefDigest:result.snapshot.sectionNarrativeBriefDigest,decision:decision.value,reviewer:reviewer.value.trim(),reviewedAt:new Date().toISOString()}],productionActivated:false};const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`bazi-editorial-f-${activeSection}-${locale}-human-review.json`;link.click();URL.revokeObjectURL(url);};
 editorialReview.append(reviewer,decision,button);
}
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
 try{const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale,sectionKey:document.querySelector('#section').value,profileId:profile.value})});const data=await response.json();status.textContent=JSON.stringify({httpStatus:response.status,...data},null,2);showEditorialCandidate(data.result);}
 catch{status.textContent='Preview request failed. No production activation.';}
 finally{button.disabled=false;}
};
document.querySelector('#generate').disabled=false;
