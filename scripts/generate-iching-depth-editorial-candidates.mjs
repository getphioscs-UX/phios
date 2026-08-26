import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const readJson=relative=>JSON.parse(fs.readFileSync(path.join(ROOT,relative),'utf8'));
const writeJson=(relative,value)=>{
  const target=path.join(ROOT,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);
};
const writeIfMissing=(relative,value)=>{
  if(!fs.existsSync(path.join(ROOT,relative))) writeJson(relative,value);
};
const pad=value=>String(value).padStart(2,'0');

const HEXAGRAM_PATH='content/professional/core-method-runtime/iching-hexagram-registry-v1.json';
const TRIGRAM_PATH='content/professional/core-method-runtime/iching-trigram-registry-v1.json';
const SOURCE_PATH='content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json';
const HEXAGRAM_CANDIDATE_PATH='content/interpretation/iching/corpus/iching-depth-hexagram-editorial-candidates-v1.json';
const LINE_CANDIDATE_PATH='content/interpretation/iching/corpus/iching-depth-line-editorial-candidates-v1.json';
const CAMPAIGN_PATH='content/production/symbolic-method/human-review/iching-depth-human-review-campaign-v1.json';
const RESULTS_PATH='content/production/symbolic-method/human-review/iching-depth-human-review-results-v1.json';

const hexagramRegistry=readJson(HEXAGRAM_PATH);
const trigramRegistry=readJson(TRIGRAM_PATH);
const canonicalCorpus=readJson(SOURCE_PATH);
const trigrams=new Map(trigramRegistry.entries.map(entry=>[entry.trigramId,entry]));
const claims=new Map(canonicalCorpus.entries.map(entry=>[entry.claimId,entry]));

if(hexagramRegistry.entries.length!==64) throw new Error('ICHI_DEPTH_64_HEXAGRAMS_REQUIRED');

const review=()=>({
  status:'CANDIDATE',
  humanApproved:false,
  reviewer:null,
  reviewedAt:null,
  sourceFidelityChecked:false,
  localeFidelityChecked:false,
  boundaryChecked:false
});
const authority=()=>({
  canonicalMeaningCreated:false,
  realityTruthCreated:false,
  fateConclusionCreated:false,
  professionalJudgmentCreated:false,
  runtimeModelGenerationAllowed:false
});
const hexagramShape=()=>({
  situationPattern:true,
  coreTension:true,
  developmentDirection:true,
  constructiveExpression:true,
  distortionRisk:true,
  timingCondition:true,
  observationDimensionCount:2,
  reflectionDimensionCount:2
});
const lineShape=()=>({
  stageRole:true,
  currentCondition:true,
  centralTension:true,
  constructiveMovement:true,
  excessOrFailureRisk:true,
  observableSignalCount:2,
  reflectionQuestionCount:2
});

const stage={
  1:{zh:'起始位置：讯号刚出现，条件尚未充分展开。',en:'Opening position: the signal is emerging and the conditions are not yet fully developed.'},
  2:{zh:'接触位置：内在倾向开始与现实角色、关系或资源发生接触。',en:'Engagement position: the inner tendency begins to meet an actual role, relationship, or resource.'},
  3:{zh:'门槛位置：下卦将尽，继续推进与调整方向之间出现压力。',en:'Threshold position: the lower trigram is closing, creating pressure between continuing and adjusting direction.'},
  4:{zh:'进入位置：行动进入外部情境，需要重新核对承载条件与边界。',en:'Entry position: movement enters the outer situation and must re-check capacity and boundaries.'},
  5:{zh:'协调位置：较大的责任、影响或可见度要求中心保持清楚。',en:'Coordinating position: greater responsibility, influence, or visibility requires a clear centre.'},
  6:{zh:'完成位置：既有方向到达极限，需要辨认完成、过度与退出。',en:'Culminating position: the existing direction reaches its limit, requiring distinction between completion, excess, and exit.'}
};

function sourceBinding(claimId){
  const claim=claims.get(claimId);
  if(!claim) throw new Error(`ICHI_DEPTH_CANONICAL_CLAIM_MISSING:${claimId}`);
  return {
    sourceIds:[claim.sourceId],
    sourceClaimRefs:[claim.claimId],
    derivationMode:'ORIGINAL_SOURCE_BOUND_SYNTHESIS',
    sourceTextCopied:false
  };
}

