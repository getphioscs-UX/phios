import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='content/production-closure/live-customer-commercial-convergence/ask-architecture-r1';
fs.mkdirSync(dir,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const domainPath='content/product-convergence-r1/registries/canonical-product-domain-registry-v1.json',domains=read(domainPath).domains;
const methodPath='content/customer-experience-rebuild/registries/cx-r12r4-method-availability-registry-v1.json',methodRegistry=read(methodPath),methods=Object.values(methodRegistry).filter(Array.isArray).flat().filter(m=>m?.methodId);
const rows=[
 ['PERSONAL_METHODS','个人方法','Personal methods','/perspectives/personal/','PERSONAL_REALITY','assets/customer-ui/js/surfaces/personal-reality.js','Birth date; time and place as required; consent','Deterministic method reading'],
 ['RELATIONSHIP','关系','Relationships','/perspectives/relationship/','RELATIONSHIP_REALITY','functions/relationship/','Purpose; independently sourced participant information; applicable consent','Bounded relationship reading'],
 ['FINANCIAL','财务现实','Financial reality','/professional/financial/','FINANCIAL_REALITY','functions/professional/financial/','Income, expenses and selected financial records; consent','Financial organization and existing calculators'],
 ['WORLD','世界','World','/world/','WORLD_REALITY','assets/js/pages/world.js','Public object or region; dates for current questions','Historical Atlas and scoped current dossiers'],
 ['HEALTH_CARE','健康与照护','Health and care','/health-reality.html','HEALTH_REALITY','functions/health/health-reality-runtime.js','Situation, timing and changes; no diagnosis','Health organization and safety-first care routing'],
 ['PROFILE','个人画像','Profile','/perspectives/profile/','PERSONAL_REALITY','functions/profile/profile-production-authority.js','Self-report or eligible external/task evidence; consent','Personal Evidence; existing bilingual report entitlement'],
 ['REFLECTION','问题与反思','Reflection','/perspectives/tarot/','PERSONAL_REALITY','functions/tarot/','Question; explicit Tarot draw or I Ching cast','Separate deterministic symbolic reading'],
 ['PHI_CONFIGURATION','PHI 构型','PHI Configuration','/perspectives/phi-configuration/','PERSONAL_REALITY','assets/customer-ui/js/surfaces/personal-reality.js','Birth date, confirmed time/place; consent','Independent PHI configuration model'],
 ['KNOWLEDGE','阅读知识','Read knowledge','/knowledge/','KNOWLEDGE','functions/_lib/knowledge-answer-composition.js','Question or public source reference','Source-bound deterministic excerpts and reading paths'],
 ['PRODUCT_HELP','账户与报告帮助','Account and report help','/account/','MY_REALITY','functions/account/','Sign in to retrieve private reports or orders','Authorized account retrieval; no new report generation'],
 ['PROFESSIONAL','专业协助','Professional assistance','/professional/','PROFESSIONAL','functions/professional/','Selected service and explicit consent','Existing service/application route'],
 ['REALITY','继续我的现实','Continue My Reality','/reality/','MY_REALITY','functions/api/customer-contextual-ask.js','Explicitly selected authorized records or current self-report','Existing Reality and entitled contextual follow-up']
];
const capabilities=rows.map(([capabilityId,zh,en,canonicalRoute,domain,owner,input,output])=>({capabilityId,displayLabels:{en,'zh-Hans':zh},canonicalRoute,routeOwner:owner,canonicalDomainRefs:domains.some(d=>d.domain===domain)?[domain]:[],mappingGap:domains.some(d=>d.domain===domain)?null:'No product-domain owner with this exact name; customer group is not a new canonical domain.',availability:'DISCOVERY_ONLY_EXECUTION_GATED_BY_EXISTING_OWNER',availabilitySource:capabilityId==='PERSONAL_METHODS'||capabilityId==='PHI_CONFIGURATION'?methodPath:domainPath,inputRequirements:[input],sourceRequirements:['Existing registered owner; no client-provided authority'],consentRequirement:'EXPLICIT_WHERE_PERSONAL',entitlementRequirement:'EXISTING_SERVER_OWNER',executionClass:'ENTRY',outputKinds:[output],capabilityVersion:'R1-v1',indexVersion:'PHI-OS-ASK-ENTRY-R1-v1'}));
const registry={version:'PHI-OS-ASK-ENTRY-R1-v1',generatedFrom:[domainPath,methodPath],capabilities,methods:methods.map(m=>({methodId:m.methodId,formValue:m.formValue,inputMode:m.inputMode,experienceState:m.experienceState,label:m.label}))};
fs.writeFileSync('content/public/client-intent-router/registries/client-capability-projection-r1.json',JSON.stringify(registry,null,2)+'\n');
fs.writeFileSync('assets/js/ask-entry-capabilities.js','// Generated public projection; existing owners alone grant execution.\nexport const ASK_CAPABILITIES='+JSON.stringify(registry,null,2)+';\n');
const csv=(name,fields,rows)=>fs.writeFileSync(dir+'/'+name,[fields.join(','),...rows.map(r=>fields.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n');
csv('PHIOS-ASK-R1-CAPABILITY-LEDGER.csv',['capabilityId','canonicalRoute','routeOwner','availability','inputRequirements','outputKinds'],capabilities);
csv('PHIOS-ASK-R1-DOMAIN-PRODUCT-MAPPING.csv',['capabilityId','canonicalDomainRefs','mappingGap'],capabilities);
const baseline=dir+'/BASELINE.json';if(!fs.existsSync(baseline))fs.writeFileSync(baseline,JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),worktree:execFileSync('git',['status','--short'],{encoding:'utf8'}),at:new Date().toISOString(),authoritySHA256:crypto.createHash('sha256').update(fs.readFileSync(dir+'/OWNER-WORK-STEP.md')).digest('hex')},null,2));
console.log('Built public capability projection from existing domains and method authority: '+capabilities.length);
