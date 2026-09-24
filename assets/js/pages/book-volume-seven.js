import {renderBookPublicSamples} from '../knowledge/book-public-samples.js';
import { getLocale, onLocaleChange, t } from '../i18n.js';
import {bookRoute,canonicalPartsForBook,loadSevenVolumeBooks,loadSevenVolumeParts,resolveSevenVolumeBookCover} from '../web-production/public-surface-data-seven.js';
import { buildCkaEntryHref, ckaEntryLabel } from '../knowledge/cka-entry-links.js';
import {loadBook5PublicationMetadata,loadBook6PublicationMetadata} from '../knowledge/published-content.js';
import {readBookArticleProgress} from '../knowledge/reading-progress.js';
import {atlasStateFromUrl} from './civilization-atlas/atlas-url-state.js';

const root = document.querySelector('[data-wpr-book-volume]');
const bookId = document.body.dataset.bookId || root?.dataset.bookId || 'book-7';
let disposeFormation = () => {};
let renderGeneration = 0;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function partMarkup(part, locale) {
  const title = part.title?.[locale] || part.title?.en || `Part ${part.number}`;
  return `
    <article class="wpr-part-card">
      <span class="wpr-part-card__number">${String(part.number).padStart(2, '0')}</span>
      <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(t(`knowledge.production.partState.${part.content_status || 'architecture-only'}`))}</p></div>
    </article>
  `;
}

