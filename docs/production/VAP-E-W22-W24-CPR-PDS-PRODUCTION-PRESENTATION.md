# VAP-E｜CPR + PDS Production Presentation

Baseline: `807efc359a0d1477bc697044f55970fc5e6e8500`

## Outcome

VAP-W22 activates the first CPR production presentation:

`PRESENTATION-ARTICLE-KN-PREFACE-001-ZH-HANS-v1`

The production record lives under `content/production/cpr`. The frozen CPR canonical registry remains unchanged with `productionRecords: []`.

## Authority boundary

CPR decides composition, placement, information density, surface, and responsive projection. It consumes the published Article, published CAR Figure, projected Knowledge relationships, reading continuity, locale, and audience by reference.

CPR does not create or change Knowledge, select or change Meaning, approve an Asset, or infer publication or Runtime state.

## ARTICLE_PAGE

VAP-W23 establishes the production `ARTICLE_PAGE` order:

1. Breadcrumb / Reading Context
2. Article Header: Part / Book, Canonical Title, Summary / Lead, Reading metadata
3. Optional Hero
4. Article Body: Section, Figure, Callout, Diagram
5. Knowledge Context: Canonical Node, Related Nodes, Sources where public
6. Continuity: Previous / Next
7. Footer

The instance places the published mechanism Diagram after published fragment `FRAGMENT-KN-PREFACE-001-ZH-HANS-006`. The placement is a presentation reference; it does not mutate the Article body.

## PDS ownership

Typography, spacing, grid, container and figure width, caption, callout, color, radius, responsive behavior, focus, contrast, and motion remain PDS-owned. The template and instance reference existing PDS contracts, tokens, components, and styles. No Article-local CSS is created.

## Responsive and locale acceptance

VAP-W24 covers 360, 768, and 1440 pixels in `en` and `zh-Hans`. Semantic order is invariant and horizontal overflow is forbidden.

The Figure is published only for `zh-Hans`, so the `zh-Hans` projection uses it with source-provided alt/caption, intrinsic dimensions, full-content containment, mobile block reflow, and a non-color-only explanation requirement.

The `en` responsive template is accepted at all three widths, but its production projection remains fail-closed: the current upstream `en` Published Article contains mixed-locale body content and no `en` Published Figure exists. Missing authority does not authorize CPR to translate content or reuse the `zh-Hans` Figure.

Run:

```sh
npm run check:vap-e
```
