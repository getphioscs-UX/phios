const fail=code=>{throw Object.assign(Error(code),{code,status:422});};
export const RENTAL_COST_FIELDS=Object.freeze(['id','kind','amount','rentalUseRatio','cashShareRatio','label','propertyRef','category','amountState','currency','period','cashTiming','actualForecast','evidenceRef','cashAllocationBasis','taxAllocationBasis','loanRef','ownershipRef']);
export const RENTAL_CATEGORIES=Object.freeze(['OPERATING_OTHER','FINANCING_INTEREST','QUIT_RENT','ASSESSMENT','FIRE_INSURANCE','MANAGEMENT','SINKING_FUND','REPAIR','RENEWAL','ADVERTISING','CAPITAL']);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
export function validateRentalCostMetadata(cost,input){
 if(!['OPERATING','FINANCING_INTEREST','CAPITAL'].includes(cost?.kind))fail('COST_KIND_REQUIRED');
 if(!cost||Array.isArray(cost)||Object.keys(cost).some(k=>!RENTAL_COST_FIELDS.includes(k))||!id(cost.id))fail('RENTAL_COST_FIELD_INVALID');
 for(const key of ['propertyRef','loanRef','ownershipRef'])if(cost[key]!==undefined&&cost[key]!==''&&!id(cost[key]))fail('RENTAL_REFERENCE_INVALID');
 for(const key of ['label','evidenceRef','cashAllocationBasis','taxAllocationBasis'])if(cost[key]!==undefined&&(typeof cost[key]!=='string'||cost[key].length>200))fail('RENTAL_METADATA_INVALID');
 if(cost.propertyRef&&input.propertyRef&&cost.propertyRef!==input.propertyRef)fail('RENTAL_PROPERTY_REFERENCE_MISMATCH');
 if(cost.currency&&cost.currency!==input.currency)fail('RENTAL_COST_CURRENCY_MISMATCH');
 if(cost.period&&cost.period!==input.period)fail('RENTAL_COST_PERIOD_MISMATCH');
 if(cost.category&&!RENTAL_CATEGORIES.includes(cost.category))fail('RENTAL_CATEGORY_INVALID');
 if(cost.amountState&&!['EXACT','APPROXIMATE','UNKNOWN'].includes(cost.amountState))fail('RENTAL_AMOUNT_STATE_UNSUPPORTED');
 if(cost.cashTiming&&!['PAID','ACCRUED_NOT_PAID','UNKNOWN','FORECAST'].includes(cost.cashTiming))fail('RENTAL_CASH_TIMING_INVALID');
 if(cost.actualForecast&&cost.actualForecast!==(input.mode||'ACTUAL'))fail('RENTAL_FACT_MODE_MISMATCH');
 if(cost.cashTiming==='FORECAST'&&(input.mode||'ACTUAL')!=='FORECAST')fail('RENTAL_FACT_MODE_MISMATCH');
 return {propertyRef:cost.propertyRef||input.propertyRef||null,category:cost.category||'OPERATING_OTHER',amountState:cost.amountState||'EXACT',currency:cost.currency||input.currency,period:cost.period||input.period||null,cashTiming:cost.cashTiming||((input.mode||'ACTUAL')==='FORECAST'?'FORECAST':'PAID'),actualForecast:cost.actualForecast||input.mode||'ACTUAL',evidenceRef:cost.evidenceRef||null,cashAllocationBasis:cost.cashAllocationBasis||null,taxAllocationBasis:cost.taxAllocationBasis||null,loanRef:cost.loanRef||null,ownershipRef:cost.ownershipRef||null,legacyMetadataUnspecified:!cost.amountState||!cost.cashTiming||!cost.propertyRef};
}
export function validateRentalPortfolio(value){
 if(!value||value.schemaVersion!=='RENTAL_PORTFOLIO_V1'||Object.keys(value).some(k=>!['schemaVersion','selectedPropertyId','properties'].includes(k))||!Array.isArray(value.properties)||!value.properties.length||value.properties.length>50)fail('RENTAL_PORTFOLIO_INVALID');
 const ids=new Set();for(const p of Array.from(value.properties)){if(!p||Object.keys(p).some(k=>!['propertyId','label','assetRef','loanRefs','input'].includes(k))||!id(p.propertyId)||ids.has(p.propertyId)||typeof p.label!=='string'||p.label.length>120||!p.input)fail('RENTAL_PROPERTY_INVALID');ids.add(p.propertyId);if(p.assetRef&&!id(p.assetRef))fail('RENTAL_REFERENCE_INVALID');if(p.loanRefs!==undefined&&(!Array.isArray(p.loanRefs)||Array.from(p.loanRefs).some(x=>!id(x))||new Set(p.loanRefs).size!==p.loanRefs.length))fail('RENTAL_REFERENCE_INVALID');if(p.input.propertyRef&&p.input.propertyRef!==p.propertyId)fail('RENTAL_PROPERTY_REFERENCE_MISMATCH');}
 if(!ids.has(value.selectedPropertyId))fail('RENTAL_SELECTION_INVALID');return value;
}
