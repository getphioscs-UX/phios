import {buildCurrentRealityBundle} from '../reality-orchestration/reality-orchestrator.js';
import {projectRealityForCustomer} from '../customer-projection/reality-customer-projection.js';
import {projectReadoutForCustomer} from '../customer-projection/readout-customer-projection.js';
import {projectNavigationForCustomer} from '../customer-projection/navigation-customer-projection.js';
import {projectContinuityForCustomer} from '../customer-projection/continuity-customer-projection.js';
import {projectReportForCustomer} from '../customer-projection/report-customer-projection.js';
import {projectMyRealityWorkspace} from '../customer-projection/my-reality-workspace-projection.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const clean=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];

function workspaceFromProjectedSources({reality,reading,navigation,journey,reports,locale}){
  const readout=projectReadoutForCustomer(reading||{},{locale});
  const navigationView=projectNavigationForCustomer(navigation||{},{locale});
  const continuity=projectContinuityForCustomer(journey||{},{locale});
  const reportViews=list(reports?.items||reports).map(report=>projectReportForCustomer(report,{locale}));
  return projectMyRealityWorkspace({reality,readout,navigation:navigationView,continuity,reports:reportViews,locale});
}

export async function onRequestGet(context){
  const locale=new URL(context.request.url).searchParams.get('locale')==='zh-Hans'?'zh-Hans':'en';
  const sources=context?.data?.cxRealitySources||{};
  const reality=projectRealityForCustomer({...sources,locale});
  const workspace=workspaceFromProjectedSources({reality,reading:sources.reading,navigation:sources.navigation,journey:sources.journey,reports:sources.reports,locale});
  return json({ok:true,view:reality,workspace,governance:{persisted:false,rawRuntimeExposed:false,workspaceConsumesCustomerProjections:true}});
}

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'INVALID_JSON'},400)};
  if(body?.consent!==true)return json({ok:false,error:'REALITY_PROCESSING_CONSENT_REQUIRED'},403);
  const locale=body?.locale==='zh-Hans'?'zh-Hans':'en';
  const question=clean(body?.question)||clean(body?.whatMattersMostNow)||'Current reality';
  const reportedContext=[body?.whatIsHappening,body?.howLong,body?.whatChanged,body?.whatMattersMostNow].map(clean).filter(Boolean);
  try{
    const bundle=await buildCurrentRealityBundle({sourceType:'ASK',locale,source:{question,reportedContext,unknown:[]}});
    const reality=projectRealityForCustomer({bundle,locale});
    const workspace=workspaceFromProjectedSources({reality,reading:null,navigation:null,journey:null,reports:[],locale});
    return json({ok:true,view:reality,workspace,governance:{persisted:false,canonicalRealityCreated:false,rawRuntimeExposed:false,workspaceConsumesCustomerProjections:true}});
  }catch(error){return json({ok:false,error:error?.code||error?.message||'CUSTOMER_REALITY_PROJECTION_FAILED'},error?.status||422)}
}
