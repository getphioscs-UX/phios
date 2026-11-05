import {createNumerologyLocalDeliveryAdapter} from './paid-report-numerology-local-adapter.js';
import {projectNumR28ForLocalDelivery} from '../personal-reading/narrative/numerology-publication-system.js';
import {NUM_NATIVE_CANDIDATE_VERSION} from './numerology-native-candidate-version.js';
import {numOwnerIntegrationPages,numOwnerPhysicalPlan,NUM_OWNER_SECTION_VERSION} from '../personal-reading/narrative/numerology-owner-sections.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';

// A separately versioned LOCAL QA review of the existing native admitted units.
// No frozen four-customer prose, AI/editorial impersonation or production
// registration. It does not amend the R30 manuscript admission whitelist.
export function createNumerologyNativeCandidateAdapter({loadSubject,renderer,pinnedAuthorityDigest,onEvent,authorizeSubjectAccess}){
 if(typeof authorizeSubjectAccess!=='function')throw Error('NUM_NATIVE_CURRENT_SUBJECT_AUTHORIZATION_REQUIRED');
 return createNumerologyLocalDeliveryAdapter({loadSubject,renderer,pinnedAuthorityDigest,onEvent,authorizeSubjectAccess,publicationVersion:NUM_NATIVE_CANDIDATE_VERSION,
  publicationProjector:async({snapshot,locale})=>{
   const publication=await projectNumR28ForLocalDelivery({snapshot,editorial:null,refinement:'R30_FULL19'});
   if(publication.editorialStatus!=='NATIVE_ADMITTED_UNITS_NOT_EDITORIALLY_COMPRESSED'||publication.pages.length!==19||publication.customerPublishable!==false)throw Error('NUM_NATIVE_SOURCE_CONTRACT_REQUIRED');
   const {publicationDigest,...native}=publication;
   const candidate={...native,nativePublicationDigest:publicationDigest,ownerSectionVersion:NUM_OWNER_SECTION_VERSION,pages:[...publication.pages,...numOwnerIntegrationPages(publication)],physicalPlan:numOwnerPhysicalPlan(locale)};
   return {...candidate,publicationDigest:await sha256Stable(candidate)};
  }});
}
