from pathlib import Path
w=Path('C:/phios/.worktrees/five-method-paid-report-production-r1')
for name in ['ziwei-vfr-five-call-composer.js','ziwei-vfr-one-call-composer.js','ziwei-vfr-targeted-repair.js']:
 p=w/'functions/personal-reading/visual-first'/name;s=p.read_text(encoding='utf8');s=s.replace('import {ZIWEI_R5_PAI_REGISTRY}', 'import {ZIWEI_R5_PAI_REGISTRY,ziweiR5PricingForInput}').replace('estimatePaiProviderCost(model,{inputTokens','estimatePaiProviderCost(ziweiR5PricingForInput(model,inputTokens),{inputTokens')
 if name=='ziwei-vfr-one-call-composer.js':
  s=s.replace('planVfrProviderBudget,assertVfrLiveAllowed','planVfrProviderBudget,estimateVfrTokens,assertVfrLiveAllowed').replace("methodId:'ZWR',model,input:planningInput","methodId:'ZWR',model:ziweiR5PricingForInput(model,estimateVfrTokens(planningInput)),input:planningInput")
 p.write_text(s,encoding='utf8')
