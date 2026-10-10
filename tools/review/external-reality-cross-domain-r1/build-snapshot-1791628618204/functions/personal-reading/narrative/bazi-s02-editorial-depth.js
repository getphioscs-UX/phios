export const S02_GOLD_STANDARD_VERSION='BAZI_S02_EDITORIAL_GOLD_STANDARD_V1';
export const S02_DEPTH_GATE_VERSION='BAZI_S02_EDITORIAL_DEPTH_GATE_V1';

const GROUP={PEER:{en:'peer relationships and self-position','zh-Hans':'同类关系与自我位置'},OUTPUT:{en:'expression and output','zh-Hans':'表达与输出'},WEALTH:{en:'resources and exchange','zh-Hans':'资源与交换'},OFFICER:{en:'rules, responsibility and pressure','zh-Hans':'规则、责任与压力'},RESOURCE:{en:'learning, support and absorption','zh-Hans':'学习、支持与吸收'}};
const LIST_FIELDS=['interpretation','supportingConditions','tensionConditions','howThisMayShowUp','counterSignals','realityCheck','observationPrompt'];
const SINGLE_FIELDS=['headline','lead','closingInsight','technicalNote','boundaryNote'];
const arr=x=>Array.isArray(x)?x:[];
const units=(text,locale)=>locale==='en'?String(text||'').trim().split(/\s+/).filter(Boolean).length:[...String(text||'').replace(/\s/g,'')].length;
const label=(code,locale)=>GROUP[code]?.[locale]||String(code||'').replaceAll('_',' ').toLowerCase();
const relationBlocks=n=>[...SINGLE_FIELDS.map(k=>({path:k,...n?.[k]})),...LIST_FIELDS.flatMap(k=>arr(n?.[k]).map((b,i)=>({path:`${k}.${i}`,...b})))].filter(b=>b.text?.trim());

export function buildS02EditorialDepthContract(pack){
 if(pack?.sectionKey!=='S02_PERSONALITY')return null;
 const claims=arr(pack.licensedClaims),has=t=>claims.some(c=>c.relationType===t);
 const requiredRelationTypes=['LIFE_DOMAIN_EXPLANATION','OPERATING_CONDITION','CO_OCCURRING_DIMENSIONS'];
 for(const type of ['TENSION','CROSS_SECTION_RELEVANCE','OPEN_CONDITION'])if(has(type))requiredRelationTypes.push(type);
 return {version:S02_DEPTH_GATE_VERSION,sectionKey:'S02_PERSONALITY',requiredRelationTypes,minimumUnits:pack.locale==='en'?{customerMeaning:130,lifeDomainExplanation:45,operatingCondition:18}:{customerMeaning:230,lifeDomainExplanation:80,operatingCondition:32},maximumPromptShare:0.45,maximumGenericSafetyClauses:1,sourceSynthesis:{lifeDomainMinimumSourceRefs:5,wholeChartPriorityRequired:has('CROSS_SECTION_RELEVANCE'),completeRelationSetRequired:Boolean(pack.semanticDepth?.relations?.length)},principles:['Explain the admitted multi-factor meaning instead of listing labels.','Make operating conditions explicit without converting them into observed behavior.','Keep whole-chart counterweights and open verdicts visible.','Reflection prompts supplement explanation; they do not replace it.','General scope language belongs once in boundaryNote, not throughout customer meaning.']};
}

