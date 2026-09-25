import {
  createPublishedPicture,
  resolvePublishedVisualAsset
} from './article-assets.js';
import {
  normalizeArticleForRenderer
} from './article-blocks.js';
import {
  ARTICLE_RENDER_ERROR_CODES,
  ArticleRenderError
} from './article-errors.js';
import {
  createInternalLink,
  resolvePublishedNode,
  safeInternalHref
} from './article-links.js';
import {
  renderPublicSources
} from './article-sources.js';

function appendText(
  documentRef,
  parent,
  tagName,
  value,
  className = ''
) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const element = documentRef.createElement(tagName);
  if (className) {
    element.className = className;
  }
  element.textContent = value;
  parent.append(element);
  return element;
}

function translated(translate, key, values) {
  const value = translate(key, values);
  return typeof value === 'string' ? value : '';
}

function appendList(documentRef, parent, values, ordered = false) {
  const list = documentRef.createElement(ordered ? 'ol' : 'ul');
  for (const value of values) {
    const item = documentRef.createElement('li');
    item.textContent = value;
    list.append(item);
  }
  parent.append(list);
  return list;
}

function renderMechanism(documentRef, block) {
  const section = documentRef.createElement('section');
  section.className =
    `knowledge-block knowledge-block--mechanism knowledge-block--${block.orientation}`;
  appendText(documentRef, section, 'h3', block.heading);
  appendText(documentRef, section, 'p', block.intro);

  const list = documentRef.createElement('ol');
  for (const step of block.steps) {
    const item = documentRef.createElement('li');
    appendText(documentRef, item, 'strong', step.label);
    appendText(documentRef, item, 'span', step.description);
    list.append(item);
  }
  section.append(list);
  appendText(documentRef, section, 'p', block.conclusion);
  return section;
}

function renderTimeline(documentRef, block, translate) {
  const section = documentRef.createElement('section');
  section.className = 'knowledge-block knowledge-block--timeline';

  if (!appendText(documentRef, section, 'h3', block.heading)) {
    section.setAttribute(
      'aria-label',
      block.ariaLabel ||
      translated(translate, 'knowledge.articles.timeline')
    );
  }

  const list = documentRef.createElement('ol');
  for (const entry of block.entries) {
    const item = documentRef.createElement('li');
    appendText(
      documentRef,
      item,
      'span',
      entry.period,
      'knowledge-block__period'
    );
    appendText(documentRef, item, 'strong', entry.title);
    appendText(documentRef, item, 'p', entry.description);
    list.append(item);
  }
  section.append(list);
  return section;
}

function renderComparison(documentRef, block, translate) {
  const section = documentRef.createElement('section');
  section.className = 'knowledge-block knowledge-block--comparison';

  if (!appendText(documentRef, section, 'h3', block.heading)) {
    section.setAttribute(
      'aria-label',
      block.ariaLabel ||
      translated(translate, 'knowledge.articles.comparison')
    );
  }

  const grid = documentRef.createElement('div');
  grid.className = 'knowledge-block__comparison-grid';

  for (const column of block.columns) {
    const columnSection = documentRef.createElement('section');
    appendText(documentRef, columnSection, 'h4', column.heading);
    appendList(documentRef, columnSection, column.items);
    grid.append(columnSection);
  }

  section.append(grid);
  return section;
}

function renderFigure(documentRef, block, article) {
  const asset = resolvePublishedVisualAsset(
    article.visualAssets,
    block.assetCode
  );
  const figure = documentRef.createElement('figure');
  figure.className =
    `knowledge-block knowledge-block--figure knowledge-block--figure-${block.displayMode}`;
  figure.append(createPublishedPicture(documentRef, asset, {
    altText: block.altText
  }));

  const caption = block.caption || asset.caption;
  if (!caption) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
      'figure_caption'
    );
  }
  appendText(documentRef, figure, 'figcaption', caption);
  appendText(
    documentRef,
    figure,
    'small',
    block.creditLabel,
    'knowledge-block__credit'
  );
  return figure;
}

function renderNextNode(
  documentRef,
  block,
  publishedArticles,
  translate
) {
  const navigation = documentRef.createElement('nav');
  navigation.className = 'knowledge-block knowledge-block--next-node';
  navigation.setAttribute(
    'aria-label',
    block.ariaLabel ||
    translated(translate, 'knowledge.articles.continueReading')
  );

  appendText(
    documentRef,
    navigation,
    'p',
    block.label,
    'knowledge-block__label'
  );
  appendText(documentRef, navigation, 'p', block.description);

  const nextArticle = resolvePublishedNode(
    block.nodeCode,
    publishedArticles
  );

  if (!nextArticle) {
    appendText(
      documentRef,
      navigation,
      'p',
      translated(translate, 'knowledge.articles.nextNodeUnavailable'),
      'knowledge-block__availability'
    );
    return navigation;
  }

  const link = createInternalLink(documentRef, {
    href: nextArticle.publicHref,
    label: nextArticle.title
  });
  if (link) {
    navigation.append(link);
  }
  return navigation;
}

