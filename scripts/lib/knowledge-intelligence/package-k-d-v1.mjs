import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {runPublishedRetrieval,normalizeQuery,stable,sha} from '../knowledge-runtime/knr-package-a-v1.mjs';

const root=process.cwd();
const read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const uniq=a=>[...new Set(a)];

async function loadKD(){
 const [pathPolicy,projectionPolicy,compression,assembly,profiles,graph,quality]=await Promise.all([
  read('content/knowledge/runtime/knowledge-intelligence/package-k-d/dynamic-reading-path-policy-v1.json'),
  read('content/knowledge/runtime/knowledge-intelligence/package-k-d/adaptive-knowledge-projection-policy-v1.json'),
  read('content/knowledge/intelligence/compression/knowledge-compression.json'),
  read('content/knowledge/intelligence/assembly/canonical-assembly.json'),
  read('content/knowledge/intelligence/semantic-profiles/published-semantic-profiles.json'),
  read('content/knowledge/intelligence/graph/published-knowledge-graph.json'),
  read('content/knowledge/public/quality/published-quality-evaluation.json').catch(()=>({status:'not_evaluated',digest:null}))
 ]);
 return {pathPolicy,projectionPolicy,compression,assembly,profiles,graph,quality};
}

export async function classifyReadingPurpose(query,locale='zh-Hans',requested='auto'){
 const {pathPolicy}=await loadKD();
 if(!pathPolicy.supportedLocales.includes(locale)) throw new Error(`KID_READING_LOCALE_INVALID: ${locale}`);
 if(requested!=='auto'){
  if(!pathPolicy.supportedPurposes.includes(requested)) throw new Error(`KID_READING_PURPOSE_INVALID: ${requested}`);
  return {purpose:requested,reason:'explicit_purpose'};
 }
 const n=normalizeQuery(query);
 for(const p of ['deep_reading','continuity','mechanism','theme']){
  const terms=pathPolicy.intentRules[p]?.[locale]??[];
  if(terms.some(t=>n.includes(normalizeQuery(t)))) return {purpose:p,reason:`matched_${p}_intent`};
 }
 return {purpose:pathPolicy.defaultPurpose,reason:'default_purpose'};
}

function scoreBlock(block,query,purpose,top){
 let score=0;
 if(block.nodeCodes.includes(top.nodeCode))score+=100;
 if(block.locale===top.locale)score+=50;
 if(block.blockType===purpose)score+=30;
 if(purpose==='deep_reading')score+=10;
 const n=normalizeQuery(query);
 for(const code of [...block.mechanismCodes,...block.domainCodes]){
  if(n.includes(normalizeQuery(code.replaceAll('_',' '))))score+=12;
 }
 for(const f of block.fragments){
  const ft=normalizeQuery(f.text);
  const tokens=n.split(/\s+/).filter(Boolean);
  score+=tokens.filter(t=>ft.includes(t)).length;
 }
 return score;
}

export async function buildDynamicReadingPath({query,locale='zh-Hans',purpose='auto'}={}){
 const data=await loadKD();
 const retrieval=await runPublishedRetrieval(query,locale);
 const intent=await classifyReadingPurpose(query,locale,purpose);
 const top=retrieval.ranking.results[0]??null;
 if(!top||!retrieval.coverage.supported){
  const base={pathCode:'KID-DYNAMIC-PATH-NO-COVERAGE',query:String(query??''),locale,purpose:intent.purpose,purposeReason:intent.reason,coverage:retrieval.coverage,entryNodeCode:null,steps:[],blockedContinuations:[],generatedAnswer:false,providerUsed:false};
  return {...base,pathDigest:sha(base)};
 }
 const order=data.pathPolicy.purposeOrder[intent.purpose]??data.pathPolicy.purposeOrder.overview;
 const candidates=data.compression.blocks
  .filter(b=>b.locale===locale&&b.nodeCodes.includes(top.nodeCode))
  .map(b=>({...b,_score:scoreBlock(b,query,intent.purpose,top),_order:order.indexOf(b.blockType)}))
  .filter(b=>b._order>=0)
  .sort((a,b)=>a._order-b._order||b._score-a._score||a.blockCode.localeCompare(b.blockCode));
 const chosen=[]; const seen=new Set();
 for(const block of candidates){
  const key=block.blockCode;
  if(!seen.has(key)&&chosen.length<data.pathPolicy.maximumSteps){seen.add(key);chosen.push(block);}
 }
 const steps=chosen.map((b,i)=>({step:i+1,stepType:'controlled_knowledge_block',blockCode:b.blockCode,blockDigest:b.blockDigest,blockType:b.blockType,blockKey:b.blockKey,nodeCodes:b.nodeCodes,locale:b.locale,fragmentCodes:b.fragmentCodes,reason:i===0?'purpose_primary_block':'purpose_supporting_block'}));
 const blockedContinuations=uniq(chosen.flatMap(b=>b.relationshipTargets??[]).filter(r=>!r.targetPublished).map(r=>`${r.type}:${r.targetNodeCode}`)).map(key=>{const [relationshipType,targetNodeCode]=key.split(':');return {relationshipType,targetNodeCode,locale,reason:'target_not_published_in_requested_locale',navigable:false};});
 const base={pathCode:'KID-DYNAMIC-PUBLISHED-KNOWLEDGE-PATH',query:String(query??''),locale,purpose:intent.purpose,purposeReason:intent.reason,coverage:retrieval.coverage,entryNodeCode:top.nodeCode,steps,blockedContinuations,qualityStatus:data.quality.status??'unknown',generatedAnswer:false,providerUsed:false};
 return {...base,pathDigest:sha(base)};
}