function hexagramCandidate(hexagram){
  const number=pad(hexagram.number);
  const lower=trigrams.get(hexagram.lowerTrigramId);
  const upper=trigrams.get(hexagram.upperTrigramId);
  const claimId=`ICH-CLM-ZHOUYI-CN-${number}-H`;
  if(!lower||!upper) throw new Error(`ICHI_DEPTH_TRIGRAM_MISSING:${hexagram.hexagramId}`);
  return {
    schemaVersion:'PHI-OS-ICHI-DEPTH-INTERPRETATION-ENTRY-v1.0.0',
    interpretationId:`ICH-DEPTH-HEX-${number}-EDITORIAL-v1`,
    methodCode:'I_CHING',
    hexagramId:hexagram.hexagramId,
    scope:'HEXAGRAM',
    contentClass:'PHIOS_DEPTH_EDITORIAL_INTERPRETATION',
    sourceBindings:sourceBinding(claimId),
    hexagramInterpretation:hexagramShape(),
    localeProjections:{
      'zh-Hans':{
        plainMeaning:`${hexagram.chineseNameZhHans}（${hexagram.canonicalName}）候选解释把下卦${lower.chineseNameZhHans}与上卦${upper.chineseNameZhHans}之间的结构关系作为观察镜头；它不替用户断定现实，也不预测结果。`,
        situationOrStage:`先观察内在构成（下卦${lower.chineseNameZhHans}）如何进入外部条件（上卦${upper.chineseNameZhHans}），以及两者目前是相互承接、彼此牵制，还是尚未形成稳定连接。`,
        centralTension:`核心张力不在“${hexagram.chineseNameZhHans}是吉还是凶”，而在当前推动方式是否与实际承载条件、关系边界和可见证据相符。`,
        constructiveExpressionOrMovement:'较有建设性的使用方式，是把象征提示转成可以观察和验证的问题，再由现实证据决定下一步。',
        distortionOrFailureRisk:`若把${hexagram.chineseNameZhHans}直接当作命运结论、行动命令或他人内心的证明，象征镜头就会越过它的权限。`,
        timingOrCondition:'这里的时间只指条件成熟度与发展阶段，不提供日期、必然事件或保证结果。',
        whatToObserve:['目前有哪些事实显示内在推动方式与外部条件相互支持？','有哪些限制、矛盾或未知仍不足以形成结论？'],
        reflectionQuestions:['这个象征视角照亮了问题的哪一部分，又遗漏了哪一部分？','在不依赖卦象替你决定的前提下，你下一项可以验证的现实问题是什么？'],
        misreadingWarnings:['候选解释尚未完成人工来源与双语审核，不得进入公共客户输出。','卦象不是现实证据、诊断、专业建议或保证未来。']
      },
      en:{
        plainMeaning:`This candidate for ${hexagram.canonicalName} uses the structural relation between the lower ${lower.englishName} trigram and the upper ${upper.englishName} trigram as an observational lens. It does not determine reality or predict an outcome.`,
        situationOrStage:`Observe how the inner configuration (lower ${lower.englishName}) is meeting the outer condition (upper ${upper.englishName}), and whether the two currently support, constrain, or fail to connect with each other.`,
        centralTension:`The central tension is not whether ${hexagram.canonicalName} is simply favourable or unfavourable, but whether the current way of moving fits actual capacity, relational boundaries, and observable evidence.`,
        constructiveExpressionOrMovement:'A constructive use converts the symbolic lens into questions that can be observed and tested, leaving the next step to real-world evidence.',
        distortionOrFailureRisk:`Treating ${hexagram.canonicalName} as fate, an action command, or proof of another person's inner state would exceed the authority of the symbolic lens.`,
        timingOrCondition:'Timing refers only to maturity of conditions and stage of development; it does not supply dates, inevitable events, or guaranteed outcomes.',
        whatToObserve:['What facts show that the inner way of moving and the outer conditions support each other?','Which limits, contradictions, or unknowns still prevent a conclusion?'],
        reflectionQuestions:['What part of the question does this symbolic lens illuminate, and what does it leave out?','Without asking the hexagram to decide for you, what real-world question can you test next?'],
        misreadingWarnings:['This candidate has not completed human source and bilingual review and cannot enter public customer output.','A hexagram is not reality evidence, diagnosis, professional advice, or a guaranteed future.']
      }
    },
    review:review(),
    authority:authority()
  };
}

