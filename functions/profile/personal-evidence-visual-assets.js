const PUBLIC_R2_BASE="https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev";
const SHARED_BASE='images/reports/profile/editorial/';
// Exact original objects verified in the owner-supplied R2 editorial directory.
// Assets were uploaded without the shared/ prefix; no visual is recreated.
const ORIGINAL_EDITORIAL_BASE='images/reports/profile/editorial/';
const STATIC=Object.freeze({
  P01:'RPT-PERSONAL-EVIDENCE-P01-COVER-v1.webp',
  P02:'RPT-PERSONAL-EVIDENCE-P02-EVIDENCE-INTRO-v1.webp',
  P03:'RPT-PERSONAL-EVIDENCE-P03-EVIDENCE-SOURCES-v1.webp',
  P04:'RPT-PERSONAL-EVIDENCE-P04-PHIOS-EVIDENCE-LENS-v1.webp',
  P05:'RPT-PERSONAL-EVIDENCE-P05-HOW-TO-READ-v1.webp'
});
const SECTION=Object.freeze({
  'SEC-01':'VIS-REPORT-PROFILE-SEC-01-EVIDENCE-OVERVIEW.webp',
  'SEC-02':'VIS-REPORT-PROFILE-SEC-02-PERSONAL-EVIDENCE-STRUCTURE.webp',
  'SEC-03':'VIS-REPORT-PROFILE-SEC-03-STRENGTH-FRICTION.webp',
  'SEC-04':'VIS-REPORT-PROFILE-SEC-04-SELF-DECISION.webp',
  'SEC-05':'VIS-REPORT-PROFILE-SEC-05-RELATIONSHIPS.webp',
  'SEC-06':'VIS-REPORT-PROFILE-SEC-06-CAREER-WORK.webp',
  'SEC-07':'VIS-REPORT-PROFILE-SEC-07-PERSONALITY-EVIDENCE.webp',
  'SEC-08':'VIS-REPORT-PROFILE-SEC-08-FINANCIAL-EXTERNAL-EVIDENCE.webp',
  'SEC-09':'VIS-REPORT-PROFILE-SEC-09-INTEGRATION-REALITY.webp',
  'SEC-10':'VIS-REPORT-PROFILE-SEC-10-EVIDENCE-BOUNDARY.webp'
});
const SHARED=Object.freeze({
  BODY:'VIS-REPORT-PROFILE-BODY.webp',
  SECTION_STYLE:'VIS-REPORT-PROFILE-SECTION-STYLE.webp',
  MOTIF_1:'VIS-REPORT-PROFILE-MOTIF-1.svg',
  MOTIF_2:'VIS-REPORT-PROFILE-MOTIF-2.svg'
});
const url=(file,base=SHARED_BASE)=>`${PUBLIC_R2_BASE}/${base}${file}`;
export const PERSONAL_EVIDENCE_STATIC_VISUALS=STATIC;
export const PERSONAL_EVIDENCE_SECTION_MASTERS=SECTION;
export const PERSONAL_EVIDENCE_SHARED_VISUALS=SHARED;
export function resolvePersonalEvidenceStaticPage(page){const file=STATIC[page];if(!file)throw new Error(`PERSONAL_EVIDENCE_STATIC_UNKNOWN:${page}`);return Object.freeze({id:page,file,objectKey:ORIGINAL_EDITORIAL_BASE+file,publicUrl:url(file,ORIGINAL_EDITORIAL_BASE)});}
export function resolvePersonalEvidenceSectionMaster(section){const file=SECTION[section];if(!file)throw new Error(`PERSONAL_EVIDENCE_SECTION_UNKNOWN:${section}`);const storedFile=section==='SEC-05'?file.replace('.webp','..webp'):file;return Object.freeze({id:section,file,objectKey:SHARED_BASE+storedFile,publicUrl:url(storedFile)});}
export function resolvePersonalEvidenceSharedVisual(role){const file=SHARED[role];if(!file)throw new Error(`PERSONAL_EVIDENCE_SHARED_UNKNOWN:${role}`);return Object.freeze({id:role,file,objectKey:SHARED_BASE+file,publicUrl:url(file)});}
