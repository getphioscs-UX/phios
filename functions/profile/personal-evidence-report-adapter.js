// Consumer adapter only: lifecycle and digests are supplied by the existing RR v2.
export function projectPersonalEvidenceRrRegistry(baseRegistry, extension) {
  if (extension?.sourceRegistryMutated !== false || extension?.authority !== 'PROFILE_PPR') throw new Error('PERSONAL_EVIDENCE_RR_EXTENSION_REQUIRED');
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
  const assembly = rr.assembleReport({reportCode:'PERSONAL_EVIDENCE_DOSSIER', case:caseReference, customer:customerReference,
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
