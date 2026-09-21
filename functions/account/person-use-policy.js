// Reference-layer admission under RDG. Domain runtime permission checks remain
// mandatory after this decision; callers must load consent evidence server-side.
const fields={
 PERSONAL_METHOD:['personId','displayName','birthDate','birthTime','birthTimePrecision','birthPlace'],
 RELATIONSHIP_READING:['personId','displayName','relationshipToAccountOwner','birthDate','birthTime','birthTimePrecision','birthPlace'],
 FINANCIAL_PLANNING:['personId','displayName','birthDate','minorOrDependentState'],
 WILL_ASSEMBLY:['personId','displayName'],
 PROFESSIONAL_REVIEW:['personId','displayName'],REPORT:['personId','displayName'],
 TAROT_CONTEXT:['personId','displayName','relationshipToAccountOwner'],ICHING_CONTEXT:['personId','displayName','relationshipToAccountOwner'],ASK_PERSONALIZATION:['personId','displayName']
};
export function admitPersonUse({userId,person,consent,purpose,requiredFields=['personId','displayName'],authority={},now=Date.now()}={}){
 const deny=()=>{throw new Error('PERSON_USE_DENIED');};
 if(!userId||person?.accountOwnerUserId!==userId||!fields[purpose]||!consent||consent.personId!==person.personId||consent.purposeScope!==purpose||consent.revocationState!=='ACTIVE'||!consent.consentId||!consent.consentVersion||!consent.grantingSubjectReference||!consent.authorityBasis)return deny();
 if(!Number.isFinite(Date.parse(consent.grantedAt))||Date.parse(consent.grantedAt)>now||!(Date.parse(consent.expiresAt)>now))return deny();
 if(!Array.isArray(consent.dataScopes)||consent.dataScopes.some(k=>!fields[purpose].includes(k))||!Array.isArray(requiredFields)||requiredFields.some(k=>!fields[purpose].includes(k)||!consent.dataScopes.includes(k)))return deny();
 if(person.subjectClass==='SELF'&&consent.grantingSubjectReference!==userId)return deny();
 if(person.subjectClass==='DEPENDENT'&&authority.guardianAuthorityRecorded!==true)return deny();
 if(person.subjectClass!=='SELF'&&purpose==='FINANCIAL_PLANNING'&&person.subjectClass!=='DEPENDENT'&&authority.adultSubjectConsentVerified!==true)return deny();
 if(purpose==='RELATIONSHIP_READING'&&authority.bilateralActiveConsentVerified!==true)return deny();
 if(!['SELF','DEPENDENT','DECLARED_THIRD_PARTY','LINKED_ADULT_ACCOUNT'].includes(person.subjectClass))return deny();
 return Object.freeze(Object.fromEntries(requiredFields.filter(k=>person[k]!==undefined).map(k=>[k,person[k]])));
}
export function assertNoPersistedIdentity(value){
 if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){
  if(/^(idnumber|identitynumber|nationalid|passportnumber|fullidentitynumber)$/.test(key.toLowerCase().replace(/[^a-z]/g,'')))throw new Error('FULL_IDENTITY_PERSISTENCE_FORBIDDEN');
  assertNoPersistedIdentity(item);
 }
}
