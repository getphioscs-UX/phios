import { calculateFinancialPosition } from './financial-calculation-layer.js';

export const PTRC_FINANCIAL_RUNTIME_VERSION = 'ptrc-financial-runtime.v1';
export const PTRC_FINANCIAL_FORMULA_VERSION = 'ptrc-financial-formulas.v1';
export const PTRC_FINANCIAL_NON_ADVICE_NOTICE = 'Deterministic calculation only. This result is not financial, tax, legal, investment, insurance, credit, or product advice.';

const CALCULATORS = Object.freeze({
  CASH_FLOW: Object.freeze({ required: ['monthlyIncome','monthlyExpenses'] }),
  NET_WORTH: Object.freeze({ required: ['assets','liabilities'] }),
  DEBT: Object.freeze({ required: ['principal','annualInterestRate','monthlyPayment'] }),
  SAVINGS: Object.freeze({ required: ['targetAmount','currentSavings','horizonMonths'], optional: ['annualReturnRate'] }),
  RETIREMENT_SCENARIO: Object.freeze({ required: ['currentAssets','monthlyContribution','years','annualReturnRate','targetAmountAtRetirement'], optional: ['annualInflationRate'] }),
  COMPOUNDING: Object.freeze({ required: ['principal','annualRate','years'], optional: ['monthlyContribution'] }),
  INFLATION: Object.freeze({ required: ['amount','annualInflationRate','years'] }),
  DRAWDOWN: Object.freeze({ required: ['openingBalance','monthlyWithdrawal','annualReturnRate','months'] }),
  AFFORDABILITY: Object.freeze({ required: ['monthlyIncome','monthlyFixedExpenses','monthlyDebtPayments','proposedMonthlyCost'], optional: ['maxExpenseRatio'] }),
  ESTATE_SUMMARY: Object.freeze({ required: ['assets','liabilities'], jurisdictionRequired: true }),
  FINANCIAL_POSITION: Object.freeze({ required: ['income','expenses','assets','liquid_assets','liabilities','current_liabilities'] })
});

const round = (value, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return value ?? null;
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};
const sum = values => values.reduce((total, value) => total + Number(value), 0);
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
const asCurrency = value => round(value, 2);
const asRatio = value => value === null ? null : round(value, 6);
const unique = values => [...new Set((values || []).map(value => String(value).trim()).filter(Boolean))];

function validIsoDate(value) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}

function focusedNeed(calculatorId, fields, locale = 'en') {
  const zh = String(locale).toLowerCase().startsWith('zh');
  return Object.freeze({
    ok: false,
    status: 'NEEDS_INPUT',
    calculatorId,
    missing: Object.freeze([...fields]),
    prompt: zh
      ? `请先提供：${fields.join('、')}。PHI OS 不会猜测缺失的计算输入。`
      : `Please provide: ${fields.join(', ')}. PHI OS will not guess missing calculation inputs.`,
    guessedInputs: false,
    modelMayFillMissingNumericInputs: false
  });
}

function requireNumber(input, field, { min = -Infinity, max = Infinity, integer = false } = {}) {
  const value = input?.[field];
  if (!isFiniteNumber(value)) throw new TypeError(`FINANCIAL_INPUT_INVALID:${field}:NUMBER_REQUIRED`);
  if (value < min || value > max) throw new RangeError(`FINANCIAL_INPUT_INVALID:${field}:OUT_OF_RANGE`);
  if (integer && !Number.isInteger(value)) throw new TypeError(`FINANCIAL_INPUT_INVALID:${field}:INTEGER_REQUIRED`);
  return value;
}

function requireNumberArray(input, field, { min = -Infinity } = {}) {
  const values = input?.[field];
  if (!Array.isArray(values) || !values.length) throw new TypeError(`FINANCIAL_INPUT_INVALID:${field}:NON_EMPTY_ARRAY_REQUIRED`);
  for (const value of values) {
    if (!isFiniteNumber(value) || value < min) throw new TypeError(`FINANCIAL_INPUT_INVALID:${field}:NUMBER_ARRAY_REQUIRED`);
  }
  return values;
}

function monthlyRate(annualRate) {
  return (annualRate / 100) / 12;
}

