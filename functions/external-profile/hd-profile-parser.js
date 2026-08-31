import {cleanExternalProfileText} from './external-profile-contract.js';

const FIELD_SPECS=Object.freeze([
  ['type',['type','类型','類型']],
  ['strategy',['strategy','策略']],
  ['authority',['authority','inner authority','internal authority','内在权威','內在權威','权威','權威']],
  ['profile',['profile','人生角色','角色']],
  ['definition',['definition','定义','定義']],
  ['incarnationCross',['incarnation cross','cross','轮回交叉','輪迴交叉','人生主题','人生主題']],
  ['signature',['signature','签名','簽名']],
  ['notSelfTheme',['not-self theme','not self theme','not-self','not self','非自己主题','非自己主題','非自己']],
  ['variable',['variable','variables','变量','變量']],
  ['cognition',['cognition','认知','認知','内视','內視']],
  ['determination',['determination','digestion','摄取','攝取','饮食','飲食']],
  ['environment',['environment','环境','環境']],
  ['perspective',['perspective','view','观点','觀點','视角','視角']],
  ['motivation',['motivation','动机','動機']],
  ['trajectory',['trajectory','轨迹','軌跡','运行方向','運行方向']]
]);
const STRUCTURAL_SPECS=Object.freeze({
  channels:['channels','channel','通道'],
  definedCenters:['defined centers','defined center','定义中心','定義中心','已定义中心','已定義中心'],
  openCenters:['open centers','open center','undefined centers','undefined center','开放中心','開放中心','未定义中心','未定義中心'],
  designActivations:['design activated gate','design activated gates','design activations','设计激活闸门','設計激活閘門','设计激活','設計激活'],
  personalityActivations:['personality activated gate','personality activated gates','personality activations','人格激活闸门','人格激活閘門','人格激活']
});
const CENTER_ALIASES=Object.freeze([
  ['HEAD',['head','头','頭','头顶','頭頂']],['AJNA',['ajna','逻辑中心','邏輯中心','阿基那']],['THROAT',['throat','喉咙','喉嚨','喉中心']],['G',['g center','g-center','g中心','方向中心']],['EGO',['ego','will','heart','意志','意志力','心脏','心臟']],['SPLEEN',['spleen','脾','脾中心']],['SOLAR_PLEXUS',['solar plexus','emotional','情绪中心','情緒中心','太阳神经丛','太陽神經叢']],['SACRAL',['sacral','骶骨','薦骨']],['ROOT',['root','根部','根中心']]
]);
const BODY_ALIASES=Object.freeze([
  ['SUN',['sun','太阳','太陽']],['EARTH',['earth','地球']],['MOON',['moon','月亮']],['NORTH_NODE',['north node','northnode','北交点','北交點']],['SOUTH_NODE',['south node','southnode','南交点','南交點']],['MERCURY',['mercury','水星']],['VENUS',['venus','金星']],['MARS',['mars','火星']],['JUPITER',['jupiter','木星']],['SATURN',['saturn','土星']],['URANUS',['uranus','天王星']],['NEPTUNE',['neptune','海王星']],['PLUTO',['pluto','冥王星']]
]);

const stripLayoutNoise=value=>String(value??'').replace(/[\uE000-\uF8FF]/g,' ').replace(/^[\s|*_`#>•·→←↔]+|[\s|*_`]+$/g,'').replace(/\s+/g,' ').trim();
const compact=value=>stripLayoutNoise(cleanExternalProfileText(value,1200).replace(/^[\s:：\-|]+|[\s|]+$/g,''));
const normalizedLabel=value=>stripLayoutNoise(value).toLowerCase().replace(/[\s_\-:：()（）]/g,'');
const ALIAS_TO_FIELD=new Map(FIELD_SPECS.flatMap(([field,aliases])=>aliases.map(alias=>[normalizedLabel(alias),field])));
const CENTER_LOOKUP=new Map(CENTER_ALIASES.flatMap(([code,aliases])=>aliases.map(alias=>[normalizedLabel(alias),code])));
const BODY_LOOKUP=new Map(BODY_ALIASES.flatMap(([code,aliases])=>aliases.map(alias=>[normalizedLabel(alias),code])));

