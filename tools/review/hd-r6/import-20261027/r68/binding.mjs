import fs from 'node:fs';
import {verifyHdConfirmationSnapshot,inspectHdReportChartConsistency} from '../../../../../functions/external-profile/hd-report-automation-candidate.js';
import {prepareHdPremiumSectionPackets,admitExactReviewParagraph} from '../../../../../functions/external-profile/hd-premium-section-packet-review.js';
import {inspectSelection} from '../r61/selection.mjs';
import {checkChartContradictions} from '../field-review.mjs';
export const d='tools/review/hd-r6/import-20261027/r68/',j=p=>JSON.parse(fs.readFileSync(p)),modules=j(d+'MODULES.json').modules,normalization=j(d+'../r65/PRIVATE-NORMALIZATION-CONTRACT.json'),reference=j(d+'../r65/CURRENT-PLAN.json').preview.chart;
const srcIds=j(d+'../candidate/ACTIVE-SOURCE-INDEX.json').registeredSources.map(x=>x.id),genericRoots=['type','authority','profile.profileCode','definition.definitionCode','centers','channels','cross.configurationCode'],at=(o,p)=>p.split('.').reduce((o,k)=>o?.[k],o);
export function requirements(m){
 const n=Number(m.sectionId.slice(3)),full=!([2,3,8,9,10].includes(n)),facts=[];
 const put=(path,value)=>facts.push({path,equals:value});
 const ref={type:reference.typeCode,authority:reference.authority,profile:reference.profile,definition:reference.definition,centers:reference.definedCenters,channels:reference.channels,cross:reference.incarnationCross};
 if(full||n===7||n===15)for(const p of genericRoots)put(p,at(ref,p));
 if(n===2)put('type','GENERATOR');if(n===3)put('authority','EMOTIONAL');if(n===8)put('profile.profileCode','5/1');if(n===9)put('cross.configurationCode','43/23|29/30');
 // Retain conservative reference scope for personalized eleven-chapter drafts.
 // These are not a general-purpose semantic corpus. Missing alternatives stay gaps.
 if(full||[7,9,15].includes(n))reference.activations.forEach((a,i)=>{for(const k of ['layer','bodyCode','gate','line'])put(`activations.${i}.${k}`,a[k]);});
 if(full||n===10)for(const [axis,v]of Object.entries(reference.variables.fields))for(const k of ['color','tone','orientation'])put(`variables.fields.${axis}.${k}`,v[k]);
 if(n===2&&/Emotional|情绪权威/.test(m.text))put('authority','EMOTIONAL');
 if([2,3,8].includes(n)&&/5\/1/.test(m.text))put('profile.profileCode','5/1');
 if([2,3,8].includes(n)&&/43[–—-]23|29[–—-]46|37[–—-]40/.test(m.text))put('channels',reference.channels);
 return facts;
}
export function bindParagraphs({preview,plan,token,options,authorized=true,allowedSourceFiles=modules.map(x=>x.sourceFile),revoked=false}){
 if(!authorized||revoked)throw Error('HD_R68_OWNER_REVIEW_ACCESS_DENIED');verifyHdConfirmationSnapshot(token,preview,options);
 if(!inspectHdReportChartConsistency(preview.chart).passed||checkChartContradictions(preview.chart).length)throw Error('HD_R68_CONTRADICTORY_CHART');
 const packets=prepareHdPremiumSectionPackets({preview,plan,normalization,acceptedReviewSelection:null}),decisions=[];
 for(const m of modules){const packet=packets[Number(m.sectionId.slice(3))-1],requiredFacts=requirements(m);let reason=null,selected=null;
  try{
   if(!allowedSourceFiles.includes(m.sourceFile))throw Error('HD_R68_UNAUTHORIZED_SOURCE');
   if(/test configuration|测试配置/i.test(m.text))throw Error('HD_R68_CUSTOMER_DISPLAY_DELTA_PENDING_OWNER');
   if(m.subsectionId==='SEC10.07'||/Inner Vision|内部视觉|内在视觉|DreamRave|Book of Destinies/i.test(m.text))throw Error('HD_R68_WITHDRAWN_INFERENCE');
   if(m.subsectionId==='SEC10.06'||/Low Sound|低声音/.test(m.text))throw Error('HD_R68_LOW_SOUND_SUBTYPE_NOT_ADMITTED');
   if(/Venus.{0,25}46\.[23]|46\.[23].{0,25}Venus|金星.{0,20}46/.test(m.text))throw Error('HD_R68_DISPUTED_VENUS_PRECISION');
   if(m.legacyRule){const r=inspectSelection(m.legacyRule,preview.chart,{activeSourceIds:srcIds});if(!r.matched)throw Error('HD_R68_'+r.reasons.join('|'));}
   selected=admitExactReviewParagraph({paragraph:{...m,requiredFacts},packet,confirmationDigest:preview.chartDigest});packet.paragraphs??=[];packet.paragraphs.push(selected);
  }catch(e){reason=e.message;}
  decisions.push({id:m.id,section:m.sectionId,language:m.language,matched:!!selected,reason,requiredFacts,sourceFile:m.sourceFile,sourceTextSHA256:m.sourceTextSHA256,selectedSHA256:m.paragraphSHA256,editorial:m.editorialStatus,commercialGate:'BLOCKED'});
 }
 return {packets:packets.map(p=>({...p,paragraphs:p.paragraphs||[]})),decisions,chartDigest:preview.chartDigest,commercial:false};
}
