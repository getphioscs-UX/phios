import {CX_PROJECTION_VERSION,boundary,clean,customerEmpty,deepFreeze,list,localeOf,object,safeUrl,sourceLineage,text,upstreamState} from './projection-common.js';
const statements=items=>list(items).map(item=>typeof item==='string'?clean(item):clean(item?.statement||item?.summary||item?.label)).filter(Boolean);
export function projectRealityForCustomer({bundle=null,reading=null,navigation=null,journey=null,reports=null,account=null,locale='en'}={}){
  const lang=localeOf(locale), b=object(bundle), lanes=object(b.lanes), nav=object(navigation), j=object(journey), a=object(account);
  const perspectiveReferences=list(lanes.perspectiveReferences).map(item=>deepFreeze({projectionId:clean(item?.projectionId)||null,label:clean(item?.methodLabel)||text(lang,'Perspective','视角'),realityFact:item?.realityFact===true}));
  const externalEvidence=list(lanes.externalEvidence).map(item=>deepFreeze({sourceId:clean(item?.sourceId)||null,statement:clean(item?.statement),sourceUrl:safeUrl(item?.sourceUrl),authorityClass:clean(item?.authorityClass)||null})).filter(x=>x.statement);
  const knowledgeReferences=list(lanes.knowledgeReferences).map(item=>deepFreeze({refId:clean(item?.refId)||null,title:clean(item?.title)||text(lang,'Knowledge reference','知识参考'),href:safeUrl(item?.href),realityFact:item?.realityFact===true}));
  const findings=list(lanes.findings).map(item=>deepFreeze({findingCode:clean(item?.findingCode)||null,summary:clean(item?.summary),recommendation:item?.recommendation===true})).filter(x=>x.summary||x.findingCode);
  const calculations=list(lanes.calculations).map(item=>deepFreeze({code:clean(item?.code),value:item?.value??null,unit:clean(item?.unit)||null,professionalJudgment:item?.professionalJudgment===true})).filter(x=>x.code);
  const reportItems=list(reports?.items||reports).map(item=>deepFreeze({id:clean(item?.reportId||item?.id)||null,label:clean(item?.title||item?.label)||text(lang,'Report','报告'),href:safeUrl(item?.href),state:clean(item?.state)||null}));
  const actions=list(nav?.actions||nav?.options).map(item=>deepFreeze({id:clean(item?.id||item?.actionId)||null,label:clean(item?.label||item?.title||item?.statement),state:clean(item?.state)||null})).filter(x=>x.label);
  const history=list(j?.history||j?.events||a?.history).map(item=>deepFreeze({label:clean(item?.label||item?.title||item?.type),occurredAt:clean(item?.occurredAt||item?.createdAt)||null,state:clean(item?.state)||null})).filter(x=>x.label);
  const readingProjection=reading&&typeof reading==='object'?deepFreeze({state:upstreamState(reading.state||reading.status),summary:clean(reading.summary||reading.directAnswer||reading.title)||null,unknown:statements(reading.unknown||reading.unknowns),sourceCount:list(reading.sources).length}):customerEmpty(lang);
  return deepFreeze({
    schemaVersion:`${CX_PROJECTION_VERSION}:MY_REALITY`,surface:'MY_REALITY',locale:lang,state:b.schemaVersion?'READY':'EMPTY',
    overview:{bundleId:clean(b.bundleId)||null,sourceType:clean(b.sourceType)||null,createdAt:clean(b.createdAt)||null,summary:clean(lanes.userQuestion)||text(lang,'No current Reality has been added to this view.','当前尚未把任何 Reality 加入这个视图。')},
    currentReality:{reportedContext:statements(lanes.reportedContext),externalEvidence,financialState:lanes.financialState?deepFreeze({snapshotId:clean(lanes.financialState.snapshotId)||null,asOfDate:clean(lanes.financialState.asOfDate)||null,baseCurrency:clean(lanes.financialState.baseCurrency)||null,canonicalPersistentReality:lanes.financialState.canonicalPersistentReality===true}):null,calculations,findings,unknown:statements(lanes.unknown)},
    perspectives:{items:perspectiveReferences,empty:perspectiveReferences.length===0},
    reading:readingProjection,
    navigation:{state:clean(nav.state||nav.status)||'NOT_ESTABLISHED',options:list(nav.options||nav.paths).map(item=>deepFreeze({id:clean(item?.id||item?.pathId)||null,label:clean(item?.label||item?.title),state:clean(item?.state)||null})).filter(x=>x.label)},
    actions:{items:actions},
    review:{state:clean(j.review?.state||j.reviewState)||'NOT_ESTABLISHED',summary:clean(j.review?.summary)||null},
    history:{items:history},
    reports:{items:reportItems},
    knowledge:{items:knowledgeReferences},
    continuation:{stage:clean(b.continuation?.currentStage)||'REALITY',nextStages:list(b.continuation?.nextAvailableStages).map(clean).filter(Boolean),deepWorkflowAutomatic:b.continuation?.deepWorkflowAutomatic===true,persistenceRequiresConsent:b.continuation?.persistentContinuationRequiresExplicitConsent!==false},
    governance:{persisted:b.governance?.persisted===true,canonicalRealityCreated:b.governance?.canonicalRealityCreated===true,perspectivesRemainPerspectives:b.classification?.perspectivesRemainPerspectives!==false,calculationsRemainCalculations:b.classification?.calculationsRemainCalculations!==false,findingsRemainFindings:b.classification?.findingsRemainFindings!==false,...sourceLineage(['ICR','RDG','RMO','RRE','JR','RNE','RR']),...boundary()}
  });
}
