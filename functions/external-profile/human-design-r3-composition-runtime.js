import crypto from 'node:crypto';

export const HD_R3_COMPOSITION_VERSION='PHI-OS-HD-PRO-R3-W12-COMPOSITION-RUNTIME-v1.0.0';

export const HD_R3_PRECEDENCE=Object.freeze({
  CHART_LEVEL_COMPOSITION:800,
  AUTHORITY_COMPOSITION:700,
  PROFILE_COMPOSITION:600,
  CHANNEL_COMPOSITION:500,
  DEFINITION_COMPOSITION:400,
  CENTER_MEANING:300,
  GATE_DETAIL:200,
  ADVANCED_VARIABLE_MODIFIER:100
});

export const HD_R3_COMPOSITION_RULES=Object.freeze([
  Object.freeze({ruleId:'HD-R3-COMP-TYPE_AUTHORITY',family:'TYPE_X_AUTHORITY',precedenceClass:'AUTHORITY_COMPOSITION',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-TYPE_PROFILE',family:'TYPE_X_PROFILE',precedenceClass:'PROFILE_COMPOSITION',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-AUTHORITY_PROFILE',family:'AUTHORITY_X_PROFILE',precedenceClass:'AUTHORITY_COMPOSITION',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-PROFILE_DEFINITION',family:'PROFILE_X_DEFINITION',precedenceClass:'PROFILE_COMPOSITION',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-AUTHORITY_CENTER',family:'AUTHORITY_X_CENTER',precedenceClass:'AUTHORITY_COMPOSITION',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-DEFINED_CENTER_CHANNEL',family:'DEFINED_CENTER_X_CHANNEL',precedenceClass:'CHANNEL_COMPOSITION',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-UNDEFINED_CENTER_HANGING_GATE',family:'UNDEFINED_CENTER_X_HANGING_GATE',precedenceClass:'CENTER_MEANING',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-CHANNEL_GATE',family:'CHANNEL_X_GATE',precedenceClass:'CHANNEL_COMPOSITION',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-PERSONALITY_DESIGN_GATE',family:'PERSONALITY_GATE_X_DESIGN_GATE',precedenceClass:'GATE_DETAIL',semanticExecutable:false,structuralOnly:true,sourceStatus:'SOURCE_PENDING'}),
  Object.freeze({ruleId:'HD-R3-COMP-DEFINITION_CHANNEL_NETWORK',family:'DEFINITION_X_CHANNEL_NETWORK',precedenceClass:'CHART_LEVEL_COMPOSITION',semanticExecutable:true}),
  Object.freeze({ruleId:'HD-R3-COMP-VARIABLE_CORE',family:'VARIABLE_X_CORE_STRUCTURE',precedenceClass:'ADVANCED_VARIABLE_MODIFIER',semanticExecutable:true})
]);

const TYPE_LABEL={MANIFESTOR:'Manifestor',GENERATOR:'Generator',MANIFESTING_GENERATOR:'Manifesting Generator',PROJECTOR:'Projector',REFLECTOR:'Reflector'};
const AUTH_LABEL={EMOTIONAL:'Emotional Authority',SACRAL:'Sacral Authority',SPLENIC:'Splenic Authority',SELF_PROJECTED:'Self-Projected Authority',EGO_MANIFESTED:'Ego Manifested Authority',EGO_PROJECTED:'Ego Projected Authority',MENTAL_ENVIRONMENTAL:'Mental / Environmental Authority',LUNAR:'Lunar Authority'};
const DEFINITION_LABEL={SINGLE:'Single Definition',SPLIT:'Split Definition',TRIPLE_SPLIT:'Triple Split Definition',QUAD_SPLIT:'Quad Split Definition',NO_DEFINITION:'No Definition'};
const CENTER_LABEL={HEAD:'Head',AJNA:'Ajna',THROAT:'Throat',G:'G',EGO:'Ego / Heart',SPLEEN:'Spleen',SOLAR_PLEXUS:'Solar Plexus',SACRAL:'Sacral',ROOT:'Root'};
const ADV_LABEL={determination:'Determination',cognition:'Cognition',environment:'Environment',perspective:'Perspective',motivation:'Motivation',trajectory:'Trajectory'};
const AUTH_CENTER={EMOTIONAL:'SOLAR_PLEXUS',SACRAL:'SACRAL',SPLENIC:'SPLEEN',SELF_PROJECTED:'G',EGO_MANIFESTED:'EGO',EGO_PROJECTED:'EGO'};

