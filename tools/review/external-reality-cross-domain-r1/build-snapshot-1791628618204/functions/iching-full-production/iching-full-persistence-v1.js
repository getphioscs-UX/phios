import {createSymbolicReadingPersistenceEnvelope} from '../symbolic-method-persistence/symbolic-reading-envelope-v1.js';
const clean=v=>String(v??'').normalize('NFKC').trim();
export const ICHING_GUEST_RETENTION_POLICY_VERSION='ICHING-GUEST-RETENTION-v1';
export function createIChingFullProductionPersistenceEnvelope(input={}, {guest=false,retentionDays=30,clock=Date.now}={}){
  const base=createSymbolicReadingPersistenceEnvelope(input);if(!guest)return base;
  const createdAt=new Date(Number(clock())).toISOString();const expiresAt=new Date(Number(clock())+Math.max(1,Math.min(90,Number(retentionDays)||30))*86400000).toISOString();
  return Object.freeze({...structuredClone(base),governance:Object.freeze({...structuredClone(base.governance),guestPersistenceAllowed:true,guestPersistenceExplicitConsent:true,automaticPersistence:false,browserLocalFallbackAllowed:false}),retention:Object.freeze({subject:'SIGNED_GUEST_SESSION',policyVersion:ICHING_GUEST_RETENTION_POLICY_VERSION,explicit:true,createdAt,expiresAt,deleteApiAvailable:true})});
}
export function isGuestReadingExpired(envelope={},now=Date.now){const exp=Date.parse(clean(envelope?.retention?.expiresAt));return Number.isFinite(exp)&&exp<=Number(now());}
