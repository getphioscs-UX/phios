import {createHash} from 'node:crypto';
import {buildAstFixedAssetR21Candidate} from '../../functions/ast-full-production/ast-fixed-asset-r21-candidate.js';
import {resolveAstFigures} from '../../functions/ast-full-production/ast-publication-freeze-v1.js';
import {reflowAstSubjectD12R33} from './ast-subject-figure-layout-r33.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),fail=c=>{throw Error(c);};
export const AST_SUBJECT_PUBLISHER_VERSION='AST-R1R5-R21-SUBJECT-BINDING-R33-1';
export const AST_FULL_FIGURES=['AST-D01','AST-D02','AST-D04','AST-D05','AST-D06','AST-D07','AST-D08','AST-D09','AST-D10','AST-D11','AST-D12','AST-D14','AST-D15'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const signZh=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
export function astSubjectCaptionsR33(data){
 const angle=id=>data.angles.find(a=>a.code===id)?.value;
 if(!Number.isFinite(angle('ASC'))||!Number.isFinite(angle('MC')))fail('AST_CURRENT_ANGLES_REQUIRED');
 const label=(id,zh)=>{const v=angle(id);return (zh?signZh:signs)[Math.floor(v/30)]+' '+(v%30).toFixed(2)+'°';};
 const current={};for(const id of AST_FULL_FIGURES)current[id]={zh:'依据当前命盘的位置、宫位与实际连接绘制；不推断现实事件。',en:'Drawn from this chart’s positions, houses and recorded connections; no personal event is inferred.'};
 current['AST-D01']={zh:`上升 ${label('ASC',true)}；中天 ${label('MC',true)}。`,en:`Ascendant ${label('ASC',false)}; Midheaven ${label('MC',false)}.`};
 current['AST-D02']={zh:`当前 ${Object.keys(data.bodies).length} 颗核心星体，${data.cusps.length} 个宫头。`,en:`${Object.keys(data.bodies).length} core bodies and ${data.cusps.length} house cusps from this chart.`};
 current['AST-D06']={zh:`当前命盘记录 ${data.aspects.length} 条相位，不使用另一命盘的相位网络。`,en:`This chart records ${data.aspects.length} aspects; another chart’s network is not reused.`};
 current['AST-D05']={zh:'元素与模式按当前星体位置统计，数量不等于人格结论。',en:'Element and modality counts use current body positions; counts are not personality conclusions.'};
 current['AST-D10']={zh:`中天 ${label('MC',true)}；公共方向路径使用本命盘实际守护星位置。`,en:`Midheaven ${label('MC',false)}; the public-direction route uses the actual natal ruler placement.`};
 current['AST-D12']={zh:'本命结构中的压力连接；没有时序 Authority，不提供日期或事件预测。',en:'Tension links in the natal structure. Without timing authority, no dated or event forecast is supplied.'};
 current['AST-D15']={zh:'出生结构、象征解释与现实证据保持区分。',en:'Natal structure, symbolic interpretation and real-life evidence remain distinct.'};return current;
}
// A configured successor over the ORIGINAL R1R5 DOM paginator and R21 fixed
// artwork binding. Never executes the TL build script or rewrites its registry.
export async function buildAstSubjectFullPublicationR33({referenceHtml,manifest,figureManifest,profile,data,manuscript,subject,qa=false}){
 if(!subject?.personId||!subject.inputDigest||!subject.calculationDigest||!manuscript||manuscript.personId!==subject.personId||manuscript.inputDigest!==subject.inputDigest||manuscript.calculationDigest!==subject.calculationDigest)fail('AST_SUBJECT_MANUSCRIPT_BINDING_REQUIRED');
 if(qa?manuscript.scope!=='ISOLATED_QA_FULL_PUBLISHER':manuscript.scope!=='OWNER_ADMITTED_CUSTOMER_MANUSCRIPT')fail('AST_FULL_MANUSCRIPT_SCOPE_REQUIRED');
 if(manuscript.timingAuthority!==null)fail('AST_R33_TIMING_AUTHORITY_NOT_IMPLEMENTED');
 if(data.sourceDigests.canonicalProjectionDigest!==subject.calculationDigest)fail('AST_FIGURE_NATIVE_CALCULATION_MISMATCH');
 const r21=await buildAstFixedAssetR21Candidate({publicationHtml:referenceHtml,manifest});
 const match=r21.html.match(/<script type="application\/json" id="model">([\s\S]*?)<\/script>/);if(!match)fail('AST_ORIGINAL_PUBLISHER_MODEL_REQUIRED');
 const old=JSON.parse(match[1]),model=structuredClone(old),ids=old.sections.map(s=>s.sectionId);
 if(JSON.stringify(manuscript.sections.map(s=>s.sectionId))!==JSON.stringify(ids))fail('AST_FULL_TEN_CHAPTERS_REQUIRED');
 const figures=resolveAstFigures(data,figureManifest,profile),captions=astSubjectCaptionsR33(data);
 let geometryProof=null;
 if(new Set(data.tension.flatMap(e=>[data.bodies[e.fromCode].houseNumber,data.bodies[e.toCode].houseNumber])).size>2){
  if(!qa)fail('AST_D12_NEW_SUBJECT_LAYOUT_SIGNOFF_REQUIRED');
  const entry=figureManifest.entries.find(e=>e.diagramId==='AST-D12'),result=reflowAstSubjectD12R33(data,{rendererFile:entry.rendererModule,expectedBaseSHA256:entry.rendererDigest}),f=figures.find(f=>f.diagramId==='AST-D12');
  f.svg=result.svg;f.renderDigest=hash(result.svg);f.rendererVersion+=':R33-NATIVE-D12-REFLOW-QA';geometryProof=result.proof;
 }
 if(figures.length!==AST_FULL_FIGURES.length||JSON.stringify(figures.map(f=>f.diagramId).sort())!==JSON.stringify([...AST_FULL_FIGURES].sort()))fail('AST_FROZEN_FIGURE_SET_MISMATCH');
 const ledger=[];
 model.display={...subject.display};model.legacyClosing=false;
 model.sections=old.sections.map(s=>{const body=manuscript.sections.find(m=>m.sectionId===s.sectionId);
  for(const key of ['personId','inputDigest','calculationDigest'])if(body.sourceBinding?.[key]!==subject[key])fail('AST_CHAPTER_CURRENT_SUBJECT_BINDING_REQUIRED');
  for(const l of ['zhHans','en']){const locale=l==='zhHans'?'zh-Hans':'en';if(!/^[a-f0-9]{64}$/.test(manuscript.authoringBindings?.[locale]||'')||body.sourceBinding?.authoringPacks?.[locale]!==manuscript.authoringBindings[locale])fail('AST_CHAPTER_AUTHORING_PACK_BINDING_REQUIRED');if(!body.localeBlocks?.[l]?.length||body.localeBlocks[l].some(b=>!b.paragraphs?.length||!b.sourceRefs?.length))fail('AST_FULL_BILINGUAL_SOURCE_REQUIRED');}
  const insertions={},diagrams=s.diagrams.map((original,i)=>{const f=figures.find(f=>f.diagramId===original.id);if(!f)fail('AST_FROZEN_FIGURE_MISSING');const caption=captions[f.diagramId];insertions[f.diagramId]=[body.localeBlocks.zhHans[0].blockId,Math.min(i,body.localeBlocks.zhHans[0].paragraphs.length-1)];ledger.push({diagramId:f.diagramId,dataDigest:f.dataDigest,renderDigest:f.renderDigest,rendererVersion:f.rendererVersion,caption,sectionId:s.sectionId});
   return {...original,html:`<figure class="figure" data-diagram="${f.diagramId}"><h3>${esc(s.title)} <span>${esc(s.englishTitle)}</span></h3>${f.svg}<figcaption>${esc(caption.zh)}<br>${esc(caption.en)}</figcaption></figure>`};});
  return {...s,localeBlocks:structuredClone(body.localeBlocks),diagrams,insertions};});
 const modelText=JSON.stringify(model).replaceAll('<','\\u003c');
 let html=r21.html.replace(match[0],()=>'<script type="application/json" id="model">'+modelText+'</script>');
 // Preserve legacy TL source byte-for-byte; only the new configured client gets
 // a neutral footer, isolated-QA label and no TL-specific closing allocation.
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(subject.display.name)+' · Astrology Full Publication R33</title>');
 const footer='PHI OS · TL';if(!html.includes(footer))fail('AST_ORIGINAL_FOOTER_SHAPE_CHANGED');html=html.replaceAll(footer,qa?'PHI OS · ISOLATED QA · NOT CUSTOMER RELEASE':'PHI OS');
 const closing="s.sectionId==='SEC-10'&&i>=";if(!html.includes(closing))fail('AST_ORIGINAL_CLOSING_SHAPE_CHANGED');html=html.replace(closing,"model.legacyClosing===true&&s.sectionId==='SEC-10'&&i>=");
 // All personal locale blocks, figures, insertions and display values above are
 // replaced, not merged with reference values. Old TL figure captions cannot leak.
 const content=JSON.stringify(model.sections.map(s=>({localeBlocks:s.localeBlocks,diagrams:s.diagrams})));if(/Cancer rising|Aries Midheaven|Moon is the chart|Mars in Scorpio in house 4/.test(content))fail('AST_REFERENCE_PERSONAL_CONTENT_LEAK');
 return {html,model,ledger,receipt:{version:AST_SUBJECT_PUBLISHER_VERSION,scope:qa?'ISOLATED_QA_FULL_PUBLISHER':'PENDING_OWNER_PUBLICATION',referenceTemplateSHA256:hash(referenceHtml),referenceR21SHA256:hash(r21.html),newHtmlSHA256:hash(html),manuscriptDigest:hash(JSON.stringify(manuscript)),subject,chapterIds:ids,figureLedger:ledger,geometryProof,originalPaginatorRetained:true,fixedAssetsRetained:true,referencePersonalBlocksReplaced:true,customerManuscriptReady:false,publicationAccepted:false,providerCalls:0}};
}
