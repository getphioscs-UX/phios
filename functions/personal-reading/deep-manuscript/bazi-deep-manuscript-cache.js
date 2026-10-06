import {VERSIONS,digest} from './bazi-deep-manuscript-contract.js';
export async function baziManuscriptCacheKey({candidateId,subjectId,pack,model,orderId=null,experimentId=null}){return 'BDM:MANUSCRIPT:'+await digest({candidateId,subjectId,orderId,experimentId,authority:pack.digest,timing:pack.timingDigest,reality:pack.realityDigest,model,prompt:VERSIONS.prompt,schema:VERSIONS.schema,batch:VERSIONS.batch});}
export async function baziPublicationCacheKey(snapshot,pack,presentationMode='BILINGUAL'){return 'BDM:PUBLICATION:'+await digest({manuscript:snapshot.digest,presentationMode,layoutProfileVersion:'BAZI_PUBLICATION_LAYOUT_PROFILE_'+presentationMode+'_V1',authority:pack.digest,compiler:VERSIONS.compiler,page:VERSIONS.pagePlan,diagram:VERSIONS.diagram,renderer:VERSIONS.renderer,printShell:VERSIONS.printShell});}
export async function readImmutableBaziRelease(store,orderId){const release=await store.get('BDM:RELEASE:'+orderId);if(!release)throw Error('BDM_RELEASE_NOT_FOUND');const {digest:hash,...body}=release;if(await digest(body)!==hash)throw Error('BDM_RELEASE_INTEGRITY');return release;}
export async function releaseBaziPublication(store,orderId,ir,qa){
 if(!orderId||ir.customerPublishable!==true||!qa?.browserReady||!['PASS','PASS_AFTER_RECOMPOSE'].includes(qa.fitStatus)||qa.presentationMode!==ir.presentationMode||ir.technical.fidelity?.some(d=>d.status!=='PASS')||!qa.fontParityVerified||!qa.staticLocaleVerified||!qa.pdfReady||!qa.printReady||qa.overflowPages?.length||ir.publication.pages.length!==48||ir.technical.diagrams.length!==15)throw Error('BDM_DELIVERY_QA_REQUIRED');
 const key='BDM:RELEASE:'+orderId;const value={orderId,publication:ir,qa,state:'RELEASED'};value.digest=await digest(value);
 // Store must supply atomic insert-if-absent. Never overwrite a released order.
 await store.putIfAbsent(key,value);return readImmutableBaziRelease(store,orderId);
}
