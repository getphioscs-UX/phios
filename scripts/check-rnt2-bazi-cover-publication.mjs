import fs from 'node:fs';
import {buildBaziCustomerPublication,readingPublicationTime} from '../functions/personal-reading/bazi-customer-publication.js';
import {createReportSubjectPresentation} from '../functions/canonical-presentation-runtime/report-cover-subject.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const canonicalBirthInput={
 birthDate:'1989-11-15',birthTime:'22:50:00',
 birthPlace:{displayName:'Kajang',countryCode:'MY',latitude:3.0,longitude:101.8},
 timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'HIGH'},
 timeAccuracy:'EXACT',locale:'zh-Hans',consent:{granted:true},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'
};
const subject=await createReportSubjectPresentation({subjectReference:'QA-SELF',displayName:'RNT2 QA 客户',canonicalBirthInput,identitySourceRef:'QA_EXPLICIT_SELF_REPORT',birthSourceRef:'QA_MCD3'});
const report=await buildBaziCustomerPublication({reading:source.reading,locale:'zh-Hans',temporalSnapshot:source.temporalSnapshot||readingPublicationTime(source.reading),full:true,reportSubjectPresentation:subject,requireSubjectOverlay:true});
if(report.totalPages!==44)throw Error('RNT2_BZR_PUBLICATION_PAGE_COUNT:'+report.totalPages);
if(report.intro?.[0]?.kind!=='STATIC_COVER')throw Error('RNT2_BZR_P01_NOT_STATIC_COVER');
if(report.intro?.[0]?.subject?.subjectFingerprint!==subject.subjectFingerprint)throw Error('RNT2_BZR_P01_SUBJECT_BINDING_MISMATCH');
const html=renderPublicationReport(report);
for(const expected of ['RNT2 QA 客户','1989 / 11 / 15','22 : 50'])if(!html.includes(expected))throw Error('RNT2_BZR_COVER_VALUE_MISSING:'+expected);
if(html.includes('00 : 00'))throw Error('RNT2_BZR_SYNTHETIC_TIME_LEAK');
console.log(JSON.stringify({status:'PASS',totalPages:report.totalPages,coverKind:report.intro[0].kind,subjectFingerprint:subject.subjectFingerprint,values:['name','birthDate','birthTime']},null,2));
