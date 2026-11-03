import {sweepPaidReports} from '../../functions/report-delivery/paid-report-watchdog.js';
import {p9Policy,requireP9Owner} from '../../functions/report-delivery/p9-canary-admission.js';
import {createPaidReportRefundTransport} from '../../functions/commerce/paid-report-refund-transport.js';
export async function runP9Watchdog(env){
 if(env.PHIOS_P9_WATCHDOG_ENABLED!=='true'||env.PHIOS_P9_WATCHDOG_SAFE_MODE!=='false')return {state:'SAFE_NO_OP',scanned:0};
 const p=p9Policy(env,{allowExpired:true});requireP9Owner(env,p.ownerAccountId,{allowExpired:true});
 // Provider authorization is rechecked by the actual producer. An expired G4
 // must not prevent the existing guarantee from progressing to conditional G5.
 const refundTransport=createPaidReportRefundTransport(env,{fetcher:fetch});
 const rows=await sweepPaidReports(env,{eligible:job=>job.ownerAccountId===p.ownerAccountId&&job.productId===p.product&&job.environment==='LIVE'&&job.personId===p.personId&&job.readinessId===p.readinessId,eligibleOrder:o=>o.customer_id===p.ownerAccountId&&o.product_id===p.product&&JSON.parse(o.context_json||'{}').p9Canary?.releaseCandidateDigest===p.releaseCandidateDigest,contextForOwner:owner=>{requireP9Owner(env,owner,{allowExpired:true});return {env,data:{symbolicAccountIdentity:{userId:owner,providerId:'P9_SERVER_SCHEDULER',verified:true,authenticated:true}},request:new Request('https://paid-report-watchdog.internal/scheduled')};},refundTransport});
 return {state:'SCANNED',scanned:rows.length};
}
export default {async scheduled(controller,env,ctx){ctx.waitUntil(runP9Watchdog(env));},fetch(){return new Response(null,{status:404});}};
