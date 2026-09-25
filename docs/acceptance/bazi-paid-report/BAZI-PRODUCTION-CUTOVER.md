# Production cutover

## Current authority

Canonical BaZi paid-report publication is **STATIC + DETERMINISTIC**.

Production customer reports do not require T3 snapshots, bilingual T3 parity, provider generation, or T3 human acceptance.

### Static publication authority

The following are fixed bilingual publication content and must not be provider-generated or overwritten by T3:

- cover / front matter already frozen by the publication system;
- all 10 section opener pages;
- all 10 section Key Insights pages;
- Method & Appendix explanatory pages.

### Deterministic personalized authority

Customer-specific chart and narrative pages are assembled from the admitted BaZi engine and existing governed interpretation layers. They may change with the customer's chart or resolved temporal context, but they do not require OpenAI/provider prose generation.

This includes chart structure, Ten Gods, Day Master carrying conditions, pattern paths, pillar relationships, career, wealth, relationship, wellbeing, timing and integrated guidance where source data is available.

### T3 status

T3 is retained only as historical/experimental editorial infrastructure. Existing S02 acceptance/rejection artifacts remain evidence of the earlier approach but are not publication authority.

The QA endpoint must not spend provider calls unless `BAZI_T3_EDITORIAL_EXPERIMENT=enabled` is explicitly configured. A configured OpenAI key alone does not activate T3.

Production acceptance must therefore test the static/deterministic report itself: bilingual rendering, deterministic repeatability, chart/timing correctness, page-family budgets, browser/PDF output, accessibility and customer-visible content. It must not wait for S02–S09 T3 generation.
