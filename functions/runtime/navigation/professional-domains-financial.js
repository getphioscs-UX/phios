/** Financial professional domain v1. No financial intake or conclusions. */
import { createProfessionalDomainContract } from './professional-domain-contract.js';

const COPY={
  en:{
    name:'Financial professional review',
    criteria:['Household cash flow is unstable or difficult to verify','A major insurance, retirement, debt, estate, tax, or business-finance decision is involved','The decision may create material or regulated consequences'],
    prepare:['A simple income and expense summary','Existing insurance policy summaries','Loan and debt summaries','Savings and investment account summaries','A current household budget, if one exists'],
    unknown:['Actual cash flow and liabilities','Tax position and filing consequences','Legal ownership or estate implications','Investment suitability and future outcomes','Whether any product or strategy is appropriate'],
    excluded:['Investment recommendations','Tax advice or tax conclusions','Legal advice or legal conclusions','Accounting opinions','Licensed financial advice','Guarantees of outcomes']
  },
  zh:{
    name:'财务专业审阅',
    criteria:['家庭现金流不稳定，或目前资料无法核实','涉及重大保险、退休、债务、遗产、税务或企业财务决定','该决定可能产生重大或受监管的后果'],
    prepare:['简单的收入与支出摘要','现有保险保单摘要','贷款与债务摘要','储蓄与投资账户摘要','现有家庭预算（如有）'],
    unknown:['真实现金流与负债','税务位置与申报后果','法律拥有权或遗产影响','投资适配性与未来结果','任何产品或策略是否适合'],
    excluded:['投资建议','税务建议或税务结论','法律意见或法律结论','会计意见','持牌财务建议','结果保证']
  }
};

export function createFinancialProfessionalDomain({language='en',reasons=[]}={}) {
  const copy=String(language).toLowerCase().startsWith('zh')?COPY.zh:COPY.en;
  return createProfessionalDomainContract({
    domainId:'financial',
    domainName:copy.name,
    version:'v1',
    reviewMayHelp:true,
    reasons,
    entryCriteria:copy.criteria,
    preparationChecklist:copy.prepare,
    unknownReality:copy.unknown,
    excludedServices:copy.excluded,
    consentRequired:true,
    professionalReviewOnly:true
  });
}

export default createFinancialProfessionalDomain;
