/*
 * PHI OS Rule Reconstruction Engine
 * Version: 1.0.0
 *
 * This module performs deterministic (rule-first) reconstruction.
 * It does NOT call OpenAI.
 *
 * Input:
 *   Runtime Entry
 *
 * Output:
 *   Reconstruction object used by:
 *     - Reality Reconstruction
 *     - Reality Reading
 *     - Navigation
 */
import { SCHEMA_IDS } from '../shared/schema-registry.js';
import {
  GRAMMAR_REGISTRY,
  FORMATION_ARCS,
  createGrammarState,
  GRAMMAR_STATUS
} from "../formation/grammar-registry.js";

const text = v => typeof v === "string" ? v.trim() : "";
const arr = v => Array.isArray(v) ? v : [];

const COORDINATE_REGISTRY = Object.freeze([
  {
    label: 'DNA',
    zh: 'DNA',
    words: ['dna', 'gene', 'genetic', '基因', '遗传']
  },
  {
    label: 'Nervous System',
    zh: '神经系统',
    words: [
      'nervous system', 'neurological', 'nerve', 'heart racing', 'panic',
      '神经系统', '神经', '心跳', '惊慌'
    ]
  },
  {
    label: 'Circadian Rhythm',
    zh: '昼夜节律',
    words: [
      'sleep', 'sleep quality', 'poor sleep', 'insomnia', 'wake', 'circadian',
      '睡眠', '睡不好', '睡不着', '失眠', '作息', '昼夜'
    ]
  },
  {
    label: 'Hormone System',
    zh: '荷尔蒙系统',
    words: ['hormone', 'hormonal', 'pregnant', 'pregnancy', 'menstrual', '荷尔蒙', '激素', '怀孕', '月经']
  },
  {
    label: 'Body Structure',
    zh: '身体结构',
    words: [
      'body', 'pain', 'mobility', 'physical', 'fatigue', 'appetite', 'breathing', 'stomach',
      '身体', '疼痛', '活动能力', '生理', '疲劳', '乏力', '食欲', '呼吸', '胃'
    ]
  },
  {
    label: 'Perception System',
    zh: '感知系统',
    words: ['perception', 'sensory', 'vision', 'hearing', 'smell', '感知', '视觉', '听觉', '嗅觉']
  }
]);

const CONSCIOUS_STAGE_REGISTRY = Object.freeze({
  C1: { label: 'Carrier Runtime Style', zh: '载体运行方式' },
  C2: { label: 'Experience Style', zh: '经验方式' },
  C3: { label: 'Expression Style', zh: '表达方式' },
  C4: { label: 'Agency Style', zh: '行动主体方式' },
  C5: { label: 'Identity Style', zh: '身份方式' }
});

const INQUIRY_REGISTRY = Object.freeze([
  {
    target: 'carrier_coordinates',
    label: ['Carrier coordinates', '载体坐标'],
    question: [
      'After this change began, what observable changes appeared in your body, sleep, energy, senses, or physical rhythms? If none or uncertain, say so directly.',
      '这段变化开始后，你的身体、睡眠、精力、感官或生理节律出现了哪些可观察的变化？如果没有或不确定，也请直接说明。'
    ]
  },
  {
    target: 'carrier_signatures',
    label: ['Carrier signatures', '载体签名'],
    question: [
      'When does this pattern become most visible? Describe any recurring timing, resource pressure, relationship interaction, or environmental condition.',
      '这种模式通常在什么情况下最明显？请说明反复出现的时间规律、资源压力、关系互动或环境条件。'
    ]
  },
  {
    target: 'experience_style',
    label: ['Experience style', '经验方式'],
    question: [
      'When you experience this Reality, what is the most immediate feeling, emotion, or inner tension?',
      '当你经历这个现实时，最直接的感受、情绪或内在张力是什么？'
    ]
  },
  {
    target: 'expression_style',
    label: ['Expression style', '表达方式'],
    question: [
      'How does this Reality show up in what you say, do not say, communicate, or withdraw from?',
      '这个现实会如何出现在你的表达中——包括你说出的、没有说出的、沟通的或回避的部分？'
    ]
  },
  {
    target: 'agency_style',
    label: ['Agency style', '行动方式'],
    question: [
      'What do you repeatedly start, stop, choose, delay, avoid, or protect because of this Reality?',
      '因为这个现实，你会反复开始、停止、选择、拖延、回避或保护什么？'
    ]
  },
  {
    target: 'identity_style',
    label: ['Identity style', '身份方式'],
    question: [
      'Has this Reality changed how you describe your role, responsibility, belonging, or who you believe you must be?',
      '这个现实是否改变了你对自身角色、责任、归属，或“自己必须成为什么样的人”的描述？'
    ]
  }
]);

