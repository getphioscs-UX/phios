// Exact, reviewed historical exceptions only; no blanket nonzero-exit waiver.
export const explainedRentalFailures=[
 {name:'rental ratios distinguish zero, missing and out-of-range; no unsupported currency rounding',expected:'16000.00',actual:null,metric:'operatingCashFlow',reason:'Missing amountState and cashTiming on operating cost; paid cash cannot be inferred.'},
 {name:'actual receipts do not lose vacancy twice; forecasts and cash/tax allocation stay independent',expected:'19500.00',actual:null,metric:'operatingCashFlow',reason:'Missing amountState and cashTiming on maintenance; payment metadata is unspecified.'},
 {name:'rental tax candidate and cashflow are separate; interest not subtracted twice',expected:'18700.00',actual:null,metric:'operatingCashFlow',reason:'Missing amountState and cashTiming on operating cost; interest is not a second cash deduction.'},
 {name:'portfolio API keeps four period/mode/currency groups and stable property identities',expected:'950.00',actual:null,metric:'netCashFlow',reason:'Missing debtService; omitted debt payment is unknown, not a declared zero.'},
 {name:'unknown amounts and unpaid costs cannot be coerced into zero cash; metadata survives',expected:'APPROXIMATE',actual:'UNKNOWN',metric:'cashPrecision',reason:'Missing debtService in approximate-cost fixture; unknown debt dominates approximate cost.'}
];
export function validateHistoricalRentalObservation(text,exitCode){
 const failures=[...text.matchAll(/^not ok \d+ - (.+)\r?\n([\s\S]*?)(?=^(?:ok|not ok) \d+ - |^1\.\.|$(?![\s\S]))/gm)];
 const values=b=>Object.fromEntries([...b.matchAll(/^\s+(expected|actual): (.+)\r?$/gm)].map(([,k,v])=>[k,v.trim()==='~'?null:v.trim().replace(/^'(.*)'$/,'$1')]));
 const unexpected=failures.filter(([,name,body])=>{const e=explainedRentalFailures.find(x=>x.name===name),v=values(body);return !e||v.expected!==e.expected||v.actual!==e.actual;}).map(([,name])=>name);
 const missing=explainedRentalFailures.filter(e=>!failures.some(([,name])=>name===e.name)).map(e=>e.name);
 return {pass:exitCode===1&&failures.length===5&&!unexpected.length&&!missing.length,exitCode,unexpected,missing,failures:failures.map(([,name,body])=>({name,...values(body),...explainedRentalFailures.find(e=>e.name===name)}))};
}
