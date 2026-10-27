// Local review validator only. Does not import/redefine any production release owner.
import fs from 'node:fs';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),Ajv=require('ajv'),d='tools/review/hd-r6/',j=p=>JSON.parse(fs.readFileSync(p)),hash=b=>createHash('sha256').update(b).digest('hex');
const schema=j(d+'CONDITIONAL-CONTENT-SCHEMA.json'),ajv=new Ajv({allErrors:true,allowUnionTypes:true}),validate=ajv.compile(schema),contracts=j(d+'SECTION-CONTRACTS.json').contracts,units=j(d+'SOURCE-LINEAGE-MATRIX.json').rows.filter(u=>u.kind==='EXISTING_SEMANTIC_CANDIDATE');
const read=(o,p)=>{const segments=p.split('.');if(segments.some(s=>['__proto__','constructor','prototype'].includes(s)))return undefined;let v=o;for(const k of segments){if(!v||!Object.hasOwn(v,k))return undefined;v=v[k];}return v;};
export function reviewConditionalModule(module,{binding,chart,context='PRIVATE_REVIEW',rightsEvidenceIds=[]}={}){
 const blockers=[];if(!validate(module))return {status:'INVALID_ENVELOPE',errors:validate.errors,publicationAllowed:false,providerAllowed:false,textUseAllowed:false};
 const section=contracts.find(s=>s.sectionId===module.sectionId),unit=units.find(u=>u.moduleId===module.moduleId);
 if(context!=='PRIVATE_REVIEW')blockers.push('R6_PRIVATE_REVIEW_ONLY');
 if(!unit||!section.applicableModuleIds.includes(module.moduleId))blockers.push('UNREGISTERED_OR_WRONG_SECTION_MODULE');
 if(!binding||['inputDigest','chartResultDigest','sourceDigest','calculationVersion'].some(k=>module.binding[k]!==binding[k]))blockers.push('STALE_OR_MIXED_BINDING');
 if(unit){const actual=hash(fs.readFileSync(unit.repositoryPath)),data=j(unit.repositoryPath),raw=data.meaningUnits[Number(unit.pointer.split('/').at(-1))];if(module.source.sha256!==actual||module.binding.sourceDigest!==actual||module.source.version!==data.schemaVersion||module.source.id!==unit.moduleId||module.source.location!==unit.repositoryPath+'#'+unit.pointer)blockers.push('SOURCE_ID_VERSION_LOCATION_DRIFT');if(raw.gate!=null&&!chart?.activations?.some(a=>a.gate===raw.gate))blockers.push('REGISTERED_GATE_NOT_ACTIVE');for(const [a,b]of [['canonicalType','typeCode'],['canonicalAuthority','authority']])if(raw[a]&&chart?.[b]!==raw[a])blockers.push('REGISTERED_VALUE_NOT_APPLICABLE');}
 if(!chart||section.requiredCalculatedFields.some(k=>!Object.hasOwn(chart,k)||chart[k]==null))blockers.push('MISSING_CALCULATED_FIELDS');
 if(module.conditions.some(c=>{const v=read(chart||{},c.field);return c.operator==='EQUALS'?v!==c.expected:!Array.isArray(v)||!v.includes(c.expected);}))blockers.push('SELECTION_CONDITION_NOT_MET');
 if(module.source.ownershipClass==='UNVERIFIED'||module.source.ownershipClass==='MIXED')blockers.push('EXPRESSION_OWNERSHIP_UNVERIFIED');
 if(!['OWNER_ORIGINAL_REVIEWED','LICENSE_SCOPE_REVIEWED'].includes(module.rights.status)||!module.rights.evidenceId||!rightsEvidenceIds.includes(module.rights.evidenceId))blockers.push('RIGHTS_NOT_ESTABLISHED');
 if(!module.rights.uses.includes('PRIVATE_ANALYSIS'))blockers.push('PRIVATE_ANALYSIS_SCOPE_NOT_RECORDED');
 if(module.source.ownershipClass==='THIRD_PARTY'&&(!module.rights.uses.includes('ADAPTATION')||!module.rights.uses.includes('AI_INPUT')))blockers.push('THIRD_PARTY_AUTHORING_SCOPE_NOT_ESTABLISHED');
 const langs=module.language==='bilingual'?['zh-Hans','en']:[module.language];if(langs.some(l=>!module.rights.languages.includes(l)))blockers.push('LANGUAGE_SCOPE_NOT_ESTABLISHED');
 if(['BOOK_NARRATIVE','MEDICAL_OR_PREDICTIVE_CLAIM'].includes(module.expressionType))blockers.push('EXCLUDED_LEGACY_EXPRESSION');
 if(module.sectionId==='SEC07'&&module.conditions.some(c=>/line/i.test(c.field)))blockers.push('LINE_SPECIFIC_RULE_ADMISSION_REQUIRED');
 if(module.sectionId==='SEC10')blockers.push('PHS_AXIS_AND_HEALTH_BOUNDARY_ADMISSION_REQUIRED');
 if(module.sectionId==='SEC15')blockers.push('CROSS_SECTION_COMPOSITION_OWNER_ADMISSION_REQUIRED');
 return {status:blockers.length?'HOLD_FOR_AUTHORING_REVIEW':'HYPOTHETICAL_AUTHORING_SCOPE_READY_ONLY',blockers,textUseAllowed:blockers.length===0,publicationAllowed:false,providerAllowed:false,existingReleaseOwnerRequired:true,proofBoundary:'Validates metadata/conditions, not legal clearance, semantic truth, runtime accuracy or human acceptance.'};
}
