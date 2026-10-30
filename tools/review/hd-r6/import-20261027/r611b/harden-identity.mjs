import fs from'node:fs';
const p='functions/canonical-presentation-runtime/private-pdf-renderer.js';let s=fs.readFileSync(p,'utf8');
const anchor=' const reviewOnly=projection.reviewOnly===true;';if(s.split(anchor).length!==2)throw Error('PDF_OWNER_EDIT_CONFLICT');
s=s.replace(anchor,anchor+`
 if(reviewOnly&&onSectionOpener){
  const ref=projection.reportReference;
  if(!projection.methodId||!ref?.reportId||!ref.reportVersion||!projection.locale)throw Error('P06_NATIVE_REPORT_IDENTITY_REQUIRED');
  pdf.catalog.set(PDFName.of('PHIOSContentsIdentity'),pdf.context.obj({MethodId:PDFHexString.fromText(projection.methodId),ReportId:PDFHexString.fromText(ref.reportId),Version:PDFHexString.fromText(ref.reportVersion),ContentLanguage:PDFHexString.fromText(projection.locale)}));
 }
`);
const before=' const pages=pdf.getPages(),page=pages[5];';if(s.split(before).length!==2)throw Error('PDF_OWNER_EDIT_CONFLICT');
s=s.replace(before,` const identity=pdf.catalog.lookup(PDFName.of('PHIOSContentsIdentity'));
 if(!identity||[['MethodId',plan.methodId],['ReportId',plan.reportId],['Version',plan.version],['ContentLanguage',plan.contentLanguage]].some(([key,value])=>identity.get(PDFName.of(key))?.decodeText?.()!==value))throw Error('P06_REPORT_IDENTITY_DRIFT');
`+before);fs.writeFileSync(p,s);
const q='tools/review/hd-r6/import-20261027/r611b/check.mjs';s=fs.readFileSync(q,'utf8');s=s.replace("surface:'PDF',renderState:'ready_for_render',locale:'en',reviewOnly:true,reviewLatinOnly:true,reportReference:{reportVersion:'R611B-MECHANICS-NOT-CUSTOMER'}","surface:'PDF',renderState:'ready_for_render',methodId,locale:'en',reviewOnly:true,reviewLatinOnly:true,reportReference:{reportId:'QA-'+methodId,reportVersion:'SYNTHETIC'}");fs.writeFileSync(q,s);
