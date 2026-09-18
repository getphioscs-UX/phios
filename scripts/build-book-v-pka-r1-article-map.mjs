import fs from 'node:fs';
const read = p => JSON.parse(fs.readFileSync(p));
const inventory = read('content/books/book-5/source/final-manuscript-structure-v1.json');
// Editorial groupings combine complete arguments, not one article per PDF heading.
// Numbers below are source inventory positions, never historical Knowledge identities.
const plan = [
  [1,4,'文明为什么不能等同于国家','Why civilizations are not states','civilizations-and-states'],
  [5,6,'换一个尺度，文明会怎样改变','Reading civilization across scales','civilization-scales'],
  [7,8,'帝国结束以后，什么仍然继续','What continues after an empire ends','civilization-continuity'],
  [9,12,'怎样比较文明，并保留未知','Comparing civilizations without erasing uncertainty','comparing-civilizations'],
  [13,15,'地理、水与食物怎样塑造不同道路','Geography, water and food shape different paths','geography-water-food'],
  [16,18,'能源、人口与疾病怎样改变文明条件','Energy, population and disease','energy-population-disease'],
  [19,22,'距离、语言与记忆怎样连接社会','Connecting societies through transport, language and memory','distance-language-memory'],
  [23,24,'偶然为什么会留下长期路径','How contingency leaves lasting paths','contingency-and-paths'],
  [25,28,'从定居到城市，社会改变了什么','What changes between settlement and cities','settlement-and-cities'],
  [29,30,'苏美尔的城市、文字与账目','Sumerian cities, writing and accounts','sumerian-cities', ['CA-T02-01']],
  [31,33,'河流文明为什么没有同一种结构','Why river civilizations took different forms','river-civilizations',['CA-T02-03','CA-T02-04','CA-T03-04']],
  [34,36,'走出单一路线的早期文明史','Early civilizations beyond a single path','early-civilization-paths',['CA-T02-05','CA-T04-06']],
  [37,40,'青铜时代的连接与崩解','Connection and breakdown in the Bronze Age','bronze-age-networks',['CA-T03-05','CA-T03-06']],
  [41,44,'铁器与早期帝国的不同组织方式','Iron and different forms of early empire','iron-and-empires',['CA-T04-01','CA-T05-01','CA-T04-03']],
  [45,48,'思想、记忆与海上节点怎样超越疆域','Ideas, memory and maritime nodes beyond territory','influence-beyond-territory',['CA-T04-02']],
  [49,50,'分裂与混合中的希腊世界','Fragmentation and exchange in the Greek world','greek-world',['CA-T05-02']],
  [51,53,'罗马的协调能力与扩展负担','Roman coordination and the burdens of expansion','roman-expansion',['CA-T06-02']],
  [54,55,'秦汉怎样扩大国家的协调与记忆','Coordination and institutional memory in Qin and Han','qin-han-coordination',['CA-T06-01']],
  [56,58,'印度与玛雅：统一之外的复杂社会','India and Maya: complexity beyond political unity','complexity-beyond-unity',['CA-T06-03','CA-T07-05','CA-T07-01']],
  [59,60,'古典世界为什么留下不同答案','Different answers in the classical world','classical-worlds',['CA-T06-01','CA-T06-02','CA-T07-01']],
  [61,64,'宗教怎样跨越政治边界','How religions cross political boundaries','religious-networks'],
  [65,68,'经典、组织、法律与教育怎样延续信仰','Texts, institutions, law and religious education','religious-continuity'],
  [69,72,'翻译与知识怎样形成跨政治共同体','Translation, knowledge and communities beyond states','translation-and-knowledge',['CA-T08-06']],
  [73,76,'丝绸之路、草原与中亚节点','Silk Roads, steppe societies and Central Asian nodes','continental-networks'],
  [77,80,'季风、港口与沙漠怎样连接世界','Monsoons, ports and desert trade','ocean-and-desert-networks',['CA-T08-04','CA-T09-06']],
  [81,82,'唐与阿拔斯：帝国也是网络节点','Tang and Abbasid worlds as network centers','tang-and-abbasid',['CA-T08-01','CA-T08-06']],
  [83,84,'宋代的繁荣为什么不是工业化的预告','Why Song prosperity did not predetermine industrialization','song-china',['CA-T09-01']],
  [85,86,'蒙古扩展怎样重组欧亚连接','How Mongol expansion reshaped Eurasian connections','mongol-connections',['CA-T10-01','CA-T10-02']],
  [87,88,'黑死病之后，人口与权力怎样重组','Population and power after the Black Death','black-death-and-reorganization'],
  [89,90,'拜占庭之后：帝国终止与文明继承','After Byzantium: imperial endings and inheritance','byzantine-succession',['CA-T09-03','CA-T11-03']],
  [91,93,'海洋怎样成为新的连接前沿','How oceans became new frontiers of connection','oceanic-connections',['CA-T12-02']],
  [94,95,'哥伦布交换为什么不是对称交换','Why the Columbian Exchange was not symmetrical','columbian-exchange'],
  [96,98,'阿兹特克与印加的政治中心为何失控','Conquest and the loss of Aztec and Inca political control','american-conquests',['CA-T11-04','CA-T11-05']],
  [99,100,'殖民秩序与大西洋强制迁移','Colonial order and Atlantic forced migration','colonial-order',['CA-T12-01']],
  [101,102,'白银怎样把遥远社会接入共同循环','Silver and the emergence of global economic connections','silver-and-global-connections',['CA-T12-01','CA-T11-01']],
  [103,106,'工业阈值不只是一台新机器','The industrial threshold was more than a new machine','industrial-threshold',['CA-T13-01']],
  [107,110,'工厂、城市与共同时间','Factories, cities and shared time','industrial-organization',['CA-T13-01']],
  [111,114,'科学、教育与资本为何没有消除工业差异','Science, education, capital and divergent industrial paths','industrial-divergence',['CA-T13-01','CA-T14-02']],
  [115,118,'现代国家、民族与帝国怎样同时扩张','Modern states, nations and empires','modern-states-and-empires'],
  [119,122,'改革怎样进入不同社会的历史','Reform within different historical structures','paths-of-reform',['CA-T14-01','CA-T13-02','CA-T14-03']],
  [123,125,'没有共同起点的现代化','Modernization without a common starting point','unequal-modernities',['CA-T14-04','CA-T14-05','CA-T14-06']],
  [126,126,'现代化为什么没有唯一答案','Why modernization has no single answer','multiple-modernities']
];
const cases = read('content/civilization-atlas/cases/civilization-case-registry-v1.json').cases;
const assets = read('content/civilization-atlas/visuals/civilization-visual-asset-registry-v2.json').assets;
const snapshotsBySlug = {'song-china':['WS-1000','WS-1250'],'mongol-connections':['WS-1250'],'multiple-modernities':['WS-1914']};
const transitionsBySlug = {'settlement-and-cities':['TW-01','TW-02','TW-04'],'sumerian-cities':['TW-05'],'bronze-age-networks':['TW-07','TW-08'],'mongol-connections':['TW-18'],'oceanic-connections':['TW-19'],'industrial-threshold':['TW-23','TW-24'],'industrial-organization':['TW-25'],'modern-states-and-empires':['TW-27']};
// Reviewed topic-level relationships to existing P12 concepts. These are not
// replacements for the manuscript, equivalence assertions, or node admissions.
const knowledgeTopics = [[47,48],[49,52],[50,79],[51,56,96],[60,61],[73,79],[67,69,70],[60,61],[49,59],[64,67],[61,83],[61,83],[69,71],[63,64],[66,70],[84,86],[64,71],[64,67],[79,83],[51,83],[66,70],[64,67],[67,84],[69,84],[69,70],[69,84],[65,69],[63,69],[59,73],[79,85],[63,69],[84,85],[71,79],[64,85],[65,69],[59,68],[64,75,76],[61,67],[64,71],[59,60],[60,84],[60,61,83]];
const records = plan.flatMap(([from,to,zh,en,slug,caseIds=[]], i) => {
  const source = inventory.sections.slice(from - 1, to);
  const articleId = `book5-article-${String(i+1).padStart(3,'0')}`;
  const visualCandidates = assets.filter(a=>caseIds.includes(a.subjectId) && a.family==='CASE_HERO').map(a=>a.assetId);
  for (const id of caseIds) if (!cases.some(c=>c.caseId===id)) throw Error(`Unknown case ${id}`);
  return ['zh-Hans','en'].map(locale=>({
    articleId,locale,title:locale==='zh-Hans'?zh:en,slug:`book5-${slug}`,
    sourceSections:source.map(s=>s.sourceSectionId),sourceHeadings:source.map(s=>s.heading),
    sourcePages:{start:source[0].pdfPageStart,end:source.at(-1).pdfPageEnd},
    summary:locale==='zh-Hans'?`围绕“${zh}”，连贯阅读《世界如何分化》中的${source.length}个相关段落主题。`:`A connected reading of ${source.length} source sections in Reality Differentiation, focused on ${en.charAt(0).toLowerCase()+en.slice(1)}.`,
    summaryStatus:'EDITORIAL_BRIEF_NOT_PUBLIC_DEK',primaryTopic:slug,
    entities:caseIds,timePeriods:[],relatedCases:caseIds,relatedSnapshots:snapshotsBySlug[slug]||[],relatedComparisonFamilies:[],relatedTrajectories:[],relatedTransitions:transitionsBySlug[slug]||[],
    relatedLossTypes:['civilization-continuity','byzantine-succession'].includes(slug)?['LOSS-PARTIAL-CONTINUATION','LOSS-LEGACY-IN-NEW-SYSTEMS']:[],
    visualCandidates,visualBindingStatus:'CANDIDATES_ONLY_VERIFY_RESOLVER_IN_W6',knowledgeRefs:knowledgeTopics[i].map(n=>`KN-B4-P12-${String(n).padStart(3,'0')}`),
    knowledgeMappingStatus:'RELATED_CONCEPT_CANDIDATES_NOT_SECTION_EQUIVALENCE_OR_ACTIVATION',
    relationshipEvidence:caseIds.map(id=>({ref:id,role:'RELATED_READING_NOT_IDENTICAL_MANUSCRIPT_SCOPE',reason:'Named historical subject appears in the mapped source; the Atlas case retains its own narrower period and evidence boundary.'})),
    askContext:{book:'BOOK-5',articleId,articleTopic:slug,sourceSections:source.map(s=>s.sourceSectionId),relevantEntityRefs:caseIds},
    status:'SOURCE_MAPPED_CANDIDATE',publicationStatus:'NOT_PUBLISHED',
    splitReason:from===to?'A self-contained closing argument warrants a focused article.':'Adjacent sections answer a shared reader question; retain their distinctions within one connected argument.',
    semanticParityStatus:'BODY_NOT_PRODUCED',relatedArticles:[],
  }));
});
fs.mkdirSync('content/books/book-5/articles',{recursive:true});
fs.writeFileSync('content/books/book-5/articles/article-production-map-v1.json',JSON.stringify({schemaVersion:'PHI-OS-BOOK-V-ARTICLE-PRODUCTION-MAP-v1',work:'BOOK-V-PKA-R1-W1',sourceInventory:'content/books/book-5/source/final-manuscript-structure-v1.json',sourcePdfSha256:inventory.sourcePdfSha256,status:'SOURCE_MAPPED_EDITORIAL_PLAN',articleCount:plan.length,localeRecordCount:records.length,publicRoutesActivated:false,relationshipPolicy:'Explicit editorial candidates only. Empty relationships remain unresolved; no keyword-generated runtime associations.',records},null,2)+'\n');
console.log(`Book V: ${plan.length} article candidates, ${records.length} locale records; no publication granted.`);
