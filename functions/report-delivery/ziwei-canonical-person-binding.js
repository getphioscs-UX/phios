import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {generateZiweiProfessionalSynthesisR5Candidate} from './ziwei-professional-synthesis-r5-generation.js';
import {resolveZiweiLiveTargetContext} from '../zi-wei-full-production/ziwei-live-target-context-runtime.js';
// Only server callers may inject a generator. Birth data never comes from generation JSON.
export async function generateAccountZiweiCandidate(context,selection,{generateCandidate=generateZiweiProfessionalSynthesisR5Candidate}={}){
 if(!selection||Object.keys(selection).some(k=>!['personId','locale','targetContext'].includes(k))||typeof selection.personId!=='string'||!['en','zh-Hans'].includes(selection.locale))throw Error('ZIWEI_SELECTION_INVALID');
 const targetContext=resolveZiweiLiveTargetContext(selection.targetContext);
 return generateCandidate(context,selection,{loadSubject:async(owner,id)=>{
  const record=await loadCanonicalPersonSubject(context.env,owner,id);
  return {...record,traditionalCalculationSex:record.calculationSex,targetContext};
 }});
}