const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex').slice(0,20);
const uniq=arr=>[...new Set((arr||[]).filter(Boolean))];
const sourceRefs=(facts,subjects)=>uniq(subjects.flatMap(s=>facts.sourceRefsBySubject?.[s]||[]));
const zh=(en,zhHans)=>({en,zhHans});

function typeAuthorityMeaning(type,authority){
  const key=`${type}|${authority}`;
  const special={
    'GENERATOR|EMOTIONAL':zh('Generator response describes what is worth engaging with; Emotional Authority describes how final decision clarity forms over time. A response is not the same as a completed decision, especially for meaningful commitments; the two layers operate in sequence rather than collapsing into one signal.','Generator 的回应描述什么值得进入投入；情绪权威描述最终决定如何随时间形成清晰度。出现回应不等于决定已经完成，尤其在重要承诺上，两层需要按各自职责连续工作，而不是被压成同一个即时信号。'),
    'MANIFESTING_GENERATOR|EMOTIONAL':zh('Manifesting Generator response can start an engagement-and-iteration process, while Emotional Authority still owns decision timing. Speed, experimentation, or the ability to change course does not turn an early response into final clarity.','显示生产者的回应可以启动投入与迭代过程，但情绪权威仍然拥有最终决策时序。速度、尝试与调整能力不会把早期回应自动变成最终清晰。'),
    'GENERATOR|SACRAL':zh('For a Generator with confirmed Sacral Authority, the same Sacral system participates in both engagement and immediate decision reference. Even here, a concrete response is different from mental reasoning, social pressure, or proving capacity.','当生产者同时确认荐骨权威时，同一荐骨系统会参与投入与即时决策参照。即使如此，具体回应仍然不同于头脑推理、社会压力或证明自己有能力。'),
    'PROJECTOR|MENTAL_ENVIRONMENTAL':zh('Projector recognition and invitation establish the interaction context; Mental / Environmental Authority uses environment and sounding to hear what remains coherent. Invitation does not decide for the person, and other people are not a voting panel.','投射者的认可与邀请建立互动情境；心智／环境权威通过环境与说出来的过程听见什么仍然一致。邀请本身不替当事人决定，其他人也不是投票委员会。'),
    'PROJECTOR|EGO_PROJECTED':zh('Projector recognition and invitation establish the relational context; Ego Projected Authority asks whether the invitation is genuinely worth the person’s will, value, and commitment. Being recognised is not the same as wanting the commitment.','投射者的认可与邀请建立关系情境；投射型意志权威进一步判断这份邀请是否真正值得自己的意志、价值与承诺。被看见并不等于自己就想承担。'),
    'REFLECTOR|LUNAR':zh('Reflector openness describes how many contexts can be sampled; Lunar Authority describes why significant decisions need time to observe that variation. Sampling more people or places is not itself a decision until a pattern persists across the cycle.','反映者的开放结构描述为什么会采样许多不同情境；月亮权威描述为什么重大决定需要时间观察这些变化。经历更多人或环境本身并不等于已经有决定，重点是哪些模式跨周期仍然保留。'),
    'MANIFESTOR|EGO_MANIFESTED':zh('Manifestor structure supports initiation, while Ego Manifested Authority asks what the will is actually prepared to commit and express. Capacity to initiate does not mean every impulse deserves commitment.','显示者结构支持发起，而显示型意志权威进一步判断意志真正愿意承诺并表达什么。能够发起，不代表每一个冲动都值得投入意志。')
  };
  return special[key]||zh(`${TYPE_LABEL[type]||type} describes how engagement enters the system, while ${AUTH_LABEL[authority]||authority} owns the final decision reference. These layers must be read together without allowing Type to replace Authority or Authority to erase the engagement pattern.`,`${TYPE_LABEL[type]||type} 描述互动如何进入系统；${AUTH_LABEL[authority]||authority} 拥有最终决策参照。两层需要一起读取，但 Type 不能取代 Authority，Authority 也不能抹掉投入方式。`);
}

