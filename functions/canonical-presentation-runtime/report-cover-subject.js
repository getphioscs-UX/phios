import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
import {validateCanonicalBirthInput} from '../method-client-delivery/canonical-birth-input-runtime.js';
function text(v){return String(v??'').trim();}
export async function createReportSubjectPresentation({subjectReference,displayName,canonicalBirthInput,identitySourceRef,birthSourceRef,allowMissingName=false}={}){
 const subjectRef=text(subjectReference),name=text(displayName);
 if(!subjectRef)throw Error('REPORT_SUBJECT_REFERENCE_REQUIRED');
 if(!name&&!allowMissingName)throw Error('REPORT_SUBJECT_DISPLAY_NAME_REQUIRED');
 if(!text(identitySourceRef)||!text(birthSourceRef))throw Error('REPORT_SUBJECT_SOURCE_REFS_REQUIRED');
 const valid=validateCanonicalBirthInput(canonicalBirthInput);
 if(!valid.valid)throw Object.assign(new Error('REPORT_SUBJECT_BIRTH_INPUT_INVALID'),{reasonCodes:valid.reasonCodes});
 const seed={subjectReference:subjectRef,displayName:name||null,birthDate:canonicalBirthInput.birthDate,birthTime:canonicalBirthInput.birthTime,timeAccuracy:canonicalBirthInput.timeAccuracy,identitySourceRef:text(identitySourceRef),birthSourceRef:text(birthSourceRef)};
 const subjectFingerprint=await sha256Stable(seed);
 return deepFreeze({schemaVersion:'PHI-OS-REPORT-SUBJECT-PRESENTATION-v1.0.0',subjectReference:subjectRef,displayName:name||null,birthDate:canonicalBirthInput.birthDate,birthTime:canonicalBirthInput.birthTime,timeAccuracy:canonicalBirthInput.timeAccuracy,locale:canonicalBirthInput.locale,identitySourceRef:seed.identitySourceRef,birthSourceRef:seed.birthSourceRef,subjectFingerprint});
}
export function assertReportSubjectMatch({presentation,subjectReference,birthDate,birthTime,timeAccuracy}={}){
 if(presentation?.schemaVersion!=='PHI-OS-REPORT-SUBJECT-PRESENTATION-v1.0.0')throw Error('REPORT_SUBJECT_PRESENTATION_REQUIRED');
 if(subjectReference&&presentation.subjectReference!==subjectReference)throw Error('COVER_SUBJECT_MISMATCH');
 if(birthDate!==undefined&&presentation.birthDate!==birthDate)throw Error('COVER_BIRTH_DATE_MISMATCH');
 if(birthTime!==undefined&&presentation.birthTime!==birthTime)throw Error('COVER_BIRTH_TIME_MISMATCH');
 if(timeAccuracy==='UNKNOWN'&&presentation.birthTime!==null)throw Error('COVER_UNKNOWN_TIME_FABRICATED');
 if(timeAccuracy!==undefined&&presentation.timeAccuracy!==timeAccuracy)throw Error('COVER_TIME_ACCURACY_MISMATCH');
 return true;
}

// expectedBinding must come from the report's trusted input/snapshot owner.
// Never derive expected fingerprints from the supplied overlay itself.
export async function assertReportSubjectBinding({presentation,expectedBinding}={}){
 if(!expectedBinding?.subjectReference||!expectedBinding.inputSubjectFingerprint||!expectedBinding.semanticSubjectFingerprint)throw Error('REPORT_SUBJECT_MATCH_REQUIRED');
 assertReportSubjectMatch({presentation,...expectedBinding});
 const keys=['subjectReference','displayName','birthDate','birthTime','timeAccuracy','identitySourceRef','birthSourceRef'];
 const fingerprint=await sha256Stable(Object.fromEntries(keys.map(k=>[k,presentation[k]])));
 if(fingerprint!==presentation.subjectFingerprint||fingerprint!==expectedBinding.inputSubjectFingerprint||fingerprint!==expectedBinding.semanticSubjectFingerprint)throw Error('COVER_SUBJECT_MISMATCH');
 return true;
}

export async function createReportSubjectPresentationFromAccountPerson({accountPersonReference,canonicalBirthInput,birthSourceRef}={}){
 if(!accountPersonReference||typeof accountPersonReference!=='object')throw Error('REPORT_SUBJECT_ACCOUNT_PERSON_REFERENCE_REQUIRED');
 const personId=text(accountPersonReference.personId),displayName=text(accountPersonReference.displayName);
 if(!personId)throw Error('REPORT_SUBJECT_PERSON_ID_REQUIRED');
 if(!displayName)throw Error('REPORT_SUBJECT_DISPLAY_NAME_REQUIRED');
 return createReportSubjectPresentation({
  subjectReference:personId,
  displayName,
  canonicalBirthInput,
  identitySourceRef:'RDG_ACCOUNT_PERSON_REFERENCE:'+personId,
  birthSourceRef:text(birthSourceRef)||'MCD3_CANONICAL_BIRTH_INPUT'
 });
}
