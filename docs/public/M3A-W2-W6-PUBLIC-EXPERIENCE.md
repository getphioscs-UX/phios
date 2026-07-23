# M3A-W2–W6 Public Experience

This increment turns the public PHI OS surface into a coherent route for a
first-time visitor while preserving the M2 Runtime and infrastructure
contracts.

## M3A-W2 · Global Navigation

`assets/js/public-shell.js` is the single source for the public Header, mobile
navigation, language controls and Footer. The frozen primary order is:

1. Discover
2. Knowledge
3. Reality Journey
4. Professional
5. About
6. Language

The primary Footer route is Thesis, Books, Atlas, Reality Journey, Services,
Privacy, Terms and Contact. AI Disclosure and Professional Boundary are
secondary trust links.

The language controls continue to use the existing `phiOSLocale` contract.
They do not introduce another locale store.

## M3A-W3 · Home / Discover

`index.html` now begins with the public category position:

- Reality has structure.
- Reality can be understood.
- Reality can be navigated.

It continues through the three public questions, three entry routes, Reality
Navigation overview, ecosystem preview and a bounded Book I preview.

## M3A-W4 · About

`about.html` preserves and reorganizes the earlier research narrative into six
sections:

- Why PHI OS
- Research Foundation
- Three Books
- Fourteen-Part Architecture
- Platform
- Future Ecosystem

The page includes the Research → Thesis → Books → Runtime Engine → Platform →
Ecosystem timeline and a responsive, bilingual Figure V.2.

## M3A-W5 · Reality Demo

`reality-demo.html` contains:

- a fixed Watch Demo from Observed Change to Navigation;
- three interactive Evidence cards;
- a one-sentence Light Try;
- a full Reality Journey conversion route.

`assets/js/pages/reality-demo.js` is intentionally self-contained. It makes no
API request and uses no session storage, local storage, Runtime Kernel or
Runtime Memory writer. The output exists only in the current DOM.

## M3A-W6 · Legal and Trust

The public trust surface includes:

- `privacy.html`
- `terms.html`
- `ai-disclosure.html`
- `professional-boundary.html`
- `contact.html`

The disclosure states that the experience may be AI-assisted and is not
medical diagnosis, legal advice or a financial recommendation.

## Acceptance

Run:

```bash
npm run check:m3a-public-experience
npm run check
```

After Cloudflare Pages deploys the commit, verify both English and Chinese at
desktop and mobile widths, including:

- mobile menu open, close, Escape and link selection;
- language persistence across Discover, About, Demo and Trust pages;
- Evidence card selection and Light Try output;
- the Full Reality Journey CTA;
- `/privacy`, `/terms`, `/ai-disclosure`, `/professional-boundary` and
  `/contact`.

The existing `RUNTIME_DB` D1 binding and M2-W9 infrastructure test path remain
unchanged.
