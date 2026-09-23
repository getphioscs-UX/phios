import {REPORT_DELIVERY_VERSION,REPORT_ACCESS_STATES,reportDeliveryMethod} from './report-delivery-contract.js';
import {resolveReportRoute} from './report-route-resolver.js';
export function buildReportDeliveryEnvelope({methodId,access,admitted,reportAvailable}){
 const policy=reportDeliveryMethod(methodId);
 if(!policy||!REPORT_ACCESS_STATES.includes(access.state))throw new Error('REPORT_DELIVERY_CONTRACT_INVALID');
 const state=reportAvailable&&admitted?access.state:'UNAVAILABLE';
 return {schemaVersion:REPORT_DELIVERY_VERSION,methodId,reportProductId:policy.reportProductId,commerceProductId:policy.commerceProductId,entitlementKey:policy.entitlementKey,
  sourceReading:{productionAdmitted:admitted===true},availability:{freeReport:Boolean(reportAvailable),fullReport:state==='ENTITLED',technicalExplorer:state==='ENTITLED'},
  access:{state,reason:access.reason},resolvedRoute:resolveReportRoute({access:{state}}),routes:{free:'PUBLICATION_PREVIEW',locked:'PUBLICATION_LOCKED',full:'PUBLICATION_FULL',technical:'SPECIALIST_EXPLORER'},
  successorActive:false,humanAccepted:false};
}
