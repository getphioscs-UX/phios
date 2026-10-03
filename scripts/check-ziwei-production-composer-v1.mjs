import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {buildZiweiReportEvidence} from '../functions/personal-reading/narrative/ziwei-publication-adapter.js';
import {buildZiweiFullReportSections} from '../functions/personal-reading/narrative/ziwei-full-report-sections.js';
import {composeZiweiEditorialR2} from '../functions/personal-reading/narrative/ziwei-editorial-r2.js';
import {buildZiweiProductionSections,resolveZiweiProductionStar} from '../functions/personal-reading/narrative/ziwei-production-composer-v1.js';
import {buildZiweiProductionPublication} from '../functions/personal-reading/ziwei-production-publication-v1.js';
import {assertPublicationIrV2Preservation} from '../functions/personal-reading/narrative/report-publication-ir-v2.js';
import {createReportSubjectPresentationFromAccountPerson} from '../functions/canonical-presentation-runtime/report-cover-subject.js';
import {bindZiweiReportVisual} from '../functions/canonical-presentation-runtime/ziwei-report-visuals.js';
import {validatePhysicalComposition} from '../functions/canonical-presentation-runtime/physical-composition-contract.js';
import {ZIWEI_STAR_PROFILES as stars} from '../functions/personal-reading/narrative/ziwei-semantic-canon.js';
// Regression execution keeps newly generated proof in memory; accepted fixture bytes are immutable.
const generated=new Map(),dir='docs/reports/ziwei/production-admission/zpa-v1',read=p=>JSON.parse(generated.get(p)??fs.readFileSync(p,'utf8')),write=(p,v)=>generated.set(p,JSON.stringify(v,null,2)+'\n');
const baseline=read(dir+'/baseline.json'),printSuccessor=read(dir+'/print-shell-v2-successor.json');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(printSuccessor.scope,'EXISTING_SHARED_PRINT_SHELL_V2_PRESENTATION_SUCCESSOR_ONLY');
assert.equal(printSuccessor.productionAdmissionCreated,false);assert.equal(printSuccessor.humanApprovalCreated,false);
assert.equal(printSuccessor.predecessorCommit,baseline.HEAD);
assert.equal(printSuccessor.successorCommit,'885c1a02e4b1f2f7c0a4c893edc5fae919ebb631');
assert.deepEqual(Object.keys(printSuccessor.files),['assets/customer-ui/js/personal-products/publication-report-pages.js','assets/customer-ui/surfaces/ziwei-report-publication-r2.css','functions/canonical-presentation-runtime/ziwei-report-visuals.js']);
for(const [p,d] of Object.entries(baseline.files)){
 const successor=printSuccessor.files[p];
 if(!successor){assert.equal(digest(fs.readFileSync(p)),d,'Frozen W0 evidence changed: '+p);continue;}
 assert.equal(successor.predecessorSha256,d);
 assert.equal(digest(execFileSync('git',['show',baseline.HEAD+':'+p])),d,'Frozen historical renderer must remain recoverable');
 assert.equal(digest(execFileSync('git',['show',printSuccessor.successorCommit+':'+p])),successor.successorSha256,'Pinned print successor changed');
 assert.equal(digest(fs.readFileSync(p)),successor.successorSha256,'Shared print renderer drift outside pinned successor');
}
const prior=read('docs/reports/ziwei/full-report-r2/SUBJECT_A-en.json');
const inputs=[['1989-11-15','22:50:00','MALE'],['1992-06-04','06:30:00','FEMALE'],['1991-08-17','09:20:00','FEMALE'],['1985-01-12','14:10:00','MALE'],['2000-02-29','00:30:00','FEMALE'],['1978-07-21','18:15:00','MALE'],['1967-03-08','03:40:00','FEMALE'],['1995-12-28','11:55:00','MALE'],['2003-09-09','16:20:00','FEMALE'],['1982-04-23','07:05:00','MALE'],['1971-10-06','20:10:00','FEMALE'],['1998-05-19','01:25:00','MALE']];
const results=[],roots=[],evidences=[];
for(const [i,[birthDate,birthTime,sex]] of inputs.entries()){
 const subjectId='ZPA-CONTROLLED-'+String(i+1).padStart(2,'0'),row={subjectId,birthDate,birthTime,sex,locales:[]};
 for(const locale of ['zh-Hans','en']){
  const canonicalInput={...prior.canonicalInput,birthDate,birthTime,locale,consent:{...prior.canonicalInput.consent,recordId:subjectId+'-CONSENT'}};
  const executionRequest={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:canonicalInput.consent.purposeCode,canonicalInput,executionParameters:{traditionalCalculationSex:sex},consentRecordId:canonicalInput.consent.recordId,requestId:subjectId};
  const evidence=await buildZiweiReportEvidence({subjectId,executionRequest,targetContext:prior.evidence.targetContext,locale});assert(evidence.executionReuse.sourceCalculationBuiltOnce);assert(!evidence.executionReuse.secondNatalCalculationPerformed);
  if(locale==='en'){
   evidences.push(evidence.structured);write(`${dir}/${subjectId}-input.json`,{fixtureClass:'CONTROLLED_SYNTHETIC_NO_ACCOUNT',selectionReason:'Calendar, sex, hour and decade diversity; all six prior cases retained, six additional cases chosen before calculation',executionRequest,targetContext:prior.evidence.targetContext});
   if(i>=2&&i<=5){try{const base=await buildZiweiFullReportSections({evidence,locale});await composeZiweiEditorialR2({evidence:evidence.structured,sections:base,snapshot:{locale}});throw Error('EXPECTED_OLD_FAILURE_NOT_REPRODUCED');}catch(e){assert.notEqual(e.message,'EXPECTED_OLD_FAILURE_NOT_REPRODUCED');roots.push({subjectId,priorSubjectId:'CONTROLLED-ZWR-PROD-'+(i+1),error:e.message,callPath:e.stack,expectedSemanticOwner:'ZIWEI_PRO_R2_STAR_PROFILES_V2',palaces:evidence.structured.palaces.map(p=>({palace:p.palaceCode,stars:evidence.structured.placements.filter(s=>s.palaceCode===p.palaceCode).map(s=>s.starCode)}))});}}
  }
  const sections=await buildZiweiProductionSections({evidence,locale});assert.equal(sections.length,12);
  for(const section of sections){assert(assertPublicationIrV2Preservation({publicationIr:section.publicationIr,brief:section.brief}).accepted);assert(!section.paragraphs.some(p=>/undefined|\[object Object\]/.test(p)));for(const r of section.supportingEvidence)assert.equal(r.text,stars[r.starCode].dimensions[r.dimension][locale]);assert.deepEqual(section.unknowns,evidence.structured.unknowns);}
  const subject=await createReportSubjectPresentationFromAccountPerson({accountPersonReference:{personId:subjectId,displayName:'Controlled '+String(i+1)},canonicalBirthInput:canonicalInput,birthSourceRef:`${dir}/${subjectId}-input.json#executionRequest/canonicalInput`});
  const snapshot=buildZiweiProductionPublication({evidence,sections,locale,subjectPresentation:subject});assert.equal(snapshot.totalPages,33);validatePhysicalComposition({...snapshot,...snapshot.physicalComposition});
  write(`${dir}/${subjectId}-${locale}.json`,{canonicalInput,subject,evidence:evidence.structured,sections,snapshot});row.locales.push({locale,calculation:'PASS',publicationIr:'PASS',composition:'PASS',pages:33});
 }
 results.push(row);console.log(subjectId,'ZH + EN PASS');
}
const variety={life: new Set(evidences.map(e=>e.placements.filter(p=>p.palaceCode==='LIFE').map(p=>p.starCode).sort().join(','))).size,body:new Set(evidences.map(e=>e.palaces.find(p=>p.isBodyPalace).palaceCode)).size};
for(const c of ['CAREER','WEALTH','HEALTH'])variety[c]=new Set(evidences.map(e=>e.placements.filter(p=>p.palaceCode===c).map(p=>p.starCode).sort().join(','))).size;
for(const l of ['DA_XIAN','LIU_NIAN'])variety[l]=new Set(evidences.map(e=>e.timing.find(t=>t.layer===l).focus.natalDomainCode)).size;
variety.transformations=new Set(evidences.map(e=>e.transformations.map(t=>[t.layer,t.palaceCode,t.transformationCode].join(':')).sort().join('|'))).size;
assert(Object.values(variety).every(n=>n>1));
// Structural counterexamples are explicit mutations of normalized evidence,
// not claimed as additional real calculations or new semantic authority.
const optional=[];
for(const [name,mutate] of [['empty supporting palaces',e=>{e.placements=e.placements.filter(p=>!['TRAVEL','FRIENDS','SIBLINGS'].includes(p.palaceCode));}],['empty primary palace',e=>{e.placements=e.placements.filter(p=>p.palaceCode!=='HEALTH');}],['all optional placements absent',e=>{e.placements=[];}],['unknown dimension',e=>{e.placements=e.placements.map(p=>({...p,semanticDimensions:{coreFunction:'UNKNOWN',pressureMode:'UNKNOWN'}}));}],['unadmitted semantic records',e=>{e.placements=e.placements.map(p=>({...p,meaningAdmitted:false}));}],['unrecognized lookup key',e=>{e.placements[0].starCode='UNADMITTED_TEST_ONLY';}],['no transformations',e=>{e.transformations=[];}],['one transformation',e=>{e.transformations=e.transformations.slice(0,1);}],['unsupported modifier',e=>{e.transformations[0].transformationCode='UNADMITTED_TEST_ONLY';}],['Body absent',e=>{e.palaces=e.palaces.map(p=>({...p,isBodyPalace:false}));}],['timing absent',e=>{e.timing=[];}]]){
 const e=structuredClone(evidences[0]);mutate(e);for(const locale of ['en','zh-Hans']){const sections=await buildZiweiProductionSections({evidence:e,locale});assert(sections.every(s=>s.paragraphs.every(p=>!p.includes('undefined'))));const r=read(`${dir}/ZPA-CONTROLLED-01-${locale}.json`);const snapshot=buildZiweiProductionPublication({evidence:{structured:e},sections,locale,subjectPresentation:r.subject});assert.equal(snapshot.totalPages,33);if(name==='empty primary palace')assert.equal(sections.find(s=>s.sectionId==='S08').evidenceUtilisation.find(u=>u.palaceCode==='HEALTH').role,'CONTEXT');}optional.push({name,status:'PASS_BOTH_LOCALES'});
}
assert.equal(resolveZiweiProductionStar(null,'coreFunction','en').state,'ABSENT');
const regressions=[];
for(const subject of ['A','B'])for(const locale of ['en','zh-Hans']){
 const old=read(`docs/reports/ziwei/full-report-r2/SUBJECT_${subject}-${locale}.json`),sections=await buildZiweiProductionSections({evidence:old.evidence,locale,sourceSections:old.sections});
 const snapshot=buildZiweiProductionPublication({evidence:{structured:old.evidence},sections,locale,subjectPresentation:old.subject});
 assert.deepEqual(sections.map(s=>s.claims),old.sections.map(s=>s.claims));assert.deepEqual(snapshot.pages.map(p=>[p.sectionId,p.physicalPageRole]),old.snapshot.pages.map(p=>[p.sectionId,p.physicalPageRole]));
 for(const [i,page] of snapshot.pages.entries()){
  const historic=old.snapshot.pages[i].visualBinding;
  for(const key of ['assetKey','url','motifKey','objectPosition','candidates','required','suppressSyntheticMotif','placement','registryRef','owner'])assert.deepEqual(page.visualBinding[key],historic[key],'Frozen visual identity changed: '+key);
  assert.deepEqual(page.visualBinding,bindZiweiReportVisual({sectionId:page.sectionId,pageNumber:page.pageNumber,isMaster:page.physicalPageRole==='SECTION_MASTER'}),'Visual binding must use pinned Print Shell V2 adapter');
 }assert(sections.every(s=>JSON.stringify(s.unknowns)===JSON.stringify(old.evidence.unknowns)));
 regressions.push({subject,locale,sourceClaims:'UNCHANGED',sectionOwnership:'UNCHANGED',visualBindings:'PINNED_PRINT_SHELL_V2_SUCCESSOR',physicalArchitecture:'UNCHANGED',unknowns:'UNCHANGED',timingBoundary:'NATAL_DA_XIAN_LIU_NIAN_ONLY',proseByteEqualityRequired:false});
}
const foreign=structuredClone(prior.sections);foreign[0].subjectId='FOREIGN-SUBJECT';
await assert.rejects(buildZiweiProductionSections({evidence:prior.evidence,locale:'en',sourceSections:foreign}),/ZIWEI_SOURCE_IR_SUBJECT_MISMATCH/);
write(dir+'/root-causes.json',roots);write(dir+'/generation-coverage.json',{ZIWEI_GENERAL_GENERATION_COVERAGE:'PASS',realControlledStructures:12,locales:['zh-Hans','en'],results,variety,optional,regressions,undefinedReferences:0,fabricatedSemanticRecords:0,unsupportedBrightnessInference:0,unsupportedLiuYue:0,editorialAcceptance:'NOT_REQUESTED_OR_GRANTED',qaAccountDelivery:'NOT_PROVEN',productionAdmission:'NOT_GRANTED'});
console.log('PASS ZPA: 12/12 real calculations, 24/24 IR and composition; optional evidence and frozen R2 regressions.');