function compoundFutureValue(principal, annualRate, years, monthlyContribution = 0) {
  const months = Math.round(years * 12);
  const rate = monthlyRate(annualRate);
  if (months <= 0) return principal;
  if (rate === 0) return principal + (monthlyContribution * months);
  return (principal * ((1 + rate) ** months)) + (monthlyContribution * ((((1 + rate) ** months) - 1) / rate));
}

function requiredMonthlyContribution(target, present, annualRate, months) {
  const gapTarget = Math.max(0, target);
  if (months <= 0) return gapTarget <= present ? 0 : null;
  const rate = monthlyRate(annualRate);
  if (rate === 0) return Math.max(0, (gapTarget - present) / months);
  const futurePresent = present * ((1 + rate) ** months);
  if (futurePresent >= gapTarget) return 0;
  return (gapTarget - futurePresent) * rate / (((1 + rate) ** months) - 1);
}

function calculateCashFlow(input) {
  const income = requireNumber(input, 'monthlyIncome', { min: 0 });
  const expenses = requireNumber(input, 'monthlyExpenses', { min: 0 });
  const surplus = income - expenses;
  return {
    monthlyIncome: asCurrency(income), monthlyExpenses: asCurrency(expenses),
    monthlySurplusDeficit: asCurrency(surplus), annualizedSurplusDeficit: asCurrency(surplus * 12),
    savingsRatio: income ? asRatio(surplus / income) : null
  };
}

function calculateNetWorth(input) {
  const assets = requireNumberArray(input, 'assets', { min: 0 });
  const liabilities = requireNumberArray(input, 'liabilities', { min: 0 });
  return { totalAssets: asCurrency(sum(assets)), totalLiabilities: asCurrency(sum(liabilities)), netWorth: asCurrency(sum(assets) - sum(liabilities)) };
}

function calculateDebt(input) {
  const principal = requireNumber(input, 'principal', { min: 0 });
  const annualInterestRate = requireNumber(input, 'annualInterestRate', { min: 0, max: 100 });
  const payment = requireNumber(input, 'monthlyPayment', { min: 0.01 });
  if (principal === 0) return { principal: 0, monthsToPayoff: 0, totalPayments: 0, totalInterest: 0 };
  const rate = monthlyRate(annualInterestRate);
  if (rate > 0 && payment <= principal * rate) throw new RangeError('FINANCIAL_INPUT_INVALID:monthlyPayment:DOES_NOT_AMORTIZE');
  const exactMonths = rate === 0 ? principal / payment : -Math.log(1 - ((rate * principal) / payment)) / Math.log(1 + rate);
  const months = Math.ceil(exactMonths);
  let balance = principal;
  let paid = 0;
  for (let month = 0; month < months && balance > 0; month += 1) {
    balance += balance * rate;
    const actualPayment = Math.min(payment, balance);
    balance -= actualPayment;
    paid += actualPayment;
  }
  return { principal: asCurrency(principal), monthsToPayoff: months, totalPayments: asCurrency(paid), totalInterest: asCurrency(Math.max(0, paid - principal)), endingBalance: asCurrency(Math.max(0, balance)) };
}

function calculateSavings(input) {
  const target = requireNumber(input, 'targetAmount', { min: 0 });
  const current = requireNumber(input, 'currentSavings', { min: 0 });
  const months = requireNumber(input, 'horizonMonths', { min: 1, integer: true });
  const annualReturnRate = input.annualReturnRate == null ? 0 : requireNumber(input, 'annualReturnRate', { min: -99, max: 100 });
  const monthlyRequired = requiredMonthlyContribution(target, current, annualReturnRate, months);
  return { targetAmount: asCurrency(target), currentSavings: asCurrency(current), fundingGapToday: asCurrency(Math.max(0, target - current)), horizonMonths: months, annualReturnRate, requiredMonthlyContribution: monthlyRequired == null ? null : asCurrency(monthlyRequired) };
}

