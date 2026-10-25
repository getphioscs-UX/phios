import {personIdentity} from '../account/canonical-person-store.js';
import {createContinuityD1Store} from '../personal-reading/continuity/continuity-persistence-d1.js';
import {compareEcrReflection} from './ecr-user-reflection-r2.js';
// Existing continuity artifacts remain the persistence owner. No automatic route.
export function ecrReflectionContinuity(context){
 const owner=personIdentity(context).userId;
 const store=createContinuityD1Store(context.env.RUNTIME_DB);
 const address=key=>{if(typeof key!=='string'||!/^ECR-REF-[A-Za-z0-9-]{1,80}$/.test(key))throw Error('REFLECTION_KEY_INVALID');return {subjectRef:owner,type:'ECR_REFLECTION_R2',key};};
 return Object.freeze({
  async save({key,explicitConsent,comparison}){if(explicitConsent!==true)throw Error('EXPLICIT_SAVE_CONSENT_REQUIRED');const validated=compareEcrReflection(comparison);return store.put({...address(key),payload:{schemaVersion:'ECR-REFLECTION-CHECKPOINT-R2-v1',ownerAccountId:owner,revoked:false,comparison:validated}});},
  async read(key){const record=await store.get(address(key));return record&&!record.revoked?record:null;},
  async revoke(key){const record=await store.get(address(key));if(!record)return {revoked:false};await store.put({...address(key),payload:{schemaVersion:'ECR-REFLECTION-CHECKPOINT-R2-v1',ownerAccountId:owner,revoked:true}});return {revoked:true};},
  async selectedContext(keys){if(!Array.isArray(keys)||keys.length>12)throw Error('EXPLICIT_SELECTION_REQUIRED');const records=await Promise.all([...new Set(keys)].map(key=>store.get(address(key))));return records.filter(r=>r&&!r.revoked&&r.ownerAccountId===owner).map(r=>r.comparison);}
 });
}
