import crypto from 'node:crypto';
import {composeHumanDesignR3} from './human-design-r3-composition-runtime.js';
import {deduplicateHumanDesignR3Claims} from './human-design-r3-semantic-dedup.js';

export const HD_R3_PRIORITY_VERSION='PHI-OS-HD-PRO-R3-W14-WHOLE-CHART-PRIORITY-v1.0.0';

const zh=(en,zhHans)=>({en,zhHans});
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);

const ORDER=Object.freeze([
  'CHART_LEVEL_COMPOSITION','AUTHORITY_COMPOSITION','PROFILE_COMPOSITION','CHANNEL_COMPOSITION',
  'DEFINITION_COMPOSITION','CENTER_MEANING','GATE_DETAIL','ADVANCED_VARIABLE_MODIFIER'
]);
const orderIndex=c=>{const i=ORDER.indexOf(c);return i<0?ORDER.length:i;};

function subjectHas(claim,prefix){return (claim.subjectRefs||[]).some(x=>String(x).startsWith(prefix));}
function classifyDomains(claim){
  const out=[];
  const family=String(claim.compositionClass||claim.scope||'');
  const cluster=String(claim.semanticClusterId||'');
  if(subjectHas(claim,'AUTHORITY.')||/AUTHORITY|DECISION/.test(family+cluster)) out.push('DECISION');
  if(subjectHas(claim,'TYPE.')||/TYPE/.test(family)) out.push('ENGAGEMENT');
  if(subjectHas(claim,'PROFILE.')||/PROFILE/.test(family)) out.push('ROLE','RELATIONSHIP');
  if(subjectHas(claim,'CHANNEL.')||/CHANNEL/.test(family)) out.push('STRUCTURE','RELATIONSHIP');
  if(subjectHas(claim,'DEFINITION.')||/DEFINITION/.test(family)) out.push('INTEGRATION');
  if((claim.subjectRefs||[]).some(x=>/\.UNDEFINED$|\.OPEN$/.test(String(x)))||/UNDEFINED/.test(family)) out.push('OPENNESS_PRESSURE');
  if(subjectHas(claim,'ADVANCED.')) out.push('ENVIRONMENT_ADVANCED');
  if(subjectHas(claim,'GATE.')) out.push('GATE_DETAIL');
  return uniq(out);
}

function intentTerms(intent){
  const s=String(intent||'').toLowerCase();
  const map=[
    ['DECISION',['decision','decide','choice','选择','决定','决策']],
    ['ENGAGEMENT',['work','energy','engage','投入','工作','行动','能量']],
    ['RELATIONSHIP',['relationship','partner','team','关系','伴侣','团队','互动']],
    ['ROLE',['role','career','expectation','角色','事业','期待']],
    ['OPENNESS_PRESSURE',['pressure','stress','open','压力','开放','影响']],
    ['ENVIRONMENT_ADVANCED',['environment','phs','variable','环境','变量','感知']],
    ['INTEGRATION',['integration','definition','split','整合','定义','分离']]
  ];
  return map.filter(([,terms])=>terms.some(t=>s.includes(t))).map(([d])=>d);
}

function compareClaims(a,b,intentDomains){
  const ad=classifyDomains(a), bd=classifyDomains(b);
  const ai=intentDomains.some(x=>ad.includes(x)), bi=intentDomains.some(x=>bd.includes(x));
  if(ai!==bi) return bi-ai;
  const od=orderIndex(a.precedenceClass)-orderIndex(b.precedenceClass); if(od) return od;
  const support=(b.supportingEvidence?.length||0)-(a.supportingEvidence?.length||0); if(support) return support;
  const evidence=(b.evidenceRefs?.length||b.sourceRefs?.length||0)-(a.evidenceRefs?.length||a.sourceRefs?.length||0); if(evidence) return evidence;
  const subjects=(b.clusterSubjectRefs?.length||b.subjectRefs?.length||0)-(a.clusterSubjectRefs?.length||a.subjectRefs?.length||0); if(subjects) return subjects;
  return String(a.claimId||'').localeCompare(String(b.claimId||''));
}

