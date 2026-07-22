const listeners = new Map();

function normalizeEventName(name = '') {
  return typeof name === 'string' ? name.trim() : '';
}

export function onRuntimeEvent(name, handler) {
  const eventName = normalizeEventName(name);
  if (!eventName || typeof handler !== 'function') return () => {};
  const handlers = listeners.get(eventName) || new Set();
  handlers.add(handler);
  listeners.set(eventName, handlers);
  return () => offRuntimeEvent(eventName, handler);
}

export function onceRuntimeEvent(name, handler) {
  if (typeof handler !== 'function') return () => {};
  let unsubscribe = () => {};
  unsubscribe = onRuntimeEvent(name, payload => {
    unsubscribe();
    handler(payload);
  });
  return unsubscribe;
}

export function offRuntimeEvent(name, handler) {
  const eventName = normalizeEventName(name);
  const handlers = listeners.get(eventName);
  if (!handlers) return;
  handlers.delete(handler);
  if (!handlers.size) listeners.delete(eventName);
}

export function emitRuntimeEvent(name, detail = {}) {
  const eventName = normalizeEventName(name);
  if (!eventName) return { eventName: '', delivered: 0 };
  const payload = Object.freeze({
    eventName,
    occurredAt: new Date().toISOString(),
    detail
  });
  const handlers = [...(listeners.get(eventName) || []), ...(listeners.get('*') || [])];
  handlers.forEach(handler => {
    try { handler(payload); } catch (error) { console.error(`[PHI OS Runtime Event] ${eventName}`, error); }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`phios:${eventName}`, { detail: payload }));
  }
  return { eventName, delivered: handlers.length, payload };
}

export function clearRuntimeEventListeners(name = '') {
  const eventName = normalizeEventName(name);
  if (eventName) listeners.delete(eventName);
  else listeners.clear();
}

export const RuntimeEventBus = Object.freeze({
  on: onRuntimeEvent,
  once: onceRuntimeEvent,
  off: offRuntimeEvent,
  emit: emitRuntimeEvent,
  clear: clearRuntimeEventListeners
});