export function buildS02EditorialGoldStandard(pack){
 if(pack?.sectionKey!=='S02_PERSONALITY')return null;
 const locale=pack.locale,zh=locale==='zh-Hans',claims=arr(pack.licensedClaims),first=type=>claims.find(c=>c.relationType===type),all=type=>claims.filter(c=>c.relationType===type);
 const primary=first('EMPHASIS'),secondary=first('ASSOCIATION'),domain=first('LIFE_DOMAIN_EXPLANATION'),dimensions=first('CO_OCCURRING_DIMENSIONS'),condition=first('OPERATING_CONDITION'),tension=first('TENSION'),open=first('OPEN_CONDITION'),boundary=first('BOUNDARY'),cross=all('CROSS_SECTION_RELEVANCE'),context=all('CONTEXT_MODIFIER');
 const primaryLabel=label(primary?.objects?.[0],locale),secondaryLabels=arr(secondary?.objects).map(x=>label(x,locale)).filter(Boolean),mixed=pack.semanticDepth?.carryingContext?.overallTendency==='MIXED_CARRY';
 const block=(role,text,claimIds)=>({role,text,claimIds:claimIds.filter(Boolean)});
 const blocks=zh?[
  block('thesis',`这一节真正要读的，不是给你贴上某一种性格标签，而是看「${primaryLabel}」怎样进入能力的形成与持续。它是当前能力主题的第一阅读重点，但不是全部；${secondaryLabels.join('、')||'其他功能主题'}仍然同时存在，因此这里讨论的是一个多因素结构，而不是单一特质。`,[primary?.id,domain?.id,secondary?.id]),
  block('integration','能力在这里不只等于“学得会”。更重要的是，吸收、练习、表达与反复承载能不能同时成立。换句话说，一项能力可以已经存在，但它是否容易持续调用、是否能在要求增加时保持可用，是另一层需要单独观察的问题。',[domain?.id,dimensions?.id,condition?.id]),
  block('context','关系层让这项读取保持情境性。自我位置、环境与表达之间同时存在联结与张力，所以能力不适合被理解成脱离环境的固定数值。这些结构关系不会证明你现实中一定怎样表现，但它们要求解读同时保留环境要求、自我位置与表达方式，而不能把它们压成一句“你就是这样的人”。',[domain?.id,...context.map(c=>c.id)]),
  block('operatingCondition',`能力是否稳定，仍要看支持、向外表达所需的投入与压力能否长期放在同一套承载条件里阅读。${mixed?'当前承载信息呈混合状态，因此更不适合把它简化成单一的“强”或“弱”。':'承载条件本身仍需要与最终强弱标签分开。'}这让“有能力”与“能否持续使用这项能力”成为两个相关但不能混为一谈的问题。`,[condition?.id,tension?.id,...cross.map(c=>c.id),open?.id]),
  block('wholeChart','整盘里与规则、责任、压力以及承载有关的优先主题也会回到这一节。它们提醒我们：如果只看学习与支持，就会漏掉能力被调用时同时存在的标准、要求与维持成本；但这些因素也不能反过来被写成固定人格或必然结果。',[...cross.map(c=>c.id),domain?.id,tension?.id]),
  block('openCondition','最终强弱判断仍然保持开放。因此，本节可以说明哪些结构需要一起看，却不能用一个强弱标签替代对具体条件的分析。',[open?.id]),
  block('closing','比起问“我是什么性格类型”，这一节更值得留下的问题是：我已经拥有的知识或能力，在什么条件下最容易保持可用、表达清楚并持续承担？又有哪些环境变化会让同一项能力需要付出更高的维持成本？',[domain?.id,condition?.id,dimensions?.id])
 ]:[
  block('thesis',`The useful question in this section is not which personality label fits you, but how ${primaryLabel} enters the way capability is organized and sustained. It is the first reading emphasis, not the whole story: ${secondaryLabels.join(', ')||'other functional themes'} remain present, so capability is treated as a multi-factor structure rather than a single trait.`,[primary?.id,domain?.id,secondary?.id]),
  block('integration','Capability here means more than being able to learn something. The reading keeps absorption, practice, expression and repeated carrying in view at the same time. A capability may be available while the effort required to keep using and expressing it remains a separate question, so presence and reliability should not be collapsed into one judgment.',[domain?.id,dimensions?.id,condition?.id]),
  block('context','The relationship layer keeps this reading context-sensitive. Self-position, environment and expression are connected by both links and tensions, so capability should not be treated as a fixed quantity detached from setting. These relations do not prove a behavior; they require the interpretation to keep environment, self-position and expression visible instead of turning them into a single personality label.',[domain?.id,...context.map(c=>c.id)]),
  block('operatingCondition',`Reliability remains conditional on how support, outward effort and pressure can be carried together over time. ${mixed?'The current carrying picture is mixed, which makes a one-word strong/weak identity especially unhelpful.':'Carrying conditions still remain separate from a fixed strong/weak identity.'} This keeps “having a capability” distinct from the question of how sustainably that capability can be used.`,[condition?.id,tension?.id,...cross.map(c=>c.id),open?.id]),
  block('wholeChart','Wider chart priorities around rules, responsibility, pressure and carrying conditions also reconnect to this topic. A learning-only interpretation would therefore be incomplete: standards, demand and the effort of sustaining expression must remain visible, without turning any of them into a fixed personality score or guaranteed outcome.',[...cross.map(c=>c.id),domain?.id,tension?.id]),
  block('openCondition','The final strong-or-weak judgment remains open. This section can therefore explain which conditions belong together without replacing those conditions with a single strength label.',[open?.id]),
  block('closing','A more useful question than “what personality type am I?” is: under which conditions does what I know remain usable, expressible and sustainable, and when does the same capability require more effort to carry?',[domain?.id,condition?.id,dimensions?.id])
 ];
 const observationPrompts=arr(pack.reflectionQuestions).slice(0,2).map(q=>({text:q.text,questionId:q.id,claimIds:arr(q.claimIds)}));
 return {version:S02_GOLD_STANDARD_VERSION,sectionKey:'S02_PERSONALITY',locale,evidenceClass:'EDITORIAL_BENCHMARK_FROM_LICENSED_CLAIMS',createsMeaning:false,humanAccepted:false,meaningEvidenceHash:pack.canonicalEvidenceHash||null,claimIds:[...new Set(blocks.flatMap(b=>b.claimIds))],blocks,observationPrompts,boundary:{text:zh?'这是有条件的象征性结构读取，不代表已经观察到的行为，也不预测事件。':'This is a conditional symbolic reading; it does not assert observed behavior or predict events.',claimIds:[boundary?.id].filter(Boolean)}};
}

