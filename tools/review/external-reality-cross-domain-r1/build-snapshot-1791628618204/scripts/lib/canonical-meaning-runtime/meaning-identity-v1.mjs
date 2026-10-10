import crypto from 'node:crypto';

const sortValue = value => {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, sortValue(value[key])])
  );
  return value;
};

export const canonicalJson = value => JSON.stringify(sortValue(value));
export const digestCanonical = value => crypto.createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');

export const buildMeaningHashes = meaning => ({
  semanticHash: digestCanonical({
    meaningFamily: meaning.meaningFamily,
    meaningDimensions: meaning.meaningDimensions,
    boundaries: meaning.boundaries
  }),
  knowledgeHash: digestCanonical(meaning.knowledgeReferences),
  mappingHash: digestCanonical({
    sourceProjection: meaning.sourceProjection,
    mappingLineage: meaning.mappingLineage
  })
});

export const buildMeaningCanonicalDigest = identity => digestCanonical({
  meaningIdentityVersion: identity.meaningIdentityVersion,
  meaningId: identity.meaningId,
  meaningCode: identity.meaningCode,
  meaningVersion: identity.meaningVersion,
  semanticHash: identity.semanticHash,
  knowledgeHash: identity.knowledgeHash,
  mappingHash: identity.mappingHash
});

export const compareMeaningIdentity = (previous, next) => {
  const semanticChanged = previous.semanticHash !== next.semanticHash;
  const knowledgeChanged = previous.knowledgeHash !== next.knowledgeHash;
  const mappingChanged = previous.mappingHash !== next.mappingHash;
  return {
    semanticChanged,
    knowledgeChanged,
    mappingChanged,
    identical: !semanticChanged && !knowledgeChanged && !mappingChanged,
    requiredVersionBump: semanticChanged ? 'major' : (knowledgeChanged || mappingChanged ? 'minor' : 'patch')
  };
};
