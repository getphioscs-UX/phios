# PJA-W2 Free Explore and Rule Navigation

## Outcome

PJA-W2 adds a six-stage, pre-payment exploration experience to the existing
`/explore` surface:

```text
Question
→ Context
→ Concept
→ Example
→ Reflection
→ Navigation
```

The existing Reality Atlas remains on the same page below Free Explore. No new
top-level route, second Knowledge Source or formal Runtime entry is introduced.

## Merged baseline reconciliation

The implementation is reconciled on `main@7ef2c23`, where PJA-W2C governance
already exists. Free Explore does not duplicate or read Claim, Source or
Editorial Review governance objects in the public browser.

The six legacy PJA-W1 Articles remain on their frozen W1 publication gate until
an explicit human migration. Any new structured Article remains subject to the
PJA-W2C publication gate. Internal Claim Codes, support assessments, Findings,
reviewer identities, accepted risk and private source locations are not
projected into Free Explore.

The acceptance order is:

```text
PJA-W2C
→ PWS-I8
→ PWS-I9
→ PJA-W2
```

## Rule authority

Free Explore projects the frozen PWS-I9 deterministic rule engine. The
canonical server import remains:

```text
functions/pws/intelligence/rule-engine.js
```

The implementation is shared with the browser through:

```text
assets/js/modules/pws-i9-rule-engine-core.js
```

Both paths execute the same rule code. The public controller reads only the
frozen Concept and Knowledge registries. It does not call a case Provider,
persist a canonical Question Route or infer a classification when registries
are unavailable.

Matched article routes are rendered only when the locale content and article
asset are all `content_reviewed`, `approved` and `published`.

## Pre-payment boundary

The surface accepts preset selections for question, theme, context, content
preference, depth and reflection. It contains no free-text or file field.

It does not:

- collect a complete life story;
- create formal Evidence or Reconstruction;
- generate an individual Reading;
- invoke an individual Provider;
- create a Professional Assignment or queue entry.

Theme, context and preference choices control presentation only. They do not
change PWS-I9 rule authority or become case evidence.

## Local save

“Later” is always available, including for a partial draft. Saving is explicit
and writes a strictly normalized preset-only record to this browser:

```text
schema  phi-os.pja.free-explore.local.v1
key     phiOSFreeExploreSessions.v1
limit   8 records
expiry  30 days
```

Records remain anonymous, clearable and local-only. Unknown fields are removed
when loading. A saved draft cannot silently become a Journey, Evidence,
Reading, Assignment or Provider request.

## Navigation

Navigation may show Articles, Figures, Books, Atlas, Free Observation, Reality
Journey Pass information and Professional Service information. Videos remain
an allowed route family but are not displayed until a matching reviewed and
published video is registered.

Knowledge and free observation appear before paid or professional information.
Professional Service Information remains neutral and last. It is never the
only route or the default recommendation.

At every stage the user can:

```text
continue free exploration
leave
save and return later
```

## Failure behavior

Registry or rule loading failure is fail-closed: the interface reports routing
as unavailable, creates no inferred classification, and keeps free exits and
general public knowledge routes available.

## Verification

Run:

```bash
npm run check:pja-w2
npm run check:pws-i9-rule-engine
npm run check:pja-w2c
npm run check:i18n
```
