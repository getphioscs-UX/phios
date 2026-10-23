/** Deterministic editorial read model, no additional financial computation. */
import {money,number} from './publication-merged-diagrams.js';
export function pageInterpretation(p,n){
 const m=p.metrics,unknown=v=>number(v)===null;
 const notes={
 6:[`本版净资产 ${money(p,m.netWorth)}。上图分母仅为收入、支出、资产、负债、即取资金五项，不涵盖全部资料。来源：NET_WORTH / metrics。`,`Net worth ${money(p,m.netWorth)}. The five-amount denominator covers income, outflow, assets, debt and accessible funds only. Source: NET_WORTH / metrics.`],
 7:[`本版有 ${p.expenseFacts.length} 项支出责任。成员序号来自获授权记录；不推断家庭或继承关系。`,`${p.expenseFacts.length} expense responsibilities in authorized records. Member indices do not imply family or inheritance relationships.`],
 8:unknown(m.surplus)?['支出或偿债资料待补，不能形成完整结余；请保存同期间金额。来源：CASH_FLOW。','Spending/debt inputs are incomplete. Save same-period amounts before computing surplus. Source: CASH_FLOW.']:[`月结余 ${money(p,m.surplus)}，来自同期间收入减已含偿债的支出。来源：CASH_FLOW。`,`Monthly balance ${money(p,m.surplus)} is income less outflow including debt service. Source: CASH_FLOW.`],
 9:[`仅展示非内部划转支出与已计偿债；付款状态来自客户声明。来源：expenseFacts / debts。`,`Non-transfer spending and included debt only; payment status is client-declared. Source: expenseFacts / debts.`],
 10:[`本版已存 ${p.savedScenarios.length} 项条件；没有同版条件便不能解释前后变化。来源：savedScenarios。`,`${p.savedScenarios.length} saved conditions. No same-source condition means no before/after inference. Source: savedScenarios.`],
 11:[`权益资产 ${money(p,m.assets)} 减负债 ${money(p,m.debts)}；未知分项不能按零补齐。来源：NET_WORTH。`,`Owned assets ${money(p,m.assets)} less debt ${money(p,m.debts)}. Unknown components remain unknown. Source: NET_WORTH.`],
 12:[`构成仅包含已知权益分项；${p.costPairs.length} 项成本／现值记录按同一权益比较。来源：assetChartRows / costPairs。`,`Known owned components only; ${p.costPairs.length} cost/value records use matching ownership. Source: assetChartRows / costPairs.`],
 13:[`即取 ${money(p,p.accessible)}；总支出覆盖 ${money(p,p.accessCoverage,'months')}，必要支出覆盖 ${money(p,p.accessEssentialCoverage,'months')}。来源：accessibilityMetrics。`,`Accessible ${money(p,p.accessible)}; outflow cover ${money(p,p.accessCoverage,'months')}; essential cover ${money(p,p.accessEssentialCoverage,'months')}. Source: accessibilityMetrics.`],
 14:['本页为单次已声明目标；A09为多年费用与资金路径。教育目标超额不表示多年需求已筹足。来源：goals；A09：EDUCATION_FUNDING。','This is a one-off declared goal; A09 models multi-year funding. Goal excess does not establish long-term sufficiency. Sources: goals; A09 EDUCATION_FUNDING.'],
 15:[`本版 ${p.debts.length} 项负债；未提供利率、期限或借款人身份便不能推算结清。来源：debts。`,`${p.debts.length} debt records. Missing rates, terms or borrower identity prevent payoff inference. Source: debts.`],
 16:['收入减少、持续期间和必要支出必须分别保存；缺一不画压力结果。来源：获准的 INCOME_SHOCK 条件。','Save income reduction, duration and essential spending separately; missing gates prevent a stress result. Source: admitted INCOME_SHOCK inputs.'],
 17:[`本版 ${p.policyEvents.length} 条人员／事件记录；首条角色链不代表全部保单。提名不等于继承权。来源：policyEvents。`,`${p.policyEvents.length} person/event records; first-record role chain is not all policies. Nomination is not inheritance. Source: policyEvents.`],
 18:['比率保持各自分母与单位；不作风险评分或保障足够性判断。来源：DEBT / accessibilityMetrics。','Ratios retain their own denominators and units; no risk score or protection sufficiency judgment. Sources: DEBT / accessibilityMetrics.'],
 19:[`已登记 ${p.goals.length} 项目标；先核对现金缺项与资金引用，再复核优先级。来源：metrics / goals / missing。`,`${p.goals.length} goals recorded. Resolve cash inputs and funding references before priorities. Sources: metrics / goals / missing.`],
 20:['日期来自已声明目标，不表示已完成；缺日期应先保存日期与凭证。来源：goals.targetDate。','Dates are declared goals, not completion evidence. Save missing dates and supporting records first. Source: goals.targetDate.']
 };return notes[n];
}
