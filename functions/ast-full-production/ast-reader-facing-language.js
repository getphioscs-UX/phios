/** AST R2-W12 reader-facing editorial projection.
 *
 * This module changes labels and condenses already governed R4A/R5 structure.
 * It is not an astrology meaning authority. Every reader-facing sentence must be
 * traceable to an admitted R4A claim or to calculated structural facts in R5.
 */
export const AST_READER_LANGUAGE_SCHEMA_VERSION='PHI-OS-AST-READER-FACING-LANGUAGE-v1.0.0';
const list=v=>Array.isArray(v)?v:[];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const fail=code=>{throw Object.assign(new Error(code),{code})};
const pick=(obj,locale,fallback='')=>obj?.[locale]??obj?.en??fallback;
const join=(xs,locale)=>{const a=xs.filter(Boolean);if(a.length<2)return a[0]||'';if(locale==='zh-Hans')return a.join('、');if(a.length===2)return `${a[0]} and ${a[1]}`;return `${a.slice(0,-1).join(', ')}, and ${a.at(-1)}`};
const bodyLabel=(registry,code,locale)=>pick(registry.bodyLabels?.[code],locale,code);
const signLabel=(registry,code,locale)=>pick(registry.signLabels?.[code],locale,code);
const elementLabel=(registry,code,locale)=>pick(registry.elementLabels?.[code],locale,code);
const modalityLabel=(registry,code,locale)=>pick(registry.modalityLabels?.[code],locale,code);
const sentence=(s,max=430)=>{const x=String(s||'').replace(/\s+/g,' ').trim();return x.length<=max?x:`${x.slice(0,max-1).trimEnd()}…`};
const common=(theme,readerTitle,readerSummary,technicalLabel)=>freeze({themeKey:theme.themeKey,familyCode:theme.familyCode,rank:theme.rank,tier:theme.tier,readerTitle,readerSummary:sentence(readerSummary),technicalLabel,sourceRefs:[...(theme.evidenceRefs||[])],editorialTransformation:true,meaningCreated:false});
function patternCopy(theme,registry,locale){
 const lang=registry.patternLanguage?.[theme.patternCode];if(!lang)fail(`AST_READER_LANGUAGE_PATTERN_MISSING_${theme.patternCode}`);
 const bodies=list(theme.bodyCodes).map(x=>bodyLabel(registry,x,locale));const names=join(bodies,locale);const apex=theme.apexBodyCode?bodyLabel(registry,theme.apexBodyCode,locale):null;
 const technicalLabel=pick(lang.technicalLabel,locale,theme.patternCode),readerTitle=pick(lang.readerTitle,locale,technicalLabel);
 let readerSummary='';
 if(locale==='zh-Hans'){
  if(theme.patternCode==='GRAND_CROSS')readerSummary=`${names}形成一个闭合的高张力连接网络。这里强调的是几股命盘功能彼此牵动的结构，不把它转换成吉凶或命运结论。`;
  else if(theme.patternCode==='T_SQUARE')readerSummary=`${names}形成一个集中的张力结构${apex?`，其中${apex}位于几何焦点`:''}。它说明压力如何集中在同一网络中，而不是预告某个问题一定发生。`;
  else if(theme.patternCode==='GRAND_TRINE')readerSummary=`${names}之间形成一个较低摩擦的闭合连接。它显示这些功能之间较容易互相传递，但不等于自动拥有天赋或结果。`;
  else if(theme.patternCode==='KITE')readerSummary=`${names}形成一个支持网络，并由一条对向轴线把结构集中起来。它描述几何如何汇聚，不把这种结构解释成必然机会或成就。`;
  else readerSummary=`${names}之间同时存在支持与张力连接，形成四点交织的结构。这里保留两种关系同时存在，而不把它简化为单一好坏判断。`;
 }else{
  if(theme.patternCode==='GRAND_CROSS')readerSummary=`${names} form a closed high-tension network. The reading keeps the interaction among several chart functions visible without turning the geometry into a good/bad or destiny verdict.`;
  else if(theme.patternCode==='T_SQUARE')readerSummary=`${names} form a concentrated tension structure${apex?`, with ${apex} at the geometric focus`:''}. It shows where pressure converges in the network without predicting that a specific problem must occur.`;
  else if(theme.patternCode==='GRAND_TRINE')readerSummary=`${names} form a relatively low-friction closed connection. The structure can transmit more easily across these functions, without being converted into a guaranteed talent or outcome.`;
  else if(theme.patternCode==='KITE')readerSummary=`${names} form a supportive network focused by an opposing axis. This describes how the geometry is concentrated without turning it into a guaranteed opportunity or achievement.`;
  else readerSummary=`${names} carry both supportive and tension-bearing connections across four chart points. The reading keeps both relationship types visible instead of collapsing them into a single positive or negative verdict.`;
 }
 return common(theme,readerTitle,readerSummary,technicalLabel);
}
function rulershipCopy(theme,registry,locale){
 const chartRuler=theme.bodyCodes?.[0],ruler=bodyLabel(registry,chartRuler,locale),rest=list(theme.bodyCodes).slice(1).map(x=>bodyLabel(registry,x,locale));
 const readerTitle=locale==='zh-Hans'?`命盘里的多条结构路线经过${ruler}`:`Many chart pathways run through ${ruler}`;
 const readerSummary=locale==='zh-Hans'?`${ruler}作为上升星座的守护星，成为整盘路由的重要参照。守护链还连接到${join(rest,locale)}；这里描述的是结构如何转接，不把任何一颗行星定义成完整人格或命运控制者。`:`As ruler of the Ascendant sign, ${ruler} becomes an important routing reference for the chart. The dispositor network also links through ${join(rest,locale)}; this describes structural routing rather than making any planet a total personality label or fate controller.`;
 const technicalLabel=pick(registry.familyLanguage?.RULERSHIP_NETWORK?.technicalLabel,locale,'Rulership network');return common(theme,readerTitle,readerSummary,technicalLabel);
}
function dynamicsCopy(theme,registry,locale){
 const c=theme.dynamicCounts||{},a=Number(c.APPLYING||0),s=Number(c.SEPARATING||0),e=Number(c.EXACT||0),u=Number(c.UNDETERMINED||0);
 const readerTitle=pick(registry.familyLanguage?.ASPECT_DYNAMICS?.readerTitle,locale,'Aspect movement');
 const readerSummary=locale==='zh-Hans'?`出生时刻的相位连接中，${a} 条正在趋近精确角度，${s} 条正在离开精确角度，${e} 条处于精确容差内${u?`，另有 ${u} 条保持未定`:''}。这是对当时几何状态的分类，不是事件预测。`:`At the birth moment, ${a} aspect links are moving closer to exact, ${s} are moving away, and ${e} sit within the exact tolerance${u?`, with ${u} left undetermined`:''}. This classifies the geometry at that moment; it is not an event forecast.`;
 const technicalLabel=pick(registry.familyLanguage?.ASPECT_DYNAMICS?.technicalLabel,locale,'Aspect dynamics');return common(theme,readerTitle,readerSummary,technicalLabel);
}
function distributionCopy(theme,registry,locale){
 const d=theme.distribution||{},el=d.elementLeader||{},mo=d.modalityLeader||{};
 const elementNames=list(el.codes?.length?el.codes:(el.code?[el.code]:[])).map(x=>elementLabel(registry,x,locale));
 const modalityNames=list(mo.codes?.length?mo.codes:(mo.code?[mo.code]:[])).map(x=>modalityLabel(registry,x,locale));
 const readerTitle=pick(registry.familyLanguage?.DISTRIBUTION_CONTEXT?.readerTitle,locale,'Chart distribution');
 const elText=el.state==='UNIQUE_DISTRIBUTION_LEADER'?(locale==='zh-Hans'?`${elementNames[0]}元素的计数最高（${el.count}/10）`:`${elementNames[0]} has the highest element count (${el.count}/10)`):(locale==='zh-Hans'?`${join(elementNames,locale)}并列元素最高计数（各 ${el.count}/10）`:`${join(elementNames,locale)} share the highest element count (${el.count}/10 each)`);
 const moText=mo.state==='UNIQUE_DISTRIBUTION_LEADER'?(locale==='zh-Hans'?`${modalityNames[0]}模式的计数最高（${mo.count}/10）`:`${modalityNames[0]} has the highest mode count (${mo.count}/10)`):(locale==='zh-Hans'?`${join(modalityNames,locale)}并列模式最高计数（各 ${mo.count}/10）`:`${join(modalityNames,locale)} share the highest mode count (${mo.count}/10 each)`);
 const readerSummary=locale==='zh-Hans'?`${elText}；${moText}。这只表示当前十颗核心星体的分布，不把计数差异直接变成人格优劣或固定心理标签。`:`${elText}; ${moText}. These are distribution counts across the ten core planets, not direct personality rankings or fixed psychological labels.`;
 const technicalLabel=pick(registry.familyLanguage?.DISTRIBUTION_CONTEXT?.technicalLabel,locale,'Element / modality distribution');return common(theme,readerTitle,readerSummary,technicalLabel);
}
function angleCopy(theme,registry,locale,professional){
 const angles=list(professional?.sections?.angles),asc=angles.find(x=>x.code==='ASC'),mc=angles.find(x=>x.code==='MC');
 const ascSign=asc?signLabel(registry,asc.signCode,locale):null,mcSign=mc?signLabel(registry,mc.signCode,locale):null;
 const readerTitle=pick(registry.familyLanguage?.ANGLE_FRAME?.readerTitle,locale,'Chart axes');
 const readerSummary=locale==='zh-Hans'?`上升点落在${ascSign||'未定星座'}，天顶落在${mcSign||'未定星座'}。这组轴线用来组织命盘如何进入即时情境，以及公共方向如何变得可见；它不是固定人格或事业结果的事实判断。`:`The Ascendant falls in ${ascSign||'an unresolved sign'} and the Midheaven in ${mcSign||'an unresolved sign'}. Together they frame how the chart meets immediate situations and how public direction becomes visible, without establishing a fixed identity or career outcome.`;
 const technicalLabel=pick(registry.familyLanguage?.ANGLE_FRAME?.technicalLabel,locale,'Chart axes');return common(theme,readerTitle,readerSummary,technicalLabel);
}
export function readerTheme(theme,{registry,locale='en',professionalSemanticProjection}={}){
 if(registry?.schemaVersion!=='PHI-OS-AST-READER-LANGUAGE-REGISTRY-v1.0.0')fail('AST_READER_LANGUAGE_REGISTRY_REQUIRED');
 if(theme?.familyCode==='PATTERN_NETWORK')return patternCopy(theme,registry,locale);
 if(theme?.familyCode==='RULERSHIP_NETWORK')return rulershipCopy(theme,registry,locale);
 if(theme?.familyCode==='ASPECT_DYNAMICS')return dynamicsCopy(theme,registry,locale);
 if(theme?.familyCode==='DISTRIBUTION_CONTEXT')return distributionCopy(theme,registry,locale);
 if(theme?.familyCode==='ANGLE_FRAME')return angleCopy(theme,registry,locale,professionalSemanticProjection);
 fail(`AST_READER_LANGUAGE_FAMILY_UNSUPPORTED_${theme?.familyCode||'MISSING'}`);
}
export function readerSignal(signal,{registry,locale='en'}={}){
 const from=bodyLabel(registry,signal.fromCode,locale),to=bodyLabel(registry,signal.toCode,locale),link=pick(registry.signalLanguage?.[signal.type],locale,signal.type);
 const text=locale==='zh-Hans'?`${from}与${to}${link}。`:`${from} and ${to} ${link}.`;
 return freeze({signalRef:signal.aspectCode,signalType:signal.type,readerText:text,technicalLabel:signal.type,dynamicState:signal.dynamicState,sourceRefs:[...(signal.evidenceRefs||[])],editorialTransformation:true,meaningCreated:false});
}
export function readerIntent({synthesis,registry,locale='en'}={}){
 const id=synthesis?.customerIntent?.intentId||'OPEN',label=pick(registry.intentLabels?.[id],locale,id);const prioritized=list(synthesis?.coreThemes).filter(x=>Number(x.intentBoost||0)>0).map(x=>x.themeKey);
 return freeze({intentId:id,intentLabel:label,readerText:locale==='zh-Hans'?`本次问题以「${label}」为优先视角，因此只调整已有整盘主题的排序，不改写它们原本的占星含义。`:`This reading prioritizes the ${label} lens. It changes the order of existing whole-chart themes, not their underlying astrology meaning.`,priorityThemeRefs:prioritized,sourceRefs:['AST-R5:INTENT_PRIORITY'],meaningCreated:false});
}
export function buildAstReaderLanguageProjection({synthesis,registry,professionalSemanticProjection,locale=synthesis?.locale||'en'}={}){
 if(synthesis?.schemaVersion!=='PHI-OS-AST-WHOLE-CHART-SYNTHESIS-v1.0.0')fail('AST_READER_LANGUAGE_R5_SYNTHESIS_REQUIRED');
 const themes=list(synthesis.coreThemes).map(theme=>readerTheme(theme,{registry,locale,professionalSemanticProjection}));
 const support=list(synthesis.supportSignals).map(signal=>readerSignal(signal,{registry,locale}));const tension=list(synthesis.tensionSignals).map(signal=>readerSignal(signal,{registry,locale}));const intent=readerIntent({synthesis,registry,locale});
 const top=themes.slice(0,3).map(x=>x.readerTitle);const overview=locale==='zh-Hans'?`先看三条整盘主线：${top.join('；')}。这些主题来自不同结构证据的组合，而不是把每颗星体分别写成一段。`:`Start with three whole-chart threads: ${top.join('; ')}. They combine distinct structural evidence instead of turning each planet into a separate paragraph.`;
 return freeze({schemaVersion:AST_READER_LANGUAGE_SCHEMA_VERSION,methodId:'AST',locale,overview:sentence(overview),themes,support,tension,intent,governance:{r4aHumanAdmissionRequired:true,editorialTransformationOnly:true,meaningCreated:false,technicalTermsRemainInDetail:true,customerPublicationAllowed:false}});
}
export default Object.freeze({buildAstReaderLanguageProjection,readerTheme,readerSignal,readerIntent});
