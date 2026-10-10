import {freeze,list,text,localeOf,fail} from './product-envelope-core.js';
import {sha256Stable,stableStringify} from '../../zi-wei-runtime/zwr-utils.js';
import {STAR_ZH,TRANSFORMATION_ZH,STAR_STATE_VOCABULARY} from '../../zi-wei-full-production/ziwei-structural-registry.js';

export const ZIWEI_CX_R1_W9_W11_SPECIALIST_PRESENTATION_SCHEMA='PHI-OS-ZIWEI-CX-R1-W9-W11-SPECIALIST-PRESENTATION-v1.0.0';
export const ZIWEI_CX_R1_W9_W11_SPECIALIST_VISUAL_TYPE='ZIWEI_SPECIALIST_PRESENTATION';

const BRANCH_ZH=Object.freeze({ZI:'子',CHOU:'丑',YIN:'寅',MAO:'卯',CHEN:'辰',SI:'巳',WU:'午',WEI:'未',SHEN:'申',YOU:'酉',XU:'戌',HAI:'亥'});
const BRANCH_EN=Object.freeze({ZI:'Zi',CHOU:'Chou',YIN:'Yin',MAO:'Mao',CHEN:'Chen',SI:'Si',WU:'Wu',WEI:'Wei',SHEN:'Shen',YOU:'You',XU:'Xu',HAI:'Hai'});
const STEM_ZH=Object.freeze({JIA:'甲',YI:'乙',BING:'丙',DING:'丁',WU:'戊',JI:'己',GENG:'庚',XIN:'辛',REN:'壬',GUI:'癸'});
const STEM_EN=Object.freeze({JIA:'Jia',YI:'Yi',BING:'Bing',DING:'Ding',WU:'Wu',JI:'Ji',GENG:'Geng',XIN:'Xin',REN:'Ren',GUI:'Gui'});
const BUREAU_ZH=Object.freeze({WATER_2:'水二局',WOOD_3:'木三局',METAL_4:'金四局',EARTH_5:'土五局',FIRE_6:'火六局'});
const BUREAU_EN=Object.freeze({WATER_2:'Water 2 Bureau',WOOD_3:'Wood 3 Bureau',METAL_4:'Metal 4 Bureau',EARTH_5:'Earth 5 Bureau',FIRE_6:'Fire 6 Bureau'});
const PATTERN_ZH=Object.freeze({ZI_FU_TONG_GONG:'紫府同宫',LU_MA_JIAO_CHI:'禄马交驰',TAN_LING_BING_SHOU:'贪铃并守',TAN_HUO_XIANG_FENG:'贪火相逢',JUN_CHEN_QING_HUI:'君臣庆会',JIN_YU_FU_JIA:'金舆扶驾',JU_JI_TONG_GONG:'巨机同宫',WU_QU_SHOU_YUAN:'武曲守垣',RI_CHU_FU_SANG:'日出扶桑',YUE_LANG_TIAN_MEN:'月朗天门',CAI_LU_JIA_MA:'财禄夹马'});
const titleCaseCode=code=>String(code||'').toLowerCase().split('_').filter(Boolean).map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
const STAR_EN=Object.freeze(Object.fromEntries(Object.keys(STAR_ZH).map(code=>[code,titleCaseCode(code)])));
const TRANSFORMATION_EN=Object.freeze(Object.fromEntries(Object.keys(TRANSFORMATION_ZH).map(code=>[code,titleCaseCode(code)])));
const STATE_ZH=Object.freeze(Object.fromEntries(Object.entries(STAR_STATE_VOCABULARY).map(([code,row])=>[code,row.zh||code])));
const STATE_EN=Object.freeze(Object.fromEntries(Object.keys(STAR_STATE_VOCABULARY).map(code=>[code,code==='UNSPECIFIED'?'Unspecified':titleCaseCode(code)])));
const PATTERN_EN=Object.freeze(Object.fromEntries(Object.keys(PATTERN_ZH).map(code=>[code,titleCaseCode(code)])));
const escRe=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const replaceMapCodes=(value,map)=>Object.keys(map).sort((a,b)=>b.length-a.length).reduce((s,code)=>s.replace(new RegExp(`\\b${escRe(code)}\\b`,'g'),map[code]),value);
const RAW_RE=/\b[A-Z]{2,}(?:_[A-Z0-9]+)+\b/g;
const INTERNAL_RE=/\b(?:COUNTERBALANCED|DISTINCT_DOMAIN_EMPHASIS|PARALLEL_CONTEXT|BOUNDED_BY_UNKNOWN|MULTI_PATTERN_CONTEXT|SUPPORTED|QUALIFIED|PARTIAL)\b/g;
const uniq=values=>[...new Set(list(values).filter(Boolean))];
const sectionBy=(report,code)=>list(report?.sections).find(x=>x?.sectionCode===code)||null;
const clean=v=>String(v??'').trim();

