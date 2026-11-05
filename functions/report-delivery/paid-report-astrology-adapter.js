import {createPendingNativeAdapter} from './paid-report-pending-native-adapter.js';
import {requireFullPublicationOwnerR32} from './full-publication-owner-gate-r32.js';
export function createAstrologyPendingAdapter(dependencies){
 return createPendingNativeAdapter({methodCode:'AST',productId:'COM-REPORT-ASTROLOGY-FULL',sourceFamily:'AST_NATIVE_CALCULATION',sectionCount:10,publicationVerifier:requireFullPublicationOwnerR32},dependencies);
}