function calculateRetirement(input) {
  const current = requireNumber(input, 'currentAssets', { min: 0 });
  const contribution = requireNumber(input, 'monthlyContribution', { min: 0 });
  const years = requireNumber(input, 'years', { min: 0, max: 100 });
  const annualReturnRate = requireNumber(input, 'annualReturnRate', { min: -99, max: 100 });
  const target = requireNumber(input, 'targetAmountAtRetirement', { min: 0 });
  const inflation = input.annualInflationRate == null ? 0 : requireNumber(input, 'annualInflationRate', { min: -99, max: 100 });
  const projected = compoundFutureValue(current, annualReturnRate, years, contribution);
  const inflationFactor = (1 + (inflation / 100)) ** years;
  return {
    projectedAssets: asCurrency(projected), targetAmountAtRetirement: asCurrency(target), projectedFundingGap: asCurrency(Math.max(0, target - projected)),
    realValueInTodayMoney: asCurrency(inflationFactor ? projected / inflationFactor : projected), years, annualReturnRate, annualInflationRate: inflation
  };
}

function calculateCompounding(input) {
  const principal = requireNumber(input, 'principal', { min: 0 });
  const annualRate = requireNumber(input, 'annualRate', { min: -99, max: 100 });
  const years = requireNumber(input, 'years', { min: 0, max: 200 });
  const contribution = input.monthlyContribution == null ? 0 : requireNumber(input, 'monthlyContribution', { min: 0 });
  const futureValue = compoundFutureValue(principal, annualRate, years, contribution);
  const contributed = principal + (contribution * Math.round(years * 12));
  return { futureValue: asCurrency(futureValue), totalContributed: asCurrency(contributed), growth: asCurrency(futureValue - contributed), years, annualRate, monthlyContribution: asCurrency(contribution) };
}

function calculateInflation(input) {
  const amount = requireNumber(input, 'amount', { min: 0 });
  const annualInflationRate = requireNumber(input, 'annualInflationRate', { min: -99, max: 100 });
  const years = requireNumber(input, 'years', { min: 0, max: 200 });
  const factor = (1 + (annualInflationRate / 100)) ** years;
  return { amount: asCurrency(amount), futureEquivalentCost: asCurrency(amount * factor), futurePurchasingPowerOfSameNominalAmount: asCurrency(factor ? amount / factor : amount), inflationFactor: round(factor, 8), years, annualInflationRate };
}

function calculateDrawdown(input) {
  let balance = requireNumber(input, 'openingBalance', { min: 0 });
  const withdrawal = requireNumber(input, 'monthlyWithdrawal', { min: 0 });
  const annualReturnRate = requireNumber(input, 'annualReturnRate', { min: -99, max: 100 });
  const months = requireNumber(input, 'months', { min: 0, max: 2400, integer: true });
  const rate = monthlyRate(annualReturnRate);
  let monthsUntilDepletion = null;
  let withdrawn = 0;
  for (let month = 1; month <= months; month += 1) {
    balance *= (1 + rate);
    const actual = Math.min(withdrawal, Math.max(0, balance));
    balance -= actual;
    withdrawn += actual;
    if (balance <= 1e-9) { balance = 0; monthsUntilDepletion = month; break; }
  }
  return { endingBalance: asCurrency(balance), totalWithdrawn: asCurrency(withdrawn), monthsRequested: months, monthsUntilDepletion, depletedWithinHorizon: monthsUntilDepletion !== null, annualReturnRate };
}

function calculateAffordability(input) {
  const income = requireNumber(input, 'monthlyIncome', { min: 0.01 });
  const fixed = requireNumber(input, 'monthlyFixedExpenses', { min: 0 });
  const debt = requireNumber(input, 'monthlyDebtPayments', { min: 0 });
  const proposed = requireNumber(input, 'proposedMonthlyCost', { min: 0 });
  const totalAfter = fixed + debt + proposed;
  const expenseRatio = totalAfter / income;
  const result = {
    monthlyIncome: asCurrency(income), committedBeforeProposedCost: asCurrency(fixed + debt), proposedMonthlyCost: asCurrency(proposed),
    monthlySurplusAfterProposedCost: asCurrency(income - totalAfter), expenseRatioAfterProposedCost: asRatio(expenseRatio),
    deterministicCapacityBeforeUserThreshold: asCurrency(Math.max(0, income - fixed - debt))
  };
  if (input.maxExpenseRatio != null) {
    const maxRatio = requireNumber(input, 'maxExpenseRatio', { min: 0, max: 1 });
    result.userSuppliedMaxExpenseRatio = maxRatio;
    result.withinUserSuppliedRatio = expenseRatio <= maxRatio;
  }
  return result;
}

