import {createHash} from 'node:crypto';
import {compileR32,R32_VERSION} from '../functions/financial/calculation-runtime/publication-paths-r3-2.js';
export const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Local-only frozen preview envelope. No production report or entitlement claim. */
export function freezeR32Preview(base,context,input){
 if(!context.localPreview||!context.currentConsent||context.sourceDigest!==base.source.contentDigest)throw Error('SOURCE_OR_AUTHORIZATION_MISMATCH');
 for(const a of input.assets||[]){const original=base.assets.find(x=>x.id===a.ref);if(!original||a.subject!=='SELF'||a.currency!==original.currency||a.asOfDate!==base.asOfDate||a.ownedValue.kind!==original.kind||a.ownedValue.value!==original.value||a.valueBasis!==original.valueBasis)throw Error('CANONICAL_ASSET_MISMATCH');}
 const result=compileR32(context,input,base.policyEvents);return {version:R32_VERSION,status:'LOCAL_SYNTHETIC_HUMAN_REVIEW_ONLY',baseSourceDigest:base.source.contentDigest,baseCalculationDigest:base.calculationDigest,scenarioDigest:digest(input),sourceSnapshot:{context,input},result,contentDigest:digest({base:base.contentDigest,input,result}),commercial:{priceMYR:69,languages:['zh-Hans','en'],artifactLanguage:'BILINGUAL',followups:4,providerCapUSD:5,providerCalls:0,costUSD:0}};
}
export function reopenR32Preview(envelope,base,{currentConsent,admittedSubjects}){
 if(!currentConsent||envelope.sourceSnapshot.context.admittedSubjects.some(s=>!admittedSubjects.includes(s)))throw Error('CURRENT_CONSENT_REQUIRED');
 if(envelope.baseSourceDigest!==base.source.contentDigest||envelope.baseCalculationDigest!==base.calculationDigest||envelope.scenarioDigest!==digest(envelope.sourceSnapshot.input))throw Error('IMMUTABLE_SOURCE_MISMATCH');
 const rebuilt=freezeR32Preview(base,envelope.sourceSnapshot.context,envelope.sourceSnapshot.input);if(rebuilt.contentDigest!==envelope.contentDigest)throw Error('CONTENT_DIGEST_MISMATCH');return rebuilt;
}
