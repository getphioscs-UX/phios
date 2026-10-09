import {generateBaziDeepManuscript} from './bazi-deep-manuscript-runtime.js';
import {invokeBaziDeepManuscript} from './bazi-deep-manuscript-provider.js';
import {createServerPaidReportContext} from '../paid-report-context.js';
import {createReportGenerationStore} from '../report-generation-store.js';
import {commerceEnvironment} from '../../commerce/commerce-environment.js';
import {baziPricingTier} from './bazi-deep-manuscript-budget.js';
// Producer adapter only. No HTTP route or production admission is enabled here.
// Publishing/material receipts remain the existing renderer owner's job.
export async function generatePaidBaziManuscript({binding,validateProviderOutput,...args}){
 if(typeof validateProviderOutput!=='function')throw Error('PAID_REPORT_DOMAIN_VALIDATOR_REQUIRED');
 if(!args.env?.OPENAI_API_KEY)throw Error('OPENAI_API_KEY_NOT_CONFIGURED');
 if(binding?.productId!=='COM-REPORT-BAZI-FULL'||binding.orderId!==args.order?.orderId||binding.authorityDigest!==args.pack?.digest)throw Error('BAZI_PAID_BINDING_MISMATCH');
 const store=await createReportGenerationStore(args.env,{...binding,environment:commerceEnvironment(args.env)},{scope:'manuscript'});
 return generateBaziDeepManuscript({...args,mode:'PRODUCTION',fixture:false,store,invoke:async({env,request})=>{
  const {rates}=baziPricingTier(args.model,request.plan.plannedInputTokens);
  const model={pricingVerified:args.model.pricingVerified,inputPricePerMillion:rates.input,cachedInputPricePerMillion:rates.cachedInput,outputPricePerMillion:rates.output};
  const context=await createServerPaidReportContext({env,binding,request:request.reportBudget,model,validateProviderOutput:body=>validateProviderOutput(body,request)});
  return invokeBaziDeepManuscript({env:{...env,REPORT_PAID_GENERATION_CONTEXT:context.transport},request});
 }});
}
