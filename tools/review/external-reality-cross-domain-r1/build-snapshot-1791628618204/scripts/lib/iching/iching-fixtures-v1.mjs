export const entropyDigest='0123456789abcdef'.repeat(4);

export function evidence({
  inputMode='MANUAL_LINES',
  selectedSymbols=['7','7','7','7','7','7'],
  sessionId='ICH-SESSION-001',
  projectionVersion='1.0.0'
}={}) {
  const system=inputMode === 'SYSTEM_RANDOM';
  return {
    schemaVersion:'PHI-OS-SYMBOLIC-METHOD-EVIDENCE-v1.0.0',
    methodId:'I_CHING',
    sessionId,
    inputMode,
    selectionMode:system?'SYSTEM_RANDOM':'MANUAL_SELECTION',
    selectionEvidence:{
      selectionOrder:[1,2,3,4,5,6],
      selectedSymbols:[...selectedSymbols],
      runtimeVersion:'1.0.0',
      aiSelected:false,
      ...(system?{
        seed:'ICH-REPLAY-SEED-0001',
        entropyEvidence:{source:'PERSISTED_SYSTEM_ENTROPY',digest:entropyDigest},
        replayToken:'ICH-REPLAY-TOKEN-0001'
      }: {})
    },
    timestamp:'2026-08-23T00:00:00Z',
    runtimeVersion:'1.0.0',
    projectionVersion
  };
}

export function manualLines(lines, opts={}) {
  return evidence({...opts,inputMode:'MANUAL_LINES',selectedSymbols:lines.map(String)});
}

export function coinLines(coins, opts={}) {
  return evidence({...opts,inputMode:'COIN_CAST',selectedSymbols:coins.map(x=>x.join(','))});
}