function exactFieldLabel(value){return ALIAS_TO_FIELD.get(normalizedLabel(value))||null}
function parseLabelValue(line){
  const explicit=line.match(/^\s*([^:：]{1,64})\s*[:：]\s*(.+?)\s*$/);
  if(explicit){
    const field=exactFieldLabel(explicit[1]);
    if(field)return {field,value:compact(explicit[2]),confidence:'HIGH',matchType:'EXPLICIT_LABEL'};
  }
  for(const [field,aliases] of FIELD_SPECS){
    for(const alias of aliases){
      const re=new RegExp(`^\\s*${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s+(.+?)\\s*$`,'i');
      const match=line.match(re);
      if(match&&!/[：:]/.test(match[1]))return {field,value:compact(match[1]),confidence:'MEDIUM',matchType:'LEADING_LABEL'};
    }
  }
  return null;
}
function candidate(field,value,lineNumber,confidence,matchType,sourceType,sourceRegionPrefix){return Object.freeze({field,rawValue:value,normalizedValue:value,sourceType,sourceRegion:`${sourceRegionPrefix}:LINE_${lineNumber}`,extractionConfidence:confidence,extractionRule:matchType,customerConfirmed:false,phiosCalculated:false})}
function structuralCandidate(field,value,lineNumber,confidence,matchType,sourceType,sourceRegionPrefix){return Object.freeze({field,rawValue:value,normalizedValue:value,sourceType,sourceRegion:`${sourceRegionPrefix}:LINE_${lineNumber}`,extractionConfidence:confidence,extractionRule:matchType,customerConfirmed:false,phiosCalculated:false})}
function prefixedValue(line,aliases){for(const alias of aliases){const re=new RegExp(`^\\s*${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*(?:[:：]|\\s)\\s*(.+?)\\s*$`,'i');const match=line.match(re);if(match)return compact(match[1])}return null}
function gateLineTokens(value){return [...String(value||'').matchAll(/\b([1-9]|[1-5]\d|6[0-4])\s*[.]\s*([1-6])\b/g)].map(match=>`${Number(match[1])}.${Number(match[2])}`)}
function parseChannels(value){const out=[];for(const match of String(value||'').matchAll(/\b([1-9]|[1-5]\d|6[0-4])\s*[–—-]\s*([1-9]|[1-5]\d|6[0-4])\b/g)){const a=Number(match[1]),b=Number(match[2]);if(a===b)continue;out.push(`${a}-${b}`)}return [...new Set(out)]}
function parseCenters(value){const text=String(value||'');const found=[];for(const [code,aliases] of CENTER_ALIASES){if(aliases.some(alias=>new RegExp(`(^|[^A-Za-z])${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^A-Za-z]|$)`,'i').test(text)))found.push(code)}return [...new Set(found)]}
function parseBodyGatePairs(line,layer){const pairs=[];for(const [body,aliases] of BODY_ALIASES){for(const alias of aliases){const re=new RegExp(`${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*[:：]?\\s*([1-9]|[1-5]\\d|6[0-4])\\s*[.]\\s*([1-6])`,'i');const m=line.match(re);if(m){pairs.push(Object.freeze({layer,bodyCode:body,gateLine:`${Number(m[1])}.${Number(m[2])}`}));break}}}return pairs}
function bodyCodeFromToken(value){return BODY_LOOKUP.get(normalizedLabel(value))||null}
function parseCompactBodyPairs(line,layer){const tokens=line.split(/\s+/),out=[];for(let i=0;i<tokens.length-1;i++){const body=bodyCodeFromToken(tokens[i]);const gate=tokens[i+1]?.match(/^([1-9]|[1-5]\d|6[0-4])[.]([1-6])$/);if(body&&gate)out.push(Object.freeze({layer,bodyCode:body,gateLine:`${Number(gate[1])}.${Number(gate[2])}`}))}return out}
function detectLayerHeading(line){const token=normalizedLabel(line);if(['design','设计','設計','designside'].map(normalizedLabel).includes(token))return 'DESIGN';if(['personality','人格','personalityside'].map(normalizedLabel).includes(token))return 'PERSONALITY';return null}

