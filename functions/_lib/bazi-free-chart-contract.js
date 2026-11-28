import {BAZI_FULL_PRODUCTION_GATE as sourceGate} from '../bzr-full-production/bazi-production-gate-runtime.js';
import {maintenanceMode} from './d1-maintenance-guard.js';
export function baziFreeChartCapability(env={},gate=sourceGate){
 const mode=maintenanceMode(env.PHIOS_D1_MAINTENANCE_MODE);
 return gate.productionAllowed===true&&gate.customerPublishable===true&&gate.defaultCustomerSurfaceAllowed===true&&(mode==='OFF'||mode==='READ_ONLY'&&typeof env.RUNTIME_DB?.prepare==='function');
}
export function baziFreeChartRequest(body){
 if(!body||typeof body!=='object'||Array.isArray(body))return false;
 const allowed=['reportSubjectName','birthDate','birthTime','birthTimeUnknown','placeRef','intent','methods','traditionalCalculationSex','numerologyTargetDate','numerologyFullBirthName','numerologyNameConfirmed','numerologyComparisonBirthDate','astTargetContext','baziTemporalContext','ziweiTargetPlaceRef','ziweiTargetDate','ziweiTargetTime','ziweiTargetTimezoneIana','ziweiTargetUtcOffset','ziweiTargetContextSource','ecrTargetContext','hdrTargetContext','birthLocationSnapshot','confirmedExternalProfile','externalProfileContextConsent','consent','locale'];
 const empty=v=>v==null||v==='';
 const unused=['intent','numerologyTargetDate','numerologyFullBirthName','numerologyComparisonBirthDate','astTargetContext','baziTemporalContext','ziweiTargetPlaceRef','ziweiTargetDate','ziweiTargetTime','ziweiTargetTimezoneIana','ziweiTargetUtcOffset','ziweiTargetContextSource','ecrTargetContext','hdrTargetContext','confirmedExternalProfile'];
 const only=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
 const snapshot=body.birthLocationSnapshot;
 if(!only(snapshot,['schemaVersion','state','binding','location'])||!only(snapshot.binding,['birthDate','birthTime'])||!only(snapshot.location,['provider','providerRef','state','displayName','customerLabel','localizedName','englishName','countryCode','country','region','locality','latitude','longitude','timezone'])||!only(snapshot.location.timezone,['iana','utcOffsetAtBirth','historicalOffsetMinutes','source','confidence']))return false;
 return Object.keys(body).every(k=>allowed.includes(k))&&unused.every(k=>empty(body[k]))&&Array.isArray(body.methods)&&body.methods.length===1&&body.methods[0]==='bazi'&&body.consent===true&&['en','zh-Hans'].includes(body.locale)&&typeof body.birthDate==='string'&&body.birthDate.length<=10&&(empty(body.birthTime)||typeof body.birthTime==='string'&&body.birthTime.length<=8)&&!(body.birthTimeUnknown===true&&!empty(body.birthTime))&&(body.birthTimeUnknown===undefined||typeof body.birthTimeUnknown==='boolean')&&typeof body.placeRef==='string'&&/^[NWR]\d{1,20}$/.test(body.placeRef)&&snapshot.schemaVersion==='PHI-OS-CONFIRMED-BIRTH-LOCATION-SNAPSHOT-v1.0.0'&&(empty(body.reportSubjectName)||typeof body.reportSubjectName==='string'&&body.reportSubjectName.length<=120)&&(body.numerologyNameConfirmed===undefined||body.numerologyNameConfirmed===false)&&(body.externalProfileContextConsent===undefined||body.externalProfileContextConsent===false)&&(empty(body.traditionalCalculationSex)||['MALE','FEMALE'].includes(body.traditionalCalculationSex));
}