function roleKey(claim){
  const d=classifyDomains(claim);
  if(d.includes('DECISION')) return 'DECISION';
  if(d.includes('ENGAGEMENT')) return 'ENGAGEMENT';
  if(d.includes('ROLE')) return 'ROLE';
  if(d.includes('INTEGRATION')) return 'INTEGRATION';
  if(d.includes('STRUCTURE')) return 'STRUCTURE';
  if(d.includes('OPENNESS_PRESSURE')) return 'OPENNESS_PRESSURE';
  if(d.includes('ENVIRONMENT_ADVANCED')) return 'ADVANCED';
  return 'OTHER';
}

function priorityReasons(claim,intentDomains,facts={}){
  const reasons=[];
  if(subjectHas(claim,'AUTHORITY.')) reasons.push('AUTHORITY_RELEVANCE');
  if(subjectHas(claim,'TYPE.')) reasons.push('TYPE_RELEVANCE');
  if(subjectHas(claim,'PROFILE.')) reasons.push('PROFILE_RELEVANCE');
  if(subjectHas(claim,'CHANNEL.')) reasons.push('COMPLETE_CHANNEL_RELEVANCE');
  if(subjectHas(claim,'DEFINITION.')) reasons.push('DEFINITION_TOPOLOGY_RELEVANCE');
  if((claim.supportingEvidence?.length||0)>0) reasons.push('REPEATED_STRUCTURAL_SUPPORT');
  const subjectSet=new Set(claim.clusterSubjectRefs?.length?claim.clusterSubjectRefs:claim.subjectRefs||[]);
  const pdOverlap=(facts.personalityDesignPairs||[]).some(pair=>{
    const ch=pair.channelId?`CHANNEL.${pair.channelId}`:null;
    const pg=pair.personalityGate?`GATE.${pair.personalityGate}`:null;
    const dg=pair.designGate?`GATE.${pair.designGate}`:null;
    return (ch&&subjectSet.has(ch))||(pg&&subjectSet.has(pg))||(dg&&subjectSet.has(dg));
  });
  if(pdOverlap||(claim.subjectRefs||[]).some(x=>/\.PERSONALITY$|\.DESIGN$/.test(String(x)))) reasons.push('PERSONALITY_DESIGN_OVERLAP_STRUCTURAL_ONLY');
  if(intentDomains.some(x=>classifyDomains(claim).includes(x))) reasons.push('CUSTOMER_QUESTION_RELEVANCE');
  return reasons.length?reasons:['STRUCTURAL_RELEVANCE'];
}

