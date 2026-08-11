import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
export const sha256 = source => crypto.createHash('sha256').update(source, 'utf8').digest('hex');

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

export const stableDigest = value => sha256(JSON.stringify(stable(value)));

export function loadOrcContracts(root = process.cwd()) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const base = 'content/runtime/cross-runtime-orchestration';
  return {
    authority: read(`${base}/contracts/orc-authority-boundary-v2.json`),
    machine: read(`${base}/registries/orc-canonical-state-machine-v2.json`),
    events: read(`${base}/registries/orc-event-registry-v2.json`),
    dependencies: read(`${base}/contracts/orc-dependency-enforcement-v2.json`),
    failures: read(`${base}/contracts/orc-failure-contract-v2.json`),
    recovery: read(`${base}/contracts/orc-recovery-contract-v2.json`),
    idempotency: read(`${base}/contracts/orc-idempotency-contract-v2.json`),
    atomicity: read(`${base}/contracts/orc-atomic-transition-contract-v2.json`),
    audit: read(`${base}/contracts/orc-audit-timeline-contract-v2.json`),
    replay: read(`${base}/contracts/orc-operational-replay-contract-v2.json`)
  };
}

export function createCase({caseId, serviceProfile}, contracts = loadOrcContracts()) {
  const profile = contracts.machine.serviceProfiles.find(item => item.profileCode === serviceProfile);
  if (!profile) throw new Error(`ORC_SERVICE_PROFILE_UNKNOWN:${serviceProfile}`);
  return {
    caseId,
    serviceProfile,
    governedPath: [...profile.governedStatePath],
    currentState: null,
    committedStates: [],
    observedEvents: [],
    auditTimeline: [],
    operationRecords: [],
    idempotencyLedger: new Map(),
    externalSideEffectsExecuted: 0
  };
}

function expectedNextState(ctx) {
  return ctx.governedPath[ctx.committedStates.length] ?? null;
}

function dependencyRuleApplies(rule, ctx) {
  if (rule.conditional === 'PROFILE_REQUIRES_PROFESSIONAL_DECISION') {
    return ctx.governedPath.includes('PROFESSIONAL_DECISION');
  }
  return true;
}

export function checkDependencies(ctx, targetState, contracts = loadOrcContracts()) {
  const failures = [];
  for (const rule of contracts.dependencies.rules.filter(item => item.targetState === targetState)) {
    if (!dependencyRuleApplies(rule, ctx)) continue;
    for (const state of rule.requiresCommittedStates ?? []) {
      if (!ctx.committedStates.includes(state)) failures.push(`${rule.ruleCode}:STATE:${state}`);
    }
    for (const eventCode of rule.requiresEvents ?? []) {
      if (!ctx.observedEvents.some(item => item.eventCode === eventCode)) failures.push(`${rule.ruleCode}:EVENT:${eventCode}`);
    }
  }
  return failures;
}

function eventDefinition(event, contracts) {
  const def = contracts.events.events.find(item => item.eventCode === event.eventCode);
  if (!def) throw new Error(`ORC_EVENT_UNKNOWN:${event.eventCode}`);
  if (def.authorityRuntime !== event.authorityRuntime) {
    throw new Error(`ORC_EVENT_AUTHORITY_MISMATCH:${event.eventCode}:${event.authorityRuntime}`);
  }
  if (!event.authorityReference) throw new Error(`ORC_EVENT_AUTHORITY_REFERENCE_REQUIRED:${event.eventCode}`);
  return def;
}

export function idempotencyKey({caseId, operationClass, operationCode, authorityReference, requestIdentity}) {
  return sha256([caseId, operationClass, operationCode, authorityReference, requestIdentity].join('|'));
}

export function claimOperation(ctx, {
  operationClass, operationCode, authorityReference, requestIdentity, status = 'COMMITTED'
}) {
  const key = idempotencyKey({
    caseId: ctx.caseId, operationClass, operationCode, authorityReference, requestIdentity
  });
  const existing = ctx.idempotencyLedger.get(key);
  if (existing) return {...existing, status: 'REPLAYED_NO_DUPLICATE', replayed: true};

  const record = {
    operationId: `ORC-OP-${key.slice(0, 20)}`,
    caseId: ctx.caseId,
    operationClass,
    operationCode,
    idempotencyKey: key,
    status,
    domainAuthorityReference: authorityReference,
    orchestrationOnly: true,
    replayed: false
  };
  ctx.idempotencyLedger.set(key, record);
  ctx.operationRecords.push(record);
  return record;
}

