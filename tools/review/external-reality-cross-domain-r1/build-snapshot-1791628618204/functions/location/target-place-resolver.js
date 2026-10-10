import {resolveBirthPlace} from './place-resolver.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

/**
 * Reuses the governed place + timezone providers for a customer-confirmed
 * target moment. The underlying resolver accepts a civil date/time so its
 * offset calculation observes the target location's daylight-saving rules.
 */
export async function resolveTargetPlace(providerRef,{targetDate=null,targetTime=null,locale='en',env={}}={}){
  const location=await resolveBirthPlace(providerRef,{birthDate:targetDate,birthTime:targetTime,locale,env});
  return freeze({
    provider:location.provider,
    providerRef:location.providerRef,
    state:location.state,
    displayName:location.displayName,
    customerLabel:location.customerLabel,
    localizedName:location.localizedName,
    englishName:location.englishName,
    countryCode:location.countryCode,
    country:location.country,
    region:location.region,
    locality:location.locality,
    latitude:location.latitude,
    longitude:location.longitude,
    targetTimezone:freeze({
      iana:location.timezone.iana,
      utcOffsetAtTarget:location.timezone.utcOffsetAtBirth,
      source:'GOVERNED_LOCATION_RESOLUTION',
      confidence:location.timezone.confidence
    })
  });
}

export default Object.freeze({resolveTargetPlace});
