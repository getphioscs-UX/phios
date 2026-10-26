import {parseHumanDesignProfileText} from './hd-profile-parser.js';
// Delegates core parsing to the frozen owner. No OCR or production upload activation.
export function parseHumanDesignSubstructureCandidate(text,options={}){
 const parsed=parseHumanDesignProfileText(text,options);
 if(options.includeSubstructure!==true)return parsed;
 const {sourceType='CUSTOMER_PASTED_TEXT',sourceRegionPrefix='PASTED_TEXT'}=options;
 const activations=[],birthDetails=[],issues=[];let layer=null;
 const birthAliases=new Map([['birth date','birthDate'],['出生日期','birthDate'],['birth time','birthTime'],['出生时间','birthTime'],['birth place','birthPlace'],['出生地点','birthPlace'],['timezone','timezone'],['时区','timezone']]);
 for(const [index,raw]of String(text??'').split(/\r?\n/).entries()){
  const line=raw.trim();
  if(/^(?:personality|人格)$/i.test(line)){layer='PERSONALITY';continue;}
  if(/^(?:design|设计|設計)$/i.test(line)){layer='DESIGN';continue;}
  const labelled=/^([^:：]+)[:：]\s*(.+)$/.exec(line);if(!labelled)continue;
  if(birthAliases.has(labelled[1].toLowerCase()))birthDetails.push(Object.freeze({field:birthAliases.get(labelled[1].toLowerCase()),rawValue:labelled[2],sourceType,sourceRegion:`${sourceRegionPrefix}:LINE_${index+1}`,customerConfirmed:false,phiosCalculated:false}));
  if(!layer||labelled[2].split('.').length<3)continue;
  const probe=parseHumanDesignProfileText(`${layer}\n${line}`,options);
  const bodyCodes=[...new Set((probe.structuralCandidates.find(x=>x.field==='activations')?.rawValue||[]).map(x=>x.bodyCode).filter(Boolean))];
  if(bodyCodes.length!==1){issues.push({code:'EXPLICIT_SUBSTRUCTURE_HEADER_UNRESOLVED',line:index+1});continue;}
  const bodyCode=bodyCodes[0],m=/^([1-9]|[1-5]\d|6[0-4])\.([1-6])\.([1-6])\.([1-6])$/.exec(labelled[2]);
  if(!m){issues.push({code:'EXPLICIT_SUBSTRUCTURE_INVALID',line:index+1,bodyCode});continue;}
  const x={layer,bodyCode,gate:Number(m[1]),line:Number(m[2]),color:Number(m[3]),tone:Number(m[4]),base:null,sourceType,sourceRegion:`${sourceRegionPrefix}:LINE_${index+1}`,customerConfirmed:false,phiosCalculated:false};
  const prior=activations.find(a=>a.layer===layer&&a.bodyCode===bodyCode);
  if(prior){issues.push({code:prior.gate===x.gate&&prior.line===x.line&&prior.color===x.color&&prior.tone===x.tone?'EXPLICIT_SUBSTRUCTURE_DUPLICATE':'EXPLICIT_SUBSTRUCTURE_CONFLICT',line:index+1,bodyCode});continue;}
  activations.push(Object.freeze(x));
 }
 return Object.freeze({...parsed,substructureExtraction:Object.freeze({scope:'LOCAL_UPLOAD_COMPATIBILITY_CANDIDATE',activations:Object.freeze(activations),birthDetails:Object.freeze(birthDetails),issues:Object.freeze(issues),customerConfirmationRequired:true,astronomicalCorrectnessEstablished:false,productionUploadActivated:false})});
}