export async function buildAdaptiveKnowledgeProjection({query,locale='zh-Hans',purpose='auto'}={}){
 const data=await loadKD();
 const readingPath=await buildDynamicReadingPath({query,locale,purpose});
 if(!readingPath.entryNodeCode){
  const base={projectionCode:'KID-ADAPTIVE-PROJECTION-NO-COVERAGE',query:String(query??''),locale,purpose:readingPath.purpose,readingPathDigest:readingPath.pathDigest,blocks:[],fragments:[],sourceTextPreserved:true,generatedAnswer:false,generatedSummary:false,providerUsed:false,reason:'no_published_coverage'};
  return {...base,projectionDigest:sha(base)};
 }
 const blockMap=new Map(data.compression.blocks.map(b=>[b.blockCode,b]));
 const blocks=readingPath.steps.map(s=>blockMap.get(s.blockCode)).filter(Boolean).slice(0,data.projectionPolicy.maximumBlocks);
 const fragmentMap=new Map();
 for(const b of blocks)for(const f of b.fragments)if(!fragmentMap.has(f.fragmentCode))fragmentMap.set(f.fragmentCode,f);
 const fragments=[...fragmentMap.values()].sort((a,b)=>a.ordinal-b.ordinal||a.fragmentCode.localeCompare(b.fragmentCode)).slice(0,data.projectionPolicy.maximumFragments);
 const base={
  projectionCode:'KID-ADAPTIVE-CONTROLLED-KNOWLEDGE-PROJECTION',query:String(query??''),locale,purpose:readingPath.purpose,
  readingPathDigest:readingPath.pathDigest,entryNodeCode:readingPath.entryNodeCode,qualityStatus:readingPath.qualityStatus,
  blocks:blocks.map(b=>({blockCode:b.blockCode,blockDigest:b.blockDigest,blockType:b.blockType,blockKey:b.blockKey,nodeCodes:b.nodeCodes,fragmentCodes:b.fragmentCodes,mechanismCodes:b.mechanismCodes,domainCodes:b.domainCodes})),
  fragments:fragments.map(f=>({fragmentCode:f.fragmentCode,ordinal:f.ordinal,kind:f.kind,text:f.text,digest:f.digest})),
  blockedContinuations:readingPath.blockedContinuations,sourceTextPreserved:true,newCanonicalMeaning:false,generatedAnswer:false,generatedSummary:false,providerUsed:false
 };
 return {...base,projectionDigest:sha(base)};
}

export async function buildPackageKDCatalog(){
 const data=await loadKD();
 const paths=[];
 for(const profile of data.profiles.profiles){
  for(const purpose of ['overview','mechanism','theme','continuity','deep_reading']){
   const blocks=data.compression.blocks.filter(b=>b.locale===profile.locale&&b.nodeCodes.includes(profile.nodeCode)&&(purpose==='deep_reading'||b.blockType===purpose|| (purpose==='overview'&&['overview','theme','continuity'].includes(b.blockType))));
   const base={catalogPathCode:`KID-CATALOG-${profile.nodeCode}-${profile.locale.toUpperCase()}-${purpose.toUpperCase()}`,nodeCode:profile.nodeCode,locale:profile.locale,purpose,blockCodes:blocks.map(b=>b.blockCode).sort(),publishedOnly:true};
   paths.push({...base,catalogPathDigest:sha(base)});
  }
 }
 paths.sort((a,b)=>a.catalogPathCode.localeCompare(b.catalogPathCode));
 const pathBase={version:'1.0.0',pathCount:paths.length,paths,sourceCompressionDigest:data.compression.digest,sourceProfileDigest:data.profiles.digest,sourceGraphDigest:data.graph.digest};
 const pathDoc={...pathBase,digest:sha(pathBase)};
 const projectionProfiles=paths.map(p=>{const base={projectionProfileCode:p.catalogPathCode.replace('CATALOG','PROJECTION-PROFILE'),nodeCode:p.nodeCode,locale:p.locale,purpose:p.purpose,blockCodes:p.blockCodes,outputKind:'controlled_knowledge_projection',generatedAnswer:false,sourceTextPreserved:true};return {...base,projectionProfileDigest:sha(base)};});
 const projBase={version:'1.0.0',profileCount:projectionProfiles.length,profiles:projectionProfiles,sourcePathDigest:pathDoc.digest,qualityStatus:data.quality.status??'unknown'};
 return {readingPaths:pathDoc,projectionProfiles:{...projBase,digest:sha(projBase)}};
}

export async function writePackageKD(){
 const {readingPaths,projectionProfiles}=await buildPackageKDCatalog();
 await fs.mkdir(path.join(root,'content/knowledge/intelligence/reading'),{recursive:true});
 await fs.mkdir(path.join(root,'content/knowledge/intelligence/projection'),{recursive:true});
 await fs.writeFile(path.join(root,'content/knowledge/intelligence/reading/dynamic-reading-paths.json'),stable(readingPaths));
 await fs.writeFile(path.join(root,'content/knowledge/intelligence/projection/adaptive-knowledge-projections.json'),stable(projectionProfiles));
 return {readingPaths,projectionProfiles};
}
