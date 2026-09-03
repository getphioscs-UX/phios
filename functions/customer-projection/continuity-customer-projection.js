import {CX_PROJECTION_VERSION,boundary,clean,deepFreeze,list,localeOf,safeUrl,sourceLineage,upstreamState} from './projection-common.js';

const event=item=>deepFreeze({
  id:clean(item?.id||item?.eventId)||null,
  label:clean(item?.label||item?.title||item?.type)||null,
  state:clean(item?.state||item?.status)||null,
  occurredAt:clean(item?.occurredAt||item?.createdAt)||null
});

export function projectContinuityForCustomer(journey={}, {locale='en'}={}){
  const source=journey&&typeof journey==='object'?journey:{};
  const history=list(source.history||source.events).map(event).filter(item=>item.label||item.id);
  return deepFreeze({
    schemaVersion:`${CX_PROJECTION_VERSION}:CONTINUITY`,
    surface:'MY_REALITY',
    locale:localeOf(locale),
    state:upstreamState(source.state||source.status,'NOT_ESTABLISHED'),
    stage:clean(source.currentStage||source.stage)||null,
    nextStages:list(source.nextAvailableStages||source.nextStages).map(clean).filter(Boolean),
    history,
    review:{
      state:upstreamState(source.review?.state||source.reviewState,'NOT_ESTABLISHED'),
      summary:clean(source.review?.summary)||null
    },
    continuation:{
      available:source.continuationAvailable===true||list(source.nextAvailableStages||source.nextStages).length>0,
      href:safeUrl(source.continueHref||source.href),
      requiresExplicitConsent:source.persistentContinuationRequiresExplicitConsent!==false
    },
    governance:{
      progressOnly:true,
      journeyIsFirstLevelProduct:false,
      persistenceCreated:false,
      ...sourceLineage(['JR']),
      ...boundary()
    }
  });
}
