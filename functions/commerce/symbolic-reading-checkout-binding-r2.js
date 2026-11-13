import {createSymbolicReadingD1StoreV2} from '../symbolic-method-persistence/symbolic-reading-store-d1-v2.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
const methods={'COM-READING-TAROT-FULL':'TAROT','COM-READING-ICHING-FULL':'I_CHING'};
const fail=(code,status=422)=>{throw Object.assign(Error(code),{code,status});};
export async function requireSymbolicCheckoutBinding(context,productId,readingId){
 const method=methods[productId];if(!method)return null;
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)fail('ACCOUNT_REQUIRED',401);
 if(typeof readingId!=='string'||!/^[-A-Za-z0-9_]{1,128}$/.test(readingId))fail('SYMBOLIC_SAVED_READING_REQUIRED');
 const row=await context.env.RUNTIME_DB.prepare('SELECT status FROM runtimes WHERE runtime_id=? AND user_id=?').bind(readingId,identity.userId).first();if(row?.status!=='active')fail('READING_NOT_FOUND',404);
 const record=await createSymbolicReadingD1StoreV2({db:context.env.RUNTIME_DB}).read({identity,readingId});
 if(!record||record.methodCode!==method)fail('SYMBOLIC_PRODUCT_READING_MISMATCH',403);
 if(record.reading.retention?.expiresAt&&Date.parse(record.reading.retention.expiresAt)<=Date.now())fail('READING_EXPIRED',410);
 return {readingId};
}
