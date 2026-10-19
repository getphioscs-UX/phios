import {loadOwnedDraft,draftApi} from './financial-will-draft-store.js';
import {digest} from './oidc-auth.js';
import {requireFinancialGrant} from '../professional/consent/financial-purpose-grants.js';
const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
const financialSections=['assets','liabilities','guarantees'];
export async function willIntentDigest(payload){const p=structuredClone(payload);delete p.financialSource;delete p.financialImport;delete p.financialImportConsent;for(const section of financialSections)delete p.sections?.[section];return digest(JSON.stringify(p));}
function mapping(payload,scopes){
 const inv=payload.inventory;if(!inv)fail('SAVED_STRUCTURED_INVENTORY_REQUIRED');
 const sections={};for(const key of financialSections.filter(x=>scopes.includes(x))){sections[key]={status:'PARTIAL',items:(inv[key]||[]).map(r=>({label:r.label||'',assetId:r.assetId||r.liabilityId||r.recordId||'',...(key==='assets'?{category:r.type||'OTHER',estateInclusion:'UNKNOWN'}:{}),value:r.representation==='EXACT'&&r.disclosureState==='SELF_REPORTED'?r.value:null,currency:r.currency||payload.baseCurrency,documentLocation:r.documentReference||''}))};}
 return sections;
}
export async function previewWillImport(context,body){
 const ref=body.savedDraftRef;if(!ref||!Number.isInteger(ref.version))fail('SAVED_DRAFT_REFERENCE_REQUIRED');
 const scopes=body.scopes;if(!Array.isArray(scopes)||!scopes.length||scopes.some(s=>!financialSections.includes(s))||new Set(scopes).size!==scopes.length)fail('WILL_IMPORT_SCOPE_INVALID');
 await requireFinancialGrant(context,{grantId:body.grantId,source:ref,purpose:'WILL_ASSEMBLY',scopes});
 const source=await loadOwnedDraft(context,{draftId:ref.draftId,version:ref.version,expectedRef:ref,kind:'FINANCIAL'});
 let target=null;if(body.willRef)target=await loadOwnedDraft(context,{draftId:body.willRef.draftId,version:body.willRef.version,expectedRef:body.willRef,kind:'WILL'});
 const sections=mapping(source.payload,scopes),intentDigest=await willIntentDigest(target?.payload||{sections:{}});
 const mappingDigest=await digest(JSON.stringify({source:source.savedDraftRef,grantId:body.grantId,scopes,sections,intentDigest,target:target?.savedDraftRef||null}));
 const previous=target?.payload.financialSource?.savedDraftRef||null;
 const changes=Object.keys(sections).map(section=>({section,before:target?.payload.sections?.[section]||null,after:sections[section],changed:JSON.stringify(target?.payload.sections?.[section])!==JSON.stringify(sections[section])}));
 return {source:source.savedDraftRef,target:target?.savedDraftRef||null,previousSource:previous,sections,changes,intentDigest,mappingDigest,scopes,grantId:body.grantId,dataDate:source.payload.asOfDate,currency:source.payload.baseCurrency};
}
export async function confirmWillImport(context,body){
 if(body.confirmed!==true)fail('WILL_IMPORT_CONFIRMATION_REQUIRED');
 const preview=await previewWillImport(context,body);
 if(body.mappingDigest!==preview.mappingDigest)fail('WILL_IMPORT_PREVIEW_STALE');
 const old=preview.target?await loadOwnedDraft(context,{draftId:preview.target.draftId,version:preview.target.version,expectedRef:preview.target,kind:'WILL'}):null;
 const payload=old?structuredClone(old.payload):{dataDate:preview.dataDate,currency:preview.currency,jurisdiction:'',sections:{}};
 Object.assign(payload.sections,preview.sections);payload.financialImport=true;payload.financialImportConsent=true;
 payload.financialSource={savedDraftRef:preview.source,grantId:preview.grantId,scopes:preview.scopes,mappingDigest:preview.mappingDigest,intentDigest:preview.intentDigest,importedAt:new Date().toISOString()};
 // Import never copies people into role/beneficiary/intent sections.
 if(old&&await willIntentDigest(payload)!==preview.intentDigest)fail('WILL_INTENT_MUTATION_FORBIDDEN');
 const request=new Request(context.request.url,{method:'POST',headers:{origin:new URL(context.request.url).origin,'content-type':'application/json'},body:JSON.stringify({action:'save',draftType:'WILL',payload,purpose:'WILL_ASSEMBLY',saveConsent:true,retentionConsent:true,expiresAt:old?.expiresAt||body.expiresAt,expectedVersion:old?.version||0,draftId:old?.draftId})});
 const newWillDraftId=old?null:'wi_'+preview.mappingDigest.slice(0,40);
 const response=await draftApi({...context,data:{...context.data,financialPurposeGrant:{grantId:preview.grantId,sourceRef:preview.source.sourceRef,sourceDigest:preview.source.contentDigest,mappingDigest:preview.mappingDigest,newWillDraftId}},request});
 if(!old&&response.status===409){
  const saved=await loadOwnedDraft(context,{draftId:newWillDraftId,version:1,kind:'WILL'});
  if(saved.payload.financialSource?.mappingDigest===preview.mappingDigest&&saved.payload.financialSource.grantId===preview.grantId)return Response.json({ok:true,draftId:saved.draftId,version:saved.version,digest:saved.digest,savedDraftRef:saved.savedDraftRef,reused:true},{headers:{'cache-control':'private, no-store'}});
 }
 return response;
}
