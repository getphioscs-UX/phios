import {verifyNumR20Snapshot} from './numerology-publication-adapter.js';
import {renderNumR22DiagramHtml} from './numerology-diagram-html.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
import {numerologyPublicLabel} from '../../customer-projection/numerology-public-labels-v1.js';

export const NUM_R27_DIAGRAM_VERSION='NUM-R27-SCHOOL-TRANSPARENT-CANDIDATE-v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const selected=['P06','P07','P09','P10','P19','P20','P24'];
const roles={expression:'EXPRESSION',soulUrge:'SOUL_URGE',personality:'PERSONALITY'};

// This view copies native facts; all arithmetic stays in the method runtimes.
export async function buildNumR27SourceView({snapshot,monthlySnapshots=[]}){
 await verifyNumR20Snapshot(snapshot);
 const ir=snapshot.readings.en,d=ir.sections.depth.sections,secondary=d.secondaryChart;
 const profile=ir.sections.expansion.sections.nameNumbers,identity=snapshot.expansionInput.identityInput;
 const provenance=secondary?.sourceAlignedCore?.calculationProvenance;
 const nameKindAdmitted=!identity?.sourceNameKind||identity.sourceNameKind==='ORIGINAL_BIRTH_NAME';
 const eligible=nameKindAdmitted&&identity?.customerConfirmed===true&&secondary?.nameState==='READY'&&secondary.sourceAlignedCore?.eligible===true&&Boolean(provenance)&&Object.keys(roles).every(key=>d.nameRoleMeanings.some(m=>m.role===roles[key]&&m.runtimeUseAllowed===true&&m.methodAlignment?.eligible===true));
 const schoolId=secondary?.school??null;
 const nameFingerprint=identity?.fullBirthName?await sha256Stable({name:identity.fullBirthName,normalization:identity.nameNormalizationPolicy}):null;
 const sourceNameKind=['ORIGINAL_BIRTH_NAME','LEGAL_CURRENT_NAME','ALIAS','ROMANIZED_FORM'].includes(identity?.sourceNameKind)?identity.sourceNameKind:'UNSPECIFIED';
 const base={diagramVersion:NUM_R27_DIAGRAM_VERSION,schoolId,sourceNameKind,nameFingerprint,letterMapVersion:provenance?.letterMapVersion??null,normalization:provenance?.normalization??null,masterNumberPolicy:provenance?.masterNumberPolicy??null,sourceClaimId:null};
 const name=eligible?{...base,availability:'CALCULATION_AVAILABLE_SEMANTIC_REVIEW_PENDING',sourceName:identity.fullBirthName,normalizedName:secondary.name.normalized,tokens:secondary.name.parts,parts:provenance.parts,vowels:provenance.vowels,yPolicy:provenance.yPolicy,roles:Object.entries(roles).map(([key,role])=>({...base,role,availability:'CALCULATION_AVAILABLE',calculationInputs:provenance.roles[key].parts.map(x=>x.rawValue),intermediates:provenance.roles[key].parts,reductionSteps:provenance.roles[key].final.reductionSteps,value:provenance.roles[key].final.value,sourcePath:'depth.sections.secondaryChart.sourceAlignedCore.'+key,sourceVersion:secondary.schemaVersion,sourceClaimId:d.nameRoleMeanings.find(m=>m.role===role)?.sourceClaimId??null,comparison:{label:'GLOBAL_NAME_AGGREGATION_COMPARISON_ONLY',schoolId:profile.schoolAuthorityId,sourcePath:'expansion.sections.nameNumbers.values.'+key,...profile.values[key]}}))}:{...base,availability:!nameKindAdmitted?'SOURCE_NAME_KIND_NOT_ADMITTED_BY_BIRTH_NAME_AUTHORITY':secondary?.sourceAlignedCore?.availability??secondary?.availability??'CONFIRMED_NAME_REQUIRED',roles:[],parts:[]};
 const target=snapshot.expansionInput.targetDate,months=[];
 const subjectScope=s=>({canonicalInput:s.canonicalInput,expansionInput:Object.fromEntries(Object.entries(s.expansionInput).filter(([key])=>key!=='targetDate')),relationshipConsent:s.relationshipConsent});
 const scopeDigest=await sha256Stable(subjectScope(snapshot));
 for(const month of monthlySnapshots){
  await verifyNumR20Snapshot(month);
  if(await sha256Stable(subjectScope(month))!==scopeDigest)throw Error('NUM_R27_MONTH_SUBJECT_SCOPE_MISMATCH');
  const date=month.expansionInput.targetDate;
  if(!target||date?.slice(0,4)!==target.slice(0,4)||date.slice(8)!=='01'||month.canonicalInput.birthDate!==snapshot.canonicalInput.birthDate||JSON.stringify(month.expansionInput.identityInput)!==JSON.stringify(identity))throw Error('NUM_R27_MONTH_SUBJECT_OR_YEAR_MISMATCH');
  const value=month.readings.en.sections.timing.calendar.find(x=>x.code==='PERSONAL_MONTH');
  if(!value)throw Error('NUM_R27_NATIVE_MONTH_REQUIRED');
  if(months.some(x=>x.month===date.slice(5,7)))throw Error('NUM_R27_DUPLICATE_MONTH');
  months.push({month:date.slice(5,7),targetDate:date,value:value.value,sourceSnapshotDigest:month.snapshotDigest,sourcePath:'sections.timing.calendar#PERSONAL_MONTH'});
 }
 if(months.length!==0&&months.length!==12)throw Error('NUM_R27_TWELVE_NATIVE_MONTHS_REQUIRED');
 return deepFreeze({diagramVersion:NUM_R27_DIAGRAM_VERSION,snapshotDigest:snapshot.snapshotDigest,birthDate:snapshot.canonicalInput.birthDate,targetDate:target??null,name,birthRoles:ir.sections.snapshot.map(x=>({role:x.role,value:x.value,rawValue:x.rawValue,reductionSteps:x.reductionSteps,masterNumberPreserved:x.masterNumberPreserved,schoolId:null,schoolAvailability:'NOT_EXPOSED_BY_CANONICAL_PROJECTION',sourceNameKind:null,nameFingerprint:null,letterMapVersion:null,normalization:null,calculationInputs:{birthDate:snapshot.canonicalInput.birthDate},intermediates:x.reductionSteps,masterNumberPolicy:'NATIVE_FIELD_POLICY_NO_UNIVERSAL_OVERRIDE',sourceClaimId:null,availability:'CALCULATION_AVAILABLE',diagramVersion:NUM_R27_DIAGRAM_VERSION,sourceVersion:snapshot.sourceVersions.calculation,sourcePath:'sections.snapshot#'+x.role})),frequency:ir.sections.expansion.sections.digitDistribution.frequency,frequencyScope:'BIRTH_DATE_DIGITS_1_TO_9_ZERO_EXCLUDED',nameFrequency:eligible?secondary.frequency:null,timing:ir.sections.timing,months:months.sort((a,b)=>a.month.localeCompare(b.month)),sourceVersions:snapshot.sourceVersions,archivalTriangle:{availability:'REFERENCE_ONLY_NOT_ADMITTED',customerValues:[],schoolId:null,sourceClaimId:null},blockers:[...(sourceNameKind==='UNSPECIFIED'?['SOURCE_NAME_KIND_NOT_CONFIRMED']:[]),...(!eligible?['NAME_CHART_SUPPRESSED']:[]),...(months.length!==12?['TWELVE_MONTH_NATIVE_SNAPSHOTS_NOT_PROVIDED']:[]),'CANONICAL_BIRTH_SCHOOL_ID_NOT_EXPOSED','HUMAN_EDITORIAL_AND_CLAIM_REVIEW_PENDING'],customerPublishable:false});
}

