// Integer minor units, rational rates and explicit HALF_UP. No model arithmetic.
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
 if(!scenarios||typeof scenarios!=='object'||Array.isArray(scenarios)||Object.keys(scenarios).some(k=>!['loan','rental'].includes(k)))fail('TOOL_SCENARIO_INVALID');
 for(const [kind,input] of Object.entries(scenarios)){
  const allowed=kind==='loan'?['principalType','asOfDate','firstPaymentDate','currency','rateType','frequency','timing','paymentMode','principal','annualRatePercent','remainingMonths','actualPayment','extraMonthly','feeMonthly','extraByPeriod','extraPaymentEvents']:['asOfDate','currency','period','mode','forecastMonthlyRent','occupiedMonths','rentReceived','otherRentalIncome','costs','debtService','capitalExpenditure'];
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))fail('TOOL_INPUT_FIELD_INVALID');
  if(kind==='loan'){
   if(input.extraByPeriod&&(typeof input.extraByPeriod!=='object'||Array.isArray(input.extraByPeriod)||Object.keys(input.extraByPeriod).length>600||Object.keys(input.extraByPeriod).some(k=>!/^\d{1,3}$/.test(k)||Number(k)<1||Number(k)>600)))fail('EXTRA_PAYMENT_PERIOD_INVALID');
   calculateLoan(input);
  }else{
   if(!Array.isArray(input.costs)||input.costs.some(c=>!c||Object.keys(c).some(k=>!['id','kind','amount','rentalUseRatio','cashShareRatio','label'].includes(k))||c.label!==undefined&&(typeof c.label!=='string'||c.label.length>120)))fail('RENTAL_COST_FIELD_INVALID');
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
 const gross=rent+minor(input.otherRentalIncome??'0');
 if(!Array.isArray(input.costs)||input.costs.length>100)fail('RENTAL_COSTS_REQUIRED');
 const ids=new Set();let taxCandidateCosts=0n,operating=0n,taxAllocationUnknown=false;const rows=[];
 for(const cost of input.costs){if(!cost.id||ids.has(cost.id))fail('DUPLICATE_COST');ids.add(cost.id);const amount=minor(cost.amount),ratio=[null,undefined,''].includes(cost.rentalUseRatio)?null:decimal(cost.rentalUseRatio,'RENTAL_USE_RATIO'),cashRatio=decimal(cost.cashShareRatio??1,'CASH_SHARE_RATIO');if(ratio&&ratio.n>ratio.d||cashRatio.n>cashRatio.d)fail('RENTAL_RATIO_OUT_OF_RANGE');const allocated=ratio?round(amount*ratio.n,ratio.d):null,cashAllocated=round(amount*cashRatio.n,cashRatio.d);
  if(!['OPERATING','FINANCING_INTEREST','CAPITAL'].includes(cost.kind))fail('COST_KIND_REQUIRED');
  if(cost.kind==='OPERATING')operating+=cashAllocated;
  if(cost.kind!=='CAPITAL'){if(allocated===null)taxAllocationUnknown=true;else taxCandidateCosts+=allocated;}
  rows.push({id:cost.id,label:cost.label||cost.id,kind:cost.kind,amount:money(amount),rentalUseRatio:ratio?String(cost.rentalUseRatio):null,cashShareRatio:String(cost.cashShareRatio??1),cashBasis:cost.cashShareRatio===undefined?'DECLARED_CUSTOMER_CASH_AMOUNT_NO_FURTHER_ALLOCATION':'EXPLICIT_CUSTOMER_CASH_SHARE',cashAllocated:money(cashAllocated),allocated:allocated===null?null:money(allocated),deductibility:'UNVERIFIED_NO_APPROVED_TAX_BUNDLE'});
 }
 const debt=minor(input.debtService??'0'),capex=minor(input.capitalExpenditure??'0');
 if(input.costs.some(c=>c.kind==='CAPITAL')&&capex>0n)fail('CAPEX_DUPLICATE_SOURCE');
 const capitalRows=rows.filter(x=>x.kind==='CAPITAL').reduce((n,x)=>n+minor(x.cashAllocated),0n);
 const candidate=gross-taxCandidateCosts,op=gross-operating,cash=op-debt-capex-capitalRows;
 return {mode,receiptBasis:mode==='FORECAST'?'EXPLICIT_MONTHLY_RENT_OCCUPANCY_MODEL':'ACTUAL_PERIOD_RECEIPTS_NO_VACANCY_REDEDUCTION',currency:input.currency,asOfDate:input.asOfDate,period:input.period||'UNSPECIFIED_SAME_PERIOD_ARITHMETIC_ONLY',grossIncome:money(gross),allocatedCandidateCosts:taxAllocationUnknown?null:money(taxCandidateCosts),netBeforeTaxEligibility:taxAllocationUnknown?null:money(candidate),positiveCandidate:taxAllocationUnknown?null:money(candidate>0n?candidate:0n),lossCandidate:taxAllocationUnknown?null:money(candidate<0n?candidate:0n),operatingCosts:money(operating),operatingCashFlow:money(op),debtService:money(debt),capitalExpenditure:money(capex+capitalRows),cashAfterDebt:money(op-debt),netCashFlow:money(cash),taxableIncome:null,taxPayable:null,taxStatus:'APPROVED_YEAR_AND_JURISDICTION_BUNDLE_REQUIRED',rows};
}
export function calculateRentalPortfolio(properties){
 if(!Array.isArray(properties)||!properties.length||properties.length>100)fail('RENTAL_PROPERTIES_REQUIRED');const ids=new Set(),groups={};
 const results=properties.map(p=>{if(!p.propertyId||ids.has(p.propertyId))fail('RENTAL_PROPERTY_ID_INVALID');ids.add(p.propertyId);const result=calculateRental(p.input),key=`${result.currency}:${result.asOfDate}`;const group=groups[key]??={currency:result.currency,asOfDate:result.asOfDate,gross:0n,candidate:0n,cash:0n};group.gross+=minor(result.grossIncome);if(result.netBeforeTaxEligibility===null)group.candidateUnknown=true;else group.candidate+=signedMinor(result.netBeforeTaxEligibility);group.cash+=signedMinor(result.netCashFlow);return {propertyId:p.propertyId,result};});
 return {properties:results,subtotals:Object.values(groups).map(g=>({currency:g.currency,asOfDate:g.asOfDate,grossIncome:money(g.gross),netBeforeTaxEligibility:g.candidateUnknown?null:money(g.candidate),netCashFlow:money(g.cash),taxableIncome:null,taxPayable:null,taxStatus:'JURISDICTION_YEAR_AND_LOSS_ORDER_APPROVAL_REQUIRED'})),crossCurrencyTotal:null};
}
function signedMinor(value){return value.startsWith('-')?-minor(value.slice(1)):minor(value);}
export function calculateRentalAreaShare({totalArea,rentalArea}={}){
 if([totalArea,rentalArea].some(v=>v===null||v===undefined||v===''))return {state:'UNKNOWN',ratio:null,reason:'AREA_NOT_PROVIDED'};
 const total=decimal(totalArea,'TOTAL_AREA'),rental=decimal(rentalArea,'RENTAL_AREA');
 if(total.n===0n)fail('TOTAL_AREA_MUST_BE_POSITIVE');const n=rental.n*total.d,d=rental.d*total.n;if(n>d)fail('RENTAL_AREA_EXCEEDS_TOTAL');const scaled=round(n*100000000n,d);
 return {state:'CALCULATED_FROM_DECLARED_AREA',ratio:scaled===0n?'0':scaled===100000000n?'1':`0.${String(scaled).padStart(8,'0')}`.replace(/0+$/,''),unit:'FRACTION_0_TO_1',precision:'8_DECIMAL_HALF_UP',taxEligibilityVerified:false};
}
