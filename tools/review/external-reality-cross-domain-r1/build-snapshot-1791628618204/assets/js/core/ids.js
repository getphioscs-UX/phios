function randomPart() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  return Math.random().toString(36).slice(2, 14);
}

export function createRuntimeId(prefix) {
  const date = new Date().toISOString().slice(0,10).replaceAll('-', '');
  return `${prefix}_${date}_${randomPart()}`;
}
