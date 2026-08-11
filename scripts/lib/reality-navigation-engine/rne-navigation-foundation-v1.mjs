import crypto from 'node:crypto';

const FORBIDDEN_FIELDS = new Set([
  'rawData',
  'rawReality',
  'rawReadout',
  'payload',
  'command',
  'recommendedDirection',
  'selectedOption',
  'automaticSelection',
  'prediction',
  'professionalJudgment'
]);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, canonicalize(value[key])])
    );
  }
  return value;
}

export function stableDigest(value) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex');
}

function requireObject(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(code);
  }
  return value;
}

function requireText(value, code) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(code);
  }
  return value;
}

function requireDigest(value, code) {
  requireText(value, code);
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(code);
  return value;
}

function requireSemver(value, code) {
  requireText(value, code);
  if (!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(code);
  }
  return value;
}

function uniqueTextArray(value, code, { min = 0 } = {}) {
  if (!Array.isArray(value) || value.length < min) throw new Error(code);
  const out = value.map(item => requireText(item, code));
  if (new Set(out).size !== out.length) throw new Error(`${code}_DUPLICATE`);
  return out;
}

function assertNoForbiddenFields(value, prefix = 'RNE_FORBIDDEN_FIELD') {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_FIELDS.has(key)) throw new Error(`${prefix}:${key}`);
  }
}

function reference(value, code) {
  const ref = requireObject(value, code);
  return {
    code: requireText(ref.code, `${code}_CODE`),
    version: requireSemver(ref.version, `${code}_VERSION`),
    digest: requireDigest(ref.digest, `${code}_DIGEST`)
  };
}

function outputReference(code, version, digest) {
  return { code, version, digest };
}

function redigest(record, digestField) {
  const copy = structuredClone(record);
  delete copy[digestField];
  record[digestField] = stableDigest(copy);
  return record;
}

export function assertRecordDigest(record, digestField) {
  const copy = structuredClone(record);
  const expected = copy[digestField];
  delete copy[digestField];
  if (expected !== stableDigest(copy)) {
    throw new Error(`RNE_DIGEST_MISMATCH:${digestField}`);
  }
  return true;
}

export function buildCurrentPosition(request, contract) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_CURRENT_POSITION_REQUEST_INVALID');
  if (contract?.work !== 'RNE-W1') throw new Error('RNE_CURRENT_POSITION_CONTRACT_INVALID');

  const positionCode = requireText(request.positionCode, 'RNE_CURRENT_POSITION_CODE_REQUIRED');
  const realityReference = reference(request.realityReference, 'RNE_REALITY_REFERENCE_INVALID');

  const readout = requireObject(request.readoutViewReference, 'RNE_READOUT_VIEW_REFERENCE_INVALID');
  const readoutViewReference = {
    ...reference(readout, 'RNE_READOUT_VIEW_REFERENCE_INVALID'),
    mode: requireText(readout.mode, 'RNE_READOUT_VIEW_MODE_REQUIRED')
  };
  if (readoutViewReference.mode !== contract.rules.readoutReferenceMode) {
    throw new Error('RNE_READOUT_VIEW_MODE_INVALID');
  }

  const constraintReferences = uniqueTextArray(
    request.constraintReferences,
    'RNE_CONSTRAINT_REFERENCES_INVALID',
    { min: 1 }
  );
  const unknownReferences = uniqueTextArray(
    request.unknownReferences ?? [],
    'RNE_UNKNOWN_REFERENCES_INVALID'
  );
  const governanceReferences = uniqueTextArray(
    request.governanceReferences,
    'RNE_GOVERNANCE_REFERENCES_INVALID',
    { min: 1 }
  );

  const record = {
    schemaVersion: 'PHI-OS-RNE-CURRENT-POSITION-v1.0.0',
    positionCode,
    positionVersion: '1.0.0',
    objectType: 'CURRENT_POSITION',
    dataType: 'NAVIGATION_RECORD',
    realityReference,
    readoutViewReference,
    constraintReferences,
    unknownReferences,
    governanceReferences,
    authorityBoundary: {
      realityModelAuthority: 'RMO',
      readoutAuthority: 'RRE',
      navigationAuthority: 'RNE',
      journeyWorkflowAuthority: 'JR',
      professionalJudgmentAuthority: 'PR',
      dataGovernanceAuthority: 'RDG'
    },
    validationOnly: true,
    persistentStoreWriteAllowed: false,
    productionExecutionAllowed: false
  };
  return redigest(record, 'positionDigest');
}

