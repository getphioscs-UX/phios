import fs from 'node:fs';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';
import {executeAndProjectMcd5CurrentRequest} from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import {onRequestPost as executeZiWei} from '../functions/api/zi-wei-execute.js';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const refs={285:'1989-01-05T08:45:57.000Z',315:'1989-02-03T20:27:10.000Z',345:'1989-03-05T14:34:09.000Z',15:'1989-04-04T19:29:54.000Z',45:'1989-05-05T12:53:55.000Z',75:'1989-06-05T17:05:13.000Z',105:'1989-07-07T03:19:26.000Z',135:'1989-08-07T13:03:53.000Z',165:'1989-09-07T15:53:54.000Z',195:'1989-10-08T07:27:19.000Z',225:'1989-11-07T10:33:32.000Z',255:'1989-12-07T03:20:57.000Z'};
const speeds={Sun:1,Moon:13,Mercury:-.2,Venus:1.1,Mars:.5,Jupiter:.08,Saturn:.03,Uranus:.01,Neptune:.006,Pluto:.004};
const bodyNames=Object.keys(speeds);
const astronomyFixture=Object.freeze({
  Body:Object.freeze(Object.fromEntries(bodyNames.map(name=>[name,name]))),
  MakeTime(date){const ut=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;return {ut,tt:ut+64/86400,date}},
  GeoVector(body,date){const day=(date.getTime()-Date.UTC(1989,10,15,14,50))/86400000;return {x:1,y:0,z:0,_lon:((bodyNames.indexOf(body)*30+232.5)+(speeds[body]||.1)*day+360)%360,_lat:bodyNames.indexOf(body)*.1}},
  Ecliptic(vector){return {elon:vector._lon,elat:vector._lat}},
  SearchSunLongitude(longitude,start){return {date:new Date(refs[longitude]||start)}},
  GeoMoonState(){return {x:1,y:0,z:0,vx:0,vy:1,vz:.1}},Rotation_EQJ_ECT(){return {}},RotateState(_rotation,state){return state}
});
const astronomyModuleLoader=async()=>astronomyFixture;
const astInput=read('content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json').input;
const canonicalBase={...astInput,consent:{recordId:'SMR-CAMPAIGN-CONSENT',granted:true,purposeCode:'SMR_MACHINE_AND_REVIEW_CAMPAIGN',persistence:'NONE'}};
const ziWeiInput={birthDate:'2023-01-22',birthTime:'05:00:00',birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_FIXTURE',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'SMR-CAMPAIGN-CONSENT',granted:true,purposeCode:'SMR_MACHINE_AND_REVIEW_CAMPAIGN',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};

async function projection(methodId){
  const common={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',capability:'CALCULATION',purposeCode:'SMR_MACHINE_AND_REVIEW_CAMPAIGN',consentRecordId:'SMR-CAMPAIGN-CONSENT',requestId:`SMR-${methodId}-FIXTURE`};
  if(methodId==='AST')return (await executeAndProjectAstV2({...common,methodCode:'ASTROLOGY',methodVersion:'0.1.0',canonicalInput:canonicalBase,executionParameters:{houseSystemCode:'PLACIDUS_V1'}},{astronomyModuleLoader})).canonicalProjection;
  if(methodId==='BZR')return (await executeAndProjectMcd5CurrentRequest({...common,methodCode:'BAZI',methodVersion:'0.1.0',canonicalInput:canonicalBase,executionParameters:{traditionalCalculationSex:'FEMALE'}},{astronomyModuleLoader})).canonicalProjection;
  if(methodId==='NUM')return (await executeAndProjectMcd5CurrentRequest({...common,methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',canonicalInput:{...canonicalBase,birthDate:'1990-01-15'},executionParameters:{targetDate:'2026-08-28'}},{astronomyModuleLoader})).canonicalProjection;
  const request={...common,methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',canonicalInput:ziWeiInput,executionParameters:{}};
  const response=await executeZiWei({request:new Request('https://phios.local/api/zi-wei-execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request)})});
  const payload=await response.json();
  if(!response.ok||payload?.ok!==true)throw new Error(`SMR_ZWR_REGRESSION_FIXTURE_FAILED:${JSON.stringify(payload)}`);
  return payload.result;
}
const projectionCache=new Map(),resultCache=new Map();
export async function acceptedSmrInput(methodId,locale='en'){
  if(!projectionCache.has(methodId))projectionCache.set(methodId,await projection(methodId));
  const key=`${methodId}:${locale}`;
  if(!resultCache.has(key))resultCache.set(key,{methodResult:await buildAcceptedMethodCustomerResult({canonicalProjection:projectionCache.get(methodId),locale,requestedDepth:'STANDARD'})});
  return resultCache.get(key);
}
export const SMR_METHODS=Object.freeze(['AST','BZR','NUM','ZWR']);
