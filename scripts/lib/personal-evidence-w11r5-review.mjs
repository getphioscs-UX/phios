import fs from 'node:fs';
import crypto from 'node:crypto';
export function finalizePersonalEvidenceReviewHub(){
 const path='tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html',manifestPath='tools/review/personal-evidence-r1/portable-evidence-manifest.json';let html=fs.readFileSync(path,'utf8');
 const sections=['SEC-01','SEC-07','SEC-03','SEC-09','SEC-09','SEC-06','SEC-05','SEC-04','SEC-09'];
 if(!html.includes('id="pfig-jump"')){const select='<label>PFIG quick jump / 图形跳转 <select id="pfig-jump"><option value="">选择图形 / Select figure</option>'+sections.map((s,i)=>'<option value="PFIG-'+String(i+1).padStart(3,'0')+'">'+s+' · PFIG-'+String(i+1).padStart(3,'0')+'</option>').join('')+'</select></label>';html=html.replace('<nav>','<nav>'+select).replace('function load(){',`document.querySelector('#pfig-jump').onchange=function(){for(const f of [d,m])f.contentDocument.querySelector('[data-pfig="'+this.value+'"]')?.scrollIntoView({block:'start'})};function load(){`);}
 fs.writeFileSync(path,html);const m=JSON.parse(fs.readFileSync(manifestPath));m.bytes=Buffer.byteLength(html);m.sha256=crypto.createHash('sha256').update(html).digest('hex');fs.writeFileSync(manifestPath,JSON.stringify(m,null,2));
}
