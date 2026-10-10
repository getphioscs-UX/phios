import {sha256Canonical} from '../canonical-meaning-runtime/canonical-meaning-runtime.js';

export const AST_CX_R3_CUSTOMER_EXPERIENCE_SCHEMA='PHI-OS-AST-CX-R3-CUSTOMER-EXPERIENCE-PROJECTION-v1.0.0';
export const AST_CX_R3_W13_W16_BASELINE='ea68b40a8ee32754e04cfc3aba6eede271dc63f5';

const list=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(list(v).filter(Boolean))];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const fail=code=>{throw Object.assign(new Error(code),{code})};
const normalized=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').replace(/[\p{P}\p{S}]+/gu,'').trim();
const overlap=(a,b)=>{const set=new Set(list(a));return list(b).some(x=>set.has(x))};
const REALITY_RESPONSES=new Set(['CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT','OPEN']);

function ownershipProjection(product,reading){
  const themes=list(product?.keyConfigurations),themeRefs=new Set(themes.map(x=>x.themeRef));
  const owners=list(reading?.ownership?.fullNarrativeOwners);
  const ownerByNarrative=new Map(),ownerByRender=new Map();
  for(const owner of owners){
    if(!owner?.narrativeRef||!owner?.renderOwnerId)fail('AST_CX_R3_W14_NARRATIVE_OWNER_INCOMPLETE');
    if(ownerByNarrative.has(owner.narrativeRef))fail('AST_CX_R3_W14_DUPLICATE_NARRATIVE_REF');
    if(ownerByRender.has(owner.renderOwnerId))fail('AST_CX_R3_W14_DUPLICATE_RENDER_OWNER');
    ownerByNarrative.set(owner.narrativeRef,owner);ownerByRender.set(owner.renderOwnerId,owner);
  }
  for(const theme of themes){
    const owner=ownerByNarrative.get(theme.narrativeRef);
    if(!owner||owner.renderOwnerId!==theme.renderOwnerId)fail(`AST_CX_R3_W14_THEME_OWNER_MISMATCH:${theme.themeRef}`);
  }
  const fullTexts=[product?.overview?.readerSummary,...themes.map(x=>x.readerText)].filter(Boolean);
  const exact=new Set(),norm=new Set();let exactDuplicates=0,normalizedDuplicates=0;
  for(const text of fullTexts){if(exact.has(text))exactDuplicates++;else exact.add(text);const n=normalized(text);if(n){if(norm.has(n))normalizedDuplicates++;else norm.add(n)}}
  if(exactDuplicates||normalizedDuplicates)fail('AST_CX_R3_W14_DUPLICATE_FULL_NARRATIVE');
  return {
    policy:'ONE_NARRATIVE_REF_ONE_FULL_EXPLANATION_OWNER',
    overviewOwner:{narrativeRef:product?.overview?.narrativeRef||null,renderOwnerId:product?.overview?.renderOwnerId||null},
    themeOwners:themes.map(x=>({themeRef:x.themeRef,narrativeRef:x.narrativeRef,renderOwnerId:x.renderOwnerId,tier:x.tier,rank:x.rank})),
    fullExplanationOwnerCount:owners.length,
    exactDuplicateFullExplanationCount:exactDuplicates,
    normalizedDuplicateFullExplanationCount:normalizedDuplicates,
    unownedThemeRefs:themes.filter(x=>!themeRefs.has(x.themeRef)).map(x=>x.themeRef)
  };
}

function readingUnits(product){
  const support=list(product?.wholeChartReading?.support),tension=list(product?.wholeChartReading?.tension);
  return list(product?.keyConfigurations).map(theme=>({
    themeRef:theme.themeRef,
    rank:theme.rank,
    tier:theme.tier,
    narrativeRef:theme.narrativeRef,
    renderOwnerId:theme.renderOwnerId,
    bodyCodes:list(theme.bodyCodes),
    houseNumbers:list(theme.houseNumbers),
    angleCodes:list(theme.angleCodes),
    patternCode:theme.patternCode||null,
    technicalLabel:theme.technicalLabel||null,
    evidenceCount:uniq([...(theme.evidenceRefs||[]),...(theme.sourceRefs||[])]).length,
    supportSignalRefs:support.filter(x=>overlap(theme.sourceRefs,x.sourceRefs)||overlap(theme.evidenceRefs,x.sourceRefs)).map(x=>x.signalRef),
    tensionSignalRefs:tension.filter(x=>overlap(theme.sourceRefs,x.sourceRefs)||overlap(theme.evidenceRefs,x.sourceRefs)).map(x=>x.signalRef)
  }));
}

