import {createPendingNativeAdapter} from './paid-report-pending-native-adapter.js';
import {requireFullPublicationOwnerR32} from './full-publication-owner-gate-r32.js';
export function createHumanDesignPendingAdapter(dependencies){
 return createPendingNativeAdapter({methodCode:'HD',productId:'COM-REPORT-HD-FULL',sourceFamily:'HD_CONFIRMED_EXTERNAL_CHART',sectionCount:17,publicationVerifier:requireFullPublicationOwnerR32},dependencies);
}
