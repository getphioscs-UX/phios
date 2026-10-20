# World Answer Contract · Gate 2B successor
Design candidate; Gate3 NOT_AUTHORIZED.

Classify each requested claim, not just the entire question:

| Class | Required evidence | Permitted answer |
|---|---|---|
| A mechanism | Admitted published passages supporting the causal/structural connection | Answer directly with attributed explanation, conditions, uncertainty. Optional region/year stays context, never becomes an empirical assertion. Missing B observations cannot suppress supported A. |
| B fact | Exact region, period, indicator definition, unit, revision, authority and retrieval time | Give verified value only when matched. Otherwise identify missing observation, retain any independently supported A explanation. |
| C comparison | Multiple admissible facts with compatible periods, units, populations and definitions | Compare aligned claims; identify unmatched dimensions. General mechanisms may be explained independently. No ranking from missing values. |
| D insufficient | No adequate admissible support for the requested claim | State exactly what cannot be answered; offer relevant available reading or a specific evidence request. No generic filler or unrelated fixed recommendations. |

Answer envelope: originalQuestion; normalizedIntent; selectedRegion/year/topic; claimType A/B/C/D; directAnswer; claim-level supports with sourceId, canonicalURL, locale, sourceVersion, SHA256, section/JSON pointer; evidenceKind (observed fact / published interpretation / conditional inference); applicability; missingInputs; retrievalState; meaningfulVisual; relevantFurtherReading; followUpContext. Empty sections omitted.

A quoted or paraphrased passage must actually support its linked claim. A source's publishedAt is not data vintage. A general theory is not proof of current conditions. A map locates; an explanatory diagram illustrates; neither supplies missing statistics. Unsupported subclaims are withheld without discarding supported subclaims.

Mixed oil question with Malaysia 2024: A explains transport/industry/logistics cost transmission; B remains UNKNOWN for local prices, subsidies and household incidence. No zero substitution. Unknown natural-language questions still show D in this curated prototype; this is not a deployed semantic engine.
