import crypto from 'node:crypto';

const SUPPORTED_LOCALES = new Set(['en', 'zh-Hans']);
const SUPPORTED_AUDIENCES = new Set(['CUSTOMER', 'PROFESSIONAL', 'TECHNICAL']);

const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, canonicalize(value[key])])
    );
  }
  return value;
};

const fail = code => {
  const error = new Error(code);
  error.code = code;
  throw error;
};

export const stableProductionPresentationDigest = value => crypto
  .createHash('sha256')
  .update(JSON.stringify(canonicalize(value)))
  .digest('hex');

export function validateCprProductionInstance(instance) {
  if (!/^PRESENTATION-[A-Z0-9-]+-(?:EN|ZH-HANS)-v[1-9][0-9]*$/.test(instance?.presentationCode || '')) {
    fail('CPR_PRODUCTION_PRESENTATION_CODE_INVALID');
  }
  if (instance.presentationType !== 'ARTICLE_PAGE' || instance.surface !== 'WEBSITE') {
    fail('CPR_PRODUCTION_PRESENTATION_TYPE_OR_SURFACE_INVALID');
  }
  if (!SUPPORTED_LOCALES.has(instance.locale) || !SUPPORTED_AUDIENCES.has(instance.audience)) {
    fail('CPR_PRODUCTION_LOCALE_OR_AUDIENCE_INVALID');
  }
  if (instance.renderState !== 'ready_for_render') {
    fail('CPR_PRODUCTION_RENDER_STATE_INVALID');
  }
  if (instance.inputs?.publishedArticle?.publicationState !== 'published') {
    fail('CPR_PRODUCTION_PUBLISHED_ARTICLE_REQUIRED');
  }
  if (instance.inputs?.publishedFigure?.publicationState !== 'published') {
    fail('CPR_PRODUCTION_PUBLISHED_FIGURE_REQUIRED');
  }
  if (instance.inputs.publishedFigure.locale !== instance.locale) {
    fail('CPR_PRODUCTION_FIGURE_LOCALE_MISMATCH');
  }
  if (instance.inputs.locale !== instance.locale || instance.inputs.audience !== instance.audience) {
    fail('CPR_PRODUCTION_INPUT_LOCALE_OR_AUDIENCE_MISMATCH');
  }
  if (instance.inputs.readingContext?.bookCode !== 'BOOK-1' || instance.inputs.readingContext?.partCode !== 'P0') {
    fail('CPR_PRODUCTION_READING_CONTEXT_INVALID');
  }
  if (!instance.inputs.publishedFigure.altText?.trim()) {
    fail('CPR_PRODUCTION_FIGURE_ALT_REQUIRED');
  }
  if (!instance.figurePresentation?.caption?.trim()) {
    fail('CPR_PRODUCTION_FIGURE_CAPTION_REQUIRED');
  }
  if (instance.figurePresentation.caption !== instance.inputs.publishedFigure.altText) {
    fail('CPR_PRODUCTION_FIGURE_CAPTION_NOT_SOURCE_TRACEABLE');
  }
  if (instance.figurePresentation.criticalContentPolicy !== 'CONTAIN_FULL_ASSET') {
    fail('CPR_PRODUCTION_FIGURE_CRITICAL_CONTENT_POLICY_INVALID');
  }
  if (instance.figurePresentation.colorOnlyExplanationAllowed !== false) {
    fail('CPR_PRODUCTION_COLOR_ONLY_EXPLANATION_FORBIDDEN');
  }
  if (instance.authorityBoundaries?.decides?.join('|') !== 'COMPOSITION|PLACEMENT|INFORMATION_DENSITY|SURFACE|RESPONSIVE_PROJECTION') {
    fail('CPR_PRODUCTION_DECISION_BOUNDARY_INVALID');
  }
  if (instance.authorityBoundaries?.doesNotDecide?.join('|') !== 'KNOWLEDGE|MEANING|ASSET_APPROVAL') {
    fail('CPR_PRODUCTION_AUTHORITY_OVERREACH');
  }
  if (instance.pdsReferences?.articleLocalCss !== false) {
    fail('CPR_PRODUCTION_ARTICLE_LOCAL_CSS_FORBIDDEN');
  }
  if ((instance.pdsReferences?.tokenReferences || []).some(token => !/^--phi-/.test(token))) {
    fail('CPR_PRODUCTION_NON_PDS_TOKEN_REFERENCE');
  }
  const viewports = (instance.responsiveProjection || []).map(record => record.viewportPx);
  if (JSON.stringify(viewports) !== JSON.stringify([360, 768, 1440])) {
    fail('CPR_PRODUCTION_ACCEPTANCE_VIEWPORTS_INVALID');
  }
  return instance;
}

export function projectCprProductionArticle(instance, { locale, viewportPx }) {
  validateCprProductionInstance(instance);
  if (!SUPPORTED_LOCALES.has(locale)) fail('CPR_PRODUCTION_PROJECTION_LOCALE_INVALID');

  const localeProfile = instance.localeAcceptance.find(record => record.locale === locale);
  if (!localeProfile) fail('CPR_PRODUCTION_PROJECTION_LOCALE_UNDECLARED');

  const responsive = instance.responsiveProjection.find(record => record.viewportPx === viewportPx);
  if (!responsive) fail('CPR_PRODUCTION_PROJECTION_VIEWPORT_UNCONTROLLED');

  const productionProjection = localeProfile.productionProjection;
  const componentOrder = instance.composition
    .filter(component => component.visibility !== 'OMITTED')
    .map(component => component.componentCode);
  const figureProjected = productionProjection === 'READY_FOR_RENDER' && localeProfile.publishedFigureAvailable === true;

  return Object.freeze({
    presentationIdentity: instance.presentationIdentity,
    locale,
    viewportPx,
    responsiveMode: responsive.mode,
    responsiveTemplateAccepted: localeProfile.responsiveTemplateAccepted,
    productionProjection,
    readyForRender: productionProjection === 'READY_FOR_RENDER',
    componentOrder,
    semanticOrderImmutable: responsive.semanticOrderImmutable,
    articleColumns: responsive.articleColumns,
    figureProjected,
    figureBehavior: figureProjected ? responsive.figureBehavior : 'OMITTED_MISSING_LOCALE_AUTHORITY',
    horizontalOverflowAllowed: responsive.horizontalOverflowAllowed,
    articleLocalCss: instance.pdsReferences.articleLocalCss
  });
}