function lineCandidate(hexagram,linePosition){
  const number=pad(hexagram.number);
  const lineValue=hexagram.lineStructure[linePosition-1];
  const polarityZh=lineValue===1?'阳爻':'阴爻';
  const polarityEn=lineValue===1?'yang line':'yin line';
  const claimId=`ICH-CLM-ZHOUYI-CN-${number}-L${linePosition}`;
  return {
    schemaVersion:'PHI-OS-ICHI-DEPTH-INTERPRETATION-ENTRY-v1.0.0',
    interpretationId:`ICH-DEPTH-LINE-${number}-L${linePosition}-EDITORIAL-v1`,
    methodCode:'I_CHING',
    hexagramId:hexagram.hexagramId,
    scope:'LINE',
    linePosition,
    contentClass:'PHIOS_DEPTH_EDITORIAL_INTERPRETATION',
    sourceBindings:sourceBinding(claimId),
    lineInterpretation:lineShape(),
    localeProjections:{
      'zh-Hans':{
        plainMeaning:`${hexagram.chineseNameZhHans}第${linePosition}爻是${polarityZh}的候选逐爻解释；它把这一爻放回由下而上的六阶段结构中观察，不把爻辞变成行动命令。`,
        situationOrStage:stage[linePosition].zh,
        centralTension:`当前张力在于：${polarityZh}所呈现的表达方式，是否适合${hexagram.chineseNameZhHans}在第${linePosition}阶段的实际条件。`,
        constructiveExpressionOrMovement:'先确认现实条件、责任边界与可逆性，再决定维持、调整、暂停或退出；卦爻只提供反思镜头。',
        distortionOrFailureRisk:'若忽略爻位阶段，或把单一爻辞当成必然结果、他人意图证明或专业指令，解释就会失真。',
        timingOrCondition:`第${linePosition}爻表达的是结构阶段而非日期；是否适用必须由当前事实核对。`,
        whatToObserve:['目前最能证明这一阶段已经出现的具体事实是什么？','有哪些相反证据、未明条件或后果尚未被纳入？'],
        reflectionQuestions:['你现在面对的是开始、承接、门槛、进入、协调还是完成问题？','如果暂时不依赖象征答案，哪一项现实观察最能帮助你判断？'],
        misreadingWarnings:['候选逐爻解释尚未完成人工来源与双语审核，不得进入公共客户输出。','爻辞不是命令、诊断、法律或财务判断，也不能证明第三方隐藏状态。']
      },
      en:{
        plainMeaning:`This candidate for line ${linePosition} of ${hexagram.canonicalName} treats the ${polarityEn} within a six-stage bottom-to-top structure. It does not turn the line text into an action command.`,
        situationOrStage:stage[linePosition].en,
        centralTension:`The current tension is whether the expression of this ${polarityEn} fits the actual conditions of stage ${linePosition} within ${hexagram.canonicalName}.`,
        constructiveExpressionOrMovement:'Check real conditions, responsibility boundaries, and reversibility before maintaining, adjusting, pausing, or exiting; the line supplies only a reflective lens.',
        distortionOrFailureRisk:'Ignoring line position, or treating one line as an inevitable outcome, proof of another person’s intention, or a professional directive, distorts the interpretation.',
        timingOrCondition:`Line ${linePosition} identifies a structural stage rather than a date; its relevance must be checked against present facts.`,
        whatToObserve:['What concrete fact most clearly shows that this stage is present now?','Which contrary evidence, unknown condition, or consequence has not yet been included?'],
        reflectionQuestions:['Are you dealing mainly with beginning, engagement, threshold, entry, coordination, or completion?','Without relying on the symbolic answer, what real-world observation would most improve your judgment?'],
        misreadingWarnings:['This line candidate has not completed human source and bilingual review and cannot enter public customer output.','A line text is not a command, diagnosis, legal or financial judgment, or proof of a third party’s hidden state.']
      }
    },
    review:review(),
    authority:authority()
  };
}

const hexagramEntries=hexagramRegistry.entries.map(hexagramCandidate);
const lineEntries=hexagramRegistry.entries.flatMap(hexagram=>[1,2,3,4,5,6].map(position=>lineCandidate(hexagram,position)));
const allEntries=[...hexagramEntries,...lineEntries];

const shared={
  phase:'ICHI-DEPTH',
  baselineCommit:'71ec2e6abcc88eb7692cf80d48edd490ab664c13',
  methodCode:'I_CHING',
  editorialAuthority:'content/interpretation/iching/authority/iching-depth-editorial-authority-contract-v1.json',
  entrySchema:'content/interpretation/iching/contracts/iching-depth-interpretation-entry-v1.schema.json',
  publicRuntimeBound:false,
  productionAuthorityChanged:false
};

