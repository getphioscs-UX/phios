import {sha256Hex} from '../../document-assembly/digest.js';
const sections=[
 ['POSITION','Current financial position','当前财务状况','netWorth'],
 ['ASSETS','Declared assets','申报资产','grossAssets'],
 ['LIABILITIES','Declared liabilities','申报负债','totalLiabilities'],
 ['INCOME','Declared income','申报收入','monthlyIncome'],
 ['SPENDING','Declared spending','申报支出','monthlyExpenses'],
 ['CASH_FLOW','Cash flow','现金流','cashFlowSurplus'],
 ['LIQUIDITY','Liquidity coverage','流动性覆盖','liquidityMonths'],
 ['DEBT','Debt service','偿债','debtServiceRatio'],
 ['SCENARIOS','Explicit scenarios','明确情境',null],
 ['PROTECTION','Protection and goals','保障与目标',null],
 ['ESTATE','Estate preparation','遗产准备',null],
 ['REVIEW','Missing evidence and next review','缺失证据与下次审核',null]
];
const vocabulary={
 DECLARED:{en:'This value is calculated from your declared information for the saved date. It does not verify the information independently.',zh:'此数值根据保存日期的申报资料计算，不代表资料已经独立核实。'},
 APPROXIMATE:{en:'This result retains the approximate precision of the declared inputs. It is not an independently verified exact amount.',zh:'此结果保留申报输入的估计精度，并非经独立核实的确切金额。'},
 RANGE:{en:'The declared range is retained. No midpoint has been substituted for the range.',zh:'保留申报区间，没有使用中点替代区间。'},
 UNKNOWN:{en:'The available information does not establish this amount. Missing information has not been treated as zero.',zh:'现有资料无法确定此金额，缺失资料没有被当作零。'},
 SCENARIOS:{en:'Scenarios require explicit assumptions. A loan schedule describes the stated fixed-rate model; it does not predict future rates or select a product.',zh:'情境须有明确假设。贷款表描述指定的固定利率模型，不预测未来利率，也不选择产品。'},
 PROTECTION:{en:'Coverage and goals require separate amounts, ownership and time horizons. A missing coverage fact does not establish a protection gap.',zh:'保障与目标须分别核对金额、所有权及期限。缺少保障资料并不证明存在保障缺口。'},
 ESTATE:{en:'Financial assets are separate from distribution wishes. Import only the reviewed saved version; estate inclusion and legal treatment still require confirmation.',zh:'财务资产与分配意愿分开处理。仅导入已审核的保存版本；遗产纳入及法律处理仍须确认。'},
 REVIEW:{en:'Check unresolved ownership, currency, supporting documents and review dates before relying on the summary. Decisions remain yours; professional opinions are separate records.',zh:'使用摘要前，请核对尚未明确的所有权、币种、支持文件及审核日期。决定由你作出，专业意见应另作记录。'}
};
export function syntheticFactualCandidate(evidence,language){return {schemaVersion:'FINANCE_FACTUAL_CANDIDATE_V1',language,evidenceDigest:evidence.evidenceDigest,sourceRef:evidence.source.sourceRef,sections:sections.map(([code,,,metric])=>({sectionCode:code,nodes:metric?[{type:'TEXT',claimCode:evidence.metrics[metric]===null?'UNKNOWN':['APPROXIMATE','RANGE'].includes(evidence.typedMetrics?.[metric]?.value?.kind)?evidence.typedMetrics[metric].value.kind:'DECLARED',supportRefs:[metric]},{type:'SOURCE_VALUE',metricRef:metric}]:[{type:'TEXT',claimCode:code,supportRefs:['source']}]}))};}
export function validateFactualCandidate(candidate,evidence){
 if(!candidate||Object.keys(candidate).some(k=>!['schemaVersion','language','evidenceDigest','sourceRef','sections'].includes(k))||candidate.schemaVersion!=='FINANCE_FACTUAL_CANDIDATE_V1'||!['en','zh-Hans'].includes(candidate.language)||candidate.evidenceDigest!==evidence.evidenceDigest||candidate.sourceRef!==evidence.source.sourceRef||!Array.isArray(candidate.sections)||candidate.sections.length!==12)throw Error('FINANCE_CANDIDATE_BINDING_INVALID');
 const expected=syntheticFactualCandidate(evidence,candidate.language);
 // Closed factual grammar validates support and conditions, not numeric/string heuristics.
 for(let i=0;i<12;i++){
  const s=candidate.sections[i],e=expected.sections[i];if(Object.keys(s).some(k=>!['sectionCode','nodes'].includes(k))||s.sectionCode!==e.sectionCode||!Array.isArray(s.nodes)||s.nodes.length!==e.nodes.length)throw Error('FINANCE_SECTION_INVALID');
  for(let n=0;n<s.nodes.length;n++)if(sha256Hex(s.nodes[n])!==sha256Hex(e.nodes[n]))throw Error('FINANCE_UNSUPPORTED_CLAIM_OR_VALUE');
 }
 return structuredClone(candidate);
}
export function compileFactualNarrative(candidate,evidence){
 validateFactualCandidate(candidate,evidence);const zh=candidate.language==='zh-Hans';
 const compiled={schemaVersion:'FINANCIAL_NARRATIVE_RECORD_V1',authority:'HFP_FINANCIAL_NARRATIVE',source:evidence.source,evidenceDigest:evidence.evidenceDigest,language:candidate.language,scope:'FACTUAL_ONLY',professionalJudgment:false,sections:candidate.sections.map((section,i)=>({sectionId:section.sectionCode,title:sections[i][zh?2:1],paragraphs:section.nodes.map(node=>node.type==='TEXT'?vocabulary[node.claimCode][zh?'zh':'en']:formatMetric(evidence.metrics[node.metricRef],node.metricRef,evidence.currency,zh))}))};
 return {...compiled,contentDigest:sha256Hex(compiled)};
}
function formatMetric(value,key,currency,zh){if(value===null||value===undefined)return zh?'未知':'Unknown';const unit=key==='liquidityMonths'?(zh?'月':'months'):key==='debtServiceRatio'?(zh?'比率（0–1）':'ratio (0–1)'):currency;const monetary=!['liquidityMonths','debtServiceRatio'].includes(key),digits=monetary?new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits:4,number=n=>new Intl.NumberFormat(zh?'zh-CN':'en-MY',{minimumFractionDigits:monetary?digits:0,maximumFractionDigits:digits}).format(n);if(typeof value==='object')return `${number(value.min)} – ${number(value.max)} ${unit}`;return `${number(value)} ${unit}`;}
export function factualNarrativeReference(narrative){return {kind:'RDG_DATA',dataType:'FINANCIAL_NARRATIVE_RECORD',authority:'HFP_FINANCIAL_NARRATIVE',reference:`FINANCIAL_NARRATIVE:${narrative.contentDigest}`,state:'VALID',availability:'AVAILABLE',immutableLocator:{reference:`FINANCIAL_NARRATIVE:${narrative.contentDigest}`,version:'1.0.0',contentDigest:narrative.contentDigest,evidenceDigest:narrative.evidenceDigest}};}
