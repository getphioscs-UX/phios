// Method-owned, review-only interpretation canon. These are conditional lenses,
// never empirical personality findings or new BaZi calculation rules.
export const CAREER_CSD_VERSION='PHI-OS-BAZI-S04-CSD-v2.0.0';
export function careerReviewState({technicalPass,editorialPass,ownerDecision='PENDING'}={}){
 return {technicalStatus:technicalPass?'TECHNICAL_PASS':'TECHNICAL_FAIL',automatedEditorialStatus:editorialPass?'EDITORIAL_AUTOMATED_PASS':'EDITORIAL_AUTOMATED_FAIL',
  editorialStatus:!technicalPass?'EDITORIAL_NOT_ELIGIBLE':ownerDecision==='REJECT'?'EDITORIAL_REJECT':ownerDecision==='ACCEPT'&&editorialPass?'EDITORIAL_ACCEPT':'EDITORIAL_PENDING',
  ownerAcceptance:ownerDecision==='REJECT'?'REJECT':ownerDecision==='ACCEPT'&&technicalPass&&editorialPass?'ACCEPT':'PENDING',productionActivated:false};
}
export const CUSTOMER_VALUE_CONTRACT=Object.freeze({
 version:'PaidReportCustomerValueContract-v1.0.0',methodId:'BZR',sectionKey:'S04_CAREER',state:'REVIEW_ONLY',
 questions:['central pattern','chart mechanism','contribution','advantage','cost','helpful role conditions','costly role conditions','responsibility/output/resources/support/authority interaction','sustainable role','unsustainable role','workplace scenarios','timing modification','decision criteria','uncertainty'],
 minimums:{thesis:1,causalChains:3,scenarios:4,contrasts:2,environmentDistinctions:2,sustainable:1,unsustainable:1,synthesizedFacts:2,timingWhenAvailable:1,decisionSequence:1},
 ratios:{customerInterpretation:.70,methodExplanationMax:.15,disclaimerMax:.10,observableInterpretation:.70},
 forbidden:'A paid section cannot mainly explain categories, percentages, operators, pattern rules or epistemic disclaimers.',
 expansionGate:'S04_OWNER_ACCEPTED',otherMethodsRequire:['authority','semantic canon','translation canon','uncertainty contract','section brief']
});
export const CAREER_TRANSLATION_CANON=Object.freeze({
 OFFICER:{en:['accountability','deadlines','performance standards','authority','professional obligations','role boundaries'],zh:['问责','期限','绩效标准','决策权限','职业责任','职责边界']},
 RESOURCE:{en:['expertise','training','mentoring','documentation','team backing','preparation time'],zh:['专业知识','培训','指导','文档流程','团队支持','准备时间']},
 WEALTH:{en:['client value','budget','pricing','negotiation','resource allocation','commercial accountability'],zh:['客户价值','预算','定价','谈判','资源分配','商业责任']},
 OUTPUT:{en:['delivery','problem-solving','presentation','technical execution','service delivery','visible contribution'],zh:['交付','解决问题','提案表达','技术执行','服务交付','可见贡献']},
 PEER:{en:['autonomy','collaboration','ownership','negotiating space','resource sharing'],zh:['自主空间','协作','工作主导权','协商余地','资源共享']}
});
const pair=(en,zh)=>({en,'zh-Hans':zh});
// Each rule has two or more required inputs. Selection happens in the builder,
// not in the LLM. Text is interpretation data, not a final report template.
export const CAREER_MECHANISMS=Object.freeze({
 OUTPUT_BACKING:{
  mechanism:pair('Visible outward effort and external demands outweigh visible backing in this reading. Interpret contribution through delivery under load: the useful distinction is whether a job supplies preparation and help before asking for more throughput. This does not establish actual stamina or absent real-world help.','这份读取中，向外投入与外部要求比可见支持更突出。贡献应结合工作量来理解：关键区别在于岗位是否先提供准备与协助，再提高交付量；这不认定现实中的体力或帮助不足。'),
  advantage:pair('With review time and a reliable handoff, a demanding deliverable offers a concrete way to turn effort into usable work.','有复核时间和可靠交接时，高要求的交付任务能为投入提供明确的成果出口。'),
  cost:pair('If the queue expands while preparation and handoff time shrink, more completed work can carry disproportionate rework and recovery costs.','任务排队增加而准备、交接时间缩短时，更多完成量可能伴随不成比例的返工与恢复成本。'),
  fit:pair('Defined delivery priorities, protected preparation time and someone who can resolve blocked dependencies.','明确交付优先级、保留准备时间，并有人能解决阻塞任务的依赖。'),
  mismatch:pair('Several urgent deliverables assigned to one person with no time to review or escalate conflicting deadlines.','多项紧急任务集中给一个人，却没有复核时间或协调冲突期限的渠道。'),
  scenarios:[['OUTPUT',pair('If a delivery role adds a second project, compare the new deadline with the review time and handoff capacity it actually provides. Extra output can become visible contribution when quality checks keep pace; otherwise unfinished dependencies may turn speed into rework.','如果交付岗位增加第二个项目，要把新增期限与实际复核时间、交接能力一起比较。质检能跟上时，更多产出可成为可见贡献；依赖事项未解决时，速度可能转成返工。')],['TEAM_SUPPORT',pair('When a team loses a support colleague, a clear escalation route can preserve delivery quality. If the remaining person must also absorb coordination and checking, the apparent same workload carries a larger hidden cost.','团队减少一位协助同事时，明确的升级协调渠道有助于维持交付质量。如果留下的人还需接手协调与核查，看似相同的工作量就可能增加隐性成本。')]]
 },
 AUTHORITY_LOAD:{
  mechanism:pair('Accountability leads this career reading, while the recorded workplace/self relationship carries tension. Test responsibility against decision latitude: standards can focus a contribution, but accountability without influence over the work conditions can make the same demand costly. This is a conditional role comparison, not a claim of conflict with an employer.','问责是事业读取的首要重点，工作环境与自身位置之间同时存在需要协调的关系。应把责任与决策余地比较：标准能集中贡献，但无法影响工作条件却要负责结果时，同一要求可能变得昂贵；这不认定现实中与雇主存在冲突。'),
  advantage:pair('Clear standards and a defined decision mandate can make responsibility a route to trusted professional contribution.','标准清楚且授权明确时，责任可成为建立专业可信度的途径。'),
  cost:pair('A larger title may increase accountability without increasing control over staffing, priorities or deadlines.','职位名称变大，可能只增加问责，却未增加人员、优先级或期限的控制权。'),
  fit:pair('Written scope, a named decision owner and authority to negotiate priorities before accepting delivery commitments.','书面职责范围、明确的决策人，以及承诺交付前协调优先级的权限。'),
  mismatch:pair('Being judged against results while approvals and resources are controlled elsewhere.','结果由自己负责，但审批和资源掌握在其他人手中。'),
  scenarios:[['PROMOTION',pair('If a promotion adds a team or a target, check which decisions move with it. A clear mandate can turn additional responsibility into professional scope; a title without staffing or priority control may simply concentrate accountability.','如果晋升增加团队或指标，要核对哪些决策权随之转移。明确授权可让新增责任成为专业发挥空间；只有头衔、没有人员或优先级控制权，则可能只把问责集中起来。')],['ORGANIZATIONAL_STRUCTURE',pair('In a regulated organization, documented standards can make good work easier to demonstrate. When approval layers delay decisions but deadlines stay fixed, the useful test is whether there is a workable exception or escalation process.','在规范严格的组织里，书面标准能让合格成果更容易被确认。若审批层级拖慢决策而期限不变，则应检查是否存在可执行的例外处理或升级协调流程。')]]
 },
 COMMERCIAL_DELIVERY:{
  mechanism:pair('Commercial exchange is associated with the career priority and outward demands are present. Link the value promised to the client with the capacity required to deliver it, rather than reading revenue as a free-standing success measure.','商业交换与事业主线相连，向外投入也有记录。应把对客户承诺的价值与兑现所需的工作能力连接起来，不能把收入单独作为成功尺度。'),
  advantage:pair('A clearly scoped service can make a useful contribution legible to a client and support a more concrete pricing discussion.','范围明确的服务能让客户理解贡献，也有助于更具体地讨论定价。'),
  cost:pair('Extra revisions or poorly defined client requests can consume delivery time without a matching change in budget.','额外修改或定义不清的客户要求，可能消耗交付时间而预算没有同步变化。'),
  fit:pair('Agreed scope, revision limits and a budget tied to deliverables.','明确服务范围、修改次数，以及与交付内容对应的预算。'),
  mismatch:pair('Success measured only by incoming clients while service capacity and scope remain unpriced.','只用新增客户衡量成果，却不计算服务能力与范围的成本。'),
  scenarios:[['CLIENT_LOAD',pair('If a client offers recurring work, compare the promised volume with response windows and revision limits. A stable brief can make delivery repeatable; open-ended availability can make the same fee support far more work than expected.','客户提供持续合作时，应把承诺数量与响应时限、修改上限比较。稳定的需求说明有助于重复交付；无边界的随时响应，则可能让同一费用对应远超预期的工作。')],['RESOURCES',pair('When a project carries revenue responsibility, ask whether its budget also covers the tools and specialist help needed for delivery. Commercial ownership can clarify value; it becomes expensive if the person is responsible for the margin but cannot negotiate the inputs.','项目承担收入责任时，要核对预算是否覆盖交付所需工具与专业协助。商业负责制有助于明确价值；若要对利润负责却不能协商投入，成本可能上升。')]]
 },
 EXPERTISE_OUTPUT:{
  mechanism:pair('Visible support is present alongside a learning emphasis. Contribution can be interpreted through expertise becoming usable work: preparation has value when it improves a decision or a deliverable, rather than becoming a requirement for perfect certainty.','可见支持与学习重点同时存在。贡献可从专业知识如何转成可用成果来理解：准备能改善决策或交付时才体现价值，不必等到完全确定才行动。'),
  advantage:pair('Training and consultation can support careful specialist delivery.','培训与咨询支持可帮助完成细致的专业交付。'),cost:pair('Repeated preparation can delay a useful first version if the role has no clear readiness threshold.','若岗位没有明确的交付就绪标准，反复准备可能拖延有用的初版。'),
  fit:pair('Access to expertise plus a clear review and release milestone.','能获得专业支持，并有清楚的评审、发布节点。'),mismatch:pair('More credentials requested without an opportunity to apply the learning.','持续要求更多资历，却没有应用所学的机会。'),
  scenarios:[['LEARNING',pair('In a specialist assignment, agree what evidence is sufficient for the first recommendation. Mentoring can improve accuracy; indefinite research may postpone a decision the team needs.','承担专业任务时，先约定首轮建议需要哪些充分证据。指导可提高准确性；无止境研究则可能推迟团队需要的决策。')],['OUTPUT',pair('When moving from training to a live project, a small reviewed release can turn knowledge into usable work. Requiring a flawless full solution before feedback risks hiding practical gaps until late.','从培训转入实际项目时，小规模且经过复核的交付可把知识转成可用成果。等完整方案毫无缺陷才反馈，可能让实际缺口很晚才暴露。')]]
 },
 AGENCY_EXCHANGE:{
  mechanism:pair('Peer or agency themes meet commercial exchange in this reading. Interpret opportunity through ownership and negotiated contribution: shared resources can widen options, while unclear division of work and reward can make collaboration costly.','自主或同伴主题与商业交换相遇。机会应从主导权和协商贡献来理解：共享资源可扩大选择，但分工与回报不清时，合作也可能增加成本。'),
  advantage:pair('Negotiated ownership can make collaboration useful without losing initiative.','协商清楚的主导权可让协作有用，同时保留主动空间。'),cost:pair('Unclear boundaries can turn shared clients or tools into competing claims on the same resources.','边界不清时，共同客户或工具可能变成对同一资源的争夺。'),
  fit:pair('Explicit ownership, contribution records and agreed sharing terms.','明确归属、记录贡献，并约定共享条款。'),mismatch:pair('Shared revenue with undefined delivery duties.','共享收入，却未明确交付职责。'),
  scenarios:[['AUTONOMY',pair('If offered an independent practice inside a larger team, check who owns client decisions and who supplies support. Real discretion can support initiative; independence that only transfers costs leaves less usable freedom.','获得大团队内独立开展业务的机会时，应核对客户决策归谁、支持由谁提供。实际裁量权能支持主动性；只转移成本的独立则留下较少可用空间。')],['COMMERCIAL_EXCHANGE',pair('In a joint client proposal, agree who delivers each part and how changes are priced. Shared access can widen opportunity; ambiguous ownership can make every new request a negotiation.','共同向客户提案时，先约定各部分由谁交付、变更如何计价。共享渠道可扩大机会；归属模糊则可能让每个新要求都变成一轮谈判。')]]
 },
 BACKED_ACCOUNTABILITY:{
  mechanism:pair('Accountability coexists with visible backing and roots. Standards can be approached through preparation and dependable support, rather than responsibility alone. Their presence is not proof that the actual employer supplies help.','问责与可见支持、根基并存。标准可通过准备与可靠支持来应对，而不只靠承担责任；这并不证明现实雇主已提供帮助。'),
  advantage:pair('A supported mandate can let professional standards guide consistent delivery.','有支持的授权可让专业标准引导稳定交付。'),cost:pair('Reliance on established processes can become costly when exceptional decisions have no escalation owner.','依赖既定流程时，若例外事项没有升级决策人，成本可能上升。'),
  fit:pair('Reliable review resources and a clear exception process.','可靠的复核资源，以及明确的例外处理流程。'),mismatch:pair('Formal responsibility with nominal support that cannot resolve practical obstacles.','名义上有支持，却无法解决实际阻碍的正式责任。'),
  scenarios:[['AUTHORITY',pair('In a management assignment, review whether specialist advice can be obtained before commitments are made. Available backing can improve decisions; merely listing advisers without access adds little to the mandate.','承担管理任务时，应核对承诺前能否获得专业意见。可用支持有助于决策；只列出顾问名单却无法接触，对授权帮助有限。')],['ORGANIZATIONAL_STRUCTURE',pair('When a standard procedure does not fit a case, an agreed exception owner can protect both quality and pace. Without that owner, a well-supported routine may still stall on unfamiliar work.','标准程序不适合某个案例时，约定的例外决策人能兼顾质量与进度。缺少这一角色，即使日常支持充足，遇到陌生任务仍可能停滞。')]]
 }
});
