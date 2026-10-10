// Admission inventory, not a new manuscript registry or owner decision.
// The frozen bilingual reference's subject binding is explicitly PENDING.
export const BAZI_COPY_INVENTORY=Object.freeze([
 {id:'COMPOSITION_R1',source:'docs/acceptance/bazi-paid-report/composition-r1/HUMAN-ACCEPTANCE.json',locales:['zh-Hans','en'],pillars:['己巳','庚午','癸丑','戊午'],subjectBinding:'PENDING',timing:'甲戌 / 2026 丙午',productionAdmission:'PENDING'},
 {id:'FULL_REPORT_C1',source:'functions/personal-reading/narrative/bazi-full-report-c1-copy.generated.js',locales:['zh-Hans'],pillars:['庚申','甲子','庚辰','庚寅'],subjectBinding:'PARTIAL_TEST_STRUCTURE',timing:'己巳 / 丙寅; Gregorian identity UNKNOWN',productionAdmission:'PENDING'},
 {id:'VFR_R1',source:'functions/personal-reading/bazi-vfr-r1-publication.js',locales:['zh-Hans'],pillars:['庚申','甲子','庚辰','庚寅'],subjectBinding:'PARTIAL_TEST_STRUCTURE',timing:'己巳 / 丙寅; Gregorian identity UNKNOWN',productionAdmission:'PENDING'},
 {id:'DEEP_R2_VISUAL_R4',source:'docs/acceptance/bazi-paid-report/deep-manuscript-r2/owner-acceptance-r3-4/2026-10-08T01-45-53-624Z/HUMAN-VISUAL-ACCEPTANCE-R2.json',locales:['zh-Hans','en'],pillars:['庚申','甲子','庚辰','庚寅'],subjectBinding:'VISUAL_PUBLICATION_REFERENCE_ONLY',timing:'Source-bound reference timing; no new subject acceptance',productionAdmission:'NOT_GRANTED'},
 {id:'PRO_EDITORIAL_REFERENCE',source:'functions/personal-reading/narrative/report-pro-reference-registry.js',locales:[],pillars:[],subjectBinding:'EDITORIAL_EXEMPLAR_NOT_REUSABLE_CONTENT',timing:'NOT_CONTENT_AUTHORITY',productionAdmission:'NOT_CONTENT_ADMISSION'}
]);
export function inspectBaziAcceptedCopyCoverage({pillars,locales=['zh-Hans','en']}={}){
 const candidates=BAZI_COPY_INVENTORY.map(c=>({...c,chartMatches:Array.isArray(pillars)&&JSON.stringify(pillars)===JSON.stringify(c.pillars),missingLocales:locales.filter(l=>!c.locales.includes(l)),admitted:false,reason:c.subjectBinding==='PENDING'?'REFERENCE_SUBJECT_BINDING_PENDING':'REFERENCE_ONLY_PARTIAL_AUTHORITY'}));
 return {state:'BLOCKED_ACCEPTED_COPY_COVERAGE',candidates,selected:null,requiredSections:Array.from({length:10},(_,i)=>'S'+String(i+1).padStart(2,'0')),requiredLocales:locales,missing:'No existing accepted edition grants reusable complete bilingual content for a newly bound account subject and its timing authority. Matching pillars alone do not establish identity or semantic equivalence.',paidFallbackAllowed:false};
}
export function baziProjectionPillars(projection){
 const stems={JIA:'甲',YI:'乙',BING:'丙',DING:'丁',WU:'戊',JI:'己',GENG:'庚',XIN:'辛',REN:'壬',GUI:'癸'},branches={ZI:'子',CHOU:'丑',YIN:'寅',MAO:'卯',CHEN:'辰',SI:'巳',WU:'午',WEI:'未',SHEN:'申',YOU:'酉',XU:'戌',HAI:'亥'};
 const items=projection?.calculation?.structures?.find(s=>s.code==='FOUR_PILLARS')?.items||[];
 return ['YEAR','MONTH','DAY','HOUR'].map(k=>{const s=stems[items.find(i=>i.code===k+'_STEM')?.value],b=branches[items.find(i=>i.code===k+'_BRANCH')?.value];return s&&b?s+b:null;});
}
