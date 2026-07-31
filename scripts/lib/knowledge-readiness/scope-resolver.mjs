import {
  ReadinessError,
  canonicalNodePattern,
  isCanonicalKnowledgeNode
} from './readiness-config.mjs';

function romanToInteger(value) {
  const numerals = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let result = 0;
  let previous = 0;
  for (const character of [...value].reverse()) {
    const current = numerals[character];
    if (!current) return null;
    result += current < previous ? -current : current;
    previous = Math.max(previous, current);
  }
  return result || null;
}

function bookAliases(bookCode) {
  const aliases = new Set([bookCode]);
  const match = /^BOOK-([IVXLC]+)$/i.exec(bookCode ?? '');
  if (match) aliases.add(`BOOK-${romanToInteger(match[1].toUpperCase())}`);
  return aliases;
}

function metadata(authority, node) {
  const membership = authority.membership.get(node.nodeCode);
  return {
    node,
    bookCode: node.bookCode ?? membership?.bookCode ?? null,
    partCode: node.partCode ?? membership?.blueprintNode?.partCode ?? null,
    collectionCode: node.collectionCode ?? null
  };
}

function plannedForScope(authority, normalized) {
  const entries = [...authority.planned.values()];
  if (normalized === 'ALL') return entries;
  if (normalized === 'PREFACE') {
    return entries.filter(entry => entry.blueprintNode.partCode === 'P0');
  }
  const book = /^BOOK-(\d+|[IVXLC]+)$/i.exec(normalized);
  if (book) {
    return entries.filter(entry => bookAliases(entry.bookCode).has(normalized));
  }
  const part = /^PART-(\d+)$/i.exec(normalized);
  if (part) {
    return entries.filter(entry => entry.blueprintNode.partCode === `P${Number(part[1])}`);
  }
  if (/^KN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(normalized)) {
    return entries.filter(entry => (
      entry.blueprintNode.nodeCode === normalized ||
      entry.blueprintNode.nodeCode.startsWith(`${normalized}-`)
    ));
  }
  return [];
}

export function resolveKnowledgeScope(authority, {
  scope = null,
  nodeCode = null
} = {}) {
  if (nodeCode) {
    if (!canonicalNodePattern(nodeCode)) {
      throw new ReadinessError(
        'KNOWLEDGE_SCOPE_INVALID',
        `Invalid Canonical Node code: ${nodeCode}.`
      );
    }
    const node = authority.registeredNodes.find(item => item.nodeCode === nodeCode);
    if (!node) {
      const planned = authority.planned.get(nodeCode);
      if (planned) {
        return {
          selector: nodeCode,
          selectorType: 'planned_node',
          nodes: [],
          plannedNodes: [planned],
          registrationState: 'not_registered'
        };
      }
      throw new ReadinessError(
        'CANONICAL_NODE_NOT_FOUND',
        `${nodeCode} is not present in the Canonical Node Registry.`
      );
    }
    if (!isCanonicalKnowledgeNode(node)) {
      throw new ReadinessError(
        'CANONICAL_NODE_TYPE_INVALID',
        `${nodeCode} is not a Canonical Knowledge Node.`
      );
    }
    return {
      selector: nodeCode,
      selectorType: 'node',
      nodes: [node],
      plannedNodes: [],
      registrationState: 'registered'
    };
  }

  const normalized = String(scope ?? 'ALL').trim().toUpperCase();
  const registered = authority.registeredNodes.filter(isCanonicalKnowledgeNode);
  let selectorType = 'scope';
  let selected;
  if (normalized === 'ALL') {
    selected = registered;
    selectorType = 'all';
  } else if (normalized === 'PREFACE') {
    selected = registered.filter(node => {
      const entry = metadata(authority, node);
      return entry.collectionCode === 'KC-PREFACE' || entry.partCode === 'P0';
    });
    selectorType = 'preface';
  } else if (/^BOOK-(\d+|[IVXLC]+)$/i.test(normalized)) {
    selected = registered.filter(node => {
      const entry = metadata(authority, node);
      return bookAliases(entry.bookCode).has(normalized);
    });
    selectorType = 'book';
  } else if (/^PART-(\d+)$/i.test(normalized)) {
    const partCode = `P${Number(normalized.slice(5))}`;
    selected = registered.filter(node => metadata(authority, node).partCode === partCode);
    selectorType = 'part';
  } else if (/^KN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(normalized)) {
    selected = registered.filter(node => (
      node.nodeCode === normalized || node.nodeCode.startsWith(`${normalized}-`)
    ));
    selectorType = 'node_prefix';
  } else {
    throw new ReadinessError(
      'KNOWLEDGE_SCOPE_INVALID',
      `Unsupported knowledge scope: ${scope}.`
    );
  }
  const plannedNodes = plannedForScope(authority, normalized);
  if (!selected.length && !plannedNodes.length) {
    if (selectorType === 'book' || selectorType === 'part') {
      return {
        selector: normalized,
        selectorType,
        nodes: [],
        plannedNodes: [],
        registrationState: 'not_registered'
      };
    }
    throw new ReadinessError(
      'KNOWLEDGE_SCOPE_EMPTY',
      `Knowledge scope ${normalized} contains no registered Canonical Nodes.`
    );
  }
  return {
    selector: normalized,
    selectorType,
    nodes: selected,
    plannedNodes,
    registrationState: selected.length ? 'registered' : 'not_registered'
  };
}