function renderBlock(
  documentRef,
  block,
  article,
  publishedArticles,
  translate
) {
  switch (block.type) {
    case 'paragraph':
      return appendText(
        documentRef,
        documentRef.createDocumentFragment(),
        'p',
        block.text,
        'knowledge-block knowledge-block--paragraph'
      );

    case 'lead':
      return appendText(
        documentRef,
        documentRef.createDocumentFragment(),
        'p',
        block.text,
        'knowledge-block knowledge-block--lead'
      );

    case 'question': {
      const aside = documentRef.createElement('aside');
      aside.className = 'knowledge-block knowledge-block--question';
      appendText(
        documentRef,
        aside,
        'p',
        block.question,
        'knowledge-block__question'
      );
      return aside;
    }

    case 'insight': {
      const aside = documentRef.createElement('aside');
      aside.className = 'knowledge-block knowledge-block--insight';
      appendText(
        documentRef,
        aside,
        'p',
        block.heading ||
        block.label ||
        translated(translate, 'knowledge.articles.insight'),
        'knowledge-block__label'
      );
      appendText(documentRef, aside, 'p', block.statement);
      return aside;
    }

    case 'mechanism':
      return renderMechanism(documentRef, block);

    case 'timeline':
      return renderTimeline(documentRef, block, translate);

    case 'comparison':
      return renderComparison(documentRef, block, translate);

    case 'figure':
      return renderFigure(documentRef, block, article);

    case 'transition':
      return appendText(
        documentRef,
        documentRef.createDocumentFragment(),
        'p',
        block.text,
        'knowledge-block knowledge-block--transition'
      );

    case 'next_node':
      return renderNextNode(
        documentRef,
        block,
        publishedArticles,
        translate
      );

    default:
      throw new ArticleRenderError(
        ARTICLE_RENDER_ERROR_CODES.UNKNOWN_BLOCK,
        block.type
      );
  }
}

function sectionAnchor(section, index) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.anchor)
    ? section.anchor
    : `article-section-${index + 1}`;
}

function renderArticleBody(
  documentRef,
  article,
  publishedArticles,
  translate
) {
  const body = documentRef.createElement('div');
  body.className = 'knowledge-article__body';

  article.sections.forEach((section, index) => {
    const sectionElement = documentRef.createElement('section');
    sectionElement.id = sectionAnchor(section, index);
    if (section.ariaLabel) {
      sectionElement.setAttribute('aria-label', section.ariaLabel);
    }
    appendText(documentRef, sectionElement, 'h2', section.heading);

    for (const paragraph of section.paragraphs) {
      appendText(documentRef, sectionElement, 'p', paragraph);
    }
    for (const block of section.blocks) {
      const blockElement = renderBlock(
        documentRef,
        block,
        article,
        publishedArticles,
        translate
      );
      if (blockElement) {
        sectionElement.append(blockElement);
      }
    }
    body.append(sectionElement);
  });

  return body;
}

function renderKeyConcepts(documentRef, concepts, heading) {
  if (!Array.isArray(concepts) || !concepts.length) {
    return null;
  }

  const section = documentRef.createElement('section');
  appendText(
    documentRef,
    section,
    'p',
    heading,
    'knowledge-eyebrow'
  );

  const structured = concepts.every(concept => (
    concept && typeof concept === 'object'
  ));

  if (!structured) {
    appendList(
      documentRef,
      section,
      concepts.filter(concept => typeof concept === 'string')
    );
    return section;
  }

  const list = documentRef.createElement('dl');
  list.className = 'knowledge-concept-list';
  for (const concept of concepts) {
    appendText(documentRef, list, 'dt', concept.label);
    appendText(documentRef, list, 'dd', concept.definition);
  }
  section.append(list);
  return section;
}

function renderTableOfContents(
  documentRef,
  sections,
  translate
) {
  const navigation = documentRef.createElement('nav');
  navigation.className = 'knowledge-article__toc';
  navigation.setAttribute(
    'aria-label',
    translated(translate, 'knowledge.articles.tableOfContents')
  );
  appendText(
    documentRef,
    navigation,
    'p',
    translated(translate, 'knowledge.articles.tableOfContents'),
    'knowledge-eyebrow'
  );

  const list = documentRef.createElement('ol');
  sections.forEach((section, index) => {
    const item = documentRef.createElement('li');
    const link = documentRef.createElement('a');
    link.href = `#${sectionAnchor(section, index)}`;
    link.textContent = section.heading;
    item.append(link);
    list.append(item);
  });
  navigation.append(list);
  return navigation;
}

