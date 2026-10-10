export class WebCompositionResolutionError extends Error {
  constructor(code, message = code, details = {}) { super(message); this.name='WebCompositionResolutionError'; this.code=code; this.details=details; }
}
const allowedSlots=new Set(['HERO','PRIMARY_CONTEXT','PRIMARY_CONTENT','PRIMARY_VISUAL','EVIDENCE','KNOWLEDGE','SECONDARY_VISUAL','RELATED','CONTINUITY','PROFESSIONAL_BOUNDARY','CTA','FOOTER_CONTEXT']);
function req(v,code){const x=String(v??'').trim(); if(!x) throw new WebCompositionResolutionError(code); return x;}
function find(items,key,value,code){const x=Array.isArray(items)?items.find(i=>i?.[key]===value):null; if(!x) throw new WebCompositionResolutionError(code,code,{[key]:value}); return x;}
export function resolveWebComposition({webCompositionRecord,surfaceRegistry,routeRegistry,accessState='ALLOWED',cprProductionRecordExists=false}={}) {
  if(!webCompositionRecord||typeof webCompositionRecord!=='object') throw new WebCompositionResolutionError('WPR_COMPOSITION_RECORD_INVALID');
  const routeCode=req(webCompositionRecord.routeCode,'WPR_COMPOSITION_RECORD_INVALID');
  const surfaceCode=req(webCompositionRecord.surfaceCode,'WPR_COMPOSITION_RECORD_INVALID');
  const audience=req(webCompositionRecord.audience,'WPR_COMPOSITION_RECORD_INVALID');
  const locale=req(webCompositionRecord.locale,'WPR_COMPOSITION_RECORD_INVALID');
  req(webCompositionRecord.cprCompositionReference,'WPR_CPR_REFERENCE_REQUIRED');
  const route=find(routeRegistry?.entries,'routeCode',routeCode,'WPR_ROUTE_NOT_FOUND');
  if(route.surfaceCode!==surfaceCode) throw new WebCompositionResolutionError('WPR_ROUTE_SURFACE_MISMATCH');
  const surface=find(surfaceRegistry?.entries,'surfaceCode',surfaceCode,'WPR_SURFACE_NOT_FOUND');
  if(surface.audienceClass!==audience) throw new WebCompositionResolutionError('WPR_AUDIENCE_MISMATCH');
  if(accessState!=='ALLOWED') throw new WebCompositionResolutionError('WPR_ACCESS_BLOCKED');
  const fixture=webCompositionRecord.productionMode==='VALIDATION_FIXTURE';
  if(!fixture&&!cprProductionRecordExists) throw new WebCompositionResolutionError('WPR_CPR_PRODUCTION_RECORD_REQUIRED');
  const bindings=Array.isArray(webCompositionRecord.slotBindings)?webCompositionRecord.slotBindings:[];
  if(!bindings.length) throw new WebCompositionResolutionError('WPR_COMPOSITION_RECORD_INVALID');
  const seen=new Set();
  const slots=bindings.map((b,index)=>{
    const slot=req(b?.slotCode,'WPR_COMPOSITION_SLOT_UNDECLARED').toUpperCase();
    if(!allowedSlots.has(slot)) throw new WebCompositionResolutionError('WPR_COMPOSITION_SLOT_UNDECLARED',undefined,{slotCode:slot});
    if(seen.has(slot)) throw new WebCompositionResolutionError('WPR_COMPOSITION_SLOT_DUPLICATE',undefined,{slotCode:slot}); seen.add(slot);
    if(!Array.isArray(b.componentCodes)||!b.componentCodes.length||!Array.isArray(b.sourcePresentationReferences)||!b.sourcePresentationReferences.length) throw new WebCompositionResolutionError('WPR_COMPOSITION_RECORD_INVALID');
    return {slotCode:slot,order:index,componentCodes:[...b.componentCodes],sourcePresentationReferences:[...b.sourcePresentationReferences]};
  });
  return {compositionCode:webCompositionRecord.compositionCode,compositionVersion:webCompositionRecord.compositionVersion,routeCode,surfaceCode,audience,locale,cprCompositionReference:webCompositionRecord.cprCompositionReference,slots,renderState:fixture?'VALIDATION_RESOLVED':'PRODUCTION_RESOLVED',authority:'CPR_COMPOSITION_EXECUTED_BY_WPR'};
}
