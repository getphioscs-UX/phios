import {T3_SECTIONS,COMPOSITION_VERSION,VERIFIER_VERSION,EDITORIAL_VERSION} from './bazi-editorial-contract.js';

// Acceptance records are supplied by the trusted release owner, never a request
// body. Missing evidence always leaves customer traffic on the previous release.
export function evaluateBaziT3Release(e={}){
 const remaining=[];
 if(e.explanatoryAuthorityVersion!=='BAZI_EXPLANATORY_AUTHORITY_V1')remaining.push('LICENSED_EXPLANATORY_AUTHORITY_VERSION');
 for(const key of ['liveProvider','semantic','editorial','frozenSnapshots','fallback','nowPreserved','bilingualParity','browserPdf','shadowMatrix'])if(e[key]?.status!=='PASS'||!e[key]?.artifactDigest||!/^[a-f0-9]{64}$/.test(e[key].artifactDigest))remaining.push(key);
 if(e.liveProvider?.evidenceClass!=='REAL_PROVIDER_RESPONSE')remaining.push('REAL_PROVIDER_PROVENANCE');
 if(e.shadowMatrix?.profiles!==12||e.shadowMatrix?.completedChecks!==216||e.shadowMatrix?.unresolvedFailures!==0)remaining.push('COMPLETE_SHADOW_MATRIX');
 if(e.browserPdf?.locales?.length!==2||!['en','zh-Hans'].every(l=>e.browserPdf.locales.includes(l))||e.browserPdf?.viewports?.length!==2||![1440,390].every(w=>e.browserPdf.viewports.includes(w)))remaining.push('BILINGUAL_RESPONSIVE_PDF_EVIDENCE');
 if(e.compositionVersion!==COMPOSITION_VERSION||e.verifierVersion!==VERIFIER_VERSION||e.editorialVersion!==EDITORIAL_VERSION)remaining.push('VERSION_BOUND_EVIDENCE');
 for(const locale of ['en','zh-Hans'])for(const sectionKey of T3_SECTIONS){
  const a=e.humanReviews?.find(r=>r.locale===locale&&r.sectionKey===sectionKey);
  if(a?.decision!=='ACCEPT'||!a.reviewer||!a.reviewedAt||!/^[a-f0-9]{64}$/.test(a.snapshotDigest||'')||e.snapshotDigests?.[`${locale}:${sectionKey}`]!==a.snapshotDigest)remaining.push(`HUMAN:${locale}:${sectionKey}`);
 }
 return {accepted:!remaining.length,remaining};
}
