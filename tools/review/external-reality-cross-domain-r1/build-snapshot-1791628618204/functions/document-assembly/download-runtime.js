import { createHmac, timingSafeEqual } from 'node:crypto';
import { sha256Hex } from './digest.js';
import { canonicalJson } from './canonical-json.js';

function b64url(buffer){ return Buffer.from(buffer).toString('base64url'); }
function sign(payloadB64, secret){ return b64url(createHmac('sha256',secret).update(payloadB64,'utf8').digest()); }
function assertSecret(secret){ if(typeof secret!=='string' || secret.length<32) throw new Error('DAR_DOWNLOAD_SECRET_MIN_32_CHARS_REQUIRED'); }
function parseIso(value, code){ const ms=Date.parse(value); if(Number.isNaN(ms)) throw new Error(code); return ms; }

export function issuePrivateDownloadGrant({ exportVersion, subjectId, expiresAt, now, secret } = {}){
  assertSecret(secret);
  if(exportVersion?.status!=='EXPORTED' || exportVersion.legallyExecuted!==false) throw new Error('DAR_EXPORTED_VERSION_REQUIRED');
  if(!['PDF','DOCX'].includes(exportVersion.format)) throw new Error('DAR_DOWNLOAD_FORMAT_UNSUPPORTED');
  if(typeof subjectId!=='string' || !subjectId) throw new Error('DAR_AUTHENTICATED_SUBJECT_REQUIRED');
  const nowMs=parseIso(now,'DAR_DOWNLOAD_NOW_ISO_REQUIRED'), expiryMs=parseIso(expiresAt,'DAR_DOWNLOAD_EXPIRY_ISO_REQUIRED');
  if(expiryMs<=nowMs) throw new Error('DAR_DOWNLOAD_EXPIRY_MUST_BE_FUTURE');
  if(expiryMs-nowMs>24*60*60*1000) throw new Error('DAR_DOWNLOAD_MAX_TTL_24H');
  const payload={v:1,documentId:exportVersion.documentId,documentVersion:exportVersion.documentVersion,outputDigest:exportVersion.outputDigest,format:exportVersion.format,subjectDigest:sha256Hex(subjectId),expiresAt};
  const payloadB64=b64url(Buffer.from(canonicalJson(payload),'utf8')); const signature=sign(payloadB64,secret);
  return Object.freeze({token:`${payloadB64}.${signature}`,transport:'AUTHORIZATION_HEADER_OR_HTTP_ONLY_COOKIE',queryStringAllowed:false,headers:Object.freeze({'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive'}),expiresAt});
}

export function authorizePrivateDownload({ token, subjectId, now, secret } = {}){
  assertSecret(secret);
  if(typeof token!=='string' || !token.includes('.')) return Object.freeze({authorized:false,reason:'MALFORMED_TOKEN'});
  const [payloadB64,provided]=token.split('.'); const expected=sign(payloadB64,secret);
  const a=Buffer.from(provided||'','utf8'), b=Buffer.from(expected,'utf8');
  if(a.length!==b.length || !timingSafeEqual(a,b)) return Object.freeze({authorized:false,reason:'INVALID_SIGNATURE'});
  let payload; try{ payload=JSON.parse(Buffer.from(payloadB64,'base64url').toString('utf8')); }catch{return Object.freeze({authorized:false,reason:'INVALID_PAYLOAD'});}
  const nowMs=parseIso(now,'DAR_DOWNLOAD_NOW_ISO_REQUIRED'), expiryMs=parseIso(payload.expiresAt,'DAR_DOWNLOAD_EXPIRY_ISO_REQUIRED');
  if(nowMs>=expiryMs) return Object.freeze({authorized:false,reason:'EXPIRED'});
  if(payload.subjectDigest!==sha256Hex(subjectId)) return Object.freeze({authorized:false,reason:'SUBJECT_MISMATCH'});
  return Object.freeze({authorized:true,reason:null,payload:Object.freeze(payload),headers:Object.freeze({'Cache-Control':'private, no-store','Content-Disposition':`attachment; filename="${payload.documentId}-${payload.documentVersion}.${payload.format.toLowerCase()}"`,'X-Robots-Tag':'noindex, nofollow, noarchive'})});
}

export default Object.freeze({ issuePrivateDownloadGrant, authorizePrivateDownload });
