import {CX_PROJECTION_VERSION,boundary,clean,deepFreeze,list,localeOf,safeUrl,sourceLineage,upstreamState} from './projection-common.js';

const statement=item=>deepFreeze({
  code:clean(item?.code||item?.findingCode)||null,
  label:clean(item?.label||item?.title)||null,
  text:clean(item?.text||item?.summary||item?.statement)||null,
  evidenceState:clean(item?.evidenceState)||null,
  professionalJudgment:item?.professionalJudgment===true
});

export function projectProfessionalReviewForCustomer(review={}, {locale='en'}={}){
  const source=review&&typeof review==='object'?review:{};
  const observations=list(source.observations||source.findings).map(statement).filter(item=>item.text||item.code);
  const recommendations=list(source.recommendations).map(statement).filter(item=>item.text||item.code);
  return deepFreeze({
    schemaVersion:`${CX_PROJECTION_VERSION}:PROFESSIONAL_REVIEW`,
    surface:'PROFESSIONAL_REVIEW',
    locale:localeOf(locale),
    state:upstreamState(source.state||source.status),
    reviewId:clean(source.reviewId||source.id)||null,
    scope:clean(source.scope||source.title)||null,
    observations,
    recommendations,
    limitations:list(source.limitations||source.unknown).map(item=>clean(typeof item==='string'?item:item?.statement||item?.reason||item?.code)).filter(Boolean),
    report:{
      id:clean(source.report?.reportId||source.report?.id)||null,
      label:clean(source.report?.title||source.report?.label)||null,
      href:safeUrl(source.report?.href)
    },
    governance:{
      professionalAuthorityRequired:true,
      professionalRecommendationPassedThrough:recommendations.length>0,
      adapterCreatedRecommendation:false,
      ...sourceLineage(['PR','PFR']),
      ...boundary()
    }
  });
}
