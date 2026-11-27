const METHODS=Object.freeze({numerology:'NUM',ziwei:'ZWR',astrology:'AST','phi-configuration':'ECR','human-design':'HD'});
const ROLES=new Set(['COVER','METHOD_INTRO','ORIGIN','PHIOS_LENS','HOW_TO_READ']);
const fail=code=>{throw Object.assign(new Error(code),{code});};
// Project existing public editorial rows only. This is neither a publication
// admission decision nor a report, calculation, entitlement or context store.
export function freeReportFrontMatter({slug,locale,manifest,editorialAssets,publicBaseUrl}){
 if(!Object.hasOwn(METHODS,slug))fail('FREE_METHOD_UNKNOWN');const methodId=METHODS[slug];
 if(!['en','zh-Hans'].includes(locale))fail('FREE_LOCALE_INVALID');
 const base=new URL(publicBaseUrl);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)fail('FREE_ASSET_BASE_INVALID');
 const order=manifest.reports?.[methodId]?.frontMatter;if(!Array.isArray(order)||!order.length||new Set(order).size!==order.length||order.some(id=>!/^P\d{2}$/.test(id)))fail('FREE_FRONT_MATTER_UNAVAILABLE');
 const pages=order.map(pageId=>{
  const page=Number(pageId.slice(1));
  const registered=(editorialAssets||[]).filter(a=>a.methodId===methodId&&a.page===page&&a.reportStaticEditorial===true&&ROLES.has(a.pageRole)&&a.active===true&&/^verified(?:$|[-_])/i.test(a.verification));
  const source=registered.find(a=>a.locale===locale)||registered.find(a=>a.locale==='bilingual');
  if(!source)fail('FREE_FRONT_MATTER_UNAVAILABLE');
  const admitted=(manifest.assets||[]).filter(a=>a.methodId===methodId&&a.pageId===pageId&&a.active===true);
  const exact=admitted.find(a=>a.language===locale)||admitted.find(a=>a.language==='bilingual');
  const objectKey=exact?.objectKey||source.object_key;
  if(!registered.some(a=>a.object_key===objectKey))fail('FREE_FRONT_MATTER_UNAVAILABLE');
  // Reject path injection and content outside the registered public editorial directory.
  if(typeof objectKey!=='string'||!objectKey.startsWith('images/reports/')||!objectKey.includes('/editorial/')||!objectKey.endsWith('.webp')||/[?#\\]/.test(objectKey)||objectKey.split('/').some(p=>p==='.'||p==='..'||p===''))fail('FREE_ASSET_KEY_INVALID');
  const url=base.toString().replace(/\/$/,'')+'/'+objectKey.split('/').map(encodeURIComponent).join('/');
  return {pageId,role:source.pageRole,language:exact?.language||source.locale,url,width:exact?.width||source.width||null,height:exact?.height||source.height||null,sha256:exact?.sha256||source.sha256||null};
 });
 return {ok:true,methodId,locale,pages,personalized:false,providerCalls:0};
}