function renderArticleAside(documentRef, article, translate) {
  const aside = documentRef.createElement('aside');
  aside.className = 'knowledge-article__aside';
  aside.append(renderTableOfContents(
    documentRef,
    article.sections,
    translate
  ));

  const concepts = renderKeyConcepts(
    documentRef,
    article.keyConcepts,
    translated(translate, 'knowledge.articles.keyConcepts')
  );
  if (concepts) {
    aside.append(concepts);
  }

  const sources = renderPublicSources(
    documentRef,
    article.publicSources,
    translated(translate, 'knowledge.articles.sources')
  );
  if (sources) {
    aside.append(sources);
  }

  return aside;
}

function renderBoundary(documentRef, article, translate) {
  const section = documentRef.createElement('section');
  section.className = 'knowledge-boundary';
  section.setAttribute('aria-labelledby', 'article-boundary');
  appendText(
    documentRef,
    section,
    'p',
    translated(translate, 'knowledge.articles.boundary'),
    'knowledge-eyebrow'
  );
  const heading = appendText(
    documentRef,
    section,
    'h2',
    translated(translate, 'knowledge.articles.boundaryTitle')
  );
  heading.id = 'article-boundary';

  const values = article.knowledgeBoundary.map(boundary => (
    typeof boundary === 'string' ? boundary : boundary.text
  ));
  appendList(documentRef, section, values.filter(Boolean));
  return section;
}

function renderRelated(documentRef, article, publishedArticles, translate) {
  const relatedCodes = new Set([
    ...(article.connections.relatedArticles || []),
    ...(article.connections.relatedNodes || [])
  ]);
  const related = publishedArticles.filter(candidate => (
    candidate.slug !== article.slug &&
    (relatedCodes.has(candidate.slug) || (candidate.nodeCode !== article.nodeCode && relatedCodes.has(candidate.nodeCode))) &&
    safeInternalHref(candidate.publicHref)
  ));

  if (!related.length) {
    return null;
  }

  const section = documentRef.createElement('section');
  section.className = 'knowledge-related';
  section.setAttribute('aria-labelledby', 'related-articles');
  appendText(
    documentRef,
    section,
    'p',
    translated(translate, 'knowledge.articles.continueReading'),
    'knowledge-eyebrow'
  );
  const heading = appendText(
    documentRef,
    section,
    'h2',
    translated(translate, 'knowledge.articles.related')
  );
  heading.id = 'related-articles';

  const grid = documentRef.createElement('div');
  grid.className = 'knowledge-grid';
  for (const candidate of related) {
    const card = documentRef.createElement('article');
    card.className = 'knowledge-card';
    appendText(documentRef, card, 'h3', candidate.title);
    appendText(documentRef, card, 'p', candidate.summary);
    const link = createInternalLink(documentRef, {
      href: candidate.publicHref,
      label: translated(translate, 'knowledge.articles.read')
    });
    if (link) {
      card.append(link);
      grid.append(card);
    }
  }
  section.append(grid);
  return section;
}

function appendConnectionLinks(
  documentRef,
  parent,
  connections
) {
  for (const connection of connections) {
    const link = createInternalLink(documentRef, connection);
    if (link) {
      parent.append(link);
    }
  }
}

function renderExitNavigation(documentRef, article, translate) {
  const navigation = documentRef.createElement('nav');
  navigation.className = 'knowledge-exit-grid';
  navigation.setAttribute(
    'aria-label',
    translated(translate, 'knowledge.articles.nextRoutes')
  );

  appendConnectionLinks(
    documentRef,
    navigation,
    article.connections.relatedBooks || []
  );
  appendConnectionLinks(
    documentRef,
    navigation,
    article.connections.relatedAtlasEntries || []
  );
  appendConnectionLinks(
    documentRef,
    navigation,
    article.connections.journeyEntryTopics || []
  );

  const returnLink = createInternalLink(documentRef, {
    href: '/articles',
    label: translated(translate, 'knowledge.articles.leaveForNow')
  });
  if (returnLink) {
    navigation.append(returnLink);
  }
  return navigation;
}

