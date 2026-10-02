const toIsoMs=v=>{const n=Number(v);if(!Number.isFinite(n))return null;return new Date(n).toISOString();};
const toIsoSec=v=>{const n=Number(v);if(!Number.isFinite(n))return null;return new Date(n*1000).toISOString();};
const val=(v)=>v==null?null:(typeof v==='number'?v:Number.isFinite(Number(v))?Number(v):v);
export function normalizeCapitalFlow({symbol,response}={}){
  const rows=response?.data?.flow_list||[];
  return rows.flatMap(row=>['in_flow','main_in_flow','super_in_flow','big_in_flow','mid_in_flow','sml_in_flow','main_deal_ratio','acc_main_in_flow']
    .filter(k=>row[k]!=null)
    .map(k=>({fieldPath:'data.flow_list[].'+k,instrument:symbol,timestamp:toIsoMs(row.capital_flow_item_time),value:val(row[k]),unit:k.includes('ratio')?'ratio':'currency'})));
}
export function normalizeValuation({symbol,response,valuationType}={}){
  const d=response?.data||{};
  const out=[];
  const stamp=toIsoSec(d.last_update_time);
  for(const k of ['current_value','average_value','avg_minus_1_stddev','avg_plus_1_stddev','forward_value','valuation_percentile']){
    if(d.trend?.[k]!=null)out.push({fieldPath:'data.trend.'+k,instrument:symbol,timestamp:stamp,value:val(d.trend[k]),unit:k==='valuation_percentile'?'percentile':'multiple',meta:{valuationType}});
  }
  for(const row of d.trend?.historical_items||[]){
    out.push({fieldPath:'data.trend.historical_items[].value',instrument:symbol,timestamp:toIsoSec(row.time),value:val(row.value),unit:'multiple',meta:{valuationType}});
  }
  return out;
}
export function normalizeFinancials({symbol,response,statementType}={}){
  const reports=response?.data?.report_list||[];
  const out=[];
  for(const report of reports){
    const stamp=toIsoMs(report.date_time);
    for(const item of report.item_list||[]){
      if(item.data==null)continue;
      out.push({fieldPath:'data.report_list[].item_list[field_id='+item.field_id+'].data',instrument:symbol,timestamp:stamp,value:val(item.data),unit:item.value_type||null,meta:{statementType,fieldId:item.field_id,displayName:item.display_name,periodText:report.period_text,fiscalYear:report.fiscal_year,currencyCode:report.currency_code,accountingStandards:report.accounting_standards}});
    }
  }
  return out;
}
export function normalizeRevenueBreakdown({symbol,response}={}){
  const d=response?.data||{};
  const stamp=(d.screen_date_list||[])[0]?.date?toIsoSec((d.screen_date_list||[])[0].date):null;
  const out=[];
  for(const group of d.breakdown_list||[]){
    for(const item of group.item_list||[]){
      if(item.main_oper_income!=null)out.push({fieldPath:'data.breakdown_list[type='+group.type+'].item_list['+item.name+'].main_oper_income',instrument:symbol,timestamp:stamp,value:val(item.main_oper_income),unit:d.currency_code||'currency',meta:{breakdownType:group.type,itemName:item.name,period:d.period}});
      if(item.ratio!=null)out.push({fieldPath:'data.breakdown_list[type='+group.type+'].item_list['+item.name+'].ratio',instrument:symbol,timestamp:stamp,value:val(item.ratio),unit:'percent',meta:{breakdownType:group.type,itemName:item.name,period:d.period}});
    }
  }
  return out;
}
