// Neutral extension boundary of the existing Shared Astronomy provider layer.
// No ephemeris algorithm, method interpretation, or customer input is owned here.
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

export const SHARED_MINOR_BODY_CAPABILITY = 'SHARED_ASTRONOMY_MINOR_BODY_POSITION_V1';
export const CHIRON_BODY_IDENTITY = Object.freeze({bodyCode:'CHIRON',canonicalName:'Chiron',
  astronomicalObject:'2060 Chiron',taxonomy:'CENTAUR / MINOR_BODY',majorPlanet:false});
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const failureStatuses = new Set(['UNSUPPORTED_DATE','PROVIDER_ERROR','EPHEMERIS_DATA_MISSING']);

// Provider injection is server-side infrastructure only. There is deliberately no
// default provider until license, precision, data and runtime acceptance is frozen.
export function createSharedMinorBodyCapability({provider=null,admission=null}={}) {
  return Object.freeze({capabilityCode:SHARED_MINOR_BODY_CAPABILITY,
    async positionAt({bodyCode,instantUtc}={}) {
      const valid = bodyCode==='CHIRON' && typeof instantUtc==='string' && UTC.test(instantUtc)
        && Number.isFinite(Date.parse(instantUtc))
        && new Date(instantUtc).toISOString().slice(0,19)===instantUtc.slice(0,19);
      const canonicalInstant=valid?new Date(instantUtc).toISOString():null;
      const inputHash=await sha256Stable({bodyCode:bodyCode==='CHIRON'?bodyCode:null,instantUtc:canonicalInstant});
      const finish=async(calculationStatus,position=null,warnings=[])=>{
        const result={schemaVersion:'AstronomyBodyPositionV1',authority:SHARED_MINOR_BODY_CAPABILITY,
          bodyCode:'CHIRON',instantUtc:canonicalInstant,calculationStatus,position,warnings,inputHash};
        return deepFreeze({...result,outputDigest:await sha256Stable(result)});
      };
      if(!valid)return finish('INVALID_INPUT');
      const gates=['licenseAccepted','runtimeAccepted','precisionAccepted','independentValidationAccepted','dataAccepted'];
      if(!provider || admission?.status!=='FROZEN' || !gates.every(g=>admission[g]===true))
        return finish('EPHEMERIS_DATA_MISSING',null,['CHIRON_PROVIDER_NOT_ADMITTED']);
      if(provider.providerCode!==admission.providerCode || provider.providerVersion!==admission.providerVersion)
        return finish('PROVIDER_ERROR',null,['PROVIDER_ADMISSION_MISMATCH']);
      const t=Date.parse(canonicalInstant),lo=Date.parse(admission.startUtc),hi=Date.parse(admission.endUtc);
      if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>hi)return finish('PROVIDER_ERROR',null,['INVALID_SUPPORTED_RANGE']);
      if(t<lo||t>hi)return finish('UNSUPPORTED_DATE');
      try {
        const raw=await provider.positionAt({bodyCode:'CHIRON',instantUtc:canonicalInstant});
        if(failureStatuses.has(raw?.calculationStatus))return finish(raw.calculationStatus);
        if(raw?.calculationStatus!=='SUPPORTED' || raw.bodyCode!=='CHIRON' || raw.instantUtc!==canonicalInstant
          || raw.observerMode!=='GEOCENTRIC' || raw.coordinateSystem!=='ECLIPTIC'
          || raw.coordinateFrame!==admission.coordinateFrame || raw.providerCode!==provider.providerCode
          || raw.providerVersion!==provider.providerVersion || typeof raw.ephemerisMode!=='string' || !raw.ephemerisMode
          || !['longitudeDeg','latitudeDeg','longitudeSpeedDegPerDay','distanceAu','julianDayUt'].every(k=>Number.isFinite(raw[k]))
          || Math.abs(raw.latitudeDeg)>90 || raw.distanceAu<=0
          || Math.abs(raw.julianDayUt-(t/86400000+2440587.5))>1e-8)
          return finish('PROVIDER_ERROR',null,['INVALID_PROVIDER_OUTPUT']);
        const position={bodyCode:'CHIRON',instantUtc:canonicalInstant,julianDayUt:raw.julianDayUt,
          observerMode:'GEOCENTRIC',coordinateFrame:raw.coordinateFrame,coordinateSystem:'ECLIPTIC',
          longitudeDeg:((raw.longitudeDeg%360)+360)%360,latitudeDeg:raw.latitudeDeg,
          longitudeSpeedDegPerDay:raw.longitudeSpeedDegPerDay,retrograde:raw.longitudeSpeedDegPerDay<0,
          distanceAu:raw.distanceAu,providerCode:raw.providerCode,providerVersion:raw.providerVersion,ephemerisMode:raw.ephemerisMode};
        return finish('SUPPORTED',position);
      } catch { return finish('PROVIDER_ERROR'); }
    }
  });
}