export function buildTargetState(currentPosition, request, targetSourceRegistry, contract) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_TARGET_REQUEST_INVALID');
  assertRecordDigest(currentPosition, 'positionDigest');
  if (contract?.work !== 'RNE-W2') throw new Error('RNE_TARGET_CONTRACT_INVALID');

  const source = requireObject(request.source, 'RNE_TARGET_SOURCE_REQUIRED');
  const sourceType = requireText(source.sourceType, 'RNE_TARGET_SOURCE_TYPE_REQUIRED');
  const sourceEntry = targetSourceRegistry?.targetSources?.find(entry => entry.sourceType === sourceType);
  if (!sourceEntry) throw new Error(`RNE_TARGET_SOURCE_UNAUTHORIZED:${sourceType}`);
  if (sourceEntry.rneMayInvent !== false) throw new Error('RNE_TARGET_SOURCE_REGISTRY_UNSAFE');

  const sourceReference = requireText(source.sourceReference, 'RNE_TARGET_SOURCE_REFERENCE_REQUIRED');
  const sourceAuthorityReference = requireText(
    source.sourceAuthorityReference,
    'RNE_TARGET_SOURCE_AUTHORITY_REFERENCE_REQUIRED'
  );
  if (sourceType === 'PROFESSIONAL' && sourceAuthorityReference === 'CUSTOMER_SELF_DECLARED') {
    throw new Error('RNE_TARGET_PROFESSIONAL_AUTHORITY_INVALID');
  }
  if (sourceType === 'AUTHORIZED_SERVICE' && sourceAuthorityReference === 'CUSTOMER_SELF_DECLARED') {
    throw new Error('RNE_TARGET_SERVICE_AUTHORITY_INVALID');
  }

  const targetStatement = requireText(request.targetStatement, 'RNE_TARGET_STATEMENT_REQUIRED');
  const targetCriteria = uniqueTextArray(
    request.targetCriteria,
    'RNE_TARGET_CRITERIA_INVALID',
    { min: 1 }
  );

  const record = {
    schemaVersion: 'PHI-OS-RNE-TARGET-STATE-v1.0.0',
    targetCode: requireText(request.targetCode, 'RNE_TARGET_CODE_REQUIRED'),
    targetVersion: '1.0.0',
    objectType: 'TARGET_STATE',
    dataType: 'NAVIGATION_RECORD',
    currentPositionReference: outputReference(
      currentPosition.positionCode,
      currentPosition.positionVersion,
      currentPosition.positionDigest
    ),
    source: {
      sourceType,
      sourceReference,
      sourceAuthorityReference
    },
    targetStatement,
    targetCriteria,
    authorityBoundary: {
      targetSourceAuthority: sourceType,
      navigationAuthority: 'RNE',
      professionalJudgmentAuthority: 'PR'
    },
    targetInventedByRne: false,
    predictionCreated: false,
    guaranteedOutcomeCreated: false,
    validationOnly: true,
    persistentStoreWriteAllowed: false
  };
  return redigest(record, 'targetDigest');
}

function assertAcyclic(nodes) {
  const byConstraint = new Map(nodes.map(node => [node.authorityConstraintReference, node]));
  const visiting = new Set();
  const visited = new Set();

  function visit(ref) {
    if (visiting.has(ref)) throw new Error(`RNE_CONSTRAINT_GRAPH_CYCLE:${ref}`);
    if (visited.has(ref)) return;
    visiting.add(ref);
    const node = byConstraint.get(ref);
    for (const dep of node.dependsOnConstraintReferences) visit(dep);
    visiting.delete(ref);
    visited.add(ref);
  }

  for (const ref of byConstraint.keys()) visit(ref);
}

