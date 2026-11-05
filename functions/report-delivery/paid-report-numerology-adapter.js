import {createNumerologyLocalDeliveryAdapter} from './paid-report-numerology-local-adapter.js';
import {projectNumR28ForLocalDelivery} from '../personal-reading/narrative/numerology-publication-system.js';
export const NUM_R30_PAID_PUBLICATION_VERSION='NUM-R30-FULL19-33PHYS-LOCAL-v1';
// Same native calculation and delivery owner, explicit latest publication.
// Unknown-customer prose is not supplied by a four-case replay fallback.
export function createNumerologyR30LocalDeliveryAdapter({admittedContentDigests,...options}){
 if(!Array.isArray(admittedContentDigests)||!admittedContentDigests.length||admittedContentDigests.some(d=>!/^[a-f0-9]{64}$/.test(d))||typeof options.editorialAdapter?.compose!=='function')throw Error('NUM_R30_VERSION_BOUND_EDITORIAL_OWNER_REQUIRED');
 const admitted=new Set(admittedContentDigests),compose=options.editorialAdapter.compose;
 return createNumerologyLocalDeliveryAdapter({...options,publicationVersion:NUM_R30_PAID_PUBLICATION_VERSION,
  authorizeSubjectAccess:async(context,job)=>{const subject=await options.loadSubject(context,job.personId);if(subject?.canonicalInput?.consent?.granted!==true||!subject.canonicalInput.consent.recordId)throw Error('NUM_R30_CURRENT_SUBJECT_CONSENT_REQUIRED');},
  editorialAdapter:{async preflight(args){if(!admitted.has(args.contentDigest))throw Error('NUM_R30_EDITORIAL_SOURCE_NOT_ADMITTED');},async compose(args){if(!admitted.has(args.contentDigest))throw Error('NUM_R30_EDITORIAL_SOURCE_NOT_ADMITTED');return compose.call(options.editorialAdapter,args);}},
  publicationProjector:async args=>{const publication=await projectNumR28ForLocalDelivery({...args,refinement:'R30_FULL19'});if(publication.refinement!=='R30_FULL19'||publication.publicationScope!=='FULL19'||publication.pages.length!==19)throw Error('NUM_R30_PUBLICATION_CONTRACT_REQUIRED');return publication;}
 });
}