function makeClaim(facts,rule,subjects,meaning,{clusterId,realityImplicationKey,semanticSupported=true,extra={}}={}){
  const refs=sourceRefs(facts,subjects);
  const sourceReady=refs.length>0;
  const supported=semanticSupported&&rule.semanticExecutable===true&&sourceReady;
  const body={
    claimId:`HD-R3-COMP-${digest({ruleId:rule.ruleId,subjects})}`,
    methodId:'HUMAN_DESIGN_EXTERNAL',claimType:'INTEGRATION',scope:rule.family,subjectRefs:subjects,structureRefs:subjects,
    sourceRefs:refs,semanticOwnerId:`human_design.composition.${rule.family.toLowerCase()}`,compositionRuleId:rule.ruleId,
    compositionClass:rule.family,precedenceClass:rule.precedenceClass,precedenceRank:HD_R3_PRECEDENCE[rule.precedenceClass],semanticClusterId:clusterId||rule.family,
    realityImplicationKey:realityImplicationKey||clusterId||rule.family,customerMeaning:meaning,
    customerBoundary:zh('This composition coordinates admitted layers; it does not create a new calculation fact, diagnosis, fate claim, or mandatory action. Confirmed Authority keeps final decision ownership.','这个组合只协调已 admission 的语义层；它不会创造新的排盘事实、诊断、命运结论或强制行动。最终决定权仍由已确认 Authority 保有。'),
    admissionStatus:sourceReady?'SOURCE_ADMITTED':'SOURCE_PENDING',semanticAdmissionStatus:supported?'SEMANTIC_ADMITTED':'SEMANTIC_REVIEW_PENDING',compositionSupported:supported,
    structuralCompositionSupported:rule.structuralOnly===true||supported,machineVerified:false,humanAccepted:false,customerPublishable:false,version:HD_R3_COMPOSITION_VERSION,...extra
  };
  return Object.freeze(body);
}

