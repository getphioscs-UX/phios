export const PROFESSIONAL_ASSIGNMENT_CONTRACT_VERSION =
  'phi-os.professional-assignment.v1';

export const PROFESSIONAL_ASSIGNMENT_STATUSES = Object.freeze([
  'proposed',
  'active',
  'suspended',
  'closed',
  'revoked'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function isoDate(value, field, optional = false) {
  const text = cleanText(value);
  if (!text && optional) return null;
  const time = Date.parse(text);
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function explicitValues(values, field) {
  const result = [...new Set(
    (Array.isArray(values) ? values : [])
      .map(cleanText)
      .filter(Boolean)
  )];
  if (result.length === 0 || result.includes('*')) {
    throw new TypeError(`${field} requires explicit values.`);
  }
  return Object.freeze(result);
}

export function createProfessionalAssignment(input = {}, options = {}) {
  const status = cleanText(input.status) || 'proposed';
  if (status !== 'proposed') {
    throw new TypeError('A new Professional Assignment must be proposed.');
  }
  const startsAt = isoDate(
    input.starts_at || options.now || new Date().toISOString(),
    'starts_at'
  );
  const endsAt = isoDate(input.ends_at, 'ends_at', true);
  if (endsAt && endsAt <= startsAt) {
    throw new TypeError('Assignment end must be after its start.');
  }
  return Object.freeze({
    contract: PROFESSIONAL_ASSIGNMENT_CONTRACT_VERSION,
    assignment_id: requiredText(input.assignment_id, 'assignment_id'),
    professional_id: requiredText(
      input.professional_id,
      'professional_id'
    ),
    client_id: requiredText(input.client_id, 'client_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    purpose: requiredText(input.purpose, 'purpose'),
    status,
    journey_ids: explicitValues(input.journey_ids, 'journey_ids'),
    resource_scopes: explicitValues(
      input.resource_scopes,
      'resource_scopes'
    ),
    required_capability_codes: explicitValues(
      input.required_capability_codes,
      'required_capability_codes'
    ),
    starts_at: startsAt,
    ends_at: endsAt,
    activated_at: null,
    closed_at: null,
    payment_created_assignment: false,
    entitlement_created_assignment: false
  });
}

export function activateProfessionalAssignment(
  assignment,
  input = {},
  options = {}
) {
  if (
    assignment?.contract !== PROFESSIONAL_ASSIGNMENT_CONTRACT_VERSION ||
    assignment.status !== 'proposed'
  ) {
    throw new TypeError('Only a proposed Assignment can be activated.');
  }
  if (input.explicit_assignment !== true) {
    throw new TypeError('Assignment activation requires an explicit action.');
  }
  if (
    cleanText(input.professional_id) !== assignment.professional_id ||
    cleanText(input.client_id) !== assignment.client_id
  ) {
    throw new TypeError('Assignment activation identities do not match.');
  }
  return Object.freeze({
    ...assignment,
    status: 'active',
    activated_at: isoDate(
      options.now || input.activated_at || new Date().toISOString(),
      'activated_at'
    ),
    activated_by: requiredText(input.activated_by, 'activated_by')
  });
}

export function evaluateProfessionalAssignment(
  assignment,
  request = {},
  options = {}
) {
  const reasons = [];
  const now = isoDate(
    options.now || request.requested_at || new Date().toISOString(),
    'requested_at'
  );
  if (assignment?.contract !== PROFESSIONAL_ASSIGNMENT_CONTRACT_VERSION) {
    reasons.push('assignment_invalid');
  } else {
    if (assignment.status !== 'active') reasons.push('assignment_inactive');
    if (assignment.starts_at > now) reasons.push('assignment_not_started');
    if (assignment.ends_at && assignment.ends_at <= now) {
      reasons.push('assignment_expired');
    }
    for (const field of ['professional_id', 'client_id', 'service_id']) {
      if (cleanText(request[field]) !== assignment[field]) {
        reasons.push(`assignment_${field}_mismatch`);
      }
    }
    if (!assignment.journey_ids.includes(cleanText(request.journey_id))) {
      reasons.push('assignment_journey_denied');
    }
    if (cleanText(request.purpose) !== assignment.purpose) {
      reasons.push('assignment_purpose_denied');
    }
    const requestedScopes = Array.isArray(request.resource_scopes)
      ? request.resource_scopes.map(cleanText).filter(Boolean)
      : [];
    if (
      requestedScopes.length === 0 ||
      requestedScopes.includes('*') ||
      requestedScopes.some(scope =>
        !assignment.resource_scopes.includes(scope)
      )
    ) {
      reasons.push('assignment_scope_denied');
    }
  }
  return Object.freeze({
    valid: reasons.length === 0,
    assignment_id: cleanText(assignment?.assignment_id) || null,
    reasons: Object.freeze(reasons)
  });
}

export default Object.freeze({
  createProfessionalAssignment,
  activateProfessionalAssignment,
  evaluateProfessionalAssignment
});
