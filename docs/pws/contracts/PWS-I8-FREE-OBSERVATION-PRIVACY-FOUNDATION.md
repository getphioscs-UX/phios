# PWS-I8 Free Observation Privacy Foundation

Status: **PWS-I8-Free-Observation-Privacy-Foundation-v1.0.0-Frozen**  
Programme: **PHASE 4 — Free Explore Foundation**  
Step: **4.1**  
Baseline: `getphioscs-UX/phios` `main@1c59299a64f7ddcd5dd2cbfe4ee56beff5f04d72`

## Foundation decision

Free Observation is a bounded, anonymous browser projection. It can provide
general orientation from preset choices, but it does not create a formal
Journey, Evidence, Runtime Memory, Assignment, Professional Queue item,
Entitlement or Provider request.

Consent and Privacy remain owned by PWS-I8. The public page has
`writeAuthority: none`; browser-local preference storage is not a canonical
Consent record and is not a new Runtime source of truth.

## Local-first data model

Saving is optional and requires the user to select **Save locally**. Unsaved
results remain in page memory only.

| Boundary | Frozen behaviour |
| --- | --- |
| Storage location | current browser `localStorage` only |
| Identity | anonymous; no account or identity field |
| Input | allowlisted preset radio choices only |
| Free text and files | unavailable |
| Retention | 30 days, then pruned on local read |
| Capacity | maximum 12 records |
| User control | delete one or clear all |
| Sync | unavailable |

The record allowlist is limited to the local schema and record identifier,
creation and expiry timestamps, three preset selections, translation keys for
bounded orientation, and explicit false/anonymous boundary flags. Unknown
stored fields are discarded during normalization.

The UI does not accept names, email addresses, account or Journey identifiers,
contact details, government identifiers, health or financial records,
credentials, free text or files.

## Server upload gate

Server upload is unavailable in Step 4.1. The page performs no `fetch`, creates
no endpoint and cannot infer consent from a local save.

Any later upload capability must be a separate PWS-I8-controlled operation
with all of the following visible before an affirmative action:

1. stated purpose;
2. exact field scope;
3. retention and deletion terms;
4. revocation path;
5. canonical Consent validation and persistence outside the public page.

A browser consent draft is preparatory only and never creates canonical
Consent. The local module rejects server preparation while upload remains
unavailable.

## Public experience

`free-observation.html` provides:

- the local/privacy boundary before interaction;
- three groups of broad preset choices;
- general, non-individual orientation with unknowns preserved;
- explicit local save, delete-one and clear-all controls;
- a visible inactive server-upload boundary;
- neutral exits to published Articles, Reality Demo, Reality Journey or Home.

It does not default to a service route. The Reality Demo links to Free
Observation as an optional local continuation; the frozen primary navigation
taxonomy is unchanged.

The page ships in Chinese and English, keeps controls at least 44px high, and
defines responsive layouts for 360px, 768px and 1440px acceptance. Reduced
motion is respected.

## Preservation

This foundation adds no D1 migration, API endpoint, Runtime schema,
Runtime persistence, Product, Entitlement, Professional Queue or Provider
change. Existing paid Journey and Professional Workspace execution remain
unblocked and unchanged.

## Acceptance

Run:

```text
npm run check:pws-i8-free-observation
```

The gate verifies the local data contract and pruning/clearing behaviour,
upload refusal, PWS-I8 ownership, formal-system separation, no sensitive input,
bilingual surface, PJA page mapping, migration preservation and package wiring.
