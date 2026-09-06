import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../..');
const readJson=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const TOPICS=readJson('content/embodied-configuration/ecr-topic-r1/registries/ecr-topic-registry-v1.json');
const MATRIX=readJson('content/embodied-configuration/ecr-topic-r1/registries/ecr-topic-semantic-owner-matrix-v1.json');
const ACCESS=readJson('content/embodied-configuration/ecr-topic-r1/contracts/ecr-topic-access-contract-v1.json');
const ATOMIC=readJson('content/embodied-configuration/meaning/ecr-atomic-meaning-registry-v1.json');

export const ECR_TOPIC_PROJECTION_SCHEMA='PHI-OS-ECR-TOPIC-PROJECTION-v1.0.0';
const list=v=>Array.isArray(v)?v:[];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const fail=(code,details={})=>{throw Object.assign(new Error(code),{code,...details})};
const findAtomic=id=>ATOMIC.entries.find(x=>x.coordinate===id)||null;
const topicBy=id=>TOPICS.topics.find(x=>x.topicId===id)||null;
const local=(obj,locale,key,keyZh)=>locale==='zh-Hans'?(obj?.[keyZh]||obj?.[key]||''):(obj?.[key]||obj?.[keyZh]||'');
const unique=xs=>[...new Set(xs.filter(Boolean))];

function selectedOwners(mandala){
  const selected=mandala?.selected;if(!selected)fail('ECR_TOPIC_MANDALA_SELECTED_REQUIRED');
  const d=list(selected.driverPriority).filter(x=>Number(x?.rank)<=3).map(x=>({layer:'D',id:x.driverId,role:`D_RANK_${x.rank}`}));
  return [
    {layer:'G',id:selected.grammarId,role:'G'},
    {layer:'Q',id:selected.questionId,role:'Q'},
    {layer:'R',id:selected.primaryCapabilityId,role:'R_PRIMARY'},
    ...list(selected.supportingCapabilityIds).map(id=>({layer:'R',id,role:'R_SUPPORTING'})),
    ...d,
    {layer:'M',id:selected.motionId,role:'M'},
    {layer:'A',id:selected.activationId,role:'A'}
  ].filter(x=>x.id);
}
function ownerWeight(owner){
  if(owner.role?.startsWith('D_RANK_')) return MATRIX.weights[owner.role]||0;
  return MATRIX.weights[owner.role]||MATRIX.weights[owner.layer]||0;
}
function classify(score){
  if(score>=MATRIX.classification.PRIMARY)return 'PRIMARY';
  if(score>=MATRIX.classification.SUPPORTING)return 'SUPPORTING';
  if(score>=MATRIX.classification.BACKGROUND)return 'BACKGROUND';
  return 'LIMITED';
}
function projectTopic(mandala,topicId,{locale='en',accessState='FREE_PREVIEW'}={}){
  const topic=topicBy(topicId),matrix=MATRIX.topics[topicId];
  if(!topic||!matrix)fail('ECR_TOPIC_UNKNOWN',{topicId});
  if(!ACCESS.states[accessState])fail('ECR_TOPIC_ACCESS_STATE_INVALID',{accessState});
  const selected=selectedOwners(mandala);
  const matched=selected.filter(owner=>list(matrix[owner.layer]).includes(owner.id)).map(owner=>{
    const atomic=findAtomic(owner.id);return freeze({layer:owner.layer,nodeId:owner.id,role:owner.role,weight:ownerWeight(owner),label:local(atomic,locale,'label','labelZhHans'),definition:local(atomic,locale,'definition','definitionZhHans')});
  });
  const score=matched.reduce((sum,x)=>sum+x.weight,0),classification=classify(score);
  const ordered=[...matched].sort((a,b)=>b.weight-a.weight||a.nodeId.localeCompare(b.nodeId));
  const freeNodeIds=unique(ordered.slice(0,ACCESS.states.FREE_PREVIEW.maxNodeIds).map(x=>x.nodeId));
  const result={topicId,label:local(topic,locale,'label','labelZhHans'),classification,preview:local(topic,locale,'preview','previewZhHans'),nodeIds:accessState==='FREE_PREVIEW'?freeNodeIds:unique(ordered.map(x=>x.nodeId))};
  if(accessState==='PAID'){
    result.matchedOwners=ordered;
    result.narrative={
      topicRelevance:local(topic,locale,'purpose','purposeZhHans'),
      matchedSignals:ordered.map(x=>({nodeId:x.nodeId,label:x.label,definition:x.definition,role:x.role})),
      composition:classification==='LIMITED'
        ? (locale==='zh-Hans'?'当前构型与这个主题的受治理交集有限，因此不应强行延伸解释。':'The governed intersection between the current configuration and this topic is limited, so the reading should not be stretched beyond the available evidence.')
        : (locale==='zh-Hans'?`这个主题目前由 ${ordered.map(x=>`${x.label}（${x.nodeId}）`).join('、')} 共同构成可读交集。`:`This topic currently has a readable intersection through ${ordered.map(x=>`${x.label} (${x.nodeId})`).join(', ')}.`),
      unknowns:locale==='zh-Hans'?'Topic projection 只说明当前 ECR 构型中哪些已存在 owner 与这个现实领域更相关；它不能替代真实情境资料。':'Topic projection only shows which already-present ECR owners are more relevant to this real-life domain; it cannot replace lived-context evidence.'
    };
    result.realityQuestion=local(topic,locale,'realityQuestion','realityQuestionZhHans');
  }
  return freeze(result);
}

export function buildEcrTopicProjection(mandala,{locale='en',accessState='FREE_PREVIEW',topicIds=null}={}){
  if(!mandala?.schemaVersion||!String(mandala.schemaVersion).includes('ECR-CUSTOMER-MANDALA-PROJECTION'))fail('ECR_TOPIC_MANDALA_PROJECTION_REQUIRED');
  const ids=topicIds?list(topicIds):TOPICS.topics.map(x=>x.topicId);
  const topics=ids.map(id=>projectTopic(mandala,id,{locale,accessState}));
  return freeze({
    schemaVersion:ECR_TOPIC_PROJECTION_SCHEMA,
    work:'ECR-TOPIC-R1-W10-W16',
    status:accessState==='PAID'?'PAID_TOPIC_READING_READY':'FREE_TOPIC_PREVIEW_READY',
    projectionRule:'INTERSECTION_ONLY',
    accessState,
    sourceMandalaProjectionId:mandala.projectionId||null,
    locale,
    topics
  });
}
export default Object.freeze({buildEcrTopicProjection});
