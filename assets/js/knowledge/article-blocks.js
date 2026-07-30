export const ARTICLE_BLOCK_TYPES = Object.freeze([
  'paragraph',
  'lead',
  'question',
  'insight',
  'mechanism',
  'timeline',
  'comparison',
  'figure',
  'transition',
  'next_node'
]);

const ARTICLE_BLOCK_TYPE_SET = new Set(ARTICLE_BLOCK_TYPES);

function safeOrientation(value) {
  return value === 'horizontal' ? 'horizontal' : 'vertical';
}

function safeDisplayMode(value) {
  return ['inline', 'wide', 'full'].includes(value) ? value : 'inline';
}

function timelineEntry(item = {}) {
  return {
    period: item.dateLabel || '',
    title: item.label || item.title || '',
    description: item.description || ''
  };
}

export function isSupportedArticleBlockType(type) {
  return ARTICLE_BLOCK_TYPE_SET.has(type);
}

export function prepareArticleBlockForRendering(block) {
  if (
    !block ||
    typeof block !== 'object' ||
    !isSupportedArticleBlockType(block.type) ||
    block.visibility === 'editorial_only'
  ) {
    return null;
  }

  switch (block.type) {
    case 'question':
      return {
        ...block,
        question: block.text || block.question || ''
      };

    case 'insight':
      return {
        ...block,
        heading: block.title || block.heading || '',
        statement: block.text || block.statement || ''
      };

    case 'mechanism':
      return {
        ...block,
        heading: block.title || block.heading || '',
        orientation: safeOrientation(block.orientation)
      };

    case 'timeline':
      return {
        ...block,
        heading: block.title || block.heading || '',
        entries: Array.isArray(block.items)
          ? block.items.map(timelineEntry)
          : block.entries || []
      };

    case 'comparison': {
      const columns = Array.isArray(block.columns)
        ? block.columns
        : [block.left, block.right].filter(Boolean);

      return {
        ...block,
        heading: block.title || block.heading || '',
        columns,
        left: columns[0] || null,
        right: columns[1] || null
      };
    }

    case 'figure':
      return {
        ...block,
        displayMode: safeDisplayMode(block.displayMode)
      };

    default:
      return { ...block };
  }
}

export function prepareArticleSectionForRendering(section) {
  if (!section || typeof section !== 'object') {
    return null;
  }

  const hasLegacyParagraphs = Array.isArray(section.paragraphs);
  const hasStructuredBlocks = Array.isArray(section.blocks);

  if (hasLegacyParagraphs === hasStructuredBlocks) {
    return null;
  }

  if (hasLegacyParagraphs) {
    return {
      ...section,
      blocks: []
    };
  }

  return {
    ...section,
    paragraphs: [],
    blocks: section.blocks
      .map(prepareArticleBlockForRendering)
      .filter(Boolean)
  };
}
