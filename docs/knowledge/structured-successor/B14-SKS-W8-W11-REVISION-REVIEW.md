# Book I revision reconciliation and W8–W11 review

Historical review of the 404-page revision. On baseline e49e5ff8, the local PDF is a newer 406-page revision (SHA-256 e36929bf896148b37c6719e6c8542ceeebb02dc35416fbb25a417ba3ec59eb53). The current reconciliation JSON was regenerated against that file: 269 unique heading candidates, four ambiguous headings and two unmatched labels. Page numbers and proposed decisions below belong only to the historical 404-page source and MUST NOT be applied to the 406-page file. The user has confirmed correction of the five-volume prose and Domain III = Coexistence; no canonical identity is renamed from old findings.

Baseline: `6455ef394c88a3affb9f20a6aed352bc476ec906`.

The user confirmed the desktop PDF as the revision to reconcile. This does not approve each new claim, translation, or canonical mapping.

## Source identity

The registered PDF is 402 pages / 122,565,526 bytes, SHA-256 `7f7ed51199302b83d5bb5e48224a5f5995123171645e820925508fb31d97174d`.
The revision is 404 pages / 225,931,180 bytes, SHA-256 `052c37192bd5fd78781491b119b1746a959f8cf762d3fa828936a51a9064a1da`.

All revision pages were extracted with pypdf. Whitespace normalization was necessary for heading search because Chinese characters are separated by spaces in the text layer. Original extracted page digests are retained in `book-1-revision-reconciliation-v1.json`; no manuscript body is committed.

Of 275 historical segments, 268 have a unique heading-page candidate, five are ambiguous and two have no exact heading match. The seven exceptions now have proposed disambiguations in `book-1-revision-editorial-decisions-v1.json`. A matching heading does not establish matching body text or authorize transfer of a canonical binding. Full old PDF bytes were unavailable, so this is not a body-to-body diff.

Two editorial issues require attention before source promotion: page 9 still describes the retired five-volume arrangement; page 190 uses Domain III Coexistence while Figure 3A on page 218 uses Domain III Participation. Neither is silently propagated into public runtime ownership. The PDF itself has not been modified.

## W8 candidate decisions

| Candidate | Revision evidence (PDF page numbers) | Proposed disposition |
| --- | --- | --- |
| Difference → Constraint → Structure | 45–46 explain why differences alone do not persist, and how constraint selects sustainable possibilities. Figure 1A, page 69, visually confirms the order. | Source-supported candidate; reconcile the three existing objects against revised sections before admission. |
| Full structure formation | Figure 1A, page 69: Difference, Constraint, Structure, Topology, Configuration, Continuity, Compression, SDU, SCU, Region, Network. | Use this source-native sequence as a separate candidate. Do not replace canonical G1–G16 or collapse structural units into universal types. |
| Runtime-state formation | Figure 3B, page 253: Coordinate → Motion → Activation → Reality State. | Distinct runtime-state candidate, not an extension of the structure sequence. Figure text extracted; visual verification still pending. |
| Condition → Signal → Interaction → Pattern → Structure → Runtime → Reality | No reviewed paragraph or figure in this pass establishes this exact seven-step sequence. | Remains withheld; do not synthesize it from scattered term occurrences. |

Figure 1A was rendered and visually inspected; its order differs from text-layer reading order around Continuity / Compression. Diagram order must therefore be reviewed visually before sequence admission.

## W9 candidate decisions

| Pair | Evidence examined | Remaining work |
| --- | --- | --- |
| Capacity / Load | 303–305 explain system capacity, energy/attention/time/complexity constraints and demands approaching or exceeding capacity; 331 discusses increased processing load with resolution. | Strong candidate: capacity describes sustainable handling; load describes demands borne. Reconcile terminology 负荷 / 负载 and object/node ownership. No numerical threshold or personal diagnosis follows. |
| Pressure / Constraint | 45–46 explain constraint; pressure differences are examples of differences that dissipate. | These paragraphs do not independently define general Pressure. Keep pair withheld until its definition and scope are sourced. |
| Signal / Evidence | 30 concerns neural signals; 99 concerns attention to signals; 133 concerns projection distortion. | Occurrence is not definition. Do not equate signal with evidence or use introductory descriptions of other volumes as Book I authority. |
| State / Pattern | 253 distinguishes current state formation and repeated motion patterns. | Need full section review to establish the comparison dimensions and boundaries. |
| Change / Transition | No dedicated comparison verified in this pass. | Keep withheld; do not infer transition simply from any change. |

Page 305 also explicitly distinguishes Carrier Capability (what kinds of operation are possible) from Carrier Capacity (how much, how intensely, and how long they can persist). This is a possible additional comparison, not a substitute silently relabelled Capacity / Load.

## W10–W11 verification

The existing Explorer remains on the registered source preview until revised mappings are admitted. All 11 Explorer links resolve to their corresponding server-owned objects. Added negative tests reject retired/withheld/unsupported/wrong-book objects and missing provenance. Related source IDs are deduplicated and filtered through the same eligibility rule. Missing assets, invalid JSON and fetch failures return no structured source.

These checks do not demonstrate a deployed paid Ask transaction, production R2 delivery or human acceptance. Existing contextual Ask and Atlas regression gates remain required.

## Reproduction and remaining acceptance

1. Run `node scripts/check-b14-sks-book1-source.mjs <private-pdf> --record`. A revision mismatch intentionally exits 1.
2. Run `python scripts/audit-b14-sks-book1-revision.py <private-pdf>` with pypdf available. It writes page digests and candidate headings only.
3. Resolve the seven non-unique/missing heading candidates, review changed section boundaries and bodies, and create a versioned manuscript-binding successor through the existing owner.
4. Admit reviewed W8/W9 candidates with explicit new-source provenance, then rebuild the public projection and rerun `node scripts/check-b14-sks-book1.mjs` plus contextual Ask and Atlas gates.
5. Complete full-page and paid Ask acceptance separately. No stage or human approval is inferred from heading matching.
