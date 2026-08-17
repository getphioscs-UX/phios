export function preserveUnknown(value, metadata={}){ return value==null ? Object.freeze({status:'Unknown', value:null, aiFilled:false, ...metadata}) : value; }
export function assertNoAiUnknownFill(record){ if(record?.status==='Unknown' && record?.aiFilled===true) throw new Error('AI may not fill Unknown as fact'); return record; }
