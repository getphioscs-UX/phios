import {reportCoverOverlay} from './report-cover-overlay-registry.js';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function parts(date){if(!date)return null;const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);return m?{y:m[1],m:m[2],d:m[3]}:null;}
export function formatReportCoverFields({methodId,subject}={}){
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
 const item=(key,value)=>{const s=cfg.slots[key];return '<span class="pub-cover-value" data-cover-field="'+key+'" style="left:'+s.left+'%;top:'+s.top+'%;width:'+s.width+'%;height:'+s.height+'%;text-align:'+(s.align||'center')+'">'+esc(value)+'</span>';};
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
