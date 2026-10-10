// Native taxonomy codes stay in filtering and source provenance, never in copy.
export function knowledgeTopicLabel(code,themes,locale='en'){
 const row=themes.find(t=>t.themeCode===code),title=row?.titles?.[locale];
 if(title)return title;
 const labels={CIVILIZATION_RECONFIGURATION:['Civilization reconfiguration','文明重组'],CIVILIZATION_RUNTIME:['Civilization dynamics','文明运行'],COORDINATION_RUNTIME:['Coordination','协调与协作'],RUNTIME_EXPANSION:['Expansion','扩展'],RUNTIME_MAINTENANCE:['Continuity and maintenance','延续与维护']};
 if(labels[code])return labels[code][locale==='zh-Hans'?1:0];
 return /^TH-[A-Z0-9-]+$|^[A-Z][A-Z0-9]*_[A-Z0-9_]+$/.test(String(code))?(locale==='zh-Hans'?'其他主题':'Other topic'):String(code??'');
}