function contains(source, words){
  const s = text(source).toLowerCase();
  return words.some(w=>s.includes(w.toLowerCase()));
}

function activate(states, code, confidence, summary){
  states.push(createGrammarState(code,{
    status: confidence>=0.75
      ? GRAMMAR_STATUS.ACTIVE
      : GRAMMAR_STATUS.PROVISIONAL,
    confidence,
    summary
  }));
}

function normalizeLanguage(value){
  const language = text(value).toLowerCase();
  return language === 'zh' || language === 'zh-hans' || language.startsWith('zh-')
    ? 'zh-Hans'
    : 'en';
}

function copy(language, en, zh){
  return language === 'zh-Hans' ? zh : en;
}

function itemText(value){
  if(typeof value === 'string') return text(value);
  if(!value || typeof value !== 'object') return '';
  return text(
    value.statement ||
    value.summary ||
    value.question ||
    value.sourceText ||
    value.evidenceNeed ||
    value.domain ||
    value.source ||
    ''
  );
}

function uniqueText(values){
  const seen = new Set();
  return values.map(itemText).filter(value=>{
    const key = value.toLowerCase();
    if(!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clip(value, maximum = 220){
  const source = text(value);
  return source.length > maximum
    ? `${source.slice(0, maximum - 1)}…`
    : source;
}

function firstMatching(sources, words){
  return sources.find(source=>contains(source, words)) || '';
}

function reconstructionEvidence(runtimeEntry){
  return arr(runtimeEntry?.reconstructionEvidence)
    .filter(item=>item && typeof item === 'object' && text(item.target) && text(item.statement));
}

function answerFor(runtimeEntry, target){
  return reconstructionEvidence(runtimeEntry)
    .filter(item=>text(item.target) === target)
    .map(item=>text(item.statement))
    .at(-1) || '';
}

function isSubstantiveAnswer(value){
  const normalized = text(value).toLowerCase();
  if(!normalized) return false;
  return ![
    '没有', '无', '不知道', '不清楚', '不确定', 'none', 'no',
    'nothing', 'unknown', 'uncertain', 'not sure'
  ].includes(normalized);
}

function runtimeMaterial(runtimeEntry){
  const boundary = runtimeEntry?.evidenceBoundary || {};
  const observed = uniqueText([
    ...arr(runtimeEntry?.entryEvidence),
    ...arr(runtimeEntry?.knownReality),
    ...arr(boundary.observedEvidence)
  ]);
  const reported = uniqueText([
    runtimeEntry?.realityChange?.rawStatement,
    runtimeEntry?.realityChange?.normalizedStatement,
    ...arr(boundary.reportedExperience),
    ...reconstructionEvidence(runtimeEntry),
    runtimeEntry?.emergingTension?.summary
  ]);
  const interpreted = uniqueText([
    ...arr(boundary.interpretation),
    runtimeEntry?.userInterpretation?.summary
  ]);
  const context = uniqueText([
    runtimeEntry?.initialContext?.summary,
    ...arr(runtimeEntry?.initialContext?.relevantConditions)
  ]);

  return {
    observed,
    reported,
    interpreted,
    context,
    all: uniqueText([...observed, ...reported, ...interpreted, ...context])
  };
}

function unknownSignal(label, language, kind = 'carrier'){
  return {
    label,
    status: 'not_established',
    confidence: 0,
    evidenceClass: 'unknown_reality',
    summary: copy(
      language,
      kind === 'conscious'
        ? 'The current Entry does not yet establish this Conscious Runtime stage.'
        : 'No direct supporting material has been supplied for this carrier signal.',
      kind === 'conscious'
        ? '当前现实入口尚未建立这一意识运行阶段。'
        : '当前尚未提供可直接支持这一载体信号的资料。'
    )
  };
}

function reportedSignal({label, zhLabel, evidence, language, confidence = 0.56, kind = 'carrier'}){
  if(!text(evidence)) return unknownSignal(label, language, kind);

  return {
    label,
    status: 'provisional',
    confidence,
    evidenceClass: 'reported_experience',
    sourceText: text(evidence),
    summary: copy(
      language,
      kind === 'conscious'
        ? `The Entry contains material associated with ${label}: “${clip(evidence)}”. The pattern remains provisional.`
        : `The user reported material associated with ${label}: “${clip(evidence)}”. This is a provisional carrier signal, not a medical conclusion.`,
      kind === 'conscious'
        ? `现实入口中出现了与${zhLabel}有关的资料：「${clip(evidence)}」。该模式仍属暂定。`
        : `用户报告了与${zhLabel}有关的资料：「${clip(evidence)}」。这只是暂定的载体信号，不构成医学结论。`
    )
  };
}

function domainLabel(value, language){
  const labels = {
    financial: ['Financial', '财务'],
    work: ['Work', '工作'],
    relationship: ['Relationship', '关系'],
    health: ['Health', '健康'],
    'role / identity': ['Role / Identity', '角色／身份'],
    environment: ['Environment', '环境']
  };
  const source = text(value);
  const found = labels[source.toLowerCase()];
  return found ? found[language === 'zh-Hans' ? 1 : 0] : source;
}

function createCarrier(runtimeEntry, material, language){
  const coordinateAnswer = answerFor(runtimeEntry, 'carrier_coordinates');
  const coordinateSources = isSubstantiveAnswer(coordinateAnswer)
    ? [coordinateAnswer]
    : [];
  const initializationCoordinates = COORDINATE_REGISTRY.map(coordinate=>{
    const evidence = firstMatching(coordinateSources, coordinate.words);
    return reportedSignal({
      label: coordinate.label,
      zhLabel: coordinate.zh,
      evidence,
      language,
      confidence: 0.58
    });
  });

  const directSignatureEvidence = answerFor(runtimeEntry, 'carrier_signatures');
  const relationalEvidence = firstMatching([directSignatureEvidence], [
    'relationship', 'partner', 'husband', 'wife', 'family', 'team',
    '关系', '伴侣', '丈夫', '妻子', '家庭', '团队'
  ]);
  const resourceEvidence = firstMatching([directSignatureEvidence], [
    'money', 'income', 'salary', 'saving', 'spend', 'resource', 'business', 'work',
    '钱', '收入', '薪水', '储蓄', '花钱', '资源', '生意', '工作'
  ]);
  const directionalEvidence = text(runtimeEntry?.desiredTransition);
  const temporalEvidence =
    runtimeEntry?.timing?.normalizedTiming ||
    runtimeEntry?.timing?.statedTiming ||
    '';
  const signatureInputs = [
    ['Structural Signature', '结构签名', isSubstantiveAnswer(directSignatureEvidence) ? directSignatureEvidence : '', 0.62, 'reported_experience'],
    ['Navigational Signature', '导航签名', '', 0, 'unknown_reality'],
    ['Relational Signature', '关系签名', relationalEvidence, 0.56, 'reported_experience'],
    ['Resource Signature', '资源签名', resourceEvidence, 0.6, 'reported_experience'],
    ['Directional Signature', '方向签名', directionalEvidence, 0.54, 'reported_experience'],
    ['Temporal Signature', '时间签名', temporalEvidence, 0.64, 'reported_experience']
  ];

  const carrierSignatures = signatureInputs.map(([
    label,
    zhLabel,
    evidence,
    confidence,
    evidenceClass
  ])=>{
    const signal = reportedSignal({
      label,
      zhLabel,
      evidence,
      language,
      confidence
    });
    return evidence ? {...signal, evidenceClass} : signal;
  });

  return {initializationCoordinates, carrierSignatures};
}

function createConscious(runtimeEntry, material, carrier, language){
  const coordinateEvidence = carrier.initializationCoordinates
    .find(item=>item.status === 'provisional')?.sourceText || '';
  const experienceEvidence = uniqueText(
    arr(runtimeEntry?.evidenceBoundary?.reportedExperience)
  ).at(-1) || material.reported.at(-1) || '';
  const expressionEvidence = firstMatching(material.all, [
    'say', 'said', 'express', 'communicate', 'argue', 'social', 'withdraw',
    '说', '表达', '沟通', '争吵', '社交', '退缩', '回避'
  ]);
  const agencyEvidence = firstMatching(material.observed, [
    'started', 'stopped', 'left', 'quit', 'avoid', 'save', 'spend', 'choose',
    '开始', '停止', '离开', '离职', '避免', '储蓄', '花钱', '选择'
  ]);
  const identityEvidence = firstMatching(material.all, [
    'identity', 'role', 'position', 'responsibility', 'belong',
    '身份', '角色', '位置', '责任', '归属'
  ]);
  const evidenceByStage = {
    C1: coordinateEvidence,
    C2: isSubstantiveAnswer(answerFor(runtimeEntry, 'experience_style'))
      ? answerFor(runtimeEntry, 'experience_style')
      : experienceEvidence,
    C3: isSubstantiveAnswer(answerFor(runtimeEntry, 'expression_style'))
      ? answerFor(runtimeEntry, 'expression_style')
      : expressionEvidence,
    C4: isSubstantiveAnswer(answerFor(runtimeEntry, 'agency_style'))
      ? answerFor(runtimeEntry, 'agency_style')
      : agencyEvidence,
    C5: isSubstantiveAnswer(answerFor(runtimeEntry, 'identity_style'))
      ? answerFor(runtimeEntry, 'identity_style')
      : identityEvidence
  };

  const stages = Object.entries(CONSCIOUS_STAGE_REGISTRY).map(([code, stage])=>({
    code,
    ...reportedSignal({
      label: stage.label,
      zhLabel: stage.zh,
      evidence: evidenceByStage[code],
      language,
      confidence: code === 'C2' ? 0.62 : 0.52,
      kind: 'conscious'
    })
  }));

  return {stages};
}

function createInquiry(runtimeEntry, language){
  const answers = reconstructionEvidence(runtimeEntry);
  const answeredTargets = new Set(answers.map(item=>text(item.target)));
  const remaining = INQUIRY_REGISTRY.filter(item=>!answeredTargets.has(item.target));
  const current = remaining[0] || null;
  const languageIndex = language === 'zh-Hans' ? 1 : 0;

  return {
    schemaVersion: 'phi-os.reconstruction-inquiry.v1',
    status: current ? 'collecting' : 'complete',
    complete: !current,
    answeredCount: answeredTargets.size,
    totalTargets: INQUIRY_REGISTRY.length,
    currentTarget: current?.target || 'none',
    currentLabel: current?.label?.[languageIndex] || '',
    currentQuestion: current?.question?.[languageIndex] || '',
    remainingTargets: remaining.map(item=>item.target),
    answers
  };
}

export function reconstructRuntime(runtimeEntry, options = {}){

  const language = normalizeLanguage(
    options.language || runtimeEntry?.entrySource?.language
  );

  const grammarStates=[];

  const material = runtimeMaterial(runtimeEntry);

  const corpus=[
    runtimeEntry?.realityChange?.rawStatement,
    runtimeEntry?.realityChange?.normalizedStatement,
    runtimeEntry?.emergingTension?.summary,
    runtimeEntry?.userInterpretation?.summary,
    runtimeEntry?.initialContext?.summary,
    ...arr(runtimeEntry?.entryEvidence).map(e=>e.statement||""),
    ...reconstructionEvidence(runtimeEntry).map(e=>e.statement||"")
  ].join(" ");

  activate(grammarStates,"G1",0.95,copy(language,"A detectable Reality difference exists.","已经识别到可以观察的现实差异。"));

  if(contains(corpus,[
    "fear","pressure","conflict","constraint",
    "害怕","压力","冲突"
  ])){
    activate(grammarStates,"G2",0.84,
      copy(language,"Constraint signals detected.","已经识别到约束信号。"));
  }

  if(arr(runtimeEntry?.affectedDomains).length){
    activate(grammarStates,"G3",0.72,
      copy(language,"Multiple Runtime structures involved.","当前变化涉及多个运行结构。"));
    activate(grammarStates,"G4",0.68,
      copy(language,"Contextual field detected.","已经识别到相关现实场域。"));
  }

  if(runtimeEntry?.timing){
    activate(grammarStates,"G5",0.82,
      copy(language,"Activation timing identified.","已经识别到变化开始显现的时间。"));
  }

  if(contains(corpus,[
    "body","sleep","energy","身体","睡眠","精力"
  ])){
    activate(grammarStates,"G6",0.63,
      copy(language,"Carrier evidence reported.","用户报告了与载体有关的证据。"));
  }

  activate(grammarStates,"G7",0.60,
    copy(language,"Runtime sequence emerging.","运行顺序正在形成。"));

  if(text(runtimeEntry?.emergingTension?.summary)){
    activate(grammarStates,"G8",0.81,
      copy(language,"Experience layer visible.","经验层已经开始显现。"));
  }

  if(text(runtimeEntry?.userInterpretation?.summary)){
    activate(grammarStates,"G9",0.76,
      copy(language,"Compression into meaning detected.","已经识别到经验被压缩为意义。"));
  }

  if(contains(corpus,[
    "started","stopped","quit",
    "开始","停止","离职"
  ])){
    activate(grammarStates,"G10",0.70,
      copy(language,"Behavioural transition reported.","用户报告了行为层面的转变。"));
  }

  if(
    arr(runtimeEntry?.entryEvidence).length +
    reconstructionEvidence(runtimeEntry).length > 1
  ){
    activate(grammarStates,"G11",0.58,
      copy(language,"Feedback relationship possible.","目前可能存在反馈关系。"));
  }

  if(contains(corpus,[
    "continue","still","长期","持续"
  ])){
    activate(grammarStates,"G12",0.66,
      copy(language,"Settlement detected.","已经识别到沉降状态。"));
    activate(grammarStates,"G15",0.55,
      copy(language,"Continuity candidate.","已经出现可能持续的运行模式。"));
  }

  if(contains(corpus,[
    "new","transition","重新","改变"
  ])){
    activate(grammarStates,"G13",0.60,
      copy(language,"Reconfiguration candidate.","已经出现重新配置的迹象。"));
    activate(grammarStates,"G14",0.55,
      copy(language,"Emergence candidate.","已经出现新状态涌现的迹象。"));
  }

  const arcScores={};

  Object.values(FORMATION_ARCS).forEach(arc=>{
    let total=0;
    arc.grammars.forEach(code=>{
      const g=grammarStates.find(x=>x.code===code);
      if(g) total+=g.confidence;
    });
    arcScores[arc.id]=Number(total.toFixed(2));
  });

  const primaryArc=Object.entries(arcScores)
    .sort((a,b)=>b[1]-a[1])[0][0];

  const carrier = createCarrier(runtimeEntry, material, language);
  const conscious = createConscious(
    runtimeEntry,
    material,
    carrier,
    language
  );
  const inquiry = createInquiry(runtimeEntry, language);
  const grammarMaturity = Math.min(1, grammarStates.length/15);
  const inquiryMaturity = inquiry.answeredCount/inquiry.totalTargets;

  return {
    schemaVersion: SCHEMA_IDS.RECONSTRUCTION,
    reconstructionMethod:"rule_first",
    language,
    primaryArc,
    arcScores,
    grammarStates,
    carrier,
    conscious,
    inquiry,

    maturityScore:Number(
      Math.min(
        1,
        grammarMaturity * 0.7 +
        inquiryMaturity * 0.3
      ).toFixed(2)
    ),

    evidenceBoundary:{
      observedEvidence:uniqueText([
        ...arr(runtimeEntry?.knownReality),
        ...arr(runtimeEntry?.evidenceBoundary?.observedEvidence)
      ]),
      reportedExperience:uniqueText([
        ...arr(runtimeEntry?.evidenceBoundary?.reportedExperience),
        runtimeEntry?.emergingTension
      ]),
      interpretation:uniqueText([
        ...arr(runtimeEntry?.evidenceBoundary?.interpretation),
        runtimeEntry?.userInterpretation
      ]),
      counterEvidence:uniqueText([
        ...arr(runtimeEntry?.counterEvidence),
        ...arr(runtimeEntry?.evidenceBoundary?.counterEvidence)
      ]),
      dependencies:arr(runtimeEntry?.dependencies).length
        ? arr(runtimeEntry.dependencies)
        : arr(runtimeEntry?.evidenceBoundary?.dependencies),
      unknownReality:uniqueText([
        ...arr(runtimeEntry?.unknownReality),
        ...arr(runtimeEntry?.evidenceBoundary?.unknownReality)
      ])
    },

    dependency: {
      summary: uniqueText(
        (arr(runtimeEntry?.dependencies).length
          ? runtimeEntry.dependencies
          : arr(runtimeEntry?.evidenceBoundary?.dependencies))
      ).join(language === 'zh-Hans' ? '；' : '; '),
      status: (arr(runtimeEntry?.dependencies).length ||
        arr(runtimeEntry?.evidenceBoundary?.dependencies).length)
        ? 'reported'
        : 'unclear'
    },

    nextStage:{
      stage:"reality_reading",
      ready:
        grammarStates.length>=5 && inquiry.complete,
      reason:
        grammarStates.length>=5 && inquiry.complete
        ? copy(language,"Enough Runtime structure has been reconstructed.","已经重建出足够的运行结构，可以进入现实读取。")
        : inquiry.complete
          ? copy(language,"More formation evidence is required before reading.","进入现实读取之前，仍需要补充形成证据。")
          : copy(language,"Answer the remaining Reconstruction questions before Reality Reading.","进入现实读取前，请先完成剩余的现实重建问题。")
    }
  };
}

export default reconstructRuntime;
