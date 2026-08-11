# PHI OS — WPR-E / WPR-W21 Personal Runtime Surface

Baseline: `9cd28c6ad24ebffeeb553cfe65fb572ef562d3ed`

WPR-W21 creates a limited-production Personal Runtime setup surface at `/personal-runtime`. It projects the MPA birth-initialization contract and current Method activation state, but performs no Method execution.

## Authority

- MPA owns Method registration, readiness, production eligibility and execution gates.
- RDG owns birth-data sensitivity, consent, purpose, retention and access.
- WPR owns web projection only.
- WPR-W21 does not create a canonical consent record or canonical Method input.

## Current production fact

At this baseline, zero Methods are production eligible for public execution. NUM is method-specific ready for the MPA-W26 eligibility decision, while production execution remains blocked until MPA-W27.

## Surface behavior

Birth fields are held only in the live DOM for readiness validation. The W21 controller does not submit them to a server and does not use localStorage or sessionStorage. Unknown time, timezone and coordinates remain unknown; no synthetic defaults are created.

## Vocabulary

`wpr-public-vocabulary-registry-v1.json` is preserved as historical authority. WPR-W21 introduces a v2 successor because MPA method-registry-v2 now registers NUMEROLOGY. The v2 label does not grant Method production or public eligibility.
