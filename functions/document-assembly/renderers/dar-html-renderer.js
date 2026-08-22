import { assertRenderableIr, escapeHtml } from './_renderer-common.js';

export function renderDarHtml(ir) {
  assertRenderableIr(ir);
  const sections = ir.sections.map((section) => `<section data-clause-id="${escapeHtml(section.clauseId)}" data-clause-version="${escapeHtml(section.clauseVersion)}"><p>${escapeHtml(section.renderText).replace(/\r?\n/g, '<br>')}</p></section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer"><title>${escapeHtml(ir.documentType)}</title></head><body data-dar-assembly-digest="${escapeHtml(ir.assemblyDigest)}"><main>${sections}</main></body></html>`;
}

export default Object.freeze({ renderDarHtml });
