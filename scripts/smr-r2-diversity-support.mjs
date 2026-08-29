import crypto from 'node:crypto';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';
import {executeAndProjectMcd5CurrentRequest} from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import {onRequestPost as executeZiWei} from '../functions/api/zi-wei-execute.js';
import {buildEcrCanonicalProjectionFromAnchor} from '../functions/embodied-configuration/ecr-canonical-projection-runtime.js';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {adaptAcceptedMethodReadingEnvelope} from '../functions/single-method-reading-r2/method-production-adapter-core.js';
import {buildCustomerClaimIR} from '../functions/single-method-reading-r2/customer-claim-ir.js';
import {resolveCustomerPriorities} from '../functions/single-method-reading-r2/customer-priority-resolver.js';
import {composeCustomerThemes} from '../functions/single-method-reading-r2/customer-theme-composer.js';
import {deduplicateClaims} from '../functions/single-method-reading-r2/claim-deduplicator.js';
import {resolveSectionInformationGain} from '../functions/single-method-reading-r2/section-information-gain-resolver.js';
import {preserveContradictions} from '../functions/single-method-reading-r2/contradiction-preservation.js';
import {buildCustomerNarrativeIR} from '../functions/single-method-reading-r2/customer-narrative-ir.js';
import {buildCustomerReadingIA} from '../functions/single-method-reading-r2/customer-reading-ia.js';
import {buildCustomerReadingLayout} from '../functions/single-method-reading-r2/customer-reading-layout.js';

export const METHODS=Object.freeze(['AST','BZR','ZWR','NUM','ECR']);
export const W18_BASELINE_COMMIT='31f0cb5dcf47c1e9419ef67ac89968d06834b35d';
export const METHOD_LABELS=Object.freeze({AST:'Astrology',BZR:'BaZi',ZWR:'Zi Wei Dou Shu',NUM:'Numerology',ECR:'Embodied Configuration'});
export const METHOD_SLUGS=Object.freeze({AST:'ast',BZR:'bzr',ZWR:'zwr',NUM:'num',ECR:'ecr'});
const list=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(list(v).filter(Boolean))];
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const stable=v=>JSON.stringify(v,Object.keys(v||{}).sort());

const refs={285:'1989-01-05T08:45:57.000Z',315:'1989-02-03T20:27:10.000Z',345:'1989-03-05T14:34:09.000Z',15:'1989-04-04T19:29:54.000Z',45:'1989-05-05T12:53:55.000Z',75:'1989-06-05T17:05:13.000Z',105:'1989-07-07T03:19:26.000Z',135:'1989-08-07T13:03:53.000Z',165:'1989-09-07T15:53:54.000Z',195:'1989-10-08T07:27:19.000Z',225:'1989-11-07T10:33:32.000Z',255:'1989-12-07T03:20:57.000Z'};
const speeds={Sun:1,Moon:13,Mercury:-.2,Venus:1.1,Mars:.5,Jupiter:.08,Saturn:.03,Uranus:.01,Neptune:.006,Pluto:.004};
const bodyNames=Object.keys(speeds);
const astronomyFixture=Object.freeze({Body:Object.freeze(Object.fromEntries(bodyNames.map(name=>[name,name]))),MakeTime(date){const ut=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;return {ut,tt:ut+64/86400,date}},GeoVector(body,date){const day=(date.getTime()-Date.UTC(1989,5,22,4,20))/86400000;return {x:1,y:0,z:0,_lon:((bodyNames.indexOf(body)*30+137.5)+(speeds[body]||.1)*day+360)%360,_lat:bodyNames.indexOf(body)*.08}},Ecliptic(vector){return {elon:vector._lon,elat:vector._lat}},SearchSunLongitude(longitude,start){return {date:new Date(refs[longitude]||start)}},GeoMoonState(){return {x:1,y:0,z:0,vx:0,vy:1,vz:.1}},Rotation_EQJ_ECT(){return {}},RotateState(_rotation,state){return state}});
const astronomyModuleLoader=async()=>astronomyFixture;

