import {composeNumR20Pages,verifyNumR20Snapshot,calculateNumPublicationSnapshot} from './numerology-publication-adapter.js';
import {renderNumR20PublicationHtml} from './numerology-publication-html.js';
import {buildNumR27SourceView} from './numerology-school-transparent.js';
import {buildNumerologyChartModel} from '../../customer-projection/numerology-customer-reading-envelope-v1.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {renderNumR28Diagram} from './numerology-publication-diagrams.js';

export const NUM_R28_VERSION='NUM-R28-UNIFIED-PUBLICATION-CANDIDATE-v1';
export const NUM_R28_FAMILIES=Object.freeze({L1:['P06','P07','P08'],L2:['P09','P10','P11','P12'],L3:['P13','P14','P15','P16','P17','P18'],L4:['P19','P20'],L5:['P21','P22','P23','P24']});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const purposes=['CORE_HIERARCHY','BIRTH_CALCULATION_TREE','ROLE_NETWORK','BIRTH_FREQUENCY_MATRIX','NAME_CALCULATION_TREE','PRIMARY_PATTERN_HIERARCHY','COMPOUND_PATTERN_MAP','RESOURCE_STRUCTURE','CONDITIONAL_PRESSURE','SELF_DIRECTION','INTERACTION_CONTEXT','WORK_DEVELOPMENT','VALUE_ALLOCATION','PINNACLE_CHALLENGE','PERSONAL_MONTH_WHEEL','REALITY_COMPARISON','OBSERVATION_SIGNALS','NAVIGATION_TREE','METHOD_BOUNDARIES'];

// Inject into the existing isolated delivery owner. Frozen publication is stored
// with its existing private artifact, so re-download never runs this projector.
export async function projectNumR28ForLocalDelivery({snapshot,editorial=null}){
 await verifyNumR20Snapshot(snapshot);const monthlySnapshots=[];
 if(snapshot.expansionInput.targetDate&&snapshot.readings.en.sections.timing.calendar.length){
  const year=snapshot.expansionInput.targetDate.slice(0,4);
  for(let month=1;month<=12;month++)monthlySnapshots.push(await calculateNumPublicationSnapshot({canonicalInput:snapshot.canonicalInput,expansionInput:{...snapshot.expansionInput,targetDate:year+'-'+String(month).padStart(2,'0')+'-01'},relationshipConsent:snapshot.relationshipConsent,localReview:true}));
 }
 const editorialSnapshot=editorial?{...editorial,calculationSnapshotDigest:snapshot.snapshotDigest}:null;
 return projectNumR28Publication({snapshot,monthlySnapshots,editorialSnapshot});
}

