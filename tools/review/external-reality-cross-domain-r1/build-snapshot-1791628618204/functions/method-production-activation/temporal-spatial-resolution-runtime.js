import { sha256, stableSerialize } from '../method-runtime/shared-calculation-runtime.js';
function assertAdapter(adapter,label,fn){if(!adapter||typeof adapter!=='object'||typeof adapter[fn]!=='function'||typeof adapter.adapterCode!=='string'||typeof adapter.adapterVersion!=='string'||adapter.deterministic!==true||adapter.aiUsed===true||adapter.providerAuthorityUsed===true)throw new TypeError(`${label} governed deterministic adapter is required.`);}
function finiteCoord(c){return c&&Number.isFinite(c.latitude)&&c.latitude>=-90&&c.latitude<=90&&Number.isFinite(c.longitude)&&c.longitude>=-180&&c.longitude<=180;}
export function createTemporalSpatialResolutionRuntime({timezoneResolver,coordinateResolver,calendarResolver,trueSolarResolver}={}){
  assertAdapter(timezoneResolver,'Timezone','resolve'); assertAdapter(coordinateResolver,'Coordinate','resolve'); assertAdapter(calendarResolver,'Calendar','resolve'); assertAdapter(trueSolarResolver,'True solar','resolve');
  return Object.freeze({
    runtimeCode:'MPA_TEMPORAL_SPATIAL_RESOLUTION_RUNTIME',runtimeVersion:'1.0.0',
    async resolve({resolutionId,birthInitialization,methodPolicy,policyVersion}={}){
      if(!birthInitialization||birthInitialization.schemaVersion!=='PHI-OS-MPA-BIRTH-INITIALIZATION-DATA-v1.0.0')throw new TypeError('Canonical birth initialization required.');
      if(!methodPolicy||typeof methodPolicy!=='object'||!policyVersion)throw new TypeError('methodPolicy and policyVersion required.');
      if(birthInitialization.fabricatedDefaultsUsed!==false)throw new Error('FABRICATED_DEFAULT_FORBIDDEN');
      const date=birthInitialization.birthDate?.value, time=birthInitialization.birthTime?.value, place=birthInitialization.birthPlace?.value; const knownTime=birthInitialization.birthTime?.precision!=='unknown'&&!!time;
      if(!date)throw new Error('BIRTH_DATE_UNRESOLVED'); if(methodPolicy.timeRequired===true&&!knownTime)throw new Error('BIRTH_TIME_REQUIRED'); if(methodPolicy.placeRequired===true&&!place)throw new Error('BIRTH_PLACE_REQUIRED');
      let coordinates=null; if(birthInitialization.coordinates?.resolutionStatus==='DECLARED'){coordinates={latitude:birthInitialization.coordinates.latitude,longitude:birthInitialization.coordinates.longitude,elevationM:birthInitialization.coordinates.elevationM,accuracyM:birthInitialization.coordinates.accuracyM,authorityCode:'DECLARED_COORDINATE',authorityVersion:'1.0.0'};} else if(place){coordinates=await coordinateResolver.resolve({placeName:place,policyVersion});}
      if(coordinates&&!finiteCoord(coordinates))throw new Error('COORDINATE_RESOLUTION_INVALID'); if(methodPolicy.coordinatesRequired===true&&!coordinates)throw new Error('COORDINATES_REQUIRED');
      const declaredZone=birthInitialization.timezone?.ianaZoneId??null;
      let timezone=null;
      if(declaredZone||knownTime||methodPolicy.timezoneRequired===true){
        if(!declaredZone && methodPolicy.timezoneRequired===true) throw new Error('TIMEZONE_REQUIRED');
        timezone=await timezoneResolver.resolve({localDate:date,localTime:knownTime?time:null,placeName:place,declaredIanaZoneId:declaredZone,coordinates,policyVersion});
        if(!timezone||timezone.authorityCode!=='IANA_TZDB'||!timezone.authorityVersion||!timezone.ianaZoneId)throw new Error('TIMEZONE_RESOLUTION_INVALID');
        if(knownTime){if(typeof timezone.utcIso!=='string'||Number.isNaN(Date.parse(timezone.utcIso))||!Number.isFinite(timezone.utcOffsetMinutes)||typeof timezone.isDst!=='boolean'||!Number.isFinite(timezone.dstOffsetMinutes))throw new Error('HISTORICAL_TIMEZONE_DST_UNRESOLVED');}
        else if(timezone.utcIso!==null)throw new Error('UNKNOWN_TIME_MUST_NOT_CREATE_UTC_INSTANT');
      }
      const calendar=await calendarResolver.resolve({localDate:date,utcIso:timezone?.utcIso??null,calendarCode:methodPolicy.calendarCode,policyVersion}); if(!calendar||!calendar.authorityCode||!calendar.authorityVersion||!calendar.dateBoundaryPolicy)throw new Error('CALENDAR_RESOLUTION_INVALID');
      let solar=null; const limitations=[]; if(methodPolicy.trueSolarRequired===true){if(knownTime&&coordinates){solar=await trueSolarResolver.resolve({localDate:date,localTime:time,utcIso:timezone.utcIso,timezone,coordinates,policyVersion});if(!solar||solar.deterministic!==true||!solar.algorithmVersion)throw new Error('TRUE_SOLAR_RESOLUTION_INVALID');}else limitations.push('TRUE_SOLAR_TIME_UNRESOLVED');}
      if(!knownTime)limitations.push('BIRTH_TIME_UNKNOWN'); if(!coordinates)limitations.push('COORDINATES_UNRESOLVED');
      const status=!knownTime?'PARTIAL_DATE_ONLY':(methodPolicy.coordinatesRequired===true&&!coordinates?'UNRESOLVED':'FULLY_RESOLVED');
      const canonicalInput={initializationId:birthInitialization.initializationId,methodCode:birthInitialization.methodCode,policyVersion,date,time:knownTime?time:null,place,declaredTimezone:birthInitialization.timezone?.ianaZoneId??null,declaredCoordinates:birthInitialization.coordinates}; const inputDigest=await sha256(canonicalInput);
      const payload={resolutionId,initializationId:birthInitialization.initializationId,methodCode:birthInitialization.methodCode,policyVersion,resolvedTimezone:timezone?Object.freeze({...timezone}):null,resolvedCoordinates:coordinates?Object.freeze({...coordinates}):null,resolvedCalendar:Object.freeze({...calendar}),resolvedTrueSolarContext:solar?Object.freeze({...solar}):null,utcInstant:knownTime?new Date(timezone.utcIso).toISOString():null,resolutionStatus:status,limitations:Object.freeze([...new Set(limitations)].sort()),inputDigest,deterministic:true,aiUsed:false,providerAuthorityUsed:false,fabricatedDefaultsUsed:false,methodCalculationCreated:false};
      const outputDigest=await sha256(payload); return Object.freeze({schemaVersion:'PHI-OS-MPA-RESOLVED-METHOD-CONTEXT-v1.0.0',...payload,outputDigest});
    }
  });
}
export default Object.freeze({createTemporalSpatialResolutionRuntime});
