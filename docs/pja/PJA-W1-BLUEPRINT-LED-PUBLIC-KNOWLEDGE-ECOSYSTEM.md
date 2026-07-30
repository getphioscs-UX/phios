# PJA-W1 Blueprint-led Public Knowledge Ecosystem

Freeze: `PJA-W1-v1.1.0-Blueprint-led`

Baseline: `getphioscs-UX/phios` · `main` · `fd022414b5add0acdef5a0e45f8f890a3addf087`

## Release decision

PJA-W1 publishes a minimum viable Knowledge ecosystem from the frozen Book I Knowledge Blueprint. It does not expand the Canonical Knowledge Registry.

The Blueprint recommends eight Wave 1 candidates. Three are already registered, frozen Canonical Nodes and are published now:

| Node | Chinese Canonical article | English |
|---|---|---|
| `KN-PREFACE-004` | 为什么需要 PHI OS？ | published because `requiredPublicLanguages` includes `en` |
| `KN-PREFACE-010` | 为什么解释结果不等于理解现实？ | published because `requiredPublicLanguages` includes `en` |
| `KN-PREFACE-013` | 为什么导航必须先辨认现实位置？ | published because `requiredPublicLanguages` includes `en` |

The remaining five Wave 1 candidates are planned Blueprint nodes but are not present in `nodes.json`. They remain deferred and invisible. `Registry Presence ≠ Production Requirement`, and Blueprint presence does not authorize PJA to create Canonical identity.

## Publication authority

| Decision | Existing authority |
|---|---|
| Node identity and required languages | `content/knowledge/registry/nodes.json` |
| Production planning | `content/knowledge/blueprints/book-1-knowledge-blueprint.json` |
| Locale publication state | `content/knowledge/registry/localized-content.json` |
| Article and Master Media Post state | `content/knowledge/registry/assets.json` |
| Public rendering | `assets/js/knowledge/published-content.js` |

The public loader is a read-only projection. It requires the Node to be frozen and the Locale, Asset and content file to all be reviewed, approved and published. There is no fallback to planned, draft, reviewing, retired or unregistered content.

## Public ecosystem

The shared main navigation is `Discover`, `Knowledge`, `Explore`, `Services`, `About`. `Sign In` and `Start a Reality Journey` are auxiliary routes in the same desktop and mobile shell.

Published articles are available through:

- Home
- Knowledge Hub
- Articles
- Book I
- Thesis
- Reality Atlas

Each article offers several real exits: continue reading, Book I, Reality Atlas, a local save-for-later preference, leave, or learn about the Reality Journey. `relatedServices` remains empty; a service is not the default conclusion of public education.

## Boundary preservation

- Chinese is Canonical; English is published only because all three active Nodes require it.
- Public articles provide general education, not personal Reading, diagnosis, recommendation or long-form individual analysis.
- Public Knowledge makes no case-specific Provider or OpenAI call.
- Browser save state grants no Product, Payment, Entitlement, Journey, Workspace or Runtime state.
- The 13 Canonical Nodes, six Themes, 12 Registry files and 12 Registry schemas remain the same.
- No D1 migration, Runtime authority, Product authority, Entitlement authority or Provider Cost authority changes.
- Knowledge remains available alongside, not in front of, PWS and Commercial Runtime.

## Deferred scope

Questions, Videos, Audio, Research, Learning Paths, Knowledge Graph and Advanced Search Aliases remain deferred. Figures remain visible because registered public figure content already exists.

Acceptance command:

```text
npm run check:pja-w1
```
