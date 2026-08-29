import {selectEcrPhiCards} from './ecr-card-selector.js';

const list = v => Array.isArray(v) ? v : [];
const text = (obj, locale) => obj?.[locale] ?? obj?.en ?? obj?.['zh-Hans'] ?? '';
const groupOrder = Object.freeze(['CORE','DRIVER','GIFT','TENSION','FIELD','PHASE']);

function customerSafe(s='') {
  return String(s)
    .replace(/\b(?:CC|G|Q|R|D|M|A)\d{1,2}\b/g, '')
    .replace(/\bECR-H\d{2}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function evidenceForGroup(interpretationUnits, groupSelection) {
  const reasons = list(groupSelection?.reasons);
  const codes = reasons.map(x => String(x).split(':').pop()).filter(Boolean);
  const units = list(interpretationUnits);
  const matched = units.find(u => {
    const hay = JSON.stringify({projectionRefs:u?.projectionRefs, meaningRefs:u?.meaningRefs, ruleRefs:u?.ruleRefs});
    return codes.some(code => hay.includes(code));
  });
  return matched || units[0] || null;
}

function buildReading(groupId, groupSelection, assetByCard, locale, interpretationUnits) {
  if (!groupSelection?.card) return null;
  const card = groupSelection.card;
  const asset = assetByCard.get(card.cardId);
  const evidence = evidenceForGroup(interpretationUnits, groupSelection);
  const observable = customerSafe(list(evidence?.observableSignals)[0] || '');
  const comparison = customerSafe(list(evidence?.realityComparisonQuestions)[0] || '');
  return Object.freeze({
    groupId,
    cardId: card.cardId,
    title: text(card.title, locale),
    subtitle: text(card.subtitle, locale),
    keywords: list(card.keywords?.[locale] ?? card.keywords?.en),
    asset: asset ? {assetId:asset.assetId, objectKey:asset.objectKey, fileName:asset.fileName} : null,
    oneLineInsight: text(card.oneLineInsight, locale),
    canonicalCustomerMeaning: text(card.canonicalCustomerMeaning, locale),
    flowingExpression: text(card.flowingExpression, locale),
    strainedExpression: text(card.strainedExpression, locale),
    observationPrompt: text(card.observationPrompt, locale),
    contextualEvidence: {
      observableSignal: observable || null,
      realityComparisonQuestion: comparison || null
    },
    boundaries: {
      replacesFullEcrReport:false,
      createsNewEcrMeaning:false,
      tensionIsCurrentFact:false,
      phasePredictsFuture:false
    },
    lineage: {
      selectionReasons: list(groupSelection.reasons),
      interpretationUnitId: evidence?.interpretationUnitId || null,
      score: groupSelection.score
    }
  });
}

export function composeEcrPhiCardSpread({coordinate, interpretationUnits, customerPublishable=false, locale='en'}, mapping, deck, assetRegistry) {
  if (customerPublishable !== true) throw new TypeError('ECR_PHI_CARD_CUSTOMER_PUBLISHABLE_RESULT_REQUIRED');
  if (!['en','zh-Hans'].includes(locale)) throw new TypeError('ECR_PHI_CARD_LOCALE_UNSUPPORTED');
  const selection = selectEcrPhiCards({coordinate, interpretationUnits, customerPublishable}, mapping, deck);
  const assetByCard = new Map(list(assetRegistry?.assets).map(a => [a.cardId, a]));
  const cards = groupOrder.map(groupId => buildReading(groupId, selection.groups[groupId], assetByCard, locale, interpretationUnits)).filter(Boolean);
  if (cards.length !== 6) throw new TypeError('ECR_PHI_CARD_SIX_GROUP_SPREAD_REQUIRED');
  return Object.freeze({
    schemaVersion:'PHI-OS-ECR-PHI-CARD-SPREAD-v1.0.0',
    methodId:'ECR',
    locale,
    spreadType:'SIX_GROUP_ECR_PRESENTATION',
    cards,
    fullEcrReportStillAuthoritative:true,
    customerNotice: locale === 'zh-Hans'
      ? '这些牌把已经形成的 ECR 结果转成更具体的视觉入口；它们不会取代完整报告，也不会增加新的结论。'
      : 'These cards turn the existing ECR result into a more concrete visual entry point. They do not replace the full report or add new conclusions.',
    boundaries:{randomDraw:false,newMeaningCreated:false,currentRealityInferred:false,fortunePrediction:false}
  });
}

export default Object.freeze({composeEcrPhiCardSpread});