function renderHeroVisual(documentRef, article) {
  if (!article.hero?.assetCode) {
    if (article.sourceReading?.path) return null;
    const figure=documentRef.createElement('figure');figure.className='knowledge-article__hero-visual';
    const image=documentRef.createElement('img');image.setAttribute('data-ks-asset','HERO-004');image.alt='';image.loading='eager';figure.append(image);return figure;
  }

  const asset = resolvePublishedVisualAsset(
    article.visualAssets,
    article.hero.assetCode,
    { required: false }
  );
  if (!asset) {
    return null;
  }

  const figure = documentRef.createElement('figure');
  figure.className = 'knowledge-article__hero-visual';
  figure.append(createPublishedPicture(documentRef, asset, {
    eager: true
  }));
  appendText(documentRef, figure, 'figcaption', asset.caption);
  return figure;
}

function renderHeader(documentRef, article, translate) {
  const header = documentRef.createElement('header');
  header.className = 'knowledge-article__header';
  const headerContent = documentRef.createElement('div');
  headerContent.className = 'knowledge-article__header-content';

  const back = createInternalLink(documentRef, {
    href: '/articles',
    label: `← ${translated(translate, 'knowledge.articles.allArticles')}`,
    className: 'knowledge-article__back'
  });
  if (back) {
    headerContent.append(back);
  }

  appendText(
    documentRef,
    headerContent,
    'p',
    article.hero?.eyebrow ||
    translated(translate, 'knowledge.articles.publicKnowledge'),
    'knowledge-eyebrow'
  );
  appendText(documentRef, headerContent, 'h1', article.title);
  appendText(
    documentRef,
    headerContent,
    'p',
    article.hero?.lead || article.shortAnswer,
    'knowledge-article__answer'
  );

  const metadata = documentRef.createElement('p');
  metadata.className = 'knowledge-article__meta';
  const metadataParts = [];
  if (article.readingTimeMinutes) {
    metadataParts.push(translated(
      translate,
      'knowledge.articles.readingTime',
      { minutes: article.readingTimeMinutes }
    ));
  }
  if (article.publishedAt) {
    metadataParts.push(translated(
      translate,
      'knowledge.articles.publishedOn',
      { date: article.publishedAt }
    ));
  }
  if (article.publicationContext) {
    const locale = article.locale === 'zh-Hans' ? 'zh-Hans' : 'en';
    const bookTitle = article.publicationContext.bookTitle?.[locale] || article.publicationContext.bookTitle?.en || '';
    metadataParts.push(article.sourceReading?.path ? bookTitle : `Volume ${article.publicationContext.publicationVolume}${bookTitle ? ` · ${bookTitle}` : ''} · ${article.publicationContext.partCode}`);
  }
  metadata.textContent = metadataParts.join(' · ');
  if (metadata.textContent) {
    headerContent.append(metadata);
  }

  const actions = documentRef.createElement('div');
  actions.className = 'knowledge-article__actions';
  const save = documentRef.createElement('button');
  save.className = 'public-button public-button--secondary';
  save.type = 'button';
  save.setAttribute('data-save-article', '');
  save.setAttribute('data-node-code', article.nodeCode);
  save.textContent = translated(
    translate,
    'knowledge.articles.save'
  );
  actions.append(save);

  for (const action of [
    [article.publicationContext?.bookRoute || '/books', (article.locale==='zh-Hans'?'阅读本册：':'Read volume: ')+(article.publicationContext?.bookTitle?.[article.locale]||article.publicationContext?.bookTitle?.en||article.publicationContext?.bookCode||'PHI OS')],
    [article.publicationContext?.atlasRoute || (article.sourceReading?.path ? '/books/reality-differentiation/#atlas' : '/explore'), translated(translate, 'knowledge.articles.viewAtlas')]
  ]) {
    const link = createInternalLink(documentRef, {
      href: action[0],
      label: action[1],
      className: 'public-button public-button--quiet'
    });
    if (link) {
      actions.append(link);
    }
  }
  headerContent.append(actions);

  const headerLayout = documentRef.createElement('div');
  headerLayout.className = 'knowledge-article__header-layout';
  headerLayout.append(headerContent);
  const visual = renderHeroVisual(documentRef, article);
  if (visual) {
    headerLayout.classList.add(
      'knowledge-article__header-layout--with-visual'
    );
    headerLayout.append(visual);
  }
  header.append(headerLayout);
  return header;
}

function shouldExposePublicSourceReading(article) {
  return article?.publicationContext?.bookCode !== 'BOOK-5' &&
    article?.sourceReading?.accessBoundary !== 'PRIVATE_MANUSCRIPT_TEXT_NOT_EMBEDDED_IN_PUBLIC_ARTICLE';
}