export async function projectNumR28Publication({snapshot,monthlySnapshots=[],editorialSnapshot=null,realityObservations=[]}){
 await verifyNumR20Snapshot(snapshot);
 const editorialChanges=[];const sourceView=await buildNumR27SourceView({snapshot,monthlySnapshots}),pages=structuredClone(composeNumR20Pages(snapshot));
 if(editorialSnapshot&&(editorialSnapshot.calculationSnapshotDigest!==snapshot.snapshotDigest||editorialSnapshot.pages?.length!==19||editorialSnapshot.publicationAllowed!==false))throw Error('NUM_R28_FROZEN_EDITORIAL_BINDING_REQUIRED');
 const observations=realityObservations.map(x=>{if(x.status!=='USER_CONFIRMED'||!x.sourceRef||typeof x.text!=='string')throw Error('NUM_R28_REALITY_SOURCE_REQUIRED');return{sourceRef:x.sourceRef,text:x.text,status:x.status};});
 const chartModels=Object.fromEntries(['zh-Hans','en'].map(locale=>[locale,buildNumerologyChartModel({integratedReading:snapshot.readings[locale],locale})]));
 const diagrams=pages.map((p,i)=>{
  const sourceClaimRefs=[...new Set(['zh-Hans','en'].flatMap(l=>p.languages[l].units.map(u=>u.sourceClaimId).filter(Boolean)))];
  const sourceRows=p.languages.en.structuredVisual;
  const namePage=['P10','P15','P16','P17','P18'].includes(p.logicalPageId),nameAbsent=!sourceView.name.roles.length;
  const unknownReasons=[...p.languages.en.gaps];
  if(namePage&&nameAbsent)unknownReasons.push('NAME_INPUT_NOT_ADMITTED');
  if(p.logicalPageId==='P20'&&sourceView.months.length!==12)unknownReasons.push('TWELVE_NATIVE_MONTHS_ABSENT');
  const d={logicalPageId:p.logicalPageId,diagramId:'NUM-'+purposes[i],diagramVersion:NUM_R28_VERSION,diagramFamily:Object.keys(NUM_R28_FAMILIES).find(k=>NUM_R28_FAMILIES[k].includes(p.logicalPageId)),schoolId:namePage?sourceView.name.schoolId:null,calculationAuthority:namePage?'functions/num-depth/num-secondary-chart-runtime.js':'functions/core-method-runtime/num-birth-number-runtime.js',calculationVersion:namePage?snapshot.sourceVersions.d8:snapshot.sourceVersions.calculation,inputScope:{birthDate:snapshot.canonicalInput.birthDate,targetDate:snapshot.expansionInput.targetDate??null,nameIncluded:namePage&&!nameAbsent},sourceNameKind:namePage?sourceView.name.sourceNameKind:null,sourceClaimRefs,sourcePaths:sourceRows.sourceRefs,rawValues:p.languages.en.facts,intermediates:p.logicalPageId==='P10'?sourceView.name.parts:[],reductionSteps:p.logicalPageId==='P07'?sourceView.birthRoles.map(x=>({role:x.role,steps:x.reductionSteps})):[],finalValues:sourceRows.rows,masterNumberPolicy:'COPY_NATIVE_FIELD_POLICY_NO_RENDERER_REDUCTION',availability:unknownReasons.length?'PARTIAL':'CALCULATED',unknownReasons,languagePolicy:'SAME_SNAPSHOT_LOCALIZED_LABELS',languages:Object.fromEntries(['zh-Hans','en'].map(l=>[l,{title:p.title[l],visual:p.languages[l].structuredVisual}])),snapshotDigest:snapshot.snapshotDigest};
  if(p.logicalPageId==='P06'){d.finalValues=[...sourceView.birthRoles.filter(x=>['LIFE_PATH','BIRTHDAY_NUMBER'].includes(x.role)),...sourceView.name.roles];d.sourcePaths=['sections.snapshot','depth.sections.secondaryChart.sourceAlignedCore'];}
  if(['P07','P08'].includes(p.logicalPageId))d.finalValues=sourceView.birthRoles;
  if(p.logicalPageId==='P09')d.finalValues=Object.entries(sourceView.frequency).map(([digit,value])=>({digit,value}));
  if(p.logicalPageId==='P10'){d.finalValues=sourceView.name.roles;d.sourcePaths=['depth.sections.secondaryChart.sourceAlignedCore.calculationProvenance','expansion.sections.nameNumbers.values'];}
  if(p.logicalPageId==='P10'&&(sourceView.name.parts.length>6||sourceView.name.parts.some(x=>x.token.length>24))){d.availability='BLOCKED_PRINT_BUDGET';d.unknownReasons.push('NAME_TRACE_REQUIRES_ADDITIONAL_REVIEW_SPACE');}
  if(p.logicalPageId==='P19'){d.finalValues={pinnacles:sourceView.timing.pinnacles,challenges:sourceView.timing.challenges};d.sourcePaths=['sections.timing.pinnacles','sections.timing.challenges'];d.calculationAuthority='functions/core-method-runtime/num-cycle-runtime.js';}
  if(p.logicalPageId==='P20'){d.finalValues={calendar:sourceView.timing.calendar,months:sourceView.months};d.sourcePaths=['sections.timing.calendar'];d.calculationAuthority='functions/core-method-runtime/num-cycle-runtime.js';}
  if(editorialSnapshot){const e=editorialSnapshot.pages.find(x=>x.logicalPageId===p.logicalPageId);if(!e)throw Error('NUM_R28_EDITORIAL_PAGE_MISSING');for(const locale of ['zh-Hans','en']){const text=e.languages[locale];if(!Array.isArray(text)||!text.length)throw Error('NUM_R28_EDITORIAL_LANGUAGE_REQUIRED');p.languages[locale].units=text.map((text,j)=>({unitId:p.logicalPageId+'-r27-editorial-'+j,text:(()=>{const before='出生日期频率应与姓名频率放在两个独立矩阵里，让读者一眼看出分布差异。',after='出生日期频次见上一页；本页展开姓名字母换算与姓名分布，两个输入范围分别核对。';if(p.logicalPageId==='P10'&&locale==='zh-Hans'&&text.includes(before)){editorialChanges.push({logicalPageId:p.logicalPageId,locale,before:text,after:text.replace(before,after),reason:'Align the retained prose with P09 DOB matrix and P10 name trace/frequency',sourceClaimRefs});return text.replace(before,after);}return text;})(),sourceClaimId:null,sourceRef:editorialSnapshot.sourceRef,kind:'EDITORIAL_CANDIDATE',candidateClaimRefs:sourceClaimRefs}));}}
  return d;
 });
 const overview=diagrams.find(d=>d.logicalPageId==='P06');for(const locale of ['zh-Hans','en']){const before=overview.languages[locale].visual.observation.text;const after=locale==='en'?'Compare the birth-date and eligible name roles with one actual experience; distinguish fit, counterexample and uncertainty.':'从出生日期与合格姓名的不同角色中，选一个角度核对真实经历，并区分符合、反例与未知。';overview.languages[locale].visual.observation.text=after;editorialChanges.push({logicalPageId:'P06',locale,before,after,reason:'Five-role chart replaces predecessor three-role caption',sourceClaimRefs:overview.sourceClaimRefs});}
 const result={editorialChanges,version:NUM_R28_VERSION,snapshotDigest:snapshot.snapshotDigest,sourceView,chartModels,pages,diagrams,observations,editorialStatus:editorialSnapshot?'PRIOR_R27_CANDIDATE_NOT_NEW_SOURCE_ADMISSION':'NATIVE_ADMITTED_UNITS_NOT_EDITORIALLY_COMPRESSED',customerPublishable:false};
 return deepFreeze({...result,publicationDigest:await sha256Stable(result)});
}

