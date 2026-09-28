import fs from 'node:fs';
import {buildBaZiNarrativeClaimIR} from '../functions/personal-reading/narrative/bazi-explanatory-authority.js';
import {createReportSectionNarrativeContract} from '../functions/personal-reading/narrative/report-section-contract.js';
import {buildReportSectionNarrativeBrief} from '../functions/personal-reading/narrative/report-section-brief.js';

const out='docs/acceptance/report-narrative-t2-r1/bazi';
fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const REQUIRED=['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'];
const SECTIONS=[
 ['S02_PERSONALITY','CAPABILITY'],
 ['S03_LIFE_STRUCTURE','LIFE_OPERATION'],
 ['S04_CAREER','CAREER'],
 ['S05_WEALTH','WEALTH'],
 ['S06_RELATIONSHIP','RELATIONSHIPS'],
 ['S07_HEALTH','PRESSURE'],
 ['S08_TIMING','TIMING'],
 ['S09_GUIDANCE','GUIDANCE']
];

const matrix={schemaVersion:'PHI-OS-RNT2-BZR-METHOD-COVERAGE-MATRIX-v1.1.0',methodId:'BZR',sections:{},status:'PASS'};
let s04Audit=null;

for(const [sectionKey,topic] of SECTIONS){
 const sectionRow={topic,locales:{},status:'PASS'};
 for(const locale of ['zh-Hans','en']){
  const ir=await buildBaZiNarrativeClaimIR({reading:source.reading,sectionKey,locale,temporalSnapshot:source.temporalSnapshot});
  const roleClaims={};
  for(const c of ir.claims||[]){
   const type=String(c.explanationRole||c.relationType||'').toUpperCase();
   const role=c.explanationRole||
    (['EMPHASIS','CO_OCCURRING_DIMENSIONS','ASSOCIATION','CONTEXT_MODIFIER'].includes(type)?'STRUCTURE':
     type==='LIFE_DOMAIN_EXPLANATION'?'MEANING':
     ['OPERATING_CONDITION','SUPPORT_CONDITION'].includes(type)?'CONDITIONS':
     ['TENSION','CONTRAST','OPEN_CONDITION','COUNTER_SIGNAL'].includes(type)?'COUNTERWEIGHTS':
     type==='TEMPORAL_RELEVANCE'?'TIMING_RELEVANCE':
     type==='CROSS_SECTION_RELEVANCE'?'NAVIGATION':null);
   if(role)(roleClaims[role]??=[]).push(c.id||c.claimId);
  }
  if((ir.reflectionQuestions||[]).length)(roleClaims.OBSERVABLE_EXPRESSION??=[]).push(...ir.reflectionQuestions.map(q=>q.id));
  const present=Object.keys(roleClaims);
  const missing=REQUIRED.filter(r=>!present.includes(r));
  const refs=[...new Set((ir.claims||[]).flatMap(c=>c.sourceRefs||[]))];
  const sourceModules=[...new Set(refs.map(ref=>ref.split('/').slice(0,2).join('/')))];
  sectionRow.locales[locale]={
   claimCount:(ir.claims||[]).length,
   reflectionQuestionCount:(ir.reflectionQuestions||[]).length,
   roleClaims,
   presentRoles:present,
   missingReferenceRoles:missing,
   sourceModules,
   sourceRefCount:refs.length,
   semanticOperators:[...new Set((ir.claims||[]).flatMap(c=>c.semanticOperators||[]))],
   authorityVersion:ir.version
  };
 }
 matrix.sections[sectionKey]=sectionRow;
}

// S04 is the RNT2 reference implementation and MUST support the full chain now.
const rows={schemaVersion:'PHI-OS-RNT2-BZR-S04-RICH-CLAIM-IR-AUDIT-v1.1.0',section:'S04_CAREER',locales:{},status:'PASS'};
for(const locale of ['zh-Hans','en']){
 const ir=await buildBaZiNarrativeClaimIR({reading:source.reading,sectionKey:'S04_CAREER',locale,temporalSnapshot:source.temporalSnapshot});
 const contract=createReportSectionNarrativeContract({
  methodId:'BZR',sectionKey:'S04_CAREER',
  customerQuestion:'CAREER',customerOutcome:'CAREER',
  requiredClaimRoles:REQUIRED,timingPolicy:'WHEN_AUTHORITY_PRESENT'
 });
 const brief=await buildReportSectionNarrativeBrief({contract,richClaimIr:ir,locale,sourceAuthorityVersion:ir.version});
 const byRole=Object.fromEntries([...new Set(brief.claims.map(c=>c.role))].map(role=>[role,brief.claims.filter(c=>c.role===role).map(c=>c.claimId)]));
 const missing=contract.requiredClaimRoles.filter(role=>!(byRole[role]?.length));
 const sourceModules=[...new Set(ir.claims.flatMap(c=>c.sourceRefs||[]).map(ref=>ref.split('/').slice(0,2).join('/')))];
 rows.locales[locale]={
  claimCount:ir.claims.length,briefClaimCount:brief.claims.length,roles:byRole,missingRoles:missing,
  semanticOperators:[...new Set(brief.claims.flatMap(c=>c.semanticOperators||[]))],sourceModules,
  timingClaimIds:brief.claims.filter(c=>c.role==='TIMING_RELEVANCE').map(c=>c.claimId),
  observableClaimIds:brief.claims.filter(c=>c.role==='OBSERVABLE_EXPRESSION').map(c=>c.claimId),
  sourceDigest:brief.sourceSemanticDigest,briefDigest:brief.briefSemanticDigest,claimIrVersion:brief.claimIrVersion
 };
 if(missing.length)rows.status='FAIL';
}
matrix.referenceImplementation={section:'S04_CAREER',richClaimIrStatus:rows.status,t2Composer:'IMPLEMENTED_PROVIDER_RUN_DEPENDS_ON_SECRET',semanticVerifier:'IMPLEMENTED_V1_1',render:'REVIEW_ARTIFACT_IMPLEMENTED'};
if(rows.status!=='PASS')matrix.status='FAIL';

fs.writeFileSync(out+'/BZR-S04-RICH-CLAIM-IR-AUDIT.json',JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync(out+'/BZR-METHOD-COVERAGE.json',JSON.stringify(matrix,null,2)+'\n');
console.log(JSON.stringify({status:matrix.status,s04:rows.status,sections:Object.fromEntries(Object.entries(matrix.sections).map(([k,v])=>[k,{zhMissing:v.locales['zh-Hans'].missingReferenceRoles,enMissing:v.locales.en.missingReferenceRoles}]))},null,2));
if(matrix.status!=='PASS')process.exitCode=1;
