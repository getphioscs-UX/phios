import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHumanDesignProfileText} from '../functions/external-profile/hd-profile-parser.js';
import {buildExternalProfileExtractionIr} from '../functions/external-profile/external-profile-extraction-ir.js';
import {EXTERNAL_PROFILE_MANUAL_FIELDS} from '../functions/external-profile/external-profile-contract.js';
import {onRequestPost as externalProfileIntake} from '../functions/api/customer-external-profile-intake.js';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const authority=readJson('content/customer-experience-rebuild/r12r4b/external-profile-authority-v1.json');
const contract=readJson('content/customer-experience-rebuild/r12r4b/human-design-external-profile-contract-v1.json');
const shadow=readJson('content/customer-experience-rebuild/r12r4b/hdr-shadow-boundary-v1.json');
const acceptance=readJson('content/customer-experience-rebuild/r12r4b/cx-r12r4b-r1-acceptance-v1.json');
const hdrFreeze=readJson('content/professional/core-method-runtime/hdr-production-freeze-v1.json');
const hdrReadiness=readJson('content/professional/method-production-activation/registries/mpa-hdr-boundary-readiness-v1.json');
const hdW11=readJson('content/customer-experience-rebuild/hd-pro-r2/hd-w11-official-chart-pdf-intake-adapter-successor-v1.json');
const R1_MANUAL_ADVANCED_FIELDS=['cognition','determination','environment','perspective','motivation','trajectory'];

assert.equal(authority.work,'CX-R12R4B-W11R');
assert.equal(authority.methodId,'XPF');
assert.equal(authority.profileFamily,'HUMAN_DESIGN');
assert.equal(authority.authorityClass,'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT');
assert.equal(authority.authority.phiosCalculated,false);
assert.equal(authority.authority.canonicalMethodProjection,false);
assert.equal(authority.authority.calculatedMethodConsensusEligible,false);
assert.equal(authority.boundaries.hdrShadowMayValidateButMayNotOverwriteCustomerInput,true);
assert.deepEqual(authority.manualAdvancedFields,R1_MANUAL_ADVANCED_FIELDS);

assert.equal(shadow.methodId,'HDR');
assert.equal(shadow.authorityClass,'INTERNAL_VALIDATION_ONLY');
assert.equal(shadow.production.customerVisible,false);
assert.equal(shadow.production.reportEligible,false);
assert.equal(shadow.production.productionEligible,false);
assert(shadow.forbiddenUses.includes('AUTO_FILL_CUSTOMER_CONFIRMED_EXTERNAL_PROFILE'));
assert.equal(hdrFreeze.productionStatus,'blocked');
assert.equal(hdrFreeze.executionMode,'validation_only');
assert.equal(hdrReadiness.productionExecutionAllowed,false);
assert.equal(hdrReadiness.publicMethodExecutionAllowed,false);

assert.deepEqual(contract.manualAdvancedFields,R1_MANUAL_ADVANCED_FIELDS);
assert.deepEqual(EXTERNAL_PROFILE_MANUAL_FIELDS,['variable',...R1_MANUAL_ADVANCED_FIELDS]);
assert(hdW11.basicConfirmationFields.includes('variable'));
assert.deepEqual(hdW11.advancedOptionalFields,R1_MANUAL_ADVANCED_FIELDS);
assert.equal(hdW11.boundaries.historicalFreezeRewritten,false);
assert.deepEqual(contract.supportedFileTypes,['png','jpg','jpeg','webp','pdf']);
assert.equal(contract.r1Capabilities.binaryDocumentExtraction,false);
assert.equal(contract.r1Capabilities.customerConfirmation,false);
assert.equal(contract.privacy.persistence,'NONE');

const sample=`Type: 生产者\nAuthority: 情绪权威\nProfile: 5/1\nDefinition: 三重分离\nIncarnation Cross: 左角奉献十字（43/23｜29/30）\nCognition: 内视\nDetermination: 低音\nEnvironment: 湿｜厨房\nPerspective: Survival（生存）\nMotivation: Need（需求）\nTrajectory: Novice（新手）`;
const parsed=parseHumanDesignProfileText(sample);
const values=Object.fromEntries(parsed.candidates.map(item=>[item.field,item.normalizedValue]));
assert.equal(values.type,'生产者');
assert.equal(values.authority,'情绪权威');
assert.equal(values.profile,'5/1');
assert.equal(values.definition,'三重分离');
assert.match(values.incarnationCross,/43\/23/);
assert.equal(values.cognition,'内视');
assert.equal(values.determination,'低音');
assert.equal(values.environment,'湿｜厨房');
assert.match(values.perspective,/Survival/);
assert.match(values.motivation,/Need/);
assert.match(values.trajectory,/Novice/);
assert(parsed.candidates.every(item=>item.customerConfirmed===false&&item.phiosCalculated===false));
assert.equal(parsed.candidates.some(item=>['strategy','meaning','interpretation'].includes(item.field)),false);

