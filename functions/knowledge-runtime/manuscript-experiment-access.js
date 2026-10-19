// In-process operator capability. Never serialized, never supplied by a URL,
// request body or public route. It grants isolated source retrieval, not calls.
const capabilities=new WeakMap();
export function createIsolatedManuscriptExperimentAccess(env,manifest){
 if(env?.PHIOS_ENVIRONMENT!=='local'||env?.PHIOS_ISOLATED_OPERATOR!==true||manifest?.purpose!=='OFFLINE_MEMBERSHIP_SOURCE_EXPERIMENT'||manifest?.productionActivation!==false||manifest?.paidAuthorization!==false||!manifest?.ownerEvidence||!manifest.fragments?.length)throw Error('ISOLATED_EXPERIMENT_PERMISSION_REQUIRED');
 for(const f of manifest.fragments)if(!f.sourceAccepted||!f.textAndPositionVerified||f.ocrDependency||f.diagramDependency||f.protectedFullText||!f.sourceSha256||!f.sectionSha256||!f.textSha256||!Number.isInteger(f.startOffset)||!Number.isInteger(f.endOffset)||f.endOffset<=f.startOffset)throw Error('EXPERIMENT_FRAGMENT_QUALITY_REQUIRED');
 const token=Object.freeze({});capabilities.set(token,structuredClone(manifest));return token;
}
export function experimentFragments(token,source){
 const m=token&&capabilities.get(token);return m?m.fragments.filter(f=>f.bookCode===source.bookCode&&f.sourceSha256===(source.sourceSha256||source.sourceBinaryDigest)&&(!source.sectionCode||f.sectionCode===source.sectionCode)&&(!source.sectionSha256||f.sectionSha256===source.sectionSha256)):[];
}
export function experimentAllows(token,source){return experimentFragments(token,source).length>0;}
// Optional local source-candidate registry belongs to this same in-process
// capability. It cannot be selected by request parameters or an environment flag.
export function isolatedExperimentRegistry(token,env){
 const m=token&&capabilities.get(token);
 if(env?.PHIOS_ENVIRONMENT!=='local'||env?.PHIOS_ISOLATED_OPERATOR!==true||!m?.sourceCandidateRegistry)return null;
 const registry=m.sourceCandidateRegistry;
 if(!Array.isArray(registry.records)||registry.records.some(s=>!['en','zh-Hans'].includes(s.locale)||!experimentFragments(token,s).length))throw Error('EXPERIMENT_SOURCE_REGISTRY_SCOPE_INVALID');
 return structuredClone(registry);
}
