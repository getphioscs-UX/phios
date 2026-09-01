import fs from 'node:fs';
import {compileRelationshipNarrativeBrief} from '../functions/personal-reading/relationship/relationship-narrative-brief.js';
import {buildSpecificRelW7Case,buildSelfRelW7Case} from './rel-w7-relationship-narrative-fixtures.mjs';
import {W53,W54,PRODUCT,verifiedPayment,offer,stubWriterProvider,stubAskAnswerer} from './ppr-narrative-w54n1-n8-fixtures.mjs';
export {W53,W54,PRODUCT,verifiedPayment,offer,stubWriterProvider,stubAskAnswerer};
export const REL_PRODUCT=JSON.parse(fs.readFileSync('content/personal-reading/relationship/narrative/registries/paid-relationship-narrative-product-authority-v1.json','utf8'));
export async function relationshipBriefCase(index){
  if(index<=20){
    const realityModes=['SUPPORT','PARTIAL','CONTRADICT','OPEN','NONE'];
    const profileClasses=['CUSTOMER_SELF_REPORT','EXTERNAL_PROFILE_RESULT','MEASURED_TASK_PERFORMANCE','STANDARDIZED_SELF_REPORT'];
    return compileRelationshipNarrativeBrief(await buildSpecificRelW7Case(index,{methodCount:2+((index-1)%5),hasProfile:index%2===0,profileSourceClass:profileClasses[index%4],astUnavailable:index%4===0,realityMode:realityModes[(index-1)%5],sensitive:index%5===0,customerContext:index%3===0?`Explicit customer-reported context for paid relationship case ${index}.`:null}));
  }
  const j=index-20;return compileRelationshipNarrativeBrief(await buildSelfRelW7Case(j,{hasProfile:j%2===0,sensitive:j%3===0}));
}
export function relationshipOffer(){return {...offer(),relationshipProductAuthorityId:REL_PRODUCT.productAuthorityId,relationshipProductVersion:REL_PRODUCT.productVersion};}