function renderSourceProvenance(documentRef, article) {
  const source=article.sourceReading;
  if(!source || (source.path && shouldExposePublicSourceReading(article))) return null;
  const sections=Array.isArray(source.sourceSections)?source.sourceSections.filter(Boolean):[];
  const start=Number(source.pages?.start),end=Number(source.pages?.end);
  const pages=Number.isFinite(start)&&Number.isFinite(end)?`${start}–${end}`:'';
  if(!sections.length && !pages) return null;
  const details=documentRef.createElement('details');
  details.className='knowledge-article__source-reading';
  details.id='manuscript';
  const summary=documentRef.createElement('summary');
  summary.textContent=article.locale==='zh-Hans'?'书稿来源':'Manuscript source';
  details.append(summary);
  const body=documentRef.createElement('div');
  appendText(documentRef,body,'p',article.locale==='zh-Hans'
    ?'本文依据已完成书稿整理；公开页面保留来源章节与页码，但不公开嵌入私有书稿全文。'
    :'This article is grounded in the completed manuscript. The public page preserves section and page provenance without embedding the private manuscript text.');
  if(sections.length) appendText(documentRef,body,'p',(article.locale==='zh-Hans'?'来源章节：':'Source sections: ')+sections.join(' · '));
  if(pages) appendText(documentRef,body,'p',(article.locale==='zh-Hans'?'来源页码：':'Source pages: ')+pages);
  details.append(body);
  return details;
}

export function renderArticleDocument(
  documentRef,
  articleInput,
  {
    publishedArticles = [],
    translate
  }
) {
  if (!documentRef || typeof translate !== 'function') {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.INVALID_ARTICLE,
      'renderer_context'
    );
  }

  const article = normalizeArticleForRenderer(articleInput);
  const container = documentRef.createElement('article');
  container.className = 'knowledge-article';
  container.append(renderHeader(documentRef, article, translate));

  const layout = documentRef.createElement('div');
  layout.className = 'knowledge-article__layout';
  layout.append(renderArticleBody(
    documentRef,
    article,
    publishedArticles,
    translate
  ));
  layout.append(renderArticleAside(documentRef, article, translate));
  container.append(layout);
  const provenanceOnly=renderSourceProvenance(documentRef,article);
  if(provenanceOnly) container.append(provenanceOnly);
  if (article.sourceReading?.path && shouldExposePublicSourceReading(article)) {
    const details = documentRef.createElement('details');
    details.className = 'knowledge-article__source-reading';
    details.id = 'manuscript';
    appendText(documentRef, details, 'summary', article.sourceReading.label);
    let loaded = false, pending = false;
    details.addEventListener('toggle', async () => {
      if (!details.open || loaded || pending) return;
      pending = true;
      const body = documentRef.createElement('div');
      body.setAttribute('aria-live', 'polite');
      body.textContent = article.locale === 'en' ? 'Loading manuscript…' : '正在加载原文…';
      details.append(body);
      try {
        const sourcePath = article.sourceReading.path;
        if (!/^\/content\/knowledge\/public\/successors\/[a-z0-9-]+\/source-readings\/[a-z0-9-]+\.json$/.test(sourcePath)) throw Error('SOURCE_PATH');
        const response = await fetch(sourcePath, {signal: AbortSignal.timeout(12000)});
        if (!response.ok) throw Error('SOURCE_UNAVAILABLE');
        const source = await response.json();
        body.replaceChildren();
        for (const page of source.pages) {
          const heading=appendText(documentRef, body, 'h3', article.locale === 'en' ? `Manuscript page ${page.page} · Chinese original` : `原稿第 ${page.page} 页`);
          heading.id='manuscript-page-'+page.page;
          for (const text of page.paragraphs) appendText(documentRef, body, 'p', text);
        }
        loaded = true;
        const hash=documentRef.defaultView?.location?.hash||'';
        if(/^#manuscript(?:-page-\d+)?$/.test(hash))documentRef.getElementById(hash.slice(1))?.scrollIntoView?.();
      } catch {
        body.textContent = article.locale === 'en' ? 'The manuscript could not be loaded. Close and reopen to retry.' : '原文暂未加载成功，请收起后重新展开。';
        details.addEventListener('toggle', () => {if (!details.open) body.remove();}, {once:true});
      } finally {pending = false;}
    });
    container.append(details);
  }

  if (article.knowledgeBoundary.length) {
    container.append(renderBoundary(documentRef, article, translate));
  }

  const related = renderRelated(
    documentRef,
    article,
    publishedArticles,
    translate
  );
  if (related) {
    container.append(related);
  }
  container.append(renderExitNavigation(documentRef, article, translate));

  return container;
}