export function applyEvent(ctx, event, {contracts = loadOrcContracts(), replay = false} = {}) {
  const before = {
    currentState: ctx.currentState,
    committedCount: ctx.committedStates.length,
    timelineCount: ctx.auditTimeline.length,
    operationCount: ctx.operationRecords.length,
    ledgerCount: ctx.idempotencyLedger.size
  };

  try {
    const def = eventDefinition(event, contracts);

    const observedKey = idempotencyKey({
      caseId: ctx.caseId,
      operationClass: 'STATE_TRANSITION',
      operationCode: event.eventCode,
      authorityReference: event.authorityReference,
      requestIdentity: event.requestIdentity
    });
    const existingObserved = ctx.idempotencyLedger.get(observedKey);
    if (existingObserved) {
      return {status: 'REPLAYED_NO_DUPLICATE', state: ctx.currentState, duplicate: true};
    }

    // Non-transition prerequisite events are recorded as orchestration operations only.
    if (!def.commitsState) {
      const op = claimOperation(ctx, {
        operationClass: 'STATE_TRANSITION',
        operationCode: event.eventCode,
        authorityReference: event.authorityReference,
        requestIdentity: event.requestIdentity
      });
      ctx.observedEvents.push({
        eventCode: event.eventCode,
        eventId: event.eventId,
        authorityRuntime: event.authorityRuntime,
        authorityReference: event.authorityReference
      });
      return {status: op.status, state: ctx.currentState, prerequisiteOnly: true};
    }

    const expected = expectedNextState(ctx);
    if (def.commitsState !== expected) {
      throw new Error(`ORC_STATE_ORDER_BLOCKED:EXPECTED:${expected}:GOT:${def.commitsState}`);
    }
    const dependencyFailures = checkDependencies(ctx, def.commitsState, contracts);
    if (dependencyFailures.length) {
      throw new Error(`ORC_DEPENDENCY_BLOCKED:${dependencyFailures.join(',')}`);
    }

    // Prepare the complete atomic commit set before mutating ctx.
    const operationDigest = stableDigest({
      caseId: ctx.caseId,
      profile: ctx.serviceProfile,
      fromState: ctx.currentState,
      toState: def.commitsState,
      eventCode: event.eventCode,
      authorityReference: event.authorityReference,
      requestIdentity: event.requestIdentity
    });
    const transition = {
      transitionId: `ORC-TR-${operationDigest.slice(0, 20)}`,
      caseId: ctx.caseId,
      serviceProfile: ctx.serviceProfile,
      fromState: ctx.currentState,
      toState: def.commitsState,
      eventCode: event.eventCode,
      authorityReference: event.authorityReference,
      operationDigest,
      committedAtOrdinal: ctx.auditTimeline.length,
      replay
    };
    const op = {
      operationId: `ORC-OP-${observedKey.slice(0, 20)}`,
      caseId: ctx.caseId,
      operationClass: 'STATE_TRANSITION',
      operationCode: event.eventCode,
      idempotencyKey: observedKey,
      status: 'COMMITTED',
      domainAuthorityReference: event.authorityReference,
      orchestrationOnly: true,
      replayed: replay
    };

    // Atomic commit.
    ctx.committedStates.push(def.commitsState);
    ctx.currentState = def.commitsState;
    ctx.auditTimeline.push(transition);
    ctx.idempotencyLedger.set(observedKey, op);
    ctx.operationRecords.push(op);
    ctx.observedEvents.push({
      eventCode: event.eventCode,
      eventId: event.eventId,
      authorityRuntime: event.authorityRuntime,
      authorityReference: event.authorityReference
    });

    // External effects are never executed by ORC. Replay reinforces the same rule.
    if (event.externalSideEffect === true) {
      ctx.externalSideEffectsExecuted += 0;
    }

    return {status: 'COMMITTED', state: ctx.currentState, transition};
  } catch (error) {
    const after = {
      currentState: ctx.currentState,
      committedCount: ctx.committedStates.length,
      timelineCount: ctx.auditTimeline.length,
      operationCount: ctx.operationRecords.length,
      ledgerCount: ctx.idempotencyLedger.size
    };
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error(`ORC_ATOMICITY_VIOLATION:${error.message}`);
    }
    throw error;
  }
}

export function recoverFromLastCommitted(ctx) {
  return {
    recoveryAnchor: 'LAST_COMMITTED_CANONICAL_STATE',
    state: ctx.committedStates.at(-1) ?? null,
    committedTransitionCount: ctx.auditTimeline.length,
    guessed: false
  };
}

export function replayCase({caseId, serviceProfile, events}, contracts = loadOrcContracts()) {
  const ctx = createCase({caseId, serviceProfile}, contracts);
  for (const event of events) applyEvent(ctx, event, {contracts, replay: true});
  const canonicalTimeline = ctx.auditTimeline.map(({replay, ...entry}) => entry);
  return {
    ctx,
    finalState: ctx.currentState,
    determinismDigest: stableDigest(canonicalTimeline),
    externalSideEffectsExecuted: ctx.externalSideEffectsExecuted
  };
}
