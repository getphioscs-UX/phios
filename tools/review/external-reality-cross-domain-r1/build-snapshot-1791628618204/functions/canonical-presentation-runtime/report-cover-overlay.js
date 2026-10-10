import {reportCoverOverlay} from './report-cover-overlay-registry.js';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function parts(date){if(!date)return null;const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);return m?{y:m[1],m:m[2],d:m[3]}:null;}
export function formatReportCoverFields({methodId,subject}={}){
 if(!subject||!['EXACT','APPROXIMATE','UNKNOWN'].includes(subject.timeAccuracy))throw Error('REPORT_COVER_SUBJECT_INVALID');
 if(subject.timeAccuracy==='UNKNOWN'&&subject.birthTime!==null)throw Error('COVER_UNKNOWN_TIME_FABRICATED');
 if(subject.timeAccuracy!=='UNKNOWN'&&!/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(subject.birthTime||''))throw Error('COVER_BIRTH_TIME_INVALID');
 if(subject.birthDate!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(subject.birthDate||'')||Number.isNaN(Date.parse(subject.birthDate+'T00:00:00Z'))||new Date(subject.birthDate+'T00:00:00Z').toISOString().slice(0,10)!==subject.birthDate))throw Error('COVER_BIRTH_DATE_INVALID');
 const cfg=reportCoverOverlay(methodId),d=parts(subject?.birthDate);
 const birthDate=d?(cfg.dateFormat==='DD / MM / YYYY'?d.d+' / '+d.m+' / '+d.y:d.y+' / '+d.m+' / '+d.d):'—';
 let birthTime='—';
 if(subject?.birthTime){
  const hm=String(subject.birthTime).slice(0,5).replace(':',' : ');
  birthTime=subject.timeAccuracy==='APPROXIMATE'?'≈ '+hm:hm;
 }
 return Object.freeze({name:subject?.displayName||'—',birthDate,birthTime});
}
export function renderReportCoverOverlay({methodId,subject}={}){
 const cfg=reportCoverOverlay(methodId),values=formatReportCoverFields({methodId,subject});
 const item=(key,value)=>{const s=cfg.slots[key],mask=s.mask===true?'background:rgba(255,253,247,.96);border-radius:2px;':'';return '<span class="pub-cover-value" data-cover-field="'+key+'" data-font-min="'+cfg.typography.fontMin+'" data-font-max="'+cfg.typography.fontMax+'" data-cover-mask="'+(s.mask===true?'true':'false')+'" style="left:'+s.left+'%;top:'+s.top+'%;width:'+s.width+'%;height:'+s.height+'%;text-align:'+(s.align||'center')+';font-family:'+esc(cfg.typography.fontFamily)+';line-height:'+cfg.typography.lineHeight+';'+mask+'">'+esc(value)+'</span>';};
 return '<div class="pub-cover-overlay" data-cover-overlay-version="1" data-cover-method="'+esc(methodId)+'">'+item('name',values.name)+item('birthDate',values.birthDate)+item('birthTime',values.birthTime)+'</div>';
}
export function assertCoverOverlayValues({methodId,subject,renderedValues}={}){
 const expected=formatReportCoverFields({methodId,subject});
 for(const k of ['name','birthDate','birthTime'])if(renderedValues?.[k]!==expected[k])throw Error('COVER_'+k.toUpperCase()+'_MISMATCH');
 if(subject?.timeAccuracy==='UNKNOWN'&&expected.birthTime!=='—')throw Error('COVER_UNKNOWN_TIME_FABRICATED');
 return true;
}

export function renderReportCoverPage({methodId,subject,src,alt='',pageNumber=1}={}){
 if(!src)throw Error('REPORT_COVER_BASE_ASSET_REQUIRED');
 if(!subject?.subjectReference)throw Error('REPORT_COVER_SUBJECT_REQUIRED');
 return '<section class="pub-static pub-cover-page" data-page-number="'+Number(pageNumber||1)+'" data-cover-method="'+esc(methodId)+'"><img class="pub-cover-base" src="'+esc(src)+'" alt="'+esc(alt)+'">'+renderReportCoverOverlay({methodId,subject})+'</section>';
}

export function fitReportCoverFields(root){
 return [...root.querySelectorAll('[data-cover-field]')].map(node=>{
  const min=Number(node.dataset.fontMin),max=Number(node.dataset.fontMax);
  if(!Number.isFinite(min)||!Number.isFinite(max)||min<=0||max<min)throw Error('COVER_FONT_CONTRACT_INVALID');
  let fits=false;
  for(let size=max;size>=min;size-=0.5){node.style.fontSize=size+'px';fits=node.scrollWidth<=node.clientWidth+1&&node.scrollHeight<=node.clientHeight+1;if(fits)break;}
  if(!fits)throw Error('COVER_FIELD_CLIPPED');
  return {field:node.dataset.coverField,fontSize:node.style.fontSize,fits};
 });
}
