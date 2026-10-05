import {BAZI_VFR_COMPACT_COPY} from './narrative/bazi-vfr-r1-compact-copy.js';
import {buildBaziVfrDiagrams} from './bazi-vfr-r1-diagrams.js';
import {BAZI_SECTION_REGISTRY,bindSectionVisual} from '../canonical-presentation-runtime/report-section-contract.js';
import {validateVisualReportIR} from '../canonical-presentation-runtime/visual-first-report-contract.js';
import {REPORT_EDITORIAL_ASSETS} from '../canonical-presentation-runtime/report-editorial-registry.js';
import {resolveReportEditorialAsset} from '../canonical-presentation-runtime/report-editorial-resolver.js';
const expectedPillars={year:'庚申',month:'甲子',day:'庚辰',hour:'庚寅'};
export function guardBaziVisualAuthority(ir,authority,timing){
 if(JSON.stringify(ir.natal.pillars)!==JSON.stringify(authority.chart.pillars)||ir.natal.dayMaster!==authority.chart.dayMaster||ir.natal.strength!=='中和偏弱'||ir.natal.usefulGod!=='土主、金辅；火保留调候与责任作用')throw Error('INVALID_AUTHORITY_FACT');
 if(ir.timing.daYun!==timing.daYun||ir.timing.annual!==timing.annual)throw Error('TIMING_IDENTITY_MISMATCH');
 if(ir.timing.gregorianYear!=null||ir.timing.age!=null||ir.timing.startDate!=null||ir.timing.transformationEstablished!==false)throw Error('UNKNOWN_PROMOTED_TO_FACT');
 const prose=ir.sections.flatMap(s=>[s.title,s.headline,...s.interpretation,...s.insights]).join('\n');
 if(/一定发财|一定离婚|必然升职|必然事故|必然疾病|甲己化土|申子辰已经化水/.test(prose))throw Error('FORBIDDEN_EVENT_CERTAINTY');
 const allowed=new Set([...Object.values(authority.chart.pillars),timing.daYun,timing.annual]);
 if((prose.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g)||[]).some(p=>!allowed.has(p)))throw Error('INVALID_AUTHORITY_FACT');
 if(/\d{4}年|\d+岁/.test(prose))throw Error('UNKNOWN_PROMOTED_TO_FACT');
 const expected=buildBaziVfrDiagrams(authority,timing,BAZI_VFR_COMPACT_COPY);
 if(JSON.stringify(ir.diagrams)!==JSON.stringify(expected))throw Error('INVALID_AUTHORITY_FACT');
 return validateVisualReportIR(ir);
}
export function projectBaziVfrReference({reviewOnly,locale,authorityPack,timingAuthority,authorityDigest,sourceDigests}={}){
 if(reviewOnly!==true)throw Error('VFR_HUMAN_REVIEW_REQUIRED');if(locale!=='zh-Hans')throw Error('VFR_COMPACT_ENGLISH_NOT_ACCEPTED');
 if(JSON.stringify(authorityPack?.chart?.pillars)!==JSON.stringify(expectedPillars)||timingAuthority?.identityState!=='PARTIAL_TEST_STRUCTURE')throw Error('INVALID_AUTHORITY_FACT');
 const asset=n=>bindSectionVisual(BAZI_SECTION_REGISTRY.sections[n-1].key);
 const sections=BAZI_VFR_COMPACT_COPY.map((s,i)=>({...s,sectionMasterAsset:asset(i+2).url,sourceDigests:sourceDigests?.[s.id],customerRealityBridge:null}));
 const diagrams=buildBaziVfrDiagrams(authorityPack,timingAuthority,sections),pages=[];
 const add=p=>pages.push({...p,pageNumber:pages.length+1});
 add({kind:'COVER',title:'八字个人读取'});
 add({kind:'GUIDE',title:'先看结构，再读解释',kicker:'如何阅读',paragraphs:['这份报告把命盘、生活领域与当前时序分开呈现。先沿图示辨认各部分怎样连接，再读简短解释，最后与你的实际经历对照。'],cards:[['事实基础','四柱、藏干、十神与已提供的时序柱。'],['结构解释','接受稿所描述的能力、关系与承载模式。'],['生活对照','图中没有替你填写经历，也没有计算人生分数。'],['保留未知','年份、年龄与起运尚未明确，不补成确定事实。']]});
 const diagram=(title,id,sectionId=null)=>add({kind:'DIAGRAM',title,diagramIds:[id],sectionId,kicker:sectionId?'个人领域 · '+sectionId.slice(1):'你的命盘基础',paragraphs:[]});
 diagram('你的八字，一眼看见','BZD-OVERVIEW');diagram('四柱与藏干','BZD-01');diagram('五行，不只是数量','BZD-02');diagram('十神在原局怎样出现','BZD-03');diagram('季节、日主与承载','BZD-04');
 const plans=[['BZD-06','BZD-06-B'],['BZD-07','BZD-07-B'],['BZD-08','BZD-08-B','BZD-08-C'],['BZD-09','BZD-09-B','BZD-09-C'],['BZD-10','BZD-10-B'],['BZD-11','BZD-11-B'],['BZD-12','BZD-12-B'],['BZD-13','BZD-13-B'],['BZD-14','BZD-15','BZD-14-B']];
 sections.forEach((s,i)=>{add({kind:'MASTER',sectionId:s.id,title:s.title});plans[i].forEach(id=>diagram(diagrams.find(d=>d.id===id).title,id,s.id));add({kind:'INTERPRETATION',sectionId:s.id,title:s.headline,kicker:s.title,paragraphs:[]});});
 diagram('把全文连成一个运行结构','BZD-SUMMARY');
 add({kind:'CLOSING',title:'把读取带回你的生活',kicker:'继续观察',paragraphs:['这份读取提供结构与作用之间的联系，不替你确定未来。你可以先辨认哪些部分与实际经历相符，哪些仍需要更多情境，再决定值得继续理解的主题。','原局为庚申／甲子／庚辰／庚寅。己巳大运与丙寅年度层只按目前提供的柱读取；其对应公历年份、年龄及起运日期尚未明确。','如有现实问题，下一次对照可以从一个具体情境开始：发生了什么、涉及谁、你希望理解哪部分。当前报告没有收到个人现实描述，因此没有为你推定额外经历。'],cards:[['能力与成果','理解怎样进入被采用的价值？'],['支持与承载','责任是否有相应资源与分担？'],['阶段与方向','哪些结构仍有效，哪些需要重新理解？']]});
 // Major natal relations belong on the season page as a separate large mini-network.
 pages[6].secondaryDiagramId='BZD-05';
 const ir={schemaVersion:'VISUAL_REPORT_IR_V1',method:'BZR',methodId:'BZR',locale,reviewOnly:true,customerPublishable:false,physicalComposition:{version:'VISUAL_FIRST_REPORT_CONTRACT_V1'},identity:{displayName:null,birthDate:null,birthTime:null,timeAccuracy:'UNKNOWN'},coverAsset:resolveReportEditorialAsset({registry:{bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS},methodId:'BZR',page:1,locale:'bilingual',publicBaseUrl:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev'}).src,bodyAsset:asset(2).bodyUrl,pageBudget:{max:50,target:48},authorityDigest,natal:{pillars:expectedPillars,dayMaster:'庚',strength:'中和偏弱',usefulGod:'土主、金辅；火保留调候与责任作用'},timing:{daYun:timingAuthority.daYun,annual:timingAuthority.annual,gregorianYear:null,age:null,startDate:null,transformationEstablished:false},sections,diagrams,pages,providerUsage:{providerCalls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,estimatedProviderCost:0,budgetLimit:1,budgetRemaining:1,semanticReviewCalls:0,cacheHit:true,mode:'ZERO_COST_REPLAY'},compactCopyDecision:'PENDING_HUMAN_REVIEW'};
 return guardBaziVisualAuthority(ir,authorityPack,timingAuthority);
}