export function composeHumanDesignR3(facts={}){
  const claims=[];
  const rule=id=>HD_R3_COMPOSITION_RULES.find(r=>r.ruleId===id);
  const type=facts.type, authority=facts.authority, profile=facts.profile, definition=facts.definition;
  if(type&&authority){const subjects=[`TYPE.${type}`,`AUTHORITY.${authority}`];claims.push(makeClaim(facts,rule('HD-R3-COMP-TYPE_AUTHORITY'),subjects,typeAuthorityMeaning(type,authority),{clusterId:'DECISION_ENGAGEMENT_ARCHITECTURE',realityImplicationKey:'ENGAGEMENT_SIGNAL_IS_NOT_AUTOMATIC_FINAL_DECISION'}));}
  if(type&&profile){const subjects=[`TYPE.${type}`,`PROFILE.${profile.replace('/','_')}`];claims.push(makeClaim(facts,rule('HD-R3-COMP-TYPE_PROFILE'),subjects,zh(`${TYPE_LABEL[type]||type} describes how engagement begins; Profile ${profile} describes the role and learning pattern that becomes visible once engagement is underway. Profile may shape how participation is recognised, but it does not replace Strategy or decide whether the engagement is correct.`,`${TYPE_LABEL[type]||type} 描述投入如何开始；Profile ${profile} 描述投入发生以后会显现的角色与学习模式。Profile 会修饰别人如何看见这份参与，但不能取代 Strategy，也不能单独决定是否应该投入。`),{clusterId:'ENGAGEMENT_ROLE_ARCHITECTURE',realityImplicationKey:'ROLE_EXPECTATION_CAN_MODIFY_ENGAGEMENT_PRESSURE'}));}
  if(authority&&profile){const subjects=[`AUTHORITY.${authority}`,`PROFILE.${profile.replace('/','_')}`];claims.push(makeClaim(facts,rule('HD-R3-COMP-AUTHORITY_PROFILE'),subjects,zh(`${AUTH_LABEL[authority]||authority} owns decision process and timing; Profile ${profile} can add social expectations, projection, experimentation, networking, or role pressure around that decision. The composition asks whether role pressure is rushing or distorting a decision that still belongs to Authority.`,`${AUTH_LABEL[authority]||authority} 拥有决策过程与时序；Profile ${profile} 会在决定周围加入社会期待、投射、试验、人脉或角色压力。组合读取要检查：角色压力是否正在催促或扭曲一个本来仍属于 Authority 的决定。`),{clusterId:'DECISION_ROLE_PRESSURE',realityImplicationKey:'EXTERNAL_ROLE_PRESSURE_CAN_RUSH_DECISION'}));}
  if(profile&&definition){const subjects=[`PROFILE.${profile.replace('/','_')}`,`DEFINITION.${definition}`];claims.push(makeClaim(facts,rule('HD-R3-COMP-PROFILE_DEFINITION'),subjects,zh(`Profile ${profile} describes a recurring interaction-and-learning role, while ${DEFINITION_LABEL[definition]||definition} describes how defined Centers are internally connected. The role can influence how integration is experienced socially, but Definition does not create multiple personalities and Profile does not change the chart topology.`,`Profile ${profile} 描述反复出现的互动与学习角色；${DEFINITION_LABEL[definition]||definition} 描述已定义中心在内部如何连接。角色会影响整合经验在人际中怎样被感受，但 Definition 不代表多重人格，Profile 也不会改变图表拓扑。`),{clusterId:'ROLE_INTEGRATION_ARCHITECTURE',realityImplicationKey:'SOCIAL_ROLE_MODIFIES_INTEGRATION_EXPERIENCE_NOT_TOPOLOGY'}));}
  const authorityCenter=AUTH_CENTER[authority];
  if(authorityCenter&&facts.centers?.defined?.includes(authorityCenter)){
    const subjects=[`AUTHORITY.${authority}`,`CENTER.${authorityCenter}.DEFINED`];
    claims.push(makeClaim(facts,rule('HD-R3-COMP-AUTHORITY_CENTER'),subjects,zh(`${CENTER_LABEL[authorityCenter]||authorityCenter} being defined is structural evidence that supports the confirmed ${AUTH_LABEL[authority]||authority} context. Center consistency describes the operating field; Authority still owns the decision rule, so a Center meaning cannot independently tell the person what to decide.`,`${CENTER_LABEL[authorityCenter]||authorityCenter} 的定义状态可以作为已确认 ${AUTH_LABEL[authority]||authority} 情境的结构证据。Center 的一致性描述运行场域；真正的决策规则仍由 Authority 拥有，因此 Center meaning 不能独立告诉当事人该做什么决定。`),{clusterId:'DECISION_CENTER_EVIDENCE',realityImplicationKey:'CENTER_SUPPORTS_AUTHORITY_BUT_DOES_NOT_REPLACE_IT'}));
  }
  for(const ch of facts.channels||[]){
    const code=ch.channelId||ch.id; if(!code) continue;
    const centers=uniq(ch.centers||[]);
    const gates=uniq(ch.gates||[]);
    if(centers.length>=2&&centers.every(c=>facts.centers?.defined?.includes(c))){
      const subjects=[...centers.map(c=>`CENTER.${c}.DEFINED`),`CHANNEL.${code}`];
      claims.push(makeClaim(facts,rule('HD-R3-COMP-DEFINED_CENTER_CHANNEL'),subjects,zh(`The complete ${code} Channel is more specific than generic meanings of its defined endpoint Centers. The Centers describe stable operating context; the confirmed full Channel becomes the primary semantic owner for the connection between them.`,`完整 ${code} Channel 比两端已定义中心的 generic meaning 更具体。Centers 提供稳定运行背景；已确认的完整 Channel 成为两端连接关系的 primary semantic owner。`),{clusterId:`CHANNEL_${code}_PRIMARY`,realityImplicationKey:`COMPLETE_CHANNEL_${code}_OUTRANKS_GENERIC_CENTER`}));
    }
    if(gates.length){
      const subjects=[`CHANNEL.${code}`,...gates.map(g=>`GATE.${g}`)];
      claims.push(makeClaim(facts,rule('HD-R3-COMP-CHANNEL_GATE'),subjects,zh(`Because ${code} is confirmed as a complete Channel, its component Gates explain why the pattern is present but do not render as parallel primary meanings. Gate detail remains available as evidence or drill-down; the Channel owns the whole-pattern interpretation.`,`因为 ${code} 已确认是完整 Channel，组成 Gates 负责解释为什么这个模式存在，但不能与 Channel 平级成为多个 primary meanings。Gate detail 继续作为证据或细节展开；完整模式由 Channel 主解释。`),{clusterId:`CHANNEL_${code}_PRIMARY`,realityImplicationKey:`CHANNEL_${code}_COMPONENT_GATES_SUPPORT_ONLY`}));
    }
  }
  for(const h of facts.hangingGates||[]){
    if(!h?.center||!h?.gate||!facts.centers?.undefined?.includes(h.center)) continue;
    const subjects=[`CENTER.${h.center}.UNDEFINED`,`GATE.${h.gate}`];
    claims.push(makeClaim(facts,rule('HD-R3-COMP-UNDEFINED_CENTER_HANGING_GATE'),subjects,zh(`${CENTER_LABEL[h.center]||h.center} is non-defined, while Gate ${h.gate} provides a specific confirmed entry point. The reading therefore narrows the variable Center theme through that Gate without inventing its missing harmonic Gate or a full Channel.`,`${CENTER_LABEL[h.center]||h.center} 处于未定义状态，而 Gate ${h.gate} 提供了一个已确认的具体入口。因此读取可以通过这个 Gate 缩小 Center 的可变主题，但不能补造缺失的 harmonic Gate 或完整 Channel。`),{clusterId:`UNDEFINED_${h.center}_GATE_${h.gate}`,realityImplicationKey:`VARIABLE_CENTER_WITH_SPECIFIC_GATE_${h.gate}`}));
  }
  for(const p of facts.personalityDesignPairs||[]){
    if(!p?.personalityGate||!p?.designGate) continue;
    const subjects=[`GATE.${p.personalityGate}.PERSONALITY`,`GATE.${p.designGate}.DESIGN`];
    claims.push(makeClaim(facts,rule('HD-R3-COMP-PERSONALITY_DESIGN_GATE'),subjects,zh('The confirmed chart can preserve the structural relationship between Personality and Design activations, but the admitted W9 Gate source does not provide distinct value-specific Personality-versus-Design meanings. The relationship stays visible as provenance and is not converted into a conscious/unconscious interpretation.','已确认图表可以保留 Personality 与 Design 激活之间的结构关系，但当前 W9 admitted Gate source 没有提供独立的 value-specific Personality／Design meanings。因此这里只保留 provenance，不把它转换成意识／无意识的解释。'),{clusterId:'PERSONALITY_DESIGN_GATE_RELATION',realityImplicationKey:'PERSONALITY_DESIGN_DISTINCT_SEMANTICS_SOURCE_PENDING',semanticSupported:false,extra:{admissionStatus:'SOURCE_PENDING',semanticAdmissionStatus:'SEMANTIC_REVIEW_PENDING',compositionSupported:false,structuralCompositionSupported:true,sourceGap:'W9_PERSONALITY_DESIGN_DISTINCT_GATE_SEMANTICS_SOURCE_PENDING'}}));
  }
  if(definition&&(facts.channels||[]).length){
    const subjects=[`DEFINITION.${definition}`,...(facts.channels||[]).map(ch=>`CHANNEL.${ch.channelId||ch.id}`).filter(x=>!x.endsWith('undefined'))];
    claims.push(makeClaim(facts,rule('HD-R3-COMP-DEFINITION_CHANNEL_NETWORK'),subjects,zh(`${DEFINITION_LABEL[definition]||definition} describes the topology of the defined network; the confirmed complete Channels show which Center-to-Center paths actually build that network. This composition can describe clusters and integration flow without implying defect, dependency, or a need for another person to become complete.`,`${DEFINITION_LABEL[definition]||definition} 描述已定义网络的拓扑；已确认的完整 Channels 显示哪些 Center-to-Center 路径真正构成这个网络。这个组合可以解释 clusters 与 integration flow，但不能暗示缺陷、依赖或“需要另一个人才完整”。`),{clusterId:'WHOLE_CHART_INTEGRATION_NETWORK',realityImplicationKey:'DEFINITION_TOPOLOGY_EXPLAINED_BY_CONFIRMED_CHANNEL_NETWORK'}));
  }
  for(const [field,value] of Object.entries(facts.advanced||{})){
    if(!value||!ADV_LABEL[field]) continue;
    const subject=`ADVANCED.${field.toUpperCase()}.${value}`;
    const coreSubjects=[type?`TYPE.${type}`:null,authority?`AUTHORITY.${authority}`:null,profile?`PROFILE.${profile.replace('/','_')}`:null,definition?`DEFINITION.${definition}`:null].filter(Boolean);
    claims.push(makeClaim(facts,rule('HD-R3-COMP-VARIABLE_CORE'),[subject,...coreSubjects],zh(`${ADV_LABEL[field]} (${value}) is read only as an advanced modifier after the core chart has been established. It may refine observation of preference, attention, environment, or long-range role experience, but it cannot reverse a core finding or create a new decision rule.`,`${ADV_LABEL[field]}（${value}）只在核心图表建立之后作为 advanced modifier 读取。它可以细化偏好、注意、环境或长期角色经验，但不能推翻核心 finding，也不能创造新的决策规则。`),{clusterId:`ADVANCED_${field.toUpperCase()}_MODIFIER`,realityImplicationKey:`ADVANCED_${field.toUpperCase()}_CANNOT_OVERRIDE_CORE`}));
  }
  return Object.freeze({schemaVersion:HD_R3_COMPOSITION_VERSION,claims:Object.freeze(claims),compositionDigest:digest(claims),boundaries:Object.freeze({stringConcatenationAllowed:false,atomicMeaningEqualsComposition:false,authorityKeepsFinalDecision:true,advancedModifierMayOverrideCore:false,r3CustomerPublishable:false})});
}