function splitWideColumns(raw){
  const line=String(raw??'').replace(/\t/g,'    '),chunks=[];
  for(const match of line.matchAll(/\S(?:.*?\S)?(?=\s{2,}|$)/g))chunks.push({text:match[0],start:match.index??0});
  return chunks;
}
function parseInlineWideColumns(raw,lineNumber,sourceType,sourceRegionPrefix){
  const chunks=splitWideColumns(raw),out=[];
  if(chunks.length<2)return out;
  for(const chunk of chunks){const parsed=parseLabelValue(compact(chunk.text));if(parsed?.value)out.push(candidate(parsed.field,parsed.value,lineNumber,'HIGH','COLUMN_INLINE_LABEL_VALUE',sourceType,sourceRegionPrefix));}
  return out.length?out:[];
}
function alignedLabelColumns(raw){
  const chunks=splitWideColumns(raw),labels=chunks.map(chunk=>({...chunk,field:exactFieldLabel(chunk.text)}));
  if(labels.length<2||labels.filter(item=>item.field).length<2)return null;
  if(labels.some(item=>!item.field))return null;
  return labels;
}
function layoutValueCells(raw){
  const line=String(raw??'').replace(/\t/g,'    '),iconStarts=[...line.matchAll(/[\uE000-\uF8FF]/g)].map(match=>match.index??0);
  if(iconStarts.length>=2)return iconStarts.map((start,index)=>({text:line.slice(start,iconStarts[index+1]??line.length),start}));
  return splitWideColumns(line);
}
function nearestColumnIndex(start,labels){let best=0,distance=Infinity;for(let i=0;i<labels.length;i++){const next=Math.abs(start-labels[i].start);if(next<distance){distance=next;best=i}}return best}
function parseAlignedLabelValueRows(lines,sourceType,sourceRegionPrefix){
  const out=[];
  for(let i=0;i<lines.length;i++){
    const labels=alignedLabelColumns(lines[i]);if(!labels)continue;
    const values=labels.map(()=>[]);let j=i+1,hasValueRow=false;
    for(;j<lines.length;j++){
      const raw=String(lines[j]??'');if(!raw.trim())break;if(alignedLabelColumns(raw))break;
      const cells=layoutValueCells(raw);if(!cells.length)continue;
      if(!hasValueRow&&cells.length===labels.length){cells.forEach((cell,index)=>{const piece=compact(cell.text);if(piece)values[index].push(piece)});hasValueRow=true;continue}
      for(const cell of cells){const piece=compact(cell.text);if(!piece)continue;values[nearestColumnIndex(cell.start,labels)].push(piece)}
      hasValueRow=true;
    }
    for(let c=0;c<labels.length;c++){
      const value=compact(values[c].join(' '));if(value)out.push(candidate(labels[c].field,value,i+1,'HIGH','ALIGNED_COLUMN_LABEL_VALUE',sourceType,sourceRegionPrefix));
    }
    if(j>i+1)i=j-1;
  }
  return out;
}
function parseMarkdownTableRows(lines,sourceType,sourceRegionPrefix){
  const out=[];
  for(let i=0;i<lines.length-1;i++){
    const raw=String(lines[i]??'');if(!raw.includes('|'))continue;
    const labels=raw.split('|').map(compact).filter(Boolean).map(text=>({text,field:exactFieldLabel(text)}));
    if(labels.length<2||labels.some(item=>!item.field))continue;
    let j=i+1;while(j<lines.length&&/^\s*\|?\s*:?-{2,}/.test(lines[j]))j++;
    if(j>=lines.length||!String(lines[j]).includes('|'))continue;
    const values=String(lines[j]).split('|').map(compact).filter(Boolean);if(values.length!==labels.length)continue;
    labels.forEach((label,index)=>{if(values[index])out.push(candidate(label.field,values[index],i+1,'HIGH','MARKDOWN_TABLE_LABEL_VALUE',sourceType,sourceRegionPrefix))});
  }
  return out;
}
function parseSequentialLabelBlocks(lines,sourceType,sourceRegionPrefix){
  const labelIndexes=[];for(let i=0;i<lines.length;i++){const field=exactFieldLabel(compact(lines[i]));if(field)labelIndexes.push({index:i,field})}
  const branded=/maia mechanics|jovian archive|human design software from jovian archive/i.test(lines.join('\n'));
  if(labelIndexes.length<3)return [];
  const out=[];
  for(let n=0;n<labelIndexes.length;n++){
    const {index,field}=labelIndexes[n],nextIndex=labelIndexes[n+1]?.index??lines.length;const pieces=[];
    for(let j=index+1;j<nextIndex;j++){
      const value=compact(lines[j]);if(!value)continue;
      if(/^(birth data|properties|design|personality|generated by|powered by|copyright|licensed to)\b/i.test(value))break;
      pieces.push(value);
    }
    const value=compact(pieces.join(' '));if(value)out.push(candidate(field,value,index+1,branded?'HIGH':'MEDIUM',branded?'JOVIAN_MAIA_STACKED_LABEL_VALUE':'STACKED_LABEL_VALUE',sourceType,sourceRegionPrefix));
  }
  return out;
}
function adapterCandidates(lines,sourceType,sourceRegionPrefix){
  return [...parseAlignedLabelValueRows(lines,sourceType,sourceRegionPrefix),...parseMarkdownTableRows(lines,sourceType,sourceRegionPrefix),...parseSequentialLabelBlocks(lines,sourceType,sourceRegionPrefix)];
}

