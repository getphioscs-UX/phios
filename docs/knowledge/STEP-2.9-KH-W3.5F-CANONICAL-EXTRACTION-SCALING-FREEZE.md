# STEP 2.9｜KH-W3.5F Canonical Extraction and Scaling Freeze

## Frozen hierarchy

```text
Knowledge Domain
↓
Knowledge Theme
↓
Canonical Knowledge Node
↓
Supporting Question
↓
Search Alias
```

Only an independent, reusable mechanism may become a Canonical Knowledge
Node. A page, heading, question, paragraph, section or search phrase does not
create a node by itself.

## Part scaling boundary

| Canonical Nodes in one Part | Required action |
| ---: | --- |
| 18 | Flexible granularity review |
| 24 | Mandatory duplication, relationship and boundary audit |
| 30 | Stop further Registry population |

The threshold is triggered at the stated count. A Part at the hard boundary
cannot continue population until the content is shown to contain multiple
Knowledge Domains and the Domain boundary is formally reviewed.

## Production boundary

```text
Registry Presence ≠ Production Requirement
```

Registry population and content production remain separate. A valid node may
remain planned without an article, translation, video, audio item or public
page. The maximum active article queue remains eight.

## Frozen state

```text
KH-W3.5F-Frozen
```

Acceptance:

```bash
npm run check:kh-w3.5f
```
