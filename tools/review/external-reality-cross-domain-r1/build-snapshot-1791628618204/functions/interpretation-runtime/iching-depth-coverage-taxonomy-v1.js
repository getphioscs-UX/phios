/**
 * ICHI-DEPTH-W0 - coverage taxonomy successor.
 *
 * Canonical text availability, historical commentary availability and PHI OS
 * editorial depth are separate evidence classes. This module intentionally
 * does not mutate or reinterpret the frozen v1 adapter or canonical corpus.
 */

export const ICHING_DEPTH_COVERAGE_TAXONOMY_VERSION='1.0.0';
export const ICHING_DEPTH_COVERAGE_TAXONOMY_SCHEMA='PHI-OS-ICHI-DEPTH-COVERAGE-SNAPSHOT-v1.0.0';

const arr=value=>Array.isArray(value)?value:[];
const freeze=value=>Object.freeze(value);
const lineCoordinate=entry=>`${entry.hexagramId}:L${entry.linePosition}`;
const editorialCoordinate=entry=>entry.scope==='LINE'?lineCoordinate(entry):entry.hexagramId;

function assertAuthority(hexagramRegistry,corpus){
  if(arr(hexagramRegistry?.entries).length!==64) throw new TypeError('ICHI_DEPTH_64_HEXAGRAM_REGISTRY_REQUIRED');
  if(!Array.isArray(corpus?.entries)) throw new TypeError('ICHI_DEPTH_CANONICAL_CORPUS_REQUIRED');
}

function state(actual,expected){
  return actual===expected?'COMPLETE':actual===0?'NOT_STARTED':'PARTIAL';
}

function record(actual,expected,unit){
  return freeze({actual,expected,coverage:`${actual}/${expected}`,unit,state:state(actual,expected)});
}

function isCanonicalHexagramText(entry){
  return entry.scope==='HEXAGRAM'&&entry.provenance?.sourceLayer==='ANCIENT_CANONICAL_TEXT_WITNESS'&&entry.provenance?.editorialInterpretation===false;
}

function isCanonicalLineText(entry){
  return entry.scope==='LINE'&&Number.isInteger(entry.linePosition)&&entry.provenance?.sourceLayer==='ANCIENT_CANONICAL_LINE_TEXT_WITNESS'&&entry.provenance?.editorialInterpretation===false;
}

function isHistoricalCommentary(entry){
  if(entry.provenance?.sourceLayer==='ANCIENT_CANONICAL_TEXT_WITNESS'||entry.provenance?.sourceLayer==='ANCIENT_CANONICAL_LINE_TEXT_WITNESS') return false;
  return entry.scope==='HEXAGRAM_COMMENTARY'||entry.provenance?.ingestionMode==='EDITORIAL_PARAPHRASE_OF_PUBLIC_DOMAIN_SOURCE';
}

function admittedEditorial(entry){
  return entry?.review?.status==='HUMAN_APPROVED'&&entry?.review?.humanApproved===true;
}

