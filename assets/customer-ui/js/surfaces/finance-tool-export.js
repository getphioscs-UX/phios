// Serialization only. Values come from the server calculation; no spreadsheet arithmetic.
export function serializeFinanceToolCsv(payload,kind){
 const source=payload.source,result=payload.result;
 const rows=[['PHI OS financial tool',kind],['Source version',source.sourceKind==='SAVED_INTAKE'?source.version:'TEMPORARY_UNSAVED'],['Source digest',source.contentDigest||''],['Currency',result.currency],['As of date',result.asOfDate]];
 if(kind==='loan'){
  rows.push(['Payment',result.payment],['Periods',result.periods],['Total interest',result.totalInterest],['Total regular payments',result.totalRegular],['Total extra payments',result.totalExtra],['Total paid',result.totalPaid],['Unpaid balance',result.unpaidBalance]);
  const fields=['period','dueDate','opening','interest','regularPayment','principalPaid','requestedExtra','appliedExtra','fees','closing'];rows.push(fields,...result.schedule.map(row=>fields.map(key=>row[key])));
 }else{
  rows.push(['Period',result.period],['Gross income',result.grossIncome],['Operating costs',result.operatingCosts],['Operating cash flow',result.operatingCashFlow],['Debt service',result.debtService],['Capital expenditure',result.capitalExpenditure],['Net cash flow',result.netCashFlow],['Taxable income','NOT_VERIFIED'],['Tax payable','NOT_VERIFIED']);const fields=['id','label','kind','category','propertyRef','amount','amountState','currency','period','cashTiming','actualForecast','rentalUseRatio','cashShareRatio','cashAllocated','allocated','evidenceRef','cashAllocationBasis','taxAllocationBasis','loanRef','ownershipRef'];rows.push(fields,...result.rows.map(row=>fields.map(key=>row[key])));
 }
 const cell=value=>{let text=String(value??'');if(!/^-?\d+(\.\d+)?$/.test(text)&&/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
