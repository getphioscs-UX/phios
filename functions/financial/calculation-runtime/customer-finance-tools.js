import {rentalMetric,rentalAggregate,RENTAL_METRIC_CONTRACT} from './rental-metric-semantics-v2.js';
// Integer minor units, rational rates and explicit HALF_UP. No model arithmetic.
import {validateRentalCostMetadata,validateRentalPortfolio} from './rental-fact-metadata.js';
const fail=code=>{throw Object.assign(new Error(code),{code,status:422});};
function decimal(v,name){if(!['string','number'].includes(typeof v)||String(v).length>40||!/^\d+(\.\d{1,8})?$/.test(String(v)))fail(`INVALID_${name}`);const [a,b='']=String(v).split('.');return {n:BigInt(a+b),d:10n**BigInt(b.length)};}
function supportedCurrency(v){if(!['MYR','SGD','USD','GBP','EUR'].includes(v))fail('CURRENCY_TWO_DECIMAL_MODEL_NOT_SUPPORTED');}
const round=(n,d)=>(n+d/2n)/d;
export function minor(v){const {n,d}=decimal(v,'MONEY');return round(n*100n,d);}
export function money(n){const sign=n<0n?'-':'';n=n<0n?-n:n;return sign+(n/100n)+'.'+String(n%100n).padStart(2,'0');}
function date(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)fail('INVALID_DATE');return value;}
function due(first,index){const [y,m,d]=first.split('-').map(Number);const day=new Date(Date.UTC(y,m-1+index,1));const last=new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth()+1,0)).getUTCDate();return `${day.getUTCFullYear()}-${String(day.getUTCMonth()+1).padStart(2,'0')}-${String(Math.min(d,last)).padStart(2,'0')}`;}
export function calculateLoan(input){
 supportedCurrency(input?.currency);
 if(!input||!['ORIGINAL','OUTSTANDING'].includes(input.principalType))fail('PRINCIPAL_BASIS_REQUIRED');
 date(input.asOfDate);date(input.firstPaymentDate);if(input.firstPaymentDate<input.asOfDate)fail('PAYMENT_BEFORE_AS_OF_DATE');
 if(input.rateType!=='FIXED_NOMINAL_ANNUAL'||input.frequency!=='MONTHLY'||input.timing!=='PERIOD_END')fail('UNSUPPORTED_LOAN_MODEL');
 const P=minor(input.principal),rate=decimal(input.annualRatePercent,'RATE'),num=rate.n,den=rate.d*1200n;
 const n=input.remainingMonths;if(!Number.isInteger(n)||n<1||n>600)fail('INVALID_LOAN_TERM_OR_PRINCIPAL');
 const eventExtras={};if(input.extraPaymentEvents!==undefined){if(!Array.isArray(input.extraPaymentEvents)||input.extraPaymentEvents.length>100||input.extraByPeriod!==undefined)fail('EXTRA_EVENT_SET_INVALID');const ids=new Set();for(const event of Array.from(input.extraPaymentEvents)){if(!event||Object.keys(event).some(k=>!['id','startPeriod','endPeriod','amount','currency','repeat'].includes(k))||typeof event.id!=='string'||!event.id||ids.has(event.id)||event.currency!==input.currency||!['ONCE','MONTHLY'].includes(event.repeat)||!Number.isInteger(event.startPeriod)||!Number.isInteger(event.endPeriod)||event.startPeriod<1||event.endPeriod<event.startPeriod||event.endPeriod>n||event.repeat==='ONCE'&&event.startPeriod!==event.endPeriod)fail('EXTRA_EVENT_INVALID');ids.add(event.id);const amount=minor(event.amount);for(let p=event.startPeriod;p<=event.endPeriod;p++)eventExtras[p]=(eventExtras[p]||0n)+amount;}}
 let payment;if(input.paymentMode==='ACTUAL_FIXED'){payment=minor(input.actualPayment);if(payment<=0n)fail('INVALID_PAYMENT');}else if(input.paymentMode==='DERIVED_PMT'){if(num===0n)payment=round(P,BigInt(n));else{const A=(den+num)**BigInt(n),B=den**BigInt(n);payment=round(P*num*A,den*(A-B));}}else fail('PAYMENT_MODE_REQUIRED');
 const recurring=minor(input.extraMonthly??'0'),fee=minor(input.feeMonthly??'0');const rows=[];let balance=P,totalInterest=0n,totalRegular=0n,totalExtra=0n,totalFees=0n;
 for(let i=0;i<n&&balance>0n;i++){
  const opening=balance,interest=round(opening*num,den),owed=opening+interest;
  if(payment<=interest&&owed>payment)fail('NEGATIVE_AMORTIZATION');
  let regular=payment>owed?owed:payment;if(i===n-1&&input.paymentMode==='DERIVED_PMT')regular=owed;
  const requested=minor(input.extraByPeriod?.[i+1]??money(recurring))+(eventExtras[i+1]||0n),available=owed-regular,extra=requested>available?available:requested;
  balance=owed-regular-extra;totalInterest+=interest;totalRegular+=regular;totalExtra+=extra;totalFees+=fee;
  rows.push({period:i+1,dueDate:due(input.firstPaymentDate,i),opening:money(opening),interest:money(interest),regularPayment:money(regular),principalPaid:money(regular-interest+extra),requestedExtra:money(requested),appliedExtra:money(extra),fees:money(fee),closing:money(balance)});
 }
 const result={model:'FIXED_NOMINAL_ANNUAL_MONTHLY_PERIOD_END',rounding:'MINOR_UNIT_HALF_UP_EACH_PERIOD',currency:input.currency,principalType:input.principalType,asOfDate:input.asOfDate,payment:money(payment),periods:rows.length,totalInterest:money(totalInterest),totalRegular:money(totalRegular),totalExtra:money(totalExtra),totalFees:money(totalFees),totalPaid:money(totalRegular+totalExtra+totalFees),unpaidBalance:money(balance),status:balance===0n?'AMORTIZED':'BALANCE_REMAINS_NO_HIDDEN_BALLOON',schedule:rows};
 result.firstPeriodConvention='FULL_MONTH_MODEL_NOT_DAILY_ACCRUAL';result.dateRollConvention='ORIGINAL_DAY_ANCHOR_SHORT_MONTH_END';result.finalPaymentPolicy=input.paymentMode==='DERIVED_PMT'?'FINAL_SCHEDULED_PERIOD_ROUNDING_CLEARANCE':'ACTUAL_FIXED_NO_AUTOMATIC_BALLOON';
 if(totalExtra>0n&&balance===0n){const baseline=calculateLoan({...input,extraMonthly:'0',extraByPeriod:undefined,extraPaymentEvents:undefined});if(baseline.unpaidBalance==='0.00')result.comparison={basis:'SAME_FIXED_RATE_PAYMENT_AND_PERIOD_CONVENTION_NO_EXTRA',baselineInterest:baseline.totalInterest,interestSaved:money(minor(baseline.totalInterest)-totalInterest),periodsSaved:baseline.periods-rows.length};}
 return result;
}
export function validateToolScenarios(scenarios){
 if(scenarios?.rentalEditsPending)fail('RENTAL_RECALCULATION_REQUIRED');
 if(!scenarios||typeof scenarios!=='object'||Array.isArray(scenarios)||Object.keys(scenarios).some(k=>!['loan','rental','rentalPortfolio'].includes(k)))fail('TOOL_SCENARIO_INVALID');
 for(const [kind,input] of Object.entries(scenarios)){
  if(kind==='rentalPortfolio'){validateRentalPortfolio(input);for(const property of input.properties)validateToolScenarios({rental:property.input});calculateRentalPortfolio(input.properties);continue;}
  const allowed=kind==='loan'?['principalType','asOfDate','firstPaymentDate','currency','rateType','frequency','timing','paymentMode','principal','annualRatePercent','remainingMonths','actualPayment','extraMonthly','feeMonthly','extraByPeriod','extraPaymentEvents']:['asOfDate','currency','period','mode','forecastMonthlyRent','occupiedMonths','rentReceived','otherRentalIncome','costs','debtService','capitalExpenditure','propertyRef'];
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))fail('TOOL_INPUT_FIELD_INVALID');
  if(kind==='loan'){
   if(input.extraByPeriod&&(typeof input.extraByPeriod!=='object'||Array.isArray(input.extraByPeriod)||Object.keys(input.extraByPeriod).length>600||Object.keys(input.extraByPeriod).some(k=>!/^\d{1,3}$/.test(k)||Number(k)<1||Number(k)>600)))fail('EXTRA_PAYMENT_PERIOD_INVALID');
   calculateLoan(input);
  }else{
   if(!Array.isArray(input.costs))fail('RENTAL_COST_FIELD_INVALID');for(const cost of Array.from(input.costs))validateRentalCostMetadata(cost,input);
   calculateRental(input);
  }
 }
 return structuredClone(scenarios);
}
export function calculateRental(input){
 date(input.asOfDate);supportedCurrency(input.currency);
 if(input.period!==undefined&&!['ANNUAL','MONTHLY'].includes(input.period))fail('RENTAL_PERIOD_INVALID');
 const mode=input.mode||'ACTUAL';if(!['ACTUAL','FORECAST'].includes(mode))fail('RENTAL_MODE_INVALID');let rent;
 if(mode==='FORECAST'){if(!['ANNUAL','MONTHLY'].includes(input.period))fail('FORECAST_PERIOD_REQUIRED');const occupied=decimal(input.occupiedMonths,'OCCUPIED_MONTHS');if(occupied.n>BigInt(input.period==='ANNUAL'?12:1)*occupied.d)fail('OCCUPIED_MONTHS_OUT_OF_RANGE');rent=round(minor(input.forecastMonthlyRent)*occupied.n,occupied.d);}else rent=minor(input.rentReceived);
 if(!Array.isArray(input.costs)||input.costs.length>100)fail('RENTAL_COSTS_REQUIRED');
 const sum=items=>rentalAggregate(items,{money,minor}),sub=items=>rentalAggregate(items,{money,minor,subtract:true}),zero=()=>rentalMetric('0.00');
 const scalar=(value,name)=>value===undefined||value===null||value===''?rentalMetric(null,'UNKNOWN',[name+'_MISSING']):rentalMetric(money(minor(value)));
 const rows=[],ids=new Set();
 for(const cost of input.costs){if(ids.has(cost.id))fail('DUPLICATE_COST');ids.add(cost.id);const metadata=validateRentalCostMetadata(cost,input);
  const missingAmount=cost.amount===undefined||cost.amount===null||cost.amount==='',amount=metadata.amountState==='UNKNOWN'||missingAmount?null:minor(cost.amount);
  const precision=amount===null?'UNKNOWN':metadata.amountState,reasons=metadata.missingFields.map(k=>'MISSING_'+k.toUpperCase());if(amount===null)reasons.push('AMOUNT_UNKNOWN');
  const ratio=[null,undefined,''].includes(cost.rentalUseRatio)?null:decimal(cost.rentalUseRatio,'RENTAL_USE_RATIO'),cashRatio=decimal(cost.cashShareRatio??1,'CASH_SHARE_RATIO');if(ratio&&ratio.n>ratio.d||cashRatio.n>cashRatio.d)fail('RENTAL_RATIO_OUT_OF_RANGE');
  const cashAmount=cashRatio.n===0n?'0.00':amount===null?null:money(round(amount*cashRatio.n,cashRatio.d)),allocated=ratio?.n===0n||amount===0n&&precision==='EXACT'?'0.00':amount===null||ratio===null?null:money(round(amount*ratio.n,ratio.d)),cashPrecision=cashRatio.n===0n?'EXACT':precision;
  const allocatedMetric=rentalMetric(allocated,ratio?.n===0n?'EXACT':precision,allocated===null?[...reasons,'TAX_ALLOCATION_UNRESOLVED']:reasons);
  let paid,pending;
  if(metadata.cashTiming==='ACCRUED_NOT_PAID'){paid=zero();pending=rentalMetric(cashAmount,cashPrecision,reasons);}
  else if(metadata.cashTiming==='PAID'||metadata.cashTiming==='FORECAST'&&mode==='FORECAST'){paid=rentalMetric(cashAmount,cashPrecision,reasons);pending=zero();}
  else {paid=cashAmount==='0.00'&&cashPrecision==='EXACT'?zero():rentalMetric(null,'UNKNOWN',[...reasons,'PAYMENT_TIME_UNCONFIRMED']);pending=cashAmount==='0.00'&&cashPrecision==='EXACT'?zero():rentalMetric(null,'UNKNOWN',[...reasons,'PAYMENT_TIME_UNCONFIRMED']);}
  rows.push({id:cost.id,label:cost.label||cost.id,kind:cost.kind,...metadata,amount:amount===null?null:money(amount),rentalUseRatio:ratio?String(cost.rentalUseRatio):null,cashShareRatio:String(cost.cashShareRatio??1),cashAllocated:cashAmount,allocated,metrics:{paid,pending,taxCandidate:allocatedMetric},deductibility:'UNVERIFIED_NO_APPROVED_TAX_BUNDLE'});
 }
 if(input.costs.some(c=>c.kind==='CAPITAL')&&input.capitalExpenditure!==undefined&&minor(input.capitalExpenditure)>0n)fail('CAPEX_DUPLICATE_SOURCE');
 const metrics={grossIncome:sum([rentalMetric(money(rent)),scalar(input.otherRentalIncome??'0','OTHER_RENTAL_INCOME')]),operatingCosts:sum(rows.filter(r=>r.kind==='OPERATING').map(r=>r.metrics.paid)),allocatedCandidateCosts:sum(rows.filter(r=>r.kind!=='CAPITAL').map(r=>r.metrics.taxCandidate)),debtService:scalar(input.debtService,'DEBT_SERVICE'),capitalExpenditure:sum([scalar(input.capitalExpenditure??'0','CAPITAL_EXPENDITURE'),...rows.filter(r=>r.kind==='CAPITAL').map(r=>r.metrics.paid)]),pendingPayments:sum(rows.filter(r=>r.kind!=='FINANCING_INTEREST').map(r=>r.metrics.pending))};
 // Debt service is the cash source; an interest tax-candidate row is never a second cash deduction.
 metrics.operatingCashFlow=sub([metrics.grossIncome,metrics.operatingCosts]);metrics.cashAfterDebt=sub([metrics.operatingCashFlow,metrics.debtService]);metrics.netCashFlow=sub([metrics.cashAfterDebt,metrics.capitalExpenditure]);metrics.netBeforeTaxEligibility=sub([metrics.grossIncome,metrics.allocatedCandidateCosts]);
 const result={metricContract:RENTAL_METRIC_CONTRACT,metrics,cashPrecision:metrics.netCashFlow.precision,mode,receiptBasis:mode==='FORECAST'?'EXPLICIT_MONTHLY_RENT_OCCUPANCY_MODEL':'ACTUAL_PERIOD_RECEIPTS_NO_VACANCY_REDEDUCTION',currency:input.currency,asOfDate:input.asOfDate,period:input.period||'UNSPECIFIED_SAME_PERIOD_ARITHMETIC_ONLY',...Object.fromEntries(Object.entries(metrics).map(([k,m])=>[k,m.value])),taxableIncome:null,taxPayable:null,taxStatus:'APPROVED_YEAR_AND_JURISDICTION_BUNDLE_REQUIRED',rows};
 const candidate=result.netBeforeTaxEligibility;result.positiveCandidate=candidate===null?null:money(signedMinor(candidate)>0n?signedMinor(candidate):0n);result.lossCandidate=candidate===null?null:money(signedMinor(candidate)<0n?signedMinor(candidate):0n);return result;
}
export function calculateRentalPortfolio(properties){
 if(!Array.isArray(properties)||!properties.length||properties.length>100)fail('RENTAL_PROPERTIES_REQUIRED');const ids=new Set(),groups=new Map();
 const results=properties.map(p=>{if(!p.propertyId||ids.has(p.propertyId))fail('RENTAL_PROPERTY_ID_INVALID');ids.add(p.propertyId);const result=calculateRental(p.input),key=[result.currency,result.asOfDate,result.period,result.mode].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(result);return {propertyId:p.propertyId,label:p.label||p.propertyId,assetRef:p.assetRef||null,loanRefs:p.loanRefs||[],result};});
 const subtotals=[...groups.values()].map(items=>{const first=items[0],metrics=Object.fromEntries(Object.keys(first.metrics).map(k=>[k,rentalAggregate(items.map(r=>r.metrics[k]),{money,minor})]));return {currency:first.currency,asOfDate:first.asOfDate,period:first.period,mode:first.mode,metrics,cashPrecision:metrics.netCashFlow.precision,...Object.fromEntries(Object.entries(metrics).map(([k,m])=>[k,m.value])),taxableIncome:null,taxPayable:null,taxStatus:'JURISDICTION_YEAR_AND_LOSS_ORDER_APPROVAL_REQUIRED'};});
 return {metricContract:RENTAL_METRIC_CONTRACT,properties:results,subtotals,crossCurrencyTotal:null};
}
function signedMinor(value){return value.startsWith('-')?-minor(value.slice(1)):minor(value);}
export function calculateRentalAreaShare({totalArea,rentalArea}={}){
 if([totalArea,rentalArea].some(v=>v===null||v===undefined||v===''))return {state:'UNKNOWN',ratio:null,reason:'AREA_NOT_PROVIDED'};
 const total=decimal(totalArea,'TOTAL_AREA'),rental=decimal(rentalArea,'RENTAL_AREA');
 if(total.n===0n)fail('TOTAL_AREA_MUST_BE_POSITIVE');const n=rental.n*total.d,d=rental.d*total.n;if(n>d)fail('RENTAL_AREA_EXCEEDS_TOTAL');const scaled=round(n*100000000n,d);
 return {state:'CALCULATED_FROM_DECLARED_AREA',ratio:scaled===0n?'0':scaled===100000000n?'1':`0.${String(scaled).padStart(8,'0')}`.replace(/0+$/,''),unit:'FRACTION_0_TO_1',precision:'8_DECIMAL_HALF_UP',taxEligibilityVerified:false};
}
