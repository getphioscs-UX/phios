export const WAVE_BINDING_CONTRACT = 'PHI-OS-PJA-R4D-WAVE-BINDING-v1.0.0';

export function resolveWaveNodes(repository, wave) {
  const nodeCodes = wave.nodeCodes || wave.nodes?.map(value => value.nodeCode || value) || [];
  const records = nodeCodes.map(code => repository.resolveNode(code));
  if (records.some(record => !record)) throw new Error('Wave contains an unregistered Canonical Node.');
  return Object.freeze({
    contract: WAVE_BINDING_CONTRACT,
    waveCode: wave.waveCode,
    optionalBookScope: wave.bookCode || null,
    bookScopeAuthority: false,
    records,
    publicationBooks: [...new Set(records.map(record => record.publicationContext.publicationBookCode))],
    crossBook: new Set(records.map(record => record.publicationContext.publicationBookCode)).size > 1
  });
}
