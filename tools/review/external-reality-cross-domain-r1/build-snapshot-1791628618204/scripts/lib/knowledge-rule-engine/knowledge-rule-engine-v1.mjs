import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {normalizeQuery,runPublishedRetrieval} from '../knowledge-runtime/knr-package-a-v1.mjs';
import {buildAdaptiveKnowledgeProjection} from '../knowledge-intelligence/package-k-d-v1.mjs';
const root=process.cwd();
const readJson=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const stable=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x,2)+'\n';
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
export function decideCoverageOutcome({coverage,ranking,partialThreshold=.35}){
 const results=ranking?.results??[];
 if(!results.length||coverage?.level==='none')return 'no_coverage';
 const eligible=results.filter(r=>r.exactMatch||r.bestMatchRatio>=partialThreshold);
 if(eligible.length>=2)return 'multi_node_match';
 if(results[0]?.exactMatch&&coverage?.level==='exact')return 'direct_match';
 return 'partial_coverage';
}
export async function loadRuleEngine(){
 const [registry,normalization,intents,coverageDecision,projectionContract,expansion]=await Promise.all([
  readJson('content/knowledge/runtime/knowledge-rule-engine/rule-registry-v1.json'),
  readJson('content/knowledge/runtime/knowledge-rule-engine/normalization-policy-v1.json'),
  readJson('content/knowledge/runtime/knowledge-rule-engine/intent-rules-v1.json'),
  readJson('content/knowledge/runtime/knowledge-rule-engine/coverage-decision-policy-v1.json'),
  readJson('content/knowledge/runtime/knowledge-rule-engine/projection-contract-v1.json'),
  readJson('content/knowledge/intelligence/expansion/relationship-mechanism-expansion.json')]);
 return {registry,normalization,intents,coverageDecision,projectionContract,expansion};
}
export function classifyIntent(query,locale,policy){const n=normalizeQuery(query);for(const [intent,r] of Object.entries(policy.intents)){if((r[locale]??[]).some(t=>n.includes(normalizeQuery(t))))return {intent,projectionPurpose:r.projectionPurpose,reason:`matched_${intent}`};}const r=policy.intents[policy.defaultIntent];return {intent:policy.defaultIntent,projectionPurpose:r.projectionPurpose,reason:'default_intent'};}
export async function runKnowledgeRuleEngine({query,locale='zh-Hans',intent='auto'}={}){
 const cfg=await loadRuleEngine();const normalizedQuery=normalizeQuery(query);
 if(!cfg.normalization.supportedLocales.includes(locale))return finalize({engineCode:'KRE-UNSUPPORTED-LOCALE',query:String(query??''),normalizedQuery,locale,outcome:'no_coverage',reason:'unsupported_locale',providerRequired:false,providerUsed:false,answerGenerationAllowed:false});
 if(normalizedQuery.length<cfg.normalization.minimumLength||normalizedQuery.length>cfg.normalization.maximumLength)return finalize({engineCode:'KRE-INVALID-QUERY',query:String(query??''),normalizedQuery,locale,outcome:'no_coverage',reason:'query_length_boundary',providerRequired:false,providerUsed:false,answerGenerationAllowed:false});
 const retrieval=await runPublishedRetrieval(query,locale);
 const classified=intent==='auto'?classifyIntent(query,locale,cfg.intents):{intent,projectionPurpose:intent,reason:'explicit_intent'};
 const outcome=decideCoverageOutcome({coverage:retrieval.coverage,ranking:retrieval.ranking,partialThreshold:.35});
 const top=retrieval.ranking.results[0]??null;
 const expansion=top?cfg.expansion.records.find(r=>r.nodeCode===top.nodeCode&&r.locale===locale):null;
 const projection=outcome==='no_coverage'?null:await buildAdaptiveKnowledgeProjection({query,locale,purpose:classified.projectionPurpose});
 const recommendations=retrieval.ranking.results.slice(0,5).map(r=>({nodeCode:r.nodeCode,locale:r.locale,title:r.title,href:r.href,score:r.score,exactMatch:r.exactMatch}));
 return finalize({engineCode:'KRE-DETERMINISTIC-PUBLISHED-RESULT',query:String(query??''),normalizedQuery,locale,intent:classified,outcome,route:retrieval.route,ranking:retrieval.ranking,coverage:retrieval.coverage,relationshipExpansion:expansion?{explicitRelationships:expansion.explicitRelationships,mechanismFacets:expansion.mechanismFacets}:null,articleRecommendations:recommendations,projectionContract:projection?{projectionCode:projection.projectionCode,projectionDigest:projection.projectionDigest,purpose:projection.purpose,entryNodeCode:projection.entryNodeCode,blockCodes:projection.blocks.map(b=>b.blockCode),fragmentCodes:projection.fragments.map(f=>f.fragmentCode),sourceTextPreserved:projection.sourceTextPreserved,newCanonicalMeaning:projection.newCanonicalMeaning,generatedAnswer:projection.generatedAnswer,providerUsed:projection.providerUsed}:null,providerRequired:false,providerUsed:false,answerGenerationAllowed:false});
}
function finalize(base){return {...base,resultDigest:sha(base)};}
export async function buildCompiledRuleEngine(){const cfg=await loadRuleEngine();const sources={ruleRegistryDigest:sha(cfg.registry),normalizationDigest:sha(cfg.normalization),intentRulesDigest:sha(cfg.intents),coverageDecisionDigest:sha(cfg.coverageDecision),projectionContractDigest:sha(cfg.projectionContract)};const base={engineCode:'PHI-OS-KNOWLEDGE-RULE-ENGINE-COMPILED-v1.0.0',version:'1.0.0',runtimeMode:'static_json_deterministic_rules',providerEnabled:false,answerGenerationAllowed:false,outcomes:cfg.coverageDecision.outcomes,ruleCodes:cfg.registry.rules.map(r=>r.ruleCode),sources};return {...base,engineDigest:sha(base)};}
export async function writeCompiledRuleEngine(){const doc=await buildCompiledRuleEngine();const p=path.join(root,'content/knowledge/runtime/knowledge-rule-engine/compiled-rule-engine-v1.json');await fs.writeFile(p,stable(doc));return doc;}
export {stable,sha};
