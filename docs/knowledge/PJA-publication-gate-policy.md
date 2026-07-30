# PJA Publication Gate Policy

## New structured Articles

A new structured canonical Article may enter public projection only when:

1. Its Canonical Node exists and the Registry next Node matches.
2. Article JSON validates and remains the only body authority.
3. Locale Registry, Article Asset and Article JSON each have
   `content_reviewed / approved / published`.
4. The Review record matches Node, locale, Asset and Article version.
5. Claim and Source set versions match the Review.
6. Overall Decision is human-approved.
7. Every required Review dimension is approved or explicitly not applicable.
8. Every active high or critical Claim is human-approved.
9. Every required high/critical source mapping is eligible and reviewed.
10. No unresolved major or critical Finding remains.
11. Public source references resolve only to `public_citation_allowed` or
    `public_metadata_only`.
12. Public visuals are registered, reviewed and published.
13. No raw HTML, unknown Block or executable capability exists.
14. English is not published before canonical Chinese approval and English
    terminology/semantic parity approval.

Schema validity, file presence, source count, build success and production
reachability do not grant approval.

## Rejected state combinations

The validator rejects draft or unreviewed publication, missing Review records,
AI/validator approval, missing reviewer evidence, version mismatch, unsupported
high Claims, unreviewed sources, deprecated sources, restricted public
projection, unresolved major/critical Findings, next-Node mismatch and English
preceding Chinese.

## Legacy compatibility

The six PJA-W1 legacy Articles predate standalone W2C governance records.
PJA-W2C leaves their frozen locale/Asset/Article triplet gate unchanged and
does not fabricate retrospective human identities or dates. Any explicit
migration must be human-run and version-bound before those Articles adopt the
new gate.

The W2C check enforces the full new gate on structured governance fixtures and
future governance records. Runtime publication wiring and public source
metadata projection are future renderer/publication work; internal Review or
Claim data must never be loaded by the public renderer.

## Public projection boundary

The public surface may show Article content, Knowledge Boundary, public Assets,
related published Nodes and allowed bibliographic metadata. It may not expose
Claim Codes, dossiers, support assessments, contrary-evidence notes, Findings,
reviewer identity, internal locators, accepted risk or paid book content.
