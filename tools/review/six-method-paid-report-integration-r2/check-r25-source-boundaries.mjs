import assert from 'node:assert/strict';
import {sha256Stable} from '../../../functions/interpretation-runtime/mir7-utils.js';
import {verifyCustomerReportSource} from '../../../functions/report-delivery/paid-report-customer-source-contract.js';
import {createAstrologyPendingAdapter} from '../../../functions/report-delivery/paid-report-astrology-adapter.js';
import {createHumanDesignPendingAdapter} from '../../../functions/report-delivery/paid-report-human-design-adapter.js';
import {createEcrPendingAdapter} from '../../../functions/report-delivery/paid-report-ecr-adapter.js';
import {qaCoreEnvironment} from '../../../scripts/lib/p8-shared-core-qa.mjs';
import {saveCanonicalPerson,loadCanonicalPersonSubject} from '../../../functions/account/canonical-person-store.js';
import {randomBytes} from 'node:crypto';

const cases=[];
globalThis.fetch=async()=>{throw Error('R25_TECHNICAL_QA_NETWORK_FORBIDDEN');};
async function test(name,run){await run();cases.push({name,status:'PASS'});}
if(!process.env.PHIOS_R25_QA_RUN?.replaceAll('\\','/').startsWith('D:/PHIOS/QA-TEMP/SIX-METHOD-R2/'))throw Error('D_QA_RUN_REQUIRED');
const qa=qaCoreEnvironment(process.env.PHIOS_R25_QA_RUN+'/state',{fresh:true});
qa.env.CANONICAL_PERSON_ENCRYPTION_KEY=randomBytes(32).toString('hex');
const context=qa.ctx('synthetic-owner');
const person=await saveCanonicalPerson(context,{action:'save',expectedVersion:0,name:'SYNTHETIC R25',birth:{birthDate:'1989-11-15',birthTime:'09:20:00',birthPlace:{displayName:'Taiping',countryCode:'MY',latitude:4.85,longitude:100.73},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00'},timeAccuracy:'EXACT'},locale:'en',consent:{personalMethod:true,report:true,saveBirthInput:true},expiresAt:new Date(Date.now()+86400000).toISOString()});
const subject=await loadCanonicalPersonSubject(context.env,'synthetic-owner',person.personId);
const methods=[['AST','COM-REPORT-ASTROLOGY-FULL','AST_NATIVE_CALCULATION',10,createAstrologyPendingAdapter],['HD','COM-REPORT-HD-FULL','HD_CONFIRMED_EXTERNAL_CHART',17,createHumanDesignPendingAdapter],['ECR','COM-REPORT-ECR-FULL','ECR_NATIVE_CONFIGURATION',10,createEcrPendingAdapter],['NUM','COM-REPORT-NUMEROLOGY-FULL','NUM_NATIVE_CALCULATION',19,null]];
const consentChecks=[];
for(const [methodCode,productId,sourceFamily,count,factory] of methods){
 const binding={ownerAccountId:'synthetic-owner',personId:person.personId,personVersion:subject.personVersion,methodCode,productId,publicationVersion:'SYNTHETIC-NOT-PUBLICATION',inputDigest:'a'.repeat(64),authorityDigest:'b'.repeat(64),locale:'bilingual'};
 const requiredSectionIds=Array.from({length:count},(_,i)=>'SYNTHETIC-SECTION-'+(i+1));
 const sections=requiredSectionIds.map(sectionId=>({sectionId,sourceRefs:['synthetic-native-evidence'],body:{en:'Synthetic QA only.', 'zh-Hans':'仅用于合成测试。'}}));
 let source={schemaVersion:'PAID_REPORT_CUSTOMER_SOURCE_V1',...binding,sourceFamily,sourceRef:'synthetic-only',consentRef:subject.reportConsent.consentId,scope:'TECHNICAL_FIXTURE',customerPublicationAllowed:false,sections,contentDigest:await sha256Stable(sections)};
 const verify=s=>verifyCustomerReportSource({source:s,binding,sourceFamily,requiredSectionIds});
 await test(methodCode+' complete bilingual technical source grants no publication',async()=>{const result=await verify(source);assert.equal(result.sectionCount,count);assert.equal(result.customerPublicationAllowed,false);assert.equal(result.commercialAdmission,false);});
 for(const key of Object.keys(binding))await test(methodCode+' rejects changed '+key,()=>assert.rejects(()=>verify({...source,[key]:'changed'})));
 for(const [name,mutate] of [
  ['different method source',s=>{s.sourceFamily='OTHER_METHOD';}],
  ['missing section',s=>{s.sections.pop();}],
  ['duplicate section',s=>{s.sections[1]=s.sections[0];}],
  ['missing English',s=>{delete s.sections[0].body.en;}],
  ['missing Chinese',s=>{delete s.sections[0].body['zh-Hans'];}],
  ['missing lineage',s=>{s.sections[0].sourceRefs=[];}],
  ['body tampering',s=>{s.sections[0].body.en='changed';}],
  ['self approved source',s=>{s.customerPublicationAllowed=true;}],
  ['historical reference promoted',s=>{s.scope='HISTORICAL_REFERENCE_CUSTOMER_APPROVED';}],
  ['missing consent',s=>{s.consentRef='';}]
 ])await test(methodCode+' rejects '+name,async()=>{const changed=structuredClone(source);mutate(changed);await assert.rejects(()=>verify(changed));});
 if(!factory)continue;
 const calls=[];const nativeOwner=Object.fromEntries(['prepare','generate','validate','compile','render','release','reconcile','verifyDelivered'].map(stage=>[stage,async()=>{calls.push(stage);return {reportId:'synthetic-report'};}]));
 const deps={publicationVersion:binding.publicationVersion,requiredSectionIds,loadSource:async()=>source,nativeOwner};
 const adapter=factory(deps),job={...binding,presentation:{reportLocale:'bilingual'}};
 await test(methodCode+' admission remains closed',async()=>{assert.equal(adapter.p8Admitted,false);assert.equal((await adapter.readiness(context,job)).commercialProductReady,false);});
 await test(methodCode+' delegates to one native owner without creating another engine',async()=>{for(const stage of Object.keys(nativeOwner))await adapter[stage](context,job);assert.deepEqual(calls,Object.keys(nativeOwner));});
 for(const stage of Object.keys(nativeOwner))await test(methodCode+' rechecks source before '+stage,async()=>{const n=calls.length;source={...source,authorityDigest:'c'.repeat(64)};await assert.rejects(()=>adapter[stage](context,job));assert.equal(calls.length,n);source={...source,authorityDigest:binding.authorityDigest};});
 await test(methodCode+' denies LIVE and unverified owner before native call',async()=>{const n=calls.length;await assert.rejects(()=>adapter.generate({...context,env:{PHIOS_ENVIRONMENT:'production',STRIPE_ENVIRONMENT:'LIVE'}},job));await assert.rejects(()=>adapter.generate({...context,data:{}},job));assert.equal(calls.length,n);});
 await test(methodCode+' incomplete lifecycle rejected',()=>assert.throws(()=>factory({...deps,nativeOwner:{}})));
 await test(methodCode+' live canonical consent is checked before native delegate',async()=>{const old=source;const n=calls.length;source={...source,consentRef:'stale-consent'};await assert.rejects(()=>adapter.generate(context,job),e=>e.code==='PENDING_ADAPTER_REPORT_CONSENT_MISMATCH');assert.equal(calls.length,n);source=old;});
 await test(methodCode+' canonical Person version is rechecked',async()=>{const n=calls.length;await assert.rejects(()=>adapter.generate(context,{...job,personVersion:job.personVersion+1}),e=>e.code==='PENDING_ADAPTER_SUBJECT_VERSION_MISMATCH');assert.equal(calls.length,n);});
 consentChecks.push({methodCode,adapter,job,calls});
}
await saveCanonicalPerson(context,{action:'revoke',personId:person.personId,expectedVersion:subject.personVersion});
for(const {methodCode,adapter,job,calls} of consentChecks)await test(methodCode+' revoked canonical consent blocks native execution',async()=>{const n=calls.length;await assert.rejects(()=>adapter.generate(context,job));assert.equal(calls.length,n);});
qa.sql.close();
console.log(JSON.stringify({status:'PASS_TECHNICAL_SOURCE_BOUNDARIES_ONLY',cases,providerCalls:0,usd:0,pdfRenders:0,sandboxVerified:false,customerPublicationAllowed:false}));
