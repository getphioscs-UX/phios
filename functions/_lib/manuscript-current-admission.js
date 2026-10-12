// Existing current qualification/admission owner; not a second ledger.
export const CURRENT_CHAPTER_ADMISSION_OWNER = 'tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/CHAPTER-CURRENT-CLOSURE.json';

export function admittedManuscriptScopes(records, source, metadata, {textScopeEnabled = false, declaredWholeSections = []} = {}) {
  let chapters = [];
  try {
    const ledger = JSON.parse(metadata?.[CURRENT_CHAPTER_ADMISSION_OWNER]);
    if (Array.isArray(ledger.chapters)) chapters = ledger.chapters;
  } catch { /* Missing/malformed authority never grants whole-chapter admission. */ }
  return records.filter(scope => {
    const matches = chapters.filter(row => row.bookCode === source.bookCode && row.sectionCode === scope.sectionCode);
    const whole = scope.wholeChapterCandidate === true || declaredWholeSections.includes(scope.sectionCode)
      || matches.some(row => row.sourceSha256 === source.sourceSha256 && row.sectionSha256 === scope.sectionSha256);
    if (!whole) return true; // Existing bounded excerpts keep their own admission owner.
    if (!textScopeEnabled || matches.length !== 1) return false;
    const row = matches[0];
    return row.currentWholeChapterQualified === true
      && row.currentAdmission === 'ACTIVATED'
      && row.sourceSha256 === source.sourceSha256
      && row.sectionSha256 === scope.sectionSha256;
  });
}