export const S02_EN_HUMAN_REJECTION_REVISION='BAZI_S02_EN_HUMAN_REJECTION_2026_09_25';
export function buildS02HumanReviewFollowup(pack){
 if(pack?.sectionKey!=='S02_PERSONALITY'||pack?.locale!=='en')return null;
 const benchmarkRoles=arr(pack?.editorialGoldStandard?.blocks).map(b=>({role:b.role,claimIds:arr(b.claimIds)}));
 return {version:S02_EN_HUMAN_REJECTION_REVISION,decision:'REJECT_PREVIOUS_CANDIDATE',changesSemanticAuthority:false,productionActivated:false,requiredCoreRelations:['LIFE_DOMAIN_EXPLANATION','OPERATING_CONDITION','CO_OCCURRING_DIMENSIONS'],requirements:[
  'Do not write claim-by-claim schema paraphrases. Explain the licensed capability structure as customer meaning.',
  'Make LIFE_DOMAIN_EXPLANATION and OPERATING_CONDITION substantive enough to explain what the factors mean together and which admitted conditions change reliability.',
  'Preserve learning, support and absorption as the first emphasis while keeping secondary peer/self-position and rules/responsibility/pressure visible only through claims allowed by contentPlan.',
  'Keep absorption, practice, expression and repeated carrying simultaneous, never sequential.',
  'Where the licensed life-domain claim synthesizes self-position, environment and expression relations, keep those positions distinct and context-sensitive without inventing a behavioral effect. Do not force omitted CONTEXT_MODIFIER claims into separate customer blocks.',
  'Keep the unresolved strong-or-weak verdict brief and subordinate; do not use it as the headline, closing thesis or a fixed identity.',
  'Give substantive interpretation before reflection or counter prompts; prompts supplement explanation and never replace it.',
  'If manifestationLicenses is empty, howThisMayShowUp must remain empty. An evidence gap is not permission to add generic manifestations.',
  'Avoid standalone filler such as "forms part of the reading context", "associated themes" or "is considered through" when it does not explain licensed meaning.',
  'Treat editorialGoldStandard as a depth and readability benchmark only, never as an additional factual license.'
 ],benchmarkRoles};
}

export function evaluateS02GoldStandard(gold,pack){
 const issues=[],valid=new Set(arr(pack?.sourceFactIds)),texts=arr(gold?.blocks).map(b=>b.text||'').join(' '),total=units(texts,pack?.locale);
 if(gold?.version!==S02_GOLD_STANDARD_VERSION)issues.push('GOLD_STANDARD_VERSION');
 if(arr(gold?.claimIds).some(id=>!valid.has(id)))issues.push('GOLD_STANDARD_UNLICENSED_CLAIM');
 for(const role of ['thesis','integration','context','operatingCondition','wholeChart','openCondition','closing'])if(!arr(gold?.blocks).some(b=>b.role===role&&b.text?.trim()))issues.push('GOLD_STANDARD_MISSING_'+role.toUpperCase());
 if(/\d+(?:\.\d+)?\s*[%％]|professionalModules|functionalGroupId|sourceFactIds|self anchor|later expression|output cost|来源指定|接口|输出成本/i.test(texts))issues.push('GOLD_STANDARD_TECHNICAL_PROSE');
 const floor=pack?.locale==='en'?170:300;if(total<floor)issues.push('GOLD_STANDARD_TOO_THIN');
 return {version:S02_DEPTH_GATE_VERSION,status:issues.length?'REJECT':'PASS',issues,metrics:{customerMeaningUnits:total,claimCount:new Set(arr(gold?.claimIds)).size}};
}

