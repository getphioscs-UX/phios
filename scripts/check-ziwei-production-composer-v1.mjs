import os from 'node:os';import path from 'node:path';import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {buildZiweiReportEvidence} from '../functions/personal-reading/narrative/ziwei-publication-adapter.js';
import {buildZiweiFullReportSections} from '../functions/personal-reading/narrative/ziwei-full-report-sections.js';
import {composeZiweiEditorialR2} from '../functions/personal-reading/narrative/ziwei-editorial-r2.js';
import {buildZiweiProductionSections,resolveZiweiProductionStar} from '../functions/personal-reading/narrative/ziwei-production-composer-v1.js';
import {buildZiweiProductionPublication} from '../functions/personal-reading/ziwei-production-publication-v1.js';
import {assertPublicationIrV2Preservation} from '../functions/personal-reading/narrative/report-publication-ir-v2.js';
import {createReportSubjectPresentationFromAccountPerson} from '../functions/canonical-presentation-runtime/report-cover-subject.js';
import {validatePhysicalComposition} from '../functions/canonical-presentation-runtime/physical-composition-contract.js';
import {ZIWEI_STAR_PROFILES as stars} from '../functions/personal-reading/narrative/ziwei-semantic-canon.js';
const dir='docs/reports/ziwei/production-admission/zpa-v1',outputDir=fs.mkdtempSync(path.join(os.tmpdir(),'phios-zpa-check-')),read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p.replace(dir,outputDir),JSON.stringify(v,null,2)+'\n');
const frozen=read('content/reports/ziwei/production-v1-acceptance.json');
for(const [p,h] of Object.entries(frozen.files))assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),h,'Frozen V1 evidence changed: '+p);
const baseline=read('config/reports/ziwei-production-v1-presentation-successor.json');
const originalBaseline=read(dir+'/baseline.json');
assert.deepEqual(Object.keys(baseline.files),Object.keys(originalBaseline.files));
const presentationSuccessors=new Set(baseline.presentationSuccessors||[]);
// Exact classification committed in dc298f52, moved out of accepted V1 evidence.
assert.equal(createHash('sha256').update(fs.readFileSync('config/reports/ziwei-production-v1-presentation-successor.json','utf8').replace(/\r\n?/g,'\n')).digest('hex'),'9bfd070f2ac218273cf1f5917f8aadc09920340f66921cb4d279c500c0a6cd2f');
const byteFrozenFiles=new Set(baseline.byteFrozenFiles||Object.keys(baseline.files).filter(p=>!presentationSuccessors.has(p)));
for(const p of byteFrozenFiles)assert.equal(baseline.files[p],originalBaseline.files[p],'Frozen baseline hash replaced: '+p);
for(const migration of baseline.migrations){
 assert(presentationSuccessors.has(migration.file));
 assert.equal(migration.fromSha256,originalBaseline.files[migration.file]);
 assert.equal(migration.semanticAuthorityChanged,false);
}
for(const [p,d] of Object.entries(baseline.files)){
 if(presentationSuccessors.has(p)){
  assert(fs.existsSync(p),'Presentation successor missing: '+p);
  continue;
 }
 assert(byteFrozenFiles.has(p),'W0 baseline classification missing: '+p);
 assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),d,'Frozen W0 evidence changed: '+p);
}
for(const p of presentationSuccessors)assert(Object.prototype.hasOwnProperty.call(baseline.files,p),'Presentation successor must originate from W0 baseline: '+p);
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
 const e=structuredClone(evidences[0]);mutate(e);for(const locale of ['en','zh-Hans']){const sections=await buildZiweiProductionSections({evidence:e,locale});assert(sections.every(s=>s.paragraphs.every(p=>!p.includes('undefined'))));const r=read(`${outputDir}/ZPA-CONTROLLED-01-${locale}.json`);const snapshot=buildZiweiProductionPublication({evidence:{structured:e},sections,locale,subjectPresentation:r.subject});assert.equal(snapshot.totalPages,33);if(name==='empty primary palace')assert.equal(sections.find(s=>s.sectionId==='S08').evidenceUtilisation.find(u=>u.palaceCode==='HEALTH').role,'CONTEXT');}optional.push({name,status:'PASS_BOTH_LOCALES'});
}
assert.equal(resolveZiweiProductionStar(null,'coreFunction','en').state,'ABSENT');
const regressions=[];
for(const subject of ['A','B'])for(const locale of ['en','zh-Hans']){
 const old=read(`docs/reports/ziwei/full-report-r2/SUBJECT_${subject}-${locale}.json`),sections=await buildZiweiProductionSections({evidence:old.evidence,locale,sourceSections:old.sections});
 const snapshot=buildZiweiProductionPublication({evidence:{structured:old.evidence},sections,locale,subjectPresentation:old.subject});
 assert.deepEqual(sections.map(s=>s.claims),old.sections.map(s=>s.claims));const visualIdentity=binding=>Object.fromEntries(Object.entries(binding).filter(([key])=>!['bodyUrl','motifUrl','intensityByFamily','opacityByLayer','backgroundMode'].includes(key)));
 assert.deepEqual(snapshot.pages.map(p=>[p.sectionId,p.physicalPageRole,visualIdentity(p.visualBinding)]),old.snapshot.pages.map(p=>[p.sectionId,p.physicalPageRole,visualIdentity(p.visualBinding)]));
 for(const [index,page] of snapshot.pages.entries()){
  const master=page.pageFamily==='SECTION_OPENER_PAGE',binding=page.visualBinding,previous=old.snapshot.pages[index].visualBinding;
  assert.equal(binding.backgroundMode,master?'SECTION_MASTER_FULL_BLEED':'READING_PAGE_DECORATION');
  assert.equal(binding.bodyUrl,master?null:previous.bodyUrl);assert.equal(binding.motifUrl,master?null:previous.motifUrl);
  assert.deepEqual(binding.intensityByFamily,{SECTION_OPENER_PAGE:1,NARRATIVE_ANALYSIS_PAGE:.12,METHOD_APPENDIX_PAGE:.1});
  assert.deepEqual(binding.opacityByLayer,{body:.12,motif:.09,hero:master?1:.12});
 }assert(sections.every(s=>JSON.stringify(s.unknowns)===JSON.stringify(old.evidence.unknowns)));
 regressions.push({subject,locale,sourceClaims:'UNCHANGED',sectionOwnership:'UNCHANGED',visualBindings:'ASSET_IDENTITY_UNCHANGED_FULL_BLEED_PRESENTATION_SUCCESSOR',physicalArchitecture:'UNCHANGED',unknowns:'UNCHANGED',timingBoundary:'NATAL_DA_XIAN_LIU_NIAN_ONLY',proseByteEqualityRequired:false});
}
const foreign=structuredClone(prior.sections);foreign[0].subjectId='FOREIGN-SUBJECT';
await assert.rejects(buildZiweiProductionSections({evidence:prior.evidence,locale:'en',sourceSections:foreign}),/ZIWEI_SOURCE_IR_SUBJECT_MISMATCH/);
write(dir+'/root-causes.json',roots);write(dir+'/generation-coverage.json',{ZIWEI_GENERAL_GENERATION_COVERAGE:'PASS',realControlledStructures:12,locales:['zh-Hans','en'],results,variety,optional,regressions,undefinedReferences:0,fabricatedSemanticRecords:0,unsupportedBrightnessInference:0,unsupportedLiuYue:0,editorialAcceptance:'NOT_REQUESTED_OR_GRANTED',qaAccountDelivery:'NOT_PROVEN',productionAdmission:'NOT_GRANTED'});
fs.rmSync(outputDir,{recursive:true,force:true});
console.log('PASS ZPA: 12/12 real calculations, 24/24 IR and composition; optional evidence and frozen R2 regressions.');