async function render() {
  if (!root) return;
  const generation = ++renderGeneration;
  disposeFormation();
  const locale = getLocale();
  try {
    const [booksRegistry, partsRegistry] = await Promise.all([
      loadSevenVolumeBooks(),
      loadSevenVolumeParts()
    ]);
    const book = booksRegistry.books.find(item => item.book_id === bookId);
    if (!book) throw new Error('WPR_BOOK_NOT_FOUND');

    const canonicalRoute = bookRoute(bookId);
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.append(canonicalLink);
    }
    canonicalLink.href = new URL(canonicalRoute, window.location.origin).href;

    const title = book.title?.[locale] || book.title?.en || bookId;
    const subtitle = book.subtitle?.[locale] || book.subtitle?.en || '';
    const parts = canonicalPartsForBook(book, partsRegistry);
    const cover = await resolveSevenVolumeBookCover(bookId);
    if(generation !== renderGeneration)return;
    document.title = `${title} — PHI OS`;
    document.documentElement.lang = locale;

    const heroVisual = cover
      ? `<img src="${escapeHtml(cover.src)}" alt="" loading="eager">`
      : `<span class="wpr-volume-fallback wpr-volume-fallback--hero" aria-hidden="true"><span>Φ</span><strong>${String(book.volume).padStart(2,'0')}</strong></span>`;

    const crossVolume = book.cross_volume_sections?.includes('part-0-core-language')
      ? `<div class="wpr-cross-volume"><span>00</span><div><strong>${escapeHtml(partsRegistry.part_0.title?.[locale] || partsRegistry.part_0.title?.en)}</strong><p>${escapeHtml(t('knowledge.production.crossVolume'))}</p></div></div>`
      : '';

    const bookOneActions = bookId === 'book-1'
      ? `<a class="knowledge-action knowledge-action--primary" href="/checkout">${escapeHtml(t('knowledge.production.bookOnePurchase'))}</a>
         <a class="knowledge-action" href="/book-one-preview">${escapeHtml(t('knowledge.production.bookOnePreview'))}</a>`
      : bookId === 'book-5'
        ? `<a class="knowledge-action knowledge-action--primary" href="#book-parts">${escapeHtml(locale==='zh-Hans'?'阅读《世界如何分化》':'Read World Differentiation')}</a>`
        : bookId === 'book-6'
          ? `<a class="knowledge-action knowledge-action--primary" href="#book-parts">${escapeHtml(locale==='zh-Hans'?'阅读《世界如何重组》':'Read Reality Reconfiguration')}</a>`
          : `<span class="wpr-status">${escapeHtml(t('knowledge.production.futureVolumeBoundary'))}</span>`;
    const readAction=['book-1','book-2','book-3','book-4'].includes(bookId)
      ? `<a class="knowledge-action knowledge-action--primary" data-book-read href="#structured-sources">${locale==='zh-Hans'?'阅读 · 来源与文章':'Read · sources and articles'}</a>` : '';
    const askHref = buildCkaEntryHref({
      entrySurface: 'BOOK',
      contextType: 'CANONICAL_VOLUME',
        contextId: book.bookCode,
        bookCode: book.bookCode,
      contextLabel: title,
      contextSummary: subtitle,
      readingPath: `${canonicalRoute}#book-parts`,
      relatedKnowledgeRef: parts.map(part => `P${part.number}`).join(',')
    });
    const askLabel = ckaEntryLabel('BOOK', locale);
    const atlasAction = bookId === 'book-5'
      ? `<a class="knowledge-action knowledge-action--primary" href="#atlas">${escapeHtml(locale==='zh-Hans'?'探索文明图谱':'Explore Civilization Atlas')}</a>`
      : bookId === 'book-6'
        ? `<a class="knowledge-action" href="#atlas">${escapeHtml(locale==='zh-Hans'?'文明重组图谱':'Reconfiguration Atlas')}</a>`
        : '';

    const persistentAtlas = bookId === 'book-5' ? document.querySelector('[data-civilization-atlas-root]') : null;
    if (persistentAtlas && root.contains(persistentAtlas)) root.insertAdjacentElement('afterend', persistentAtlas);

    root.innerHTML = `
      <section class="knowledge-hero wpr-book-hero wpr-volume-${escapeHtml(book.volume)}">
        <div class="knowledge-shell wpr-book-hero__grid">
          <div>
            <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.production.volume', { volume: book.volume }))}</p>
            <h1>${escapeHtml(title)}</h1>
            <p class="knowledge-hero__lead">${escapeHtml(subtitle)}</p>
            <p>${escapeHtml(t('knowledge.production.registryLed'))}</p>
            <div class="knowledge-actions">${readAction}${bookOneActions}${atlasAction}<a class="knowledge-action" href="${escapeHtml(askHref)}" data-cka-contextual-entry="BOOK">${escapeHtml(askLabel)}</a><a class="knowledge-action" href="/books/">${escapeHtml(locale==='zh-Hans'?'查看全部八册':'All eight volumes')}</a></div>
          </div>
          <figure class="wpr-book-cover"><div>${heroVisual}</div><figcaption>${escapeHtml(t('knowledge.production.coverBoundary'))}</figcaption></figure>
        </div>
      </section>
      <section class="knowledge-section knowledge-section--paper" id="book-parts">
        <div class="knowledge-shell">
          <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.production.architectureEyebrow'))}</p>
          <h2>${escapeHtml(t('knowledge.production.architectureTitle', { count: parts.length }))}</h2>
          ${crossVolume}
          <div class="wpr-parts-grid">${parts.map(part => partMarkup(part, locale)).join('')}${book.partAdmission==='PENDING_USER_AUTHORITY'?`<p>${locale==='zh-Hans'?'本册内容与章节安排尚待公布。':'Contents and chapter organization will be announced.'}</p>`:''}</div>
          <p class="knowledge-boundary">${escapeHtml(t('knowledge.production.ownershipBoundary'))}</p>
        </div>
      </section>
    `;

    if (bookId === 'book-5') {
      const manifest = await loadBook5PublicationMetadata();
      if (generation !== renderGeneration) return;
      const records=manifest.records.filter(r=>r.locale===locale);
      const currentSlug=readBookArticleProgress('BOOK-5');
      const contents=root.querySelector('#book-parts .knowledge-shell');
      contents.replaceChildren();
      const heading=document.createElement('h2');heading.textContent=locale==='zh-Hans'?'阅读《世界如何分化》':'Read Reality Differentiation';contents.append(heading);
      const intro=document.createElement('p');intro.textContent=locale==='zh-Hans'?'按十一部分阅读相关文章，也可在每篇文章下展开对应中文原文。':'Read the articles in eleven parts. Each article also opens its corresponding Chinese manuscript pages.';contents.append(intro);
      for (const part of manifest.parts) {
        const section=document.createElement('section');section.id='book-part-'+part.code.replace('.','-');
        const h=document.createElement('h3');h.textContent=part.title[locale];section.append(h);
        const list=document.createElement('ol');
        for (const article of records.filter(r=>r.part===part.code)) {
          const item=document.createElement('li'),link=document.createElement('a');link.href=article.href+'?locale='+locale;link.textContent=article.title;
          if(article.slug===currentSlug){link.setAttribute('aria-current','location');link.textContent+=(locale==='zh-Hans'?' · 上次阅读':' · Last read');}
          item.append(link);list.append(item);
        }
        section.append(list);contents.append(section);
      }
      const original=document.createElement('section');original.id='book-manuscript';original.className='knowledge-section';
      const originalShell=document.createElement('div');originalShell.className='knowledge-shell';original.append(originalShell);
      const originalHeading=document.createElement('h2');originalHeading.textContent=locale==='zh-Hans'?'原文目录':'Manuscript contents · Chinese original';originalShell.append(originalHeading);
      for(const part of manifest.parts){
        const group=document.createElement('details'),summary=document.createElement('summary');summary.textContent=part.title[locale];group.append(summary);
        const list=document.createElement('ul');
        for(const section of manifest.manuscriptContents||[]){if(section.part!==part.code)continue;
          const item=document.createElement('li'),link=document.createElement('a');link.href=section.href+'?locale='+locale+'#'+section.anchor;link.textContent=section.heading;item.append(link);list.append(item);
        }
        group.append(list);originalShell.append(group);
      }
      root.querySelector('#book-parts').after(original);
      const actions=root.querySelector('.knowledge-actions');
      for(const [href,label] of [['#book-manuscript',locale==='zh-Hans'?'阅读原文':'Read manuscript (Chinese)'],['#book-parts',locale==='zh-Hans'?'阅读相关文章':'Browse articles'],['/search/?q='+encodeURIComponent(locale==='zh-Hans'?'文明':'civilization'),locale==='zh-Hans'?'搜索文明与历史':'Search civilizations and history']]){
        const link=document.createElement('a');link.className='knowledge-action';link.href=href;link.textContent=label;actions.append(link);
      }
    }

    if (bookId === 'book-6') {
      const manifest = await loadBook6PublicationMetadata();
      if (generation !== renderGeneration) return;
      const records=manifest.records.filter(r=>r.locale===locale);
      const currentSlug=readBookArticleProgress('BOOK-6');
      const contents=root.querySelector('#book-parts .knowledge-shell');
      contents.replaceChildren();
      const heading=document.createElement('h2');heading.textContent=locale==='zh-Hans'?'阅读《世界如何重组》':'Read Reality Reconfiguration';contents.append(heading);
      const intro=document.createElement('p');intro.textContent=locale==='zh-Hans'?'按七个编辑分组阅读 28 篇文章；85 个书稿章节继续作为完整来源结构，不被强制压缩成 85 篇重复文章。':'Read 28 articles across seven editorial groups. All 85 manuscript sections remain the complete source structure rather than being forced into 85 duplicate articles.';contents.append(intro);
      for (const part of manifest.parts) {
        const section=document.createElement('section');section.id='book-part-'+part.code.replace('.','-');
        const h=document.createElement('h3');h.textContent=part.title[locale];section.append(h);
        const list=document.createElement('ol');
        for (const article of records.filter(r=>r.part===part.code)) {
          const item=document.createElement('li'),link=document.createElement('a');link.href=article.href+'?locale='+locale;link.textContent=article.title;
          if(article.slug===currentSlug){link.setAttribute('aria-current','location');link.textContent+=(locale==='zh-Hans'?' · 上次阅读':' · Last read');}
          item.append(link);list.append(item);
        }
        section.append(list);contents.append(section);
      }
      const original=document.createElement('section');original.id='book-manuscript';original.className='knowledge-section';
      const originalShell=document.createElement('div');originalShell.className='knowledge-shell';original.append(originalShell);
      const originalHeading=document.createElement('h2');originalHeading.textContent=locale==='zh-Hans'?'第 13 部 · 85 节书稿结构':'Part 13 · 85-section manuscript structure';originalShell.append(originalHeading);
      const originalBoundary=document.createElement('p');originalBoundary.textContent=locale==='zh-Hans'?'这里保留完整章节结构与文章映射；公开文章不会替代或改写完整书稿。':'This preserves the complete section structure and article mapping; public articles do not replace or rewrite the full manuscript.';originalShell.append(originalBoundary);
      for(const part of manifest.parts){
        const group=document.createElement('details'),summary=document.createElement('summary');summary.textContent=part.title[locale];group.append(summary);
        const list=document.createElement('ul');
        for(const section of manifest.manuscriptContents||[]){if(section.part!==part.code)continue;
          const item=document.createElement('li'),link=document.createElement('a');link.href=section.href+'?locale='+locale+'#'+section.anchor;link.textContent=(section.title?.[locale]||section.title?.en||section.section);item.append(link);list.append(item);
        }
        group.append(list);originalShell.append(group);
      }
      root.querySelector('#book-parts').after(original);
      const actions=root.querySelector('.knowledge-actions');
      for(const [href,label] of [['#book-manuscript',locale==='zh-Hans'?'查看 85 节书稿结构':'View the 85-section manuscript structure'],['#book-parts',locale==='zh-Hans'?'浏览相关文章':'Browse articles'],['#atlas',locale==='zh-Hans'?'探索文明重组图谱':'Explore Reconfiguration Atlas'],['/search/?q='+encodeURIComponent(locale==='zh-Hans'?'文明重组':'civilization reconfiguration'),locale==='zh-Hans'?'搜索重组知识':'Search reconfiguration knowledge'],['/books/reality-observation/',locale==='zh-Hans'?'继续第七册 · 世界如何被观察':'Continue to Book VII · Reality Observation']]){
        const link=document.createElement('a');link.className='knowledge-action';link.href=href;link.textContent=label;actions.append(link);
      }
    }

    // Public static samples are independent of checkout and paid delivery.
    fetch('/api/commerce-catalog').then(r=>{if(!r.ok)throw new Error('CATALOG_UNAVAILABLE');return r.json();}).then(catalog=>{
      if(generation!==renderGeneration)return;
      const product=catalog.products?.find(p=>p.category==='BOOK'&&p.publicationBookCode===book.bookCode);
      if(!product)return;
      const price=document.createElement('p');price.dataset.bookCommercePrice=product.productId;
      price.textContent=new Intl.NumberFormat(locale==='zh-Hans'?'zh-MY':'en-MY',{style:'currency',currency:product.currency}).format(product.amountMinor/100);
      const link=document.createElement('a');link.className='knowledge-action';link.href='/account/';
      link.textContent=locale==='zh-Hans'?'查看购买与交付状态':'View purchase and delivery availability';
      price.append(' · ',link);root.querySelector('.knowledge-hero__lead')?.after(price);
    }).catch(()=>{});
    fetch('/content/web-production/registries/book-public-samples-v1.json').then(r=>{if(!r.ok)throw new Error('SAMPLES_UNAVAILABLE');return r.json();}).then(registry=>{
      if(generation!==renderGeneration)return;const sample=registry.books.find(b=>b.bookId===bookId);if(!sample)return;
      const section=document.createElement('section');section.id='free-samples';section.className='knowledge-section';const shell=document.createElement('div');shell.className='knowledge-shell';section.append(shell);root.append(section);renderBookPublicSamples(shell,sample,locale);
      const link=document.createElement('a');link.className='knowledge-action';link.href='#free-samples';link.textContent=locale==='zh-Hans'?'免费预览与总结图':'Free previews and summary figures';root.querySelector('.knowledge-actions')?.append(link);
    }).catch(()=>{});

    if (bookId === 'book-1') {
      const action=document.createElement('a');action.className='knowledge-action';action.href='#explorer';action.textContent=locale==='zh-Hans'?'探索形成机制':'Explore formation';root.querySelector('.knowledge-actions')?.append(action);
      const explorer=document.createElement('section');explorer.id='explorer';explorer.className='formation-explorer';root.querySelector('.knowledge-hero')?.after(explorer);
      const {mountFormationExplorer}=await import('../knowledge/formation-explorer.js');
      const dispose=await mountFormationExplorer(explorer,locale);
      if(generation !== renderGeneration)dispose();else disposeFormation=dispose;
    }
    if (bookId === 'book-2') {
      const action=document.createElement('a');action.className='knowledge-action';action.href='#runtime-atlas';action.textContent=locale==='zh-Hans'?'探索运行互动':'Explore runtime interactions';root.querySelector('.knowledge-actions')?.append(action);
      const atlas=document.createElement('section');atlas.id='runtime-atlas';atlas.className='runtime-interaction-atlas';root.querySelector('.knowledge-hero')?.after(atlas);
      const {mountRuntimeAtlas}=await import('../knowledge/runtime-interaction-atlas.js');
      const dispose=await mountRuntimeAtlas(atlas,locale);
      if(generation !== renderGeneration)dispose();else disposeFormation=dispose;
    }
    if (bookId === 'book-3') {
      const action=document.createElement('a');action.className='knowledge-action';action.href='#maintenance';action.textContent=locale==='zh-Hans'?'探索维持与恢复':'Explore maintenance and recovery';root.querySelector('.knowledge-actions')?.append(action);
      const explorer=document.createElement('section');explorer.id='maintenance';explorer.className='maintenance-explorer';root.querySelector('.knowledge-hero')?.after(explorer);
      const {mountMaintenanceExplorer}=await import('../knowledge/maintenance-explorer.js');
      const dispose=await mountMaintenanceExplorer(explorer,locale);
      if(generation !== renderGeneration)dispose();else disposeFormation=dispose;
    }
    if (bookId === 'book-4') {
      const action=document.createElement('a');action.className='knowledge-action';action.href='#expansion';action.textContent=locale==='zh-Hans'?'探索扩展与尺度':'Explore expansion and scale';root.querySelector('.knowledge-actions')?.append(action);
      const explorer=document.createElement('section');explorer.id='expansion';explorer.className='expansion-explorer';root.querySelector('.knowledge-hero')?.after(explorer);
      const nextVolume=document.createElement('p');const nextLink=document.createElement('a');nextLink.href='/books/reality-differentiation/#atlas';nextLink.textContent=locale==='zh-Hans'?'继续阅读 Book V · 文明图谱':'Continue to Book V · Civilization Atlas';nextVolume.append(nextLink);explorer.after(nextVolume);
      const {mountExpansionExplorer}=await import('../knowledge/expansion-explorer.js');
      const dispose=await mountExpansionExplorer(explorer,locale);
      if(generation !== renderGeneration)dispose();else disposeFormation=dispose;
    }
    if (['book-1','book-2','book-3','book-4'].includes(bookId)) {
      const sources=document.createElement('section');sources.className='knowledge-section';sources.id='structured-sources';
      const shell=document.createElement('div');shell.className='knowledge-shell';sources.append(shell);root.append(sources);
      const {mountStructuredBacklinks}=await import('../knowledge/structured-backlinks.js');
      const dispose=await mountStructuredBacklinks(shell,bookId.toUpperCase(),locale);
      if(generation !== renderGeneration)dispose();else {const previous=disposeFormation;disposeFormation=()=>{previous?.();dispose();};}
    }
    if (persistentAtlas) {
      const hero = root.querySelector('.wpr-book-hero');
      if (hero) hero.insertAdjacentElement('afterend', persistentAtlas);
      const manifest=await loadBook5PublicationMetadata();
      if(generation!==renderGeneration)return;
      const reading=document.createElement('nav');reading.className='knowledge-shell knowledge-section';reading.dataset.atlasArticleReading='';
      reading.setAttribute('aria-label',locale==='zh-Hans'?'图谱相关阅读':'Related Atlas reading');persistentAtlas.after(reading);
      const refresh=()=>{
        const selected=atlasStateFromUrl(window.location.href,locale);
        const keys={cases:'primaryCaseId',world:'snapshotId',transitions:'transitionWindowId',comparison:'comparisonFamilyId',loss:'lossTypeId'};
        const key=keys[selected.activeLayer];
        const rows=manifest.records.filter(r=>r.locale===locale&&r.connections.relatedAtlasEntries.some(link=>{
          const target=atlasStateFromUrl(link.href,locale);
          return target.activeLayer===selected.activeLayer&&(key?selected[key]&&selected[key]===target[key]:selected.activeLayer==='trajectories'&&selected.trajectoryIds.some(id=>target.trajectoryIds.includes(id)));
        })).slice(0,5);
        reading.replaceChildren();
        const heading=document.createElement('h3');heading.textContent=locale==='zh-Hans'?'继续阅读第五册':'Continue reading Book V';reading.append(heading);
        for(const row of rows){const link=document.createElement('a');link.className='knowledge-action';link.href=row.href+'?locale='+locale;link.textContent=row.title;reading.append(link);}
        const contents=document.createElement('a');contents.href='#book-parts';contents.className='knowledge-action';contents.textContent=locale==='zh-Hans'?'查看全部章节与文章':'All chapters and articles';reading.append(contents);
      };
      refresh();
      const observer=new MutationObserver(refresh);observer.observe(persistentAtlas,{childList:true});
      const previous=disposeFormation;disposeFormation=()=>{previous?.();observer.disconnect();};
    }
  } catch {
    root.innerHTML = `<section class="knowledge-section"><div class="knowledge-shell"><p>${escapeHtml(t('knowledge.production.sourceUnavailable'))}</p></div></section>`;
  }
}

onLocaleChange(render);
render();
