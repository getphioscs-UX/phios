import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {resolveZiweiLiveTargetContext} from '../zi-wei-full-production/ziwei-live-target-context-runtime.js';
// Frozen V1 takes an injected trusted loader. Birth data never comes from generation JSON.
export async function generateAccountZiweiCandidate(context,selection){
 if(!selection||Object.keys(selection).some(k=>!['personId','locale','targetContext'].includes(k))||typeof selection.personId!=='string'||!['en','zh-Hans'].includes(selection.locale))throw Error('ZIWEI_SELECTION_INVALID');
 const targetContext=resolveZiweiLiveTargetContext(selection.targetContext);
 return generateZiweiProductionCandidate(context,selection,{loadSubject:async(owner,id)=>{
  const record=await loadCanonicalPersonSubject(context.env,owner,id);
  return {...record,traditionalCalculationSex:record.calculationSex,targetContext};
 }});
}
