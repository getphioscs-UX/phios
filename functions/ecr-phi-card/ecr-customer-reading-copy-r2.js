import {normalizeReadingParagraphs} from './ecr-reading-format-r23.js';
const fields=['glance','invitation','examples','approach','watch','action'];
export function selectFixedCustomerReading(copy,card,locale){
 if(!['zh-Hans','en'].includes(locale))throw Error('CARD_LANGUAGE_INVALID');
 const entry=copy?.cards?.[card.cardId],body=entry?.locales?.[locale];
 if(!body||fields.some(k=>!Array.isArray(body[k])||!body[k].length))return {status:'READING_COPY_MISSING',locale,missingLanguage:locale};
 const code=card.cardId.replace('ECR-PC-',''),pattern=new RegExp('\\b'+code+'\\b','g');
 // Deterministic display alias only; the supplied prose and hash remain immutable.
 const display=ps=>normalizeReadingParagraphs(ps).map(p=>p.replace(pattern,card.title[locale]));
 const sections=Object.fromEntries(fields.map(k=>[k,display(body[k])]));
 const phase=card.groupId==='PHASE',sourceBoundary=display(body.sourceBoundary||[]);
 // Phase customer boundaries reuse already-approved, card-specific watch prose.
 // The complete technical wording remains available only in an explicit disclosure.
 const boundary=phase?sections.watch:sourceBoundary;
 const editorialCandidates=(copy.editorialDeltas?.deltas||[]).filter(d=>d.cardId===card.cardId&&d.locale===locale).map(d=>({deltaId:d.deltaId,status:d.status,section:d.section,addition:d.addition,reason:d.reason}));
 return {status:copy.status==='R2_BASELINE_CONTENT_APPROVED_FORMAT_CORRECTION_VERIFIED'?'R2_BASELINE_CONTENT_APPROVED':'LOCAL_R2_COPY_REVIEW_CANDIDATE',formatStatus:'FORMAT_CORRECTION_VERIFIED',locale,version:copy.schemaVersion,sha256:body.sha256,sections,boundary,technicalDisclosureBoundary:phase?sourceBoundary:[],editorialCandidates,reflectionQuestion:card.observationPrompt[locale],source:entry.source,presentationAlias:{from:code,to:card.title[locale]}};
}
