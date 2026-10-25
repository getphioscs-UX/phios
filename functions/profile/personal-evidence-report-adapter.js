export const EXPERIENCE_DOSSIER_CAPABILITY_LABELS={PROCESS_IMPROVEMENT:'流程改善 / Process improvement',DATA_ORGANIZATION:'数据整理 / Data organization',COORDINATION:'协作协调 / Coordination',PROJECT_EXECUTION:'项目执行 / Project execution',COMMUNICATION:'沟通 / Communication',LEARNING:'学习适应 / Learning adaptability',ANALYTICAL_REASONING:'分析推理 / Analytical reasoning',OPERATIONAL_CONTROL:'运营管理 / Operational control',FINANCIAL_AWARENESS:'财务意识 / Financial awareness',SYSTEM_IMPLEMENTATION:'系统实施 / System implementation',PROBLEM_SOLVING:'问题解决 / Problem solving',LEADERSHIP_MANAGEMENT:'领导与管理 / Leadership and management'};
// Consumer adapter only: lifecycle and digests are supplied by the existing RR v2.
import * as experienceRr from '../../scripts/lib/customer-report-runtime/report-runtime-v2.mjs';
import experienceRegistry from '../../content/runtime/customer-report-runtime/registries/canonical-report-section-registry-v2.json';
import experienceExtension from '../../content/profile/successors/personal-evidence-r1/contracts/personal-evidence-rr-consumer-extension-v1.json';

