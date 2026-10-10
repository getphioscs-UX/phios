const LENS_CODES = Object.freeze(['AST','BZR','ZI_WEI','NUM','HDR_INTERNAL']);
const MANUAL_CODES = Object.freeze(['PHS','DREAM_RAVE','VARIABLES']);
const ALLOWED_ORIGINS = new Set(['DETERMINISTIC_RUNTIME','GOVERNED_RUNTIME','PROFESSIONAL_MANUAL_INPUT']);

const text = value => typeof value === 'string' ? value.trim() : '';
const list = value => Array.isArray(value) ? value : [];

export function buildProfessionalLensWorkspace(input = {}) {
  const authorised = input.authorized === true;
  const source = input.lenses && typeof input.lenses === 'object' ? input.lenses : {};
  const lenses = LENS_CODES.map(lensCode => {
    const record = source[lensCode] && typeof source[lensCode] === 'object' ? source[lensCode] : null;
    if (!authorised || !record) return { lensCode, state: 'NOT_SUPPLIED', results: [] };
    const results = list(record.results).filter(item => item && typeof item === 'object').map(item => ({
      capability: text(item.capability) || 'UNSPECIFIED',
      origin: text(item.origin),
      sourceArtifactId: text(item.sourceArtifactId),
      sourceSchemaVersion: text(item.sourceSchemaVersion),
      summary: text(item.summary),
      payloadRef: text(item.payloadRef)
    })).filter(item => ALLOWED_ORIGINS.has(item.origin) && item.sourceArtifactId && item.sourceSchemaVersion);
    return { lensCode, state: results.length ? 'AVAILABLE' : 'NOT_SUPPLIED', results };
  });
  return {
    schemaVersion: 'PHI-OS-STAGE17-PROFESSIONAL-LENS-WORKSPACE-PROJECTION-v1.0.0',
    authorized: authorised,
    lenses,
    boundaries: {
      workspaceCalculates: false,
      modelMayCalculate: false,
      methodVotingAllowed: false,
      crossMethodMutationAllowed: false,
      hdrInternalPublicProjectionAllowed: false
    }
  };
}

export function createManualProfessionalInput(input = {}, { now = new Date().toISOString() } = {}) {
  const extensionCode = text(input.extensionCode).toUpperCase();
  if (!MANUAL_CODES.includes(extensionCode)) throw new Error('STAGE17_MANUAL_EXTENSION_NOT_ALLOWED');
  if (text(input.sourceType) !== 'PROFESSIONAL_MANUAL_INPUT') throw new Error('STAGE17_MANUAL_SOURCE_TYPE_INVALID');
  const enteredBy = text(input.enteredBy);
  const sourceRef = text(input.sourceRef);
  const professionalScope = text(input.professionalScope);
  const value = text(input.value);
  if (!enteredBy || !sourceRef || !professionalScope || !value) throw new Error('STAGE17_MANUAL_INPUT_REQUIRED_FIELD_MISSING');
  const enteredAt = text(input.enteredAt) || now;
  if (Number.isNaN(Date.parse(enteredAt))) throw new Error('STAGE17_MANUAL_ENTERED_AT_INVALID');
  return {
    schemaVersion: 'PHI-OS-STAGE17-MANUAL-PROFESSIONAL-INPUT-v1.0.0',
    extensionCode,
    enteredBy,
    enteredAt: new Date(enteredAt).toISOString(),
    sourceType: 'PROFESSIONAL_MANUAL_INPUT',
    sourceRef,
    professionalScope,
    value,
    informationClass: 'PROFESSIONAL_DECLARED_CONTEXT',
    calculationFact: false,
    realityEvidence: false,
    persisted: false,
    authority: {
      calculationAuthorityClaimed: false,
      professionalDeclaredContext: true
    }
  };
}
