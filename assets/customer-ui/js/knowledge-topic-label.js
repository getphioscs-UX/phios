// Native taxonomy codes stay in filtering and source provenance, never in copy.
export function knowledgeTopicLabel(code,themes,locale='en'){
 const row=themes.find(t=>t.themeCode===code),title=row?.titles?.[locale];
 if(title)return title;
 return /^TH-[A-Z0-9-]+$/.test(String(code))?(locale==='zh-Hans'?'其他主题':'Other topic'):String(code??'');
}
