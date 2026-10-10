import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const SOURCE_SHA256 = '5f5e0c3fcfdd9af3fe61c1e9357fab0431477f49ed5e207dcace080e655006f5';
const SOURCE_ID = 'ICH-SRC-ZHOUYI-ANCIENT-CN-WITNESS-25501';
const PERSPECTIVE_ID = 'ICH-PERSPECTIVE-ZHOUYI-ANCIENT-CANONICAL-TEXT';
const input = process.argv[2];
const output = process.argv[3] || 'content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json';

if (!input) throw new TypeError('Usage: node scripts/build-iching-public-domain-canonical-corpus-v2.mjs <pg25501.txt> [output.json]');

const raw = fs.readFileSync(input);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), SOURCE_SHA256, 'unexpected digital witness bytes');

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const predecessorPath = 'content/interpretation/iching/corpus/iching-public-domain-minimum-corpus-v1.json';
const registry = read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json');
const predecessor = read(predecessorPath);
const lines = raw.toString('utf8').replace(/\r/g, '').split('\n')
  .map((value, index) => ({lineNumber: index + 1, text: value.replace(/[\s　]+/g, ' ').trim()}))
  .filter(item => item.text);
const headerPattern = /^第\s*[一二三四五六七八九十百〇零]+\s*卦$/;
const linePattern = /^(初[六九]|[六九][二三四五]|上[六九])：/;
const headers = lines.map((item, index) => headerPattern.test(item.text) ? {index, lineNumber: item.lineNumber} : null).filter(Boolean);
assert.equal(headers.length, 64);
assert.equal(registry.entries.length, 64);

const canonicalEntries = [];
for (let hexagramIndex = 0; hexagramIndex < 64; hexagramIndex += 1) {
  const hexagram = registry.entries[hexagramIndex];
  const start = headers[hexagramIndex].index + 1;
  const end = hexagramIndex + 1 < headers.length ? headers[hexagramIndex + 1].index : lines.length;
  const block = lines.slice(start, end);
  const judgmentStart = block.findIndex(item => item.text.startsWith(`${hexagram.chineseName}：`));
  assert.ok(judgmentStart >= 0, `missing judgment: ${hexagram.hexagramId}`);
  const judgmentParts = [];
  for (let index = judgmentStart; index < block.length; index += 1) {
    const text = block[index].text;
    if (index > judgmentStart && /^(彖曰|象曰|初[六九]：|[六九][二三四五]：|上[六九]：)/.test(text)) break;
    judgmentParts.push(text);
  }
  canonicalEntries.push({
    claimId: `ICH-CLM-ZHOUYI-CN-${String(hexagram.number).padStart(2, '0')}-H`,
    hexagramId: hexagram.hexagramId,
    sourceId: SOURCE_ID,
    perspectiveId: PERSPECTIVE_ID,
    claim: judgmentParts.join(' '),
    scope: 'HEXAGRAM',
    provenance: {
      sourceLocator: `ebook-25501.txt#hexagram-${String(hexagram.number).padStart(2, '0')}-judgment`,
      digitalWitnessLine: block[judgmentStart].lineNumber,
      sourceLayer: 'ANCIENT_CANONICAL_TEXT_WITNESS',
      ingestionMode: 'VERBATIM_PUBLIC_DOMAIN_CANONICAL_TEXT_WHITESPACE_NORMALIZED',
      originalTextVendored: true,
      editorialInterpretation: false
    }
  });

  const canonicalLines = block.filter(item => linePattern.test(item.text)).slice(0, 6);
  assert.equal(canonicalLines.length, 6, `missing six lines: ${hexagram.hexagramId}`);
  canonicalLines.forEach((item, lineIndex) => {
    const prefix = item.text.match(linePattern)[1];
    const expectedPolarity = hexagram.lineStructure[lineIndex] === 1 ? '九' : '六';
    assert.ok(prefix.includes(expectedPolarity), `line polarity mismatch: ${hexagram.hexagramId} line ${lineIndex + 1}`);
    canonicalEntries.push({
      claimId: `ICH-CLM-ZHOUYI-CN-${String(hexagram.number).padStart(2, '0')}-L${lineIndex + 1}`,
      hexagramId: hexagram.hexagramId,
      sourceId: SOURCE_ID,
      perspectiveId: PERSPECTIVE_ID,
      claim: item.text,
      scope: 'LINE',
      linePosition: lineIndex + 1,
      provenance: {
        sourceLocator: `ebook-25501.txt#hexagram-${String(hexagram.number).padStart(2, '0')}-line-${lineIndex + 1}`,
        digitalWitnessLine: item.lineNumber,
        sourceLayer: 'ANCIENT_CANONICAL_LINE_TEXT_WITNESS',
        ingestionMode: 'VERBATIM_PUBLIC_DOMAIN_CANONICAL_TEXT_WHITESPACE_NORMALIZED',
        originalTextVendored: true,
        editorialInterpretation: false
      }
    });
  });
}

