import fs from 'node:fs';

const html=fs.readFileSync('perspectives/personal/index.html','utf8');
const client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');

const canonicalStart=api.indexOf('function canonicalInput(');
const canonicalEnd=api.indexOf('\nfunction executionParameters',canonicalStart);
const canonicalBody=canonicalStart>=0&&canonicalEnd>canonicalStart?api.slice(canonicalStart,canonicalEnd):'';
const checks={
 formCollectsExplicitName:/name="reportSubjectName"[^>]*required/.test(html),
 formExplainsPresentationOnly:/does not change any method calculation|不会改变任何方法计算/.test(html),
 clientSendsSeparateName:/reportSubjectName:\(fd\.get\('reportSubjectName'\)/.test(client),
 canonicalInputDoesNotContainName:Boolean(canonicalBody)&&/birthDate:/.test(canonicalBody)&&/inputVersion:/.test(canonicalBody)&&!/reportSubjectName|displayName:reportSubjectName/.test(canonicalBody),
 apiRequiresName:/REPORT_SUBJECT_NAME_REQUIRED/.test(api),
 apiBindsAuthenticatedSubject:/subjectReference:accountIdentity\.userId/.test(api),
 apiUsesExplicitDisplayName:/displayName:reportSubjectName/.test(api),
 identitySourceDeclared:/CUSTOMER_DECLARED_SELF_REPORT_DISPLAY_NAME/.test(api),
 birthSourcePreserved:/MCD3_CANONICAL_BIRTH_INPUT/.test(api)
};
const failures=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
console.log(JSON.stringify({schemaVersion:'PHI-OS-RNT2-REPORT-SUBJECT-FLOW-AUDIT-v1.0.0',status:failures.length?'FAIL':'PASS',checks,failures},null,2));
if(failures.length)process.exitCode=1;
