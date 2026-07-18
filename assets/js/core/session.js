export const SESSION_KEYS = Object.freeze({
  initialMessage: 'phiOSInitialMessage',
  entryState: 'phiOSEntryState',
  runtimeEntity: 'phiOSRuntimeEntity',
  runtimeEntry: 'phiOSRuntimeEntry',
  reconstruction: 'phiOSRealityReconstruction',
  reconstructionInquiry: 'phiOSReconstructionInquiry',
  readingInput: 'phiOSRealityReadingInput',
  reading: 'phiOSRealityReading',
  navigationInput: 'phiOSNavigationInput',
  navigation: 'phiOSRealityNavigation'
});

export function setSessionJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function getSessionJson(key) {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
