const PLACEHOLDER = /(\[[A-Za-z][^\]\r\n]{0,80}\]|【[^】\r\n]{1,120}】|@\d+clause\b|\{\{field:[^}]+\}\})/i;

export function assertRenderableIr(ir) {
  if (!ir || ir.schemaVersion !== 'PHI-OS-DAR-ASSEMBLY-IR-v1') throw new Error('DAR_RENDERER_IR_REQUIRED');
  if (ir.assemblyStatus !== 'DOCUMENT_CANDIDATE') throw new Error(`DAR_RENDERER_BLOCKED_IR:${ir.assemblyStatus ?? 'UNKNOWN'}`);
  if (!Array.isArray(ir.sections)) throw new Error('DAR_RENDERER_SECTIONS_REQUIRED');
  for (const [index, section] of ir.sections.entries()) {
    if (!section?.clauseId || !section?.clauseVersion || !section?.approvalDigest) throw new Error(`DAR_RENDERER_SECTION_LINEAGE_MISSING:${index}`);
    if (typeof section.renderText !== 'string') throw new Error(`DAR_RENDERER_TEXT_MISSING:${index}`);
    const match = section.renderText.match(PLACEHOLDER);
    if (match) throw new Error(`DAR_RENDERER_UNRESOLVED_PLACEHOLDER:${match[0]}`);
  }
  return true;
}

export function documentLines(ir) {
  const lines = [];
  lines.push(`${ir.documentType} - ${ir.jurisdiction ?? 'UNSPECIFIED'}`);
  lines.push('');
  for (const section of ir.sections) {
    lines.push(`[${section.clauseId} @ ${section.clauseVersion}]`);
    for (const line of String(section.renderText).split(/\r?\n/)) lines.push(line);
    lines.push('');
  }
  return lines;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
