// Existing BRCL declarations shared only for render-owner arbitration.
// Asset resolution and public acceptance stay in the existing unified resolvers.
export const BRCL_VISUAL_SURFACES={
  ABOUT:{hero:'HERO-001',ill:'ILL-003',kicker:['A connected system','一个连接起来的系统'],title:['Books explain the model. The platform applies it. The Academy builds capability.','书籍解释模型，平台把它应用于现实，Academy 建立持续使用这种能力。'],copy:['PHI OS connects research, public knowledge, Reality Navigation and professional boundaries without collapsing them into one authority.','PHI OS 将研究、公共知识、Reality Navigation 与专业边界连接起来，但不会把它们混成单一权威。']},
  RESEARCH:{hero:'HERO-001',ill:'ILL-001',kicker:['Research & evidence','研究与证据'],title:['Research should make the limits of an interpretation easier to see.','研究应让一种解释的边界更容易被看见。'],copy:['PHI OS studies how different lenses reveal parts of reality, where they diverge, and how evidence and uncertainty can remain visible across time.','PHI OS 研究不同视角如何揭示现实的一部分、它们在哪里分歧，以及证据与不确定性如何在时间中保持可见。']},
  COMMERCE:{hero:'HERO-018',ill:'ILL-009',kicker:['Access with clear boundaries','清楚边界下的访问'],title:['Know what you are receiving before you continue.','在继续之前，先清楚知道你会得到什么。'],copy:['Access, payment, delivery and refund terms remain separate from knowledge, Reality and professional judgment.','访问、付款、交付与退款条款，与知识、Reality 及专业判断保持分离。']},
  READER:{hero:'HERO-016',ill:'ILL-007',kicker:['Human reading boundary','人类阅读边界'],title:['A reader can contribute perspective without becoming hidden authority.','Reader 可以提供视角，但不会成为隐藏的权威。'],copy:['Scope, consent, data sharing and responsibility remain visible before a professional or external reader enters the work.','在专业人士或 External Reader 进入之前，范围、同意、数据分享与责任必须保持可见。']},
  LEGAL:{hero:'HERO-017',ill:'ILL-010',kicker:['Trust is part of the product','信任本身就是产品的一部分'],title:['Privacy, AI use, terms and policy should remain readable at the moment they matter.','隐私、AI 使用、条款与政策，应在真正需要时保持可读。'],copy:['These pages state the boundaries that presentation, automation and professional services must not silently cross.','这些页面明确界定 presentation、自动化与专业服务不能静默跨越的边界。']}
};

// Functional access/form panels keep their original block layout and light surface.
// Their already registered standalone masthead owns the Hero; editorial headers
// continue using BRCL's existing background composition. No new renderer or asset.
export function brclOwnsEditorialHero(main){const hero=main?.querySelector(':scope > section, :scope > .legal-hero, :scope > .checkout-hero')||main?.firstElementChild;return !!hero&&!hero.matches('.access-panel,.checkout-panel');}