export function createIChingDepthCoverageSnapshot({hexagramRegistry,corpus,editorialEntries=[]}={}){
  assertAuthority(hexagramRegistry,corpus);
  const corpusEntries=arr(corpus.entries);
  const editorial=arr(editorialEntries);
  const canonicalHexagrams=new Set(corpusEntries.filter(isCanonicalHexagramText).map(entry=>entry.hexagramId));
  const canonicalLines=new Set(corpusEntries.filter(isCanonicalLineText).map(lineCoordinate));
  const historical=corpusEntries.filter(isHistoricalCommentary);
  const historicalHexagrams=new Set(historical.filter(entry=>entry.scope!=='LINE').map(entry=>entry.hexagramId));
  const historicalLines=new Set(historical.filter(entry=>entry.scope==='LINE'&&Number.isInteger(entry.linePosition)).map(lineCoordinate));
  const plain=editorial.filter(entry=>['PHIOS_PLAIN_LANGUAGE_INTERPRETATION','PHIOS_DEPTH_EDITORIAL_INTERPRETATION'].includes(entry.contentClass)&&admittedEditorial(entry));
  const depth=editorial.filter(entry=>entry.contentClass==='PHIOS_DEPTH_EDITORIAL_INTERPRETATION'&&admittedEditorial(entry));
  const plainHexagrams=new Set(plain.filter(entry=>entry.scope==='HEXAGRAM').map(entry=>entry.hexagramId));
  const plainLines=new Set(plain.filter(entry=>entry.scope==='LINE').map(lineCoordinate));
  const depthHexagrams=new Set(depth.filter(entry=>entry.scope==='HEXAGRAM').map(entry=>entry.hexagramId));
  const depthLines=new Set(depth.filter(entry=>entry.scope==='LINE').map(lineCoordinate));
  const humanApprovedDepth=depth;
  const humanApprovedCoordinates=new Set(humanApprovedDepth.map(editorialCoordinate));
  const zhHansApproved=new Set(humanApprovedDepth.filter(entry=>entry.localeProjections?.['zh-Hans']).map(editorialCoordinate));
  const enApproved=new Set(humanApprovedDepth.filter(entry=>entry.localeProjections?.en).map(editorialCoordinate));

  const coverage=freeze({
    canonicalStructure:record(new Set(hexagramRegistry.entries.map(entry=>entry.hexagramId)).size,64,'HEXAGRAM'),
    canonicalHexagramText:record(canonicalHexagrams.size,64,'HEXAGRAM_TEXT'),
    canonicalLineText:record(canonicalLines.size,384,'LINE_TEXT'),
    historicalSourceCommentaryHexagram:record(historicalHexagrams.size,64,'HEXAGRAM'),
    historicalSourceCommentaryLine:record(historicalLines.size,384,'LINE'),
    phiosPlainLanguageHexagram:record(plainHexagrams.size,64,'HEXAGRAM'),
    phiosPlainLanguageLine:record(plainLines.size,384,'LINE'),
    phiosDepthHexagram:record(depthHexagrams.size,64,'HEXAGRAM'),
    phiosDepthLine:record(depthLines.size,384,'LINE'),
    localeProjectionZhHans:record(zhHansApproved.size,448,'EDITORIAL_UNIT'),
    localeProjectionEn:record(enApproved.size,448,'EDITORIAL_UNIT'),
    humanEditorialApproval:record(humanApprovedCoordinates.size,448,'EDITORIAL_UNIT')
  });

  return freeze({
    schemaVersion:ICHING_DEPTH_COVERAGE_TAXONOMY_SCHEMA,
    taxonomyVersion:ICHING_DEPTH_COVERAGE_TAXONOMY_VERSION,
    methodCode:'I_CHING',
    coverage,
    readiness:freeze({
      canonicalWitnessReady:coverage.canonicalHexagramText.state==='COMPLETE'&&coverage.canonicalLineText.state==='COMPLETE',
      historicalCommentaryComplete:coverage.historicalSourceCommentaryHexagram.state==='COMPLETE'&&coverage.historicalSourceCommentaryLine.state==='COMPLETE',
      customerDepthReady:coverage.phiosDepthHexagram.state==='COMPLETE'&&coverage.phiosDepthLine.state==='COMPLETE'&&coverage.localeProjectionZhHans.state==='COMPLETE'&&coverage.localeProjectionEn.state==='COMPLETE',
      humanEditorialReviewComplete:coverage.humanEditorialApproval.state==='COMPLETE',
      publicProductionEligible:false
    }),
    separation:freeze({
      canonicalTextDoesNotSatisfyCommentaryCoverage:true,
      historicalCommentaryDoesNotSatisfyPhiosEditorialDepth:true,
      sourceAvailabilityDoesNotCreateHumanApproval:true,
      schemaValidityDoesNotCreateProductionAuthority:true,
      modelCandidateDoesNotCreateEditorialAuthority:true
    })
  });
}
