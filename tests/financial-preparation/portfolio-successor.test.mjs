import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateRental,calculateRentalPortfolio,validateToolScenarios} from '../../functions/financial/calculation-runtime/customer-finance-tools.js';
import {onRequestPost} from '../../functions/api/customer-finance-tools.js';
import {localAccount} from './local-account.mjs';
const base={asOfDate:'2026-10-19',currency:'MYR',period:'MONTHLY',mode:'ACTUAL',rentReceived:'1000',costs:[{id:'repair',kind:'OPERATING',amount:'100',rentalUseRatio:'1',cashShareRatio:'0.5',category:'REPAIR',amountState:'EXACT',cashTiming:'PAID',evidenceRef:'TEST_ONLY_RECEIPT'}]};
test('portfolio API keeps four period/mode/currency groups and stable property identities',async()=>{
 const inputs=[base,{...base,period:'ANNUAL'},{...base,currency:'USD'},{...base,mode:'FORECAST',forecastMonthlyRent:'1000',occupiedMonths:'1',costs:[]}];
 const input={schemaVersion:'RENTAL_PORTFOLIO_V1',selectedPropertyId:'p0',properties:inputs.map((input,i)=>({propertyId:'p'+i,label:'TEST_ONLY '+i,input:{...input,propertyRef:'p'+i}}))};
 validateToolScenarios({rentalPortfolio:input});const a=localAccount();const response=await onRequestPost(a.context({kind:'rentalPortfolio',input}));assert.equal(response.status,200);const body=await response.json();assert.equal(body.result.subtotals.length,4);assert.equal(body.result.properties[0].result.netCashFlow,'950.00');assert.equal(body.result.crossCurrencyTotal,null);assert.equal(body.source.sourceKind,'EPHEMERAL');a.sql.close();
});
test('unknown amounts and unpaid costs cannot be coerced into zero cash; metadata survives',()=>{
 assert.throws(()=>validateToolScenarios({rentalEditsPending:true}),{code:'RENTAL_RECALCULATION_REQUIRED'});
 const unknown={...base,costs:[{...base.costs[0],amountState:'UNKNOWN',amount:''}]};assert.equal(calculateRental(unknown).netCashFlow,null);assert.equal(calculateRentalPortfolio([{propertyId:'p',input:unknown}]).subtotals[0].netCashFlow,null);
 assert.equal(calculateRental({...base,costs:[{...base.costs[0],cashTiming:'ACCRUED_NOT_PAID'}]}).netCashFlow,null);
 assert.equal(calculateRental({...base,costs:[{...base.costs[0],amountState:'APPROXIMATE'}]}).cashPrecision,'APPROXIMATE');
 assert.throws(()=>calculateRental({...unknown,costs:[{...unknown.costs[0],kind:'FAKE'}]}),{code:'COST_KIND_REQUIRED'});
 assert.throws(()=>calculateRental({...base,costs:[{...base.costs[0],currency:'USD'}]}),{code:'RENTAL_COST_CURRENCY_MISMATCH'});
});