const ir=buildExternalProfileExtractionIr({
  intakeId:'XPF-TEST',
  sources:[{sourceType:'CUSTOMER_UPLOADED_IMAGE',fileName:'chart.png',fileType:'png',mimeType:'image/png',fileSize:100,sha256:'a'.repeat(64),fileContentPersisted:false,sourceAuthority:'CUSTOMER'}],
  pastedText:sample,
  manualFields:{cognition:'内视',determination:'低音',environment:'湿｜厨房',perspective:'Survival',motivation:'Need',trajectory:'Novice'}
});
assert.equal(ir.schemaVersion,'PHI-OS-EXTERNAL-PROFILE-EXTRACTION-IR-v1.0.0');
assert.equal(ir.status,'MIXED_INPUT_READY');
assert.equal(ir.boundary.binaryDocumentExtractionPerformed,false);
assert.equal(ir.boundary.fileContentPersisted,false);
assert(ir.unresolved.includes('BINARY_DOCUMENT_EXTRACTION_PENDING_SUCCESSOR'));
assert.equal(ir.manualFields.length,6);
assert(ir.manualFields.every(item=>item.sourceType==='CUSTOMER_MANUAL_ENTRY'&&item.customerConfirmed===true));

const form=new FormData();
form.set('profileFamily','HUMAN_DESIGN');
form.set('consent','true');
form.set('file',new File([new Uint8Array([1,2,3,4])],'my-chart.png',{type:'image/png'}));
form.set('pastedText',sample);
form.set('cognition','内视');
const request=new Request('https://example.test/api/customer-external-profile-intake',{method:'POST',body:form});
const response=await externalProfileIntake({request});
assert.equal(response.status,200);
const payload=await response.json();
assert.equal(payload.ok,true);
assert.equal(payload.externalProfileIntake.methodId,'XPF');
assert.equal(payload.externalProfileIntake.authorityClass,'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT');
assert.equal(payload.externalProfileIntake.boundary.phiosCalculated,false);
assert.equal(payload.externalProfileIntake.privacy.saved,false);
assert.equal(payload.externalProfileIntake.privacy.fileContentPersisted,false);
assert.equal(payload.externalProfileIntake.extractionIr.sources[0].fileName,'my-chart.png');
assert.match(payload.externalProfileIntake.extractionIr.sources[0].sha256,/^[a-f0-9]{64}$/);
assert.equal(payload.externalProfileIntake.extractionIr.candidates.find(item=>item.field==='profile').normalizedValue,'5/1');
assert.equal(payload.externalProfileIntake.extractionIr.manualFields[0].field,'cognition');

const badForm=new FormData();
badForm.set('profileFamily','HUMAN_DESIGN');
badForm.set('consent','true');
badForm.set('file',new File(['bad'],'chart.txt',{type:'text/plain'}));
const badResponse=await externalProfileIntake({request:new Request('https://example.test/api/customer-external-profile-intake',{method:'POST',body:badForm})});
assert.equal(badResponse.status,422);
assert.equal((await badResponse.json()).error,'EXTERNAL_PROFILE_FILE_TYPE_UNSUPPORTED');

const html=fs.readFileSync('perspectives/personal/index.html','utf8');
for(const name of ['externalCognition','externalDetermination','externalEnvironment','externalPerspective','externalMotivation','externalTrajectory'])assert(html.includes(`name="${name}"`),`Missing six-field input ${name}`);
assert(html.includes('name="externalVariable"'),'HD W11 Variable successor input is missing');
for(const forbidden of ['externalType','externalAuthority','externalProfile','externalDefinition','externalIncarnationCross','externalActivatedGates','externalChannels','externalDefinedCenters','externalOpenCenters'])assert.equal(html.includes(`name="${forbidden}"`),false,`Core/structural field must not be normal manual input: ${forbidden}`);
assert.match(html,/accept="image\/png,image\/jpeg,image\/webp,application\/pdf"/);
assert.match(html,/customer-supplied external context/i);

const client=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
assert.match(client,/\/api\/customer-external-profile-intake/);
assert.match(client,/prepareExternalProfileIntake/);
assert.match(client,/externalProfileIntake/);
const customerApi=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
assert.equal(/HUMAN_DESIGN_PROJECTION|methodCode:\s*'HUMAN_DESIGN'/.test(customerApi),false,'R1 must not promote HDR into calculated customer methods.');

assert.equal(acceptance.status,'R4B_R1_ACCEPTED_BY_EXECUTABLE_CHECKS');
assert.deepEqual(acceptance.manualAdvancedFields,R1_MANUAL_ADVANCED_FIELDS);
assert.equal(acceptance.claims.humanDesignCustomerCalculationPromoted,false);
assert.equal(acceptance.claims.binaryDocumentExtractionClaimed,false);
assert.equal(acceptance.nextSequentialWork,'CX-R12R4B-R2-W16R_UPLOAD_DERIVED_CORE_PROFILE');

console.log('✓ CX-R12R4B R1 W11R–W15R External Profile Authority + Upload Intake passed.');
console.log('  Historical R1 keeps its six manual advanced fields; HD W11 admits customer-supplied Variable as an explicit successor without rewriting the R1 freeze.');
