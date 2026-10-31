// Reading adapter over the existing W8-I API projection; no derivation or authority promotion.
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function acceptedCurrentView(projection,id){
 if(!projection||projection.schemaVersion!=='BOOK6_ACCEPTED_CURRENT_CUSTOMER_PROJECTION_V1'||projection.dossierId!==id||projection.acceptance!=='HUMAN_ACCEPTED_SUBSYSTEM_POSITIONS_ONLY'||projection.wholeDossierPosition!=='UNKNOWN')return null;
 if(!Array.isArray(projection.acceptedPositions)||projection.acceptedPositions.some(p=>p.scope!=='SUBSYSTEM'||!p.evidenceRefs?.length||!p.grammarId||!p.realityDomainId))return null;
 return {id,wholeDossierPosition:'UNKNOWN',positions:projection.acceptedPositions,unknowns:projection.unknowns,conflicts:projection.conflicts,acceptedAt:projection.acceptedAt,sourceTimestamp:projection.sourceTimestamp,sourceVersion:projection.sourceVersion,readoutDigest:projection.readoutReference?.digest,currentness:projection.currentness,freshness:projection.currentFreshnessAssessment,sourceEvidence:projection.sourceEvidence||[],missingTimestampEvidence:projection.missingTimestampEvidence||[],externalProviderDisplay:projection.externalProviderDisplay};
}
export function compareAcceptedScopes(a,b){
 if(!a||!b)return {state:'NOT_COMPARABLE',reasons:['ACCEPTED_PROJECTION_UNAVAILABLE'],pairs:[]};
 const pairs=a.positions.flatMap(left=>b.positions.filter(right=>left.subsystem===right.subsystem&&left.scope===right.scope).map(right=>({subsystem:left.subsystem,left,right})));
 if(!pairs.length)return {state:'NOT_COMPARABLE',reasons:['NO_SHARED_ACCEPTED_SUBSYSTEM'],pairs};
 const matching=a.sourceTimestamp&&a.sourceTimestamp===b.sourceTimestamp&&a.missingTimestampEvidence.length===0&&b.missingTimestampEvidence.length===0&&a.freshness==='CURRENT'&&b.freshness==='CURRENT';
 return {state:matching?'COMPARABLE_SCOPE':'CONTEXT_ONLY',reasons:matching?['SAME_NAMED_SCOPE_NOT_A_STATISTICAL_OR_RANK_COMPARISON']:['SOURCE_PERIOD_OR_CURRENTNESS_NOT_ESTABLISHED_AS_EQUIVALENT'],pairs};
}
export function renderAcceptedCurrent(view,locale='en'){
 const zh=locale==='zh-Hans',t=(a,b)=>zh?a:b;if(!view)return '<p>'+t('当前接受投影不可读；不能据此判断没有变化。','The accepted projection is unavailable; this does not establish absence of change.')+'</p>';
 return '<section data-current-dossier="'+esc(view.id)+'"><h4>'+t('已接受的子系统位置','Accepted subsystem positions')+'</h4><p>'+t('整体位置仍为未知；以下不是国家评级或整体阶段。','The whole-dossier position remains unknown; these are not country ratings or an overall stage.')+'</p><ul>'+view.positions.map(p=>'<li><strong>'+esc(p.runtimePositionId)+'</strong> · '+esc(p.shortLabel?.[locale]||'')+'<details><summary>'+t('子系统与来源','Subsystem and sources')+'</summary><p>'+esc(p.subsystem)+' · '+esc(p.grammarId)+' / '+esc(p.realityDomainId)+'</p><p>'+esc(p.evidenceRefs.join(' · '))+'</p></details></li>').join('')+'</ul><p>'+t('接受日期：','Accepted: ')+esc(view.acceptedAt)+'</p><p>'+t('证据来源时间：','Source evidence time: ')+esc(view.sourceTimestamp||t('未确立','Not established'))+'</p><p>'+t('当前时效尚未独立验证；服务响应时间不是证据日期。','Present freshness is not independently verified; response time is not the evidence date.')+'</p><details><summary>'+t('版本、未知范围及未解决事项','Version, unknown scope and unresolved claims')+'</summary><p>'+esc(view.sourceVersion)+' · '+esc(view.readoutDigest)+'</p><pre>'+esc(JSON.stringify({unknowns:view.unknowns,conflicts:view.conflicts,missingTimestampEvidence:view.missingTimestampEvidence,currentness:view.currentness,freshness:view.freshness},null,2))+'</pre></details></section>';
}

// Version-bound display decisions; canonical source fields remain untouched.
export async function applyAuthorDisplay(registry,sourceWindows,overlay){
 if(overlay?.schemaVersion!=='RUNTIME_POSITION_AUTHOR_DISPLAY_R1'||!overlay.acceptance?.authorApproved)throw Error('AUTHOR_DISPLAY_IDENTITY');
 for(const [path,value] of [['content/registry/runtime-position-48-v1.json',registry],['content/registry/runtime-position-48-source-windows-v1.json',sourceWindows]]){
  const bytes=new TextEncoder().encode(JSON.stringify(value)),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!==overlay.sources?.[path]?.jsonSha256)throw Error('AUTHOR_DISPLAY_SOURCE_VERSION_MISMATCH');
 }
 const g=overlay.decisions.g8,r=overlay.decisions.rp30;
 if(g.canonicalArc!=='INTERNALIZATION'||g.figureSegment!=='ACTIVATION'||g.figureSpan!=='G5–G8'||g.positionIds.join(',')!=='RP-08,RP-24,RP-40'||r.positionId!=='RP-30'||r.literal!=='4253–3742 BC'||r.display!=='4153–3742 BC')throw Error('AUTHOR_DISPLAY_DECISION_MISMATCH');
 if(sourceWindows.positions.find(x=>x.positionId===r.positionId)?.sourceWindowLabel!==r.literal)throw Error('AUTHOR_DISPLAY_LITERAL_MISMATCH');
 return {version:overlay.version,g8:g,rp30:r};
}
export const sourceWindowDisplay=w=>w?.authorDisplay?.label||w?.sourceWindowLabel||'';
export function authorDisplayDetails(selected,locale='en'){
 const zh=locale==='zh-Hans',a=selected?.authorArc,d=selected?.sourceWindow?.authorDisplay;
 return (a?'<p data-arc-author-decision>'+esc(a.explanation[locale])+'</p>':'')+(d?'<details data-window-author-decision open><summary>'+esc(zh?'作者接受的展示勘误':'Author-accepted display erratum')+'</summary><p>'+esc(zh?'原稿逐字记录：':'Literal source: ')+esc(d.literal)+'</p><p>'+esc(zh?'展示日期：':'Display window: ')+esc(d.label)+'</p><p>'+esc(zh?'依据 FIG 13H 及相邻 Phase 29 / 31；仅用于展示，不改写原稿或推导规则。':'Based on FIG 13H and adjacent Phases 29 / 31; display only, without changing the manuscript or derivation rules.')+'</p><small>'+esc(d.version)+'</small></details>':'');
}
