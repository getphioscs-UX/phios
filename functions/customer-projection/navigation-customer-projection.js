import {CX_PROJECTION_VERSION,boundary,clean,deepFreeze,list,localeOf,safeUrl,sourceLineage} from './projection-common.js';
export function projectNavigationForCustomer(navigation={}, {locale='en'}={}){
 const source=navigation&&typeof navigation==='object'?navigation:{};
 const options=list(source.options||source.paths||source.choices).map(item=>deepFreeze({id:clean(item?.id||item?.pathId||item?.code)||null,label:clean(item?.label||item?.title||item?.statement),description:clean(item?.description||item?.summary)||null,href:safeUrl(item?.href),state:clean(item?.state)||null,evidence:clean(item?.evidenceState)||null})).filter(x=>x.label);
 return deepFreeze({schemaVersion:`${CX_PROJECTION_VERSION}:NAVIGATION`,locale:localeOf(locale),state:clean(source.state||source.status)||'NOT_ESTABLISHED',options,selectedId:clean(source.selectedId||source.selectedPathId)||null,governance:{selectionMadeBySystem:false,...sourceLineage(['RNE']),...boundary()}});
}