export function buildNavigationConstraintGraph(
  currentPosition,
  targetState,
  request,
  roleRegistry,
  contract
) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_CONSTRAINT_GRAPH_REQUEST_INVALID');
  assertRecordDigest(currentPosition, 'positionDigest');
  assertRecordDigest(targetState, 'targetDigest');
  if (contract?.work !== 'RNE-W3') throw new Error('RNE_CONSTRAINT_GRAPH_CONTRACT_INVALID');

  const allowedRoles = new Set((roleRegistry?.roles ?? []).map(entry => entry.role));
  const allowedConstraints = new Set(currentPosition.constraintReferences);
  const rawNodes = request.nodes;
  if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
    throw new Error('RNE_CONSTRAINT_GRAPH_NODES_REQUIRED');
  }

  const seenNodeCodes = new Set();
  const seenConstraintRefs = new Set();
  const nodes = rawNodes.map(raw => {
    const node = requireObject(raw, 'RNE_CONSTRAINT_GRAPH_NODE_INVALID');
    const nodeCode = requireText(node.nodeCode, 'RNE_CONSTRAINT_GRAPH_NODE_CODE_REQUIRED');
    if (seenNodeCodes.has(nodeCode)) throw new Error(`RNE_CONSTRAINT_GRAPH_NODE_DUPLICATE:${nodeCode}`);
    seenNodeCodes.add(nodeCode);

    const authorityConstraintReference = requireText(
      node.authorityConstraintReference,
      'RNE_CONSTRAINT_GRAPH_AUTHORITY_REFERENCE_REQUIRED'
    );
    if (!allowedConstraints.has(authorityConstraintReference)) {
      throw new Error(`RNE_CONSTRAINT_GRAPH_UNKNOWN_CURRENT_CONSTRAINT:${authorityConstraintReference}`);
    }
    if (seenConstraintRefs.has(authorityConstraintReference)) {
      throw new Error(`RNE_CONSTRAINT_GRAPH_CONSTRAINT_DUPLICATE:${authorityConstraintReference}`);
    }
    seenConstraintRefs.add(authorityConstraintReference);

    const navigationRole = requireText(node.navigationRole, 'RNE_CONSTRAINT_GRAPH_ROLE_REQUIRED');
    if (!allowedRoles.has(navigationRole)) throw new Error(`RNE_CONSTRAINT_GRAPH_ROLE_INVALID:${navigationRole}`);

    const appliesTo = requireText(node.appliesTo, 'RNE_CONSTRAINT_GRAPH_APPLIES_TO_REQUIRED');
    if (!['CURRENT', 'TARGET', 'TRANSITION'].includes(appliesTo)) {
      throw new Error(`RNE_CONSTRAINT_GRAPH_APPLIES_TO_INVALID:${appliesTo}`);
    }
    const blockingClass = requireText(node.blockingClass, 'RNE_CONSTRAINT_GRAPH_BLOCKING_CLASS_REQUIRED');
    if (!['BLOCKING', 'NON_BLOCKING', 'UNKNOWN'].includes(blockingClass)) {
      throw new Error(`RNE_CONSTRAINT_GRAPH_BLOCKING_CLASS_INVALID:${blockingClass}`);
    }

    const dependsOnConstraintReferences = uniqueTextArray(
      node.dependsOnConstraintReferences ?? [],
      'RNE_CONSTRAINT_GRAPH_DEPENDENCY_INVALID'
    );
    if (dependsOnConstraintReferences.includes(authorityConstraintReference)) {
      throw new Error(`RNE_CONSTRAINT_GRAPH_SELF_DEPENDENCY:${authorityConstraintReference}`);
    }

    return {
      nodeCode,
      authorityConstraintReference,
      navigationRole,
      appliesTo,
      blockingClass,
      dependsOnConstraintReferences
    };
  });

  const graphRefs = new Set(nodes.map(node => node.authorityConstraintReference));
  for (const node of nodes) {
    for (const dep of node.dependsOnConstraintReferences) {
      if (!graphRefs.has(dep)) throw new Error(`RNE_CONSTRAINT_GRAPH_DEPENDENCY_UNKNOWN:${dep}`);
    }
  }
  assertAcyclic(nodes);

  const record = {
    schemaVersion: 'PHI-OS-RNE-NAVIGATION-CONSTRAINT-GRAPH-v1.0.0',
    graphCode: requireText(request.graphCode, 'RNE_CONSTRAINT_GRAPH_CODE_REQUIRED'),
    graphVersion: '1.0.0',
    objectType: 'NAVIGATION_CONSTRAINT_GRAPH',
    dataType: 'NAVIGATION_RECORD',
    currentPositionReference: outputReference(
      currentPosition.positionCode,
      currentPosition.positionVersion,
      currentPosition.positionDigest
    ),
    targetReference: outputReference(
      targetState.targetCode,
      targetState.targetVersion,
      targetState.targetDigest
    ),
    nodes,
    edgeCount: nodes.reduce((sum, node) => sum + node.dependsOnConstraintReferences.length, 0),
    unknownConstraintReferences: nodes
      .filter(node => node.navigationRole === 'UNKNOWN_LIMIT' || node.blockingClass === 'UNKNOWN')
      .map(node => node.authorityConstraintReference),
    authorityBoundary: {
      constraintTruthAuthority: 'RMO',
      constraintNavigationRoleAuthority: 'RNE',
      professionalJudgmentAuthority: 'PR'
    },
    realityConstraintCreated: false,
    professionalJudgmentCreated: false,
    validationOnly: true,
    persistentStoreWriteAllowed: false
  };
  return redigest(record, 'graphDigest');
}

