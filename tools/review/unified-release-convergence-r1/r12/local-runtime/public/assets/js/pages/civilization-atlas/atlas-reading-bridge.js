// A bounded reading link between two existing accounts of Meiji Japan. This
// navigation never turns historical structure into current evidence or forecast.
export function renderAtlasReadingBridge(root,{state,cases,reconfigurationCases,locale='en'}){
 root.querySelector('[data-atlas-reading-bridge]')?.remove();
 if(state.activeLayer!=='cases'||state.primaryCaseId!=='CA-T14-01')return;
 const historical=cases?.cases?.find(c=>c.caseId==='CA-T14-01');
 const related=reconfigurationCases?.cases?.find(c=>c.id==='RC-01');
 if(!historical||!related||historical.timeWindow.startYear!==related.timeStart||historical.timeWindow.endYear!==related.timeEnd||!related.relatedDossiers.includes('DOSSIER-JP'))return;
 const zh=locale==='zh-Hans',node=document.createElement('section');node.dataset.atlasReadingBridge='MEIJI_EXISTING_SOURCE_PATH';node.className='knowledge-boundary';
 const heading=document.createElement('h3');heading.textContent=zh?'从历史案例继续阅读当前日本':'Continue from historical Meiji Japan to current Japan';node.append(heading);
 const note=document.createElement('p');note.textContent=zh?'第五册历史结构不是当前证据，也不是预测。第六册明治重组案例已有日本档案阅读关联；当前位置必须从该档案的独立接受记录读取。':'Book V historical structure is neither current evidence nor a forecast. The existing Book VI Meiji case links to the Japan dossier; current positions must come from that dossier’s independent acceptance.';node.append(note);
 for(const [href,label] of [['/books/reality-reconfiguration/?atlas=cases&case=RC-01#atlas',zh?'阅读明治重组案例':'Read the Meiji reconfiguration case'],['/books/reality-reconfiguration/?atlas=dossiers&dossier=DOSSIER-JP#atlas',zh?'查看当前日本接受档案并提问':'Open the accepted Japan dossier and ask']]){const a=document.createElement('a'),url=new URL(href,location.href);url.searchParams.set('locale',locale);a.href=url.pathname+url.search+url.hash;a.className='knowledge-action';a.textContent=label;node.append(a);}
 root.append(node);
}
