import {isBaziP4QaRow,openAccountBaziP4Qa} from './bazi-p4-qa-account-r2.js';
import {PAID_REPORT_METHODS,resolvePaidReportMethod} from '../report-delivery/paid-report-method-registry.js';
import {nativeQaAccountEnabled,isNativeQaRow,openAccountNativeQaMaterial} from './native-qa-account-delivery.js';
export async function openOwnedMethodReport(context,reportId){
 const {personIdentity}=await import('./canonical-person-store.js');const owner=personIdentity(context).userId;
 const row=await context.env.RUNTIME_DB.prepare('SELECT method_code,verifier_receipt FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(owner,reportId).first();
 if(nativeQaAccountEnabled(context)&&context.env.REPORT_ZERO_COST_REPLAY==='true'&&isBaziP4QaRow(row))return openAccountBaziP4Qa(context,reportId);
 if(nativeQaAccountEnabled(context)&&isNativeQaRow(row))return openAccountNativeQaMaterial(context,reportId);
 if(!row)throw Object.assign(Error('REPORT_UNAVAILABLE'),{status:404});return resolveMethodDeliveryAdapter(row.method_code).open(context,reportId);
}
export async function listOwnedMethodReports(context){
 if(nativeQaAccountEnabled(context)){const {personIdentity}=await import('./canonical-person-store.js');const rows=(await context.env.RUNTIME_DB.prepare('SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? ORDER BY released_at DESC LIMIT 100').bind(personIdentity(context).userId).all()).results||[],out=[];for(const r of rows){try{const m=await openOwnedMethodReport(context,r.report_id);out.push({reportId:m.row.report_id,method:m.row.method_code,locale:m.row.locale,publicationVersion:m.material?.publicationVersion,pdfDownloadUrl:'/api/account-method-reports?reportId='+encodeURIComponent(r.report_id)+'&format=pdf',status:isBaziP4QaRow(m.row)?'SYNTHETIC_BZR_P4_QA_NOT_CUSTOMER_RELEASE':isNativeQaRow(m.row)?'SYNTHETIC_QA_NOT_CUSTOMER_RELEASE':'EXISTING_ACCOUNT_MATERIAL'});}catch(e){if(![403,404,409].includes(e.status))throw e;}}return out;}
 const adapters=context.env.STRIPE_ENVIRONMENT==='LIVE'?Object.values(PAID_REPORT_METHODS).filter(a=>a.methodCode==='BZR'):Object.values(PAID_REPORT_METHODS);return (await Promise.all(adapters.map(a=>a.list(context)))).flat();}
export function resolveMethodDeliveryAdapter(methodCode){const adapter=resolvePaidReportMethod(methodCode);return {...adapter,generate:adapter.generateAccount};}
