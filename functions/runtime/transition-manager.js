import {
  executeRuntimeTransition,
  getRuntimeTransitionExecution,
  validateRuntimeTransitionExecution
} from '../../modules/runtime-transition-engine.js';
import { emitRuntimeEvent } from './event-bus.js';

export function executeTransition(continuity, options = {}) {
  const readiness = validateRuntimeTransitionExecution(continuity);
  emitRuntimeEvent('transition.requested', { continuity, readiness });
  if (!readiness.ready) return { executed: false, readiness, execution: null };
  const execution = executeRuntimeTransition(continuity, options);
  emitRuntimeEvent('transition.executed', { execution, continuity });
  return { executed: true, readiness, execution };
}

export const RuntimeTransitionManager = Object.freeze({
  validate: validateRuntimeTransitionExecution,
  execute: executeTransition,
  current: getRuntimeTransitionExecution
});
