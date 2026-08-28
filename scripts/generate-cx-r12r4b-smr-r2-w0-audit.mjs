import fs from 'node:fs';
import assert from 'node:assert/strict';

const ROOT='content/customer-experience-rebuild/r12r4b';
const OLD=`${ROOT}/smr`;
const OUT=`${ROOT}/smr-r2/audit`;
const checkOnly=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stable=value=>JSON.stringify(value,null,2)+'\n';
const write=(path,value)=>{const text=stable(value);if(checkOnly){assert.equal(fs.readFileSync(path,'utf8'),text,`${path} is stale`)}else fs.writeFileSync(path,text)};
const list=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(list(v).filter(Boolean))];
const normalize=text=>String(text??'').toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
const paraKey=item=>normalize(item?.text);

const review=read(`${OLD}/review/smr-human-review-cases-v1.json`);
const results=read(`${OLD}/review/smr-human-review-results-v1.json`);
const admission=read(`${OLD}/admission/smr-production-admission-v1.json`);
const machine=read(`${OLD}/machine/smr-machine-campaign-v1.json`);
const cases=list(review.cases);

function paragraphs(report){
  return list(report?.sections).filter(section=>section.state==='AVAILABLE').flatMap(section=>list(section.paragraphs).map(paragraph=>({sectionId:section.sectionId,...paragraph})));
}
function caseMetrics(item){
  const report=item.report,ps=paragraphs(report),counts=new Map(),unitSections=new Map(),unitParagraphs=new Map();
  for(const paragraph of ps){
    const key=paraKey(paragraph);counts.set(key,(counts.get(key)||0)+1);
    for(const ref of list(paragraph.interpretationUnitRefs)){
      if(!unitSections.has(ref))unitSections.set(ref,new Set());unitSections.get(ref).add(paragraph.sectionId);
      if(!unitParagraphs.has(ref))unitParagraphs.set(ref,[]);unitParagraphs.get(ref).push(key);
    }
  }
  const exactDuplicateParagraphs=[...counts.values()].reduce((sum,count)=>sum+Math.max(0,count-1),0);
  const crossSectionRestatedUnits=[...unitSections].filter(([,sections])=>sections.size>1).map(([ref,sections])=>({interpretationUnitRef:ref,sectionCount:sections.size,sections:[...sections].sort()}));
  const semanticRestatementUnits=[...unitParagraphs].filter(([,texts])=>new Set(texts).size>1&&texts.length>1).map(([ref,texts])=>({interpretationUnitRef:ref,paragraphCount:texts.length,distinctTextCount:new Set(texts).size}));
  const sectionCount=list(report?.sections).filter(section=>section.state==='AVAILABLE').length;
  const paragraphLengths=ps.map(p=>String(p.text??'').length);
  return {
    caseId:item.caseId,methodId:item.methodId,locale:item.locale,intentId:item.intentId,
    sectionCount,paragraphCount:ps.length,averageParagraphCharacters:paragraphLengths.length?Math.round(paragraphLengths.reduce((a,b)=>a+b,0)/paragraphLengths.length):0,
    exactDuplicateParagraphs,crossSectionRestatedUnitCount:crossSectionRestatedUnits.length,semanticRestatementUnitCount:semanticRestatementUnits.length,
    exactDuplicateRatio:ps.length?Number((exactDuplicateParagraphs/ps.length).toFixed(4)):0,
    crossSectionRestatedUnits,semanticRestatementUnits,
    emptyAvailableSections:list(report?.sections).filter(section=>section.state==='AVAILABLE'&&!list(section.paragraphs).length).map(section=>section.sectionId)
  };
}
const metrics=cases.map(caseMetrics);
const byGroup=new Map();
for(const item of cases){const key=`${item.methodId}:${item.locale}`;if(!byGroup.has(key,[]))byGroup.set(key,[]);byGroup.get(key).push(item)}
const intentResponsiveness=[...byGroup.entries()].map(([group,items])=>{
  const sequences=items.map(item=>paragraphs(item.report).map(p=>paraKey(p)).join('\n---\n'));
  const structures=items.map(item=>list(item.report?.sections).map(s=>[s.sectionId,s.state,list(s.interpretationUnitRefs)].join(':')).join('|'));
  return {group,caseCount:items.length,intentIds:items.map(x=>x.intentId),uniqueParagraphSequences:new Set(sequences).size,uniqueSectionStructures:new Set(structures).size,questionResponsive:new Set(sequences).size>1};
});
const avg=field=>Number((metrics.reduce((sum,item)=>sum+item[field],0)/(metrics.length||1)).toFixed(2));
const total=field=>metrics.reduce((sum,item)=>sum+item[field],0);
const affected=predicate=>metrics.filter(predicate).length;

