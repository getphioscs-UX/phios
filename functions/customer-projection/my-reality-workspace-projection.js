import {boundary,clean,deepFreeze,list,localeOf,text} from './projection-common.js';

const itemText=item=>clean(typeof item==='string'?item:item?.content||item?.summary||item?.statement||item?.label||item?.title);
const sectionLane=(sections,tokens)=>list(sections).filter(section=>tokens.some(token=>clean(section?.id).toUpperCase().includes(token))).map(section=>itemText(section)).filter(Boolean);
const unmatchedSections=(sections,matchedTokens)=>list(sections).filter(section=>!matchedTokens.some(token=>clean(section?.id).toUpperCase().includes(token))).map(section=>deepFreeze({id:clean(section?.id)||null,label:clean(section?.label)||null,content:itemText(section)||null})).filter(section=>section.label||section.content);

export function projectMyRealityWorkspace({reality={},readout={},navigation={},continuity={},reports=[],locale='en'}={}){
  const lang=localeOf(locale);
  const current=reality?.currentReality&&typeof reality.currentReality==='object'?reality.currentReality:{};
  const perspectives=list(reality?.perspectives?.items);
  const readoutSections=list(readout?.sections);
  const patternTokens=['PATTERN'];
  const tensionTokens=['TENSION'];
  const dependencyTokens=['DEPEND'];
  const standoutTokens=['OVERVIEW','SUMMARY','STANDOUT','HIGHLIGHT'];
  const matchedTokens=[...patternTokens,...tensionTokens,...dependencyTokens,...standoutTokens];
  const confirmedActions=list(navigation?.confirmedActions);
  const reportItems=list(reports).filter(Boolean);
  const stage=clean(continuity?.stage||reality?.continuation?.stage)||null;
  const nextStages=list(continuity?.nextStages||reality?.continuation?.nextStages).map(clean).filter(Boolean);
  const navigationOptions=list(navigation?.options);
  const currentSituation=list(current.reportedContext);
  const importantFacts=list(current.importantFacts);
  const constraints=list(current.constraints);
  const openQuestions=list(current.openQuestions);
  const evidence=list(current.externalEvidence);
  const findings=list(current.findings);
  const calculations=list(current.calculations);
  const unknowns=list(current.unknown);
  const establishedMaterial=[...importantFacts,...evidence,...findings,...calculations];
  return deepFreeze({
    schemaVersion:'PHI-OS-CX-R10-MY-REALITY-WORKSPACE-v2.0.0',
    surface:'MY_REALITY',
    locale:lang,
    state:clean(reality?.state)||'EMPTY',
    header:{title:text(lang,'My Reality','我的现实'),subtitle:text(lang,'One workspace for what is happening, what you are considering, and what changes next.','把正在发生的现实、你正在考虑的方向，以及之后发生的变化放在同一个工作区。')},
    contextSummary:{
      whatIsHappeningNow:clean(reality?.overview?.summary)||null,
      whatHasBeenEstablished:establishedMaterial,
      whatRemainsUnknown:unknowns,
      currentStage:stage,
      possibleNextDirections:navigationOptions,
      nextStages
    },
    currentReality:{currentSituation,importantFacts,constraints,openQuestions,evidence,findings,calculations,unknowns,financialState:current.financialState||null},
    perspectives:{items:perspectives,empty:perspectives.length===0},
    reading:{
      state:clean(readout?.state)||'UNKNOWN',
      whatStandsOut:[clean(readout?.summary),...sectionLane(readoutSections,standoutTokens)].filter(Boolean),
      patterns:sectionLane(readoutSections,patternTokens),
      tensions:sectionLane(readoutSections,tensionTokens),
      dependencies:sectionLane(readoutSections,dependencyTokens),
      other:unmatchedSections(readoutSections,matchedTokens),
      unknowns:list(readout?.unknown),
      sources:list(readout?.sources)
    },
    navigation:{
      state:clean(navigation?.state)||'NOT_ESTABLISHED',
      currentPosition:clean(navigation?.currentPosition)||null,
      possibleDirections:navigationOptions,
      selectedId:clean(navigation?.selectedId)||null,
      systemSelected:false
    },
    actions:{items:confirmedActions,automaticActionCreated:false},
    observe:{sessionOnly:true,persisted:false,fields:['WHAT_HAPPENED','NEW_EVIDENCE','CHANGE']},
    review:{
      state:clean(continuity?.review?.state)||'NOT_ESTABLISHED',
      summary:clean(continuity?.review?.summary)||null,
      previous:clean(continuity?.review?.previous)||null,
      current:clean(continuity?.review?.current)||null,
      whatChanged:clean(continuity?.review?.whatChanged)||null,
      whatRemains:clean(continuity?.review?.whatRemains)||null
    },
    history:{items:list(continuity?.history)},
    reports:{items:reportItems},
    sideContext:{knowledge:list(reality?.knowledge?.items),evidenceCount:evidence.length,unknownCount:unknowns.length},
    continuity:{
      state:clean(continuity?.state)||'NOT_ESTABLISHED',
      stage,
      nextStages,
      available:continuity?.continuation?.available===true,
      href:continuity?.continuation?.href||null,
      nextReviewAt:continuity?.continuation?.nextReviewAt||null,
      requiresExplicitConsent:continuity?.continuation?.requiresExplicitConsent!==false
    },
    governance:{
      workspaceCompositionOnly:true,
      runtimeAuthorityCreated:false,
      realityTruthCreated:false,
      navigationChoiceCreated:false,
      actionChoiceCreated:false,
      observationPersisted:false,
      journeyActivated:false,
      reportAuthorityCreated:false,
      unknownPreserved:true,
      ...boundary()
    }
  });
}