assert.equal(canonicalEntries.filter(item => item.scope === 'HEXAGRAM').length, 64);
assert.equal(canonicalEntries.filter(item => item.scope === 'LINE').length, 384);
assert.equal(new Set(canonicalEntries.filter(item => item.scope === 'LINE').map(item => `${item.hexagramId}:${item.linePosition}`)).size, 384);

const coveredHexagrams = registry.entries.map(item => item.hexagramId);
const corpus = {
  schemaVersion: 'PHI-OS-ICHI-PUBLIC-DOMAIN-CANONICAL-CORPUS-v2.0.0',
  phase: 'ICHI',
  work: 'ICHI-W17',
  baselineCommit: '90f87b962cc0f9a77996d2bb6deca5bfa38a1634',
  status: 'FULL_64_HEXAGRAM_384_LINE_CANONICAL_TEXT_WITNESS',
  corpusVersion: '2.0.0',
  methodCode: 'I_CHING',
  successorOf: predecessorPath,
  historicalPredecessorMutated: false,
  digitalWitness: {
    catalogUrl: 'https://www.gutenberg.org/ebooks/25501',
    plainTextUrl: 'https://www.gutenberg.org/ebooks/25501.txt.utf-8',
    retrievedForAuditOn: '2026-08-25',
    sha256: SOURCE_SHA256,
    parserVersion: 'ICHING_CANONICAL_UNIT_EXTRACTOR-v1.0.0'
  },
  coverage: {
    coveredHexagrams,
    coveredHexagramCount: 64,
    canonicalHexagramCount: 64,
    complete: true,
    policy: 'CANONICAL_TEXT_WITNESS_AVAILABLE_FOR_EVERY_HEXAGRAM_AND_CHANGING_LINE'
  },
  lineCoverage: {
    uniqueCanonicalLinePositionCount: 384,
    canonicalLinePositionCount: 384,
    complete: true,
    coordinate: 'KING_WEN_HEXAGRAM_ID_X_BOTTOM_TO_TOP_LINE_POSITION',
    supplementaryUseNineAndUseSixExcludedFromCanonical384: true,
    parallelLeggeEditorialParaphraseLineClaimsPreserved: predecessor.entries.filter(item => item.scope === 'LINE').length
  },
  sourcePolicy: {
    publicDomainBaseRequired: true,
    originalTextVendored: true,
    claimsAreEditorialParaphrases: false,
    ancientCanonicalTextIsNotAProfessionalOrRealityClaim: true,
    modelGeneratedGapFillAllowed: false,
    digitalWitnessTrademarkOrEndorsementClaimed: false,
    localLawReviewRequiredOutsideUnitedStates: true
  },
  entryCounts: {
    predecessorEntries: predecessor.entries.length,
    canonicalHexagramTextEntries: 64,
    canonicalLineTextEntries: 384,
    totalEntries: predecessor.entries.length + canonicalEntries.length
  },
  entries: [...predecessor.entries, ...canonicalEntries]
};

fs.writeFileSync(output, `${JSON.stringify(corpus, null, 2)}\n`);
console.log(`✓ built ${output}: 64/64 hexagram texts and 384/384 canonical line positions.`);