const currentBaseline={
  schemaVersion:'PHI-OS-SMR-R2-CURRENT-BASELINE-v1.0.0',
  work:'CX-R12R4B-SMR-R2-W0',baselineCommit:'abab6b358bff574c65b9dfacc7985d5de564d674',
  historicalSmr:{campaignRef:`${OLD}/review/smr-human-review-cases-v1.json`,machineCampaignRef:`${OLD}/machine/smr-machine-campaign-v1.json`,caseCount:cases.length,methodCounts:Object.fromEntries(['AST','BZR','ZWR','NUM'].map(m=>[m,cases.filter(x=>x.methodId===m).length])),machineStatus:machine.status,humanReviewStatus:results.status,productionAllowed:admission.productionAllowed,customerCutoverAllowed:admission.customerCutoverAllowed,evidenceState:'HISTORICAL_CONTENT_QUALITY_EVIDENCE',lifecycle:'SUPERSEDED'},
  measured:{averageSectionsPerReport:avg('sectionCount'),averageParagraphsPerReport:avg('paragraphCount'),averageParagraphCharacters:avg('averageParagraphCharacters'),averageExactDuplicateParagraphsPerReport:avg('exactDuplicateParagraphs'),totalExactDuplicateParagraphOccurrences:total('exactDuplicateParagraphs'),reportsWithExactDuplicates:affected(x=>x.exactDuplicateParagraphs>0),reportsWithCrossSectionRestatement:affected(x=>x.crossSectionRestatedUnitCount>0),averageCrossSectionRestatedUnitsPerReport:avg('crossSectionRestatedUnitCount'),reportsWithSemanticRestatement:affected(x=>x.semanticRestatementUnitCount>0),sameMethodLocaleIntentGroups:intentResponsiveness.length,questionResponsiveGroups:intentResponsiveness.filter(x=>x.questionResponsive).length},
  auditConclusion:{contentQualityAccepted:false,old48MayBePromotedToAccepted:false,old48MayBeMutatedToPass:false,requiresR2Regeneration:true,reasonCodes:['HIGH_EXACT_DUPLICATION','CROSS_SECTION_RESTATEMENT','QUESTION_VARIANTS_DO_NOT_CHANGE_BODY','ONE_STRUCTURAL_AUTHORITY_PER_METHOD_CAMPAIGN','DENSITY_WITHOUT_INFORMATION_GAIN_GATE']},
  boundary:{methodRuntimeRecalculatedByAudit:false,meaningAuthorityChanged:false,humanResultsRewritten:false,productionAdmissionChanged:false}
};

const failures=[
  ['F01','EXACT_DUPLICATE','OBSERVED',affected(x=>x.exactDuplicateParagraphs>0),'Exact normalized paragraph text repeats within a report.'],
  ['F02','SEMANTIC_DUPLICATE','OBSERVED',affected(x=>x.semanticRestatementUnitCount>0),'The same accepted interpretation unit is paraphrased repeatedly inside one report.'],
  ['F03','CROSS_SECTION_RESTATEMENT','OBSERVED',affected(x=>x.crossSectionRestatedUnitCount>0),'The same accepted interpretation unit is fully restated across multiple sections.'],
  ['F04','GENERIC_FILLER','NOT_OBSERVED_BY_CURRENT_MACHINE_RULES',0,'Legacy quality checks do not identify generic filler; this does not establish paid-value quality.'],
  ['F05','LOW_INFORMATION_GAIN','OBSERVED',affected(x=>x.crossSectionRestatedUnitCount>0),'Available sections reuse existing units without a section-level new-information eligibility gate.'],
  ['F06','TECHNICAL_OVERLOAD','UNVERIFIED',null,'No frozen technical-to-customer content ratio exists in legacy SMR.'],
  ['F07','WEAK_PRIORITY','OBSERVED',affected(x=>x.exactDuplicateRatio>=0.25),'Priority does not materially suppress repeated lower-information paragraphs.'],
  ['F08','QUESTION_NOT_ANSWERED','OBSERVED',cases.length,'Different intent variants within the same method/locale produce the same paragraph sequence.'],
  ['F09','METHOD_GLOSSARY','UNVERIFIED',null,'Method-specific glossary dominance is not measured by the legacy gate.'],
  ['F10','UNTRACEABLE_CLAIM','NOT_OBSERVED',0,'Legacy paragraphs are lineage-bound; traceability itself is not the current failure.'],
  ['F11','LAYOUT_DENSITY','OBSERVED',affected(x=>x.paragraphCount>24),'Legacy reports exceed the R2 audit density threshold of 24 body paragraphs without information-gain gating.'],
  ['F12','MOBILE_FAILURE','UNVERIFIED',null,'Legacy review CSS has a breakpoint but no mobile reading-layout contract or wall-of-text gate.'],
  ['F13','PRINT_FAILURE','UNVERIFIED',null,'Legacy review CSS has print rules but no widow/orphan, clipped-chart, or UI-control contract.'],
  ['F14','FALSE_DEPTH','OBSERVED',affected(x=>x.exactDuplicateRatio>=0.25),'Length is materially inflated by repeated explanation rather than new claims or relations.'],
  ['F15','TEMPLATE_SUBSTITUTION','OBSERVED',cases.length,'The legacy campaign varies locale/intent over one underlying authority per method, so it is not structural-diversity evidence.']
].map(([failureId,code,state,affectedCaseCount,evidence])=>({failureId,code,state,affectedCaseCount,evidence}));
const failureRegistry={schemaVersion:'PHI-OS-SMR-R2-REPORT-FAILURE-REGISTRY-v1.0.0',work:'CX-R12R4B-SMR-R2-W0',taxonomy:failures,summary:{observed:failures.filter(x=>x.state==='OBSERVED').map(x=>x.failureId),unverified:failures.filter(x=>x.state==='UNVERIFIED').map(x=>x.failureId),notObserved:failures.filter(x=>x.state.startsWith('NOT_OBSERVED')).map(x=>x.failureId)},governance:{auditEvidenceDoesNotCreateMeaning:true,unverifiedDoesNotMeanPass:true}};

