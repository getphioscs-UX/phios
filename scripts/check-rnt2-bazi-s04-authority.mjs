import fs from 'node:fs';
import {buildBaZiNarrativeClaimIR} from '../functions/personal-reading/narrative/bazi-explanatory-authority.js';
import {createReportSectionNarrativeContract} from '../functions/personal-reading/narrative/report-section-contract.js';
import {buildReportSectionNarrativeBrief} from '../functions/personal-reading/narrative/report-section-brief.js';

const out='docs/acceptance/report-narrative-t2-r1/bazi';
fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const rows={schemaVersion:'PHI-OS-RNT2-BZR-METHOD-COVERAGE-v1.0.0',section:'S04_CAREER',locales:{},status:'PASS'};
for(const locale of ['zh-Hans','en']){
 const ir=await buildBaZiNarrativeClaimIR({reading:source.reading,sectionKey:'S04_CAREER',locale,temporalSnapshot:source.temporalSnapshot});
 const contract=createReportSectionNarrativeContract({methodId:'BZR',sectionKey:'S04_CAREER',customerQuestion:'CAREER',customerOutcome:'CAREER',requiredClaimRoles:['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'],timingPolicy:'WHEN_AUTHORITY_PRESENT'});
 const brief=await buildReportSectionNarrativeBrief({contract,richClaimIr:ir,locale,sourceAuthorityVersion:ir.version});
 const byRole=Object.fromEntries([...new Set(brief.claims.map(c=>c.role))].map(role=>[role,brief.claims.filter(c=>c.role===role).map(c=>c.claimId)]));
 const missing=contract.requiredClaimRoles.filter(role=>!(byRole[role]?.length));
 const sourceModules=[...new Set(ir.claims.flatMap(c=>c.sourceRefs||[]).map(ref=>ref.split('/').slice(0,2).join('/')))];
 rows.locales[locale]={claimCount:ir.claims.length,briefClaimCount:brief.claims.length,roles:byRole,missingRoles:missing,semanticOperators:[...new Set(brief.claims.flatMap(c=>c.semanticOperators||[]))],sourceModules,timingClaimIds:brief.claims.filter(c=>c.role==='TIMING_RELEVANCE').map(c=>c.claimId),observableClaimIds:brief.claims.filter(c=>c.role==='OBSERVABLE_EXPRESSION').map(c=>c.claimId),sourceDigest:brief.sourceSemanticDigest,briefDigest:brief.briefSemanticDigest};
 if(missing.length)rows.status='FAIL';
}
fs.writeFileSync(out+'/BZR-S04-RICH-CLAIM-IR-AUDIT.json',JSON.stringify(rows,null,2)+'\n');
const coverage={schemaVersion:'PHI-OS-RNT2-BZR-METHOD-COVERAGE-MATRIX-v1.0.0',section:'S04_CAREER',requiredPipeline:['runtime','semanticExtraction','richClaimIr','sectionBrief','t2Composer','semanticVerifier','render'],current:{runtime:'EXISTS',semanticExtraction:'PASS',richClaimIr:rows.status,sectionBrief:rows.status,t2Composer:'IMPLEMENTED_PROVIDER_RUN_DEPENDS_ON_SECRET',semanticVerifier:'IMPLEMENTED',render:'REVIEW_ARTIFACT_IMPLEMENTED'},providerRun:'SEE_S04_MACHINE_EVIDENCE'};
fs.writeFileSync(out+'/BZR-METHOD-COVERAGE.json',JSON.stringify(coverage,null,2)+'\n');
console.log(JSON.stringify({status:rows.status,zh:rows.locales['zh-Hans'].missingRoles,en:rows.locales.en.missingRoles},null,2));
if(rows.status!=='PASS')process.exitCode=1;