function customerStructureLabel(ref){
  const parts=String(ref).split('.');
  if(parts[0]==='TYPE') return (parts[1]||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());
  if(parts[0]==='AUTHORITY') return `${(parts[1]||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase())} Authority`;
  if(parts[0]==='PROFILE') return `Profile ${(parts[1]||'').replace('_','/')}`;
  if(parts[0]==='DEFINITION') return `${(parts[1]||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase())} Definition`;
  if(parts[0]==='CHANNEL') return `Channel ${parts[1]||''}`;
  if(parts[0]==='GATE') return `Gate ${parts[1]||''}${parts[2]?` (${parts[2].toLowerCase()})`:''}`;
  if(parts[0]==='CENTER') return `${(parts[2]||'').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase())} ${(parts[1]||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase())}`.trim();
  if(parts[0]==='ADVANCED') return `${(parts[1]||'').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase())} ${parts.slice(2).join(' ')}`.trim();
  return String(ref).replaceAll('_',' ').replaceAll('.',' · ');
}
function detailsForClaim(claim){
  const subjects=claim.clusterSubjectRefs?.length?claim.clusterSubjectRefs:claim.subjectRefs||[];
  const labels=subjects.map(customerStructureLabel);
  const family=String(claim.compositionClass||'');
  let combination=zh('Several admitted structures are being read together as one finding so the reading does not repeat each atomic meaning separately.','这里把多个已获准结构合并成一个结论，避免把每个原子意义逐条重复。');
  let reality=zh('Look for repeated situations where this combined pattern changes how you engage, decide, relate, or integrate experience.','观察这种组合是否在不同现实场景里反复改变你的投入、决定、互动或内部整合。');
  let contradiction=zh('If the pattern does not recur across meaningful contexts, or another higher-priority confirmed structure consistently explains the situation better, treat this finding as contextual rather than universal.','如果这个模式没有在重要情境中反复出现，或另一个更高优先级的已确认结构持续更能解释现实，应把这个结论视为情境性的，而不是普遍定论。');
  if(family==='TYPE_X_AUTHORITY'){
    combination=zh('Engagement mechanics and final decision timing are coordinated but kept distinct: noticing a response or impulse does not automatically finish the decision process.','投入机制与最终决策时序会一起读取，但仍保持职责分离：出现回应或冲动，并不自动代表决策过程已经完成。');
    reality=zh('Compare what first drew you into an option with what remained clear when the decision actually settled.','把最初吸引你进入选项的信号，与真正决定稳定下来后仍然保留的清晰度作比较。');
    contradiction=zh('If immediate engagement signals and later decision clarity consistently show no meaningful difference, this composition may be less prominent in your lived experience.','如果即时投入信号与后续决策清晰度在现实中持续没有明显差异，这个组合在你的体验中可能不是主要主题。');
  } else if(/CHANNEL/.test(family)){
    combination=zh('The complete Channel becomes the main explanation; its component Gates and connected Centers remain supporting evidence rather than parallel headlines.','完整通道成为主要解释；组成闸门与连接中心只作为支持证据，不与通道平级抢主标题。');
    reality=zh('Look for the recurring two-center process described by this Channel rather than isolated moments that resemble only one Gate.','观察这条通道连接的两个中心是否形成持续过程，而不是只寻找偶尔像某一个闸门的瞬间。');
  } else if(/DEFINITION/.test(family)){
    combination=zh('The finding describes how confirmed centers and complete Channels form internal clusters; external interaction may change the integration experience without making the person incomplete or changing the chart.','这个结论描述已确认中心与完整通道如何形成内部群组；外部互动可以改变整合体验，但不会让一个人因此“不完整”，也不会改变图表本身。');
    reality=zh('Notice whether different contexts make communication between internal clusters feel easier or slower, without assuming another person is required to complete you.','观察不同情境是否让内部群组之间的衔接变得更容易或更慢，但不要把这种变化理解为必须靠另一个人才能完整。');
  } else if(/VARIABLE/.test(family)){
    combination=zh('The advanced Variable/PHS layer only modifies how an already-established core pattern may be experienced; it cannot reverse the core reading or create a new decision rule.','高级 Variable/PHS 只修饰已经成立的核心模式如何被体验；它不能推翻核心读取，也不能创造新的决策规则。');
    reality=zh('Use this as a small, reversible observation experiment rather than a prescription.','把这一层当作小规模、可逆的观察实验，而不是处方。');
    contradiction=zh('If changing the environmental or sensory condition produces no repeatable difference, keep the modifier low priority.','如果改变环境或感知条件没有产生可重复差异，就应继续把这个修饰层放在低优先级。');
  }
  return {
    finding:claim.customerMeaning||zh('A chart-specific composition is present.','这张图存在一个特定的组合结构。'),
    whyThisAppears:zh(`This finding appears because ${labels.join(' + ')||'several confirmed structures'} operate together in this chart.`,`这个结论之所以出现，是因为 ${labels.join(' + ')||'多个已确认结构'} 在这张图里同时成立并相互作用。`),
    structuralEvidence:Object.freeze(labels),
    howStructuresCombine:combination,
    realLifeExpression:reality,
    whatWouldContradictIt:contradiction
  };
}

function toFinding(claim,intentDomains,facts,tier,index){
  const d=detailsForClaim(claim);
  const technical={
    claimIds:Object.freeze([claim.claimId,...(claim.supportingEvidence||[]).map(x=>x.claimId)]),
    structureRefs:Object.freeze(uniq(claim.clusterSubjectRefs?.length?claim.clusterSubjectRefs:claim.subjectRefs)),
    sourceRefs:Object.freeze(uniq(claim.evidenceRefs?.length?claim.evidenceRefs:claim.sourceRefs)),
    compositionRuleIds:Object.freeze(uniq([claim.compositionRuleId,...(claim.supportingEvidence||[]).map(x=>x.compositionRuleId)]))
  };
  return Object.freeze({
    findingId:`HD-R3-W14-${tier}-${String(index+1).padStart(2,'0')}-${digest(technical.claimIds)}`,
    tier,
    semanticRole:roleKey(claim),
    domains:Object.freeze(classifyDomains(claim)),
    priorityReasons:Object.freeze(priorityReasons(claim,intentDomains,facts)),
    ...d,
    technicalRefs:Object.freeze(technical),
    customerRankLabel:tier==='PRIMARY'?'PRIMARY_FINDING':tier==='SECONDARY'?'SECONDARY_FINDING':tier==='CONTEXTUAL'?'CONTEXTUAL_FINDING':'ADVANCED_DETAIL',
    pseudoPrecisionScore:null
  });
}