function calculateEstate(input) {
  const assets = requireNumberArray(input, 'assets', { min: 0 });
  const liabilities = requireNumberArray(input, 'liabilities', { min: 0 });
  const gross = sum(assets), debt = sum(liabilities);
  return { grossEstate: asCurrency(gross), totalLiabilities: asCurrency(debt), netEstateBeforeTaxFeesAndDistribution: asCurrency(gross - debt), taxCalculated: false, distributionCalculated: false, legalValidityDetermined: false };
}

function calculatePosition(input, context) {
  const evidence = unique(context.inputEvidenceIds || ['PTRC_W8_CALLER_PROVIDED_INPUT']);
  const result = calculateFinancialPosition(input, {
    calculation_id: context.calculationId || 'ptrc-w8-financial-position',
    intake_id: context.intakeId || null,
    intake_data_version: context.intakeDataVersion || 1,
    formula_version: context.formulaVersion || 'financial-formulas.v1',
    input_date: context.asOfDate,
    input_sources: unique(context.inputSources || ['PTRC_W8_CALLER']),
    input_evidence_ids: evidence,
    assumptions: unique(context.assumptions),
    calculated_at: context.calculatedAt || `${context.asOfDate}T00:00:00.000Z`,
    review_status: 'professional_review_required'
  });
  return result.values;
}

const IMPLEMENTATIONS = Object.freeze({
  CASH_FLOW: calculateCashFlow, NET_WORTH: calculateNetWorth, DEBT: calculateDebt, SAVINGS: calculateSavings,
  RETIREMENT_SCENARIO: calculateRetirement, COMPOUNDING: calculateCompounding, INFLATION: calculateInflation,
  DRAWDOWN: calculateDrawdown, AFFORDABILITY: calculateAffordability, ESTATE_SUMMARY: calculateEstate,
  FINANCIAL_POSITION: calculatePosition
});

export function runFinancialCalculator(request = {}) {
  const calculatorId = String(request.calculatorId || '').trim().toUpperCase();
  const definition = CALCULATORS[calculatorId];
  if (!definition) throw new TypeError(`FINANCIAL_CALCULATOR_UNSUPPORTED:${calculatorId || 'MISSING'}`);
  const locale = request.locale || 'en';
  const input = request.inputs && typeof request.inputs === 'object' && !Array.isArray(request.inputs) ? request.inputs : {};
  const missing = (definition.required || []).filter(field => input[field] === undefined || input[field] === null);
  const jurisdiction = String(request.jurisdiction || '').trim();
  if (definition.jurisdictionRequired && !jurisdiction) missing.push('jurisdiction');
  const asOfDate = validIsoDate(request.asOfDate);
  if (!asOfDate) missing.push('asOfDate');
  const currency = String(request.currency || '').trim().toUpperCase();
  if (!currency) missing.push('currency');
  if (missing.length) return focusedNeed(calculatorId, unique(missing), locale);

  const assumptions = unique(request.assumptions);
  const formulaVersion = String(request.formulaVersion || PTRC_FINANCIAL_FORMULA_VERSION);
  const context = {
    ...request, calculatorId, jurisdiction: jurisdiction || null, asOfDate, currency,
    formulaVersion, assumptions
  };
  const implementation = IMPLEMENTATIONS[calculatorId];
  const values = implementation(input, context);
  return Object.freeze({
    ok: true,
    status: 'CALCULATED',
    schemaVersion: 'PHI-OS-PTRC-W8-FINANCIAL-RESULT-v1.0.0',
    runtimeVersion: PTRC_FINANCIAL_RUNTIME_VERSION,
    calculatorId,
    formulaVersion,
    asOfDate,
    currency,
    jurisdiction: jurisdiction || null,
    rounding: Object.freeze({ currencyDecimals: 2, ratioDecimals: 6, mode: 'HALF_AWAY_FROM_ZERO_APPROX_BY_EPSILON' }),
    assumptions: Object.freeze(assumptions),
    values: Object.freeze(values),
    provenance: Object.freeze({ numericInputsSource: 'CALLER_PROVIDED_ONLY', modelGeneratedNumericInputs: false, engineResultMayBeOverriddenByModel: false }),
    notices: Object.freeze([PTRC_FINANCIAL_NON_ADVICE_NOTICE]),
    recommendationCreated: false,
    projectedOutcomeGuaranteed: false
  });
}

export function financialCalculatorIds() { return Object.freeze(Object.keys(CALCULATORS)); }
