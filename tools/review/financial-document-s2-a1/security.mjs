// Candidate gateway only. No identity issuer, cloud credentials or production bindings.
const deny=(code,status=403)=>{throw Object.assign(Error(code),{status});};
const forbiddenResources=new Set(['073639fa-01e4-4868-af10-6ed032637dab','phios-private-manuscripts','phios-private-reports','phios-method-report-renderer-production','phios-method-report-renderer-qa','c2c6e313-9bc8-4fd4-89b1-36f3d764dad8','phios-private-books-sandbox','phios-private-reports-sandbox']);
const decode=s=>{if(!/^[A-Za-z0-9_-]+$/.test(s))deny('JWT_ENCODING',401);return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));};
const json=s=>JSON.parse(new TextDecoder().decode(decode(s)));
export async function accessIdentity(request,config){
 const token=request.headers.get('cf-access-jwt-assertion');if(!token||token.length>8192)deny('TOKEN_REQUIRED',401);
 const parts=token.split('.');if(parts.length!==3)deny('JWT_FORMAT',401);const h=json(parts[0]),p=json(parts[1]),now=Math.floor(Date.now()/1000);
 if(h.alg!=='RS256'||h.jku||h.jwk||h.x5u||h.crit||typeof h.kid!=='string')deny('JWT_ALGORITHM',401);
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(config.issuer)||p.iss!==config.issuer||!config.audience||!(Array.isArray(p.aud)?p.aud:[p.aud]).includes(config.audience))deny('JWT_ISSUER_AUDIENCE',401);
 if(!Number.isSafeInteger(p.exp)||p.exp<=now||!Number.isSafeInteger(p.iat)||p.iat>now||now-p.iat>3600||p.exp-p.iat>3600||(p.nbf!==undefined&&(!Number.isSafeInteger(p.nbf)||p.nbf>now)))deny('JWT_TIME',401);
 // Public keys must be provisioned by a named operator from the exact issuer's
 // /cdn-cgi/access/certs over authenticated HTTPS. No token-controlled key fetch.
 const key=config.publicKeys?.find(k=>k.kid===h.kid&&k.kty==='RSA'&&k.alg==='RS256'&&k.use==='sig');if(!key)deny('JWT_TRUSTED_KEY_REQUIRED',401);
 const imported=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))deny('JWT_SIGNATURE',401);
 const account=config.identities?.[p.sub];if(!account||account.synthetic!==true)deny('TEST_ACCOUNT_NOT_ALLOWED');return {...account,accessSubject:p.sub};
}
export async function boundary(request,env,operation){
 const config=JSON.parse(env.S2_CONFIG||'null');if(!config)deny('CONFIG_REQUIRED');const u=new URL(request.url);
 if(u.protocol!=='https:'||u.host!==config.host||env.RUNTIME_MODE!=='ISOLATED_SYNTHETIC_CANDIDATE'||config.project!=='phios-financial-document-s2'||env.CF_PAGES_PROJECT_NAME!==config.project||!/^[a-f0-9]{40}$/.test(config.sourceSha||''))deny('HOST_MODE_PROJECT');
 if(!config.d1Id||!config.r2Name||!config.campaign||!config.resourceNonce||forbiddenResources.has(config.d1Id)||forbiddenResources.has(config.r2Name)||config.productionDenylist?.includes(config.d1Id)||config.productionDenylist?.includes(config.r2Name))deny('RESOURCE_CONFIG');
 if(!config.testOwner||!config.keyCustodian||!config.cleanupOwner||!config.executionApproval||config.costVerified!==true)deny('OPERATORS_OR_APPROVAL_REQUIRED');
 const account=await accessIdentity(request,config);
 const row=await env.RUNTIME_DB.prepare('SELECT * FROM s2_security_control WHERE campaign=?').bind(config.campaign).first();
 const object=await env.PRIVATE_REPORTS.get('s2-security/resource-identity.json');if(!row||!object)deny('RESOURCE_IDENTITY_MISSING');
 const marker=await object.json();for(const x of ['campaign','project','d1Id','r2Name','resourceNonce'])if(row[x]!==config[x]||marker[x]!==config[x])deny('RESOURCE_IDENTITY_MISMATCH');
 // Marker corroboration is not a provider-issued resource attestation. Actual
 // binding IDs and access policy still require a separate deployment preflight.
 const now=Date.now();if(row.execution!==1||now>=row.deadline||row.deadline>row.started+86400000||row.started>now)deny('EXECUTION_CLOSED');
 if(account.revoked||row.sessionEpoch!==account.sessionEpoch)deny('TEST_SESSION_REVOKED');
 if(!account.operations?.includes(operation)||!account.purpose||account.subject!==config.syntheticSubject)deny('OPERATION_OR_SUBJECT');
 if(operation==='extract'&&(row.upload!==1||row.writes!==1))deny('UPLOAD_OR_WRITES_CLOSED');
 if(operation==='download'&&row.download!==1)deny('DOWNLOAD_CLOSED');
 if(!['extract','financial','identity'].includes(operation))deny('OWNER_ROUTE_NOT_ADMITTED');
 return {config,account,row};
}
export async function reserve(env,ctx,bytes,files){
 const limits=ctx.config.limits;if(!limits||limits.requests>100||limits.files>10||limits.bytes>10000000||limits.requests<1||limits.files<1||limits.bytes<1)deny('LIMIT_CONFIG');
 const r=await env.RUNTIME_DB.prepare(`UPDATE s2_security_control SET requests=requests+1, files=files+?, bytes=bytes+? WHERE campaign=? AND execution=1 AND sessionEpoch=? AND deadline>? AND requests<? AND files+?<=? AND bytes+?<=? AND (?=0 OR (upload=1 AND writes=1)) RETURNING requests`).bind(files,bytes,ctx.config.campaign,ctx.account.sessionEpoch,Date.now(),limits.requests,files,limits.files,bytes,limits.bytes,files).first();if(!r)deny('STOP_OR_CAMPAIGN_LIMIT',429);
 // Reserve attempts, including failures, conservatively. Never refund counters.
}
export async function boundedBody(request){const cap=1000000;if(Number(request.headers.get('content-length'))>cap)deny('UPLOAD_LIMIT',413);const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks=[];let n=0;for(;;){const x=await reader.read();if(x.done)break;n+=x.value.length;if(n>cap){await reader.cancel();deny('UPLOAD_LIMIT',413);}chunks.push(x.value);}const out=new Uint8Array(n);let offset=0;for(const x of chunks){out.set(x,offset);offset+=x.length;}return out;}