export function generateBoundedOptionSet(
  currentPosition,
  targetState,
  constraintGraph,
  request,
  optionRegistry,
  contract
) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_OPTION_SET_REQUEST_INVALID');
  assertRecordDigest(currentPosition, 'positionDigest');
  assertRecordDigest(targetState, 'targetDigest');
  assertRecordDigest(constraintGraph, 'graphDigest');
  if (contract?.work !== 'RNE-W4') throw new Error('RNE_OPTION_SET_CONTRACT_INVALID');

  const optionSetCode = requireText(request.optionSetCode, 'RNE_OPTION_SET_CODE_REQUIRED');
  const registryEntries = optionRegistry?.optionClasses ?? [];
  const byClass = new Map(registryEntries.map(entry => [entry.optionClass, entry]));
  const graphByRole = new Map();
  for (const node of constraintGraph.nodes) {
    if (!graphByRole.has(node.navigationRole)) graphByRole.set(node.navigationRole, []);
    graphByRole.get(node.navigationRole).push(node.authorityConstraintReference);
  }

  const classes = ['OBSERVE', 'CLARIFY'];
  if ((graphByRole.get('DEPENDENCY') ?? []).length) classes.push('VERIFY');
  if ((graphByRole.get('HARD_BOUNDARY') ?? []).length) classes.push('REPOSITION');
  if ((graphByRole.get('SOFT_LIMIT') ?? []).length) classes.push('RECONFIGURE');

  const allConstraintReferences = constraintGraph.nodes.map(node => node.authorityConstraintReference);
  const unknownReferences = constraintGraph.unknownConstraintReferences;

  const options = classes.map(optionClass => {
    const entry = byClass.get(optionClass);
    if (!entry) throw new Error(`RNE_OPTION_CLASS_REGISTRY_MISSING:${optionClass}`);

    let triggerReferences = [];
    let constraintReferences = [];
    if (optionClass === 'OBSERVE') {
      constraintReferences = allConstraintReferences;
    } else if (optionClass === 'CLARIFY') {
      triggerReferences = unknownReferences;
      constraintReferences = unknownReferences;
    } else if (optionClass === 'VERIFY') {
      triggerReferences = graphByRole.get('DEPENDENCY') ?? [];
      constraintReferences = triggerReferences;
    } else if (optionClass === 'REPOSITION') {
      triggerReferences = graphByRole.get('HARD_BOUNDARY') ?? [];
      constraintReferences = triggerReferences;
    } else if (optionClass === 'RECONFIGURE') {
      triggerReferences = graphByRole.get('SOFT_LIMIT') ?? [];
      constraintReferences = triggerReferences;
    }

    return {
      optionCode: `${optionSetCode}-${optionClass}`,
      optionClass,
      boundaryMode: entry.boundaryMode,
      currentPositionReference: currentPosition.positionCode,
      targetReference: targetState.targetCode,
      constraintReferences,
      triggerReferences,
      selectionState: 'AVAILABLE_NOT_SELECTED',
      commandCreated: false,
      executionCreated: false,
      predictionCreated: false,
      professionalJudgmentCreated: false
    };
  });

  if (options.length < Number(contract.rules.minimumBoundedOptions ?? 2)) {
    throw new Error('RNE_OPTION_SET_MINIMUM_NOT_MET');
  }

  const record = {
    schemaVersion: 'PHI-OS-RNE-BOUNDED-OPTION-SET-v1.0.0',
    optionSetCode,
    optionSetVersion: '1.0.0',
    objectType: 'BOUNDED_OPTION_SET',
    dataType: 'NAVIGATION_RECORD',
    currentPositionReference: outputReference(
      currentPosition.positionCode,
      currentPosition.positionVersion,
      currentPosition.positionDigest
    ),
    targetReference: outputReference(
      targetState.targetCode,
      targetState.targetVersion,
      targetState.targetDigest
    ),
    constraintGraphReference: outputReference(
      constraintGraph.graphCode,
      constraintGraph.graphVersion,
      constraintGraph.graphDigest
    ),
    generationModel: 'DETERMINISTIC_RULE_FIRST',
    options,
    selectionMade: false,
    rankingCreated: false,
    recommendedDirectionCreated: false,
    commandCreated: false,
    executionCreated: false,
    riskAssessmentCreated: false,
    recoverabilityAssessmentCreated: false,
    scenarioPredictionCreated: false,
    professionalJudgmentCreated: false,
    validationOnly: true,
    persistentStoreWriteAllowed: false
  };
  return redigest(record, 'optionSetDigest');
}
