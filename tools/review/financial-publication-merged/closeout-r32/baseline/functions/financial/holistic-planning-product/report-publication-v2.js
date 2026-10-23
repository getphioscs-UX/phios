import {renderFinanceScenarioSummary,renderFinanceAppendices} from './report-appendices-v2.js';
import {sha256Hex} from '../../document-assembly/digest.js';

export const FINANCE_PUBLICATION_VERSION='FINANCE_CORE_16_V2';
export const FINANCE_LAYOUT_VERSION='FINANCE_A4_V2';
export const FINANCE_PAGES=[
 ['cover','封面与阅读范围','Cover and scope',[],'这份报告整理了你提供的收入、支出、资产、负债和目标准备情况。图表与金额对应同一资料版本；估算或尚待补充的内容会在相关位置标明。你可以用它看清目前的安排，比较自己设定的变化，并准备下一次需要讨论的问题。','This report organizes the income, spending, assets, debts and goal preparations you have provided. Charts and amounts use the same saved version, with estimates and missing information identified. Use it to review current arrangements, compare changes you define and prepare questions for your next discussion.'],
 ['summary','目前的财务全景','Financial snapshot',['netWorth','cashFlowSurplus','liquidityMonths'],'先看净资产、月度结余和资金覆盖，再核对尚未提供的资料。','Start with net worth, monthly surplus and reserve coverage, then review the information still needed.'],
 ['household','家庭与财务责任','Household responsibilities',[],'核对已申报的家庭成员、责任和期间。家庭关系不会自动确定所有权或受益人。','Review declared household members, responsibilities and dates. Relationships alone do not establish ownership or beneficiaries.'],
 ['balance','资产、负债与净资产','Assets, debts and net worth',['grossAssets','totalLiabilities','netWorth'],'净资产由系统按同一日期和币种计算；估计值或区间保留原有精度。','The system calculates net worth on a consistent date and currency basis. Estimates and ranges retain their original precision.'],
 ['cashflow','每月的钱去了哪里','Monthly money flow',['monthlyIncome','monthlyExpenses','cashFlowSurplus'],'收支使用系统已确定的口径，贷款付款和税款不重复扣除。','Income and spending follow the system calculation basis. Loan payments and taxes are not deducted again here.'],
 ['expenses','支出的组成','Spending composition',['monthlyExpenses'],'总支出不代表已经取得分类明细。补充必要支出、可调整支出与付款期间后再比较。','Total spending does not establish a category breakdown. Add essential and adjustable spending with payment periods before comparing categories.'],
 ['liquidity','备用资金','Accessible reserves',['liquidityMonths'],'此处沿用系统的支出覆盖口径。若尚未区分必要支出，不称为必要生活费覆盖；分母未知或为零时不计算。','This uses the system spending coverage basis. It is not labelled essential-living-cost coverage without that breakdown. Unknown or zero denominators do not produce a ratio.'],
 ['debt','当前偿债安排','Debt commitments',['totalLiabilities','debtServiceRatio'],'区分未偿本金与每月付款；贷款专项结果另作附录，不再次扣减现金流。','Distinguish outstanding principal from monthly payments. Loan details belong in an appendix and do not reduce cash flow a second time.'],
 ['protection','已有保障与长期承诺','Protection and commitments',[],'核对保单持有人、保障对象、金额、期限及保费。资料缺失不能证明保障不足或足够。','Check policy ownership, insured persons, amounts, terms and premiums. Missing information establishes neither adequate nor inadequate protection.'],
 ['goals','希望完成的目标','Goals and timing',[],'仅记录已经申报的目标、期限和优先顺序；没有填报的目标保持待确认。','Record only declared goals, dates and priorities. Undeclared goals remain open for confirmation.'],
 ['funding','目标与资金的衔接','Funding towards goals',[],'核对各目标已指定的资金。没有明确分配记录时不计算差额，也不把同一笔资金重复分配。','Check funds explicitly assigned to each goal. Without allocation records, no funding gap is calculated and funds are not allocated twice.'],
 ['scenarios','条件改变后会怎样','Selected scenarios',[],'仅展示明确保存的情景及系统结果；没有情景时，请填写想比较的条件，不编造预测。','Show only explicitly saved scenarios and system results. If none are available, specify the conditions to compare; no forecast is invented.'],
 ['tax','年度资料与税务准备','Annual records and tax preparation',[],'整理收入证明、费用凭证、课税年度和地区。资料清单不代表税款或扣除资格已核实。','Organize income records, expense evidence, assessment year and jurisdiction. This checklist does not verify tax liability or deduction eligibility.'],
 ['estate','家庭文件与传承准备','Household documents and estate preparation',[],'分别核对提名、分配意愿与法律签署状态；保存财务资料不产生有效遗嘱。','Review nominations, distribution wishes and legal execution separately. Saving financial information does not create a valid will.'],
 ['next','下一步与讨论问题','Next review and discussion',[],'先补齐影响结余和备用资金的缺项，再核对到期责任及目标期限；记录下一次复核日期。','First complete information affecting surplus and reserves, then check upcoming commitments and goal dates. Record the next review date.'],
 ['sources','来源、假设与计算说明','Sources and calculation notes',[],'金额来自保存版本和系统计算。申报不是独立核实；未知不补零，情景不是预测。','Amounts come from the saved version and system calculations. Declarations are not independent verification; unknowns are not zero and scenarios are not forecasts.']
];
const labels={netWorth:['净资产','Net worth'],grossAssets:['资产总额','Total assets'],totalLiabilities:['负债总额','Total debts'],monthlyIncome:['每月收入','Monthly income'],monthlyExpenses:['每月支出','Monthly spending'],cashFlowSurplus:['每月结余','Monthly surplus'],liquidityMonths:['支出覆盖月数','Months of spending covered'],debtServiceRatio:['偿债比率','Debt service ratio']};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function compileFinancePublication(evidence,language=evidence.language){
 if(!['en','zh-Hans'].includes(language)||!evidence.evidenceDigest||!evidence.source)throw Error('FINANCE_PUBLICATION_EVIDENCE_REQUIRED');
 const zh=language==='zh-Hans',pick=(a,b)=>zh?a:b;
 const snapshot=evidence.ownerEvidence?.fdrSnapshot?.snapshotPayload||{};
 const prompts={
 cover:[['资料范围与币种是否一致？','Are scope and currency consistent?'],['资料日期是否仍适用于本次讨论？','Is the information date appropriate for this review?']],
 summary:[['哪些金额仍是估计或未知？','Which amounts remain estimated or unknown?'],['近期是否有尚未登记的付款？','Are any upcoming payments unrecorded?']],
 household:[['谁承担日常费用及到期付款？','Who pays everyday costs and upcoming commitments?'],['责任期限与所有权是否有分别记录？','Are responsibility periods and ownership recorded separately?']],
 balance:[['资产金额是你持有的份额，还是整项估值？','Does each asset amount represent your interest or the whole asset?'],['负债余额与资产估值是否为同一日期？','Do debt balances and asset values use the same date?']],
 cashflow:[['收入是税前还是到手金额？','Is income gross or take-home?'],['还款是否已经包含在支出中？','Are repayments already included in spending?']],
 expenses:[['哪些支出维持基本生活？','Which costs support essential living needs?'],['哪些是年度、一次性或可调整项目？','Which costs are annual, one-off or adjustable?']],
 liquidity:[['这些资金是否可以随时动用？','Can these funds be accessed when needed?'],['必要支出是否已与总支出分开记录？','Have essential costs been separated from total spending?']],
 debt:[['未偿本金、利率与月供是否分别确认？','Are principal, rate and monthly payment each confirmed?'],['近期是否有到期、担保或额外还款安排？','Are maturities, guarantees or extra payments upcoming?']],
 protection:[['保障对象、持有人和受益人是否有文件依据？','Are insured persons, owners and beneficiaries documented?'],['保费付款和保障期限是否需要更新？','Do premium payments or coverage terms need updating?']],
 goals:[['目标金额、期限与优先顺序是否明确？','Are target amounts, dates and priorities explicit?'],['目标是否属于本人声明？','Has the customer declared each goal?']],
 funding:[['资金是否已明确指定给某个目标？','Are funds explicitly assigned to particular goals?'],['同一笔资金是否被用于多个目标？','Have the same funds been assigned more than once?']],
 scenarios:[['你想改变哪些已知条件？','Which declared conditions do you want to change?'],['比较是否使用相同的币种与期间？','Does the comparison use the same currency and period?']],
 tax:[['收入与费用凭证是否已按年度整理？','Are income and expense records organized by year?'],['地区、课税年度和规则版本是否已确认？','Are jurisdiction, assessment year and rule version confirmed?']],
 estate:[['文件保管位置及联络角色是否已记录？','Are document locations and contact roles recorded?'],['提名状态与法律签署状态是否分别核对？','Have nominations and legal execution been reviewed separately?']],
 next:[['先补齐哪些资料可以减少当前不确定性？','Which missing records would reduce uncertainty first?'],['下次复核日期及讨论对象是谁？','When is the next review, and who should join it?']],
 sources:[['保存版本是否与本报告引用一致？','Does the saved version match this report?'],['申报、估计与未知状态是否保留？','Are declared, estimated and unknown states preserved?']]
 };
 const pages=FINANCE_PAGES.map(([key,cn,en,keys,commonZh,commonEn],index)=>{
  const values=keys.map(metricRef=>{
   const deficit=metricRef==='cashFlowSurplus'&&typeof evidence.metrics.cashFlowDeficit==='number'&&evidence.metrics.cashFlowDeficit>0;
   const precision=evidence.typedMetrics?.[deficit?'cashFlowDeficit':metricRef]?.value?.kind||'UNKNOWN';
   const qualifier=precision==='APPROXIMATE'?pick('（估算）',' (estimated)'):precision==='RANGE'?pick('（区间）',' (range)'):'';
   return {metricRef:deficit?'cashFlowDeficit':metricRef,label:(deficit?pick('每月缺口','Monthly shortfall'):labels[metricRef][zh?0:1])+qualifier,value:evidence.metrics[deficit?'cashFlowDeficit':metricRef]??null,precision};
  });
  if(key==='cashflow'){
   const net=evidence.ownerEvidence?.fcrResult?.engines?.CASH_FLOW?.metrics?.netIncome?.value;
   if(net){values[0]={...values[0],metricRef:'netMonthlyIncome',label:pick('每月到手收入','Monthly net income')+(net.kind==='APPROXIMATE'?pick('（估算）',' (estimated)'):''),value:net.kind==='UNKNOWN'?null:net.kind==='RANGE'?{min:net.min,max:net.max}:net.value,precision:net.kind};}
   values[1].label=pick('总支出（含已登记还款）','Total spending (including recorded repayments)')+(values[1].precision==='APPROXIMATE'?pick('（估算）',' (estimated)'):'');
  }
  const paragraphs=[pick(commonZh,commonEn)];
  if(key==='cover')paragraphs.push(pick('报告用于财务资料准备与讨论，不构成个人投资建议。','This report supports financial preparation and discussion; it does not provide personal investment advice.'));
  if(['summary','cashflow','next'].includes(key)){
   const v=typeof evidence.metrics.cashFlowDeficit==='number'&&evidence.metrics.cashFlowDeficit>0?-evidence.metrics.cashFlowDeficit:evidence.metrics.cashFlowSurplus;
   paragraphs.push(typeof v!=='number'?pick('结余尚不能确定。请先核对收入、支出和偿债资料，暂不安排基于结余的支出。','Surplus cannot yet be established. Check income, spending and debt payments before making plans that depend on surplus.'):v<0?pick('本期资料显示结余不足。先核对固定付款与近期到期项目，并整理可调整支出供讨论。','The current record shows a shortfall. Review fixed payments and upcoming commitments, and list adjustable spending for discussion.'):pick('本期资料显示非负结余。请确认付款期间及尚未登记的承诺，再考虑如何安排这笔资金。','The current record shows a non-negative surplus. Confirm payment periods and unrecorded commitments before assigning these funds.'));
  }
  if(values.some(v=>v.value===null))paragraphs.push(pick('缺失资料未当作零。补齐相关金额、日期及币种后，可重新保存并生成新版本。','Missing information has not been treated as zero. Add the amounts, dates and currencies, then save and generate a new version.'));
  const group={household:'people',expenses:'expenses',debt:'liabilities',protection:'policies',goals:'goals',funding:'goals'}[key];
  const allRecords=(snapshot[group]||[]).map(row=>{
   const fact=row.amountFact||row.balanceFact||row.sumAssured;
   return {label:row.label||pick('已保存项目','Saved item'),value:fact?.value??row.target?.amount??null,currency:row.currency||row.target?.currency||evidence.currency,frequency:row.frequency||null,targetDate:row.targetDate||null,status:fact?.disclosureState||row.disclosureState||'UNKNOWN'};
  });
  for(const record of allRecords.slice(0,3)){
   const number=v=>new Intl.NumberFormat(zh?'zh-CN':'en-MY',{maximumFractionDigits:2}).format(v);
   const amount=record.value===null?pick('金额待补充','Amount not provided'):typeof record.value==='object'?`${number(record.value.min)} – ${number(record.value.max)} ${record.currency}`:`${number(record.value)} ${record.currency}`;
   const frequency=record.frequency==='MONTHLY'?pick('每月','Monthly'):record.frequency==='ANNUAL'?pick('每年','Annual'):'';
   paragraphs.push(`${record.label} · ${key==='household'?pick('申报家庭成员，责任期间待核对','Declared household member; responsibility periods need review'):amount}${frequency?' · '+frequency:''}${record.targetDate?' · '+record.targetDate:''}`);
  }
  if(allRecords.length>3)paragraphs.push(pick(`另有 ${allRecords.length-3} 项保留于保存资料；本页仅列前三项。`,`${allRecords.length-3} additional records remain in the saved information; this page lists the first three.`));
  if(group&&!allRecords.length)paragraphs.push(pick('尚未提供本节明细；请核对是否不适用，或仍需补充。','No item details were supplied for this section. Confirm whether this is not applicable or still needs information.'));
  paragraphs.push(pick('复核问题：','Review questions:')+' '+prompts[key].map(q=>q[zh?0:1]).join(' '));
  return {page:index+1,key,title:pick(cn,en),paragraphs,values,questions:prompts[key].map(q=>q[zh?0:1]),records:allRecords.slice(0,3),additionalRecords:Math.max(0,allRecords.length-3)};
 });
 const body={publicationVersion:FINANCE_PUBLICATION_VERSION,layoutVersion:FINANCE_LAYOUT_VERSION,language,source:evidence.source,evidenceDigest:evidence.evidenceDigest,asOfDate:evidence.asOfDate,currency:evidence.currency,calculationDigest:evidence.calculationDigest,pages,scenarios:evidence.scenarios||{}};
 return {...body,contentDigest:sha256Hex(body)};
}
export function renderFinancePublication(publication,{synthetic=false}={}){
 const zh=publication.language==='zh-Hans',pick=(a,b)=>zh?a:b;
 const display=(value,key)=>{
  if(value===null)return pick('待补充','Not provided');
  const format=n=>new Intl.NumberFormat(zh?'zh-CN':'en-MY',{maximumFractionDigits:key==='debtServiceRatio'?4:2}).format(n);
  const unit=key==='liquidityMonths'?pick('月','months'):key==='debtServiceRatio'?pick('比率','ratio'):publication.currency;
  return `${typeof value==='object'?format(value.min)+' – '+format(value.max):format(value)} ${unit}`;
 };
 const monetary=v=>!['liquidityMonths','debtServiceRatio'].includes(v.metricRef);
 const rows=values=>values.map(v=>`<div class="metric"><span>${esc(v.label)}</span><strong>${esc(display(v.value,v.metricRef))}</strong>${values.every(monetary)&&typeof v.value==='number'&&monetary(v)?`<meter min="0" max="${Math.max(1,...values.filter(monetary).map(x=>typeof x.value==='number'?Math.abs(x.value):0))}" value="${Math.abs(v.value)}" aria-label="${esc(v.label)}" class="${v.value<0||v.metricRef==='cashFlowDeficit'?'negative':''}"></meter>`:''}</div>`).join('');
 return `<!doctype html><html lang="${publication.language}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${pick('个人与家庭财务准备报告','Personal & Household Financial Preparation Report')}</title><style>
 *{box-sizing:border-box}body{margin:0;background:#e8e9e4;color:#193d3a;font:16px/1.75 system-ui,"Microsoft YaHei",sans-serif}.page{position:relative;margin:24px auto;background:#fffdf6;width:min(100% - 24px,794px);min-height:1060px;padding:56px;overflow-wrap:anywhere;border-top:7px solid #30655b}.eyebrow,footer{font-size:12px;letter-spacing:.08em;color:#546c66}h1{font-size:34px;line-height:1.35;margin:40px 0 28px}p{max-width:60ch}.metrics{display:grid;gap:20px;margin:34px 0}.metric{padding:16px 0;border-bottom:1px solid #d7dfd6}.metric span,.metric strong{display:block}.metric strong{font-size:29px;font-variant-numeric:tabular-nums}meter{display:block;width:100%;height:16px;accent-color:#337d68}.negative{accent-color:#a64436}footer{margin-top:60px;border-top:1px solid #d7dfd6;padding-top:16px}dl{font-size:13px}dd{margin:0 0 14px}details{margin:24px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.cover{background:#142f46;color:#fff9e8;border-top-color:#b89b59}.cover .eyebrow,.cover footer{color:#d6dfce}.cover h1{font-size:48px;margin-top:110px}@page{size:A4;margin:0}@media print{body{background:white}.page{width:210mm;height:297mm;min-height:0;margin:0;padding:17mm;break-after:page;border-top-width:2mm;font-size:11pt;line-height:1.65}.page:last-child{break-after:auto}h1{font-size:25pt}.metric strong{font-size:22pt}footer{margin-top:14mm}details{display:none}}@media(max-width:600px){.page{padding:26px;min-height:850px}h1{font-size:28px}.cover h1{font-size:36px}.metric strong{font-size:24px}}
 </style><main>${publication.pages.map(page=>`<section class="page ${page.key==='cover'?'cover':''}" data-finance-page="${page.page}"><div class="eyebrow">PHI OS · ${pick('日常财务','EVERYDAY FINANCES')} · ${String(page.page).padStart(2,'0')} / 16</div><h1>${esc(page.title)}</h1>${synthetic&&page.page===1?`<p>${pick('合成资料样本 · 仅供版式审核','Synthetic sample · for layout review')}</p>`:''}${page.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}<div class="metrics">${rows(page.values)}</div>${page.key==='cover'?`<p>${pick('个人与家庭财务准备报告','Personal & Household Financial Preparation Report')}</p><p>${esc(publication.asOfDate)} · ${esc(publication.currency)}</p>`:''}${page.key==='scenarios'?renderFinanceScenarioSummary(publication):''}${page.key==='sources'?`<dl><dt>${pick('保存版本','Saved version')}</dt><dd>${esc(publication.source.version)}</dd><dt>${pick('资料日期与币种','Information date and currency')}</dt><dd>${esc(publication.asOfDate)} · ${esc(publication.currency)}</dd><dt>${pick('资料摘要','Evidence digest')}</dt><dd>${esc(publication.evidenceDigest)}</dd><dt>${pick('计算摘要','Calculation digest')}</dt><dd>${esc(publication.calculationDigest)}</dd></dl>`:''}<footer>${esc(publication.asOfDate)} · ${esc(publication.currency)} · ${pick('保存版本','Saved version')} ${esc(publication.source.version)} · ${esc(publication.publicationVersion)} · ${page.page}/16</footer></section>`).join('')}${renderFinanceAppendices(publication)}</main></html>`;
}
