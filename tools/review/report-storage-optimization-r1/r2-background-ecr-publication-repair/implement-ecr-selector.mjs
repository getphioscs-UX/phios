import fs from'node:fs';const p='scripts/lib/ecr-author-case-store.mjs';const old=fs.readFileSync(p);fs.writeFileSync('tools/review/report-storage-optimization-r1/r2-background-ecr-publication-repair/ECR-STORE-BEFORE.sha256', (await import('node:crypto')).createHash('sha256').update(old).digest('hex')+'\n');
fs.writeFileSync(p,old.toString('utf8')+`
// R2 full-bleed/ECR repair: explicit read-only author-case selector. The old
// six-page synthetic renderer remains a benchmark, never a formal fallback.
export function selectAcceptedEcrAuthorReportSource({privateDirectory,requestedLocale='bilingual',requestedCalculationRef,purpose,sampleKind='ACCEPTED_AUTHOR_CASE'}={}){
 if(purpose!=='LOCAL_AUTHOR_REPORT')throw Error('ECR_CUSTOMER_PUBLICATION_REQUIRES_SEPARATE_ADMISSION');
 if(sampleKind!=='ACCEPTED_AUTHOR_CASE')throw Error('ECR_SYNTHETIC_OR_UNKNOWN_SOURCE_DENIED');
 if(!['zh-Hans','en','bilingual'].includes(requestedLocale))throw Error('ECR_SOURCE_LANGUAGE_INVALID');
 const root=requirePrivateAuthorDirectory(privateDirectory),indexFile=path.join(root,'CURRENT-EFFECTIVE-CHAPTERS.json'),index=JSON.parse(fs.readFileSync(indexFile));
 if(!Array.isArray(index.versions)||index.versions.length!==20)throw Error('ECR_TWENTY_ACCEPTED_BODIES_REQUIRED');
 const manuscripts=[],seen=new Set();
 for(const v of index.versions){
  const folder=path.resolve(v.folder),rel=path.relative(root,folder);if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('ECR_SOURCE_FOLDER_OUTSIDE_OWNER');
  const record=JSON.parse(fs.readFileSync(path.join(folder,'accepted-version.json'))),text=fs.readFileSync(path.join(folder,'exact-text.txt'),'utf8'),receipt=JSON.parse(fs.readFileSync(path.join(folder,'author-decisions',safeId(v.acceptanceReceiptId)+'.json'))),review=inspectAuthorCaseManuscript(record,text),id=v.sectionId+':'+v.locale;
  if(seen.has(id))throw Error('ECR_DUPLICATE_ACCEPTED_BODY');seen.add(id);
  if(!review.valid||!review.authorTextAccepted||record.authorState!=='AUTHOR_ACCEPTED_TEXT'||exactTextDigest(text)!==v.exactTextSha256||receipt.decision!=='ACCEPT'||receipt.exactTextDigest!==v.exactTextSha256||receipt.sectionId!==v.sectionId||receipt.language!==v.locale||receipt.manuscriptVersion!==v.version)throw Error('ECR_EXACT_AUTHOR_ACCEPTANCE_OR_HASH_REQUIRED');
  if(requestedCalculationRef&&record.calculationRef!==requestedCalculationRef)throw Error('ECR_AUTHOR_SUBJECT_CALCULATION_MISMATCH');
  manuscripts.push({...v,text,authorState:record.authorState,shaVerified:true,explicitFounderEvidence:receipt.evidenceRef,rightsStatus:record.rightsStatus,publicationStatus:record.publicationStatus,calculationRef:record.calculationRef});
 }
 for(let n=1;n<=10;n++)for(const lang of ['zh-Hans','en'])if(!seen.has(String(n).padStart(2,'0')+':'+lang))throw Error('ECR_REQUIRED_LANGUAGE_BODY_MISSING');
 if(new Set(manuscripts.map(m=>m.calculationRef)).size!==1)throw Error('ECR_MIXED_AUTHOR_SUBJECTS_DENIED');
 return {sourceKind:'ACCEPTED_AUTHOR_CASE',purpose,requestedLocale,manuscripts,calculationRef:manuscripts[0].calculationRef,sourceIndex:indexFile,sourceIndexSHA256:exactTextDigest(fs.readFileSync(indexFile,'utf8')),customerPublishable:false,reusableSemanticAccepted:false,productionAuthorized:false};
}
`);console.log('Existing private author owner extended with an explicit read-only accepted-case selector; no admission or source mutation');
