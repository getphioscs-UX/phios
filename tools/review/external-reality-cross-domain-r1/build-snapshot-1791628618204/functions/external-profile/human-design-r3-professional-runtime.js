import crypto from 'node:crypto';
import {adaptCanonicalHumanDesignChartToR3Facts,buildHumanDesignR3StructuralMap} from './human-design-r3-facts-adapter.js';
import {prioritizeHumanDesignR3WholeChart} from './human-design-r3-whole-chart-priority.js';
import {buildHumanDesignR3ProfessionalReadingIr} from './human-design-r3-reading-ir-v2.js';
import {editorializeHumanDesignR3Reading,assertNoHumanDesignR3EditorialLeaks} from './human-design-r3-customer-editorial.js';
import {buildHumanDesignR3RealityCompositionV2} from './human-design-r3-reality-composition-v2.js';
import {composeHumanDesignR3SingleChartRelationship} from './human-design-r3-relationship-composition.js';
import {inspectHumanDesignR3SensitiveOutput} from './human-design-r3-epistemic-boundary.js';
import {HD_R3_PRODUCTION_AUTHORITY} from './human-design-r3-production-authority.js';

export const HD_R3_PROFESSIONAL_PRODUCT_VERSION='PHI-OS-HD-PRO-R3-W23-W25-PROFESSIONAL-PRODUCT-v1.0.0';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);
const zh=(en,zhHans)=>({en,zhHans});

function publishBoundarySections(editorial){
  return editorial.customerSections.map(section=>section.sectionId==='HD-R3-READING-13-SOURCES_BOUNDARIES'?Object.freeze({...section,boundarySummary:Object.freeze([
    zh('This reading uses the Human Design chart you supplied and confirmed; PHI OS did not calculate or rebuild the chart from birth data.','这份读取只使用你提供并确认的人类图；PHI OS 没有根据出生资料自行计算或重建图表。'),
    zh('The professional reading passed the R3 machine campaign, benchmark campaign and a new 24/24 human review before customer publication.','这份专业读取在客户发布前已通过 R3 机器 campaign、benchmark campaign 与新一轮 24/24 人工验收。'),
    zh('Advanced Variable/PHS material remains an optional observation layer, not medical, nutritional, therapeutic, financial, legal or mandatory advice.','高级 Variable/PHS 仍然只是可选观察层，不构成医疗、营养、治疗、财务、法律或强制建议。')
  ])}):section);
}

export function buildHumanDesignR3ProfessionalProduct(chart,{locale='en',intent=''}={}){
  const facts=adaptCanonicalHumanDesignChartToR3Facts(chart,{customerIntent:intent});
  const priority=prioritizeHumanDesignR3WholeChart(facts,{customerIntent:intent});
  const readingIr=buildHumanDesignR3ProfessionalReadingIr(facts,{priorityResult:priority});
  const editorial=editorializeHumanDesignR3Reading(facts,{readingIr});assertNoHumanDesignR3EditorialLeaks(editorial);
  const reality=buildHumanDesignR3RealityCompositionV2(facts,{priorityResult:priority});
  const relationship=composeHumanDesignR3SingleChartRelationship(facts,{priorityResult:priority});
  const sensitive=inspectHumanDesignR3SensitiveOutput({editorial:editorial.customerSections,reality:reality.questions,relationship:relationship.interpretations});
  if(!sensitive.passed)throw new Error('HD_R3_SENSITIVE_DOMAIN_BOUNDARY_FAILED');
  const structuralMap=buildHumanDesignR3StructuralMap(chart,facts);
  const customerSections=Object.freeze(publishBoundarySections(editorial));
  const seed={
    schemaVersion:HD_R3_PROFESSIONAL_PRODUCT_VERSION,
    activeCustomerReadingVersion:'HD_PRO_R3',
    chartDigest:chart.chartDigest,
    locale:locale==='zh-Hans'?'zh-Hans':'en',
    factsDigest:facts.factsDigest,
    priority:Object.freeze({primaryFindings:priority.primaryFindings,secondaryFindings:priority.secondaryFindings,contextualFindings:priority.contextualFindings,advancedDetails:priority.advancedDetails,counts:priority.counts,priorityDigest:priority.priorityDigest}),
    readingIr,
    customerReading:Object.freeze({customerSections,editorialDigest:editorial.editorialDigest,technicalTrace:editorial.technicalTrace}),
    structuralMap,
    realityComposition:reality,
    relationshipComposition:relationship,
    publicationDecision:Object.freeze({machineVerified:HD_R3_PRODUCTION_AUTHORITY.machineVerified,humanAccepted:HD_R3_PRODUCTION_AUTHORITY.humanAccepted,productionAdmitted:true,customerPublishable:HD_R3_PRODUCTION_AUTHORITY.customerPublicationAllowed,humanReviewEvidence:'HD-PRO-R3-W22-HUMAN-ACCEPTED-24-OF-24'}),
    boundaries:Object.freeze({customerSuppliedExternalContext:true,phiosCalculated:false,hdrPublicExecutionUsed:false,automaticVariableCalculationUsed:false,advancedVariableIsModifierOnly:true,dualChartRelationshipUsed:false,compatibilityScoreCreated:false,sensitiveDomainInspectionPassed:true,r2FallbackAvailable:true})
  };
  return Object.freeze({...seed,professionalProductDigest:digest(seed)});
}
