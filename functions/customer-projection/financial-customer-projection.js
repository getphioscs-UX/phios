import {CX_PROJECTION_VERSION,boundary,clean,deepFreeze,finite,list,localeOf,object,safeUrl,sourceLineage,text} from './projection-common.js';
const metric=(metrics,code)=>finite(metrics?.[code]);
const evidenceLabel=state=>{const s=clean(state).toUpperCase();if(s.includes('VERIFIED'))return 'VERIFIED';if(s.includes('ASSUM'))return 'ASSUMED';if(s.includes('OUTDATED'))return 'OUTDATED';if(s.includes('MISSING'))return 'MISSING';if(s)return 'REPORTED';return 'MISSING'};
const findingType=value=>clean(value).toUpperCase()||'UNKNOWN';
const customerText=value=>typeof value==='string'?clean(value):clean(value?.summary||value?.label||value?.title||value?.text);
const projectTextItems=value=>list(value).map(item=>deepFreeze({label:customerText(item),sourceAuthority:clean(item?.sourceAuthority)||null,sourceReference:clean(item?.sourceReference)||null})).filter(item=>item.label);
const calculationDefs=Object.freeze([
 ['netWorth','Net worth','净资产','currency'],['grossAssets','Gross assets','总资产','currency'],['totalLiabilities','Total liabilities','总负债','currency'],
 ['monthlyIncome','Monthly income','每月收入','currency'],['monthlyExpenses','Monthly expenses','每月支出','currency'],['cashFlowSurplus','Cash-flow surplus','现金流盈余','currency'],['cashFlowDeficit','Cash-flow deficit','现金流缺口','currency'],
 ['liquidityMonths','Liquidity months','流动性月数','months'],['debtServiceRatio','Debt-service ratio','债务偿付比率','ratio']
]);
export function projectFinancialForCustomer(result={}, {intake={},locale='en'}={}){
 const lang=localeOf(locale),r=object(result),snap=object(r.snapshot),metrics=object(r.calculation?.metrics),currency=clean(snap.baseCurrency||intake.baseCurrency)||null;
 const input=key=>intake[key]===undefined||intake[key]===''?null:intake[key];
 const item=(label,value,state='REPORTED')=>deepFreeze({label,value:value??null,evidenceState:value===null?'MISSING':evidenceLabel(state)});
 const findings=list(r.findings).map(f=>deepFreeze({findingCode:clean(f?.findingCode),findingType:findingType(f?.findingType),domain:clean(f?.domain)||null,summary:clean(f?.summary),confidence:clean(f?.confidence)||null,evidenceState:evidenceLabel(f?.evidenceState),limitations:list(f?.limitations).map(clean).filter(Boolean)})).filter(x=>x.findingCode||x.summary);
 const calculations=calculationDefs.map(([code,en,zh,unit])=>{const value=metric(metrics,code);return deepFreeze({code,label:text(lang,en,zh),value,unit:unit==='currency'?currency:unit,sourceAuthority:'FCR',evidenceState:value===null?'MISSING':evidenceLabel(snap.evidenceState)})});
 const planningSource=object(r.planning),planningPresent=Boolean(clean(planningSource.state)||list(planningSource.priorities).length||list(planningSource.options).length||list(planningSource.actionSequence).length||list(planningSource.assumptions).length);
 const priorities=planningPresent?deepFreeze({state:clean(planningSource.state)||'AVAILABLE',items:projectTextItems(planningSource.priorities)}):deepFreeze({state:'NOT_CREATED_BY_ADAPTER',items:[]});
 const options=planningPresent?deepFreeze({state:clean(planningSource.state)||'AVAILABLE',items:projectTextItems(planningSource.options)}):deepFreeze({state:'NOT_CREATED_BY_ADAPTER',items:[]});
 const actionSequence=planningPresent?deepFreeze({state:clean(planningSource.state)||'AVAILABLE',items:projectTextItems(planningSource.actionSequence)}):deepFreeze({state:'NOT_CREATED_BY_ADAPTER',items:[]});
 const assumptions=planningPresent?deepFreeze({state:clean(planningSource.state)||'AVAILABLE',items:projectTextItems(planningSource.assumptions)}):deepFreeze({state:'NOT_CREATED_BY_ADAPTER',items:[]});
 const reportSource=object(r.releasedReport||r.report),reportReleased=clean(reportSource.releaseState).toUpperCase()==='RELEASED'&&clean(reportSource.sourceAuthority).toUpperCase()==='RR';
 const report=reportReleased?deepFreeze({state:'RELEASED',title:clean(reportSource.title)||text(lang,'Released Financial Report','已发布财务报告'),version:clean(reportSource.version)||null,date:clean(reportSource.date||reportSource.releasedAt)||null,href:safeUrl(reportSource.href),sourceAuthority:'RR'}):deepFreeze({state:'NOT_RELEASED',title:null,version:null,date:null,href:null,sourceAuthority:null});
 const allInputGroups=[];
 const household=[item(text(lang,'Household scope','家庭范围'),clean(input('household'))||null)];allInputGroups.push(...household);
 const assets=[item(text(lang,'Liquid assets','流动资产'),input('liquidAssets')),item(text(lang,'Investments','投资资产'),input('investments')),item(text(lang,'Property','房地产'),input('property'))];allInputGroups.push(...assets);
 const liabilities=[item(text(lang,'Liabilities reported','已申报负债'),input('liabilities')),item(text(lang,'Monthly debt repayment','每月债务偿还'),input('monthlyDebtRepayment'))];allInputGroups.push(...liabilities);
 const protection=[item(text(lang,'Protection notes','保障说明'),clean(input('protection'))||null)];allInputGroups.push(...protection);
 const goals=[item(text(lang,'Goals','目标'),clean(input('goals'))||null)];allInputGroups.push(...goals);
 const constraints=[item(text(lang,'Constraints','限制'),clean(input('constraints'))||null)];allInputGroups.push(...constraints);
 const documents=[item(text(lang,'Documents / evidence notes','文件／证据说明'),clean(input('documents'))||null)];allInputGroups.push(...documents);
 const unknowns=[item(text(lang,'Unknowns','未知项'),clean(input('unknowns'))||null)];
 const currentPosition=[item(text(lang,'Net worth','净资产'),metric(metrics,'netWorth'),evidenceLabel(snap.evidenceState)),item(text(lang,'Gross assets','总资产'),metric(metrics,'grossAssets'),evidenceLabel(snap.evidenceState)),item(text(lang,'Total liabilities','总负债'),metric(metrics,'totalLiabilities'),evidenceLabel(snap.evidenceState))];
 const cashflow=[item(text(lang,'Monthly income','每月收入'),metric(metrics,'monthlyIncome'),evidenceLabel(snap.evidenceState)),item(text(lang,'Monthly expenses','每月支出'),metric(metrics,'monthlyExpenses'),evidenceLabel(snap.evidenceState)),item(text(lang,'Cash-flow surplus','现金流盈余'),metric(metrics,'cashFlowSurplus'),evidenceLabel(snap.evidenceState)),item(text(lang,'Cash-flow deficit','现金流缺口'),metric(metrics,'cashFlowDeficit'),evidenceLabel(snap.evidenceState)),item(text(lang,'Liquidity months','流动性月数'),metric(metrics,'liquidityMonths'),evidenceLabel(snap.evidenceState))];
 const strengthFindings=findings.filter(f=>['STRENGTH','SURPLUS'].includes(f.findingType));
 const attentionFindings=findings.filter(f=>['GAP','CONCENTRATION','EXPOSURE','DEPENDENCY','MISMATCH','SHORTFALL','CONTRADICTION'].includes(f.findingType));
 const explicitUnknownFindings=findings.filter(f=>['UNKNOWN','MISSING_EVIDENCE'].includes(f.findingType));
 const missingItemCount=[...allInputGroups,...currentPosition,...cashflow].filter(entry=>entry.evidenceState==='MISSING').length;
 return deepFreeze({schemaVersion:`${CX_PROJECTION_VERSION}:FINANCIAL_REALITY`,surface:'FINANCIAL_REALITY',locale:lang,state:r.schemaVersion?'READY':'EMPTY',snapshot:{snapshotId:clean(snap.snapshotId)||null,asOfDate:clean(snap.asOfDate)||null,baseCurrency:currency,persisted:snap.persisted===true,evidenceState:evidenceLabel(snap.evidenceState)},
 overview:{whereYouAre:{asOfDate:clean(snap.asOfDate)||null,baseCurrency:currency,netWorth:metric(metrics,'netWorth')},strengths:strengthFindings,attention:attentionFindings,unknownCount:missingItemCount+explicitUnknownFindings.length+(clean(input('unknowns'))?1:0)},
 household,currentPosition,cashflow,calculations,assets,liabilities,protection,goals,constraints,documents,unknowns,findings,
 priorities,options,planning:deepFreeze({state:planningPresent?(clean(planningSource.state)||'AVAILABLE'):'NOT_ESTABLISHED',sourceAuthority:planningPresent?(clean(planningSource.sourceAuthority)||null):null,priorities,options,actionSequence,assumptions}),
 professionalReview:{available:r.professionalHandoff?.available===true,performed:false,route:clean(r.professionalHandoff?.route)||'/professional/financial/',productNeutral:r.professionalHandoff?.productNeutral===true},
 authorityLayers:{systemAnalysis:{present:findings.length>0,label:text(lang,'System analysis','系统分析')},professionalReview:{present:false,label:text(lang,'Professional review','专业复核')},professionalRecommendation:{present:false,label:text(lang,'Professional recommendation','专业建议')}},
 report,
 handoff:{available:Boolean(snap.snapshotId),snapshot:{snapshotId:clean(snap.snapshotId)||null,asOfDate:clean(snap.asOfDate)||null,baseCurrency:currency},calculations:Object.entries(metrics).filter(([,v])=>Number.isFinite(v)).map(([code,value])=>deepFreeze({code,value,unit:code==='debtServiceRatio'?'ratio':code==='liquidityMonths'?'months':currency})),findings:findings.map(f=>deepFreeze({findingCode:f.findingCode,summary:f.summary}))},
 governance:{scenarioHiddenDefaultsUsed:r.scenario?.hiddenDefaultsUsed===true,adviceCreated:r.boundaries?.adviceCreated===true,recommendationCreated:r.boundaries?.recommendationCreated===true,professionalJudgmentCreated:r.boundaries?.professionalJudgmentCreated===true,persisted:snap.persisted===true,planningCreatedByAdapter:false,reportComposedByAdapter:false,...sourceLineage(['FDR','FCR','FAR','HFP','PFR']),...boundary()}});
}
