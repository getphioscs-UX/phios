import {CX_PROJECTION_VERSION,boundary,clean,deepFreeze,list,localeOf,safeUrl} from './projection-common.js';
export function projectReadoutForCustomer(readout={}, {locale='en'}={}){
 const lang=localeOf(locale), source=readout&&typeof readout==='object'?readout:{};
 const sources=list(source.sources||source.grounding).map(item=>deepFreeze({label:clean(item?.authorityLabel||item?.title||item?.label),href:safeUrl(item?.href||item?.sourceUrl),excerpt:clean(item?.excerpt||item?.statement)||null})).filter(x=>x.label||x.href);
 return deepFreeze({schemaVersion:`${CX_PROJECTION_VERSION}:READOUT`,locale:lang,state:clean(source.state||source.status)||'AVAILABLE',title:clean(source.title)||null,summary:clean(source.summary||source.directAnswer)||null,sections:list(source.sections).map(section=>deepFreeze({id:clean(section?.id||section?.code),label:clean(section?.label||section?.title),content:clean(section?.content||section?.summary||section?.statement)})).filter(x=>x.label||x.content),unknown:list(source.unknown||source.unknowns).map(x=>clean(typeof x==='string'?x:x?.statement||x?.reason)).filter(Boolean),sources,governance:boundary()});
}
