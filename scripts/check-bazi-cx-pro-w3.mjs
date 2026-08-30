import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {adaptBaziPersonalRealityProduct} from '../functions/personal-reality-product/adapters/bazi-production-adapter.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));
const fixture=json('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const contract=json('content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-ten-god-professional-composition-v1.json');
const acceptance=json('content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w3-engineering-acceptance-v1.json');
const projectionSource=read('functions/personal-professional-reading/bazi-professional-surface-projection.js');
const nativeAdapterSource=read('functions/personal-professional-reading/bazi-method-native-reading-adapter.js');
const rendererSource=read('assets/customer-ui/js/specialists/bazi/product-renderer.js');
const surfaceSource=read('assets/customer-ui/js/surfaces/bazi-professional-reading.js');
const css=read('assets/customer-ui/surfaces/bazi-professional-reading.css');

assert.equal(contract.work,'BAZI-CX-PRO-W3');
assert.equal(contract.projectionSchema,'PHI-OS-BAZI-CX-PRO-TEN-GOD-PROFESSIONAL-COMPOSITION-v1.0.0');
assert.equal(acceptance.work,'BAZI-CX-PRO-W3');
assert.equal(acceptance.baseline.commit,'791e1a130750affa13831f248e89a8b921e54743');
assert.equal(acceptance.baseline.librarySnapshot,'read(1).zip');

const expectedOrder=['BI_JIAN','JIE_CAI','SHI_SHEN','SHANG_GUAN','ZHENG_CAI','PIAN_CAI','ZHENG_GUAN','QI_SHA','ZHENG_YIN','PIAN_YIN'];
const expectedGroups={PEER:['BI_JIAN','JIE_CAI'],OUTPUT:['SHI_SHEN','SHANG_GUAN'],WEALTH:['ZHENG_CAI','PIAN_CAI'],OFFICER:['ZHENG_GUAN','QI_SHA'],RESOURCE:['ZHENG_YIN','PIAN_YIN']};
assert.deepEqual(contract.tenGodOrder,expectedOrder);
assert.deepEqual(contract.functionalGroups,expectedGroups);

const native=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
assert.equal(native.publicationDecision?.customerPublishable,true);
assert.equal(native.governance?.tenGodProfessionalCompositionAuthorized,true);
assert.equal(native.professionalModules?.moduleVersion,'BAZI-CX-PRO-W3-v1.0.0');
const ten=native.professionalModules?.tenGods;
assert.equal(ten?.schemaVersion,contract.projectionSchema);
assert.equal(ten?.work,'BAZI-CX-PRO-W3');
assert.equal(ten?.sourceTenGodSchema,contract.sourceTenGodSchema);
assert.equal(ten?.distributionMode,'VISIBLE_STEMS_PLUS_HIDDEN_STEMS_UNWEIGHTED');
assert.equal(ten?.weightsApplied,false);
assert.equal(ten?.total,11);
assert.equal(ten?.items?.length,10);
assert.equal(ten?.groups?.length,5);
assert.deepEqual(ten.items.map(x=>x.code),expectedOrder);
assert.deepEqual(Object.fromEntries(ten.groups.map(x=>[x.group,x.members])),expectedGroups);
assert.equal(ten.dayMaster?.code,'GENG');
assert.equal(ten.dayMaster?.zh,'庚');
assert.equal(ten.monthCommand?.branchCode,'YIN');
assert.equal(ten.monthCommand?.branchZh,'寅');
assert.equal(ten.patternContext?.candidateCount,3);
assert.equal(ten.patternContext?.unresolved,true);

const sumCount=ten.items.reduce((sum,x)=>sum+x.count,0);
assert.equal(sumCount,ten.total);
assert.ok(Math.abs(ten.items.reduce((sum,x)=>sum+x.rawRatio,0)-100)<=0.2,'Ten-God raw ratios should round to approximately 100%');
for(const item of ten.items){
 assert.equal(item.count,item.sourceBreakdown.visibleStemCount+item.sourceBreakdown.hiddenStemCount,`${item.code} source counts must reconcile`);
 assert.equal(item.visibleSources.length,item.sourceBreakdown.visibleStemCount);
 assert.equal(item.hiddenSources.length,item.sourceBreakdown.hiddenStemCount);
 assert.equal(item.rawRatio,ten.total?Math.round(item.count/ten.total*1000)/10:0);
 assert.ok(['VISIBLE_AND_HIDDEN','VISIBLE_ONLY','HIDDEN_ONLY','ABSENT'].includes(item.visibility));
 if(item.count===0)assert.equal(item.visibility,'ABSENT');
 if(item.count>=2)assert.equal(item.repeated,true);
}
assert.equal(ten.groups.reduce((sum,x)=>sum+x.count,0),ten.total);
assert.ok(Math.abs(ten.groups.reduce((sum,x)=>sum+x.rawRatio,0)-100)<=0.2,'functional-group ratios should round to approximately 100%');

const byCode=new Map(ten.items.map(x=>[x.code,x]));
assert.equal(byCode.get('PIAN_CAI').count,2);
assert.equal(byCode.get('PIAN_CAI').visibility,'VISIBLE_AND_HIDDEN');
assert.deepEqual(byCode.get('PIAN_CAI').visibleSources.map(x=>x.pillar),['YEAR']);
assert.deepEqual(byCode.get('PIAN_CAI').hiddenSources.map(x=>x.pillar),['MONTH']);
assert.equal(byCode.get('PIAN_CAI').monthCommandOrder,1);
assert.equal(byCode.get('PIAN_CAI').patternLinks.length,1);
assert.equal(byCode.get('PIAN_CAI').patternLinks[0].visibleStemMatch,true);
assert.equal(byCode.get('QI_SHA').count,2);
assert.equal(byCode.get('QI_SHA').monthCommandOrder,2);
assert.equal(byCode.get('QI_SHA').patternLinks[0].visibleStemMatch,true);
assert.equal(byCode.get('PIAN_YIN').count,2);
assert.equal(byCode.get('PIAN_YIN').visibility,'HIDDEN_ONLY');
assert.equal(byCode.get('PIAN_YIN').monthCommandOrder,3);
assert.equal(byCode.get('PIAN_YIN').patternLinks[0].visibleStemMatch,false);
assert.equal(byCode.get('SHANG_GUAN').visibility,'HIDDEN_ONLY');
assert.deepEqual(byCode.get('SHANG_GUAN').hiddenSources.map(x=>x.pillar),['YEAR','HOUR']);
assert.equal(byCode.get('JIE_CAI').visibility,'ABSENT');
assert.equal(byCode.get('ZHENG_CAI').visibility,'ABSENT');
assert.equal(byCode.get('ZHENG_GUAN').visibility,'ABSENT');
assert.equal(byCode.get('ZHENG_YIN').visibility,'ABSENT');

assert.equal(ten.concentration?.topCount,2);
assert.equal(ten.concentration?.topRatio,18.2);
assert.equal(ten.concentration?.coLeaderCount,5);
assert.deepEqual(ten.concentration?.leaderCodes,['SHI_SHEN','SHANG_GUAN','PIAN_CAI','QI_SHA','PIAN_YIN']);
assert.deepEqual(ten.concentration?.leaderGroups,['OUTPUT']);
assert.equal(ten.concentration?.topGroupRatio,36.4);
assert.deepEqual(ten.concentration?.hiddenOnlyCodes,['BI_JIAN','SHANG_GUAN','PIAN_YIN']);
assert.deepEqual(ten.concentration?.absentCodes,['JIE_CAI','ZHENG_CAI','ZHENG_GUAN','ZHENG_YIN']);
assert.deepEqual(ten.patternContext?.monthCommandCandidateCodes,['PIAN_CAI','QI_SHA','PIAN_YIN']);

assert.equal(ten.boundaries?.ratioIsUnweightedStructuralShare,true);
assert.equal(ten.boundaries?.ratioIsStrengthScore,false);
assert.equal(ten.boundaries?.absenceIsAbilityAbsence,false);
assert.equal(ten.boundaries?.repetitionIsDestinyVerdict,false);
assert.equal(ten.boundaries?.hiddenOnlyIsWeaknessVerdict,false);
assert.equal(ten.boundaries?.patternCandidateIsPrimaryPattern,false);
assert.equal(ten.boundaries?.rendererMayCreateNewTenGodVerdict,false);
assert.equal(ten.boundaries?.goodBadScoreCreated,false);
assert.equal(ten.boundaries?.fortunePredictionCreated,false);

assert.match(projectionSource,/TEN_GOD_ORDER/);
assert.match(projectionSource,/VISIBLE_STEMS_PLUS_HIDDEN_STEMS_UNWEIGHTED/);
assert.match(nativeAdapterSource,/tenGodProfessionalCompositionAuthorized:true/);
assert.match(rendererSource,/renderBaziTenGodSurface/);
assert.match(rendererSource,/data-bazi-cx-pro-w3/);

for(const code of expectedOrder){assert.ok(css.includes(`data-ten-god=\"${code}\"`),`CSS must define a visual token for ${code}`);}
for(const group of Object.keys(expectedGroups)){assert.ok(css.includes(`data-ten-god-group=\"${group}\"`),`CSS must define a functional-group token for ${group}`);}
for(const token of ['.cx-bazi-ten-god-grid','.cx-bazi-ten-god-groups','.cx-bazi-ten-god-pillar-map','.cx-bazi-ten-god-concentration','.cx-bazi-ten-god-composition','--bazi-ten-god-ratio','--bazi-ten-god-group-ratio'])assert.ok(css.includes(token),`W3 CSS missing ${token}`);
assert.match(css,/@media\(max-width:1050px\)/);
assert.match(css,/@media\(max-width:767px\)/);

// Exercise the canonical specialist renderer with a tiny DOM facade only for CSS-link installation.
globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild:()=>{}}};
const {renderBaziProduct}=await import('../assets/customer-ui/js/specialists/bazi/product-renderer.js');
const product=adaptBaziPersonalRealityProduct({report:native,locale:'zh-Hans'});
const rendered=renderBaziProduct({product});
assert.equal(rendered.status,'RENDERED');
assert.ok(rendered.readingHtml.length>5000);
assert.match(rendered.readingHtml,/十神 · 10 神分布/);
assert.match(rendered.readingHtml,/五大功能组/);
assert.match(rendered.readingHtml,/柱位与来源/);
assert.match(rendered.readingHtml,/重复与集中/);
assert.match(rendered.readingHtml,/日主 × 月令 × 格局/);
assert.match(rendered.readingHtml,/真正的专业解读，从比例结束的地方开始/);
for(const label of ['比肩','劫财','食神','伤官','正财','偏财','正官','七杀','正印','偏印'])assert.ok(rendered.readingHtml.includes(label),`customer surface missing ${label}`);
for(const group of ['同类与自主','表达与输出','资源与交换','规则与压力','学习与支持'])assert.ok(rendered.readingHtml.includes(group),`customer surface missing group ${group}`);
assert.match(rendered.readingHtml,/年柱/);
assert.match(rendered.readingHtml,/月柱/);
assert.match(rendered.readingHtml,/日柱/);
assert.match(rendered.readingHtml,/时柱/);
assert.match(rendered.readingHtml,/透干/);
assert.match(rendered.readingHtml,/藏干/);
assert.match(rendered.readingHtml,/格局候选/);
assert.doesNotMatch(rendered.readingHtml,/十神结构预览/,'W2 preview should disappear once the full W3 Ten-God surface exists');
assert.doesNotMatch(rendered.readingHtml,/十神力量百分比|十神旺衰百分比|人格分数|吉凶分数|大吉|大凶|必发财|必结婚/);

const visibleText=rendered.readingHtml.replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
const bannedMainLanguage=/Full Production|Reading IR|\bauthority\b|\badmitted\b|semantic owner|受治理|权威|准入|语义\s*owner|图谱编号|\bW\d+[A-Z0-9.-]*\b/i;
assert.doesNotMatch(visibleText,bannedMainLanguage,'W0 production language regressed into W3 primary customer reading');
assert.match(rendered.technicalHtml,/十神比例把透出的十神天干与藏干等权统计/);

console.log('✓ BAZI-CX-PRO W3 Ten-God visual projection and professional composition passed.');
console.log(`  Ten Gods ${ten.items.length}/10; functional groups ${ten.groups.length}/5; source locations ${ten.total}; repeated ${ten.concentration.repeatedCodes.length}; pattern-linked ${ten.patternContext.monthCommandCandidateCodes.length}.`);