export function evaluateS02EditorialDepth(n,pack){
 if(pack?.sectionKey!=='S02_PERSONALITY'||!pack?.editorialDepthContract)return {version:S02_DEPTH_GATE_VERSION,status:'NOT_APPLICABLE',issues:[],metrics:{}};
 const contract=pack.editorialDepthContract,blocks=relationBlocks(n),customer=blocks.filter(b=>!['BOUNDARY','TECHNICAL_NOTE','OBSERVATION_PROMPT','COUNTER_PROMPT'].includes(b.kind)),prompts=blocks.filter(b=>['OBSERVATION_PROMPT','COUNTER_PROMPT'].includes(b.kind)),relationTypes=new Set(customer.map(b=>b.relationType)),issues=[];
 for(const type of contract.requiredRelationTypes)if(!relationTypes.has(type))issues.push('MISSING_RELATION_TYPE:'+type);
 const customerUnits=customer.reduce((sum,b)=>sum+units(b.text,pack.locale),0),domainUnits=customer.filter(b=>b.relationType==='LIFE_DOMAIN_EXPLANATION').reduce((sum,b)=>sum+units(b.text,pack.locale),0),operatingUnits=customer.filter(b=>b.relationType==='OPERATING_CONDITION').reduce((sum,b)=>sum+units(b.text,pack.locale),0),promptUnits=prompts.reduce((sum,b)=>sum+units(b.text,pack.locale),0),promptShare=promptUnits/Math.max(1,customerUnits);
 const generic=/first reading priority|associated themes|forms part of (?:this|the) (?:topic'?s )?context|without establishing a real-life effect|keep .* as the main emphasis|首先关注的内容|同时相关的主题|是理解本章时需要保留的背景|不能由此认定现实中的作用/g,genericHits=(customer.map(b=>b.text).join(' ').match(generic)||[]).length,limits=contract.minimumUnits;
 if(customerUnits<limits.customerMeaning)issues.push('CUSTOMER_MEANING_TOO_THIN');
 if(domainUnits<limits.lifeDomainExplanation)issues.push('LIFE_DOMAIN_EXPLANATION_TOO_THIN');
 if(operatingUnits<limits.operatingCondition)issues.push('OPERATING_CONDITION_TOO_THIN');
 if(promptShare>contract.maximumPromptShare)issues.push('PROMPT_HEAVY');
 if(genericHits>contract.maximumGenericSafetyClauses)issues.push('GENERIC_SAFETY_PROSE');
 const domainClaim=arr(pack.licensedClaims).find(c=>c.relationType==='LIFE_DOMAIN_EXPLANATION');
 if((domainClaim?.sourceRefs?.length||0)<contract.sourceSynthesis.lifeDomainMinimumSourceRefs)issues.push('METHOD_SYNTHESIS_INSUFFICIENT');
 if(contract.sourceSynthesis.wholeChartPriorityRequired&&!arr(pack.licensedClaims).some(c=>c.relationType==='CROSS_SECTION_RELEVANCE'))issues.push('WHOLE_CHART_CONTEXT_MISSING');
 if(contract.sourceSynthesis.completeRelationSetRequired&&arr(pack.semanticDepth?.relations).length!==arr(pack.licensedClaims).filter(c=>c.relationType==='CONTEXT_MODIFIER').length)issues.push('RELATION_SET_INCOMPLETE');
 return {version:S02_DEPTH_GATE_VERSION,status:issues.length?'REJECT':'PASS',issues,metrics:{customerMeaningUnits:customerUnits,lifeDomainExplanationUnits:domainUnits,operatingConditionUnits:operatingUnits,promptUnits,promptShare,genericSafetyClauses:genericHits,relationTypes:[...relationTypes]}};
}
