# VAP-W12-W19 | CAR Production Activation

This layer activates production use of the existing frozen Canonical Asset Runtime without replacing CAR, CMR, Knowledge Authority, PDS, Provider Routing, or Publication authority.

## Commands

```powershell
npm run car:build-brief -- KN-PREFACE-001 --type mechanism_diagram --locale zh-Hans
npm run car:validate-brief -- CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-001
npm run car:export-chatgpt -- CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-001
npm run car:import-candidate -- CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-001 --file ".\figure.webp" --model "user-recorded-model"
npm run car:review-candidate -- CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-001 --reviewer TL --decision accept --semantic pass --traceability pass --brand pass --accessibility pass --rights pass
npm run car:approve-candidate -- CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-001 --approver TL --decision approved
npm run car:materialize-media -- CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-001 --alt "..." --rights owned --accessibility passed
npm run car:publish-asset -- CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-001 --surface WEBSITE
```

`hero_illustration` is also accepted by `car:build-brief`; it maps to registered CAR `FIGURE` while the ChatGPT adapter labels the external production task `HERO_ILLUSTRATION`. `mechanism_diagram` maps to registered CAR `DIAGRAM` and external label `MECHANISM_DIAGRAM`.

## Authority boundaries

- CAB is deterministic and must satisfy the existing `canonical-asset-brief-v1.schema.json` exactly.
- `mustEstablish` is derived verbatim from Published Knowledge fragments; mechanism/domain concepts come from Canonical Assembly metadata.
- Missing Meaning authority, Published coverage, Locale, CAR asset type, PDS reference, or source digest fails closed.
- The KN-PREFACE-001 pilot reuses the exact legacy CAR-W2 pilot meaning binding through an explicit bridge. The bridge creates no Canonical Meaning and may not generalize to another node.
- ChatGPT is external manual production only: `providerLineage.mode=external_manual`, `providerCode=OPENAI_CHATGPT`.
- Candidate is not Review; Review is not Approval; Approval is not Publication.
- `changes_required` cannot be approved.
- Media materialization requires an accepted review, approved approval, cleared/owned/licensed rights, passed accessibility, and a safe `.webp`, `.avif`, or `.svg` public path under `/assets/`.
- Published Asset requires the complete CAR lifecycle and records the existing CAR publication object inside the production projection.
