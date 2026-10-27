const fields=['glance','invitation','examples','approach','watch','action'];
export function selectFixedCustomerReading(copy,card,locale){
 if(!['zh-Hans','en'].includes(locale))throw Error('CARD_LANGUAGE_INVALID');
 const entry=copy?.cards?.[card.cardId],body=entry?.locales?.[locale];
 if(!body||fields.some(k=>!Array.isArray(body[k])||!body[k].length))return {status:'READING_COPY_MISSING',locale,missingLanguage:locale};
 const code=card.cardId.replace('ECR-PC-',''),pattern=new RegExp('\\b'+code+'\\b','g');
 // Deterministic display alias only; the supplied prose and hash remain immutable.
 const sections=Object.fromEntries(fields.map(k=>[k,body[k].map(p=>p.replace(pattern,card.title[locale]))]));
 return {status:'LOCAL_R2_COPY_REVIEW_CANDIDATE',locale,version:copy.schemaVersion,sha256:body.sha256,sections,boundary:(body.sourceBoundary||[]).map(p=>p.replace(pattern,card.title[locale])),reflectionQuestion:card.observationPrompt[locale],source:entry.source,presentationAlias:{from:code,to:card.title[locale]}};
}
