const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderStructuredAnswer(value,locale='en'){
 if(!value)return '';
 const tr=(en,zh)=>locale==='zh-Hans'?zh:en,unknown=tr('Not established by the available sources.','现有来源尚未确立。');
 const rows=[['Mechanism / state','机制／状态',value.mechanismOrState],['Conditions','条件',value.conditions],['Related factors','相关因素',value.relatedFactors],['Possible transition','可能的转换',value.possibleTransition],['Boundary / unknown','边界／未知',value.boundaryUnknown]];
 const href=typeof value.exploreInBook==='string'&&/^\/books\/[a-z-]+\//.test(value.exploreInBook)?value.exploreInBook:null;
 const labels={'reality-formation':['Explore Mechanism','探索形成机制'],'reality-runtime':['Explore Pattern','探索运行模式'],'reality-continuity':['Explore Recovery','探索维持与恢复'],'reality-expansion':['Explore Scale Transition','探索尺度转换']};
 const action=labels[href?.split('/')[2]];
 return `<div data-structured-answer>${rows.map(([en,zh,body])=>`<section><h3>${tr(en,zh)}</h3><p>${esc(Array.isArray(body)?body.join(' · ')||unknown:body||unknown)}</p></section>`).join('')}<section><h3>${tr('Explore in Book','在书中探索')}</h3>${href?`<a href="${esc(href)}">${action?tr(...action):tr('Return to the selected topic','返回选定主题')}</a>`:`<p>${unknown}</p>`}</section></div>`;
}