const seedRows=[
  ['1984-01-17','07:45:00'],['1986-03-29','22:10:00'],['1988-05-11','14:25:00'],['1990-07-23','05:50:00'],
  ['1992-09-04','19:15:00'],['1994-11-16','11:40:00'],['1997-02-28','16:05:00'],['1999-12-09','00:30:00']
];
const intentRows=[
  {intentId:'DIRECTION',prompt:'What patterns matter most when choosing direction?'},
  {intentId:'WORK',prompt:'What is structurally relevant to work and resources?'},
  {intentId:'RELATIONSHIP',prompt:'What is structurally relevant to exchange and relationship?'},
  {intentId:'PRESSURE',prompt:'Where does pressure or regulation appear in the structure?'},
  {intentId:'EXPRESSION',prompt:'What stands out in expression and communication?'},
  {intentId:'ENVIRONMENT',prompt:'What environment-related pattern is structurally supported?'},
  {intentId:'OBSERVATION',prompt:'What should be observed and compared with reality?'},
  {intentId:'OPEN',prompt:'Give a broad structural reading without inventing missing meaning.'}
];
const longitudes=[15,48,82,137,201,245,303,351];
const targetDates=['2026-01-15','2026-03-20','2026-05-09','2026-07-18','2026-09-27','2026-11-05','2027-02-14','2027-06-30'];
const consent={recordId:'SMR-R2-DIVERSITY-CONSENT',granted:true,purposeCode:'SMR_R2_STRUCTURAL_DIVERSITY_CAMPAIGN',persistence:'NONE'};
function inputFor(index){const [birthDate,birthTime]=seedRows[index];return {birthDate,birthTime,birthPlace:{displayName:`Governed Diversity Fixture ${index+1}`,countryCode:'MY',latitude:3.139+(index*.11),longitude:101.6869-(index*.07)},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent,inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'}}
function utcIso(input){const [y,m,d]=input.birthDate.split('-').map(Number);const [hh,mm,ss]=input.birthTime.split(':').map(Number);return new Date(Date.UTC(y,m-1,d,hh-8,mm,ss)).toISOString()}
export const diversityCases=Object.freeze(Object.fromEntries(METHODS.map(methodId=>[methodId,Object.freeze(seedRows.map((_,index)=>{const input=inputFor(index);const caseId=`SMR-R2-${methodId}-DIVERSITY-${String(index+1).padStart(2,'0')}`;const executionParameters=methodId==='AST'?{houseSystemCode:index%2?'WHOLE_SIGN_V1':'PLACIDUS_V1'}:methodId==='BZR'?{traditionalCalculationSex:index%2?'MALE':'FEMALE'}:methodId==='NUM'?{targetDate:targetDates[index]}:methodId==='ECR'?{anchor:{utcIso:utcIso(input),longitude:longitudes[index],referenceFrame:'DIVERSITY_FIXTURE',engineCode:'SMR_R2_DIVERSITY',engineVersion:'1'}}:{};return Object.freeze({caseId,input,executionParameters,customerIntent:intentRows[index]})}))])));
const common=(caseId)=>({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',capability:'CALCULATION',purposeCode:'SMR_R2_STRUCTURAL_DIVERSITY_CAMPAIGN',consentRecordId:consent.recordId,requestId:caseId});

export async function projectionFor(methodId,c){
  if(methodId==='AST')return (await executeAndProjectAstV2({...common(c.caseId),methodCode:'ASTROLOGY',methodVersion:'0.1.0',canonicalInput:c.input,executionParameters:c.executionParameters},{astronomyModuleLoader})).canonicalProjection;
  if(methodId==='BZR')return (await executeAndProjectMcd5CurrentRequest({...common(c.caseId),methodCode:'BAZI',methodVersion:'0.1.0',canonicalInput:c.input,executionParameters:c.executionParameters},{astronomyModuleLoader})).canonicalProjection;
  if(methodId==='NUM')return (await executeAndProjectMcd5CurrentRequest({...common(c.caseId),methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',canonicalInput:c.input,executionParameters:c.executionParameters},{astronomyModuleLoader})).canonicalProjection;
  if(methodId==='ZWR'){
    const request={...common(c.caseId),methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',canonicalInput:c.input,executionParameters:{}};
    const response=await executeZiWei({request:new Request('https://phios.local/api/zi-wei-execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request)})});
    const payload=await response.json();if(!response.ok||payload?.ok!==true)throw new Error(`SMR_R2_ZWR_DIVERSITY_FAILED:${c.caseId}:${JSON.stringify(payload)}`);return payload.result;
  }
  if(methodId==='ECR')return await buildEcrCanonicalProjectionFromAnchor({canonicalInput:c.input,anchor:c.executionParameters.anchor,requestId:c.caseId});
  throw new Error(`SMR_R2_UNKNOWN_METHOD:${methodId}`);
}
function relationCounts(claims){const support=claims.filter(c=>c.claimType==='SUPPORT').length;const tension=claims.filter(c=>c.claimType==='TENSION').length;const conditional=claims.filter(c=>['CONDITION','TEMPORAL_ACTIVATION','TRADEOFF','OPEN'].includes(c.claimType)).length;return {support,tension,conditional,other:claims.length-support-tension-conditional}}
function countDuplicateText(ia){const texts=list(ia.sections).flatMap(s=>list(s.items)).map(i=>i.text).filter(Boolean);return texts.length-new Set(texts).size}
function orderedSignature(rows){return hash(rows)}
function methodNativeSignature(methodId,{projection,methodResult,envelope}){
  const vm=methodResult.visualModel||{};
  const nodes=list(vm.nodes).map(n=>[n.nodeId,n.role,n.value,n.priority]);
  const edges=list(vm.edges).map(e=>[e.relationType,e.sourceNodeId,e.targetNodeId]);
  return hash({methodId,projectionId:projection.projectionId||null,semanticDigest:methodResult.technical?.semanticDigest||null,readingAuthorityRef:envelope.readingAuthorityRef,nodes,edges});
}
export async function buildDiversityCase(methodId,c){
  const projection=await projectionFor(methodId,c);
  const methodResult=await buildAcceptedMethodCustomerResult({canonicalProjection:projection,locale:'en',requestedDepth:'STANDARD'});
  const envelope=adaptAcceptedMethodReadingEnvelope(methodResult,{expectedMethodId:methodId});
  const claims=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope,customerIntent:c.customerIntent});
  const priority=resolveCustomerPriorities({claimCollection:claims,customerIntent:c.customerIntent});
  const themes=composeCustomerThemes({priorityResolution:priority});
  const claimDedup=deduplicateClaims({claims:priority.claims});
  const informationGain=resolveSectionInformationGain({priorityResolution:priority,themeCollection:themes});
  const contradiction=preserveContradictions({priorityResolution:priority,themeCollection:themes,claimDedup});
  const narrative=buildCustomerNarrativeIR({priorityResolution:priority,themeCollection:themes,sectionInformationGain:informationGain,contradictionPreservation:contradiction});
  const ia=buildCustomerReadingIA({narrativeIR:narrative});
  const layout=buildCustomerReadingLayout({readingIA:ia});
  const relation=relationCounts(priority.claims);
  const row={
    schemaVersion:'PHI-OS-SMR-R2-DIVERSITY-CASE-v1.0.0',caseId:c.caseId,methodId,inputDigest:hash(c.input),intent:c.customerIntent,
    projectionId:projection.projectionId||null,semanticDigest:methodResult.technical?.semanticDigest||null,readingAuthorityRef:envelope.readingAuthorityRef,
    nativeStructureSignature:null,priorityProfileSignature:orderedSignature(priority.claims.map(x=>[x.semanticDimension,x.priorityClass,x.questionRelevance?.state])),
    themeDistributionSignature:orderedSignature(themes.themes.map(x=>[x.customerDomain,x.priorityClass,x.claimRefs.length])),
    supportTensionRatio:relation,supportTensionSignature:orderedSignature(relation),
    sectionEligibilityRefs:informationGain.eligibleSectionRefs,sectionEligibilitySignature:orderedSignature(informationGain.eligibleSectionRefs),
    counts:{claims:priority.claims.length,themes:themes.themes.length,eligibleSections:informationGain.eligibleSectionRefs.length,firstScreenBlocks:layout.firstScreen.blockCount,firstScreenThemes:layout.firstScreen.themeCount,renderedDuplicateTexts:countDuplicateText(ia)},
    governance:{inputStructurallyDistinct:true,sameChartDifferentQuestionCountedAsDiversity:false,rendererCreatesMeaning:false,rawProjectionCreatesCustomerConclusion:false,liveCustomerIndividuallyHumanReviewed:false}
  };
  row.nativeStructureSignature=methodNativeSignature(methodId,{projection,methodResult,envelope});
  return {row,projection,methodResult,envelope,claims,priority,themes,claimDedup,informationGain,contradiction,narrative,ia,layout};
}
export function campaignSummary(rows){
  const byMethod={};for(const methodId of METHODS){const m=rows.filter(r=>r.methodId===methodId);byMethod[methodId]={cases:m.length,uniqueInputDigests:new Set(m.map(r=>r.inputDigest)).size,uniqueNativeStructures:new Set(m.map(r=>r.nativeStructureSignature)).size,uniquePriorityProfiles:new Set(m.map(r=>r.priorityProfileSignature)).size,uniqueThemeDistributions:new Set(m.map(r=>r.themeDistributionSignature)).size,uniqueSupportTension:new Set(m.map(r=>r.supportTensionSignature)).size,uniqueSectionEligibility:new Set(m.map(r=>r.sectionEligibilitySignature)).size}}
  return {totalCases:rows.length,byMethod,global:{uniqueNativeStructures:new Set(rows.map(r=>r.nativeStructureSignature)).size,uniquePriorityProfiles:new Set(rows.map(r=>r.priorityProfileSignature)).size,uniqueThemeDistributions:new Set(rows.map(r=>r.themeDistributionSignature)).size,uniqueSupportTension:new Set(rows.map(r=>r.supportTensionSignature)).size,uniqueSectionEligibility:new Set(rows.map(r=>r.sectionEligibilitySignature)).size,duplicateRenderedTextCases:rows.filter(r=>r.counts.renderedDuplicateTexts>0).length,firstScreenOverflowCases:rows.filter(r=>r.counts.firstScreenBlocks>8||r.counts.firstScreenThemes>3).length}}
}
export function selectW19Cases(rows){const selected=[];for(const methodId of METHODS){const m=rows.filter(r=>r.methodId===methodId);const picks=[0,2,4,6].map(i=>m[i]).filter(Boolean);selected.push(...picks)}return selected}
export function stableCampaign(campaign){return JSON.parse(JSON.stringify(campaign))}
