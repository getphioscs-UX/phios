const list=v=>Array.isArray(v)?v:[];
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const byId=(p,id)=>list(p?.figures).find(x=>x?.pfig===id)||null;
const freeze=v=>Object.freeze(v);
export const PROFILE_VISUAL_DEPTH_SCHEMA='PHI-OS-PROFILE-VISUAL-DEPTH-PROJECTION-v1.0.0';

function snapshotFigure(fig){
  if(!fig)return null;
  const out=clone(fig);
  if(fig.pfig==='PFIG-001'&&out.data?.lanes) out.data.lanes=out.data.lanes.map(l=>({...l,dimensions:list(l.dimensions).slice(0,3)}));
  if(fig.pfig==='PFIG-003'){
    out.data.resources=list(out.data?.resources).slice(0,1);
    out.data.costs=list(out.data?.costs).slice(0,1);
    out.data.summaryCounts={resources:list(fig.data?.resources).length,costs:list(fig.data?.costs).length};
  }
  if(fig.pfig==='PFIG-005'&&out.data?.perspectives){
    const states=['CONVERGES','CONTEXT_DEPENDENT','DIVERGES','UNKNOWN'];
    out.data={stateCounts:Object.fromEntries(states.map(s=>[s,list(fig.data.perspectives).filter(x=>x.projectionState===s).length]))};
  }
  if(fig.pfig==='PFIG-009'){
    out.data={hasContext:Boolean(fig.data?.contextEvidence),contradictionCount:list(fig.data?.contradictions).length,questions:list(fig.data?.questions).slice(0,1)};
  }
  return out;
}
function trustedLevel(entitlement){
  if(entitlement?.trustedServerResolved!==true||entitlement?.status!=='ACTIVE')return 'FREE_SNAPSHOT';
  return entitlement?.level==='REALITY_PROFILE'?'REALITY_PROFILE':entitlement?.level==='DEEP_PROFILE'?'DEEP_PROFILE':'FREE_SNAPSHOT';
}
export function buildProfileVisualDepthProjection({visualProjection=null,entitlement=null}={}){
  const level=trustedLevel(entitlement);
  const ids=['PFIG-001','PFIG-003','PFIG-005','PFIG-009'];
  const snapshot={...clone(visualProjection),figures:ids.map(id=>snapshotFigure(byId(visualProjection,id))).filter(Boolean)};
  const locked=[
    {level:'DEEP_PROFILE',title:'Deep Profile',pfigs:['PFIG-002','PFIG-004','PFIG-006','PFIG-007','PFIG-008'],preview:'Cross-source patterns, context, work, relationship and decision evidence in one deeper visual layer.'},
    {level:'REALITY_PROFILE',title:'Reality Profile',pfigs:['PFIG-004','PFIG-005','PFIG-008','PFIG-009'],preview:'Connect Profile evidence to Current Reality without turning either source into a verdict.'}
  ];
  return freeze({schemaVersion:PROFILE_VISUAL_DEPTH_SCHEMA,level,freeSnapshot:snapshot,fullProjection:level==='FREE_SNAPSHOT'?null:clone(visualProjection),locked:level==='FREE_SNAPSHOT'?locked:level==='DEEP_PROFILE'?locked.filter(x=>x.level==='REALITY_PROFILE'):[],commerce:{offerResolved:false,priceResolved:false,checkoutResolved:false},governance:{trustedServerEntitlementRequired:true,clientSelfUpgradeAllowed:false,paidDataLeakedToFreeProjection:false}});
}
