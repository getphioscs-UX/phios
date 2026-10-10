import {sha256} from '../calculation-runtime/stable-digest.js';
const bounds={TAX_EFFECTIVE_RATE:[0,1],EMERGENCY_RESERVE_MONTHS:[0,120],PROTECTION_INCOME_REPLACEMENT_YEARS:[0,100],EDUCATION_INFLATION:[-0.99,1],RETIREMENT_AGE:[0,120],LONGEVITY_AGE:[0,150],SALARY_GROWTH:[-0.99,1],RETIREMENT_INCOME_REPLACEMENT_RATE:[0,2],INVESTMENT_RETURN:[-0.99,1],EPF_RETURN:[-0.99,1],INFLATION:[-0.99,1],INVESTMENT_CONTRIBUTION_ANNUAL:[0,1e12],INVESTMENT_HORIZON_YEARS:[0,100]};
export async function buildCustomerAssumptionSet(rows=[],asOfDate,scenarioCode='BASE'){
 if(!Array.isArray(rows)||rows.length>30)throw new TypeError('INVALID_ASSUMPTIONS');
 const seen=new Set();
 const assumptions=rows.map((r,i)=>{const b=bounds[r.type],value=Number(r.value);if(!b||r.value===''||r.value==null||!Number.isFinite(value)||value<b[0]||value>b[1]||seen.has(r.type))throw new TypeError('INVALID_EXPLICIT_ASSUMPTION');seen.add(r.type);return {assumptionId:`CUSTOMER-${i+1}`,type:r.type,value,version:'1.0.0',effectiveDate:asOfDate,sourceLabel:'Explicit customer assumption; unverified'};});
 const set={schemaVersion:'PHI-OS-FCR-ASSUMPTION-SET-v1.0.0',assumptionSetId:`AS-CUSTOMER-${scenarioCode}`,version:'1.0.0',effectiveDate:asOfDate,sourceLabel:'Explicit customer assumptions only',scenarioCode,assumptions};
 return {...set,digest:await sha256(set)};
}