function intentProjection(product,intentViews){
  const baseRefs=list(product?.keyConfigurations).map(x=>x.themeRef),allowed=new Set(baseRefs),seen=new Set();
  const views=[];
  for(const input of list(intentViews)){
    const id=String(input?.intentId||'').toUpperCase();if(!id||seen.has(id))continue;seen.add(id);
    const ordered=uniq(list(input.priorityThemeRefs).filter(x=>allowed.has(x)));
    const refs=[...ordered,...baseRefs.filter(x=>!ordered.includes(x))];
    views.push({intentId:id,label:input.label||id,priorityThemeRefs:refs,readerText:input.readerText||null,sourceRefs:list(input.sourceRefs),meaningChanged:false});
  }
  if(!views.some(x=>x.intentId==='OPEN'))views.unshift({intentId:'OPEN',label:product?.locale==='zh-Hans'?'开放探索':'Open reading',priorityThemeRefs:[...baseRefs],readerText:null,sourceRefs:[],meaningChanged:false});
  const active=String(list(product?.intentViews)[0]?.intentId||'OPEN').toUpperCase();
  return {activeIntentId:views.some(x=>x.intentId===active)?active:'OPEN',views,baseThemeRefs:baseRefs,meaningChanged:false};
}

function realityProjection(product,binding){
  if(!binding)return {state:'NOT_BOUND',owner:'CX-R12R4B',items:[],unmatchedRefs:[],customerSelfReportUsed:false,chartUsedAsRealityProof:false};
  if(binding.owner!=='CX-R12R4B')fail('AST_CX_R3_W16_REALITY_OWNER_REQUIRED');
  const allowed=new Set(list(product?.keyConfigurations).map(x=>x.themeRef)),items=[],unmatched=[];
  for(const input of list(binding.items)){
    const themeRef=input?.themeRef||input?.claimRef||null;if(!themeRef){unmatched.push(null);continue}
    if(!allowed.has(themeRef)){unmatched.push(themeRef);continue}
    const response=String(input?.customerResponse||input?.response||'').toUpperCase();
    if(!REALITY_RESPONSES.has(response))fail(`AST_CX_R3_W16_REALITY_RESPONSE_INVALID:${response||'EMPTY'}`);
    items.push({themeRef,customerResponse:response,source:'CUSTOMER',capturedAt:input?.capturedAt||null,sourceRefs:list(input?.sourceRefs)});
  }
  return {state:items.length?'BOUND':'NOT_BOUND',owner:'CX-R12R4B',items,unmatchedRefs:unmatched.filter(Boolean),customerSelfReportUsed:items.length>0,chartUsedAsRealityProof:false};
}

export async function buildAstCustomerExperienceProjectionV1({customerProductProjection,reading,intentViews=[],realityComparison=null}={}){
  if(customerProductProjection?.schemaVersion!=='PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0'||customerProductProjection?.methodId!=='AST')fail('AST_CX_R3_W13_PRODUCT_V3_REQUIRED');
  if(reading?.schemaVersion!=='PHI-OS-AST-CUSTOMER-READING-IA-v2.0.0')fail('AST_CX_R3_W14_READING_V2_REQUIRED');
  const ownership=ownershipProjection(customerProductProjection,reading),units=readingUnits(customerProductProjection),intentLens=intentProjection(customerProductProjection,intentViews),reality=realityProjection(customerProductProjection,realityComparison);
  const core={
    schemaVersion:AST_CX_R3_CUSTOMER_EXPERIENCE_SCHEMA,
    workCode:'AST-CX-R3-W13-W16',
    methodId:'AST',
    baselineCommit:AST_CX_R3_W13_W16_BASELINE,
    locale:customerProductProjection.locale,
    sourceProductSemanticDigest:customerProductProjection.semanticDigest,
    wholeChartReading:{
      ownerPolicy:ownership.policy,
      overviewOwner:ownership.overviewOwner,
      themeOwners:ownership.themeOwners,
      readingUnits:units,
      support:list(customerProductProjection?.wholeChartReading?.support),
      tension:list(customerProductProjection?.wholeChartReading?.tension),
      unknowns:list(customerProductProjection?.wholeChartReading?.unknowns),
      exactDuplicateFullExplanationCount:ownership.exactDuplicateFullExplanationCount,
      normalizedDuplicateFullExplanationCount:ownership.normalizedDuplicateFullExplanationCount
    },
    narrativeOwnership:ownership,
    intentLens,
    realityComparison:reality,
    governance:{
      presentationProjectionOnly:true,
      createsCalculation:false,
      createsCanonicalProjection:false,
      createsMeaning:false,
      createsReadingAuthority:false,
      rewritesAdmittedNarrative:false,
      intentChangesMeaning:false,
      realityAuthorityCreated:false,
      chartUsedAsRealityProof:false,
      crossMethodCompositionCreated:false,
      rendererMayCreateMeaning:false,
      pprR3SharedHostMutationRequired:false
    }
  };
  const semanticDigest=await sha256Canonical(core);
  return freeze({...core,semanticDigest});
}

export default Object.freeze({AST_CX_R3_CUSTOMER_EXPERIENCE_SCHEMA,AST_CX_R3_W13_W16_BASELINE,buildAstCustomerExperienceProjectionV1});