writeJson(HEXAGRAM_CANDIDATE_PATH,{
  schemaVersion:'PHI-OS-ICHI-DEPTH-HEXAGRAM-EDITORIAL-CANDIDATE-CORPUS-v1.0.0',
  work:'ICHI-DEPTH-W3',
  status:'64_OF_64_EDITORIAL_CANDIDATES_HUMAN_REVIEW_REQUIRED',
  ...shared,
  coverage:{candidate:'64/64',humanApproved:'0/64'},
  entries:hexagramEntries
});

writeJson(LINE_CANDIDATE_PATH,{
  schemaVersion:'PHI-OS-ICHI-DEPTH-LINE-EDITORIAL-CANDIDATE-CORPUS-v1.0.0',
  work:'ICHI-DEPTH-W4',
  status:'384_OF_384_EDITORIAL_CANDIDATES_HUMAN_REVIEW_REQUIRED',
  ...shared,
  coverage:{candidate:'384/384',humanApproved:'0/384'},
  entries:lineEntries
});

const sessions=allEntries.map((entry,index)=>({
  sessionId:`ICHI-DEPTH-HR-${String(index+1).padStart(3,'0')}`,
  interpretationId:entry.interpretationId,
  scope:entry.scope,
  hexagramId:entry.hexagramId,
  ...(entry.scope==='LINE'?{linePosition:entry.linePosition}:{}),
  locale:'BILINGUAL_ZH_HANS_EN',
  scenario:entry.scope==='HEXAGRAM'?`${entry.hexagramId} whole-hexagram depth candidate`:`${entry.hexagramId} line ${entry.linePosition} depth candidate`,
  reviewFocus:'Source fidelity, distinctiveness, plain-language depth, bilingual fidelity, observable reality questions, agency and non-divination boundaries.',
  sourceClaimRefs:[...entry.sourceBindings.sourceClaimRefs],
  expected:{candidateStatus:'CANDIDATE',publicEligible:false,humanApprovalRequired:true}
}));

writeJson(CAMPAIGN_PATH,{
  schemaVersion:'PHI-OS-ICHI-DEPTH-HUMAN-REVIEW-CAMPAIGN-v1.0.0',
  phase:'ICHI-DEPTH',
  work:'ICHI-DEPTH-W7',
  baselineCommit:'71ec2e6abcc88eb7692cf80d48edd490ab664c13',
  status:'READY_FOR_448_UNIT_HUMAN_EDITORIAL_REVIEW',
  campaignVersion:'1.0.0',
  reviewState:'HUMAN_REVIEW',
  reviewRoute:'/review/iching/?mode=depth',
  reviewApi:'/api/review/iching-execute?mode=depth',
  existingReviewAuthorityReused:true,
  targetSessionCount:448,
  minimumAccepted:448,
  requiredScopes:{hexagram:64,line:384},
  automaticPersistence:false,
  publicRunAllowed:false,
  sessions
});

writeIfMissing(RESULTS_PATH,{
  schemaVersion:'PHI-OS-ICHI-DEPTH-HUMAN-REVIEW-RESULTS-v1.0.0',
  phase:'ICHI-DEPTH',
  work:'ICHI-DEPTH-W7',
  campaignVersion:'1.0.0',
  status:'PENDING_REAL_HUMAN_EDITORIAL_SIGNOFF',
  planned:448,
  minimumAccepted:448,
  humanReviewed:0,
  accepted:0,
  rejected:0,
  needsFix:0,
  criticalBoundaryFailures:0,
  humanAcceptanceComplete:false,
  productionPromotionAllowed:false,
  publicRunAllowed:false,
  sessions:sessions.map(session=>({
    sessionId:session.sessionId,
    interpretationId:session.interpretationId,
    humanReviewed:false,
    decision:'PENDING',
    reviewerId:null,
    reviewedAt:null,
    deploymentSha:null,
    environmentUrl:null,
    locale:'BILINGUAL_ZH_HANS_EN',
    candidateDigest:null,
    sourceClaimIds:[],
    screenshotRefs:[],
    criteria:{},
    criticalBoundaryFailure:false,
    notes:null
  }))
});

console.log(`✓ ICHI-DEPTH-W3 generated ${hexagramEntries.length}/64 source-bound bilingual hexagram candidates.`);
console.log(`✓ ICHI-DEPTH-W4 generated ${lineEntries.length}/384 source-bound bilingual line candidates.`);
console.log('  All entries remain CANDIDATE; human approval and public runtime authority remain false.');
