// Fail closed until an approved empty-slot source and slot map are provided. No replacement poster.
export const FIXED_ASSET_POLICY=Object.freeze({mode:'EXACT_R2_IMAGE_WITH_ALLOWED_OVERLAYS',p03:'FROZEN_APPROVED',nativeR4:'HISTORICAL_ONLY',p21:'BLOCKED_APPROVED_EMPTY_SLOT_SOURCE_REQUIRED'});
export function assertApprovedMethodAsset(){throw Error('P21_APPROVED_EMPTY_SLOT_SOURCE_REQUIRED');}
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function fitFinancialOverlay(root){
 const overflow=e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1;
 for(const n of root.querySelectorAll('.cover-name')){let fits=false;for(let size=16;size>=12;size-=.5){n.style.fontSize=size+'px';if(!overflow(n)&&!overflow(n.parentElement)){fits=true;break;}}if(!fits)throw Error('FINANCIAL_COVER_SAFE_ZONE_EXCEEDED');}
 for(const n of root.querySelectorAll('.cover-secondary,.catalog-status,.status-zh,.status-en,.appendix-display-en'))if(overflow(n))throw Error('FINANCIAL_OVERLAY_TEXT_OVERFLOW');
 return true;
}
export const financialOverlayFitScript='('+fitFinancialOverlay.toString()+')(document);';
export const APPENDIX_ENGLISH_DISPLAY_ALIASES=Object.freeze({A01:'Loan & Repayment',A02:'Rental Cash Flow',A04:'Bank & Maturity',A07:'Income & Spending',A11:'Estate Preparation',A12:'Goals & Scenarios'});
export function appendixPageNumberOverlay({page,totalPages}){
 if(!Number.isSafeInteger(page)||!Number.isSafeInteger(totalPages)||page<1||page>totalPages)throw Error('P22_PAGE_NUMBER_INVALID');
 return '<span class="appendix-page-number" data-page-number="'+page+'" style="position:absolute;right:3%;top:1.4%;width:8%;height:2.6%;background:#faf7eb;text-align:right;color:#a88742;font:18px/1.4 Georgia">P'+String(page).padStart(2,'0')+'</span>';
}
export function appendixEnglishDisplayOverlay(){
 const top=[658,743,829,915,1003,1091];
 return Object.entries(APPENDIX_ENGLISH_DISPLAY_ALIASES).map(([id,title])=>{const i=Number(id.slice(1))-1,row=i%6,col=i>=6?1:0;return '<span class="appendix-display-en" data-category-alias="'+id+'" style="position:absolute;left:'+(col?64.8:17.8)+'%;top:'+(top[row]/1492*100)+'%;width:15.2%;height:'+(36/1492*100)+'%;background:#faf7ed;display:flex;align-items:flex-start;white-space:nowrap;font:10px/1.45 PHIOSReport,serif;color:#173e50;overflow:hidden">'+title+'</span>';}).join('');
}
export const FINANCIAL_OVERLAY_SCHEMA=Object.freeze({version:'FIN-OVERLAY-R1',p01:{width:1055,height:1491,left:23,top:82.05,widthPercent:54,heightPercent:4.1},p22:{width:1054,height:1492,statusLeft:[36.9,84],statusTop:42.45,rowStep:5.65,statusWidth:11.2,statusHeight:3.5,tickLeft:[33.25,80.3],tickTop:43.4}});
export const financialOverlayCss=`@font-face{font-family:PHIOSReport;src:url('/assets/fonts/private-report/NotoSansSC-Regular.ttf')} .cover-fields{position:absolute;left:23%;top:82.05%;width:54%;height:4.1%;color:#173e50;text-align:center;font-family:PHIOSReport,'Microsoft YaHei',sans-serif;display:flex;flex-direction:column;justify-content:center;gap:1px;overflow:hidden}.cover-name{font-size:16px;line-height:1.3;font-weight:600;overflow-wrap:anywhere;white-space:pre-line}.cover-secondary{font-size:10.5px;line-height:1.3;white-space:nowrap;color:#173e50;font-weight:500}.catalog-status{position:absolute;width:11.2%;height:3.5%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px;overflow:hidden;text-align:center;background:transparent;border:0;border-radius:0;font-family:PHIOSReport,'Microsoft YaHei',sans-serif;line-height:1.25;color:#264c54}.catalog-status .status-zh,.catalog-status .status-en{display:block;flex:none;white-space:nowrap;font-size:10px;line-height:1.25;font-weight:400;margin:0}.catalog-tick{position:absolute;width:2.3%;height:1.8%;font:18px/1 sans-serif;text-align:center;color:#175e62}`;
export function coverFields({name,generatedAt,publicReportNumber,synthetic=false,issued=false,dateStyle='ISO'}){
 if([name,generatedAt,publicReportNumber].some(v=>typeof v!=='string'||!v.trim()))throw Error('COVER_REQUIRED_ISSUANCE_FIELDS');
 if(!/^\d{4}-\d{2}-\d{2}T/.test(generatedAt)||!Number.isFinite(Date.parse(generatedAt)))throw Error('COVER_GENERATED_DATE_REQUIRED');
 if(!synthetic&&!issued)throw Error('COVER_FORMAL_ISSUANCE_REQUIRED');
 if(!/^PHI-(?:QA-)?FIN-\d{4}-\d{6,12}$/.test(publicReportNumber)||synthetic!==publicReportNumber.startsWith('PHI-QA-'))throw Error('COVER_PUBLIC_REFERENCE_REQUIRED_NOT_TECHNICAL_HASH');
 if(!['ISO','LONG'].includes(dateStyle))throw Error('COVER_DATE_STYLE_INVALID');
 const date=dateStyle==='LONG'?new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeZone:'UTC'}).format(new Date(generatedAt)):generatedAt.slice(0,10);
 return '<div class="cover-fields" data-cover-schema="FIN-OVERLAY-R1"><div class="cover-name">'+esc(name)+'</div><div class="cover-secondary">生成 / Generated '+esc(date)+' · '+(synthetic?'测试 / Test ref. ':'编号 / Report No. ')+esc(publicReportNumber)+'</div></div>';
}
const statusCopy={INCLUDED:['已收录','Included'],MORE_INFO_NEEDED:['资料待补','Data needed'],DATA_NEEDED:['资料待补','Data needed'],NOT_SELECTED:['本次未收录','Not included'],NOT_INCLUDED:['本次未收录','Not included'],NOT_APPLICABLE:['不适用','Not applicable']};
export function appendixStatusOverlay(catalog,{totalPages}={}){
 if(catalog.length!==12||catalog.some((r,i)=>r.id!=='A'+String(i+1).padStart(2,'0')))throw Error('P22_EXACT_12_ORDER_REQUIRED');
 const s=FINANCIAL_OVERLAY_SCHEMA.p22;
 return catalog.map((r,i)=>{const copy=statusCopy[r.status];if(!copy)throw Error('P22_STATUS_UNKNOWN');const included=r.status==='INCLUDED';if(r.included!==included)throw Error('P22_MANIFEST_STATE_MISMATCH');if(included&&(!Number.isSafeInteger(r.start)||!Number.isSafeInteger(r.end)||r.start<23||r.end<r.start||r.end>totalPages))throw Error('P22_MANIFEST_RANGE_INVALID');const range=included?String(r.start)+(r.end!==r.start?'–'+r.end:''):'';const col=i>=6?1:0,row=i%6;
 return (included?'<span class="catalog-tick" aria-label="Included" style="left:'+s.tickLeft[col]+'%;top:'+(s.tickTop+row*s.rowStep)+'%">✓</span>':'')+'<div class="catalog-status" data-category="'+r.id+'" data-status="'+r.status+'" style="left:'+s.statusLeft[col]+'%;top:'+(s.statusTop+row*s.rowStep)+'%"><span class="status-zh">'+copy[0]+'</span><span class="status-en">'+(included?'<a href="#page-'+r.start+'" style="color:inherit;text-decoration:none">'+copy[1]+' · '+range+'</a>':copy[1])+'</span></div>';
 }).join('');
}