const sectionNames=uniq(cases.flatMap(item=>list(item.report?.sections).map(s=>s.sectionId))).sort();
const sectionMatrix={schemaVersion:'PHI-OS-SMR-R2-SECTION-DUPLICATION-MATRIX-v1.0.0',work:'CX-R12R4B-SMR-R2-W0',sections:sectionNames,matrix:sectionNames.map(sectionId=>{
  const rows=metrics.map((metric,index)=>{const report=cases[index].report,section=list(report.sections).find(s=>s.sectionId===sectionId);if(!section||section.state!=='AVAILABLE')return null;const sectionUnits=new Set(list(section.interpretationUnitRefs));const otherUnits=new Set(list(report.sections).filter(s=>s.sectionId!==sectionId&&s.state==='AVAILABLE').flatMap(s=>list(s.interpretationUnitRefs)));const reused=[...sectionUnits].filter(ref=>otherUnits.has(ref));return {caseId:metric.caseId,unitCount:sectionUnits.size,reusedElsewhereCount:reused.length,reuseRatio:sectionUnits.size?Number((reused.length/sectionUnits.size).toFixed(4)):0}}).filter(Boolean);return {sectionId,availableCaseCount:rows.length,averageUnitReuseRatio:rows.length?Number((rows.reduce((s,x)=>s+x.reuseRatio,0)/rows.length).toFixed(4)):0,casesWithReuse:rows.filter(x=>x.reusedElsewhereCount>0).length};}),intentResponsiveness};

const reviewHtml=fs.readFileSync(`${OLD}/review/smr-human-review.html`,'utf8');
const layoutGap={schemaVersion:'PHI-OS-SMR-R2-LAYOUT-GAP-MATRIX-v1.0.0',work:'CX-R12R4B-SMR-R2-W0',legacySurface:`${OLD}/review/smr-human-review.html`,checks:[
  {check:'desktopContentWidthFrozen',state:'ABSENT',evidence:'No versioned reading-layout contract is referenced by legacy SMR.'},
  {check:'firstScreenMaxBlocks',state:'ABSENT',evidence:'No first-screen block/theme maximum is frozen.'},
  {check:'mobileBreakpointPresent',state:reviewHtml.includes('@media(max-width:700px)')?'PRESENT':'ABSENT',evidence:'A review-page CSS breakpoint exists, but it is not a customer reading contract.'},
  {check:'mobileWallOfTextGate',state:'ABSENT',evidence:'No maximum theme-card/paragraph density rule exists.'},
  {check:'technicalDefaultCollapsed',state:'ABSENT',evidence:'No progressive-disclosure contract freezes technical default collapse.'},
  {check:'printMediaPresent',state:reviewHtml.includes('@media print')?'PRESENT':'ABSENT',evidence:'Basic print CSS exists only for the review page.'},
  {check:'widowOrphanPolicy',state:'ABSENT',evidence:'No widow/orphan contract.'},
  {check:'clippedChartPolicy',state:'ABSENT',evidence:'No print chart clipping contract.'},
  {check:'uiOnlyControlRemoval',state:reviewHtml.includes('.top,.review{display:none}')?'PARTIAL':'ABSENT',evidence:'Review controls are hidden, but there is no general product print contract.'}
],conclusion:'R2_LAYOUT_CONTRACT_REQUIRED'};

write(`${OUT}/smr-r2-current-baseline-v1.json`,currentBaseline);
write(`${OUT}/smr-r2-report-failure-registry-v1.json`,failureRegistry);
write(`${OUT}/smr-r2-section-duplication-matrix-v1.json`,sectionMatrix);
write(`${OUT}/smr-r2-layout-gap-matrix-v1.json`,layoutGap);
if(checkOnly)console.log('✓ CX-R12R4B SMR-R2 W0 audit artifacts are current.');
