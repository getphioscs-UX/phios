export const BAZI_PUBLICATION_FIT_V1='BAZI_PUBLICATION_FIT_V1';
export const LAYOUT_PROFILES=Object.freeze({
 BILINGUAL:{id:'BAZI_PUBLICATION_LAYOUT_PROFILE_BILINGUAL_V1',locales:['zh-Hans','en'],bodyBudget:{'zh-Hans':380,en:1100},cardBudget:{'zh-Hans':125,en:480}},
 EN:{id:'BAZI_PUBLICATION_LAYOUT_PROFILE_EN_V1',locales:['en'],bodyBudget:{en:2200},cardBudget:{en:660}},
 ZH_HANS:{id:'BAZI_PUBLICATION_LAYOUT_PROFILE_ZH_HANS_V1',locales:['zh-Hans'],bodyBudget:{'zh-Hans':780},cardBudget:{'zh-Hans':200}}
});
export function layoutProfile(mode='BILINGUAL'){if(!LAYOUT_PROFILES[mode])throw Error('UNSUPPORTED_BAZI_PRESENTATION_MODE');return LAYOUT_PROFILES[mode];}
export const FONT_MINIMUMS={body:10.5,card:9.5,caption:8.5,title:20,footer:7.5};
