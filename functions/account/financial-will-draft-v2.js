import {validateFinancialWillDraft} from './financial-will-draft-schema.js';
import {assertNoPersistedIdentity} from './person-use-policy.js';
import {validateToolScenarios} from '../financial/calculation-runtime/customer-finance-tools.js';
import {validateJurisdictionProfile} from '../professional/access/financial-jurisdiction-profile.js';

export const FW_V1='FW_CUSTOMER_INTAKE_DRAFT_v1';
export const FW_V2='FW_CUSTOMER_INTAKE_DRAFT_v2';
const invalid=code=>{throw Object.assign(new Error(code),{code,status:422});};
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
const refs=v=>Array.isArray(v)&&v.length<=100&&Array.from(v).every(id)&&new Set(v).size===v.length;
const rowExtensions=['recordId','assetId','liabilityId','policyId','goalId','interestFact','valuationDate','valuationPrecision','relatedAssetRefs','relatedLiabilityRefs'];
export function validateDraftVersion(kind,payload,version){
 if(version===FW_V1)return validateFinancialWillDraft(kind,payload);
 if(version!==FW_V2)invalid('DRAFT_SCHEMA_UNSUPPORTED');
 assertNoPersistedIdentity(payload);
 const copy=structuredClone(payload),legacy=structuredClone(payload);
 if(kind==='FINANCIAL'&&'toolScenarios' in copy){validateToolScenarios(copy.toolScenarios);delete legacy.toolScenarios;}
 if(kind==='FINANCIAL'&&'jurisdictionProfile' in copy){validateJurisdictionProfile(copy.jurisdictionProfile);delete legacy.jurisdictionProfile;}
 if(kind==='WILL'&&'financialSource' in copy){
  const s=copy.financialSource;
  if(!plain(s)||Object.keys(s).some(k=>!['savedDraftRef','grantId','scopes','mappingDigest','intentDigest','importedAt'].includes(k))||!id(s.grantId)||!Array.isArray(s.scopes)||!plain(s.savedDraftRef)||typeof s.mappingDigest!=='string'||typeof s.intentDigest!=='string')invalid('DRAFT_FINANCIAL_SOURCE_INVALID');
  delete legacy.financialSource;
 }
 if(kind==='FINANCIAL'&&plain(copy.inventory)){
  for(const [group,rows] of Object.entries(copy.inventory)){
   if(group==='disclosure')continue;
   if(!Array.isArray(rows))invalid('DRAFT_ROWS_INVALID');
   const seen=new Set();
   rows.forEach((row,i)=>{
    if(!plain(row))invalid('DRAFT_SCHEMA_INVALID');
    for(const key of ['recordId','assetId','liabilityId','policyId','goalId'])if(key in row&&!id(row[key]))invalid('DRAFT_STABLE_ID_INVALID');
    if(row.recordId){if(seen.has(row.recordId))invalid('DRAFT_STABLE_ID_DUPLICATE');seen.add(row.recordId);}
    if('relatedAssetRefs' in row&&!refs(row.relatedAssetRefs))invalid('DRAFT_REFERENCE_INVALID');
    if('relatedLiabilityRefs' in row&&!refs(row.relatedLiabilityRefs))invalid('DRAFT_REFERENCE_INVALID');
    if('interestFact' in row){
     const f=row.interestFact;if(!plain(f)||Object.keys(f).some(k=>!['value','representation','disclosureState','min','max','unit','rateType'].includes(k)))invalid('DRAFT_INTEREST_FACT_INVALID');
     if(!['UNKNOWN','EXACT','RANGE','APPROXIMATE'].includes(f.representation)||!['ANNUAL_FRACTION','ANNUAL_PERCENT'].includes(f.unit))invalid('DRAFT_INTEREST_FACT_INVALID');
     for(const k of ['value','min','max'])if(f[k]!==undefined&&f[k]!==null&&(!Number.isFinite(Number(f[k]))||Number(f[k])<0||f[k]===''))invalid('DRAFT_INTEREST_FACT_INVALID');
     if(['EXACT','APPROXIMATE'].includes(f.representation)&&(f.value===undefined||f.value===null))invalid('DRAFT_INTEREST_FACT_INVALID');
     if(f.representation==='RANGE'&&(!(Number(f.min)<=Number(f.max))))invalid('DRAFT_INTEREST_FACT_INVALID');
    }
    if(row.valuationDate&&!/^\d{4}-\d{2}-\d{2}$/.test(row.valuationDate))invalid('DRAFT_DATE_INVALID');
    if(row.valuationPrecision&&!['EXACT','APPROXIMATE','RANGE','UNKNOWN'].includes(row.valuationPrecision))invalid('DRAFT_PRECISION_INVALID');
    for(const k of rowExtensions)delete legacy.inventory[group][i][k];
   });
  }
  const assets=new Set((copy.inventory.assets||[]).map((r,i)=>r.assetId||r.recordId||`A${i+1}`)),debts=new Set((copy.inventory.liabilities||[]).map((r,i)=>r.liabilityId||r.recordId||`L${i+1}`));
  for(const rows of Object.values(copy.inventory).filter(Array.isArray))for(const r of rows){if(r.relatedAssetRefs?.some(id=>!assets.has(id))||r.relatedLiabilityRefs?.some(id=>!debts.has(id)))invalid('DRAFT_REFERENCE_UNRESOLVED');}
 }
 // v1 remains the privacy and allowed-field boundary for unchanged fields.
 validateFinancialWillDraft(kind,legacy);
 return copy;
}
