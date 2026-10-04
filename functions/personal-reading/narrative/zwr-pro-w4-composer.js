import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {invokeOpenAIStructured} from './narrative-provider.js';

export const ZWR_PRO_W4_COMPOSER_VERSION='ZWR-PRO-W4-LLM-PROFESSIONAL-COMPOSER-v1';
export const ZWR_PRO_W4_PROMPT_VERSION='ZWR-PRO-W4-PROMPT-v1';

const SECTION_OWNERSHIP=Object.freeze({
 S02:{titleZh:'核心运行方式',titleEn:'Core Orientation',owns:['LIFE_BODY_AXIS','DECISION_LOGIC','WHOLE_CHART_ORIENTATION']},
 S03:{titleZh:'内部结构',titleEn:'Inner Structure',owns:['WELLBEING','INNER_ACTIVATION','BOUNDARY_TENSION','RECOVERY_CONDITIONS']},
 S04:{titleZh:'工作与方向',titleEn:'Work & Direction',owns:['CAREER','WORK_STRUCTURE','EXTERNAL_EXECUTION','CAREER_TIMING_RELEVANCE']},
 S05:{titleZh:'资源与财富',titleEn:'Resources & Wealth',owns:['WEALTH','RESOURCE_ACQUISITION','ALLOCATION','RETENTION','OPTIONALITY']},
 S06:{titleZh:'关系运行',titleEn:'Relationships',owns:['SPOUSE','RELATIONSHIP_ROLES','RECIPROCITY','COMMUNICATION_REPAIR']},
 S07:{titleZh:'家庭与支持',titleEn:'Family & Support',owns:['PARENTS','SIBLINGS','FRIENDS','SUPPORT_RECEIVING','RESPONSIBILITY_DISTRIBUTION']},
 S08:{titleZh:'压力与脆弱点',titleEn:'Pressure & Vulnerability',owns:['HEALTH_PALACE_SYMBOLIC_PRESSURE','LOAD','BOUNDARY_PRESSURE','OUTPUT_RESERVE','RECOVERY']},
 S09:{titleZh:'长期周期',titleEn:'Long-term Cycles',owns:['DA_XIAN','LONG_CYCLE_FOREGROUND','LONG_CYCLE_TRANSFORMATIONS','PERSISTENT_PATTERN']},
 S10:{titleZh:'当前时序',titleEn:'Current Timing',owns:['LIU_NIAN','ANNUAL_FOREGROUND','ANNUAL_TRANSFORMATIONS','CURRENT_OBSERVATION_WINDOW']},
 S11:{titleZh:'现实导航',titleEn:'Reality Navigation',owns:['WHOLE_CHART_INTEGRATION','DECISION_NAVIGATION','REALITY_VALIDATION','REVISION_RULE']}
});
const ALLOWED_ROLES=['TECHNICAL_AXIS','SYNTHESIS','CONDITIONS','TENSION','TIMING','LIVED_TRANSLATION','NAVIGATION'];
const schema={
 type:'object',additionalProperties:false,
 required:['sectionId','title','paragraphs','usedClaimRefs','usedPalaceCodes','usedTransformationKeys'],
 properties:{
  sectionId:{type:'string'},title:{type:'string'},
  paragraphs:{type:'array',minItems:5,maxItems:12,items:{type:'object',additionalProperties:false,required:['role','text','claimRefs'],properties:{
   role:{type:'string',enum:ALLOWED_ROLES},text:{type:'string',minLength:40,maxLength:3200},claimRefs:{type:'array',minItems:1,items:{type:'string'},uniqueItems:true}
  }}},
  usedClaimRefs:{type:'array',minItems:1,items:{type:'string'},uniqueItems:true},
  usedPalaceCodes:{type:'array',items:{type:'string'},uniqueItems:true},
  usedTransformationKeys:{type:'array',items:{type:'string'},uniqueItems:true}
 }
};
function systemPrompt(locale){
 const zh=locale==='zh-Hans';
 return [
  'You are the PHI OS Zi Wei Dou Shu professional report writer. Writing authority only; never recalculate.',
  'The supplied customer-specific Authority Pack is the complete factual authority. Never import facts from the gold-standard reference.',
  'The reference profile controls depth, synthesis, customer voice, technical visibility and paragraph rhythm only; it is not customer semantic authority.',
  'Keep palace names, star names, known states, transformations and timing visibly present when the Authority Pack supplies them. Unknown states remain unknown.',
  'Qualified patterns may be named only as qualifications; do not import traditional fortune, wealth, marriage, health or event outcomes.',
  'Write one coherent paid professional reading, not a star glossary, governance memo, methodology note, or generic psychology article.',
  'Respect section ownership. Supporting references to other palaces remain subordinate and must not turn this section into another chapter.',
  'Do not invent biography, current events, months, medical diagnosis, financial recommendations, guaranteed outcomes, or hidden intentions.',
  zh?'Write natural publication-quality Simplified Chinese. Use direct customer voice such as “你的命盘／这张盘” where natural.':'Write natural publication-quality English in direct customer voice.',
  'Every paragraph must cite the supplied claim IDs that support it. usedClaimRefs is the union of all paragraph claimRefs.',
  'usedPalaceCodes and usedTransformationKeys are lineage declarations, not prose. Include only identities actually used in the prose.',
  'Return only the requested JSON.'
 ].join('\n');
}
function txKey(t){return [t.layer,t.palaceCode,t.targetStarCode,t.transformationCode].join(':');}
export async function composeZwrProSectionW4({authorityPack,sectionId,locale,env={},fetcher,provider}={}){
 if(authorityPack?.schemaVersion!=='ZIWEI-R5-AUTHORING-PACK-v2')throw Error('ZWR_PRO_W4_AUTHORITY_PACK_REQUIRED');
 if(authorityPack.locale!==locale||!['zh-Hans','en'].includes(locale))throw Error('ZWR_PRO_W4_LOCALE_MISMATCH');
 const section=authorityPack.sections.find(s=>s.sectionId===sectionId),ownership=SECTION_OWNERSHIP[sectionId];
 if(!section||!ownership)throw Error('ZWR_PRO_W4_SECTION_UNSUPPORTED');
 const claims=section.claims.map(c=>c.claimId),palaces=section.technicalEvidence.palaces.map(p=>p.palaceCode),transformations=section.technicalEvidence.transformations.map(txKey);
 const referenceProfile={qualityOnly:true,dimensions:['CONTENT_DEPTH','SECTION_ISOLATION','NARRATIVE_DENSITY','CUSTOMER_VOICE','TECHNICAL_GROUNDING','MULTI_PLACEMENT_SYNTHESIS','INTERPRETATION_TO_TECHNICAL_RATIO','PARAGRAPH_RHYTHM','UNKNOWN_PRESERVATION','NO_GOVERNANCE_PROSE'],lexicalCopyTarget:false};
 const payload={authorityPack:{schemaVersion:authorityPack.schemaVersion,locale,wholeChartTechnicalSnapshot:authorityPack.wholeChartTechnicalSnapshot,section},sectionOwnership:ownership,referenceQualityProfile:referenceProfile,outputLineage:{allowedClaimRefs:claims,allowedPalaceCodes:palaces,allowedTransformationKeys:transformations}};
 const invoke=provider||((args)=>invokeOpenAIStructured({...args,env,fetcher}));
 const response=await invoke({systemPrompt:systemPrompt(locale),userPayload:payload,schema,schemaName:'zwr_pro_section_v1',maxOutputTokens:locale==='zh-Hans'?7200:6200});
 const output=response?.output??response;
 if(output?.sectionId!==sectionId)throw Error('ZWR_PRO_W4_SECTION_ID_DRIFT');
 const paragraphRefs=[...new Set((output.paragraphs||[]).flatMap(p=>p.claimRefs||[]))];
 if(JSON.stringify([...paragraphRefs].sort())!==JSON.stringify([...(output.usedClaimRefs||[])].sort()))throw Error('ZWR_PRO_W4_LINEAGE_UNION_MISMATCH');
 const seed={schemaVersion:'ZWR-PRO-W4-CANDIDATE-v1',composerVersion:ZWR_PRO_W4_COMPOSER_VERSION,promptVersion:ZWR_PRO_W4_PROMPT_VERSION,subjectKey:authorityPack.wholeChartTechnicalSnapshot?.subjectKey||null,locale,sectionId,title:output.title,paragraphs:output.paragraphs,usedClaimRefs:output.usedClaimRefs,usedPalaceCodes:output.usedPalaceCodes,usedTransformationKeys:output.usedTransformationKeys,authorityPackVersion:authorityPack.schemaVersion,writer:{provider:response?.provider||'injected-test-provider',model:response?.model||'test-model',usage:response?.usage||null}};
 return deepFreeze({...seed,candidateDigest:await sha256Stable(seed)});
}
export default Object.freeze({composeZwrProSectionW4,ZWR_PRO_W4_COMPOSER_VERSION});
