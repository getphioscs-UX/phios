import {sealCanonicalPersonReportSource,openCanonicalPersonReportSource} from '../account/canonical-person-store.js';
import {normalizeConfirmedHumanDesignContextProfile,buildConfirmedHumanDesignContextTransport} from '../external-profile/human-design-context-transport.js';
import {EXTERNAL_PROFILE_CORE_FIELDS,EXTERNAL_PROFILE_STRUCTURAL_FIELDS} from '../external-profile/external-profile-confirmation.js';
import {EXTERNAL_PROFILE_MANUAL_FIELDS} from '../external-profile/external-profile-contract.js';
const sourceType='HD_CUSTOMER_CONFIRMED_EXTERNAL_CHART';
const fields=new Set([...EXTERNAL_PROFILE_CORE_FIELDS,...EXTERNAL_PROFILE_STRUCTURAL_FIELDS,...EXTERNAL_PROFILE_MANUAL_FIELDS]);
function externalSource(profile){const normalized=normalizeConfirmedHumanDesignContextProfile(profile);if(normalized.records.some(r=>!fields.has(r.field)||/PHIOS_HDR_INTERNAL|INTERNAL_CALCULATION|CALCULATED_REFERENCE/.test(String(r.sourceType)+' '+String(r.priorSource))))throw Error('HD_PAID_SOURCE_EXTERNAL_ONLY_REQUIRED');return normalized;}
export async function prepareOwnedHumanDesignReportSource(context,{personId,confirmedExternalProfile,sourceUseConsent}){
 const profile=externalSource(confirmedExternalProfile);
 const sourceToken=await sealCanonicalPersonReportSource(context,{personId,sourceType,sourceSnapshot:profile,sourceUseConsent});
 return Object.freeze({methodCode:'HD',personId,profileDigest:profile.profileDigest,sourceToken,chartAuthority:'CUSTOMER_CONFIRMED_EXTERNAL_ONLY',commercialAdmission:false});
}
export async function loadOwnedHumanDesignReportSource(context,{personId,sourceToken,locale='en'}){
 const owned=await openCanonicalPersonReportSource(context,{personId,sourceType,token:sourceToken});
 const profile=externalSource(owned.sourceSnapshot);
 if(!Number.isFinite(Date.parse(profile.confirmedAt)))throw Error('HD_CONFIRMED_SOURCE_TIME_REQUIRED');
 const transport=buildConfirmedHumanDesignContextTransport(profile,{locale,generatedAt:profile.confirmedAt});
 return Object.freeze({...owned,profileDigest:profile.profileDigest,transport,chartAuthority:'CUSTOMER_CONFIRMED_EXTERNAL_ONLY',fullReportPublicationAdmitted:false});
}
