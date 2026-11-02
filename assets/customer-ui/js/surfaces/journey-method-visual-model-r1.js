import {PREENTRY_METHODS} from './preentry-five-method-r5-model.js';

// Consumer identifiers only. Object keys, verification and dimensions belong to the existing visual registry.
export function methodVisualIds(slug){
 if(!PREENTRY_METHODS.some(method=>method.slug===slug))throw Error('METHOD_VISUAL_NOT_ALLOWED');
 const stem=slug.toUpperCase();
 const p02=slug==='bazi'?'FOUR-PILLARS':slug==='numerology'?'CORE-NUMBER-SYSTEM':slug==='human-design'?'BODYGRAPH-STRUCTURE':'CHART-STRUCTURE';
 return {hero:`METHOD-${stem}-HERO`,p02:`VIS-PREENTRY-${stem}-P02-${p02}-R1`,p03:`VIS-PREENTRY-${stem}-P03-METHOD-ORIGINS-R1`,p04:`VIS-PREENTRY-${stem}-P04-PHI-READING-LAYERS-R1`};
}
export function relationshipPreparationState({mode,personBName}={}){
 // A name or first-person checkbox never establishes another person's identity, consent or entitlement.
 if(mode!=='SPECIFIC_PERSON_RELATIONSHIP')return 'SOLO';
 return typeof personBName==='string'&&personBName.trim()?'CONSENT_NOT_ESTABLISHED':'MISSING_SECOND_PARTICIPANT';
}
export function journeyPanel(value){return ['current','navigation','review'].includes(value)?value:null;}

