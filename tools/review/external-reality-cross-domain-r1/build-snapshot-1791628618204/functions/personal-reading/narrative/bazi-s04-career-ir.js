import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {CAREER_CSD_VERSION,CAREER_MECHANISMS,CAREER_TRANSLATION_CANON,CUSTOMER_VALUE_CONTRACT} from './bazi-s04-customer-value.js';
const unique=a=>[...new Set(a)];
export async function buildCareerNarrativeIR({brief}){
 if(brief.methodId!=='BZR'||brief.sectionKey!=='S04_CAREER')throw Error('CSD_S04_ONLY');
 const claims=brief.claims,byId=new Map(claims.map(c=>[c.claimId,c])),find=suffix=>claims.find(c=>c.claimId.endsWith(':'+suffix));
 const domain=find('DOMAIN_EXPLANATION'),primary=find('PRIMARY'),secondary=find('SECONDARY');
 const fact=suffix=>domain?.basis.find(b=>b.ref.endsWith('/'+suffix));
 const carry=fact('carryingContext'),relations=fact('relationshipInterfaces'),groups=fact('leadGroup');
 if(!carry?.value||!groups?.value||!relations)throw Error('CSD_AUTHORITY_FACTS_REQUIRED');
 const c=carry.value,lead=groups.value.groupCode,associated=new Set([lead,...(secondary?.objects||[])]);
 const relationClaims=claims.filter(c=>c.claimId.includes(':PAIR_'));
 const select=[];
 if(c.outwardVisible>c.supportVisible&&c.pressureVisible>0)select.push('OUTPUT_BACKING');
 if(lead==='OFFICER'&&relations.value.some(r=>['TENSION','REPEAT_TENSION'].includes(r.relationFamily)))select.push('AUTHORITY_LOAD');
 if(associated.has('WEALTH')&&c.outwardVisible>0)select.push('COMMERCIAL_DELIVERY');
 if(associated.has('RESOURCE')&&c.supportVisible>0)select.push('EXPERTISE_OUTPUT');
 if(associated.has('PEER')&&associated.has('WEALTH'))select.push('AGENCY_EXCHANGE');
 if(associated.has('OFFICER')&&c.supportVisible>0&&c.rootCount>0)select.push('BACKED_ACCOUNTABILITY');
 const priority=lead==='OFFICER'
  ?(c.supportVisible>=c.outwardVisible?['BACKED_ACCOUNTABILITY','AUTHORITY_LOAD','EXPERTISE_OUTPUT','COMMERCIAL_DELIVERY','OUTPUT_BACKING']:['AUTHORITY_LOAD','OUTPUT_BACKING','COMMERCIAL_DELIVERY','BACKED_ACCOUNTABILITY','EXPERTISE_OUTPUT'])
  :lead==='WEALTH'?['AGENCY_EXCHANGE','COMMERCIAL_DELIVERY','OUTPUT_BACKING','EXPERTISE_OUTPUT','BACKED_ACCOUNTABILITY']
  :['EXPERTISE_OUTPUT','OUTPUT_BACKING','COMMERCIAL_DELIVERY','AGENCY_EXCHANGE','BACKED_ACCOUNTABILITY','AUTHORITY_LOAD'];
 select.sort((a,b)=>(priority.indexOf(a)<0?99:priority.indexOf(a))-(priority.indexOf(b)<0?99:priority.indexOf(b)));
 select.splice(3); // Three distinct mechanisms, ranked by this chart's career priority.
 // Insufficient evidence blocks generation; never fill absent mechanisms with generic advice.
 const locale=brief.locale,zh=locale==='zh-Hans',say=(en,cn)=>zh?cn:en,nodes=[];
 function node(id,kind,role,text,sourceClaimIds,extra={}){
  const ids=unique(sourceClaimIds.filter(Boolean));
  if(!ids.length||ids.some(id=>!byId.has(id)))throw Error('CSD_PROVENANCE_INVALID');
  const row={id:'CSD:'+id,kind,role,text,sourceClaimIds:ids,sourceRefs:unique(ids.flatMap(id=>byId.get(id).sourceRefs)),certainty:'CONDITIONAL_DOMAIN_INTERPRETATION',allowsObservedReality:false,...extra};
  nodes.push(row);return row;
 }
 const base=[primary?.claimId,secondary?.claimId,domain?.claimId,find('TENSION')?.claimId,find('OPERATING_CONDITION')?.claimId];
 const mechanisms=select.map(key=>{
  const rule=CAREER_MECHANISMS[key];
  return node(key,'CAUSAL_CHAIN','MEANING',rule.mechanism[locale],base.concat(key==='AUTHORITY_LOAD'?relationClaims.map(c=>c.claimId):[]),{
   ruleId:key,inputs:[groups,carry,...(key==='AUTHORITY_LOAD'?[relations]:[])],
   advantage:rule.advantage[locale],cost:rule.cost[locale],fit:rule.fit[locale],mismatch:rule.mismatch[locale],
   operator:'CONDITIONAL_WORK_DYNAMIC',notEmpiricalCausation:true
  });
 });
 const primaryMechanism=mechanisms[0]||null;
 const thesis=node('THESIS','THESIS','CAREER_THESIS',say('Develop a 1–3 sentence career thesis from these selected mechanisms in their evidence priority. State a contribution, the decisive role condition and its cost; do not repeat the canon wording.','从按证据顺序选出的职业机制合成一至三句主旨，说明可发挥的贡献、关键岗位条件及代价，不照抄规则文字。'),base,{mechanismIds:mechanisms.map(m=>m.id)});
 const conditions=node('CONDITIONS','CONDITION','CONDITIONS',mechanisms.map(m=>`${m.fit} / ${m.mismatch}`).join('\n'),base,{mechanismIds:mechanisms.map(m=>m.id)});
 const counterweights=node('TRADEOFFS','ADVANTAGE_COST','COUNTERWEIGHTS',mechanisms.map(m=>`${m.advantage} / ${m.cost}`).join('\n'),base,{mechanismIds:mechanisms.map(m=>m.id)});
 const scenarioPool=mechanisms.flatMap(m=>CAREER_MECHANISMS[m.ruleId].scenarios.map(([scenarioClass,wording],index)=>({m,index,scenarioClass,wording})));
 const chosen=[],classes=new Set();
 for(const s of scenarioPool)if(!classes.has(s.scenarioClass)&&chosen.length<6){chosen.push(s);classes.add(s.scenarioClass);}
 const scenarios=chosen.map(s=>node(`${s.m.ruleId}:SCENARIO:${s.index}`,'SCENARIO','OBSERVABLE_EXPRESSION',s.wording[locale],s.m.sourceClaimIds,{scenarioClass:s.scenarioClass,mechanismIds:[s.m.id],grammar:'IF / WORK_DYNAMIC / BECAUSE / ADVANTAGE / COST',historicalAssertionAllowed:false}));
 const pairText=relationClaims.map(c=>{
  const r=c.basis[0]?.value,p=r?.positionThemeCode;
  const setting=p==='SELF_EXPRESSION_INTERFACE'?say('ownership of work and its delivery','工作主导权与交付'):p==='ENVIRONMENT_SELF_INTERFACE'?say('the organization and decision latitude','组织要求与个人决策余地'):say('organizational requirements and delivery arrangements','组织要求与交付安排');
  return {claimId:c.claimId,relationFamily:r?.relationFamily,text:say(`The recorded ${r?.relationFamily==='LINK'?'connection':'tension'} between ${setting} is a lens for comparing role arrangements, not evidence of behavior. Keep this pair distinct.`,`已记录的${setting}之间的${r?.relationFamily==='LINK'?'联结':'张力'}可用于比较岗位安排，不是行为事实；保留这组关系的独立含义。`)};
 });
 node('ROLE_COMPOSITION','MECHANISM','STRUCTURE',say('Explain the leading career priority through the selected mechanisms, integrating each distinct relational lens below without teaching category names.','通过选出的职业机制解释首要事业重点，整合下列各组不同的关系视角，不讲解类别名称。'),[primary?.claimId,secondary?.claimId,find('DIMENSIONS')?.claimId,...relationClaims.map(c=>c.claimId)],{relationalLenses:pairText});
 const timingClaim=find('TIME_TOPIC');let timing=null;
 if(timingClaim){
  const t=timingClaim.basis[0]?.value;
  const layer=(name,x)=>{const keys=unique([x?.stemGroup,...(x?.matchedGroups||[])]).filter(k=>CAREER_TRANSLATION_CANON[k]);return {layer:name,emphasis:keys.map(k=>({group:k,domain:CAREER_TRANSLATION_CANON[k][zh?'zh':'en']})),source:x};};
  timing=node('TIMING','TIMING','TIMING_RELEVANCE',say('Modify the natal mechanisms using the separate Da Yun and annual emphases below: explain which delivery, budget, accountability or preparation decisions deserve attention now. Preserve the different layer emphasis; overlap raises salience, not event certainty. Natal interpretation remains primary.','将下列大运、流年各自的重点作用于本命职业机制，解释当前哪些交付、预算、问责或准备决策更值得关注。保留两层差异，重叠只提高关注度，不提高事件确定性；本命解释仍是主线。'),[...base,timingClaim.claimId],{mechanismIds:mechanisms.map(m=>m.id),layers:[layer('DA_YUN',t?.daYun),layer('ANNUAL',t?.liuNian)]});
 }
 const navigation=node('DECISION','NAVIGATION','NAVIGATION',say('Offer an ordered role-evaluation sequence: first identify the promised deliverable and who controls it; then compare the specific support/budget/authority needed by the selected mechanisms with what is offered; finally identify observable evidence to review after a bounded trial. Adapt the sequence to these mechanisms. Use at most two validation questions in the whole section.','按顺序提供岗位判断：先明确承诺交付什么、由谁控制；再按选定机制比较所需支持、预算和权限与实际提供条件；最后明确一段试行后要复查的可观察证据。根据本命机制调整，全章至多两个验证问题。'),unique([...base,...claims.filter(c=>c.role==='NAVIGATION'||c.claimType==='QUESTION').map(c=>c.claimId)]),{mechanismIds:mechanisms.map(m=>m.id)});
 const uncertainty=node('BOUNDARY','UNCERTAINTY','COUNTERWEIGHTS',say('Use one concise framing statement: these are chart-based possibilities to test against actual work. Actual workplace help and behavior are unknown; strength and pattern candidates remain open, not a fixed identity or one established pattern. No occupation or event is predicted. Keep only genuinely needed local qualifications.','只保留一句简短框定：这是待实际工作检验的命盘可能性。现实中的支持和行为未知，强弱与格局仍有未定条件，不是固定身份或唯一已定格局，不预测职业或事件；只在确有需要处保留局部限定。'),claims.filter(c=>c.claimType==='BOUNDARY'||c.claimType==='OPEN_CONDITION'||c.counterweights?.length).map(c=>c.claimId));
 const seed={version:CAREER_CSD_VERSION,methodId:'BZR',sectionKey:'S04_CAREER',locale,state:'REVIEW_ONLY',sourceBriefDigest:brief.briefSemanticDigest,
  inputChartFacts:[groups,carry,relations],careerThesis:thesis,primaryCareerMechanism:primaryMechanism,secondaryCareerMechanisms:mechanisms.slice(1),causalChains:mechanisms,
  careerAdvantages:mechanisms.map(m=>({nodeId:m.id,text:m.advantage,sourceClaimIds:m.sourceClaimIds})),careerCosts:mechanisms.map(m=>({nodeId:m.id,text:m.cost,sourceClaimIds:m.sourceClaimIds})),
  supportConditions:[conditions],pressureConditions:mechanisms.filter(m=>['OUTPUT_BACKING','AUTHORITY_LOAD'].includes(m.ruleId)),resourceConditions:mechanisms.filter(m=>['COMMERCIAL_DELIVERY','AGENCY_EXCHANGE'].includes(m.ruleId)),outputConditions:mechanisms.filter(m=>['OUTPUT_BACKING','EXPERTISE_OUTPUT'].includes(m.ruleId)),authorityConditions:mechanisms.filter(m=>['AUTHORITY_LOAD','BACKED_ACCOUNTABILITY'].includes(m.ruleId)),
  environmentFit:mechanisms.map(m=>({nodeId:m.id,text:m.fit,sourceClaimIds:m.sourceClaimIds})),environmentMismatch:mechanisms.map(m=>({nodeId:m.id,text:m.mismatch,sourceClaimIds:m.sourceClaimIds})),
  sustainableRolePatterns:mechanisms.map(m=>({nodeId:m.id,condition:m.fit,benefit:m.advantage,sourceClaimIds:m.sourceClaimIds})),unsustainableRolePatterns:mechanisms.map(m=>({nodeId:m.id,condition:m.mismatch,cost:m.cost,sourceClaimIds:m.sourceClaimIds})),
  realWorldScenarios:scenarios,decisionSignals:[navigation],timingAmplifiers:timing?[timing]:[],timingCounterweights:timing?[{nodeId:timing.id,sourceClaimIds:timing.sourceClaimIds,text:'NATAL_PRIMARY / NO_EVENT_CERTAINTY'}]:[],uncertainties:[uncertainty],sourceClaimIds:unique(nodes.flatMap(n=>n.sourceClaimIds)),nodes,
  eligibility:{eligible:mechanisms.length>=3&&scenarios.length>=4,reasons:[...(mechanisms.length<3?['INSUFFICIENT_SUPPORTED_CAUSAL_CHAINS']:[]),...(scenarios.length<4?['INSUFFICIENT_SUPPORTED_SCENARIOS']:[])]}
 };
 // Normalize repeated objects to node references; the provider receives each
 // mechanism/scenario once, while every required IR field stays addressable.
 for(const key of ['careerThesis','primaryCareerMechanism'])seed[key]=seed[key]?{nodeId:seed[key].id}:null;
 for(const key of ['secondaryCareerMechanisms','causalChains','supportConditions','pressureConditions','resourceConditions','outputConditions','authorityConditions','realWorldScenarios','decisionSignals','timingAmplifiers','uncertainties'])seed[key]=seed[key].map(n=>({nodeId:n.id}));
 return deepFreeze({...seed,digest:await sha256Stable(seed)});
}
export async function extendCareerBrief(predecessor){
 const careerNarrativeIR=await buildCareerNarrativeIR({brief:predecessor});
 const claims=careerNarrativeIR.nodes.map(n=>({claimId:n.id,role:n.role,text:n.text,claimType:n.kind,priority:'REQUIRED',sourceRefs:n.sourceRefs,sourceClaimIds:n.sourceClaimIds,
  conditions:['CONDITIONAL_WORK_SCENARIO_NOT_OBSERVED_FACT'],counterweights:[],timing:n.kind==='TIMING'?['SEE_CAREER_IR_TIMING_NODE']:[],certainty:'SYMBOLIC_CONDITIONAL',semanticOperators:['CONDITIONAL_WORK_DYNAMIC'],license:{owner:CAREER_CSD_VERSION,createsMethodRule:false,allowsObservedReality:false,allowsConditionalScenario:true},basis:[{careerNodeId:n.id}]}));
 const {briefSemanticDigest,...base}=predecessor;
 const authorityFacts=Object.fromEntries(predecessor.claims.flatMap(c=>c.basis||[]).filter(b=>b.ref).map(b=>[b.ref,b.value]));
 const authorityClaims=predecessor.claims.map(c=>({...c,basis:(c.basis||[]).map(b=>({ref:b.ref}))}));
 const seed={...base,successorVersion:CAREER_CSD_VERSION,successorPromptVersion:'PHI-OS-S04-CSD-PROMPT-v1.0.0',claims,authorityClaims,authorityFacts,predecessorBriefDigest:briefSemanticDigest,careerNarrativeIR,
  requiredClaimRoles:['CAREER_THESIS',...predecessor.requiredClaimRoles],realityBridgePolicy:'SOURCE_DERIVED_CONDITIONAL_SCENARIOS',customerValueContract:CUSTOMER_VALUE_CONTRACT,translationCanon:CAREER_TRANSLATION_CANON,
  depthTarget:{minimumMeaningfulUnits:14,maximumMeaningfulUnits:0,calibrationState:'OWNER_ACCEPTANCE_PENDING'},sourceAuthorityVersion:predecessor.sourceAuthorityVersion+'+'+CAREER_CSD_VERSION,
  paragraphFunctions:['THESIS','MECHANISM','CONDITION','ADVANTAGE','COST','SCENARIO','TIMING','NAVIGATION','UNCERTAINTY'],
  narrativeFreedom:{...base.narrativeFreedom,mayVary:[...base.narrativeFreedom.mayVary,'conditional career scenarios within the supplied canon'],mayInventLifeEvents:false}
 };
 return deepFreeze({...seed,briefSemanticDigest:await sha256Stable(seed)});
}