export function ziweiPublicLabel(value,locale='en'){
  const l=localeOf(locale),raw=clean(value);if(!raw)return '';
  if((l==='zh-Hans'?BUREAU_ZH:BUREAU_EN)[raw])return (l==='zh-Hans'?BUREAU_ZH:BUREAU_EN)[raw];
  if((l==='zh-Hans'?BRANCH_ZH:BRANCH_EN)[raw])return (l==='zh-Hans'?BRANCH_ZH:BRANCH_EN)[raw];
  if((l==='zh-Hans'?STEM_ZH:STEM_EN)[raw])return (l==='zh-Hans'?STEM_ZH:STEM_EN)[raw];
  const mapped={NATAL:text(l,'Natal','本命'),DA_XIAN:text(l,'Da Xian','大限'),LIU_NIAN:text(l,'Liu Nian','流年')}[raw];if(mapped)return mapped;
  return raw;
}
function replaceKnownRaw(value,l){let s=clean(value);if(!s)return '';
  s=s.replace(/\bW15\s*(?:therefore|因此)?\s*/gi,'');
  // W14 regression closure: W19 can legitimately carry governed structural identifiers
  // such as JU_MEN（MIAO） into the specialist projection. Translate only identifiers
  // that already exist in Zi Wei's frozen structural/admitted registries; unknown codes
  // still fail closed below rather than being prettified generically.
  s=replaceMapCodes(s,l==='zh-Hans'?STAR_ZH:STAR_EN);
  s=replaceMapCodes(s,l==='zh-Hans'?TRANSFORMATION_ZH:TRANSFORMATION_EN);
  s=replaceMapCodes(s,l==='zh-Hans'?PATTERN_ZH:PATTERN_EN);
  s=replaceMapCodes(s,l==='zh-Hans'?STATE_ZH:STATE_EN);
  for(const code of Object.keys(BUREAU_ZH))s=s.replace(new RegExp(`\\b${code}\\b`,'g'),ziweiPublicLabel(code,l));
  for(const code of Object.keys(BRANCH_ZH))s=s.replace(new RegExp(`\\b${code}\\b`,'g'),ziweiPublicLabel(code,l));
  for(const code of Object.keys(STEM_ZH))s=s.replace(new RegExp(`\\b${code}\\b`,'g'),ziweiPublicLabel(code,l));
  s=s.replace(/\bCOUNTERBALANCED\b/g,text(l,'two structural signals coexist','同时存在两类结构信号'));
  s=s.replace(/\bDISTINCT_DOMAIN_EMPHASIS\b/g,text(l,'parallel emphasis across different domains','不同领域并行强调'));
  s=s.replace(/\bPARALLEL_CONTEXT\b/g,text(l,'parallel structural context','并行结构语境'));
  s=s.replace(/\bBOUNDED_BY_UNKNOWN\b/g,text(l,'bounded by an unresolved meaning gap','受未决解释空白约束'));
  s=s.replace(/\bMULTI_PATTERN_CONTEXT\b/g,text(l,'multiple admitted pattern contexts coexist','多个已准入格局语境并存'));
  s=s.replace(/\bNATAL\b/g,ziweiPublicLabel('NATAL',l)).replace(/\bDA_XIAN\b/g,ziweiPublicLabel('DA_XIAN',l)).replace(/\bLIU_NIAN\b/g,ziweiPublicLabel('LIU_NIAN',l));
  return s.replace(/\s{2,}/g,' ').trim();
}
function safeCopy(value,l){const s=replaceKnownRaw(value,l);if(!s)return '';if(RAW_RE.test(s)||INTERNAL_RE.test(s)){RAW_RE.lastIndex=0;INTERNAL_RE.lastIndex=0;fail('ZIWEI_CX_R1_W11_UNMAPPED_RAW_CODE',{value:s});}RAW_RE.lastIndex=0;INTERNAL_RE.lastIndex=0;return s;}
function safeList(values,l){return uniq(list(values).map(x=>safeCopy(x,l)).filter(Boolean));}
function resolutionLabel(state,label,l){
  const code=clean(state);const map={
    COUNTERBALANCED:text(l,'Two structural signals coexist','同时存在两类结构信号'),
    SUPPORTED:text(l,'Structure supported by admitted evidence','结构证据完整'),
    QUALIFIED:text(l,'Qualified with stated conditions','有条件成立'),
    BOUNDED_BY_UNKNOWN:text(l,'Conclusion remains open at an admitted meaning gap','结论在解释空白处保留'),
    PARALLEL_CONTEXT:text(l,'Parallel structural context','并行结构语境'),
    MULTI_PATTERN_CONTEXT:text(l,'Multiple admitted pattern contexts coexist','多个已准入格局语境并存'),
    PARTIAL:text(l,'Partially readable','部分可读')
  };
  return map[code]||safeCopy(label,l)||text(l,'Structural reading','结构读取');
}
function counterCopy(state,count,l){if(state==='COUNTERBALANCED')return text(l,'Supportive or activating evidence and friction or constraint evidence are both retained here. Neither side is promoted into one overall stronger/weaker verdict.','这里同时保留资源／激活类证据与摩擦／约束类证据，不把任何一边提升成“整体更强／整体更弱”的单一结论。');if(count>0)return text(l,`${count} counter-evidence item${count===1?'':'s'} remain attached to this reading.`,`${count} 条反证继续绑定在这项读取上。`);return '';}
function whyCounts(why={}){return freeze({evidenceCount:Number(why.evidenceCount??list(why.evidenceRefs).length)||0,meaningCount:Number(why.meaningCount??list(why.meaningRefs).length)||0,counterEvidenceCount:Number(why.counterEvidenceCount??list(why.counterEvidenceRefs).length)||0,unknownCount:Number(why.unknownCount??list(why.unknownRefs).length)||0});}
function palacePresentation(p,index,l){const why=whyCounts(p?.inspector?.why||{});return freeze({index,title:safeCopy(p.title,l),branchLabel:safeCopy(p.branchLabel||ziweiPublicLabel(p.branch,l),l),row:Number(p.row)||1,col:Number(p.col)||1,focusLabels:safeList(p.focusLabels,l),teaser:safeCopy(p.teaser,l),starNames:safeList(p.starNames,l),transformationNames:safeList(p.transformationNames,l),resolutionLabel:resolutionLabel(p.resolutionState,p.resolutionLabel,l),counterEvidenceCopy:counterCopy(p.resolutionState,why.counterEvidenceCount,l),openBoundary:safeCopy(p.openBoundary,l),emptyMainStarPalace:p.emptyMainStarPalace===true,oppositeMainStarReference:safeList(p.oppositeMainStarReference,l),inspector:freeze({title:safeCopy(p.inspector?.title,l),paragraphs:safeList(p.inspector?.paragraphs,l),networkSummary:safeCopy(p.inspector?.networkSummary,l),triadPalaces:safeList(p.inspector?.triadPalaces,l),oppositePalace:safeCopy(p.inspector?.oppositePalace,l),flankPalaces:safeList(p.inspector?.flankPalaces,l),stars:list(p.inspector?.stars).map(x=>freeze({label:safeCopy(x.label,l),stateLabel:safeCopy(x.stateLabel,l),standaloneMeaningAvailable:x.standaloneMeaningAvailable===true})),transformations:list(p.inspector?.transformations).map(x=>freeze({label:safeCopy(x.label,l),targetStarLabel:safeCopy(x.targetStarLabel,l)})),why})});}
function topicPalaceRef(x,palaceIndex,l){const index=palaceIndex.get(x.palaceCode);if(index==null)fail('ZIWEI_CX_R1_W9_TOPIC_PALACE_NOT_IN_W19',{palaceCode:x.palaceCode});const counts=whyCounts(x.why||{});return freeze({palaceIndex:index,title:safeCopy(x.title,l),role:x.role==='PRIMARY'?text(l,'Primary palace','主要宫位'):text(l,'Context palace','背景宫位'),excerpt:safeCopy(x.excerpt,l),networkSummary:safeCopy(x.networkSummary,l),openBoundary:safeCopy(x.openBoundary,l),resolutionLabel:resolutionLabel(x.resolutionState,x.resolutionLabel,l),counterEvidenceCopy:counterCopy(x.resolutionState,counts.counterEvidenceCount,l),counts});}
function topicTiming(x,palaceIndex,l){const focusIndex=x.focusPalaceCode?palaceIndex.get(x.focusPalaceCode):null;const overlaps=list(x.relevantOverlaps).map(v=>freeze({palaceIndex:palaceIndex.get(v.palaceCode)??null,palaceLabel:safeCopy(v.palaceLabel,l),starLabel:safeCopy(v.starLabel,l),layers:safeList(v.layers.map(layer=>ziweiPublicLabel(layer,l)),l),spansAllThreeLayers:v.spansAllThreeLayers===true}));return freeze({kindLabel:x.kind==='DA_XIAN'?text(l,'Da Xian','大限'):x.kind==='LIU_NIAN'?text(l,'Liu Nian','流年'):text(l,'Natal × Da Xian × Liu Nian','本命 × 大限 × 流年'),title:safeCopy(x.title,l),focusPalaceIndex:focusIndex??null,focusPalaceLabel:safeCopy(x.focusPalaceLabel,l),excerpt:safeCopy(x.excerpt,l),resolutionLabel:resolutionLabel(x.resolutionState,null,l),counterEvidenceCopy:counterCopy(x.resolutionState,0,l),relevantTransformations:list(x.relevantTransformations).map(v=>freeze({label:safeCopy(v.label,l),targetStarLabel:safeCopy(v.targetStarLabel,l),palaceIndex:palaceIndex.get(v.palaceCode)??null,palaceLabel:safeCopy(v.palaceLabel,l)})),relevantOverlaps:overlaps});}
function topicPresentation(topic,palaceIndex,l){const primary=list(topic.primaryPalaces).map(x=>topicPalaceRef(x,palaceIndex,l));const context=list(topic.contextPalaces).map(x=>topicPalaceRef(x,palaceIndex,l));const timing=list(topic.timing).map(x=>topicTiming(x,palaceIndex,l));const counterEvidenceCount=[...primary,...context].reduce((n,x)=>n+x.counts.counterEvidenceCount,0);return freeze({title:safeCopy(topic.title,l),overview:safeList(topic.overview,l),boundary:safeCopy(topic.boundary,l),primary,context,timing,openBoundaries:list(topic.openBoundaries).map(x=>freeze({starLabel:safeCopy(x.starLabel,l),customerCopy:safeCopy(x.customerCopy,l),affectedPalaceIndices:list(x.affectedPalaceCodes).map(code=>palaceIndex.get(code)).filter(Number.isInteger)})),counterEvidenceCount,counterEvidenceCopy:counterEvidenceCount?text(l,`${counterEvidenceCount} counter-evidence item${counterEvidenceCount===1?'':'s'} remain visible across the palaces referenced by this topic.`,`${counterEvidenceCount} 条反证继续保留在这个主题所引用的宫位中。`):''});}
function timingPresentation(report,palaceIndex,l){const timing=sectionBy(report,'TIMING'),foundation=sectionBy(report,'FOUNDATION')?.items?.[0]||null;const da=list(timing?.items).find(x=>x.kind==='DA_XIAN')||null,ly=list(timing?.items).find(x=>x.kind==='LIU_NIAN')||null,cross=list(timing?.items).find(x=>x.kind==='CROSS_LAYER')||null;const natal=freeze({label:text(l,'Natal','本命'),title:text(l,'Natal foundation','本命基础'),focus:safeCopy(foundation?.lifePalace?.label,l)||text(l,'Life Palace','命宫'),detail:safeList(foundation?.paragraphs,l).slice(0,2)});const layer=x=>x?freeze({label:x.kind==='DA_XIAN'?text(l,'Da Xian','大限'):text(l,'Liu Nian','流年'),title:safeCopy(x.title,l),focus:safeCopy(x.focus?.natalDomainLabel,l),period:x.kind==='DA_XIAN'?safeCopy(text(l,`Nominal age ${x.focus?.startNominalAge ?? '—'}–${x.focus?.endNominalAge ?? '—'}`,`名义年龄 ${x.focus?.startNominalAge ?? '—'}–${x.focus?.endNominalAge ?? '—'}`),l):safeCopy(String(x.focus?.lunarYear||''),l),paragraphs:safeList(x.paragraphs,l),resolutionLabel:resolutionLabel(x.resolutionState,x.resolutionLabel,l),transformations:list(x.transformations).map(v=>freeze({label:safeCopy(v.label,l),targetStarLabel:safeCopy(v.targetStarLabel,l),palaceIndex:palaceIndex.get(v.palaceCode)??null,palaceLabel:safeCopy(v.palaceLabel,l)}))}):null;const crossCounts=whyCounts(cross?.why||{});return freeze({title:safeCopy(timing?.title||text(l,'Da Xian and Liu Nian','大限与流年'),l),lane:[natal,layer(da),layer(ly)].filter(Boolean),crossLayer:cross?freeze({title:safeCopy(cross.title,l),resolutionLabel:resolutionLabel(cross.resolutionState,cross.resolutionLabel,l),paragraphs:safeList(cross.paragraphs,l),counterEvidenceCopy:counterCopy(cross.resolutionState,crossCounts.counterEvidenceCount,l),overlaps:list(cross.overlaps).map(v=>freeze({palaceIndex:palaceIndex.get(v.palaceCode)??null,palaceLabel:safeCopy(v.palaceLabel,l),starLabel:safeCopy(v.starLabel,l),layers:safeList(v.layers.map(layer=>ziweiPublicLabel(layer,l)),l),spansAllThreeLayers:v.spansAllThreeLayers===true}))}):null});}
function patternsPresentation(report,l){const s=sectionBy(report,'PATTERNS');return freeze({title:safeCopy(s?.title||text(l,'Admitted patterns','已成立格局'),l),admissionLabel:text(l,'Human-admitted structural qualification only','仅显示人工准入的格局结构资格'),emptyCopy:safeCopy(s?.emptyCopy,l),items:list(s?.items).map(x=>freeze({title:safeCopy(x.title||x.label,l),qualificationLabel:text(l,'Human-admitted qualification','人工准入格局资格'),resolutionLabel:resolutionLabel(x.resolutionState,x.resolutionLabel,l),paragraphs:safeList(x.paragraphs,l)}))});}
function fullReportSections(report,l){return list(report?.sections).filter(s=>s.sectionCode!=='TIMING'&&s.sectionCode!=='PATTERNS').map(s=>freeze({title:safeCopy(s.title,l),sectionLabel:safeCopy(s.sectionCode==='READING_FIRST'?text(l,'Overview','概览'):s.sectionCode==='FOUNDATION'?text(l,'Chart foundation','命盘基础'):s.sectionCode==='PALACES'?text(l,'Twelve-palace report','十二宫完整报告'):s.sectionCode==='OPEN_BOUNDARIES'?text(l,'Open boundaries','解释边界'):s.sectionCode==='WHY_THIS_READING'?text(l,'Why this reading','为什么这样读'):s.title,l),items:list(s.items).map(x=>freeze({title:safeCopy(x.title||x.label,l),paragraphs:safeList(x.paragraphs,l),customerCopy:safeCopy(x.customerCopy,l),resolutionLabel:resolutionLabel(x.resolutionState,x.resolutionLabel,l)})),paragraphs:safeList(s.paragraphs,l),customerSummary:safeCopy(s.customerSummary,l),emptyCopy:safeCopy(s.emptyCopy,l)}));}

