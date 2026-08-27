import {cleanExternalProfileText} from './external-profile-contract.js';

const FIELD_SPECS=Object.freeze([
  ['type',['type','类型','類型']],
  ['authority',['authority','inner authority','内在权威','內在權威','权威','權威']],
  ['profile',['profile','人生角色','角色']],
  ['definition',['definition','定义','定義']],
  ['incarnationCross',['incarnation cross','cross','轮回交叉','輪迴交叉','人生主题','人生主題']],
  ['cognition',['cognition','认知','認知','内视','內視']],
  ['determination',['determination','digestion','摄取','攝取','饮食','飲食']],
  ['environment',['environment','环境','環境']],
  ['perspective',['perspective','view','观点','觀點','视角','視角']],
  ['motivation',['motivation','动机','動機']],
  ['trajectory',['trajectory','轨迹','軌跡','运行方向','運行方向']]
]);

const compact=value=>cleanExternalProfileText(value,600).replace(/^[\s:：\-|]+|[\s|]+$/g,'').trim();
const normalizedLabel=value=>String(value??'').toLowerCase().replace(/[\s_\-()（）]/g,'');
const ALIAS_TO_FIELD=new Map(FIELD_SPECS.flatMap(([field,aliases])=>aliases.map(alias=>[normalizedLabel(alias),field])));

function parseLabelValue(line){
  const explicit=line.match(/^\s*([^:：]{1,48})\s*[:：]\s*(.+?)\s*$/);
  if(explicit){
    const field=ALIAS_TO_FIELD.get(normalizedLabel(explicit[1]));
    if(field)return {field,value:compact(explicit[2]),confidence:'HIGH',matchType:'EXPLICIT_LABEL'};
  }
  for(const [field,aliases] of FIELD_SPECS){
    for(const alias of aliases){
      const re=new RegExp(`^\\s*${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s+(.+?)\\s*$`,'i');
      const match=line.match(re);
      if(match)return {field,value:compact(match[1]),confidence:'MEDIUM',matchType:'LEADING_LABEL'};
    }
  }
  return null;
}

function candidate(field,value,lineNumber,confidence,matchType){
  return Object.freeze({
    field,
    rawValue:value,
    normalizedValue:value,
    sourceType:'CUSTOMER_PASTED_TEXT',
    sourceRegion:`PASTED_TEXT:LINE_${lineNumber}`,
    extractionConfidence:confidence,
    extractionRule:matchType,
    customerConfirmed:false,
    phiosCalculated:false
  });
}

export function parseHumanDesignProfileText(text){
  const source=cleanExternalProfileText(text,12000);
  if(!source)return Object.freeze({candidates:Object.freeze([]),unresolved:Object.freeze([]),conflicts:Object.freeze([])});
  const byField=new Map();
  const conflicts=[];
  const lines=source.split(/\r?\n/);
  lines.forEach((raw,index)=>{
    const line=compact(raw);
    if(!line)return;
    const parsed=parseLabelValue(line);
    if(!parsed||!parsed.value)return;
    const next=candidate(parsed.field,parsed.value,index+1,parsed.confidence,parsed.matchType);
    const existing=byField.get(parsed.field);
    if(!existing)byField.set(parsed.field,next);
    else if(existing.normalizedValue!==next.normalizedValue)conflicts.push(Object.freeze({
      field:parsed.field,
      values:Object.freeze([existing.normalizedValue,next.normalizedValue]),
      sourceRegions:Object.freeze([existing.sourceRegion,next.sourceRegion]),
      status:'CUSTOMER_REVIEW_REQUIRED'
    }));
  });
  const candidates=[...byField.values()];
  const unresolved=[];
  if(!candidates.some(item=>item.field==='type'))unresolved.push('TYPE_NOT_FOUND_IN_PASTED_TEXT');
  if(!candidates.some(item=>item.field==='authority'))unresolved.push('AUTHORITY_NOT_FOUND_IN_PASTED_TEXT');
  if(!candidates.some(item=>item.field==='profile'))unresolved.push('PROFILE_NOT_FOUND_IN_PASTED_TEXT');
  return Object.freeze({
    candidates:Object.freeze(candidates),
    unresolved:Object.freeze(unresolved),
    conflicts:Object.freeze(conflicts)
  });
}