export function renderNumR27SourceDiagram(view,pageId,locale='en'){
 if(!selected.includes(pageId))throw Error('NUM_R27_UNKNOWN_DIAGRAM_PAGE');
 const zh=locale!=='en',bi=locale==='bilingual',t=(z,e)=>bi?z+' / '+e:zh?z:e;
 const label=role=>bi?numerologyPublicLabel(role,'zh-Hans')+' / '+numerologyPublicLabel(role,'en'):numerologyPublicLabel(role,zh?'zh-Hans':'en');
 let rows=[],title='',kind='CARDS';
 if(pageId==='P06'){title=t('五个核心角色','Five core roles');rows=[...view.birthRoles.filter(x=>['LIFE_PATH','BIRTHDAY_NUMBER'].includes(x.role)),...view.name.roles].map(x=>({label:label(x.role),value:String(x.value)}));}
 if(pageId==='P07'){title=t('出生日期角色与原生归约','Birth roles and native reductions');rows=view.birthRoles.map(x=>({label:label(x.role),value:(x.reductionSteps?.length?x.reductionSteps:[x.rawValue,x.value]).join(' → ')}));}
 if(pageId==='P09'){title=t('出生日期数字出现次数（不含零）','Birth-date digit occurrences (zero excluded)');kind='FREQUENCY';rows=Object.entries(view.frequency).map(([digit,count])=>({label:digit,value:String(count)}));}
 if(pageId==='P10'){
  title=t('姓名来源与两种计算路径','Name source and distinct calculation paths');kind='NAME';
  rows=view.name.parts.map(p=>({label:p.token,value:p.letters.map(x=>x.letter+x.value).join(' '),detail:[p.expression,p.soulUrge,p.personality].map(x=>x.reductionSteps.join(' → ')).join(' | ')}));
  rows.push(...view.name.roles.map(x=>({label:label(x.role),value:x.intermediates.map(p=>p.value).join(' + ')+' → '+x.reductionSteps.join(' → '),detail:t('全名合计对照：','Global aggregation comparison: ')+x.comparison.reductionSteps.join(' → ')})));
  if(!view.name.roles.length)rows=[{label:t('姓名图未开放','Name chart unavailable'),value:view.name.availability}];
 }
 if(pageId==='P19'){title=t('西方高峰与挑战 · 独立年龄带','Western Pinnacles and Challenges · native age bands');rows=view.timing.pinnacles.map((x,i)=>({label:`${x.startAge}–${x.endAge??'+'}`,value:`${x.value} / ${view.timing.challenges[i]?.value??'?'}`}));rows.push({label:t('档案三角法','Archival triangle'),value:t('仅研究参考，未准入；不产生客户数值','Research reference only; not admitted; no customer values')});}
 if(pageId==='P20'){title=t('目标日期与十二个原生月份','Reference date and twelve native months');kind='MONTHS';rows=view.months.map(x=>({label:x.month,value:String(x.value)}));if(!rows.length)rows=[{label:t('月份图未开放','Month chart unavailable'),value:t('缺少十二份原生结果','Twelve native results not supplied')}];}
 if(pageId==='P24'){title=t('计算、学派与证据边界','Calculation, schools and evidence boundaries');rows=[{label:t('出生日期计算','Birth-date calculation'),value:t('原生输入与归约；可核对','Native input and reductions; checkable')},{label:t('姓名逐段归约','Name part reductions'),value:view.name.roles.length?t('西方来源对齐角色；全名合计单列对照','Western role sources; global totals remain separate.'):t('输入门禁未通过','Input gate not satisfied')},{label:t('档案三角法','Archival triangle'),value:t('来源待审；未并入客户计算','Source pending review; excluded from customer calculations')},{label:t('现实材料','Reality evidence'),value:t('未提供；数字不证明现实结论','Not supplied; numbers do not establish real-world conclusions')}];}
 let height=kind==='NAME'?425:kind==='FREQUENCY'?240:kind==='MONTHS'?340:pageId==='P24'?350:250;
 const text=(x,y,value,cls='label',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
 let drawing='';
 if(kind==='MONTHS'&&rows.length===12){
  drawing=rows.map((r,i)=>{const a=(i/12)*Math.PI*2-Math.PI/2,x=390+Math.cos(a)*220,y=150+Math.sin(a)*115;return `<g data-month="${r.label}" data-value="${r.value}"><circle cx="${x}" cy="${y}" r="25" fill="#fffdf4" stroke="#467f80"/>${text(x,y+6,r.value,'value','middle')}${text(x,y+43,r.label,'label','middle')}</g>`;}).join('');
  drawing+=text(390,150,view.timing.calendar.find(x=>x.code==='PERSONAL_YEAR')?.value??'—','value','middle');
 }else if(kind==='FREQUENCY'){
  drawing=rows.map((r,i)=>{const x=15+(i%3)*255,y=10+Math.floor(i/3)*75;return `<g data-digit="${r.label}" data-value="${r.value}"><rect x="${x}" y="${y}" width="240" height="65" rx="7" fill="#fffdf4" stroke="#c5ad6d"/>${text(x+15,y+40,r.label,'value')}${text(x+110,y+40,'× '+r.value,'value')}</g>`;}).join('');
 }else if(kind==='NAME'){
  drawing=rows.map((r,i)=>text(20,35+i*54,r.label,'strong')+text(245,35+i*54,r.value)+text(245,54+i*54,r.detail||'','small')).join('');
  if(view.nameFrequency)drawing+=text(20,370,t('姓名数字频次：','Name digit frequency: '),'strong')+text(20,395,Object.entries(view.nameFrequency).map(([k,v])=>k+' × '+v).join('   '));
 }else if(pageId==='P06')drawing=rows.map((r,i)=>{const a=(i/rows.length)*Math.PI*2-Math.PI/2,x=390+Math.cos(a)*230,y=120+Math.sin(a)*80;return `<g data-value="${r.value}"><circle cx="${x}" cy="${y}" r="23" fill="#fffdf4" stroke="#467f80"/>${text(x,y+6,r.value,'value','middle')}${text(x,y+43,r.label,'label','middle')}</g>`;}).join('');
 else if(pageId==='P07')drawing=rows.map((r,i)=>{const x=12+(i%3)*255,y=12+Math.floor(i/3)*115;return `<rect x="${x}" y="${y}" width="245" height="102" rx="8" fill="#fffdf4" stroke="#c5ad6d"/>${text(x+10,y+30,r.label,'strong')}${text(x+122,y+75,r.value,'value','middle')}`;}).join('');
 else if(pageId==='P19'){
  drawing=view.timing.pinnacles.map((r,i)=>{const x=30+i*185,c=view.timing.challenges[i];return text(x,30,`${r.startAge}–${r.endAge??'+'}`,'strong')+`<line x1="${x}" y1="62" x2="${x+150}" y2="62" stroke="#c5ad6d"/><circle cx="${x+70}" cy="70" r="23" fill="#fffdf4" stroke="#467f80"/><circle cx="${x+70}" cy="150" r="23" fill="#fffdf4" stroke="#b18a47"/>`+text(x+70,77,r.value,'value','middle')+text(x+70,157,c?.value??'—','value','middle');}).join('');
  drawing+=text(20,205,t('上轨：高峰；下轨：挑战','Upper lane: Pinnacle; lower lane: Challenge'))+text(20,232,t('档案三角法：仅参考，未产生客户数值','Archival triangle: reference only; no customer values'));
 }else if(pageId==='P24'){
  const wrap=value=>{const lines=[];let line='',width=0;for(const c of String(value)){const size=c.charCodeAt(0)>255?2:1;if(width+size>90){lines.push(line);line='';width=0;}line+=c;width+=size;}if(line)lines.push(line);return lines;};
  drawing=rows.map((r,i)=>{const y=27+i*82;return text(20,y,r.label,'strong')+wrap(r.value).map((line,j)=>text(20,y+25+j*20,line)).join('');}).join('');
 }else drawing=rows.map((r,i)=>{const y=28+i*43;return text(20,y,r.label,'strong')+text(315,y,r.value);}).join('');
 const summary=rows.map(r=>r.label+': '+r.value+(r.detail?' · '+r.detail:'')).join('; ');
 const caption=pageId==='P10'&&view.name.roles.length?`${view.name.sourceName} · ${view.name.sourceNameKind} · ${view.name.tokens.join(' | ')} · ${view.name.letterMapVersion} · ${view.name.normalization} · Vowels: ${view.name.vowels} · ${view.name.yPolicy} · ${view.name.masterNumberPolicy} · Selected: ${view.name.schoolId} · Comparison: ${view.name.roles[0].comparison.schoolId}`:pageId==='P20'?`${view.targetDate??''} · ${t('主数按原生字段保留','Master numbers follow native field policy')}`:view.birthDate;
 return `<figure class="num-r27-diagram" data-page="${pageId}" data-version="${NUM_R27_DIAGRAM_VERSION}" data-snapshot="${esc(view.snapshotDigest)}"><figcaption>${esc(title)}</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 ${height}" role="img" aria-labelledby="r27-${pageId}-title r27-${pageId}-desc"><title id="r27-${pageId}-title">${esc(title)}</title><desc id="r27-${pageId}-desc">${esc(summary)}</desc><style>text{font-family:ReportCJK,Arial,sans-serif;fill:#193442}.label{font-size:15px}.strong{font-size:15px;font-weight:bold}.small{font-size:12px}.value{font-size:24px;font-weight:bold}</style>${drawing}</svg><p class="r27-caption">${esc(caption)}</p></figure>`;
}

export function renderNumR27PublicationHtml({sourceView,...options}){
 if(sourceView?.snapshotDigest!==options.snapshot?.snapshotDigest)throw Error('NUM_R27_VIEW_SNAPSHOT_MISMATCH');
 const result=renderNumR22DiagramHtml(options);let replaced=0;
 const html=result.html.replace(/<figure class="num-r22-diagram" data-page="(P\d+)"[\s\S]*?<\/figure>/g,(old,id)=>{if(!selected.includes(id))return old;replaced++;return renderNumR27SourceDiagram(sourceView,id,options.locale);}).replaceAll('class="reading"',options.locale==='bilingual'?'class="reading bilingual"':'class="reading"');
 if(replaced!==7)throw Error('NUM_R27_SEVEN_DIAGRAMS_REQUIRED');
 return {...result,html:html.replace('</style>','</style><style>.num-r27-diagram{grid-column:1/-1;margin:0 0 3mm;padding:2mm;border:1px solid #c5ad6d;background:#fffdf4}.num-r27-diagram svg{display:block;width:100%;max-height:68mm}.num-r27-diagram figcaption{font-size:9pt;font-weight:bold}.r27-caption{font-size:8pt;margin:0}</style>'),layoutIdentity:NUM_R27_DIAGRAM_VERSION,customerPublishable:false};
}