export function prioritizeHumanDesignR3WholeChart(facts={},options={}){
  const composition=options.compositionResult||composeHumanDesignR3(facts);
  const dedup=options.dedupResult||deduplicateHumanDesignR3Claims(composition.claims);
  const intentDomains=intentTerms(options.customerIntent||facts.customerIntent||'');
  const candidates=[...dedup.primaryClaims].filter(x=>x.compositionSupported===true && x.semanticAdmissionStatus!=='SEMANTIC_REVIEW_PENDING');
  const advanced=candidates.filter(x=>x.precedenceClass==='ADVANCED_VARIABLE_MODIFIER').sort((a,b)=>compareClaims(a,b,intentDomains));
  const core=candidates.filter(x=>x.precedenceClass!=='ADVANCED_VARIABLE_MODIFIER').sort((a,b)=>compareClaims(a,b,intentDomains));
  const target=Math.max(5,Math.min(8,Number(options.primaryTarget||6)));

  // Ensure a professional-reader mix before filling by deterministic precedence.
  const selected=[];
  const selectedIds=new Set();
  const preferredRoles=['DECISION','ENGAGEMENT','ROLE','INTEGRATION','STRUCTURE','OPENNESS_PRESSURE'];
  for(const role of preferredRoles){
    const c=core.find(x=>!selectedIds.has(x.claimId)&&roleKey(x)===role);
    if(c&&selected.length<target){selected.push(c);selectedIds.add(c.claimId);}
  }
  for(const c of core){if(selected.length>=target) break;if(!selectedIds.has(c.claimId)){selected.push(c);selectedIds.add(c.claimId);}}

  const remainingCore=core.filter(x=>!selectedIds.has(x.claimId));
  const secondaryCount=remainingCore.length<=1?remainingCore.length:Math.min(3,Math.ceil(remainingCore.length/2));
  const secondary=remainingCore.slice(0,secondaryCount);
  const secondaryIds=new Set(secondary.map(x=>x.claimId));
  const contextual=remainingCore.filter(x=>!secondaryIds.has(x.claimId));

  const primaryFindings=Object.freeze(selected.map((c,i)=>toFinding(c,intentDomains,facts,'PRIMARY',i)));
  const secondaryFindings=Object.freeze(secondary.map((c,i)=>toFinding(c,intentDomains,facts,'SECONDARY',i)));
  const contextualFindings=Object.freeze(contextual.map((c,i)=>toFinding(c,intentDomains,facts,'CONTEXTUAL',i)));
  const advancedDetails=Object.freeze(advanced.map((c,i)=>toFinding(c,intentDomains,facts,'ADVANCED',i)));
  const result={
    schemaVersion:HD_R3_PRIORITY_VERSION,
    chartAuthority:'CONFIRMED_EXTERNAL_HUMAN_DESIGN_CHART',
    customerIntent:options.customerIntent||facts.customerIntent||null,
    primaryTarget:target,
    primaryFindings,secondaryFindings,contextualFindings,advancedDetails,
    counts:Object.freeze({primary:primaryFindings.length,secondary:secondaryFindings.length,contextual:contextualFindings.length,advanced:advancedDetails.length}),
    priorityPolicy:Object.freeze({
      defaultPrimaryRange:Object.freeze([5,8]),
      deterministic:true,
      usesOpaqueScore:false,
      usesPercentageConfidence:false,
      considers:Object.freeze(['AUTHORITY_RELEVANCE','TYPE_RELEVANCE','PROFILE_RELEVANCE','COMPLETE_CHANNEL_RELEVANCE','DEFINITION_TOPOLOGY_RELEVANCE','REPEATED_STRUCTURAL_SUPPORT','PERSONALITY_DESIGN_OVERLAP_STRUCTURAL_ONLY','CUSTOMER_QUESTION_RELEVANCE']),
      advancedVariableCanOverrideCore:false
    }),
    technical:Object.freeze({compositionDigest:composition.compositionDigest,dedupDigest:dedup.dedupDigest,inputCompositionClaims:composition.claims.length,dedupPrimaryClaims:dedup.primaryClaims.length}),
    publication:Object.freeze({machineVerified:false,humanAccepted:false,customerPublishableR3:false})
  };
  return Object.freeze({...result,priorityDigest:digest(result)});
}
