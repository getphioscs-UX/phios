import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';

const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const languages=locale=>locale==='bilingual'?['zh-Hans','en']:[locale];

// Server-owned source handoff only. This validates provenance and completeness;
// it issues neither a publication approval nor a commerce admission.
export async function verifyCustomerReportSource({source,binding,requiredSectionIds,sourceFamily}){
 if(!source||source.schemaVersion!=='PAID_REPORT_CUSTOMER_SOURCE_V1')fail('CUSTOMER_SOURCE_REQUIRED');
 if(!binding||!['AST','HD','ECR','NUM'].includes(binding.methodCode)||!['en','zh-Hans','bilingual'].includes(binding.locale))fail('CUSTOMER_SOURCE_BINDING_REQUIRED');
 for(const key of ['ownerAccountId','personId','personVersion','methodCode','productId','publicationVersion','inputDigest','authorityDigest','locale']){
  if(binding[key]===undefined||binding[key]===null||binding[key]===''||source[key]!==binding[key])fail('CUSTOMER_SOURCE_'+key.toUpperCase()+'_MISMATCH');
 }
 if(!digest(source.inputDigest)||!digest(source.authorityDigest)||!digest(source.contentDigest))fail('CUSTOMER_SOURCE_DIGEST_REQUIRED');
 if(source.sourceFamily!==sourceFamily||!nonempty(source.sourceRef)||!nonempty(source.consentRef))fail('CUSTOMER_SOURCE_PROVENANCE_REQUIRED');
 if(!['TECHNICAL_FIXTURE','CUSTOMER_SOURCE_PENDING_PUBLICATION'].includes(source.scope))fail('CUSTOMER_SOURCE_SCOPE_NOT_ADMITTED');
 if(source.customerPublicationAllowed!==false)fail('CUSTOMER_SOURCE_CANNOT_GRANT_PUBLICATION');
 if(!Array.isArray(requiredSectionIds)||!requiredSectionIds.length||new Set(requiredSectionIds).size!==requiredSectionIds.length||requiredSectionIds.some(id=>!nonempty(id)))fail('CUSTOMER_SOURCE_SECTION_CONTRACT_REQUIRED');
 const sections=source.sections;
 if(!Array.isArray(sections)||sections.length!==requiredSectionIds.length||new Set(sections.map(s=>s.sectionId)).size!==sections.length||requiredSectionIds.some(id=>!sections.some(s=>s.sectionId===id)))fail('CUSTOMER_SOURCE_SECTION_COVERAGE_REQUIRED');
 for(const section of sections){
  if(!Array.isArray(section.sourceRefs)||!section.sourceRefs.length||section.sourceRefs.some(ref=>!nonempty(ref)))fail('CUSTOMER_SOURCE_SECTION_LINEAGE_REQUIRED');
  for(const locale of languages(binding.locale))if(!nonempty(section.body?.[locale]))fail('CUSTOMER_SOURCE_LANGUAGE_CONTENT_REQUIRED');
 }
 if(await sha256Stable(sections)!==source.contentDigest)fail('CUSTOMER_SOURCE_CONTENT_DIGEST_MISMATCH');
 return Object.freeze({methodCode:binding.methodCode,contentDigest:source.contentDigest,scope:source.scope,sectionCount:sections.length,customerPublicationAllowed:false,commercialAdmission:false});
}
