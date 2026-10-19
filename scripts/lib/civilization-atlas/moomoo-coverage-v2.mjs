const statementNames={1:'INCOME',2:'BALANCE_SHEET',3:'CASH_FLOW',4:'MAIN_INDEX'};
const finite=r=>typeof r.value==='number'&&Number.isFinite(r.value);
const day=v=>Date.parse(String(v||'').slice(0,10));
export function assessMoomooRequest(req, snapshots) {
  const rows=snapshots.filter(s=>s.capability===req.capability),issues=[],cells=[];
  const types=req.valuationTypes||req.statementTypes||[null];
  for(const symbol of req.instruments||[])for(const type of types){
    const selected=rows.filter(s=>s.request?.symbols?.length===1&&s.request.symbols[0]===symbol&&(!type||(req.capability==='VALUATION'?s.request.valuationType===type:(statementNames[s.request.statementType]||s.request.statementType)===type)));
    const records=selected.flatMap(s=>s.records||[]),valid=records.filter(r=>r.instrument===symbol&&finite(r)&&Number.isFinite(day(r.timestamp))),errors=[];
    if(!selected.length)errors.push('SNAPSHOT_MISSING');if(!valid.length)errors.push('NO_VALID_RECORDS');
    if(records.some(r=>r.instrument!==symbol))errors.push('RECORD_INSTRUMENT_MISMATCH');
    if(valid.length!==records.length)errors.push('INVALID_OR_NULL_RECORDS');
    const keys=new Set();for(const r of valid){const k=[r.instrument,r.fieldPath,r.timestamp,r.meta?.periodText,r.meta?.valuationType].join('|');if(keys.has(k))errors.push('DUPLICATE_RECORD');keys.add(k);}
    const paths=new Set(valid.map(r=>r.fieldPath.split('.').at(-1))),fields=(req.fields||[]).filter(f=>!['time_key','capital_flow_item_time'].includes(f));
    for(const f of fields)if(!paths.has(f))errors.push('FIELD_MISSING:'+f);
    if(req.capability==='VALUATION'&&!valid.some(r=>r.fieldPath==='data.trend.current_value'&&r.value>0&&r.meta?.valuationType===type))errors.push('VALUATION_CURRENT_VALUE_MISSING_OR_INAPPLICABLE');
    if(req.capability==='FINANCIAL_STATEMENTS'){
      if(!valid.some(r=>r.meta?.fieldId!=null&&r.meta?.displayName&&r.meta?.currencyCode&&r.meta?.periodText))errors.push('FINANCIAL_LINEAGE_MISSING');
      const names={INCOME:/Total Revenue|Net Income/,BALANCE_SHEET:/Total Assets|Total Equity/,CASH_FLOW:/Operating Cash Flow/,MAIN_INDEX:/Margin|Return|Equity Ratio/};if(!valid.some(r=>names[type]?.test(r.meta?.displayName)))errors.push('STATEMENT_REQUIRED_FIELDS_MISSING');
      if(req.window?.financialType==='QUARTERLY_ANNUAL'&&!valid.some(r=>/FY|ANNUAL/i.test(r.meta?.periodText||'')))errors.push('ANNUAL_PERIODS_NOT_PROVEN');
    }
    const stamps=valid.map(r=>r.timestamp).sort(),start=stamps[0]||null,end=stamps.at(-1)||null;
    // Seven calendar days tolerates ordinary non-trading days, not an entire missing year.
    if(req.window?.start&&start&&day(start)-day(req.window.start)>7*86400000)errors.push('START_WINDOW_GAP');
    if(req.window?.end&&end&&day(req.window.end)-day(end)>7*86400000)errors.push('END_WINDOW_GAP');
    if(req.capability==='REVENUE_BREAKDOWN'&&new Set(valid.map(r=>r.meta?.period).filter(Boolean)).size<2)errors.push('HISTORICAL_COMPOSITION_NOT_PROVEN');
    cells.push({symbol,type,snapshots:selected.length,records:records.length,validRecords:valid.length,start,end,issues:[...new Set(errors)]});
  }
  for(const s of rows)if((s.request?.symbols||[]).some(x=>!req.instruments?.includes(x)))issues.push('UNREQUESTED_INSTRUMENT');
  const complete=cells.length>0&&cells.every(c=>!c.issues.length)&&!issues.length;
  const state=complete?'SNAPSHOTS_COMPLETE_FOR_PLAN':rows.length?'PARTIAL_SNAPSHOTS':'NO_DATA';
  return {state,cells,issues,calendarCoverage:'BOUNDED_ENDPOINT_CHECK_NOT_EXCHANGE_CALENDAR_CERTIFICATION'};
}
