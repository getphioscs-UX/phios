// Complete the Western P19 interpretation packet from the existing admitted
// D4 factory. This selects existing meanings; it creates no authority or formula.
import fs from'node:fs';
import{buildNumLongCycleMeaningCandidate}from'../../../functions/num-depth/num-long-cycle-meaning-runtime.js';
import{freezeEditorialRequest}from'../../../functions/personal-reading/narrative/method-editorial-contract.js';
import{sha256Stable}from'../../../functions/interpretation-runtime/mir7-utils.js';
const read=p=>JSON.parse(fs.readFileSync(p)),registry=read('content/professional/num-production/depth-d1-d8/registries/num-d-claim-admission-registry-v1.json'),root='.tmp/numerology-r30',evidence=[];
for(const id of['A','B','C','D']){
 const pub=read(root+'/'+id+'-PUBLICATION.json'),requests=read(root+'/'+id+'-REQUESTS.json'),catalog=read(root+'/'+id+'-SOURCES.json'),s=pub.chartModels.en.publicationDetail.westernTimeline.selection,added=[];
 for(const [role,value]of[['PINNACLE_CYCLE',s.pinnacle],['CHALLENGE_CYCLE',s.challenge]]){
  const en=buildNumLongCycleMeaningCandidate({role,value,locale:'en'}),zh=buildNumLongCycleMeaningCandidate({role,value,locale:'zh-Hans'});if(!en?.runtimeUseAllowed||!zh?.runtimeUseAllowed)throw Error('EXISTING_WESTERN_MEANING_UNAVAILABLE');
  if(!registry.claims.some(x=>x.claimId===en.sourceClaimId&&x.reviewState==='HUMAN_ADMITTED'&&x.runtimeUseAllowed===true))throw Error('EXISTING_ADMISSION_REQUIRED');
  const c={id:en.sourceClaimId,role,value,school:en.school,scope:'STRUCTURAL_INTERPRETATION',sourcePath:'functions/num-depth/num-long-cycle-meaning-runtime.js',sourceLocator:'buildNumLongCycleMeaningCandidate/'+role+'/'+value,sourceVersion:en.schemaVersion,sourceText:{en:en.text,zhHans:zh.text},sourceDigest:await sha256Stable({en,zh}),runtimeUseAllowed:true,sourceClaimId:en.sourceClaimId};catalog[c.id]=c;added.push(c);
 }
 const index=requests.findIndex(x=>x.semanticPlan.publicationContext.logicalPageId==='P19'),old=requests[index],roles=[...new Map([...old.semanticPlan.roleSemantics,...added].map(c=>[c.id,c])).values()];
 requests[index]=await freezeEditorialRequest({methodId:'NUM',inputDigest:old.inputDigest,accountId:old.accountId,entitlementId:old.entitlementId,promptVersion:'R30-NATIVE-WESTERN-REFERENCES',semanticPlan:{...old.semanticPlan,roleSemantics:roles}});
 fs.writeFileSync(root+'/'+id+'-REQUESTS.json',JSON.stringify(requests,null,2));fs.writeFileSync(root+'/'+id+'-SOURCES.json',JSON.stringify(catalog,null,2));evidence.push({id,selection:s,existingNativeFactoryReferences:added,newSourceAdmission:false});
}
fs.writeFileSync('tools/review/numerology-r30/WESTERN-SOURCE-REFERENCES.json',JSON.stringify({subjects:evidence,newAuthorityCreated:false,humanParaphraseAcceptance:false},null,2));