export function projectZiweiW9W11SpecialistPresentation({product,locale=product?.locale||'en'}={}){
  if(product?.methodId!=='ZWR'||product?.productType!=='ZIWEI_FULL_PRODUCTION')fail('ZIWEI_CX_R1_W9_W11_ZIWEI_PRODUCT_REQUIRED');
  if(product.state!=='CUSTOMER_PUBLISHABLE')fail('ZIWEI_CX_R1_W9_W11_CUSTOMER_PUBLISHABLE_REQUIRED');
  const source=product.sourceProduct,l=localeOf(locale);if(source?.schemaVersion!=='PHI-OS-ZIWEI-CX-R1-CURRENT-PUBLICATION-ENVELOPE-v1.0.0')fail('ZIWEI_CX_R1_W9_W11_PUBLICATION_ENVELOPE_REQUIRED');
  if(source.locale!==l)fail('ZIWEI_CX_R1_W9_W11_LOCALE_MISMATCH');
  const snap=stableStringify(product),report=source.report,surface=source.interactiveSurface,topics=source.topics;
  if(report?.schemaVersion!=='PHI-OS-ZIWEI-CUSTOMER-REPORT-v1.0.0')fail('ZIWEI_CX_R1_W9_W11_W18_REQUIRED');
  if(surface?.schemaVersion!=='PHI-OS-ZIWEI-INTERACTIVE-CHART-SURFACE-v1.0.0'||list(surface.palaces).length!==12)fail('ZIWEI_CX_R1_W9_W11_W19_REQUIRED');
  if(topics?.schemaVersion!=='PHI-OS-ZIWEI-TOPIC-READING-v1.0.0'||list(topics.topics).length!==8)fail('ZIWEI_CX_R1_W9_W11_W20_REQUIRED');
  const palaceIndex=new Map(list(surface.palaces).map((p,i)=>[p.palaceCode,i]));
  const palaces=list(surface.palaces).map((p,i)=>palacePresentation(p,i,l));
  const readingFirst=report.readingFirst||sectionBy(report,'READING_FIRST')||{};
  const hero=freeze({eyebrow:text(l,'ZI WEI · PROFESSIONAL READING','紫微斗数 · 专业读取'),title:safeCopy(report.title||product.hero?.title,l),subtitle:safeCopy(report.subtitle||product.hero?.summary,l),anchors:list(readingFirst.anchors).slice(0,4).map(x=>freeze({label:safeCopy(x.label,l),value:safeCopy(x.value,l)})),patterns:patternsPresentation(report,l).items.map(x=>x.title),boundary:safeCopy(report.boundary,l)});
  const resultBase={schemaVersion:ZIWEI_CX_R1_W9_W11_SPECIALIST_PRESENTATION_SCHEMA,work:'ZIWEI-CX-R1-W9-W11',locale:l,hero,navigation:[text(l,'Overview','概览'),text(l,'Chart','命盘'),text(l,'Twelve palaces','十二宫'),text(l,'Topic reading','主题读取'),text(l,'Patterns','格局'),text(l,'Da Xian & Liu Nian','大限与流年'),text(l,'Reality comparison','现实对照'),text(l,'Evidence & boundaries','证据与边界')],palaces,defaultPalaceIndex:Math.max(0,palaceIndex.get(source.interactiveSurface.defaultSelectedPalaceCode)??0),chartCenter:freeze({title:safeCopy(surface.centerPanel?.title,l),subtitle:safeCopy(surface.centerPanel?.subtitle,l),instructions:safeCopy(surface.centerPanel?.instructions,l),anchors:list(surface.centerPanel?.anchors).map(x=>freeze({label:safeCopy(x.label,l),value:safeCopy(x.value,l)}))}),topics:list(topics.topics).map(x=>topicPresentation(x,palaceIndex,l)),patterns:patternsPresentation(report,l),timing:timingPresentation(report,palaceIndex,l),openBoundaries:list(sectionBy(report,'OPEN_BOUNDARIES')?.items).map(x=>freeze({starLabel:safeCopy(x.starLabel,l),customerCopy:safeCopy(x.customerCopy,l)})),fullReport:fullReportSections(report,l),realityComparison:freeze({title:text(l,'Compare the reading with lived reality','把读取带回现实对照'),copy:text(l,'Use these structural readings as hypotheses to observe. A match is not proof; contradiction, context-dependence and unresolved experience remain valid outcomes.','把这些结构读取当作可以观察的假设。觉得贴近不等于证明；反证、情境差异与暂时无法判断都仍然是有效结果。')}),evidence:freeze({title:text(l,'Evidence & boundaries','证据与边界'),customerSummary:safeCopy(sectionBy(report,'WHY_THIS_READING')?.customerSummary,l),openBoundaryCount:list(sectionBy(report,'OPEN_BOUNDARIES')?.items).length,machineAdmission:safeCopy(product.publication?.machineAdmission,l),humanAdmission:safeCopy(product.publication?.humanAdmission,l)}),technical:freeze({reportDigest:report.reportDigest||null,readingDigest:report.source?.readingDigest||null,sourceDigests:source.sourceDigests||null,publication:product.publication||null,lineage:freeze(Object.fromEntries(Object.entries(product.lineage||{}).filter(([key])=>key!=='ziweiCxR1W9W11PresentationDigest')))}),boundaries:freeze({reusesW18Narrative:true,reusesW19PalaceOwnership:true,reusesW20Topics:true,humanAdmittedPatternQualificationOnly:true,counterbalancedRawCodeCustomerVisible:false,rawMethodCodeCustomerVisible:false,newMeaningCreated:false,newFindingCreated:false,newOutcomeVerdictCreated:false,sharedPprR3MutationRequired:false})};
  const presentationDigest=sha256Stable(resultBase);if(stableStringify(product)!==snap)fail('ZIWEI_CX_R1_W9_W11_INPUT_MUTATION_FORBIDDEN');return freeze({...resultBase,presentationDigest});
}
export function assertZiweiPresentationCustomerSafe(presentation){
  const walk=(value,path='root')=>{if(typeof value==='string'){if(path.startsWith('root.technical'))return;const raw=value.match(RAW_RE)||value.match(INTERNAL_RE);if(raw)fail('ZIWEI_CX_R1_W11_RAW_CODE_IN_CUSTOMER_PRESENTATION',{path,value,raw:raw[0]});if(/结构项/.test(value))fail('ZIWEI_CX_R1_W11_GENERIC_STRUCTURE_ITEM_LABEL_FORBIDDEN',{path,value});return;}if(Array.isArray(value)){value.forEach((x,i)=>walk(x,`${path}[${i}]`));return;}if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))walk(v,`${path}.${k}`);};walk(presentation);return true;
}
export default Object.freeze({projectZiweiW9W11SpecialistPresentation,assertZiweiPresentationCustomerSafe,ziweiPublicLabel});
