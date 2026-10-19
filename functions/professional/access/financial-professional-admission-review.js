import {sha256Hex} from '../../document-assembly/digest.js';
import {evaluateProfessionalEligibility} from './professional-eligibility-contract.js';
import {evaluateProfessionalAuthorisation} from './professional-authorisation-decision.js';
// Structural review only. No identity/qualification/consent is admitted here.
export function reviewFinancialProfessionalAdmission(candidate,{now=new Date().toISOString()}={}){
 const value=structuredClone(candidate?.payload||{}),missing=[];
 for(const field of ['identity','credentials','capabilities','assignment','consent','request','verifiedJurisdictionScopes','verifiedServiceScopes'])if(!value[field])missing.push(field);
 for(const field of ['identity','qualification','assignment','consent'])if(!candidate?.ownerEvidence?.[field]?.receiptRef)missing.push('ownerEvidence.'+field);
 for(const field of ['verifiedJurisdictionScopes','verifiedServiceScopes'])if(!Array.isArray(value[field])||!value[field].length||Array.from(value[field]).some(v=>typeof v!=='string'||!v.trim()||v==='*'))missing.push(field);
 if(Date.parse(candidate?.effectiveAt)>=Date.parse(candidate?.expiresAt))missing.push('validityInterval');
 for(const field of ['effectiveAt','expiresAt'])if(!Number.isFinite(Date.parse(candidate?.[field])))missing.push(field);
 if(Date.parse(candidate?.expiresAt)<=Date.parse(now))missing.push('currentValidity');
 const eligibility=evaluateProfessionalEligibility({professional_id:value.identity?.professional_id,required_capability_codes:value.assignment?.required_capability_codes,credentials:value.credentials,capabilities:value.capabilities},{now});
 const decision=evaluateProfessionalAuthorisation({...value,eligibility},{now});
 return {contract:'FINANCIAL_PROFESSIONAL_ADMISSION_REVIEW_V1',candidateDigest:sha256Hex(candidate),evaluatedAt:now,structuralStatus:!missing.length&&decision.allowed?'READY_FOR_OWNER_REVIEW':'INCOMPLETE',missing,denials:decision.denial_reasons.map(r=>r.code),professionalId:value.identity?.professional_id||null,subjectAccountRef:value.identity?.subject_id||null,jurisdictionScopes:value.verifiedJurisdictionScopes||[],serviceScopes:value.verifiedServiceScopes||[],evidenceVerified:false,qualificationAdmitted:false,authorityWrite:false,productionReady:false,requiredNext:'Canonical identity/qualification/assignment/consent owners must independently verify supplied evidence before controlled admission.'};
}
