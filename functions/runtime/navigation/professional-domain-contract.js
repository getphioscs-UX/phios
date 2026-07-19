/** PHI OS Professional Boundary Layer — domain-neutral contract. */
export const PROFESSIONAL_DOMAIN_CONTRACT_VERSION = 'phi-os.professional-domain-contract.v1';

const cleanText=value=>typeof value==='string'?value.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim():'';
const list=value=>Array.isArray(value)?value:[];
const unique=(values,max=Infinity)=>{const out=[];const seen=new Set();for(const value of list(values)){const text=cleanText(value?.statement||value?.summary||value);const key=text.toLowerCase();if(!text||seen.has(key))continue;seen.add(key);out.push(text);if(out.length>=max)break;}return out;};

export function createProfessionalDomainContract(source={}) {
  return {
    schemaVersion: PROFESSIONAL_DOMAIN_CONTRACT_VERSION,
    domainId: cleanText(source.domainId),
    domainName: cleanText(source.domainName),
    version: cleanText(source.version) || 'v1',
    reviewMayHelp: source.reviewMayHelp === true,
    reasons: unique(source.reasons, 8),
    entryCriteria: unique(source.entryCriteria, 10),
    preparationChecklist: unique(source.preparationChecklist, 12),
    unknownReality: unique(source.unknownReality, 12),
    excludedServices: unique(source.excludedServices, 12),
    consentRequired: source.consentRequired !== false,
    professionalReviewOnly: source.professionalReviewOnly !== false,
    sensitiveDataCollection: false,
    uploadEnabled: false,
    conclusionsProvided: false,
    consent: {
      accepted: false,
      acceptedAt: '',
      source: ''
    }
  };
}

export function validateProfessionalDomainContract(contract) {
  const errors=[];
  if(!contract||typeof contract!=='object')return {valid:false,errors:['Contract must be an object.']};
  if(contract.schemaVersion!==PROFESSIONAL_DOMAIN_CONTRACT_VERSION)errors.push('schemaVersion is invalid.');
  if(!cleanText(contract.domainId))errors.push('domainId is required.');
  if(!cleanText(contract.domainName))errors.push('domainName is required.');
  if(!Array.isArray(contract.preparationChecklist))errors.push('preparationChecklist must be an array.');
  if(!Array.isArray(contract.unknownReality))errors.push('unknownReality must be an array.');
  if(!Array.isArray(contract.excludedServices))errors.push('excludedServices must be an array.');
  if(contract.sensitiveDataCollection!==false)errors.push('sensitiveDataCollection must remain false.');
  if(contract.uploadEnabled!==false)errors.push('uploadEnabled must remain false.');
  if(contract.conclusionsProvided!==false)errors.push('conclusionsProvided must remain false.');
  return {valid:errors.length===0,errors};
}

export default createProfessionalDomainContract;
