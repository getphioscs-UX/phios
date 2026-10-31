import {PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT,resolveSpecialistRendererDescriptor} from './specialist-renderer-registry.js';
const HOST_CSS='/assets/customer-ui/surfaces/ppr-r3-specialist-host.css';
let sequence=0;
function ensureCss(doc=globalThis.document){if(!doc?.head)return null;let link=doc.querySelector('link[data-ppr-r3-host-css="true"]');if(link)return link;link=doc.createElement('link');link.rel='stylesheet';link.href=HOST_CSS;link.dataset.pprR3HostCss='true';doc.head.appendChild(link);return link}
function slots(host){return Object.freeze({host,navigator:host?.querySelector?.('[data-ppr-r3-specialist-navigator-mount]')||null,visual:host?.querySelector?.('[data-ppr-r3-specialist-visual-mount]')||null,reading:host?.querySelector?.('[data-ppr-r3-specialist-reading-mount]')||null,technical:host?.querySelector?.('[data-ppr-r3-specialist-technical-mount]')||null})}
function updateNavState(mount){if(mount?.host)mount.host.dataset.pprR3HasNav=String(Boolean(mount.navigator&&!mount.navigator.hidden&&String(mount.navigator.innerHTML||'').trim()))}
function applyPlan(mount,plan){if(!plan||plan.status!=='RENDERED')return false;for(const [key,field] of [['navigator','navigationHtml'],['visual','visualHtml'],['reading','readingHtml'],['technical','technicalHtml']]){if(Object.hasOwn(plan,field)&&mount[key]){mount[key].innerHTML=plan[field]||'';mount[key].hidden=!plan[field]}}updateNavState(mount);return true}
function installNavigation(host){if(!host||host.dataset.pprR3NavInstalled==='true')return;host.addEventListener('click',event=>{const trigger=event.target.closest?.('[data-ppr-r3-nav-target]');if(!trigger)return;const selector=trigger.dataset.pprR3NavTarget,target=selector?host.querySelector(selector):null;if(!target)return;host.querySelectorAll('[data-ppr-r3-nav-target]').forEach(item=>item.setAttribute('aria-current',String(item===trigger)));target.scrollIntoView?.({behavior:'smooth',block:'start'});target.focus?.({preventScroll:true})});host.dataset.pprR3NavInstalled='true'}
export function buildSpecialistHostContext({host,product,locale}={}){const mount=slots(host);return Object.freeze({mount,product,locale:locale||product?.locale||'en',surfaceContext:Object.freeze({contract:PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT,canonicalRoute:'/perspectives/personal/',hostOwnsMeaning:false,hostRunsCalculation:false,hostRunsProjection:false}),disclosureContext:Object.freeze({technicalDefaultCollapsed:true,customerReportSemanticsOwner:'CX-R12R4B'}),navigationContext:Object.freeze({methodOwnsLabels:true,methodOwnsOrder:true,sharedHostOwnsSlotOnly:true})})}
export function mountApprovedSpecialistRenderer(product,host){
 if(!host)return Promise.resolve(Object.freeze({state:'NO_HOST'}));ensureCss(host.ownerDocument||globalThis.document);
 const descriptor=resolveSpecialistRendererDescriptor(product);if(!descriptor){host.dataset.pprR3RendererState='GENERIC_FALLBACK';return Promise.resolve(Object.freeze({state:'GENERIC_FALLBACK',reason:'NO_APPROVED_SPECIALIST_RENDERER'}))}
 if(product?.state!=='CUSTOMER_PUBLISHABLE'){host.dataset.pprR3RendererState='FAIL_CLOSED_UPSTREAM';return Promise.resolve(Object.freeze({state:'FAIL_CLOSED_UPSTREAM'}))}
 const token=`ppr-r3-${++sequence}`;host.dataset.pprR3RenderToken=token;host.dataset.pprR3RendererId=descriptor.rendererId;host.dataset.pprR3RendererState='LOADING';
 return import(descriptor.module).then(async module=>{
   if(host.dataset.pprR3RenderToken!==token)return Object.freeze({state:'STALE'});
   const render=module?.[descriptor.export];if(typeof render!=='function')throw new Error('PPR_R3_SPECIALIST_RENDERER_EXPORT_MISSING');
   const context=buildSpecialistHostContext({host,product,locale:product.locale});const plan=await render(context);
   if(host.dataset.pprR3RenderToken!==token)return Object.freeze({state:'STALE'});
   const rendered=applyPlan(context.mount,plan);if(rendered&&typeof plan?.afterMount==='function')plan.afterMount(context.mount);if(!rendered&&plan?.status!=='RENDERED'){host.dataset.pprR3RendererState='GENERIC_FALLBACK';return Object.freeze({state:'GENERIC_FALLBACK',reason:plan?.reason||'SPECIALIST_DECLINED'})}
   installNavigation(host);host.dataset.pprR3RendererState='SPECIALIST_RENDERED';return Object.freeze({state:'SPECIALIST_RENDERED',rendererId:descriptor.rendererId});
 }).catch(()=>{if(host.dataset.pprR3RenderToken===token)host.dataset.pprR3RendererState='GENERIC_FALLBACK';return Object.freeze({state:'GENERIC_FALLBACK',reason:'RENDERER_LOAD_OR_RENDER_FAILED'})});
}
export function ensurePprR3SpecialistHostCss(doc=globalThis.document){return ensureCss(doc)}
export default Object.freeze({buildSpecialistHostContext,mountApprovedSpecialistRenderer,ensurePprR3SpecialistHostCss});
