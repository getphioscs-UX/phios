export function inspectUse(item,use){
 const provenance=JSON.stringify({source:item.source,sourceRefs:item.sourceRefs,sourceTitle:item.sourceTitle,authors:item.authors,origin:item.origin});
 const book=/book\s+of\s+destinies|book[_-]of[_-]destinies|chetan\s+parkyn.*carola\s+eastwood/i.test(provenance);
 if(book&&use!=='HISTORICAL_PRIVATE_PROVENANCE')return {allowed:false,reason:'OWNER_BOOK_OF_DESTINIES_COMMERCIAL_EXCLUSION'};
 if(/DREAMRAVE|COGNITION-4|INNER VISION/i.test(provenance)&&use!=='HISTORICAL_PRIVATE_PROVENANCE')return {allowed:false,reason:'WITHDRAWN_SPECIALIST_INPUT'};
 if(use==='HISTORICAL_PRIVATE_PROVENANCE')return {allowed:true,reason:'AUDIT_ONLY_NOT_INTERPRETIVE_INPUT'};
 if(use==='OWNER_REVIEW')return {allowed:!book,reason:'PRIVATE_CANDIDATE_NOT_RELEASE'};
 if(item.rightsCleared!==true||item.semanticApproved!==true||item.publicationAllowed!==true)return {allowed:false,reason:'EXACT_PARAGRAPH_ADMISSION_REQUIRED'};
 return {allowed:true,reason:'SCOPED_DOCUMENTED_ADMISSION_REQUIRED_AT_EXISTING_RELEASE_OWNER'};
}
