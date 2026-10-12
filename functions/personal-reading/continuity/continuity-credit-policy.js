import registry from '../../../content/personal-reading/continuity/registries/continuity-subscription-product-registry-v3-candidate.json';
// Proper registry successor owns commercial values; this is not a second product registry.
export const CREDIT_POLICY=Object.freeze({version:registry.schemaVersion,productId:registry.productId,amountMinor:registry.amountMinor,grantMicroUSD:registry.quota.unitMaximumMicroUSD,grantCredits:registry.credits.grant,microUSDPerCredit:registry.credits.microUSDPerCredit,rollover:registry.credits.rollover,budgets:Object.freeze({...registry.taskBudgetsMicroUSD}),modes:['KNOWLEDGE','NAVIGATION'],automaticRetry:registry.provider.automaticRetry});
export function integerCost(value){if(!Number.isSafeInteger(value)||value<0)throw Error('EXACT_INTEGER_COST_REQUIRED');return value;}
export function formatCredits(microUSD){integerCost(microUSD);const whole=Math.floor(microUSD/10000),remainder=microUSD%10000;return remainder?whole+'.'+String(remainder).padStart(4,'0').replace(/0+$/,''):String(whole);}
export function admitCreditTask({mode,depth,confirmed,maximumMicroUSD,modelMicroUSD,toolMicroUSD=0,recoveryMicroUSD=0,researchAdmitted=false}){
 if(!CREDIT_POLICY.modes.includes(mode)||!Object.hasOwn(CREDIT_POLICY.budgets,depth))throw Error('ASK_MODE_NOT_ADMITTED');
 if(depth!=='ORDINARY'&&confirmed!==true)throw Error('EXPLICIT_TASK_BUDGET_CONFIRMATION_REQUIRED');
 if(depth==='RESEARCH'&&!researchAdmitted)throw Error('RESEARCH_SOURCE_TOOL_ADMISSION_REQUIRED');
 const total=integerCost(modelMicroUSD)+integerCost(toolMicroUSD)+integerCost(recoveryMicroUSD);
 if(!Number.isSafeInteger(total)||!total||total>integerCost(maximumMicroUSD)||maximumMicroUSD>CREDIT_POLICY.budgets[depth])throw Error('ASK_TASK_BUDGET_EXCEEDED');
 return maximumMicroUSD;
}
