import {createPendingNativeAdapter} from './paid-report-pending-native-adapter.js';
export function createEcrPendingAdapter(dependencies){
 return createPendingNativeAdapter({methodCode:'ECR',productId:'COM-REPORT-ECR-FULL',sourceFamily:'ECR_NATIVE_CONFIGURATION',sectionCount:10},dependencies);
}
