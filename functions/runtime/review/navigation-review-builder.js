/** Build a Review Contract only from a valid, explicitly prepared Navigation state. */
import {
  createReviewContract,
  validateReviewContract
} from './review-contract.js';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function availablePaths(source = {}) {
  return Array.isArray(source?.navigation?.availablePaths)
    ? source.navigation.availablePaths
    : [];
}

export function validateNavigationForReview(source = {}) {
  const errors = [];
  if (!isObject(source)) return { valid: false, errors: ['Navigation source must be an object.'] };
  if (!cleanText(source.runtimeEntityId)) errors.push('runtimeEntityId is required.');
  if (!cleanText(source.runtimeEntryId)) errors.push('runtimeEntryId is required.');

  const selected = source?.navigation?.selectedPath;
  const selectedId = cleanText(selected?.id);
  const exists = selectedId && availablePaths(source).some(path => cleanText(path?.id) === selectedId);
  if (!exists) errors.push('A valid selected Navigation path is required.');
  if (cleanText(selected?.selectionSource) !== 'user_choice') errors.push('The selected path must come from explicit user choice.');

  const reviewGate = source?.navigationState?.reviewGate;
  if (reviewGate?.ready !== true) errors.push('Navigation Review gate is not ready.');
  if (!cleanText(reviewGate?.preparedAt)) errors.push('Navigation must be explicitly prepared for Review.');

  const professional = cleanText(selected?.pathType) === 'professional_review';
  if (professional && source?.navigationState?.professionalConsent?.accepted !== true) {
    errors.push('Professional boundary consent is required.');
  }

  return { valid: errors.length === 0, errors };
}

export function buildReviewContractFromNavigation(source = {}) {
  const sourceValidation = validateNavigationForReview(source);
  if (!sourceValidation.valid) {
    throw new Error(`Navigation → Review handoff invalid: ${sourceValidation.errors.join(' ')}`);
  }

  const contract = createReviewContract(source);
  const validation = validateReviewContract(contract);
  if (!validation.valid) {
    throw new Error(`Review Contract invalid: ${validation.errors.join(' ')}`);
  }
  return contract;
}

export default buildReviewContractFromNavigation;