export function renderNumR28PublicationHtml({publication,snapshot,styles,edition='R28',...options}){
 if(publication.snapshotDigest!==snapshot.snapshotDigest||publication.version!==NUM_R28_VERSION)throw Error('NUM_R28_PUBLICATION_IDENTITY_MISMATCH');
 if(!styles?.shell||!styles?.method)throw Error('NUM_R28_SHARED_SHELL_AND_METHOD_CSS_REQUIRED');
 const lang=options.locale==='bilingual'?['zh-Hans','en']:[options.locale];
 const renderBody=({page,entry,locale,bodyUrl})=>{
  const d=publication.diagrams.find(x=>x.logicalPageId===page.logicalPageId),zh=locale!=='en';
  const title=page.title[zh?'zh-Hans':'en'];
  const panel=(part)=>lang.map(l=>`<section class="num-interpretation" lang="${l}">${locale==='bilingual'&&part!=='rest'?`<h2>${l==='en'?'English':'中文'}</h2>`:''}${page.languages[l].units.map((u,i)=>({u,i})).filter(({i})=>part==='all'||(part==='lead'?i===0:i>0)).map(({u,i})=>`<p class="num-text-${i===0?'lead':'body'}" data-unit="${esc(u.unitId)}" data-claim="${esc(u.sourceClaimId||'')}" data-claim-candidates="${esc((u.candidateClaimRefs||[]).join(' '))}">${esc(u.text)}</p>`).join('')}</section>`).join('');
  const diagramHtml=`<figure class="pub-visual num-diagram-frame">${renderNumR28Diagram({diagram:d,publication,locale})}<figcaption>${esc(d.languages[zh?'zh-Hans':'en'].visual.observation.text)}</figcaption></figure>`;
  const panelHtml=part=>`<div class="num-interpretation-panels num-panel-${part}" data-language-count="${lang.length}">${panel(part)}</div>`;
  const composition=['L2','L3','L5'].includes(d.diagramFamily)?panelHtml('lead')+diagramHtml+panelHtml('rest'):diagramHtml+panelHtml('all');
  return `<section class="sheet body pub-page pub-composed-page num-publication-page num-family-${d.diagramFamily}" data-family="${d.diagramFamily}" data-page-id="${page.logicalPageId}" data-physical="${entry.physicalPageNumber}" data-snapshot="${snapshot.snapshotDigest}"><div class="pub-decoration pub-decoration--single"><img class="pub-page-background" alt="" src="${bodyUrl}"></div><header class="pub-header"><span class="num-brand">PHI <b>OS</b></span><span>${zh?'数字学 · 个人解读':'NUMEROLOGY · PERSONAL READING'}<small>${page.logicalPageId} / ${entry.physicalPageNumber}</small></span></header><div class="pub-heading"><p class="num-section-heading">${d.diagramFamily} · ${zh?'结构与观察':'STRUCTURE & OBSERVATION'}</p><h1>${esc(title)}</h1>${locale==='bilingual'?`<p class="num-subtitle">${esc(page.title.en)}</p>`:''}</div><div class="num-page-content">${composition}</div><footer class="pub-footer"><span>${zh?'本地合成审阅候选 · 传统象征解释':'Synthetic local candidate · Traditional symbolic interpretation'}</span><span>PHI OS · ${entry.physicalPageNumber} / 33</span></footer></section>`;
 };
 const result=renderNumR20PublicationHtml({...options,snapshot,pages:publication.pages,bodyContentRenderer:renderBody});
 const css=`<style>${styles.shell}\n${styles.method}</style>`;
 return {...result,html:result.html.replace('</style>','</style>'+css).replace('<section class="sheet', '<body><main class="pub-report num-publication" data-print-shell="PHI-OS-REPORT-PRINT-SHELL-V2" data-edition="'+edition+'" data-locale="'+options.locale+'"><section class="sheet').replace('</html>','</main></body></html>'),publicationDigest:publication.publicationDigest,layoutIdentity:edition==='R29'?'NUM-R29-BODY-EDITORIAL-v1':NUM_R28_VERSION,customerPublishable:false};
}
