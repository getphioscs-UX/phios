# Zi Wei Publication IR adapter

Implementation: [ziwei-publication-adapter.js](../../../functions/personal-reading/narrative/ziwei-publication-adapter.js). It consumes the existing trusted calculation/customer runtime and accepted PRO-R2 semantics, then calls the existing `buildReportPublicationIrV2()` and `assertPublicationIrV2Preservation()`.

Flow: governed controlled input → existing calculation / current envelope → normalized subject evidence → contextual claims → section brief → shared Publication IR → representative prose.

The normalized object retains palaces, placements, primary/support stars, transformations, topology, patterns, timing, conditions, counterweights and source refs. The method claim schema includes every required field plus subject fingerprint. It is an adapter schema, not a parallel publication framework.

Claim IDs are independent of locale. Each claim carries structure, bilingual admitted meanings, conditions, counterweights, observable possibilities, timing, navigation, four authority layers, conditional confidence, unknowns and prohibited extensions. Publication blocks reference these IDs and carry the existing shared IR's source lineage and restrictions.

The seven representative claim classes are BASELINE_STRUCTURE, CONDITIONAL_EXPRESSION, COUNTERWEIGHT, OBSERVABLE_EXPRESSION, TIMING_MODIFIER, NAVIGATION_IMPLICATION and UNKNOWN. The canon also defines dominant/supporting signals and structural tension; the prototype does not manufacture those merely to exercise every enum. Native relationship operators are not inferred from topology; shared publication operators retain their own governed vocabulary.

Only S02/S04/S05 prose generation is enabled. Other sections are registered and evidence is normalized for the whole chart, but prose generation fails closed outside this run's explicit scope. The unknown claim preserves unsupported timing and brightness internally; customers receive prose rather than technical status enums.

## Validation

`npm run build:ziwei-semantic-production` regenerates six requested canonical machine files, controlled inputs, twelve section JSON files and the review.

`npm run check:ziwei-publication-ir` validates 84 claims, schema/source closure, unchanged authority hashes, subject/palace/star binding, unsupported timing exclusion, unknown preservation, claim parity across locales and source-preserving shared IR. Negative tests reject wrong subjects, unbound palaces/stars, monthly timing, lost unknowns/boundaries and broken claim references.

Differentiation compares actual semantic dimensions, selected structural pairs, navigation and prose. It also removes star/palace names and numbers before measuring English trigram overlap; the result remains well below the rejection threshold. This avoids treating subject IDs or star-name substitution as substantive differentiation. [QA results](semantic-production/qa-results.json) contains measured values.

The evidence panel in the review is review-only and can be hidden using customer mode. No internal authority metadata is embedded in the narrative paragraphs. Human review remains pending; production admission is not granted.

