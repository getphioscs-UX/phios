// Thin question/source presentation over existing Financial owners. No saved
// facts, tax-rule admission, provider, permission or second calculator.
import {exact,approximate,subtract} from '../financial/calculation-runtime/range-arithmetic.js';
import {BFT_FORMULA_VERSION} from '../professional/financial/bft-liquidity-candidate-r1.js';
import {TAX_R1} from '../professional/financial/tax-intelligence-candidate-r1.js';
import filings from '../../content/world/company-filings-r1.json';
export const PUBLIC_FINANCIAL_EXPLANATION_VERSION='AUDIT-R3-FINANCIAL-EXPLANATION-v2';
const cash=/\bcash\b|bank balance|现金|現金|银行余额|銀行餘額/i;
const profit=/\bprofits?\b|\bearnings?\b|利润|利潤|盈利/i;
const ocf=/operating cash\s*flow|cash\s*flow.*operat|经营现金流|經營現金流|营运现金流|營運現金流/i;
const withdrawal=/withdraw|draw(?:ing)?s?\b|take out|transfer.*(?:myself|owner)|提款|提取|取走|转走|轉走/i;
const vehicle=/\b(?:car|vehicle|van)\b|买车|買車|购车|購車|汽车|汽車|车辆|車輛|的车|的車/i;
const tax=/\btax\b|deduct|capital allowance|扣税|扣稅|抵税|抵稅|税务|稅務|税前扣除/i;
const generalSource={sourceId:'EXISTING_FINANCIAL_LIQUIDITY_SCOPE',label:'Financial preparation / 财务准备',href:'/professional/financial/',sourceVersion:BFT_FORMULA_VERSION};
const clean=s=>String(s||'').normalize('NFKC');
// Only explicit current-question declarations are used; RM never implies a tax
// jurisdiction and a generic "company" never implies a particular legal form.
function taxSlots(q){
 const active=q.replace(/(?:not|outside|不是|并非|並非)\s*(?:in\s+)?(?:Malaysia|Singapore|UK|马来西亚|新加坡|英国)/gi,' ');
 const jurisdictions=[['MY',/\bMalaysia\b|马来西亚|馬來西亞/i],['SG',/\bSingapore\b|新加坡/i],['GB',/\bUK\b|United Kingdom|英国|英國/i],['US',/United States|\bUSA\b|\bUS tax\b|美国|美國/i],['TH',/\bThailand\b|泰国|泰國/i]].filter(([,r])=>r.test(active)).map(([id])=>id);
 const formText=q.replace(/\bnot\s+(?:an?\s+)?(?:limited company|sole proprietor|sole trader|partnership|llp)|不是(?:有限公司|独资企业)|非有限公司/gi,' ');
 const form=/sdn\.?\s*bhd\.?|limited company|有限公司/i.test(formText)?'LIMITED_COMPANY':/sole proprietor|sole trader|独资|獨資/i.test(formText)?'SOLE_PROPRIETORSHIP':/\bLLP\b|有限责任合伙/i.test(formText)?'LLP':/partnership|合伙|合夥/i.test(formText)?'PARTNERSHIP':null;
 const periods=[...q.matchAll(/(?:\bYA\s*|tax\s*(?:years?|period)\s*|课税年(?:度)?\s*|課稅年(?:度)?\s*|税务年度\s*|稅務年度\s*)(20\d{2})(?:\s*(?:and|or|to|[-–/]|与|和|至)\s*(20\d{2}))?/gi)].flatMap(x=>[x[1],x[2]].filter(Boolean).map(Number));
 // A declared use is not a verified deduction. Exclude negated alternatives
 // before recognizing mixed use; do not ask again for an already supplied use.
 const nonbusiness=/not\s+(?:for\s+)?business|not used for business|非经营|非經營|不是商用|不用于经营|不作业务用途/i.test(q);
 const useText=q.replace(/not\s+(?:for\s+)?(?:private|personal)\s*(?:use)?|no\s+(?:private|personal)\s+use|非私人用途|不作私人用途|不是私用/gi,' ');
 const purpose=nonbusiness?'NON_BUSINESS_DECLARED':/mixed|(?:private|personal)\s+and\s+business|business\s+and\s+(?:private|personal)|公私混用|商用.*私用|业务.*私人/i.test(useText)?'MIXED_DECLARED':/business[ -]use|business purposes?|(?:solely|entirely|exclusively|100%|used for|for).*business|经营用途|經營用途|业务用途|商用|全部用于业务|全用于经营/i.test(useText)?'BUSINESS_USE_DECLARED':/private[ -]use|personal[ -]use|(?:solely|entirely|only|for).*(?:private|personal)|私人用途|私用/i.test(useText)?'PRIVATE_USE_DECLARED':null;
 // Additional years in the same explicitly tax-related question are retained,
 // rather than silently selecting the first year of a multi-year request.
 if(/tax years?|tax periods?|课税年度|課稅年度|税务年度|稅務年度|\bYA\b/i.test(q)){
  const yearLists=q.matchAll(/20\d{2}(?:\s*(?:and|or|to|[-–/,、]|与|和|至|及)\s*(?:YA\s*)?20\d{2})+/gi);
  for(const list of yearLists)periods.push(...list[0].match(/20\d{2}/g).map(Number));
 }
 return {jurisdictions,jurisdiction:jurisdictions.length===1?jurisdictions[0]:null,legalForm:form,vehicleUse:purpose,taxPeriods:[...new Set(periods)],taxPeriod:new Set(periods).size===1?periods[0]:null};
}
function moneyInputs(q){
 const amounts=[...q.matchAll(/\b(RM|MYR|SGD|USD|GBP|EUR)\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?(?!\d|[.,]\d)/gi)].map(m=>({start:m.index,end:m.index+m[0].length,currency:m[1].toUpperCase()==='RM'?'MYR':m[1].toUpperCase(),minor:Number(m[2].replaceAll(',',''))*100+Number((m[3]||'').padEnd(2,'0')),raw:m[0]})).filter(m=>Number.isSafeInteger(m.minor)&&m.minor<=1e12&&!/-\s*$/.test(q.slice(Math.max(0,m.start-3),m.start)));
 const anchors=(re)=>[...q.matchAll(re)].map(m=>({start:m.index,end:m.index+m[0].length,word:m[0]}));
 const nearest=anchor=>amounts.map(m=>({m,d:Math.max(0,anchor.start-m.end,m.start-anchor.end)})).filter(x=>x.d<35).sort((a,b)=>a.d-b.d)[0]?.m||null;
 const cashAnchors=anchors(/\bcash\b|bank balance|现金|現金|银行余额|銀行餘額/gi).filter(a=>!/restricted\s*$|受限\s*$/.test(q.slice(Math.max(0,a.start-15),a.start)));
 const obligationAnchors=anchors(/\bdue\b|\bowe\b|\bobligation\b|到期|义务|義務|应付|應付|须支付|需要支付/gi);
 const available=cashAnchors.map(a=>{const m=nearest(a);if(!m)return null;const span=q.slice(Math.max(0,Math.min(a.start,m.start)-30),Math.max(a.end,m.end));return /do not have|don't have|not have|没有|沒有|并无|並無|不是/i.test(span)?null:m;}).find(Boolean)||null;
 const due=obligationAnchors.map(a=>{
  const amount=nearest(a);if(!amount||amount===available)return null;
  // Bound status to the obligation clause, not an unrelated denial in the
  // following withdrawal question. A settled declaration is not a zero input.
  const lo=Math.min(a.start,amount.start),hi=Math.max(a.end,amount.end);
  const left=q.slice(0,lo).search(/[^.;。；!?！？]*$/);
  const tail=q.slice(hi).search(/[.;。；!?！？]/);
  const span=q.slice(left,tail<0?q.length:hi+tail).split(/can I withdraw|may I withdraw|能否提款|可以提款|能提款/i)[0];
  const active=span.replace(/not\s+(?:yet\s+)?(?:paid|settled|discharged)|has not been paid|尚未(?:结清|結清|支付)|未(?:结清|結清|支付)|还没(?:结清|支付)/gi,' OUTSTANDING ').replace(/已经|已經/g,'已');
  if(/(?:not|never|no)\s+(?:actually\s+)?(?:due|owe|obligation)|do not owe|don.t owe|(?:already|fully)\s+(?:paid|settled|discharged)|(?:has|have|was|is)\s+(?:been\s+)?(?:paid|settled|discharged)|已结清|已結清|已支付|不需要支付|并非到期|並非到期|没有[^,，;；。]*到期|沒有[^,，;；。]*到期|尚未到期/i.test(active))return null;
  return amount;
 }).find(Boolean)||null;
 return {cash:available,obligation:due,amounts};
}
export function publicFinancialAnswer({question,locale='en'}={}){
 const q=clean(question),zh=locale==='zh-Hans',t=(en,cn)=>zh?cn:en;
 if(!q||q.length>500||!['en','zh-Hans'].includes(locale))return null;
 const wrap=(kind,paragraphs,unknowns,binding,sources=[generalSource])=>({kind,paragraphs,unknowns,sources:sources.map(s=>s===generalSource?{...s,label:t('Financial preparation','财务准备')}:s),sourceBinding:{explanationVersion:PUBLIC_FINANCIAL_EXPLANATION_VERSION,financialOwnerVersion:BFT_FORMULA_VERSION,taxOwnerVersion:TAX_R1,...binding},providerCalls:0});
 if(vehicle.test(q)&&tax.test(q)&&!/without discussing tax|not asking about tax|不是问税|不谈税/i.test(q)){
  const slots=taxSlots(q),missing=[];
  if(!slots.jurisdiction)missing.push(t('the applicable tax jurisdiction (country/region)','适用税务司法辖区（国家／地区）'));
  if(!slots.legalForm)missing.push(t('the business’s legal form, such as a limited company or sole proprietor','经营主体的法律形式，例如有限公司或独资经营'));
  if(!slots.vehicleUse)missing.push(t('the vehicle’s business, private or mixed use','车辆用于业务、私人还是公私混用'));
  if(!slots.taxPeriod&&slots.taxPeriods.length===0)missing.push(t('the tax year or basis period being asked about','所问课税年度或计税期间'));
  const paragraphs=[t('Recording a vehicle in the accounts and claiming a tax deduction are separate questions. A purchase does not establish an immediate deduction of the whole price.','车辆的会计入账与税务扣除是两个判断；购买车辆本身不能证明购车价可以立即全额扣税。')];
  if(slots.taxPeriods.length>1)paragraphs.push(t('You asked about tax periods ','你询问的税务期间为 ')+slots.taxPeriods.join(' / ')+t('; each period needs its own applicable rule and use records. I will not combine them into one deduction or select one silently.','；各期间须分别核对适用规则与用途记录，不会合并为一次扣除或静默选取其中一年。'));
  if(missing.length)paragraphs.push(t('Please specify: ','请补充：')+missing.join(zh?'；':'; ')+t('. I will not infer these from the currency, the word “company”, or the purchase date.','。不会仅凭币种、“公司”一词或购车日期推定这些条件。'));
  else paragraphs.push(t('You have stated the jurisdiction, legal form, use and tax period. These are declarations, not verified eligibility. Next, check the invoice, vehicle registration/category and actual business-use records.','你已说明辖区、法律形式、用途与税务期间；这些是声明，不代表已核实扣除资格。下一步核对发票、车辆登记／类别与实际业务用途记录。'));
  paragraphs.push(t('No customer-admitted vehicle tax rule with confirmed jurisdiction and effective period is bound to this answer. I cannot confirm eligibility, a rate, a limit or an amount deductible. A qualified reviewer must match the applicable authority and period before a specific tax conclusion.','本回答尚未绑定已准入、辖区与生效期间明确的车辆税务规则，因此不能确认扣除资格、比例、限额或金额。具体结论须先由合资格人员核对适用权威来源及期间。'));
  return wrap('VEHICLE_TAX_CONTEXT',paragraphs,[...missing,t('Applicable admitted tax authority and effective period remain unverified.','适用且已准入的税务权威来源与生效期间仍待核实。')],{scope:'CONTEXT_AND_ACCOUNTING_TAX_DISTINCTION_ONLY',declaredContext:slots,missingContext:missing,taxRuleAdmission:'NOT_ESTABLISHED',deductionConfirmed:false,customerFactsVerified:false});
 }
 if(withdrawal.test(q)&&(cash.test(q)||profit.test(q)||/义务|義務|\bdue\b|\bowe\b/i.test(q))){
  const inputs=moneyInputs(q),a=inputs.cash,b=inputs.obligation,known=!!a&&!!b&&a.currency===b.currency;
  const unknowns=[t('Other commitments, restricted funds, operating needs and withdrawal authority have not been verified.','其他承诺、受限资金、经营需要与提款权限尚未核实。')];
  const paragraphs=[];let difference=null;
  const fmt=m=>new Intl.NumberFormat(locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(m/100);
  if(known){const estimated=/\b(?:about|around|approximately)\b|大约|大約|约为|約為/.test(q),value=estimated?approximate:exact;difference=subtract(value(a.minor),value(b.minor));paragraphs.push(t(`If ${a.currency} ${fmt(b.minor)} must be retained to meet the stated obligation, the simple difference is ${a.currency} ${fmt(a.minor)} − ${a.currency} ${fmt(b.minor)} = ${estimated?'approximately ':''}${a.currency} ${fmt(difference.value)}.`,`若需保留 ${a.currency} ${fmt(b.minor)} 履行所述义务，简单差额为 ${a.currency} ${fmt(a.minor)} − ${a.currency} ${fmt(b.minor)} = ${estimated?'约 ':''}${a.currency} ${fmt(difference.value)}。`));}
  else{const missing=[!a?t('the explicitly stated cash balance and currency','明确的现金余额与币种'):null,!b?t('the unsettled obligation amount and currency','尚未履行义务的金额与币种'):null,a&&b&&a.currency!==b.currency?t('amounts in a common currency, without an assumed exchange rate','同一币种的金额，不能假定汇率'):null].filter(Boolean);paragraphs.push(t('Please confirm ','请确认')+missing.join(zh?'、':', ')+t('. Missing, negated or already settled obligations are not treated as zero.','. 缺失、被否定或已结清的义务不会被当作零。'));unknowns.unshift(...missing);}
  paragraphs.push(t('This is only a conditional cash-minus-obligation illustration, not an owner-withdrawable amount. A cash balance, accounting profit or simple difference does not authorize a withdrawal. Check other commitments, restricted funds, operating needs and the relevant withdrawal/ownership authority before deciding; do not use the gross cash balance as permission to take it all.','这里只是有条件的现金减义务演示，不是经营者可提款额。现金余额、会计利润或简单差额均不构成提款授权。决定前还须核对其他承诺、受限资金、经营需要及相关提款／归属权限，不能因账上有现金就认定可以全部提走。'));
  return wrap('CASH_OBLIGATION_DIFFERENCE',paragraphs,unknowns,{scope:'CURRENT_QUESTION_CONDITIONAL_ARITHMETIC_ONLY',inputSource:'CURRENT_QUESTION_UNSAVED_UNVERIFIED',declaredInputs:inputs,calculationOwner:'FCR-W19 range-arithmetic.subtract',simpleDifferenceMinor:difference?.value??null,precision:difference?.kind||'UNKNOWN',currency:known?a.currency:null,ownerWithdrawableMinor:null,withdrawalAuthorized:false,customerFactsVerified:false});
 }
 if(profit.test(q)&&ocf.test(q)&&/why|how|explain|differen|rise|grow|increase|fall|drop|reconcil|recognition|timing|为什么|为何|解释|差异|区别|增加|下降|提高|减少|不一致|确认|调节/i.test(q)){
  const packet=filings.companies.find(p=>p.verifiedReport?.sha256&&p.verifiedReport?.fieldPages?.operatingCashFlow);
  const paragraphs=[t('Profit recognition and cash receipts or payments can fall in different periods. Under accrual accounting, recording revenue or an expense does not mean the related cash has already been received or paid; rising profit and falling operating cash flow can therefore coexist.','利润确认与现金收付可能发生在不同期间。权责发生制下，收入或费用入账不代表有关现金已经收进或付出，因此利润增加与经营现金流下降可以同时出现。'),t('Possible working-capital mechanisms include: more receivables when recognized sales remain uncollected; cash tied up in inventory before the related cost is recognized in sales; and payment of earlier payables reducing current operating cash. Conversely, collecting receivables, reducing inventory or deferring payment of payables may release or preserve cash. Compare changes over the same period and accounting scope, rather than equating a balance with a cash flow.','可能的营运资金机制包括：销售已确认但尚未收款，使应收账款增加；采购存货先占用现金，而相关成本尚未随销售确认；支付以前的应付账款，减少本期经营现金。反过来，收回应收款、减少存货或延后支付应付款可能释放或保留现金。应核对同一期间、同一会计范围内的变动，不能把某一余额等同于现金流量。'),t('These are possible mechanisms, not findings about your business. Without the statements and reconciliation, I cannot say which occurred, quantify its contribution, or assume that profit or operating cash flow actually changed. Check the operating cash-flow reconciliation, opening/closing receivables, inventory and payables, and non-cash or classification adjustments.','以上是可能机制，不是对你的企业的事实判断。缺少报表及调节表时，不能认定实际发生了哪项、量化其影响，也不预设利润或经营现金流确实已改变。请核对经营现金流调节表、期初期末应收／存货／应付变动，以及非现金或分类调整。')];
  return wrap('PROFIT_OPERATING_CASH_FLOW',paragraphs,[t('Actual reporting period, accounting basis, statements and working-capital movements are not supplied or verified.','实际报告期间、会计基础、报表及营运资金变动尚未提供或核实。')],{scope:'GENERAL_MECHANISMS_ONLY',actualCauseEstablished:false,customerFactsVerified:false,sourceExample:packet?{sourceId:packet.sourceId,documentSha256:packet.verifiedReport.sha256,statementPage:packet.verifiedReport.fieldPages.operatingCashFlow,periodEnd:packet.latestFilingCheck?.latestListedPeriodEnd,applicability:'ILLUSTRATIVE_STATEMENT_NOT_CUSTOMER_BUSINESS'}:null},[generalSource,...(packet?[{sourceId:packet.sourceId,label:t('Registered statement example, not your business','已登记报表示例，并非你的企业'),href:packet.verifiedReport.url,sourceVersion:packet.verifiedReport.sha256}]:[])]);
 }
 return null;
}
