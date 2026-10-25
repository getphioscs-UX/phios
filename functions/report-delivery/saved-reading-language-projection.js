// Presentation consumer of existing persisted symbolic owners. Never draws,
// casts, translates by model, rewrites a source or creates a reading entitlement.
import {selectIChingDepthInterpretation} from '../interpretation-runtime/iching-depth-editorial-runtime-v2.js';
import {canonicalJson} from '../document-assembly/canonical-json.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const internalWarnings=new Set(['候选解释尚未完成人工来源与双语审核，不得进入公共客户输出。','候选逐爻解释尚未完成人工来源与双语审核，不得进入公共客户输出。','This candidate has not completed human source and bilingual review and cannot enter public customer output.','This line candidate has not completed human source and bilingual review and cannot enter public customer output.']);
// Same public-presentation exclusion as iching-product-view-model-v2;
// substantive boundaries are retained, original corpus bytes never changed.
const published=value=>{const copy=structuredClone(value);if(Array.isArray(copy.misreadingWarnings))copy.misreadingWarnings=copy.misreadingWarnings.filter(x=>!internalWarnings.has(x));return copy;};
export function savedPairedText(value,language){const out=[],seen=new Set(),pick=(zh,en)=>language==='zh'?zh:language==='en'?en:zh+' / '+en;
 const add=(zh,en)=>{if(typeof zh!=='string'||typeof en!=='string'||!zh.trim()||!en.trim())return;const key=zh+'\0'+en;if(!seen.has(key)){seen.add(key);out.push(pick(zh,en));}};
 function visit(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(visit);return;}for(const zh of ['zh','zh-Hans','zhHans'])add(v[zh],v.en);for(const [k,en]of Object.entries(v))if(k.endsWith('En'))add(v[k.slice(0,-2)+'ZhHans'],en);Object.values(v).forEach(visit);}visit(value);return out;
}
const fields={plainMeaning:['含义','Meaning'],situationOrStage:['处境与阶段','Situation or stage'],centralTension:['张力','Tension'],constructiveExpressionOrMovement:['建设性使用','Constructive use'],distortionOrFailureRisk:['误用风险','Risk of misuse'],timingOrCondition:['条件与时机','Conditions and timing'],whatToObserve:['可以观察什么','What to observe'],reflectionQuestions:['反思问题','Reflection questions'],misreadingWarnings:['适用边界','Boundaries']};
export async function savedReadingNarrative(record,language,{loadIChingCorpus}={}){
 const view=record.reading.publicReadingView||{},interpretation=record.reading.readingIrProjection?.interpretation;
 if(!interpretation||!Object.keys(interpretation).length)fail('READING_PERSISTED_INTERPRETATION_UNAVAILABLE');
 const t=(zh,en)=>language==='zh'?zh:language==='en'?en:zh+' / '+en;
 if(view.schemaVersion==='PHI-OS-ICHING-PRODUCT-PUBLIC-VIEW-MODEL-v2.0.0'){
  const depth=interpretation.depthInterpretation;if(depth?.status!=='AVAILABLE'||!depth.hexagram||!['en','zh-Hans'].includes(depth.locale))fail('READING_SAVED_DEPTH_UNAVAILABLE');
  const needed=language==='bilingual'?['zh-Hans','en']:[language==='zh'?'zh-Hans':'en'],versions={[depth.locale]:[depth.hexagram,...(depth.lines||[])]};let resource=null;
  if(needed.some(locale=>!versions[locale])){
   if(typeof loadIChingCorpus!=='function')fail('READING_TRANSLATION_UNAVAILABLE');resource=await loadIChingCorpus();const projection=view.ichingSurface||record.reading.readingIrProjection?.projection,hexagramId=projection.primary?.hexagramId,changingLines=projection.changingLines||[];
   const selected=selectIChingDepthInterpretation({hexagramId,changingLines,locale:depth.locale,admittedCorpus:resource.corpus});if(selected.status!=='AVAILABLE')fail('READING_TRANSLATION_VERSION_UNAVAILABLE');const originals=[selected.hexagram,...selected.lines];
   if(originals.length!==versions[depth.locale].length||originals.some((unit,i)=>unit.interpretationId!==versions[depth.locale][i].interpretationId||unit.coordinate!==versions[depth.locale][i].coordinate||canonicalJson(published(unit.content))!==canonicalJson(published(versions[depth.locale][i].content))||canonicalJson(unit.provenance)!==canonicalJson(versions[depth.locale][i].provenance)))fail('READING_TRANSLATION_VERSION_UNAVAILABLE');
   for(const locale of needed)if(!versions[locale]){const other=selectIChingDepthInterpretation({hexagramId,changingLines,locale,admittedCorpus:resource.corpus});if(other.status!=='AVAILABLE')fail('READING_TRANSLATION_UNAVAILABLE');versions[locale]=[other.hexagram,...other.lines];}
  }
  const units=versions[needed[0]],html=units.map((unit,i)=>`<article><h3>${i===0?t('本卦解释','Hexagram commentary'):t('变爻解释','Changing-line commentary')+(unit.linePosition?' '+unit.linePosition:'')}</h3>${Object.entries(fields).map(([key,label])=>{const content=needed.map(locale=>published(versions[locale][i].content)[key]),text=content.map(v=>Array.isArray(v)?v.map(esc).join('<br>'):esc(v||''));return text.some(Boolean)?`<h4>${t(...label)}</h4>${text.map(x=>`<p>${x}</p>`).join('')}`:'';}).join('')}<details><summary>${t('来源与版本','Sources and versions')}</summary><pre>${esc(JSON.stringify({interpretationId:unit.interpretationId,coordinate:unit.coordinate,provenance:unit.provenance},null,2))}</pre></details></article>`).join('');
  return {html,resource:resource?{path:resource.path,sha256:resource.sha256,corpusVersion:resource.corpus.corpusVersion,originalLanguageMatchedExactly:true}:null,native:true};
 }
 if(view.schemaVersion==='PHI-OS-TAROT-PRODUCT-PUBLIC-VIEW-MODEL-v2.0.0'){
  if(!Array.isArray(interpretation.cards)||!interpretation.cards.length)fail('READING_PERSISTED_INTERPRETATION_UNAVAILABLE');
  const html=interpretation.cards.map((card,i)=>{const paragraphs=savedPairedText({claims:card.waitePerspective?.editorialClaims,reflection:card.reflectivePerspective?.question},language);if(!paragraphs.length)fail('READING_TRANSLATION_UNAVAILABLE');return `<article><h3>${t('牌','Card')} ${i+1} · ${esc(card.canonicalTitle)}</h3>${paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</article>`;}).join('');const spread=savedPairedText(view.spreadComposition,language);
  return {html:html+spread.map(p=>`<p>${esc(p)}</p>`).join(''),native:true,resource:null};
 }
 // Older/synthetic stored bilingual narrative objects: only actual paired text
 // is emitted. Arbitrary strings/metadata are never flattened into an answer.
 const pairs=savedPairedText(interpretation,language);if(!pairs.length){if(language!=='bilingual'&&view.locale===(language==='zh'?'zh-Hans':'en')&&typeof interpretation.summary==='string')return {html:`<p>${esc(interpretation.summary)}</p>`,native:false,resource:null};fail('READING_TRANSLATION_UNAVAILABLE');}
 return {html:pairs.map(p=>`<p>${esc(p)}</p>`).join(''),native:false,resource:null};
}

// Notes/review flags are mutable user annotations, not a new reading or draw.
export function readingSourceSnapshot(source){return {schemaVersion:source.schemaVersion,methodCode:source.methodCode,question:source.question,contextConsent:source.contextConsent,drawEvidence:source.drawEvidence,projection:source.projection,readingIrProjection:source.readingIrProjection,publicReadingView:source.publicReadingView,sourceVersions:source.sourceVersions};}