// Evidence-only compatible consumer; no fabricated assessment or fixed sixteen-page engine.
export function assembleExperienceDossier({records,ownerId,reportId,now,assessments=[]}){
 if((!records.length&&!assessments.length)||records.some(x=>x.ownerId!==ownerId||x.revocationStatus!=='ACTIVE'))throw Error('EXPERIENCE_REPORT_OWNER_REQUIRED');
 const ref=(x,kind)=>({reference:`${x.recordId}#v${x.version}`,kind:'EXTERNAL',externalKind:kind,authority:'PROFILE_PPR',state:'VALID',availability:'AVAILABLE'});
 if(assessments.some(a=>a.customerId!==ownerId))throw Error('ASSESSMENT_REPORT_OWNER_REQUIRED');
 const sources=[...records,...assessments.map(a=>({recordId:a.objectId,version:1}))];
 const sections=[['EVIDENCE','PERSONAL_EVIDENCE_SOURCE_REFERENCE'],['UNKNOWN','PERSONAL_EVIDENCE_UNKNOWN_REFERENCE'],['BOUNDARY','PERSONAL_EVIDENCE_BOUNDARY_REFERENCE']].map(([sectionCode,kind])=>({sectionCode,sourceReferences:sources.map(x=>ref(x,kind))}));
 const assembly=experienceRr.assembleReport({reportCode:reportId,case:reportId,customer:ownerId,locale:'en',assembledAt:now,consentReferences:[`${reportId}#explicit-request`],sections,serviceContract:{reference:experienceExtension.contractCode,requiredSectionTypes:['EVIDENCE','UNKNOWN','BOUNDARY'],optionalSectionTypes:[],professionalReviewRequired:false,signatureRequired:false,requiresConsent:true,allowedLocales:['en','zh-Hans'],allowedChannels:['HTML','PDF','WORKSPACE']}},projectPersonalEvidenceRrRegistry(experienceRegistry,experienceExtension));
 const candidate=experienceRr.createReportCandidate(assembly,{createdAt:now});
 const review=experienceRr.reviewReportCandidate(assembly,candidate,{reviewReference:reportId+'#review',reviewedAt:now});
 const approval=experienceRr.approveReportCandidate(assembly,candidate,review,{approvedAt:now});
 const canonical=experienceRr.buildCanonicalReport(assembly,candidate,review,approval);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={context:'情境 / Context',role:'角色 / Role',responsibility:'责任 / Responsibility',action:'行动 / Action',tools:'工具 / Tools',people:'协作 / Collaboration',outcome:'可观察结果 / Observable outcome',measurableResult:'自述量化结果 / Reported measured result',sourceReference:'来源 / Source',reflection:'自我反思 / Reflection',unknowns:'待核实 / Unverified',claim:'待检验判断 / Claim to examine'};

 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Personal Evidence Dossier</title><style>body{background:#102934;color:#f3eddf;font:17px/1.65 system-ui,sans-serif;margin:0}main{max-width:850px;margin:auto;padding:32px}h1,h2{color:#d5b778}section{break-inside:auto;border-top:1px solid #668179;padding:24px 0}dt{color:#d5b778}dd{margin:0 0 16px;overflow-wrap:anywhere}small{display:block} @media print{body{background:#f6f1e7;color:#112e38}h1,h2,dt{color:#234d50}@page{size:A4;margin:18mm}main{padding:0;font-size:13.5px;line-height:1.5}h1{font-size:27px}h2{font-size:21px}dd{margin-bottom:10px}section{padding:16px 0}h2,dt{break-after:avoid}p,dd{orphans:3;widows:3}}</style><main><h1>个人现实证据档案<br>Personal Evidence Dossier</h1><p>双语 · 真实经历补充档案 / Bilingual · Real experience dossier</p><p>此档案根据所选自述生成，不是能力认证、医疗诊断或职业资格。<br>This dossier organizes selected customer accounts, not certified competence, diagnosis or occupational qualification.</p><p>生成 / Generated: ${esc(now)}<br>版本 / Version: 1</p>${records.map(r=>`<section><h2>${esc(r.title)}</h2><p>事件期间 / Event period: ${esc(r.periodStart)} — ${esc(r.periodEnd||'未知 / Unknown')}<br>记录 / Recorded: ${esc(r.recordedAt)}<br>来源版本 / Source version: ${r.version}</p><p>用户提供，未独立核实。<br>Customer supplied; not independently verified.</p><dl>${Object.entries(labels).map(([k,l])=>`<dt>${l}</dt><dd>${esc(r[k]||'未提供 / Not supplied')}</dd>`).join('')}</dl><h3>候选能力 / Candidate capabilities</h3><p>${r.capabilities.length?esc(r.capabilities.map(k=>EXPERIENCE_DOSSIER_CAPABILITY_LABELS[k]).join('、')):'尚无选择 / None selected'}</p><p>由用户选择的待核实方向，不是系统认证。<br>User-selected areas to examine, not system certification.</p><p>下一步：确认负责范围、前后成果、资格与自愿提供的反馈。<br>Next: confirm responsibility, before/after outcomes, qualifications and voluntary feedback.</p><details><summary>来源定位 / Source reference</summary>${esc(r.recordId)} · ${r.version}</details></section>`).join('')}<section><h2>变化与边界 / History and boundaries</h2><p>仅显示实际记录的版本；未生成成长趋势。象征解释、财务账本及市场事实未自动加入。<br>Only recorded versions are represented; no growth trend is invented. Symbolic interpretations, financial ledgers and market facts are not automatically imported.</p><p>撤销可阻止新读取，无法远程收回已下载副本。<br>Revocation prevents new access, but cannot recall downloaded copies.</p></section></main></html>`;
 return {canonical,html,refs:records.map(r=>({id:r.recordId,version:r.version}))};
}
export function projectPersonalEvidenceRrRegistry(baseRegistry, extension) {
  if (extension?.sourceRegistryMutated !== false || extension?.authority !== 'PROFILE_PPR') throw new Error('PERSONAL_EVIDENCE_RR_EXTENSION_REQUIRED');
  const admitted={EVIDENCE:'PERSONAL_EVIDENCE_SOURCE_REFERENCE',UNKNOWN:'PERSONAL_EVIDENCE_UNKNOWN_REFERENCE',BOUNDARY:'PERSONAL_EVIDENCE_BOUNDARY_REFERENCE'};
  if(extension.contractCode!=='PHI-OS-RR-PERSONAL-EVIDENCE-CONSUMER-v1'||extension.sections?.length!==3||new Set(extension.sections.map(x=>x.sectionCode)).size!==3||extension.sections.some(x=>admitted[x.sectionCode]!==x.referenceKind))throw new Error('PERSONAL_EVIDENCE_RR_EXTENSION_NOT_ADMITTED');
  const registry = structuredClone(baseRegistry);
  for (const rule of extension.sections) {
    const section = registry.sections.find(x => x.sectionCode === rule.sectionCode);
    if (!section) throw new Error('PERSONAL_EVIDENCE_RR_SECTION_MISSING');
    section.acceptedAuthorities = [...new Set([...section.acceptedAuthorities, extension.authority])];
    section.acceptedExternalReferenceKinds = [...new Set([...section.acceptedExternalReferenceKinds, rule.referenceKind])];
  }
  return registry;
}

export function assemblePersonalEvidenceReport({profileView, publicationProjection, caseReference, customerReference, assembledAt, revision, rr, registry, extension}) {
  if (profileView?.schemaVersion !== 'PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1' || !profileView.profileViewId || !profileView.semanticDigest) throw new Error('PERSONAL_EVIDENCE_SOURCE_LINEAGE_REQUIRED');
  if (publicationProjection?.sourceProfileViewRef !== profileView.profileViewId || publicationProjection?.sourceSemanticDigest !== profileView.semanticDigest) throw new Error('PERSONAL_EVIDENCE_PUBLICATION_LINEAGE_MISMATCH');
  const ref = (reference, externalKind) => ({reference, kind:'EXTERNAL', externalKind, authority:'PROFILE_PPR', state:'VALID', availability:'AVAILABLE'});
  const refs = profileView.signalCards.map(x => ref(x.signalRef, 'PERSONAL_EVIDENCE_SOURCE_REFERENCE'));
  // Sparse dossiers carry the upstream view reference, never invented evidence.
  if (!refs.length) refs.push(ref(profileView.profileViewId, 'PERSONAL_EVIDENCE_SOURCE_REFERENCE'));
  const sections = [
    {sectionCode:'EVIDENCE', sourceReferences:refs},
    {sectionCode:'UNKNOWN', sourceReferences:[ref(profileView.profileViewId, 'PERSONAL_EVIDENCE_UNKNOWN_REFERENCE')]},
    {sectionCode:'BOUNDARY', sourceReferences:[ref(profileView.profileViewId, 'PERSONAL_EVIDENCE_BOUNDARY_REFERENCE')]}
  ];
  if(customerReference!==profileView.participantRef)throw new Error('PERSONAL_EVIDENCE_REPORT_SUBJECT_MISMATCH');
  const assembly = rr.assembleReport({reportCode:`PERSONAL_EVIDENCE_DOSSIER-${profileView.profileViewId}`, case:caseReference, customer:customerReference,
    locale:publicationProjection.locale, assembledAt, revision,
    consentReferences:publicationProjection.consentReferences, sections,
    serviceContract:{reference:extension.contractCode, requiredSectionTypes:['EVIDENCE','UNKNOWN','BOUNDARY'], optionalSectionTypes:[],
      professionalReviewRequired:false, signatureRequired:false, requiresConsent:true, allowedLocales:['en','zh-Hans'], allowedChannels:['HTML','PDF','WORKSPACE']}},
    projectPersonalEvidenceRrRegistry(registry, extension));
  const candidate = rr.createReportCandidate(assembly, {createdAt:assembledAt});
  const review = rr.reviewReportCandidate(assembly, candidate, {reviewReference:`${candidate.candidateReference}#review`, reviewedAt:assembledAt});
  const approval = rr.approveReportCandidate(assembly, candidate, review, {approvedAt:assembledAt});
  const report = rr.buildCanonicalReport(assembly, candidate, review, approval);
  return {assembly, candidate, review, report};
}