export function parseHumanDesignProfileText(text,{sourceType='CUSTOMER_PASTED_TEXT',sourceRegionPrefix='PASTED_TEXT'}={}){
  const source=cleanExternalProfileText(text,24000);
  if(!source)return Object.freeze({candidates:Object.freeze([]),structuralCandidates:Object.freeze([]),unresolved:Object.freeze([]),conflicts:Object.freeze([])});
  const byField=new Map(),conflicts=[],structure={channels:[],definedCenters:[],openCenters:[],activations:[]};
  const rawLines=source.split(/\r?\n/);let activeLayer=null;
  const addCandidate=next=>{if(!next?.field||next.normalizedValue==null||next.normalizedValue==='')return;const existing=byField.get(next.field);if(!existing)byField.set(next.field,next);else if(existing.normalizedValue!==next.normalizedValue)conflicts.push(Object.freeze({field:next.field,values:Object.freeze([existing.normalizedValue,next.normalizedValue]),sourceRegions:Object.freeze([existing.sourceRegion,next.sourceRegion]),status:'CUSTOMER_REVIEW_REQUIRED'}));};
  for(const next of adapterCandidates(rawLines,sourceType,sourceRegionPrefix))addCandidate(next);
  rawLines.forEach((raw,index)=>{
    const line=compact(raw);if(!line)return;
    const heading=detectLayerHeading(line);if(heading){activeLayer=heading;return}
    const labelColumns=alignedLabelColumns(raw),inline=parseInlineWideColumns(raw,index+1,sourceType,sourceRegionPrefix);
    if(labelColumns||exactFieldLabel(line)){/* handled by the layout/stacked adapters above */}
    else if(inline.length)inline.forEach(addCandidate);else{
      const parsed=parseLabelValue(line);
      if(parsed&&parsed.value)addCandidate(candidate(parsed.field,parsed.value,index+1,parsed.confidence,parsed.matchType,sourceType,sourceRegionPrefix));
    }
    const channelText=prefixedValue(line,STRUCTURAL_SPECS.channels);if(channelText)structure.channels.push(...parseChannels(channelText));
    const definedText=prefixedValue(line,STRUCTURAL_SPECS.definedCenters);if(definedText)structure.definedCenters.push(...parseCenters(definedText));
    const openText=prefixedValue(line,STRUCTURAL_SPECS.openCenters);if(openText)structure.openCenters.push(...parseCenters(openText));
    const designText=prefixedValue(line,STRUCTURAL_SPECS.designActivations);if(designText)structure.activations.push(...gateLineTokens(designText).map(gateLine=>Object.freeze({layer:'DESIGN',bodyCode:null,gateLine})));
    const personalityText=prefixedValue(line,STRUCTURAL_SPECS.personalityActivations);if(personalityText)structure.activations.push(...gateLineTokens(personalityText).map(gateLine=>Object.freeze({layer:'PERSONALITY',bodyCode:null,gateLine})));
    if(activeLayer){structure.activations.push(...parseBodyGatePairs(line,activeLayer));structure.activations.push(...parseCompactBodyPairs(line,activeLayer));}
  });
  structure.channels=[...new Set(structure.channels)].sort();structure.definedCenters=[...new Set(structure.definedCenters)].sort();structure.openCenters=[...new Set(structure.openCenters)].sort();
  const activationMap=new Map();for(const item of structure.activations){const key=`${item.layer}:${item.bodyCode||''}:${item.gateLine}`;if(!activationMap.has(key))activationMap.set(key,item)}structure.activations=[...activationMap.values()];
  const structuralCandidates=[];
  if(structure.activations.length)structuralCandidates.push(structuralCandidate('activations',Object.freeze(structure.activations),1,'MEDIUM','STRUCTURAL_ACTIVATION_PARSE',sourceType,sourceRegionPrefix));
  if(structure.channels.length)structuralCandidates.push(structuralCandidate('channels',Object.freeze(structure.channels),1,'HIGH','EXPLICIT_CHANNEL_PARSE',sourceType,sourceRegionPrefix));
  if(structure.definedCenters.length)structuralCandidates.push(structuralCandidate('definedCenters',Object.freeze(structure.definedCenters),1,'HIGH','EXPLICIT_DEFINED_CENTER_PARSE',sourceType,sourceRegionPrefix));
  if(structure.openCenters.length)structuralCandidates.push(structuralCandidate('openCenters',Object.freeze(structure.openCenters),1,'HIGH','EXPLICIT_OPEN_CENTER_PARSE',sourceType,sourceRegionPrefix));
  const candidates=[...byField.values()],unresolved=[];
  if(!candidates.some(item=>item.field==='type'))unresolved.push('TYPE_NOT_FOUND');
  if(!candidates.some(item=>item.field==='authority'))unresolved.push('AUTHORITY_NOT_FOUND');
  return Object.freeze({candidates:Object.freeze(candidates),structuralCandidates:Object.freeze(structuralCandidates),unresolved:Object.freeze(unresolved),conflicts:Object.freeze(conflicts)});
}
