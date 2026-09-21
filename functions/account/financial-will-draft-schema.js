import {assertNoPersistedIdentity} from './person-use-policy.js';
const groups=['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions'];
const fields=new Set(['personId','label','relationship','dateOfBirth','type','value','representation','disclosureState','currency','min','max','frequency','ownerReferences','ownershipMode','grossOrNet','jurisdiction','institution','maskedReference','liquidityNotes','documentReference','estateInclusion','obligor','expiryDate','monthlyRepayment','maximumExposure','repayment','limit','coverage','premium','targetDate','targetAmount','priority','goalType','fundingSource','annualPremium','coverageAmount','cashValue','nomination','beneficiary','benefitType']);
const estateSections=['identity','family','executors','guardians','beneficiaries','assets','liabilities','guarantees','trusts','gifts','exclusions','digital_assets','funeral_wishes','advisors','documents','review_consent'];
const estateFields=new Set(['label','personId','relationship','minor','role','beneficiaryPersonId','assetId','category','currency','estateInclusion','ownership','documentLocation','institution','nomination','businessSuccession','instruction','substitutePersonId','evidence','value','percentage']);
const scalars=['asOfDate','baseCurrency','household','monthlyIncome','monthlyExpenses','liquidAssets','investments','property','liabilities','monthlyDebtRepayment','protection','goals','constraints','documents','unknowns'];
function object(v){if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('DRAFT_SCHEMA_INVALID');return v;}
function keys(value,allowed){for(const k of Object.keys(object(value)))if(!allowed.has(k))throw new Error('DRAFT_FIELD_NOT_ALLOWED');}
function scalar(v){if(v!==null&&!(typeof v==='string'&&v.length<=2000)&&!(typeof v==='number'&&Number.isFinite(v))&&typeof v!=='boolean')throw new Error('DRAFT_VALUE_INVALID');}
function rows(rows,allowed){if(!Array.isArray(rows)||rows.length>100)throw new Error('DRAFT_ROWS_INVALID');for(const row of rows){keys(row,allowed);for(const [key,v] of Object.entries(row)){if(key==='maskedReference'&&(typeof v!=='string'||v.length>4))throw new Error('DRAFT_MASKED_REFERENCE_INVALID');if(key==='ownerReferences'){if(!Array.isArray(v)||v.length>100||v.some(x=>typeof x!=='string'||x.length>128))throw new Error('DRAFT_REFERENCE_INVALID');}else if(['repayment','limit'].includes(key)){keys(v,new Set(['value','representation','disclosureState','min','max']));Object.values(v).forEach(scalar);}else scalar(v);}}}
export function validateFinancialWillDraft(type,payload){
 assertNoPersistedIdentity(payload);
 if(type==='FINANCIAL'){
  keys(payload,new Set([...scalars,'inventory']));for(const key of scalars)if(key in payload)scalar(payload[key]);
  if(payload.inventory){keys(payload.inventory,new Set([...groups,'disclosure']));for(const group of groups)if(group in payload.inventory)rows(payload.inventory[group],fields);if(payload.inventory.disclosure){keys(payload.inventory.disclosure,new Set(groups));Object.values(payload.inventory.disclosure).forEach(scalar);}}
 }else if(type==='WILL'){
  keys(payload,new Set(['dataDate','jurisdiction','currency','sections','financialImport','financialImportConsent']));for(const k of ['dataDate','jurisdiction','currency','financialImport','financialImportConsent'])if(k in payload)scalar(payload[k]);
  keys(payload.sections,new Set(estateSections));for(const section of Object.values(payload.sections)){keys(section,new Set(['status','items']));scalar(section.status);rows(section.items,estateFields);}
 }else throw new Error('DRAFT_TYPE_INVALID');
 return structuredClone(payload);
}
