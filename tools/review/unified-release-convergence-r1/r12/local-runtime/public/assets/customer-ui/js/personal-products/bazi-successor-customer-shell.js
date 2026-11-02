import {renderPublicationReport} from './publication-report-pages.js';
import {formatReportCoverFields} from '../../../../functions/canonical-presentation-runtime/report-cover-overlay.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A successor shell; archived HTML and visual masters are never edited.
// Accessible fields remain readable on small screens instead of fitting a
// full name into a scaled artwork slot. A4 retains native cover overlay.
export const BAZI_SUCCESSOR_SHELL_CSS=`.bazi-customer-shell{max-width:100%;overflow-wrap:anywhere}.bazi-mobile-subject{display:none}.bazi-customer-shell [data-cover-field="name"]{white-space:normal;overflow-wrap:anywhere}.bazi-customer-shell[data-long-subject-name] [data-cover-field="name"]{top:84.5%!important;height:3.3%!important;background:rgba(255,253,247,.96)}@media screen and (max-width:600px){.bazi-customer-shell .pub-cover-overlay{display:none}.bazi-mobile-subject{display:block;background:#fffdf7;color:#173047;padding:20px;border:1px solid #d8d4c8}.bazi-mobile-subject dl{margin:0;display:grid;gap:16px}.bazi-mobile-subject dt{font-size:13px}.bazi-mobile-subject dd{margin:4px 0 0;font-size:18px;line-height:1.5;overflow-wrap:anywhere;white-space:normal}.bazi-customer-shell .pub-static,.bazi-customer-shell .pub-page{max-width:100%}}@media print{.bazi-mobile-subject{display:none!important}}`;
export function renderBaziSuccessorCustomerShell(snapshot){
 if(snapshot?.methodId!=='BZR'||!snapshot.subjectPresentation)throw Error('BAZI_BOUND_SNAPSHOT_REQUIRED');
 const values=formatReportCoverFields({methodId:'BZR',subject:snapshot.subjectPresentation});
 const labels={name:'姓名 / Name',birthDate:'出生日期 / Birth date',birthTime:'出生时间 / Birth time'};
 return '<div class="bazi-customer-shell"'+([...values.name].length>32?' data-long-subject-name="true"':'')+'><aside class="bazi-mobile-subject" aria-label="报告主体 / Report subject"><dl>'+Object.entries(values).map(([k,v])=>'<div><dt>'+labels[k]+'</dt><dd data-mobile-subject-field="'+k+'">'+esc(v)+'</dd></div>').join('')+'</dl></aside>'+renderPublicationReport(snapshot)+'</div>';
}
export function renderBaziBlockedCandidate(candidate){
 if(candidate?.state!=='BLOCKED_ACCEPTED_COPY_COVERAGE'||candidate?.snapshot?.report!==null)throw Error('BAZI_BLOCKED_FACTUAL_CANDIDATE_REQUIRED');
 const fields=formatReportCoverFields({methodId:'BZR',subject:candidate.presentation});
 const structures=candidate.authority.projection.calculation.structures;
 return '<section class="bazi-factual-candidate"><h1>八字报告候选 / BaZi report candidate</h1><p>计算已完成；当前主体缺少已批准的完整双语正文，因此尚未生成或发布报告。<br>Calculation is complete. Approved complete bilingual copy is unavailable for this subject; no report has been generated or released.</p><dl>'+Object.entries(fields).map(([k,v])=>'<dt>'+({name:'姓名 / Name',birthDate:'出生日期 / Birth date',birthTime:'出生时间 / Birth time'})[k]+'</dt><dd>'+esc(v)+'</dd>').join('')+'</dl><h2>原生计算记录 / Native calculation records</h2><pre>'+esc(JSON.stringify(structures,null,2))+'</pre><p>未选择当前大运或流年情境。计算记录不等于个人生活结论。<br>No current luck-cycle or annual context is selected. Calculation records are not personal life conclusions.</p><p>下载尚不可用 / Download unavailable</p></section>';
}
