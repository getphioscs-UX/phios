const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const OWNERS=Object.freeze({AST:'AST_R1R5_R21_FULL_PUBLICATION',HD:'HD_R611_FULL17_PUBLICATION'});
// A full paid handoff must come from the existing method's full publisher.
// A native workspace/reading extract, QA PDF, page count or filename cannot
// establish this identity. This gate does not issue publication approval.
export function requireFullPublicationOwnerR32(method,source,job){
 if(!OWNERS[method])fail('FULL_PUBLICATION_METHOD_REQUIRED');
 if(source?.scope==='EXISTING_NATIVE_CUSTOMER_PROSE_REVIEW_ONLY_NOT_NEW_AI'||source?.classification==='PARTIAL_NATIVE_READING_REVIEW'||source?.composerFixture===true||source?.scope==='LOCAL_NATIVE_COMPOSER_FIXTURE_NOT_CUSTOMER_PUBLICATION')fail(method+'_PARTIAL_READING_IS_NOT_FULL_PUBLICATION');
 const p=source?.fullPublicationOwner;
 if(p?.ownerId!==OWNERS[method])fail(method+'_FULL_PUBLICATION_OWNER_HANDOFF_REQUIRED');
 for(const k of ['blueprintSHA256','visualManifestSHA256','manuscriptDigest','nativeCalculationDigest'])if(!/^[a-f0-9]{64}$/.test(p[k]||''))fail(method+'_FULL_PUBLICATION_PROVENANCE_REQUIRED');
 for(const k of ['ownerAccountId','personId','personVersion','methodCode','productId','inputDigest','authorityDigest'])if(p.binding?.[k]!==job[k])fail(method+'_FULL_PUBLICATION_SUBJECT_BINDING_MISMATCH');
 const expected=Array.from({length:method==='AST'?10:17},(_,i)=>method==='AST'?'SEC-'+String(i+1).padStart(2,'0'):'SEC'+String(i+1).padStart(2,'0'));
 if(JSON.stringify(p.sectionIds)!==JSON.stringify(expected)||JSON.stringify(source.sections?.map(s=>s.sectionId))!==JSON.stringify(expected))fail(method+'_FULL_PUBLICATION_CHAPTER_BINDING_REQUIRED');
 if(p.manuscriptDigest!==source.contentDigest)fail(method+'_FULL_PUBLICATION_MANUSCRIPT_MISMATCH');
 if(method==='AST'){
  const figures=['AST-D01','AST-D02','AST-D04','AST-D05','AST-D06','AST-D07','AST-D08','AST-D09','AST-D10','AST-D11','AST-D12','AST-D14','AST-D15'];
  if(JSON.stringify(p.figureIds)!==JSON.stringify(figures))fail('AST_FULL_PUBLICATION_FROZEN_FIGURES_REQUIRED');
 }
 if(method==='HD'&&(!p.chartSourceUseEvidenceRef||!p.chartPrecisionReviewRef||!Array.isArray(p.paragraphSelectionLedger)||!p.paragraphSelectionLedger.length||p.paragraphSelectionLedger.some(r=>r.requiredFactsVerified!==true||!r.sourceParagraphSHA256?.match(/^[a-f0-9]{64}$/))))fail('HD_FULL17_EXACT_SOURCE_AND_PARAGRAPH_BINDING_REQUIRED');
 return {ownerId:p.ownerId,customerPublicationAllowed:false,commercialAdmission:false};
}
