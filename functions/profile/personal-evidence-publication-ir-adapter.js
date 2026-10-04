import {buildReportPublicationIrV2} from '../personal-reading/narrative/report-publication-ir-v2.js';

// IR V2 transports source-bound dynamic blocks; CPR owns full static pages.
export async function buildPersonalEvidencePublicationIr({profileView,report,publicationProjection}){
  if(report?.canonicalState!=='APPROVED_UNRELEASED' && report?.canonicalState!=='RELEASED')throw new Error('PERSONAL_EVIDENCE_CANONICAL_REPORT_REQUIRED');
  if(report.customer!==profileView.participantRef || publicationProjection.sourceProfileViewRef!==profileView.profileViewId)throw new Error('PERSONAL_EVIDENCE_IR_SUBJECT_MISMATCH');
  const sectionKey='PERSONAL_EVIDENCE';
  const claims=profileView.signalCards.map((card,i)=>({claimId:`SOURCE-${i+1}`,sourceRefs:[card.signalRef],semanticOperators:['CUSTOMER_SUPPLIED'],certainty:'UNRESOLVED',claimType:'EVIDENCE',text:JSON.stringify(card)}));
  const brief={sectionKey,methodId:'PERSONAL_EVIDENCE',claims,sourceAuthorityVersion:'PROFILE_PPR',briefSemanticDigest:profileView.semanticDigest,sourceSemanticDigest:profileView.semanticDigest};
  return buildReportPublicationIrV2({methodId:'PERSONAL_EVIDENCE',reportVersion:report.reportVersion,sectionKey,locale:report.locale,brief,
    candidate:{blocks:claims.map(c=>({role:'SOURCE_EVIDENCE',text:c.text,claimRefs:[c.claimId]}))},semanticOwner:'PROFILE_PPR',compositionOwner:'PersonalEvidenceDossierProjection',
    snapshotLineage:{participantRef:profileView.participantRef,profileViewRef:profileView.profileViewId,reportReference:report.reportReference,assemblyDigest:report.assemblyDigest,sourceSemanticDigest:profileView.semanticDigest}});
}
