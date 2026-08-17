import {
  ARTICLE_RENDER_ERROR_CODES,
  ArticleRenderError,
  assertSafePublicValue
} from './article-errors.js';

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
const DISPLAY_MODES = new Set(['inline', 'wide', 'full']);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function textArray(values) {
  return Array.isArray(values)
    ? values.map(text).filter(Boolean)
    : [];
}

function requiredText(value, detail) {
  const result = text(value);
  if (!result) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
      detail
    );
  }
  return result;
}

function safeOrientation(value) {
  return value === 'horizontal' ? 'horizontal' : 'vertical';
}

function safeDisplayMode(value) {
  return DISPLAY_MODES.has(value) ? value : 'inline';
}

function mechanismSteps(steps) {
  if (!Array.isArray(steps) || steps.length < 2) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
      'mechanism_steps'
    );
  }

  return steps.map((step, index) => ({
    label: requiredText(step?.label, `mechanism_step_${index}`),
    description: text(step?.description)
  }));
}

function timelineEntries(items) {
  if (!Array.isArray(items) || items.length < 2) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
      'timeline_items'
    );
  }

  return items.map((item, index) => ({
    period: text(item?.dateLabel),
    title: requiredText(
      item?.label || item?.title,
      `timeline_item_${index}`
    ),
    description: text(item?.description)
  }));
}

function comparisonColumns(columns) {
  if (!Array.isArray(columns) || columns.length < 2 || columns.length > 3) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
      'comparison_columns'
    );
  }

  return columns.map((column, index) => {
    const items = textArray(column?.items);
    if (items.length < 2) {
      throw new ArticleRenderError(
        ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
        `comparison_column_${index}`
      );
    }
    return {
      heading: requiredText(
        column?.heading,
        `comparison_heading_${index}`
      ),
      items
    };
  });
}

export function isSupportedArticleBlockType(type) {
  return ARTICLE_BLOCK_TYPE_SET.has(type);
}

export function prepareArticleBlockForRendering(block) {
  assertSafePublicValue(block, 'article.block');

  if (!block || typeof block !== 'object') {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
      'block_not_object'
    );
  }

  if (!isSupportedArticleBlockType(block.type)) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.UNKNOWN_BLOCK,
      text(block.type) || 'missing_block_type'
    );
  }

  if (block.visibility === 'editorial_only') {
    return null;
  }

  const base = {
    blockCode: text(block.blockCode),
    type: block.type,
    label: text(block.label),
    ariaLabel: text(block.ariaLabel)
  };

  switch (block.type) {
    case 'paragraph':
    case 'lead':
    case 'transition':
      return {
        ...base,
        text: requiredText(block.text, `${block.type}_text`)
      };

    case 'question':
      return {
        ...base,
        question: requiredText(
          block.text || block.question,
          'question_text'
        )
      };

    case 'insight':
      return {
        ...base,
        heading: text(block.title || block.heading),
        statement: requiredText(
          block.text || block.statement,
          'insight_text'
        )
      };

    case 'mechanism':
      return {
        ...base,
        heading: requiredText(
          block.title || block.heading,
          'mechanism_title'
        ),
        intro: text(block.intro),
        steps: mechanismSteps(block.steps),
        conclusion: text(block.conclusion),
        orientation: safeOrientation(block.orientation)
      };

    case 'timeline':
      return {
        ...base,
        heading: text(block.title || block.heading),
        entries: timelineEntries(
          Array.isArray(block.items) ? block.items : block.entries
        ),
        timelineMode: block.timelineMode === 'chronological'
          ? 'chronological'
          : 'conceptual'
      };

    case 'comparison': {
      const columns = Array.isArray(block.columns)
        ? block.columns
        : [block.left, block.right].filter(Boolean);
      return {
        ...base,
        heading: text(block.title || block.heading),
        columns: comparisonColumns(columns)
      };
    }

    case 'figure':
      return {
        ...base,
        assetCode: requiredText(block.assetCode, 'figure_asset_code'),
        altText: requiredText(block.altText, 'figure_alt_text'),
        caption: text(block.caption),
        creditLabel: text(block.creditLabel),
        displayMode: safeDisplayMode(block.displayMode)
      };

    case 'next_node':
      return {
        ...base,
        nodeCode: requiredText(block.nodeCode, 'next_node_code'),
        label: requiredText(block.label, 'next_node_label'),
        title: requiredText(block.title, 'next_node_title'),
        description: requiredText(
          block.description,
          'next_node_description'
        )
      };

    default:
      throw new ArticleRenderError(
        ARTICLE_RENDER_ERROR_CODES.UNKNOWN_BLOCK,
        text(block.type)
      );
  }
}

export function prepareArticleSectionForRendering(section) {
  assertSafePublicValue(section, 'article.section');

  if (!section || typeof section !== 'object') {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_SECTION,
      'section_not_object'
    );
  }

  const hasLegacyParagraphs = Array.isArray(section.paragraphs);
  const hasStructuredBlocks = Array.isArray(section.blocks);

  if (hasLegacyParagraphs === hasStructuredBlocks) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_SECTION,
      'section_body_mode'
    );
  }

  const normalized = {
    sectionCode: text(section.sectionCode),
    heading: requiredText(section.heading, 'section_heading'),
    purpose: text(section.purpose),
    ariaLabel: text(section.ariaLabel),
    anchor: text(section.anchor)
  };

  if (hasLegacyParagraphs) {
    const paragraphs = textArray(section.paragraphs);
    if (!paragraphs.length) {
      throw new ArticleRenderError(
        ARTICLE_RENDER_ERROR_CODES.INVALID_SECTION,
        'legacy_paragraphs'
      );
    }
    return {
      ...normalized,
      paragraphs,
      blocks: []
    };
  }

  const blocks = section.blocks
    .map(prepareArticleBlockForRendering)
    .filter(Boolean);

  if (!blocks.length) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_SECTION,
      'structured_blocks'
    );
  }

  return {
    ...normalized,
    paragraphs: [],
    blocks
  };
}

export function normalizeArticleForRenderer(article) {
  assertSafePublicValue(article);

  if (
    !article ||
    typeof article !== 'object' ||
    !/^KN-[A-Z0-9-]+$/.test(article.nodeCode || '') ||
    !['zh-Hans', 'en'].includes(article.locale) ||
    !Array.isArray(article.sections) ||
    !article.sections.length
  ) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
      'article_identity_or_body'
    );
  }

  if (
    article.node?.nodeCode &&
    article.node.nodeCode !== article.nodeCode
  ) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.NODE_MISMATCH,
      article.nodeCode
    );
  }

  return {
    ...article,
    title: requiredText(article.title, 'article_title'),
    shortAnswer: requiredText(article.shortAnswer, 'article_short_answer'),
    summary: requiredText(article.summary, 'article_summary'),
    sections: article.sections.map(prepareArticleSectionForRendering),
    // Public Article Purity: source-level knowledge boundaries remain internal
    // governance metadata and are never projected as a customer-facing card.
    knowledgeBoundary: []
  };
}
