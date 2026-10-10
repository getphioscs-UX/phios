# CAR Human Asset Review Pack

Candidate: `CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-002`

Candidate digest: `b6b1b77c3c7317d3e5d5222777298062144b50914a4eab92452adbab5e590cef`

Brief: `CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-002`

Reviewer authority: `TL`

## Review dimensions

- Semantic accuracy: does the visual express knowledge expression, material infrastructure, organizational coordination, feedback scaling and AI capability emergence without adding a new claim?
- Knowledge traceability: is the visual attributable to `KN-PREFACE-001` and the five registered Production Meaning references?
- Brand compliance: is it suitable for PHI OS Published Knowledge Experience and free of third-party marks or Human Design imagery?
- Accessibility: are hierarchy, boundaries and relationships understandable without color alone?
- Rights/license: is this ChatGPT-generated candidate cleared for PHI OS use?

## Human decisions

Accept only when all five dimensions pass:

```powershell
npm run car:review-candidate -- CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-002 --reviewer TL --decision accept --semantic pass --traceability pass --brand pass --accessibility pass --rights pass
```

Request changes:

```powershell
npm run car:review-candidate -- CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-002 --reviewer TL --decision changes_required --notes "Describe the required changes"
```

Reject:

```powershell
npm run car:review-candidate -- CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-002 --reviewer TL --decision reject --notes "State the rejection reason"
```

Review acceptance does not create Asset Approval, Media, Published Asset, Article release or deployment.
